const { unifiedCacheService, CACHE_TTL } = require('../config/unifiedCache');
const { getCacheUserKey } = require('../utils/requestUser');
const { sanitizeHeaderKey } = require('./cacheMiddleware');

/**
 * Optimized Cache Middleware
 * 
 * Powered by UnifiedCacheService (L1 NodeCache + L2 Redis).
 * Features:
 * - Safe printable ASCII headers preventing ERR_HTTP_INVALID_HEADER_VALUE
 * - Complete support for nocache=true and Cache-Control: no-cache
 * - Non-blocking invalidation on mutations
 * - Coordinated TTL and key management
 */

const shouldBypassCache = (req) => {
  return req.method !== 'GET' ||
    req.query.nocache === 'true' ||
    req.headers['cache-control'] === 'no-cache' ||
    req.headers['pragma'] === 'no-cache';
};

/**
 * Generic factory for route-level cache middleware
 */
const createCacheMiddleware = (type, prefix, ttl = null, options = {}) => {
  return async (req, res, next) => {
    if (shouldBypassCache(req)) {
      res.set('X-Cache', 'BYPASS');
      return next();
    }

    const cacheKey = unifiedCacheService.generateKey(type, prefix, {
      ...req.query,
      ...req.params,
      user: getCacheUserKey(req),
      lang: req.headers['accept-language'] || 'en'
    });

    try {
      const cachedData = await unifiedCacheService.get(cacheKey);

      if (cachedData !== null && cachedData !== undefined) {
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-Key', sanitizeHeaderKey(cacheKey));
        return res.json(cachedData);
      }

      res.set('X-Cache', 'MISS');
      res.set('X-Cache-Key', sanitizeHeaderKey(cacheKey));

      const originalJson = res.json.bind(res);

      res.json = function(data) {
        if (res.statusCode >= 200 && res.statusCode < 300 && data && !data.error && !data.message?.includes('error')) {
          const finalTTL = typeof ttl === 'number' ? ttl : unifiedCacheService.getTTLForKey(cacheKey);
          unifiedCacheService.set(cacheKey, data, finalTTL, options).catch(err => {
            console.error('Cache set error:', err.message);
          });
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error.message);
      next();
    }
  };
};

/**
 * Invalidation middleware for mutations
 */
const invalidateCache = (patterns = [], dataType = null) => {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300 && data && !data.error) {
        (async () => {
          try {
            let total = 0;
            if (dataType) {
              const specificId = data._id || data.id || req.params?.id || req.body?.id;
              total += await unifiedCacheService.invalidateByType(dataType, specificId);
            }
            for (const pattern of patterns) {
              total += await unifiedCacheService.invalidatePattern(pattern);
            }
          } catch (err) {
            console.error('Invalidation error in optimized middleware:', err.message);
          }
        })();
      }
      return originalJson(data);
    };

    next();
  };
};

/**
 * Paginated cache middleware
 */
