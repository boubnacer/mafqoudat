/**
 * Server-side Authentication Error Handler Middleware
 * 
 * This middleware provides centralized error handling for authentication-related
 * operations on the server side, including proper error categorization,
 * logging, and user-friendly error responses.
 */

const { logEvents } = require('./logger');

// Authentication error types
const AUTH_ERROR_TYPES = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  TOKEN_MALFORMED: 'TOKEN_MALFORMED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  ACCOUNT_NOT_FOUND: 'ACCOUNT_NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVER_ERROR: 'SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR'
};

// Error response templates
const ERROR_RESPONSES = {
  [AUTH_ERROR_TYPES.INVALID_CREDENTIALS]: {
    status: 401,
    message: 'Invalid credentials',
    code: 'INVALID_CREDENTIALS',
    userMessage: 'The email/phone or password you entered is incorrect.'
  },
  [AUTH_ERROR_TYPES.TOKEN_EXPIRED]: {
    status: 401,
    message: 'Token expired',
    code: 'TOKEN_EXPIRED',
    userMessage: 'Your session has expired. Please log in again.'
  },
  [AUTH_ERROR_TYPES.TOKEN_INVALID]: {
    status: 401,
    message: 'Invalid token',
    code: 'TOKEN_INVALID',
    userMessage: 'Invalid session. Please log in again.'
  },
  [AUTH_ERROR_TYPES.TOKEN_MALFORMED]: {
    status: 401,
    message: 'Malformed token',
    code: 'TOKEN_MALFORMED',
    userMessage: 'Invalid session format. Please log in again.'
  },
  [AUTH_ERROR_TYPES.ACCOUNT_LOCKED]: {
    status: 423,
    message: 'Account locked',
    code: 'ACCOUNT_LOCKED',
    userMessage: 'Your account has been temporarily locked. Please contact support.'
  },
  [AUTH_ERROR_TYPES.ACCOUNT_NOT_FOUND]: {
    status: 404,
    message: 'Account not found',
    code: 'ACCOUNT_NOT_FOUND',
    userMessage: 'No account found with the provided credentials.'
  },
  [AUTH_ERROR_TYPES.VALIDATION_ERROR]: {
    status: 400,
    message: 'Validation error',
    code: 'VALIDATION_ERROR',
    userMessage: 'Please check your input and try again.'
  },
  [AUTH_ERROR_TYPES.RATE_LIMITED]: {
    status: 429,
    message: 'Too many requests',
    code: 'RATE_LIMITED',
    userMessage: 'Too many login attempts. Please wait before trying again.'
  },
  [AUTH_ERROR_TYPES.SERVER_ERROR]: {
    status: 500,
    message: 'Internal server error',
    code: 'SERVER_ERROR',
    userMessage: 'Something went wrong. Please try again later.'
  },
  [AUTH_ERROR_TYPES.DATABASE_ERROR]: {
    status: 503,
    message: 'Database error',
    code: 'DATABASE_ERROR',
    userMessage: 'Database temporarily unavailable. Please try again later.'
  },
  [AUTH_ERROR_TYPES.NETWORK_ERROR]: {
    status: 503,
    message: 'Network error',
    code: 'NETWORK_ERROR',
    userMessage: 'Network error. Please check your connection and try again.'
  }
};

/**
 * Authentication Error Handler Class
 */
class AuthErrorHandler {
  constructor() {
    this.errorCounts = new Map(); // Track error frequencies for rate limiting
  }

