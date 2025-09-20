const { 
  optimizedCacheService, 
  createCacheMiddleware,
  staticDataCache,
  dynamicDataCache,
  postsCache,
  searchCache,
  dashboardCache,
  userDataCache,
  CACHE_TTL 
} = require('../config/optimizedCache');

/**
 * Optimized Cache Middleware for MongoDB Atlas Flex
 * 
 * Features:
 * - Intelligent cache invalidation patterns
 * - Conditional caching based on request context
 * - Cache performance monitoring
 * - Smart cache warming integration
 * - Compression-aware middleware
 */

// Cache invalidation middleware with smart patterns
const invalidateCache = (patterns = [], dataType = null) => {
  return async (req, res, next) => {
    try {
      // Store original send method
      const originalJson = res.json;
      
      // Override json method to invalidate cache after successful operations
      res.json = async function(data) {
        if (data && !data.error && !data.message?.includes('error')) {
          let totalInvalidated = 0;
          
          // Use smart invalidation by data type if provided
          if (dataType) {
            const specificId = data._id || data.id || req.params.id;
            totalInvalidated = await optimizedCacheService.invalidateByType(dataType, specificId);
          }
          
          // Invalidate specific patterns
          for (const pattern of patterns) {
            const invalidated = await optimizedCacheService.invalidatePattern(pattern);
            totalInvalidated += invalidated;
          }
          
          console.log(`🗑️ Cache invalidated: ${totalInvalidated} keys for patterns: ${patterns.join(', ')}`);
          
          // Add invalidation info to response headers
          res.set('X-Cache-Invalidated', totalInvalidated.toString());
        }
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      console.error('Cache invalidation error:', error);
      next();
    }
  };
};

// Conditional cache middleware based on request parameters and context
const conditionalCache = (prefix, conditionFn, ttl = null, options = {}) => {
  return async (req, res, next) => {
    // Skip caching if condition is not met
    if (!conditionFn(req)) {
      res.set('X-Cache-Skipped', 'condition-not-met');
      return next();
    }
    
    return createCacheMiddleware('conditional', prefix, ttl, options)(req, res, next);
  };
};

// Cache middleware for paginated results with intelligent key generation
const paginatedCache = (prefix, ttl = null) => {
  return async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET' || req.query.nocache === 'true') {
      return next();
    }

    // Include pagination parameters in cache key
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const sort = req.query.sort || 'createdAt';
    const order = req.query.order || 'desc';
    
    // Create cache key with pagination context
    const cacheKey = optimizedCacheService.generateKey('paginated', prefix, {
      ...req.query,
      ...req.params,
      page,
      pageSize,
      sort,
      order,
      user: req.user?.id || 'anonymous',
      lang: req.headers['accept-language'] || 'en'
    });

    try {
      const cachedData = await optimizedCacheService.get(cacheKey);
      
      if (cachedData) {
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-Key', cacheKey);
        res.set('X-Cache-TTL', optimizedCacheService.getTTLForKey(cacheKey));
        return res.json(cachedData);
      }
      
      res.set('X-Cache', 'MISS');
      res.set('X-Cache-Key', cacheKey);
      res.set('X-Cache-TTL', optimizedCacheService.getTTLForKey(cacheKey));
      
      // Store original send method
      const originalJson = res.json;
      
      // Override send method to cache response
      res.json = function(data) {
        if (data && !data.error && !data.message?.includes('error')) {
          // Use appropriate TTL for paginated data
          const finalTTL = ttl || CACHE_TTL.POSTS_PAGINATED;
          optimizedCacheService.set(cacheKey, data, finalTTL);
        }
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      console.error('Paginated cache middleware error:', error);
      next();
    }
  };
};

// Search results cache middleware with query optimization
const searchResultsCache = (prefix, ttl = null) => {
  return async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET' || req.query.nocache === 'true') {
      return next();
    }

    // Normalize search parameters
    const searchQuery = req.query.q || req.query.search || req.query.query || '';
    const filters = {
      category: req.query.category,
      country: req.query.country,
      city: req.query.city,
      foundLost: req.query.foundLost,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo
    };
    
    // Remove empty filters
    Object.keys(filters).forEach(key => {
      if (!filters[key]) delete filters[key];
    });
    
    const cacheKey = optimizedCacheService.generateKey('search', prefix, {
      query: searchQuery.toLowerCase().trim(),
      ...filters,
      page: req.query.page || 1,
      pageSize: req.query.pageSize || 10,
      user: req.user?.id || 'anonymous',
      lang: req.headers['accept-language'] || 'en'
    });

    try {
      const cachedData = await optimizedCacheService.get(cacheKey);
      
      if (cachedData) {
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-Key', cacheKey);
        res.set('X-Cache-TTL', CACHE_TTL.SEARCH_RESULTS);
        return res.json(cachedData);
      }
      
      res.set('X-Cache', 'MISS');
      res.set('X-Cache-Key', cacheKey);
      res.set('X-Cache-TTL', CACHE_TTL.SEARCH_RESULTS);
      
      // Store original send method
      const originalJson = res.json;
      
      // Override send method to cache response
      res.json = function(data) {
        if (data && !data.error && !data.message?.includes('error')) {
          const finalTTL = ttl || CACHE_TTL.SEARCH_RESULTS;
          optimizedCacheService.set(cacheKey, data, finalTTL);
        }
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      console.error('Search results cache middleware error:', error);
      next();
    }
  };
};

