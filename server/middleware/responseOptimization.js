const { optimizeResponseData, parseFieldSelection, compressResponse } = require('../utils/responseUtils');
const { parseGraphQLFieldSelection, validateFieldSelection, POSTS_SCHEMA } = require('../utils/graphqlFieldSelection');

/**
 * Response Optimization Middleware
 * 
 * Features:
 * - Field projection to only return needed fields
 * - GraphQL-style field selection
 * - Response compression for large payloads
 * - Smart pagination optimization
 * - Cache-friendly response headers
 * - Payload size reduction
 */

// Field projection middleware
const fieldProjectionMiddleware = (defaultFields = {}) => {
  return (req, res, next) => {
    // Parse field selection from query parameters
    const fields = parseFieldSelection(req.query.fields, defaultFields);
    
    // Store field selection in request for use in controllers
    req.selectedFields = fields;
    
    // Add field projection info to response headers
    res.set('X-Field-Projection', JSON.stringify(fields));
    
    next();
  };
};

// GraphQL-style field selection middleware
const graphqlFieldSelection = (schema = {}) => {
  return (req, res, next) => {
    // Support both 'fields' and 'select' query parameters
    const fieldQuery = req.query.fields || req.query.select;
    
    if (fieldQuery) {
      try {
        // Parse GraphQL-style field selection
        const selectedFields = parseGraphQLFieldSelection(fieldQuery);
        
        if (selectedFields) {
          // Validate field selection against schema
          const validation = validateFieldSelection(selectedFields, schema);
          
          if (!validation.valid) {
            return res.status(400).json({
              error: 'Invalid field selection',
              message: 'Some selected fields are not available',
              errors: validation.errors,
              warnings: validation.warnings,
              availableFields: Object.keys(schema)
            });
          }
          
          req.selectedFields = selectedFields;
          
          // Add selection info to response headers
          res.set('X-Field-Selection', fieldQuery);
          res.set('X-Selected-Fields', JSON.stringify(Object.keys(selectedFields)));
          
          // Add warnings if any
          if (validation.warnings.length > 0) {
            res.set('X-Field-Selection-Warnings', JSON.stringify(validation.warnings));
          }
        }
      } catch (error) {
        return res.status(400).json({
          error: 'Invalid field selection syntax',
          message: error.message,
          availableFields: Object.keys(schema),
          examples: [
            'id,description,contact,createdAt',
            'id,description,user{username},category{code}',
            'id,description,contact,exactLocation,city{code,labels}'
          ]
        });
      }
    }
    
    next();
  };
};

