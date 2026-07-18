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

// Key by authenticated user id (attached by verifyJWT as req.user), falling back to
// IP only if it's somehow absent. IP-only keying under-throttles nothing but instead
// over-throttles: this platform's users are largely in North Africa where carrier
// CGNAT and shared cybercafe/campus IPs are the norm, so one IP can legitimately
// represent many distinct users.
const userOrIpKeyGenerator = (req) => (req.user ? `user:${req.user}` : `ip:${req.ip}`);

// Custom handler for the post-creation limiters: reports a precise retryAfter (seconds
// until *this key's* window resets) instead of createRateLimiter's default, which just
// echoes the full windowMs regardless of how much of the window has already elapsed.
const postLimitHandler = (req, res, next, options) => {
  logEvents(
    `Rate Limit Exceeded: ${options.message}\t${req.method}\t${req.url}\t${userOrIpKeyGenerator(req)}\t${req.headers.origin}`,
    "errLog.log"
  );

  const resetTime = req.rateLimit?.resetTime
    ? new Date(req.rateLimit.resetTime).getTime()
    : Date.now() + options.windowMs;
  const retryAfter = Math.max(1, Math.ceil((resetTime - Date.now()) / 1000));

  // Fold the retry estimate into the message itself - the client only surfaces
  // `.message` today, so a retryAfter field nobody reads wouldn't help the user.
  const retryMinutes = Math.ceil(retryAfter / 60);
  const humanRetry = retryAfter < 60
    ? `${retryAfter} second${retryAfter === 1 ? '' : 's'}`
    : `${retryMinutes} minute${retryMinutes === 1 ? '' : 's'}`;

  // Keep the standard headers in sync with the precise retry hint
  res.setHeader('Retry-After', retryAfter);
  res.status(options.statusCode).json({
    message: `${options.message} You can try again in about ${humanRetry}.`,
    retryAfter,
    isError: true
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

  // Post creation limiter - applies to every POST /posts request (with or
  // without an image), keyed per-user so it isn't shared across everyone
  // behind the same carrier/cafe IP.
  createPost: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 posts per hour per user
    keyGenerator: userOrIpKeyGenerator,
    handler: postLimitHandler,
    message: "You've reached the limit of 20 posts per hour."
  }),

  // Stricter image-upload limiter - only meant to be invoked conditionally,
  // after multer has parsed the body and an image is confirmed present.
  imageUpload: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 image uploads per hour per user
    keyGenerator: userOrIpKeyGenerator,
    handler: postLimitHandler,
    message: "You've reached the limit of 10 image uploads per hour. You can still post without an image."
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

  // Rate limiter for logout requests
  logout: createRateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 20, // 20 logout attempts per 5 minutes
    message: "Too many logout attempts, please try again in 5 minutes"
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
