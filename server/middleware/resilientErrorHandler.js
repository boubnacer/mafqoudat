/**
 * Resilient Error Handler Middleware
 * Enhanced error handling with monitoring, logging, and graceful degradation
 */

const errorMonitor = require('../utils/errorMonitor');
const resilienceManager = require('../utils/resilienceManager');

/**
 * Enhanced error handler middleware
 */
const resilientErrorHandler = (err, req, res, next) => {
  // Don't override if response has already been sent
  if (res.headersSent) {
    return next(err);
  }

  // Don't override auth errors that have been handled by auth middleware
  if (err.isAuthError || err.isHandled) {
    return next(err);
  }

  // Log error with context
  const errorContext = {
    endpoint: req.originalUrl,
    method: req.method,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    userId: req.user || null,
    body: req.method !== 'GET' ? req.body : undefined,
    query: req.query,
    params: req.params,
    headers: {
      'content-type': req.get('Content-Type'),
      'authorization': req.get('Authorization') ? '[REDACTED]' : undefined
    }
  };

  const loggedError = errorMonitor.logError(err, errorContext);

  // Determine response based on error type and environment
  const response = buildErrorResponse(err, loggedError, req);

  // Log error details (but not in production for security)
  if (process.env.NODE_ENV !== 'production') {
    console.error('🚨 Error Details:', {
      message: err.message,
      stack: err.stack,
      context: errorContext
    });
  }

  // Send response
  res.status(response.status).json(response.body);
};

/**
 * Build appropriate error response
 */
const buildErrorResponse = (err, loggedError, req) => {
  // Default error response
  let status = 500;
  let message = 'Internal Server Error';
  let details = null;

  // Handle specific error types
  switch (err.name) {
    case 'ValidationError':
      status = 400;
      message = 'Validation Error';
      details = err.errors ? Object.keys(err.errors).map(key => ({
        field: key,
        message: err.errors[key].message
      })) : err.message;
      break;

    case 'CastError':
      status = 400;
      message = 'Invalid ID format';
      break;

    case 'MongoError':
      if (err.code === 11000) {
        status = 409;
        message = 'Duplicate entry';
      } else {
        status = 500;
        message = 'Database error';
      }
      break;

    case 'MongoNetworkError':
    case 'MongoTimeoutError':
      status = 503;
      message = 'Database temporarily unavailable';
      break;

    case 'JsonWebTokenError':
      status = 401;
      message = 'Invalid token';
      break;

    case 'TokenExpiredError':
      status = 401;
      message = 'Token expired';
      break;

    case 'MulterError':
      status = 400;
      message = 'File upload error';
      break;

    default:
      // Check for HTTP status codes in error message
      const statusMatch = err.message.match(/^(\d{3}):/);
      if (statusMatch) {
        status = parseInt(statusMatch[1]);
        message = err.message.substring(statusMatch[0].length).trim();
      }
  }

  // Build response body
  const responseBody = {
    success: false,
    error: {
      message,
      code: err.code || loggedError.id,
      timestamp: new Date().toISOString()
    }
  };

  // Add details in development
  if (process.env.NODE_ENV !== 'production') {
    responseBody.error.details = details;
    responseBody.error.stack = err.stack;
    responseBody.error.context = {
      endpoint: req.originalUrl,
      method: req.method
    };
  }

  // Add retry information for certain errors
  if (status === 503 || err.name.includes('Network') || err.name.includes('Timeout')) {
    responseBody.error.retryAfter = 30; // seconds
    responseBody.error.suggestion = 'Please try again in a few moments';
  }

  return {
    status,
    body: responseBody
  };
};

/**
 * Async error wrapper for route handlers
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Database operation wrapper with resilience
 */
const withDatabaseResilience = (operation, fallbackOperation = null) => {
  return async (req, res, next) => {
    try {
      const result = await resilienceManager.executeWithRetry('database', async () => {
        return await operation(req, res, next);
      });

      if (result) {
        res.json(result);
      }
    } catch (error) {
      // Try fallback if available
      if (fallbackOperation) {
        try {
          console.log('🔄 Using fallback operation after database error');
          const fallbackResult = await fallbackOperation(req, res, next);
          if (fallbackResult) {
            res.json(fallbackResult);
            return;
          }
        } catch (fallbackError) {
          console.error('❌ Fallback operation also failed:', fallbackError.message);
          next(fallbackError);
          return;
        }
      }
      
      next(error);
    }
  };
};

/**
 * Rate limiting error handler
 */
const rateLimitErrorHandler = (req, res) => {
  errorMonitor.logError(new Error('Rate limit exceeded'), {
    endpoint: req.originalUrl,
    method: req.method,
    ip: req.ip,
    type: 'rate_limit'
  });

  res.status(429).json({
    success: false,
    error: {
      message: 'Too many requests',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: 60,
      timestamp: new Date().toISOString()
    }
  });
};

/**
 * 404 handler with logging
 */
const notFoundHandler = (req, res) => {
  errorMonitor.logError(new Error('Route not found'), {
    endpoint: req.originalUrl,
    method: req.method,
    ip: req.ip,
    type: 'not_found'
  });

  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      code: 'NOT_FOUND',
      timestamp: new Date().toISOString(),
      path: req.originalUrl
    }
  });
};

/**
 * Graceful shutdown handler
 */
const gracefulShutdownHandler = (server) => {
  return (signal) => {
    console.log(`${signal} received, shutting down gracefully`);
    
    server.close(() => {
      console.log('✅ HTTP server closed');
      
      // Close database connections
      const mongoose = require('mongoose');
      mongoose.connection.close(false, () => {
        console.log('✅ MongoDB connection closed');
        process.exit(0);
      });
    });

    // Force close after 30 seconds
    setTimeout(() => {
      console.error('❌ Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 30000);
  };
};

/**
 * Memory monitoring middleware
 */
const memoryMonitoring = (req, res, next) => {
  const memUsage = process.memoryUsage();
  const memUsageMB = {
    rss: Math.round(memUsage.rss / 1024 / 1024),
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
    external: Math.round(memUsage.external / 1024 / 1024)
  };

  // Log memory warning if heap usage is high
  if (memUsageMB.heapUsed > 500) { // 500MB threshold
    errorMonitor.logError(new Error('High memory usage detected'), {
      endpoint: req.originalUrl,
      method: req.method,
      type: 'memory_warning',
      memoryUsage: memUsageMB
    });
  }

  // Add memory info to response headers in development
  if (process.env.NODE_ENV !== 'production') {
    res.set('X-Memory-Usage', `${memUsageMB.heapUsed}MB`);
  }

  next();
};

/**
 * Request timeout middleware
 */
const requestTimeout = (timeout = 30000) => {
  return (req, res, next) => {
    const timer = setTimeout(() => {
      const error = new Error('Request timeout');
      error.code = 'REQUEST_TIMEOUT';
      error.status = 408;
      
      errorMonitor.logError(error, {
        endpoint: req.originalUrl,
        method: req.method,
        type: 'timeout',
        timeout: timeout
      });

      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          error: {
            message: 'Request timeout',
            code: 'REQUEST_TIMEOUT',
            timeout: timeout,
            timestamp: new Date().toISOString()
          }
        });
      }
    }, timeout);

    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));
    
    next();
  };
};

module.exports = {
  resilientErrorHandler,
  asyncHandler,
  withDatabaseResilience,
  rateLimitErrorHandler,
  notFoundHandler,
  gracefulShutdownHandler,
  memoryMonitoring,
  requestTimeout
};
