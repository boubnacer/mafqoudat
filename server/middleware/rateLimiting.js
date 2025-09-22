const rateLimit = require("express-rate-limit");
const { logEvents } = require("./logger");

// Create rate limiter with custom options
const createRateLimiter = (options) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // limit each IP to 100 requests per windowMs
    message = "Too many requests from this IP, please try again later",
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = (req) => req.ip,
    handler = (req, res, next, options) => {
      logEvents(
        `Rate Limit Exceeded: ${options.message}\t${req.method}\t${req.url}\t${req.ip}\t${req.headers.origin}`,
        "errLog.log"
      );
      res.status(options.statusCode).json({
        message: options.message,
        retryAfter: Math.round(options.windowMs / 1000),
        isError: true
      });
    }
  } = options;

  return rateLimit({
    windowMs,
    max,
    message,
    skipSuccessfulRequests,
    skipFailedRequests,
    keyGenerator,
    handler,
    standardHeaders: true,
    legacyHeaders: false,
    // Trust proxy for accurate IP detection
    trustProxy: true
  });
};

// Specific rate limiters for different endpoints
const rateLimiters = {
  // Strict rate limiter for authentication
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes
    message: "Too many authentication attempts, please try again in 15 minutes",
    skipSuccessfulRequests: true
  }),

  // Moderate rate limiter for general API usage
  general: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    message: "Too many requests, please slow down"
  }),

  // Strict rate limiter for file uploads
  upload: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 uploads per hour
    message: "Too many file uploads, please try again in an hour"
  }),

  // Very strict rate limiter for sensitive operations
  sensitive: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per hour
    message: "Too many sensitive operations, please try again in an hour"
  }),

  // Rate limiter for search operations
  search: createRateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // 30 searches per minute
    message: "Too many search requests, please slow down"
  }),

  // Rate limiter for report submissions
  report: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 reports per hour
    message: "Too many report submissions, please try again in an hour"
  }),

  // Rate limiter for user registration
  registration: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 registrations per hour per IP
    message: "Too many registration attempts, please try again in an hour"
  }),

  // Rate limiter for password reset requests
  passwordReset: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 password reset attempts per hour
    message: "Too many password reset attempts, please try again in an hour"
  }),

  // Rate limiter for admin operations
  admin: createRateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 50, // 50 admin operations per 5 minutes
    message: "Too many admin operations, please slow down"
  }),

  // Rate limiter for public endpoints (more lenient)
  public: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // 200 requests per 15 minutes
    message: "Too many requests to public endpoints, please slow down"
  })
};

// Dynamic rate limiter based on user role
const dynamicRateLimiter = (req, res, next) => {
  // Get user role from JWT token if available
  const userRole = req.user?.role || 'anonymous';
  
  let limiter;
  switch (userRole) {
    case 'admin':
      limiter = rateLimiters.admin;
      break;
    case 'user':
      limiter = rateLimiters.general;
      break;
    default:
      limiter = rateLimiters.public;
  }
  
  limiter(req, res, next);
};

// Rate limiter for specific user actions
const userActionRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 actions per minute
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user?.id || req.ip;
  },
  message: "Too many actions, please slow down"
});

// Export rate limiters
module.exports = {
  ...rateLimiters,
  dynamicRateLimiter,
  userActionRateLimiter,
  createRateLimiter
};
