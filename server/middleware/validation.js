const { body, param, query, validationResult } = require('express-validator');
const { logEvents } = require('./logger');
const { FIELD_LIMITS } = require('../config/fieldLimits');

const POST_LIMITS = FIELD_LIMITS.post;

// Custom validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      // A rule written against the whole body (the post create/update sets,
      // which have to reach inside the FormData `postData` JSON) reports an
      // empty path - name it rather than sending `undefined` to the client.
      field: error.path || error.param || 'body',
      message: error.msg,
      value: error.value
    }));

    logEvents(
      `Validation Error: ${JSON.stringify(errorMessages)}\t${req.method}\t${req.url}\t${req.headers.origin}`,
      'errLog.log'
    );
    
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation Error',
        // Which field was refused and why. Additive - the shape above is
        // unchanged - but without it a rejected 3000-character description
        // reaches the author as an unexplained "Validation Error", which is
        // barely better than the silent truncation this replaced.
        fields: errorMessages.map(({ field, message }) => ({ field, message })),
        code: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString()
      }
    });
  }
  
  next();
};

/**
 * Trims leading/trailing whitespace off every string in the request.
 *
 * That is deliberately all it does. It used to also cut every string at 1000
 * characters and strip `<`, `>`, `javascript:` and `on...=` out of them, which
 * was the wrong layer twice over:
 *
 *   - Length is a schema question. Truncating here meant a 3000-character post
 *     description was accepted with a 201 and stored at 1000, with nothing
 *     shown to the author - silent data loss. It is now a `maxlength` on the
 *     model plus the matching express-validator rules below, so an over-long
 *     submission gets a 400 that names the field.
 *   - Escaping is an output question, and depends entirely on where the value
 *     is being written to. Stripping `<` on the way in mangled legitimate text
 *     ("price < 100") everywhere in order to protect one template, and only
 *     ever did so for values that reached this middleware in the first place:
 *     mounted globally in server.js it runs ahead of express.json(), so
 *     `req.body` is not even parsed yet and only the query string was ever
 *     touched. routes/ogRoutes.js escapes its own JSON-LD now, React and the
 *     RN clients escape their own output, and the templates in ogRoutes.js
 *     already ran everything else through `escapeHtml`.
 *
 * Trimming survives because it is neither: it is the same normalization the
 * `trim: true` on the models does, applied early enough that a "  " -only
 * field reads as empty to the required-field checks.
 */
const sanitizeInput = (req, res, next) => {
  const trimStrings = (value) => {
    if (typeof value === 'string') return value.trim();
    if (Array.isArray(value)) return value.map(trimStrings);
    if (value && typeof value === 'object') {
      const trimmed = {};
      for (const [key, entry] of Object.entries(value)) {
        trimmed[key] = trimStrings(entry);
      }
      return trimmed;
    }
    return value;
  };

  if (req.body) req.body = trimStrings(req.body);
  if (req.query) req.query = trimStrings(req.query);
  if (req.params) req.params = trimStrings(req.params);

  next();
};

