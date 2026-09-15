/**
 * Simple Authentication Error Handler Middleware
 * Provides consistent error responses for authentication endpoints
 */

const createAuthError = (code, message, details = {}) => {
  const error = new Error(message);
  error.code = code;
  error.details = details;
  error.isAuthError = true;
  return error;
};

const authErrorMiddleware = (err, req, res, next) => {
  // Only handle auth errors
  if (!err.isAuthError) {
    return next(err);
  }

  // Mark error as handled to prevent override by other error handlers
  err.isHandled = true;

  const statusCode = getStatusCode(err.code);
  const response = {
    success: false,
    error: {
      message: err.message,
      code: err.code,
      timestamp: new Date().toISOString()
    }
  };

  // Add details in development
  if (process.env.NODE_ENV === 'development' && err.details) {
    response.error.details = err.details;
  }

  res.status(statusCode).json(response);
};

const getStatusCode = (code) => {
  const statusCodes = {
    'VALIDATION_ERROR': 400,
    'INVALID_CREDENTIALS': 401,
    // A deactivated account is an authentication failure, not a server fault.
    // Without this entry the fallthrough below answers 500, and both clients
    // key their "this account can no longer sign in" handling off a 401
    // carrying this code - the same code /auth/refresh already answers with
    // (see controllers/authcontroller.js).
    'ACCOUNT_INACTIVE': 401,
    'OAUTH_USER': 400,
    'DATABASE_ERROR': 503,
    'SERVER_ERROR': 500,
    'RATE_LIMIT_EXCEEDED': 429
  };
  
  return statusCodes[code] || 500;
};

const asyncAuthHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

const checkAuthRateLimit = (req, res, next) => {
  const rateLimitInfo = {
    limit: req.rateLimit?.limit || 5,
    remaining: req.rateLimit?.remaining || 0,
    resetTime: req.rateLimit?.resetTime || new Date(Date.now() + 60000)
  };

  res.set({
    'X-RateLimit-Limit': rateLimitInfo.limit.toString(),
    'X-RateLimit-Remaining': rateLimitInfo.remaining.toString(),
    'X-RateLimit-Reset': rateLimitInfo.resetTime.toISOString()
  });

  next();
};

module.exports = {
  createAuthError,
  authErrorMiddleware,
  asyncAuthHandler,
  checkAuthRateLimit
};
