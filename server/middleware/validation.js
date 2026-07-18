const { body, param, query, validationResult } = require('express-validator');
const { logEvents } = require('./logger');

// Custom validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));

    if (process.env.NODE_ENV !== 'production') {
      console.log('🔍 VALIDATION ERROR - Request:', req.method, req.url);
      console.log('🔍 VALIDATION ERROR - Fields:', errorMessages.map(e => ({ field: e.field, message: e.message })));
    }

    logEvents(
      `Validation Error: ${JSON.stringify(errorMessages)}\t${req.method}\t${req.url}\t${req.headers.origin}`,
      'errLog.log'
    );
    
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation Error',
        code: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString()
      }
    });
  }
  
  next();
};

// Sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Sanitize string inputs
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .substring(0, 1000); // Limit length
  };

  // Recursively sanitize object
  const sanitizeObject = (obj) => {
    if (obj === null || obj === undefined) return obj;
    
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    if (typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    
    return obj;
  };

  // Sanitize request body, query, and params
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);

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
  
  // Text content validation
  textContent: (field, maxLength = 1000) => body(field)
    .isLength({ max: maxLength })
    .withMessage(`Content must be less than ${maxLength} characters`)
    .matches(/^[^<>]*$/)
    .withMessage('Content cannot contain HTML tags'),
  
  // URL validation
  url: (field) => body(field)
    .isURL({ protocols: ['http', 'https'] })
    .withMessage('Invalid URL format'),
  
  // Pagination validation
  pagination: () => [
    query('page').optional().isInt({ min: 0 }).withMessage('Page must be a non-negative integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ]
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

      // Check if data comes as postData JSON field (new format)
      if (req.body.postData) {
        try {
          postData = JSON.parse(req.body.postData);
        } catch (error) {
          throw new Error('Invalid postData JSON format');
        }
      } else {
        // Legacy format - use individual fields
        postData = req.body;
      }

      if (process.env.NODE_ENV !== 'production') {
        // Log field presence/length only - never the raw contact, exactLocation,
        // description, or user id values.
        console.log('🔍 Validation middleware - post creation payload shape:', {
          hasUser: !!postData.user,
          hasCountry: !!postData.country,
          categoriesCount: Array.isArray(postData.categories)
            ? postData.categories.length
            : (postData.category ? 1 : 0),
          hasFoundLost: !!postData.foundLost,
          contactLength: postData.contact ? String(postData.contact).length : 0,
          exactLocationLength: postData.exactLocation ? String(postData.exactLocation).length : 0,
          descriptionLength: postData.description ? String(postData.description).length : 0,
          hasExactDate: !!postData.exactDate
        });
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
      if (postData.contact.length < 1 || postData.contact.length > 100) {
        throw new Error('Contact must be 1-100 characters');
      }
      if (postData.exactLocation.length < 1 || postData.exactLocation.length > 200) {
        throw new Error('Location must be 1-200 characters');
      }
      if (postData.description && postData.description.length > 2000) {
        throw new Error('Description must be less than 2000 characters');
      }
      
      // The controller will handle date parsing
      
      // Store parsed data for controller to use
      req.parsedPostData = postData;
      return true;
    })
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
    body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters')
  ],
  
  // Admin operations
  adminOperations: [
    body('action').isIn(['approve', 'reject', 'delete', 'feature']).withMessage('Invalid admin action'),
    body('reason').optional().isLength({ max: 500 }).withMessage('Reason must be less than 500 characters')
  ]
};

module.exports = {
  validateRequest,
  sanitizeInput,
  commonValidations,
  validationSets
};
