/**
 * Optimized Cache Configuration Gateway
 * 
 * Routes all optimized cache operations through the unified memory-optimized
 * cache service (L1 NodeCache + L2 Redis).
 */

const { 
  unifiedCacheService, 
  warmCache, 
  initRedis, 
  CACHE_TTL 
} = require('./unifiedCache');

const {
  createCacheMiddleware,
  staticDataCache,
  dynamicDataCache,
  postsCache,
  searchCache,
  dashboardCache,
  dashboardCacheMiddleware,
  userDataCache
} = require('../middleware/optimizedCacheMiddleware');

module.exports = {
  optimizedCacheService: unifiedCacheService,
  warmCache,
  initRedis,
  CACHE_TTL,
  createCacheMiddleware,
  staticDataCache,
  dynamicDataCache,
  postsCache,
  searchCache,
  dashboardCache,
  dashboardCacheMiddleware,
  userDataCache
};
