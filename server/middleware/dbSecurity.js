const { logEvents } = require('./logger');

// Database query security middleware
const dbSecurity = {
  // Sanitize MongoDB queries to prevent NoSQL injection
  sanitizeQuery: (query) => {
    if (!query || typeof query !== 'object') return query;
    
    const sanitized = {};
    
    for (const [key, value] of Object.entries(query)) {
      // Remove potentially dangerous operators
      if (key.startsWith('$') && !['$and', '$or', '$nor', '$not'].includes(key)) {
        // Only allow safe operators
        const allowedOperators = [
          '$eq', '$ne', '$gt', '$gte', '$lt', '$lte', '$in', '$nin',
          '$exists', '$regex', '$text', '$where', '$all', '$elemMatch',
          '$size', '$type', '$mod', '$bitsAllSet', '$bitsAnySet', '$bitsAllClear',
          '$bitsAnyClear', '$geoWithin', '$geoIntersects', '$near', '$nearSphere'
        ];
        
        if (!allowedOperators.includes(key)) {
          logEvents(
            `Potentially dangerous MongoDB operator detected: ${key}`,
            'errLog.log'
          );
          continue; // Skip this operator
        }
      }
      
      // Recursively sanitize nested objects
      if (typeof value === 'object' && value !== null) {
        sanitized[key] = dbSecurity.sanitizeQuery(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  },

  // Validate ObjectId format
  validateObjectId: (id) => {
    if (!id) return false;
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    return objectIdRegex.test(id);
  },

  // Sanitize aggregation pipeline
  sanitizeAggregationPipeline: (pipeline) => {
    if (!Array.isArray(pipeline)) return [];
    
    const allowedStages = [
      '$match', '$group', '$sort', '$limit', '$skip', '$project',
      '$lookup', '$unwind', '$addFields', '$count', '$facet',
      '$bucket', '$bucketAuto', '$geoNear', '$graphLookup',
      '$indexStats', '$listSessions', '$listLocalSessions',
      '$merge', '$out', '$planCacheStats', '$redact', '$replaceRoot',
      '$replaceWith', '$sample', '$set', '$unset', '$unionWith'
    ];
    
    return pipeline.filter(stage => {
      if (typeof stage !== 'object' || stage === null) return false;
      
      const stageName = Object.keys(stage)[0];
      if (!allowedStages.includes(stageName)) {
        logEvents(
          `Potentially dangerous aggregation stage detected: ${stageName}`,
          'errLog.log'
        );
        return false;
      }
      
      return true;
    });
  },

  // Rate limiting for database operations
  createDbRateLimiter: (maxOperations = 100, windowMs = 60000) => {
    const operationCounts = new Map();
    
    return (req, res, next) => {
      const key = req.ip || 'unknown';
      const now = Date.now();
      const windowStart = now - windowMs;
      
      // Clean old entries
      if (operationCounts.has(key)) {
        const operations = operationCounts.get(key).filter(time => time > windowStart);
        operationCounts.set(key, operations);
      } else {
        operationCounts.set(key, []);
      }
      
      const operations = operationCounts.get(key);
      
      if (operations.length >= maxOperations) {
        logEvents(
          `Database rate limit exceeded for IP: ${key}`,
          'errLog.log'
        );
        
        return res.status(429).json({
          message: 'Too many database operations',
          retryAfter: Math.ceil((operations[0] + windowMs - now) / 1000),
          isError: true
        });
      }
      
      operations.push(now);
      next();
    };
  },

  // Query complexity analyzer
  analyzeQueryComplexity: (query) => {
    let complexity = 0;
    
    if (typeof query === 'object' && query !== null) {
      // Count nested levels
      const countNestedLevels = (obj, level = 0) => {
        if (level > 5) return 5; // Cap at 5 levels
        
        let maxLevel = level;
        for (const value of Object.values(obj)) {
          if (typeof value === 'object' && value !== null) {
            maxLevel = Math.max(maxLevel, countNestedLevels(value, level + 1));
          }
        }
        return maxLevel;
      };
      
      complexity += countNestedLevels(query);
      
      // Count operators
      const countOperators = (obj) => {
        let count = 0;
        for (const key of Object.keys(obj)) {
          if (key.startsWith('$')) count++;
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            count += countOperators(obj[key]);
          }
        }
        return count;
      };
      
      complexity += countOperators(query);
    }
    
    return complexity;
  },

  // Query validation middleware
  validateQuery: (req, res, next) => {
    // Validate ObjectIds in params
    const idParams = ['id', 'userId', 'postId', 'categoryId', 'countryId', 'cityId'];
    
    for (const param of idParams) {
      if (req.params[param] && !dbSecurity.validateObjectId(req.params[param])) {
        return res.status(400).json({
          message: `Invalid ${param} format`,
          isError: true
        });
      }
    }
    
    // Sanitize query parameters
    if (req.query) {
      req.query = dbSecurity.sanitizeQuery(req.query);
    }
    
    // Sanitize body for database operations
    if (req.body && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
      req.body = dbSecurity.sanitizeQuery(req.body);
    }
    
    next();
  },

  // Log suspicious database operations
  logSuspiciousOperation: (operation, query, user) => {
    const complexity = dbSecurity.analyzeQueryComplexity(query);
    
    if (complexity > 10) {
      logEvents(
        `High complexity database operation: ${operation} - Complexity: ${complexity} - User: ${user || 'anonymous'}`,
        'errLog.log'
      );
    }
    
    // Log operations with potentially dangerous patterns
    const queryStr = JSON.stringify(query);
    const dangerousPatterns = [
      /\.\.\//, // Path traversal
      /javascript:/i, // JavaScript injection
      /<script/i, // XSS
      /\$where/i, // Server-side JavaScript
      /\$regex.*\$options.*i/i // Case-insensitive regex (can be slow)
    ];
    
    if (dangerousPatterns.some(pattern => pattern.test(queryStr))) {
      logEvents(
        `Potentially dangerous database operation: ${operation} - Query: ${queryStr} - User: ${user || 'anonymous'}`,
        'errLog.log'
      );
    }
  }
};

module.exports = dbSecurity;