  /**
   * Categorize error based on error type and details
   * @param {Error} error - Error object
   * @param {Object} context - Additional context
   * @returns {string} Error type category
   */
  categorizeError(error, context = {}) {
    // JWT-specific errors
    if (error.name === 'JsonWebTokenError') {
      return AUTH_ERROR_TYPES.TOKEN_INVALID;
    }
    
    if (error.name === 'TokenExpiredError') {
      return AUTH_ERROR_TYPES.TOKEN_EXPIRED;
    }

    if (error.name === 'NotBeforeError') {
      return AUTH_ERROR_TYPES.TOKEN_INVALID;
    }

    // MongoDB errors
    if (error.name === 'MongoError') {
      if (error.code === 11000) {
        return AUTH_ERROR_TYPES.VALIDATION_ERROR;
      }
      return AUTH_ERROR_TYPES.DATABASE_ERROR;
    }

    if (error.name === 'MongoNetworkError' || error.name === 'MongoTimeoutError') {
      return AUTH_ERROR_TYPES.DATABASE_ERROR;
    }

    // Validation errors
    if (error.name === 'ValidationError') {
      return AUTH_ERROR_TYPES.VALIDATION_ERROR;
    }

    // Custom error codes
    if (error.code) {
      switch (error.code) {
        case 'INVALID_CREDENTIALS':
          return AUTH_ERROR_TYPES.INVALID_CREDENTIALS;
        case 'ACCOUNT_LOCKED':
          return AUTH_ERROR_TYPES.ACCOUNT_LOCKED;
        case 'ACCOUNT_NOT_FOUND':
          return AUTH_ERROR_TYPES.ACCOUNT_NOT_FOUND;
        case 'RATE_LIMITED':
          return AUTH_ERROR_TYPES.RATE_LIMITED;
        default:
          break;
      }
    }

    // Network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return AUTH_ERROR_TYPES.NETWORK_ERROR;
    }

    // Check error message for common patterns
    const message = error.message.toLowerCase();
    if (message.includes('credentials') || message.includes('password')) {
      return AUTH_ERROR_TYPES.INVALID_CREDENTIALS;
    }
    
    if (message.includes('locked') || message.includes('blocked')) {
      return AUTH_ERROR_TYPES.ACCOUNT_LOCKED;
    }
    
    if (message.includes('not found') || message.includes('does not exist')) {
      return AUTH_ERROR_TYPES.ACCOUNT_NOT_FOUND;
    }

    return AUTH_ERROR_TYPES.SERVER_ERROR;
  }

  /**
   * Log authentication error with context
   * @param {Error} error - Error object
   * @param {Object} context - Request context
   * @param {string} errorType - Categorized error type
   */
  logAuthError(error, context, errorType) {
    const logData = {
      errorType,
      errorMessage: error.message,
      stack: error.stack,
      endpoint: context.endpoint || context.url,
      method: context.method,
      ip: context.ip || context.connection?.remoteAddress,
      userAgent: context.userAgent || context.headers?.['user-agent'],
      userId: context.userId,
      timestamp: new Date().toISOString()
    };

    // Log to error log file
    logEvents(
      `AUTH_ERROR [${errorType}]: ${error.message}\t${context.method}\t${context.endpoint}\t${context.ip}`,
      'errLog.log'
    );

    // Log to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.error('🔐 Auth Error:', logData);
    }

    // Track error frequency for rate limiting detection
    this.trackErrorFrequency(errorType, context.ip);
  }

  /**
   * Track error frequency for rate limiting detection
   * @param {string} errorType - Error type
   * @param {string} ip - Client IP address
   */
  trackErrorFrequency(errorType, ip) {
    const key = `${errorType}:${ip}`;
    const count = this.errorCounts.get(key) || 0;
    this.errorCounts.set(key, count + 1);

    // Clean up old entries (older than 1 hour)
    setTimeout(() => {
      this.errorCounts.delete(key);
    }, 3600000); // 1 hour

    // Log warning if too many errors from same IP
    if (count > 10) {
      logEvents(
        `SUSPICIOUS_ACTIVITY: ${count} ${errorType} errors from IP ${ip}`,
        'errLog.log'
      );
    }
  }

  /**
   * Create standardized error response
   * @param {string} errorType - Categorized error type
   * @param {Error} originalError - Original error object
   * @param {Object} context - Request context
   * @returns {Object} Error response object
   */
  createErrorResponse(errorType, originalError, context = {}) {
    const errorTemplate = ERROR_RESPONSES[errorType] || ERROR_RESPONSES[AUTH_ERROR_TYPES.SERVER_ERROR];
    
    const response = {
      success: false,
      error: {
        message: errorTemplate.message,
        code: errorTemplate.code,
        userMessage: errorTemplate.userMessage,
        timestamp: new Date().toISOString()
      }
    };

    // Add additional details in development
    if (process.env.NODE_ENV !== 'production') {
      response.error.details = {
        originalMessage: originalError.message,
        stack: originalError.stack,
        endpoint: context.endpoint,
        method: context.method
      };
    }

    // Add retry information for certain errors
    if (errorType === AUTH_ERROR_TYPES.RATE_LIMITED) {
      response.error.retryAfter = 60; // seconds
    }

    if (errorType === AUTH_ERROR_TYPES.DATABASE_ERROR || errorType === AUTH_ERROR_TYPES.NETWORK_ERROR) {
      response.error.retryAfter = 30;
    }

    return {
      status: errorTemplate.status,
      body: response
    };
  }

  /**
   * Handle authentication error
   * @param {Error} error - Error object
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  handleAuthError(error, req, res, next) {
    const context = {
      endpoint: req.originalUrl,
      method: req.method,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      userId: req.user || null,
      headers: req.headers
    };

    const errorType = this.categorizeError(error, context);
    this.logAuthError(error, context, errorType);
    
    const errorResponse = this.createErrorResponse(errorType, error, context);
    
    res.status(errorResponse.status).json(errorResponse.body);
  }
}

// Create singleton instance
const authErrorHandler = new AuthErrorHandler();

/**
 * Middleware function for handling authentication errors
 */