// Common validation rules
const commonValidations = {
  // ObjectId validation for URL parameters
  objectId: (field) => param(field).isMongoId().withMessage('Invalid ID format'),
  
  // ObjectId validation for request body
  bodyObjectId: (field) => {
    return body(field)
      .isMongoId()
      .withMessage('Invalid ID format');
  },
  
  // Email validation
  email: (field) => body(field)
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email format')
    .isLength({ max: 254 })
    .withMessage('Email too long'),
  
  // Phone validation (international format)
  phone: (field) => body(field)
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Invalid phone number format')
    .isLength({ min: 7, max: 15 })
    .withMessage('Phone number must be 7-15 digits'),
  
  // Username validation
  username: (field) => body(field)
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 characters')
    .matches(/^[a-zA-Z0-9._-]+$/)
    .withMessage('Username can only contain letters, numbers, dots, underscores, and hyphens'),
  
  // Password validation
  password: (field) => body(field)
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be 8-128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  // Text content validation.
  //
  // Length only. It used to also reject any value containing `<` or `>`, which
  // was invisible while sanitizeInput was stripping those characters before
  // this rule ever saw them - and with the stripping gone it would start
  // refusing ordinary text ("saw it at 8 < the clock tower", "a > b") with a
  // generic "cannot contain HTML tags". Comment text is rendered by React and
  // React Native, both of which escape it, so the markup question is answered
  // where the value is written out, not by refusing the character here.
  textContent: (field, maxLength = 1000) => body(field)
    .isLength({ max: maxLength })
    .withMessage(`Content must be less than ${maxLength} characters`),
  
  // URL validation
  url: (field) => body(field)
    .isURL({ protocols: ['http', 'https'] })
    .withMessage('Invalid URL format'),
  
  // Free-text search term - bounded, see config/fieldLimits.js.
  searchQuery: () => query('search')
    .optional()
    .isLength({ max: FIELD_LIMITS.query.search })
    .withMessage(`Search must be less than ${FIELD_LIMITS.query.search} characters`),

  // Pagination validation
  pagination: () => [
    query('page').optional().isInt({ min: 0 }).withMessage('Page must be a non-negative integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ]
};

/**
 * Reads the post payload out of a create/update request.
 *
 * Both routes accept multipart FormData carrying the whole listing as a JSON
 * string in a `postData` field, so an ordinary `body('description')` rule sees
 * nothing at all on them - the fields are inside a string. Everything that
 * validates a post therefore goes through this.
 */
const readPostPayload = (req) => {
  if (req.body && req.body.postData) {
    return JSON.parse(req.body.postData);
  }
  return req.body || {};
};

/**
 * Length rules for a post's free-text fields, shared by create and update.
 *
 * The mongoose `maxlength` validators in models/Post.js are the real backstop;
 * these exist so an over-long field comes back as a 400 naming the field
 * instead of a mongoose ValidationError surfacing as a 500. `required` is not
 * checked here - create and update each have their own idea of which fields
 * must be present.
 */
const assertPostTextLengths = (postData) => {
  const check = (field, value, max, label) => {
    if (value === undefined || value === null) return;
    if (typeof value !== 'string') {
      throw new Error(`${label} must be text`);
    }
    if (value.length > max) {
      throw new Error(`${label} must be less than ${max} characters`);
    }
  };

  check('contact', postData.contact, POST_LIMITS.contact, 'Contact');
  check('exactLocation', postData.exactLocation, POST_LIMITS.exactLocation, 'Location');
  check('description', postData.description, POST_LIMITS.description, 'Description');
  check('mainDate', postData.mainDate, POST_LIMITS.mainDate, 'Date');

  if (Array.isArray(postData.tags)) {
    for (const tag of postData.tags) {
      check('tags', tag, POST_LIMITS.tag, 'Tag');
    }
  }
};

// Specific validation sets for different endpoints
const validationSets = {
  // User login
  userLogin: [
    body('emailOrPhone')
      .notEmpty()
      .withMessage('Email or phone is required')
      .isLength({ min: 3, max: 100 })
      .withMessage('Email or phone must be 3-100 characters'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 1, max: 128 })
      .withMessage('Password must be 1-128 characters')
  ],

  // User registration
  userRegistration: [
    body('username')
      .custom((value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        
        if (!emailRegex.test(value) && !phoneRegex.test(value)) {
          throw new Error('Username must be a valid email or phone number');
        }
        return true;
      }),
    commonValidations.password('password'),
    body('country').isMongoId().withMessage('Invalid country ID')
  ],
  
  // Post creation - handle both new postData format and legacy individual fields
  postCreation: [
    // Custom validation to handle postData JSON format
    body().custom((value, { req }) => {
      let postData;

      // Handles both the FormData `postData` JSON field and the legacy shape
      // where the fields sit directly on the body.
      try {
        postData = readPostPayload(req);
      } catch (error) {
        throw new Error('Invalid postData JSON format');
      }

      if (!postData.user) {
        throw new Error('User ID is required');
      }
      if (!postData.country) {
        throw new Error('Country ID is required');
      }

      // Validate categories - support both new array format and legacy single category
      let categories = postData.categories;
      if (!categories || !Array.isArray(categories) || categories.length === 0) {
        // Fallback to legacy category field for backward compatibility
        if (postData.category) {
          categories = [postData.category];
          postData.categories = categories; // Normalize to array format
        } else {
          throw new Error('At least one category is required');
        }
      }

      // Ensure categories is an array with at least one item
      if (!Array.isArray(categories) || categories.length === 0) {
        throw new Error('At least one category is required');
      }

      // Validate maximum categories (reasonable limit)
      if (categories.length > 10) {
        throw new Error('Maximum 10 categories allowed');
      }

      if (!postData.foundLost) {
        throw new Error('Found/Lost ID is required');
      }
      if (!postData.contact) {
        throw new Error('Contact is required');
      }
      if (!postData.exactLocation) {
        throw new Error('Exact location is required');
      }
      // exactDate is now optional - removed validation

      // Validate field formats
      if (!postData.user.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid user ID format');
      }
      if (!postData.country.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid country ID format');
      }
      
      // Validate all category IDs in the array
      for (let i = 0; i < categories.length; i++) {
        const categoryId = categories[i];
        if (!categoryId || typeof categoryId !== 'string' || !categoryId.match(/^[0-9a-fA-F]{24}$/)) {
          throw new Error(`Invalid category ID format at index ${i}`);
        }
      }
      
      // Remove duplicates from categories array
      postData.categories = [...new Set(categories)];
      
      if (!postData.foundLost.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid found/lost ID format');
      }
      // City validation is flexible - can be ObjectId, API city code, or custom city name
      if (postData.city && typeof postData.city !== 'string') {
        throw new Error('City must be a string');
      }
      if (postData.contact.length < 1) {
        throw new Error('Contact is required');
      }
      if (postData.exactLocation.length < 1) {
        throw new Error('Location is required');
      }
      // Upper bounds are shared with the update route and with the model.
      assertPostTextLengths(postData);
      
      // The controller will handle date parsing
      
      // Store parsed data for controller to use
      req.parsedPostData = postData;
      return true;
    })
  ],
  
  // Post update - PATCH /posts
  //
  // The route only validated the post id, so every free-text field on an edit
  // was unbounded: the only thing that had ever kept an edited description
  // within a sane length was the global truncation middleware, and that
  // truncation was itself the bug. Fields are all optional here (an edit sends
  // whatever changed); the rules are the same upper bounds create uses.
  postUpdate: [
    body().custom((value, { req }) => {
      let postData;
      try {
        postData = readPostPayload(req);
      } catch (error) {
        throw new Error('Invalid postData JSON format');
      }

      assertPostTextLengths(postData);
      return true;
    })
  ],

  // A comment written on a listing
  commentCreation: [
    body('text')
      .isString()
      .withMessage('Comment text is required')
      .bail()
      .trim()
      .notEmpty()
      .withMessage('Comment text is required')
      .isLength({ max: FIELD_LIMITS.comment.text })
      .withMessage(`Comment must be less than ${FIELD_LIMITS.comment.text} characters`)
  ],

  // Reporting a comment for moderation
  commentReport: [
    body('reasonType').optional().isIn([
      'inappropriate_content',
      'spam_fake',
      'duplicate',
      'wrong_category',
      'suspicious_activity',
      'personal_info',
      'other'
    ]).withMessage('Invalid report reason'),
    body('reason')
      .optional()
      .isLength({ max: FIELD_LIMITS.report.reason })
      .withMessage(`Reason must be less than ${FIELD_LIMITS.report.reason} characters`)
  ],

  // Report submission
  reportSubmission: [
    body('postId').isMongoId().withMessage('Invalid post ID'),
    body('reason').isIn([
      'inappropriate_content',
      'spam_fake', 
      'duplicate',
      'wrong_category',
      'suspicious_activity',
      'personal_info',
      'other'
    ]).withMessage('Invalid report reason'),
    body('description')
      .optional()
      .isLength({ max: FIELD_LIMITS.report.reason })
      .withMessage(`Description must be less than ${FIELD_LIMITS.report.reason} characters`)
  ],
  
  // Admin operations
  adminOperations: [
    body('action').isIn(['approve', 'reject', 'delete', 'feature']).withMessage('Invalid admin action'),
    body('reason')
      .optional()
      .isLength({ max: FIELD_LIMITS.report.reason })
      .withMessage(`Reason must be less than ${FIELD_LIMITS.report.reason} characters`)
  ]
};

module.exports = {
  validateRequest,
  sanitizeInput,
  commonValidations,
  validationSets
};
