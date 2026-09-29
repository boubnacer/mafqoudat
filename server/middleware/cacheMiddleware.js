const { unifiedCacheService, CACHE_TTL } = require('../config/unifiedCache');
const { getCacheUserKey } = require('../utils/requestUser');

/**
 * Sanitize header value to ensure only printable ASCII characters (0x20 - 0x7E)
 * are passed to res.set(), preventing Node.js ERR_HTTP_INVALID_HEADER_VALUE crashes
 * when queries or keys contain Arabic, French, or Unicode characters.
 */
const sanitizeHeaderKey = (key) => {
  if (!key) return '';
  return String(key).replace(/[^\x20-\x7E]/g, (ch) => encodeURIComponent(ch)).substring(0, 180);
};

/**
 * Check if the current request should bypass the cache
 */
const shouldBypassCache = (req) => {
  return req.method !== 'GET' ||
    req.query.nocache === 'true' ||
    req.headers['cache-control'] === 'no-cache' ||
    req.headers['pragma'] === 'no-cache';
};

/**
 * Core generic cache middleware
 */
const cacheMiddleware = (prefix, ttl = CACHE_TTL.DYNAMIC_DATA) => {
  return async (req, res, next) => {
    if (shouldBypassCache(req)) {
      res.set('X-Cache', 'BYPASS');
      return next();
    }

    const cacheKey = unifiedCacheService.generateKey(prefix, {
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
        if (res.statusCode >= 200 && res.statusCode < 300 && data && !data.error) {
          const finalTTL = typeof ttl === 'number' ? ttl : unifiedCacheService.getTTLForKey(cacheKey);
          unifiedCacheService.set(cacheKey, data, finalTTL).catch(err => {
            console.error('Cache set error in middleware:', err.message);
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

// Specialized cache middlewares
const staticDataCache = (prefix) => cacheMiddleware(prefix, CACHE_TTL.STATIC_DATA);
const dynamicDataCache = (prefix) => cacheMiddleware(prefix, CACHE_TTL.DYNAMIC_DATA);
const userDataCache = (prefix) => cacheMiddleware(prefix, CACHE_TTL.USER_DATA);
const searchCache = (prefix) => cacheMiddleware(prefix, CACHE_TTL.SEARCH_RESULTS);
const dashboardCache = (prefix) => cacheMiddleware(prefix, CACHE_TTL.DASHBOARD);
const imageCache = (prefix) => cacheMiddleware(prefix, CACHE_TTL.IMAGES);

/**
 * Cache invalidation middleware for mutations (POST, PUT, PATCH, DELETE)
 */
const invalidateCache = (patterns = [], dataType = null) => {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300 && data && !data.error) {
        (async () => {
          try {
            if (dataType) {
              const specificId = data._id || data.id || req.params?.id || req.body?.id;
              await unifiedCacheService.invalidateByType(dataType, specificId);
            }
            for (const pattern of patterns) {
              await unifiedCacheService.invalidatePattern(pattern);
            }
          } catch (err) {
            console.error('Cache invalidation error in middleware:', err.message);
          }
        })();
      }
      return originalJson(data);
    };

    next();
  };
};

/**
 * Conditional cache middleware
 */
const conditionalCache = (prefix, conditionFn, ttl = CACHE_TTL.DYNAMIC_DATA) => {
  return (req, res, next) => {
    if (!conditionFn(req)) {
      return next();
    }
    return cacheMiddleware(prefix, ttl)(req, res, next);
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
        if (res.statusCode >= 200 && res.statusCode < 300 && data && !data.error) {
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
  CACHE_TTL,
  sanitizeHeaderKey
};