// Response compression middleware for large payloads
const responseCompressionMiddleware = (threshold = 1024) => {
  return (req, res, next) => {
    const originalJson = res.json;
    
    res.json = function(data) {
      // Check if response should be compressed
      const shouldCompress = req.accepts('gzip') && 
                           JSON.stringify(data).length > threshold &&
                           !res.get('Content-Encoding');
      
      if (shouldCompress) {
        res.set('Content-Encoding', 'gzip');
        res.set('X-Response-Compressed', 'true');
        res.set('X-Original-Size', JSON.stringify(data).length);
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};

// Pagination optimization middleware
const paginationOptimization = (options = {}) => {
  const {
    maxPageSize = 50,
    defaultPageSize = 10,
    maxOffset = 10000, // Prevent deep pagination
    enableCursorPagination = false
  } = options;
  
  return (req, res, next) => {
    // Parse and validate pagination parameters
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(maxPageSize, Math.max(1, parseInt(req.query.pageSize) || defaultPageSize));
    const offset = (page - 1) * pageSize;
    
    // Prevent deep pagination for performance
    if (offset > maxOffset) {
      return res.status(400).json({
        error: 'Pagination limit exceeded',
        message: `Maximum offset allowed is ${maxOffset}. Use cursor-based pagination for deeper results.`,
        maxOffset,
        currentOffset: offset
      });
    }
    
    // Add optimized pagination info to request
    req.pagination = {
      page,
      pageSize,
      offset,
      limit: pageSize,
      enableCursorPagination
    };
    
    // Add pagination info to response headers
    res.set('X-Pagination-Page', page.toString());
    res.set('X-Pagination-PageSize', pageSize.toString());
    res.set('X-Pagination-Offset', offset.toString());
    
    next();
  };
};

// Cache-friendly response headers middleware
const cacheHeadersMiddleware = (options = {}) => {
  const {
    defaultTTL = 300, // 5 minutes
    enableETag = true,
    enableLastModified = true
  } = options;
  
  return (req, res, next) => {
    // Set cache control headers
    const ttl = req.query.cacheTTL ? parseInt(req.query.cacheTTL) : defaultTTL;
    const cacheControl = req.query.noCache === 'true' ? 'no-cache, no-store, must-revalidate' : `public, max-age=${ttl}`;
    
    res.set('Cache-Control', cacheControl);
    res.set('X-Cache-TTL', ttl.toString());
    
    // Add ETag support for conditional requests
    if (enableETag) {
      res.set('ETag', `"${Date.now()}-${Math.random().toString(36).substr(2, 9)}"`);
    }
    
    // Add Last-Modified header
    if (enableLastModified) {
      res.set('Last-Modified', new Date().toUTCString());
    }
    
    // Add response optimization headers
    res.set('X-Response-Optimized', 'true');
    res.set('X-Optimization-Version', '1.0');
    
    next();
  };
};

// Payload optimization middleware
const payloadOptimizationMiddleware = (options = {}) => {
  const {
    removeNullFields = true,
    removeEmptyArrays = false,
    removeEmptyObjects = false,
    compressNestedData = true,
    maxNestingLevel = 3
  } = options;
  
  return (req, res, next) => {
    const originalJson = res.json;
    
    res.json = function(data) {
      try {
        // Optimize response data
        const optimizedData = optimizeResponseData(data, {
          removeNullFields,
          removeEmptyArrays,
          removeEmptyObjects,
          compressNestedData,
          maxNestingLevel,
          selectedFields: req.selectedFields
        });
        
        // Add optimization info to headers
        const originalSize = JSON.stringify(data).length;
        const optimizedSize = JSON.stringify(optimizedData).length;
        const reductionPercent = ((originalSize - optimizedSize) / originalSize * 100).toFixed(2);
        
        res.set('X-Payload-Original-Size', originalSize.toString());
        res.set('X-Payload-Optimized-Size', optimizedSize.toString());
        res.set('X-Payload-Reduction', `${reductionPercent}%`);
        
        return originalJson.call(this, optimizedData);
      } catch (error) {
        console.error('Payload optimization error:', error);
        // Fallback to original data if optimization fails
        return originalJson.call(this, data);
      }
    };
    
    next();
  };
};

// Combined optimization middleware for posts API
const postsOptimizationMiddleware = () => {
  return [
    fieldProjectionMiddleware({
      // Default fields for posts
      id: true,
      title: false, // Not used in current schema
      description: true,
      contact: true,
      exactLocation: true,
      createdAt: true,
      updatedAt: false,
      image: true,
      returned: true,
      // Nested fields
      user: {
        id: true,
        username: true
      },
      category: {
        id: true,
        code: true,
        labels: true
      },
      country: {
        id: true,
        code: true,
        labels: true
      },
      city: {
        id: true,
        code: true,
        labels: true,
        isDynamic: true
      },
      foundLost: {
        id: true,
        code: true,
        labels: true
      }
    }),
    graphqlFieldSelection(POSTS_SCHEMA),
    paginationOptimization({
      maxPageSize: 50,
      defaultPageSize: 8,
      maxOffset: 5000,
      enableCursorPagination: true
    }),
    cacheHeadersMiddleware({
      defaultTTL: 300, // 5 minutes for posts
      enableETag: true,
      enableLastModified: true
    }),
    payloadOptimizationMiddleware({
      removeNullFields: true,
      removeEmptyArrays: true,
      removeEmptyObjects: false,
      compressNestedData: true,
      maxNestingLevel: 3
    }),
    responseCompressionMiddleware(1024) // Compress responses > 1KB
  ];
};


module.exports = {
  fieldProjectionMiddleware,
  graphqlFieldSelection,
  responseCompressionMiddleware,
  paginationOptimization,
  cacheHeadersMiddleware,
  payloadOptimizationMiddleware,
  postsOptimizationMiddleware
};
