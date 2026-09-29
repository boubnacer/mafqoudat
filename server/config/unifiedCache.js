const NodeCache = require('node-cache');
const redis = require('redis');

/**
 * Unified Memory-Optimized Cache System
 * 
 * Single source of truth for caching across the entire application:
 * - L1: In-memory NodeCache (fast, zero network overhead)
 * - L2: Redis (distributed, durable across instances when REDIS_URL is provided)
 * - Transparent compression for large payloads (>1KB)
 * - Non-blocking, pattern-specific invalidation (no full cache wipeouts)
 * - Resilient: graceful fallback to in-memory if Redis is offline or errors
 */

// L1 In-memory cache configuration
const memoryCache = new NodeCache({
  stdTTL: 1800,       // 30 minutes default
  checkperiod: 300,   // Check every 5 minutes
  useClones: false,   // Better performance (JSON serialize/parse handles immutability)
  maxKeys: 2000,      // Sensible memory bound
  deleteOnExpire: true,
  forceString: false
});

// Live Redis connection state
let redisClient = null;
let redisConnected = false;

// Initialize Redis connection
const initRedis = async () => {
  try {
    if (process.env.REDIS_URL) {
      if (redisClient && redisClient.isOpen) {
        return redisClient;
      }

      redisClient = redis.createClient({
        url: process.env.REDIS_URL,
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            return new Error('Redis server connection refused');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('Retry time exhausted');
          }
          if (options.attempt > 10) {
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        },
        lazyConnect: true,
        keepAlive: 30000,
        commandTimeout: 5000,
        maxRetriesPerRequest: 3
      });

      redisClient.on('error', (err) => {
        console.error('Redis Client Error:', err.message);
        redisConnected = false;
      });

      redisClient.on('connect', () => {
        console.log('✅ Redis connected successfully');
        redisConnected = true;
      });

      redisClient.on('ready', async () => {
        console.log('✅ Redis ready for operations');
        try {
          await redisClient.configSet('maxmemory-policy', 'allkeys-lru');
          await redisClient.configSet('maxmemory', '100mb');
        } catch (error) {
          // Some managed providers (Upstash, Render) disallow CONFIG SET
        }
      });

      await redisClient.connect();
    } else {
      console.log('ℹ️  REDIS_URL not provided, using high-performance in-memory cache');
    }
  } catch (error) {
    console.error('❌ Redis connection failed, falling back to in-memory cache:', error.message);
    redisConnected = false;
  }
  return redisClient;
};

// Optimized TTL configurations (in seconds)
const CACHE_TTL = {
  STATIC_DATA: 86400 * 7,      // 7 days
  COUNTRIES: 86400 * 7,        // 7 days
  CATEGORIES: 86400 * 7,       // 7 days
  FOUNDLOST: 86400 * 7,        // 7 days
  POSTS: 900,                  // 15 minutes
  POSTS_PAGINATED: 600,        // 10 minutes
  POST_DETAIL: 600,            // 10 minutes
  DASHBOARD: 600,              // 10 minutes
  CITIES: 3600,                // 1 hour
  USER_DATA: 1800,             // 30 minutes
  SEARCH_RESULTS: 300,         // 5 minutes
  DYNAMIC_DATA: 300,           // 5 minutes
  IMAGES: 86400,               // 24 hours
  DEFAULT: 900                 // 15 minutes
};

// Memory usage tracking
const memoryStats = {
  totalKeys: 0,
  totalSize: 0,
  compressionRatio: 0,
  evictions: 0
};

class UnifiedCacheService {
  constructor() {
    this.memoryCache = memoryCache;
    this.cacheStats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0
    };
    
