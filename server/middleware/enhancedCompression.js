const compression = require('compression');
const zlib = require('zlib');

/**
 * Enhanced Compression Middleware
 * 
 * Features:
 * - Smart compression based on content type and size
 * - Configurable compression levels for different content types
 * - Response size tracking and optimization recommendations
 * - Integration with response optimization middleware
 */

// Enhanced compression configuration
const compressionConfig = {
  // Different compression levels for different content types
  levels: {
    'application/json': 6,      // Balanced compression for JSON
    'text/html': 9,            // Maximum compression for HTML
    'text/css': 9,             // Maximum compression for CSS
    'application/javascript': 6, // Balanced compression for JS
    'text/plain': 9,           // Maximum compression for plain text
    'default': 6               // Default compression level
  },
  
  // Size thresholds for compression
  thresholds: {
    minSize: 1024,             // Minimum size to compress (1KB)
    maxSize: 10 * 1024 * 1024, // Maximum size to compress (10MB)
    warningSize: 1024 * 1024   // Size threshold for warnings (1MB)
  },
  
  // Content types that should always be compressed
  alwaysCompress: [
    'application/json',
    'text/html',
    'text/css',
    'application/javascript',
    'text/plain'
  ],
  
  // Content types that should never be compressed
  neverCompress: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'video/mp4',
    'video/webm',
    'audio/mpeg',
    'audio/wav',
    'application/pdf',
    'application/zip',
    'application/gzip'
  ]
};

/**
 * Smart compression middleware that adapts based on content
 */
const smartCompression = (options = {}) => {
  const config = { ...compressionConfig, ...options };
  
  return (req, res, next) => {
    // Track original response methods
    const originalJson = res.json;
    const originalSend = res.send;
    const originalEnd = res.end;
    
    // Get content type
    const contentType = res.get('Content-Type') || 'application/json';
    
    // Determine if content should be compressed
    const shouldCompress = shouldCompressContent(contentType, config);
    
    if (shouldCompress) {
      // Set compression level based on content type
      const level = config.levels[contentType] || config.levels.default;
      
      // Create compression filter
      const filter = (req, res) => {
        // Skip compression for certain conditions
        if (res.get('Content-Encoding')) {
          return false; // Already compressed
        }
        
        // Skip compression for very small responses
        const contentLength = res.get('Content-Length');
        if (contentLength && parseInt(contentLength) < config.thresholds.minSize) {
          return false;
        }
        
        return true;
      };
      
      // Apply compression middleware
      const compressionMiddleware = compression({
        level: level,
        filter: filter,
        threshold: config.thresholds.minSize
      });
      
      // Override response methods to track compression
      res.json = function(data) {
        const startTime = Date.now();
        const originalSize = JSON.stringify(data).length;
        
        res.set('X-Original-Size', originalSize.toString());
        res.set('X-Compression-Level', level.toString());
        
        const result = originalJson.call(this, data);
        
        // Add compression timing
        res.on('finish', () => {
          const compressionTime = Date.now() - startTime;
          res.set('X-Compression-Time', `${compressionTime}ms`);
        });
        
        return result;
      };
      
      res.send = function(data) {
        const startTime = Date.now();
        const originalSize = Buffer.byteLength(data || '', 'utf8');
        
        res.set('X-Original-Size', originalSize.toString());
        res.set('X-Compression-Level', level.toString());
        
        const result = originalSend.call(this, data);
        
        // Add compression timing
        res.on('finish', () => {
          const compressionTime = Date.now() - startTime;
          res.set('X-Compression-Time', `${compressionTime}ms`);
        });
        
        return result;
      };
      
      // Apply compression middleware
      compressionMiddleware(req, res, next);
    } else {
      // Skip compression, add headers to indicate why
      res.set('X-Compression-Skipped', 'content-type-not-suitable');
      res.set('X-Content-Type', contentType);
      next();
    }
  };
};

/**
 * Determine if content should be compressed
 */
function shouldCompressContent(contentType, config) {
  // Never compress certain content types
  if (config.neverCompress.some(type => contentType.includes(type))) {
    return false;
  }
  
  // Always compress certain content types
  if (config.alwaysCompress.some(type => contentType.includes(type))) {
    return true;
  }
  
  // Default to true for text-based content
  return contentType.startsWith('text/') || contentType.startsWith('application/');
}

/**
 * Compression statistics middleware
 */
const compressionStatsMiddleware = (req, res, next) => {
  const originalJson = res.json;
  
  res.json = function(data) {
    const originalSize = JSON.stringify(data).length;
    const contentType = res.get('Content-Type') || 'application/json';
    
    // Add compression statistics
    res.set('X-Content-Type', contentType);
    res.set('X-Payload-Size', originalSize.toString());
    
    // Add optimization recommendations
    if (originalSize > compressionConfig.thresholds.warningSize) {
      res.set('X-Optimization-Warning', 'Large response detected');
      res.set('X-Optimization-Suggestion', 'Consider implementing pagination or field selection');
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

/**
 * Response size monitoring middleware
 */
const responseSizeMonitoring = (options = {}) => {
  const {
    logLargeResponses = true,
    largeResponseThreshold = 1024 * 1024, // 1MB
    enableMetrics = true
  } = options;
  
  return (req, res, next) => {
    const startTime = Date.now();
    let responseSize = 0;
    
    // Override response methods to track size
    const originalJson = res.json;
    const originalSend = res.send;
    
    res.json = function(data) {
      responseSize = JSON.stringify(data).length;
      addSizeHeaders(res, responseSize, startTime);
      
      if (logLargeResponses && responseSize > largeResponseThreshold) {
        console.warn(`Large response detected: ${responseSize} bytes for ${req.method} ${req.originalUrl}`);
      }
      
      return originalJson.call(this, data);
    };
    
    res.send = function(data) {
      responseSize = Buffer.byteLength(data || '', 'utf8');
      addSizeHeaders(res, responseSize, startTime);
      
      if (logLargeResponses && responseSize > largeResponseThreshold) {
        console.warn(`Large response detected: ${responseSize} bytes for ${req.method} ${req.originalUrl}`);
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};

/**
 * Add size-related headers to response
 */
function addSizeHeaders(res, size, startTime) {
  const responseTime = Date.now() - startTime;
  
  res.set('X-Response-Size', size.toString());
  res.set('X-Response-Time', `${responseTime}ms`);
  res.set('X-Response-Size-KB', (size / 1024).toFixed(2));
  
  // Add size category
  if (size < 1024) {
    res.set('X-Size-Category', 'small');
  } else if (size < 1024 * 1024) {
    res.set('X-Size-Category', 'medium');
  } else {
    res.set('X-Size-Category', 'large');
  }
  
  // Add bandwidth estimates
  res.set('X-Estimated-3G-Time', `${(size / (150 * 1024)).toFixed(2)}s`);
  res.set('X-Estimated-4G-Time', `${(size / (1024 * 1024)).toFixed(2)}s`);
}

/**
 * Combined optimization middleware for all routes
 */
const enhancedCompressionMiddleware = (options = {}) => {
  return [
    compressionStatsMiddleware,
    responseSizeMonitoring(options),
    smartCompression(options)
  ];
};

module.exports = {
  smartCompression,
  compressionStatsMiddleware,
  responseSizeMonitoring,
  enhancedCompressionMiddleware,
  compressionConfig
};