// Cache middleware for dashboard data with smart invalidation
const dashboardCacheMiddleware = (prefix) => {
  return async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET' || req.query.nocache === 'true') {
      return next();
    }

    const { currentCountry, language = 'en' } = req.query;
    
    const cacheKey = optimizedCacheService.generateKey('dashboard', prefix, {
      currentCountry,
      language,
      user: req.user?.id || 'anonymous'
    });

    try {
      const cachedData = await optimizedCacheService.get(cacheKey);
      
      if (cachedData) {
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-Key', cacheKey);
        res.set('X-Cache-TTL', CACHE_TTL.DASHBOARD);
        return res.json(cachedData);
      }
      
      res.set('X-Cache', 'MISS');
      res.set('X-Cache-Key', cacheKey);
      res.set('X-Cache-TTL', CACHE_TTL.DASHBOARD);
      
      // Store original send method
      const originalJson = res.json;
      
      // Override send method to cache response
      res.json = function(data) {
        if (data && !data.error && !data.message?.includes('error')) {
          optimizedCacheService.set(cacheKey, data, CACHE_TTL.DASHBOARD);
        }
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      console.error('Dashboard cache middleware error:', error);
      next();
    }
  };
};

// Cache statistics endpoint middleware
const cacheStatsMiddleware = async (req, res) => {
  try {
    const stats = optimizedCacheService.getStats();
    const health = await optimizedCacheService.healthCheck();
    
    res.json({
      success: true,
      data: {
        statistics: stats,
        health: health,
        timestamp: new Date().toISOString(),
        recommendations: generateCacheRecommendations(stats)
      }
    });
  } catch (error) {
    console.error('Cache stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cache statistics',
      error: error.message
    });
  }
};

// Clear cache endpoint middleware with pattern support
const clearCacheMiddleware = async (req, res) => {
  try {
    const { pattern, type, confirm } = req.query;
    
    let result = {};
    
    if (type) {
      // Clear by data type
      const invalidated = await optimizedCacheService.invalidateByType(type);
      result = {
        type: 'data_type',
        dataType: type,
        invalidatedKeys: invalidated,
        message: `Cache cleared for data type: ${type}`
      };
    } else if (pattern) {
      // Clear by pattern
      const invalidated = await optimizedCacheService.invalidatePattern(pattern);
      result = {
        type: 'pattern',
        pattern: pattern,
        invalidatedKeys: invalidated,
        message: `Cache cleared for pattern: ${pattern}`
      };
    } else if (confirm === 'true') {
      // Clear all cache
      await optimizedCacheService.clear(true);
      result = {
        type: 'all',
        message: 'All cache cleared'
      };
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please provide pattern, type, or confirm=true to clear all cache'
      });
    }
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache',
      error: error.message
    });
  }
};

// Warm cache endpoint middleware
const warmCacheMiddleware = async (req, res) => {
  try {
    const { force } = req.query;
    const forceRefresh = force === 'true';
    
    console.log(`🔥 Manual cache warming requested (force: ${forceRefresh})`);
    
    const result = await optimizedCacheService.warmCache(forceRefresh);
    
    res.json({
      success: result,
      message: result ? 'Cache warming completed successfully' : 'Cache warming failed',
      forceRefresh: forceRefresh,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cache warming error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to warm cache',
      error: error.message
    });
  }
};

// Generate cache performance recommendations
const generateCacheRecommendations = (stats) => {
  const recommendations = [];
  const hitRate = parseFloat(stats.performance.hitRate);
  
  if (hitRate < 70) {
    recommendations.push({
      type: 'performance',
      priority: 'high',
      message: `Cache hit rate is ${stats.performance.hitRate}. Consider increasing TTL for frequently accessed data.`
    });
  }
  
  if (stats.compression.compressionRatio === '0%') {
    recommendations.push({
      type: 'optimization',
      priority: 'medium',
      message: 'No data compression detected. Consider enabling compression for large responses.'
    });
  }
  
  if (stats.warming.warmUps === 0) {
    recommendations.push({
      type: 'warming',
      priority: 'medium',
      message: 'Cache warming has not been performed. Enable scheduled cache warming for better performance.'
    });
  }
  
  if (stats.memory.keys > CACHE_LIMITS.MAX_MEMORY_KEYS * 0.8) {
    recommendations.push({
      type: 'memory',
      priority: 'low',
      message: 'Memory cache is near capacity. Consider increasing maxKeys or implementing LRU eviction.'
    });
  }
  
  return recommendations;
};

// Cache performance monitoring middleware
const cachePerformanceMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Override res.json to measure response time
  const originalJson = res.json;
  res.json = function(data) {
    const responseTime = Date.now() - startTime;
    
    // Add performance headers
    res.set('X-Response-Time', `${responseTime}ms`);
    res.set('X-Cache-Performance', res.get('X-Cache') || 'NONE');
    
    return originalJson.call(this, data);
  };
  
  next();
};

// Export all middleware functions
module.exports = {
  // Core cache middlewares
  staticDataCache,
  dynamicDataCache,
  postsCache,
  searchCache,
  dashboardCache,
  userDataCache,
  
  // Specialized middlewares
  paginatedCache,
  searchResultsCache,
  dashboardCacheMiddleware,
  conditionalCache,
  
  // Cache management middlewares
  invalidateCache,
  cacheStatsMiddleware,
  clearCacheMiddleware,
  warmCacheMiddleware,
  cachePerformanceMiddleware,
  
  // Utilities
  createCacheMiddleware,
  generateCacheRecommendations
};