    this.setupMemoryMonitoring();
  }

  // Dynamic accessors to live Redis connection state
  get isRedisConnected() {
    return Boolean(redisConnected && redisClient && redisClient.isOpen);
  }

  get activeRedisClient() {
    return this.isRedisConnected ? redisClient : null;
  }

  get redisConnected() {
    return this.isRedisConnected;
  }

  get redisClient() {
    return this.activeRedisClient;
  }

  /**
   * Reconnect Redis client (used for resilience/recovery)
   */
  async reconnect() {
    if (redisClient && redisClient.isOpen) {
      try {
        await redisClient.quit();
      } catch (e) {
        // ignore quit error
      }
    }
    redisClient = null;
    redisConnected = false;
    return await initRedis();
  }

  /**
   * Universal cache key generator supporting both:
   * - 2 args: generateKey(prefix, params)
   * - 3 args: generateKey(namespace/type, prefix, params)
   */
  generateKey(arg1, arg2, arg3) {
    let prefix = '';
    let params = {};

    if (typeof arg2 === 'string') {
      const ns = arg1 ? String(arg1).trim() : '';
      const pfx = arg2 ? String(arg2).trim() : '';
      prefix = ns ? `${ns}:${pfx}` : pfx;
      params = (arg3 && typeof arg3 === 'object') ? arg3 : {};
    } else {
      prefix = arg1 ? String(arg1).trim() : 'cache';
      params = (arg2 && typeof arg2 === 'object') ? arg2 : {};
    }

    const keys = Object.keys(params).sort();
    const serialized = keys
      .filter(k => params[k] !== undefined && params[k] !== null && params[k] !== '')
      .slice(0, 15)
      .map(k => `${k}:${String(params[k]).substring(0, 80)}`)
      .join('|');

    return serialized ? `${prefix}:${serialized}` : prefix;
  }

  /**
   * Compress data if larger than 1KB
   */
  async compressIfNeeded(data) {
    const jsonString = JSON.stringify(data);
    if (jsonString.length > 1024) {
      try {
        const zlib = require('zlib');
        const compressed = await new Promise((resolve, reject) => {
          zlib.gzip(jsonString, (err, result) => {
            if (err) reject(err);
            else resolve(result);
          });
        });
        
        memoryStats.compressionRatio = compressed.length / jsonString.length;
        return { compressed: true, data: compressed };
      } catch (error) {
        console.error('Cache compression error:', error.message);
        return { compressed: false, data: jsonString };
      }
    }
    return { compressed: false, data: jsonString };
  }

  /**
   * Decompress payload if compressed
   */
  async decompressIfNeeded(data, compressed = false) {
    if (compressed) {
      try {
        const zlib = require('zlib');
        const decompressed = await new Promise((resolve, reject) => {
          zlib.gunzip(data, (err, result) => {
            if (err) reject(err);
            else resolve(result);
          });
        });
        return JSON.parse(decompressed.toString());
      } catch (error) {
        console.error('Cache decompression error:', error.message);
        return null;
      }
    }
    return typeof data === 'string' ? JSON.parse(data) : data;
  }

  /**
   * Set cache entry in L1 (memory) and L2 (Redis if connected)
   */
  async set(key, value, ttl = null, options = {}) {
    try {
      const finalTTL = ttl || this.getTTLForKey(key);
      const { compressed, data } = await this.compressIfNeeded(value);
      
      // Store in L1 Memory Cache
      this.memoryCache.set(key, { compressed, data }, finalTTL);
      
      // Store in L2 Redis if available
      const redis = this.activeRedisClient;
      if (redis && !options.skipRedis) {
        try {
          const redisValue = JSON.stringify({ 
            compressed, 
            data: compressed ? data.toString('base64') : data 
          });
          await redis.setEx(key, finalTTL, redisValue);
        } catch (redisErr) {
          console.error('Redis set error (continuing with memory cache):', redisErr.message);
        }
      }
      
      this.cacheStats.sets++;
      memoryStats.totalKeys++;
      return true;
    } catch (error) {
      console.error('Cache set error:', error.message);
      return false;
    }
  }

  /**
   * Get cache entry checking L1 first, then L2 (populating L1 on miss)
   */
  async get(key) {
    try {
      // 1. Check L1 Memory Cache
      const cachedValue = this.memoryCache.get(key);
      if (cachedValue !== undefined) {
        const result = await this.decompressIfNeeded(cachedValue.data, cachedValue.compressed);
        if (result !== null) {
          this.cacheStats.hits++;
          return result;
        }
      }
      
      // 2. Check L2 Redis Cache
      const redis = this.activeRedisClient;
      if (redis) {
        try {
          const redisValue = await redis.get(key);
          if (redisValue) {
            const parsed = JSON.parse(redisValue);
            const actualData = parsed.compressed 
              ? Buffer.from(parsed.data, 'base64') 
              : parsed.data;
            const result = await this.decompressIfNeeded(actualData, parsed.compressed);
            
            if (result !== null) {
              // Populate L1 cache with shorter TTL
              const l1TTL = Math.min(this.getTTLForKey(key), 300);
              this.memoryCache.set(key, { compressed: parsed.compressed, data: actualData }, l1TTL);
              this.cacheStats.hits++;
              return result;
            }
          }
        } catch (redisErr) {
          console.error('Redis get error (continuing):', redisErr.message);
        }
      }
      
      this.cacheStats.misses++;
      return null;
    } catch (error) {
      console.error('Cache get error:', error.message);
      this.cacheStats.misses++;
      return null;
    }
  }

  /**
   * Delete specific key from both L1 and L2
   */
  async del(key) {
    try {
      this.memoryCache.del(key);
      
      const redis = this.activeRedisClient;
      if (redis) {
        try {
          await redis.del(key);
        } catch (redisErr) {
          console.error('Redis del error:', redisErr.message);
        }
      }
      
      this.cacheStats.deletes++;
      memoryStats.totalKeys = Math.max(0, memoryStats.totalKeys - 1);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error.message);
      return false;
    }
  }

  /**
   * Targeted pattern invalidation (NO full-cache wipeouts)
   * Matches glob patterns (e.g. 'posts*', 'countries*', 'cities-*') across
   * standard and namespaced keys without touching unrelated keys.
   */
  async invalidatePattern(pattern) {
    try {
      if (!pattern) return 0;
      let invalidatedKeys = 0;

      // Safe regex matching for in-memory keys
      const escaped = pattern
        .replace(/[-[\]{}()+?.,\\^$#\s]/g, '\\$&')
        .replace(/\*/g, '.*');
      const regex = new RegExp(`^(?:.*:)?${escaped}`, 'i');

      const memoryKeys = this.memoryCache.keys();
      const matchingKeys = memoryKeys.filter(key => regex.test(key));

      if (matchingKeys.length > 0) {
        this.memoryCache.del(matchingKeys);
        invalidatedKeys += matchingKeys.length;
      }

      // Redis invalidation using non-blocking scanIterator
      const redis = this.activeRedisClient;
      if (redis) {
        try {
          const redisKeys = new Set();
          
          // Match direct pattern
          for await (const key of redis.scanIterator({ MATCH: pattern, COUNT: 100 })) {
            redisKeys.add(key);
          }
          // Also match namespaced pattern if not already starting with wildcard
          if (!pattern.startsWith('*')) {
            for await (const key of redis.scanIterator({ MATCH: `*:${pattern}`, COUNT: 100 })) {
              redisKeys.add(key);
            }
          }

          if (redisKeys.size > 0) {
            const keysArray = Array.from(redisKeys);
            for (let i = 0; i < keysArray.length; i += 100) {
              await redis.del(keysArray.slice(i, i + 100));
            }
            invalidatedKeys += redisKeys.size;
          }
        } catch (redisErr) {
          console.error('Redis scan invalidation error:', redisErr.message);
        }
      }

      memoryStats.totalKeys = Math.max(0, memoryStats.totalKeys - invalidatedKeys);
      this.cacheStats.evictions += invalidatedKeys;
      return invalidatedKeys;
    } catch (error) {
      console.error('Cache pattern invalidation error:', error.message);
      return 0;
    }
  }

  /**
   * Smart invalidation by domain data type
   */
  async invalidateByType(dataType, specificId = null) {
    const invalidationMap = {
      posts: ['posts*', '*posts*', 'dashboard*'],
      posts_specific: specificId ? [`*posts*${specificId}*`, 'dashboard*'] : ['posts*', 'dashboard*'],
      dashboard: ['dashboard*'],
      reference: ['reference*', 'countries*', 'categories*', 'foundlost*', 'fl-options*', 'cities*'],
      countries: ['countries*', '*countries*'],
      categories: ['categories*', '*categories*'],
      foundlost: ['foundlost*', 'fl-options*', '*foundlost*'],
      cities: ['cities*', '*cities*', 'dependencies-cities*'],
      users: ['users*', 'user*'],
      search: ['search*', '*search*']
    };

    const patterns = invalidationMap[dataType] || [`${dataType}*`];
    let total = 0;
    for (const pattern of patterns) {
      total += await this.invalidatePattern(pattern);
    }
    return total;
  }

  /**
   * Determine appropriate TTL for a given key
   */
  getTTLForKey(key) {
    if (key.includes('countries') || key.includes('categories') || key.includes('foundlost') || key.includes('reference')) {
      return CACHE_TTL.STATIC_DATA;
    }
    if (key.includes('paginated') || key.includes('posts:paginated')) {
      return CACHE_TTL.POSTS_PAGINATED;
    }
    if (key.includes('post-detail') || key.includes('posts:detail')) {
      return CACHE_TTL.POST_DETAIL;
    }
    if (key.includes('posts')) {
      return CACHE_TTL.POSTS;
    }
    if (key.includes('dashboard')) {
      return CACHE_TTL.DASHBOARD;
    }
    if (key.includes('cities')) {
      return CACHE_TTL.CITIES;
    }
    if (key.includes('user')) {
      return CACHE_TTL.USER_DATA;
    }
    if (key.includes('search')) {
      return CACHE_TTL.SEARCH_RESULTS;
    }
    return CACHE_TTL.DEFAULT;
  }

  /**
   * Cache warming for essential reference data
   */
  async warmCache() {
    try {
      console.log('🔥 Starting unified cache warming...');
      const Country = require('../models/Country');
      const Category = require('../models/Category');
      const FoundLost = require('../models/FoundLost');

      const countries = await Country.find({ $or: [{ isActive: true }, { isActive: null }] })
        .select('code labels names flag isActive')
        .sort({ 'labels.en': 1 })
        .lean();

      const categories = await Category.find({ $or: [{ isActive: true }, { isActive: null }] })
        .select('code labels flag icon color isActive description')
        .sort({ 'labels.en': 1 })
        .lean();

      const foundLostOptions = await FoundLost.find({ $or: [{ isActive: true }, { isActive: null }] })
        .select('code labels color icon isActive description')
        .lean();

      await this.set(
        this.generateKey('reference', 'countries', { active: true }),
        countries,
        CACHE_TTL.COUNTRIES
      );

      await this.set(
        this.generateKey('reference', 'categories', { active: true }),
        categories,
        CACHE_TTL.CATEGORIES
      );

      await this.set(
        this.generateKey('reference', 'foundlost', { active: true }),
        foundLostOptions,
        CACHE_TTL.FOUNDLOST
      );

      console.log('✅ Unified cache warming completed successfully');
      return true;
    } catch (error) {
      console.error('❌ Cache warming failed:', error.message);
      return false;
    }
  }

  /**
   * Clear all cache (both L1 and L2)
   */
  async clear(confirm = true) {
    if (!confirm) {
      throw new Error('Cache clear requires confirmation. Use clear(true) to confirm.');
    }

    try {
      this.memoryCache.flushAll();

      const redis = this.activeRedisClient;
      if (redis) {
        try {
          await redis.flushAll();
        } catch (redisErr) {
          console.error('Redis flushAll error:', redisErr.message);
        }
      }

      memoryStats.totalKeys = 0;
      this.cacheStats = {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        evictions: 0
      };

      console.log('🗑️ All cache cleared (L1 + L2) and stats reset');
      return true;
    } catch (error) {
      console.error('Cache clear error:', error.message);
      return false;
    }
  }

  /**
   * Health check for cache layers
   */
  async healthCheck() {
    try {
      const testKey = 'health:check:' + Date.now();
      const testValue = { timestamp: new Date().toISOString(), status: 'healthy' };

      await this.set(testKey, testValue, 10);
      const result = await this.get(testKey);
      await this.del(testKey);

      return {
        status: result ? 'healthy' : 'degraded',
        memory: result ? 'working' : 'failed',
        redis: this.isRedisConnected ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  setupMemoryMonitoring() {
    const timer = setInterval(() => {
      this.monitorMemoryUsage();
    }, 5 * 60 * 1000);
    if (typeof timer.unref === 'function') timer.unref();
  }

  monitorMemoryUsage() {
    const memUsage = process.memoryUsage();
    if (memUsage.heapUsed > 250 * 1024 * 1024 && global.gc) {
      global.gc();
    }
  }

  getStats() {
    const memoryStatsObj = this.memoryCache.getStats();
    const memUsage = process.memoryUsage();
    const totalOperations = this.cacheStats.hits + this.cacheStats.misses;

    return {
      performance: {
        hitRate: totalOperations > 0 ? ((this.cacheStats.hits / totalOperations) * 100).toFixed(2) + '%' : '0%',
        totalOperations,
        hits: this.cacheStats.hits,
        misses: this.cacheStats.misses,
        sets: this.cacheStats.sets,
        deletes: this.cacheStats.deletes,
        evictions: this.cacheStats.evictions
      },
      memory: {
        keys: memoryStatsObj.keys,
        maxKeys: 2000,
        heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`,
        compressionRatio: `${(memoryStats.compressionRatio * 100).toFixed(2)}%`
      },
      redis: {
        connected: this.isRedisConnected,
        status: this.isRedisConnected ? 'healthy' : 'disconnected'
      }
    };
  }
}

// Singleton instance
const unifiedCacheService = new UnifiedCacheService();

// Scheduled cache warming
const warmCache = async () => unifiedCacheService.warmCache();

const scheduleCacheWarming = () => {
  const timer = setInterval(async () => {
    console.log('🔄 Scheduled cache warming triggered...');
    await warmCache();
  }, 6 * 60 * 60 * 1000);
  if (typeof timer.unref === 'function') timer.unref();
};

// Live module-level Redis client access for tokenStore.js
const getRedisClient = () => (redisConnected && redisClient && redisClient.isOpen ? redisClient : null);

module.exports = {
  unifiedCacheService,
  warmCache,
  scheduleCacheWarming,
  initRedis,
  getRedisClient,
  CACHE_TTL
};