const authErrorMiddleware = (error, req, res, next) => {
  // Only handle authentication-related errors
  if (isAuthError(error, req)) {
    return authErrorHandler.handleAuthError(error, req, res, next);
  }
  
  // Pass non-auth errors to next error handler
  next(error);
};

/**
 * Check if error is authentication-related
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @returns {boolean} Whether error is auth-related
 */
const isAuthError = (error, req) => {
  const authEndpoints = ['/auth', '/login', '/logout', '/register', '/signup', '/refresh'];
  const isAuthEndpoint = authEndpoints.some(endpoint => 
    req.originalUrl.startsWith(endpoint)
  );

  // Check if it's an auth endpoint or JWT-related error
  return isAuthEndpoint || 
         error.name === 'JsonWebTokenError' ||
         error.name === 'TokenExpiredError' ||
         error.name === 'NotBeforeError' ||
         error.code === 'INVALID_CREDENTIALS' ||
         error.code === 'TOKEN_EXPIRED' ||
         error.code === 'TOKEN_INVALID';
};

/**
 * Create custom authentication errors
 */
const createAuthError = (type, message, details = {}) => {
  const error = new Error(message);
  error.code = type;
  error.details = details;
  error.isAuthError = true;
  return error;
};

/**
 * Async wrapper for authentication route handlers
 */
const asyncAuthHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      // Ensure error is properly categorized as auth error
      if (!error.isAuthError && isAuthError(error, req)) {
        error.isAuthError = true;
      }
      next(error);
    });
  };
};

/**
 * Rate limiting check for authentication endpoints
 */
const checkAuthRateLimit = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const endpoint = req.originalUrl;
  const key = `${ip}:${endpoint}`;
  
  const errorCount = authErrorHandler.errorCounts.get(key) || 0;
  
  if (errorCount > 5) { // Max 5 errors per endpoint per IP
    const rateLimitError = createAuthError(
      AUTH_ERROR_TYPES.RATE_LIMITED,
      'Too many failed authentication attempts'
    );
    return authErrorHandler.handleAuthError(rateLimitError, req, res, next);
  }
  
  next();
};

module.exports = {
  authErrorHandler,
  authErrorMiddleware,
  createAuthError,
  asyncAuthHandler,
  checkAuthRateLimit,
  AUTH_ERROR_TYPES,
  ERROR_RESPONSES
};
