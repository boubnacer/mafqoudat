const { cacheService } = require('../config/cache');

// Cache TTL constants
const CACHE_TTL = {
  STATIC_DATA: 3600, // 1 hour - countries, categories, etc.
  DYNAMIC_DATA: 300,  // 5 minutes - posts, cities, etc.
  USER_DATA: 1800,    // 30 minutes - user profiles, etc.
  SEARCH_RESULTS: 600, // 10 minutes - search results
  DASHBOARD: 300,     // 5 minutes - dashboard data
  IMAGES: 86400       // 24 hours - image URLs
};

// Generic cache middleware
const cacheMiddleware = (prefix, ttl = CACHE_TTL.DYNAMIC_DATA) => {
  return async (req, res, next) => {
    // Skip caching for non-GET requests or authenticated users with specific actions
    if (req.method !== 'GET' || req.query.nocache === 'true') {
      return next();
    }

    const cacheKey = cacheService.generateKey(prefix, {
      ...req.query,
      ...req.params,
      user: req.user?.id || 'anonymous',
      lang: req.headers['accept-language'] || 'en'
    });

    try {
      const cachedData = await cacheService.get(cacheKey);
      
      if (cachedData) {
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-Key', cacheKey);
        return res.json(cachedData);
      }
      
      res.set('X-Cache', 'MISS');
      res.set('X-Cache-Key', cacheKey);
      
      // Store original send method
      const originalJson = res.json;
      
      // Override json method to cache response
      res.json = function(data) {
        if (data && !data.error) {
          cacheService.set(cacheKey, data, ttl);
        }
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

// Specialized cache middlewares for different data types
const staticDataCache = (prefix) => cacheMiddleware(prefix, CACHE_TTL.STATIC_DATA);
const dynamicDataCache = (prefix) => cacheMiddleware(prefix, CACHE_TTL.DYNAMIC_DATA);
const userDataCache = (prefix) => cacheMiddleware(prefix, CACHE_TTL.USER_DATA);
const searchCache = (prefix) => cacheMiddleware(prefix, CACHE_TTL.SEARCH_RESULTS);
const dashboardCache = (prefix) => cacheMiddleware(prefix, CACHE_TTL.DASHBOARD);
const imageCache = (prefix) => cacheMiddleware(prefix, CACHE_TTL.IMAGES);

// Cache invalidation middleware
const invalidateCache = (patterns = []) => {
  return async (req, res, next) => {
    try {
      // Store original send method
      const originalJson = res.json;
      
      // Override json method to invalidate cache after successful operations
      res.json = async function(data) {
        if (data && !data.error) {
          // Invalidate cache patterns
          for (const pattern of patterns) {
            await cacheService.invalidatePattern(pattern);
          }
          console.log(`🗑️ Cache invalidated for patterns: ${patterns.join(', ')}`);
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

// Conditional cache middleware based on request parameters
const conditionalCache = (prefix, conditionFn, ttl = CACHE_TTL.DYNAMIC_DATA) => {
  return async (req, res, next) => {
    // Skip caching if condition is not met
    if (!conditionFn(req)) {
      return next();
    }
    
    return cacheMiddleware(prefix, ttl)(req, res, next);
  };
};

// Cache middleware for paginated results
const paginatedCache = (prefix, ttl = CACHE_TTL.DYNAMIC_DATA) => {
  return async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Include pagination parameters in cache key
    const page = req.query.page || '1';
    const pageSize = req.query.pageSize || '10';
    
    const cacheKey = cacheService.generateKey(prefix, {
      ...req.query,
      ...req.params,
      page,
      pageSize,
      user: req.user?.id || 'anonymous',
      lang: req.headers['accept-language'] || 'en'
    });

    try {
      const cachedData = await cacheService.get(cacheKey);
      
      if (cachedData) {
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-Key', cacheKey);
        return res.json(cachedData);
      }
      
      res.set('X-Cache', 'MISS');
      res.set('X-Cache-Key', cacheKey);
      
      // Store original send method
      const originalJson = res.json;
      
      // Override json method to cache response
      res.json = function(data) {
        if (data && !data.error) {
          cacheService.set(cacheKey, data, ttl);
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

// Cache statistics endpoint middleware
const cacheStatsMiddleware = async (req, res) => {
  try {
    const stats = cacheService.getStats();
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cache stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cache statistics'
    });
  }
};

// Clear cache endpoint middleware
const clearCacheMiddleware = async (req, res) => {
  try {
    const { pattern } = req.query;
    
    if (pattern) {
      await cacheService.invalidatePattern(pattern);
      res.json({
        success: true,
        message: `Cache cleared for pattern: ${pattern}`,
        timestamp: new Date().toISOString()
      });
    } else {
      await cacheService.clear();
      res.json({
        success: true,
        message: 'All cache cleared',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache'
    });
  }
};

module.exports = {
  cacheMiddleware,
  staticDataCache,
  dynamicDataCache,
  userDataCache,
  searchCache,
  dashboardCache,
  imageCache,
  invalidateCache,
  conditionalCache,
  paginatedCache,
  cacheStatsMiddleware,
  clearCacheMiddleware,
  CACHE_TTL
};

