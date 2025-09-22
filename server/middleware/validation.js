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
    
    logEvents(
      `Validation Error: ${JSON.stringify(errorMessages)}\t${req.method}\t${req.url}\t${req.headers.origin}`,
      'errLog.log'
    );
    
    return res.status(400).json({
      message: 'Validation failed',
      errors: errorMessages,
      isError: true
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
  // ObjectId validation
  objectId: (field) => param(field).isMongoId().withMessage('Invalid ID format'),
  
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
  // User registration/login
  userAuth: [
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
  
  // Post creation
  postCreation: [
    body('user').isMongoId().withMessage('Invalid user ID'),
    body('country').isMongoId().withMessage('Invalid country ID'),
    body('category').isMongoId().withMessage('Invalid category ID'),
    body('foundLost').isMongoId().withMessage('Invalid found/lost ID'),
    body('city').optional().isMongoId().withMessage('Invalid city ID'),
    body('contact').isLength({ min: 1, max: 100 }).withMessage('Contact must be 1-100 characters'),
    body('exactLocation').isLength({ min: 1, max: 200 }).withMessage('Location must be 1-200 characters'),
    body('exactDate').isISO8601().withMessage('Invalid date format'),
    body('description').optional().isLength({ max: 2000 }).withMessage('Description must be less than 2000 characters'),
    body('contactPreferences').optional().isArray().withMessage('Contact preferences must be an array')
  ],
  
  // Report submission
  reportSubmission: [
    body('postId').isMongoId().withMessage('Invalid post ID'),
    body('reason').isIn(['spam', 'inappropriate', 'fake', 'duplicate', 'other']).withMessage('Invalid report reason'),
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
