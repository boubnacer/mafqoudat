/**
 * Cache Configuration Gateway
 * 
 * Routes all cache operations through the unified memory-optimized
 * cache service (L1 NodeCache + L2 Redis).
 */

const { unifiedCacheService, initRedis, CACHE_TTL } = require('./unifiedCache');
const { cacheMiddleware } = require('../middleware/cacheMiddleware');

module.exports = {
  cacheService: unifiedCacheService,
  cacheMiddleware,
  initRedis,
  CACHE_TTL
};