const paginatedCache = (prefix, ttl = CACHE_TTL.POSTS_PAGINATED) => {
  return async (req, res, next) => {
    if (shouldBypassCache(req)) {
      res.set('X-Cache', 'BYPASS');
      return next();
    }

    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 10;
    const sort = req.query.sort || 'createdAt';
    const order = req.query.order || 'desc';

    const cacheKey = unifiedCacheService.generateKey('paginated', prefix, {
      ...req.query,
      ...req.params,
      page,
      pageSize,
      sort,
      order,
      user: getCacheUserKey(req),
      lang: req.headers['accept-language'] || 'en'
    });

    try {
      const cachedData = await unifiedCacheService.get(cacheKey);

      if (cachedData !== null && cachedData !== undefined) {
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-Key', sanitizeHeaderKey(cacheKey));
        return res.json(cachedData);
      }

      res.set('X-Cache', 'MISS');
      res.set('X-Cache-Key', sanitizeHeaderKey(cacheKey));

      const originalJson = res.json.bind(res);

      res.json = function(data) {
        if (res.statusCode >= 200 && res.statusCode < 300 && data && !data.error && !data.message?.includes('error')) {
          const finalTTL = typeof ttl === 'number' ? ttl : CACHE_TTL.POSTS_PAGINATED;
          unifiedCacheService.set(cacheKey, data, finalTTL).catch(err => {
            console.error('Paginated cache set error:', err.message);
          });
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Paginated cache middleware error:', error.message);
      next();
    }
  };
};

/**
 * Search results cache middleware
 */
const searchResultsCache = (prefix, ttl = CACHE_TTL.SEARCH_RESULTS) => {
  return async (req, res, next) => {
    if (shouldBypassCache(req)) {
      res.set('X-Cache', 'BYPASS');
      return next();
    }

    const searchQuery = req.query.q || req.query.search || req.query.query || '';
    const cacheKey = unifiedCacheService.generateKey('search', prefix, {
      ...req.query,
      ...req.params,
      q: searchQuery,
      user: getCacheUserKey(req),
      lang: req.headers['accept-language'] || 'en'
    });

    try {
      const cachedData = await unifiedCacheService.get(cacheKey);

      if (cachedData !== null && cachedData !== undefined) {
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-Key', sanitizeHeaderKey(cacheKey));
        return res.json(cachedData);
      }

      res.set('X-Cache', 'MISS');
      res.set('X-Cache-Key', sanitizeHeaderKey(cacheKey));

      const originalJson = res.json.bind(res);

      res.json = function(data) {
        if (res.statusCode >= 200 && res.statusCode < 300 && data && !data.error && !data.message?.includes('error')) {
          const finalTTL = typeof ttl === 'number' ? ttl : CACHE_TTL.SEARCH_RESULTS;
          unifiedCacheService.set(cacheKey, data, finalTTL).catch(err => {
            console.error('Search cache set error:', err.message);
          });
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Search cache middleware error:', error.message);
      next();
    }
  };
};

/**
 * Conditional cache middleware
 */
const conditionalCache = (prefix, conditionFn, ttl = null, options = {}) => {
  return async (req, res, next) => {
    if (!conditionFn(req)) {
      res.set('X-Cache-Skipped', 'condition-not-met');
      return next();
    }
    return createCacheMiddleware('conditional', prefix, ttl, options)(req, res, next);
  };
};

// Specialized route middlewares
const staticDataCache = (prefix, ttl = CACHE_TTL.STATIC_DATA) => createCacheMiddleware('reference', prefix, ttl);
const dynamicDataCache = (prefix, ttl = CACHE_TTL.DYNAMIC_DATA) => createCacheMiddleware('dynamic', prefix, ttl);
const postsCache = (prefix, ttl = CACHE_TTL.POST_DETAIL) => createCacheMiddleware('posts', prefix, ttl);
const searchCache = (prefix, ttl = CACHE_TTL.SEARCH_RESULTS) => createCacheMiddleware('search', prefix, ttl);
const dashboardCache = (prefix, ttl = CACHE_TTL.DASHBOARD) => createCacheMiddleware('dashboard', prefix, ttl);
const dashboardCacheMiddleware = (prefix, ttl = CACHE_TTL.DASHBOARD) => createCacheMiddleware('dashboard', prefix, ttl);
const userDataCache = (prefix, ttl = CACHE_TTL.USER_DATA) => createCacheMiddleware('users', prefix, ttl);

// Performance / stats utility middlewares
const cacheStatsMiddleware = () => (req, res) => {
  res.json({ success: true, data: unifiedCacheService.getStats() });
};

const clearCacheMiddleware = (confirm = false) => async (req, res) => {
  try {
    await unifiedCacheService.clear(confirm);
    res.json({ success: true, message: 'Cache cleared successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const warmCacheMiddleware = () => async (req, res) => {
  try {
    const success = await unifiedCacheService.warmCache();
    res.json({ success, message: success ? 'Cache warmed successfully' : 'Cache warming failed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const cachePerformanceMiddleware = () => (req, res, next) => {
  const startTime = Date.now();
  const originalJson = res.json.bind(res);

  res.json = function(data) {
    const responseTime = Date.now() - startTime;
    res.set('X-Response-Time', `${responseTime}ms`);
    res.set('X-Cache-Performance', res.get('X-Cache') || 'NONE');
    return originalJson(data);
  };

  next();
};

const generateCacheRecommendations = () => {
  const stats = unifiedCacheService.getStats();
  const recommendations = [];
  if (stats.performance.hitRate && parseFloat(stats.performance.hitRate) < 50) {
    recommendations.push('Consider reviewing cache TTLs to improve hit rate');
  }
  return recommendations;
};

module.exports = {
  staticDataCache,
  dynamicDataCache,
  postsCache,
  searchCache,
  dashboardCache,
  userDataCache,
  paginatedCache,
  searchResultsCache,
  dashboardCacheMiddleware,
  conditionalCache,
  invalidateCache,
  cacheStatsMiddleware,
  clearCacheMiddleware,
  warmCacheMiddleware,
  cachePerformanceMiddleware,
  createCacheMiddleware,
  generateCacheRecommendations,
  CACHE_TTL
};
