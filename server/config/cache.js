const NodeCache = require('node-cache');
const redis = require('redis');

// In-memory cache configuration
const memoryCache = new NodeCache({
  stdTTL: 300, // 5 minutes default TTL
  checkperiod: 60, // Check for expired keys every 60 seconds
  useClones: false, // Better performance
  maxKeys: 1000 // Limit memory usage
});

// Redis client configuration
let redisClient = null;
let redisConnected = false;

// Initialize Redis connection
const initRedis = async () => {
  try {
    if (process.env.REDIS_URL) {
      redisClient = redis.createClient({
        url: process.env.REDIS_URL
      });
      
      redisClient.on('error', (err) => {
        console.log('Redis Client Error:', err);
        redisConnected = false;
      });
      
      redisClient.on('connect', () => {
        console.log('✅ Redis connected successfully');
        redisConnected = true;
      });
      
      await redisClient.connect();
    } else {
      console.log('⚠️  REDIS_URL not provided, using in-memory cache only');
    }
  } catch (error) {
    console.log('❌ Redis connection failed, using in-memory cache only:', error.message);
    redisConnected = false;
  }
};

// Cache service class
class CacheService {
  constructor() {
    this.memoryCache = memoryCache;
    this.redisClient = redisClient;
    this.redisConnected = redisConnected;
  }

  // Generate cache key
  generateKey(prefix, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    return `${prefix}:${sortedParams}`;
  }

  // Set cache value
  async set(key, value, ttl = 300) {
    try {
      // Set in memory cache
      this.memoryCache.set(key, value, ttl);
      
      // Set in Redis if available
      if (this.redisClient && this.redisConnected) {
        await this.redisClient.setEx(key, ttl, JSON.stringify(value));
      }
      
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  // Get cache value
  async get(key) {
    try {
      // Try memory cache first
      let value = this.memoryCache.get(key);
      
      if (value !== undefined) {
        return value;
      }
      
      // Try Redis if memory cache miss
      if (this.redisClient && this.redisConnected) {
        const redisValue = await this.redisClient.get(key);
        if (redisValue) {
          const parsedValue = JSON.parse(redisValue);
          // Store in memory cache for faster subsequent access
          this.memoryCache.set(key, parsedValue, 300);
          return parsedValue;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  // Delete cache value
  async del(key) {
    try {
      // Delete from memory cache
      this.memoryCache.del(key);
      
      // Delete from Redis if available
      if (this.redisClient && this.redisConnected) {
        await this.redisClient.del(key);
      }
      
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  // Clear all cache
  async clear() {
    try {
      // Clear memory cache
      this.memoryCache.flushAll();
      
      // Clear Redis if available
      if (this.redisClient && this.redisConnected) {
        await this.redisClient.flushAll();
      }
      
      return true;
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  }

  // Get cache statistics
  getStats() {
    const memoryStats = this.memoryCache.getStats();
    return {
      memory: {
        keys: memoryStats.keys,
        hits: memoryStats.hits,
        misses: memoryStats.misses,
        hitRate: memoryStats.hits / (memoryStats.hits + memoryStats.misses) || 0
      },
      redis: {
        connected: this.redisConnected
      }
    };
  }

  // Invalidate cache by pattern
  async invalidatePattern(pattern) {
    try {
      // Clear memory cache (no pattern support in node-cache)
      this.memoryCache.flushAll();
      
      // Clear Redis keys by pattern if available
      if (this.redisClient && this.redisConnected) {
        const keys = await this.redisClient.keys(pattern);
        if (keys.length > 0) {
          await this.redisClient.del(keys);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Cache pattern invalidation error:', error);
      return false;
    }
  }
}

// Create singleton instance
const cacheService = new CacheService();

// Cache middleware for Express
const cacheMiddleware = (prefix, ttl = 300) => {
  return async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = cacheService.generateKey(prefix, {
      ...req.query,
      ...req.params,
      user: req.user?.id || 'anonymous'
    });

    try {
      const cachedData = await cacheService.get(cacheKey);
      
      if (cachedData) {
        // Add cache hit header
        res.set('X-Cache', 'HIT');
        return res.json(cachedData);
      }
      
      // Add cache miss header
      res.set('X-Cache', 'MISS');
      
      // Store original send method
      const originalSend = res.json;
      
      // Override send method to cache response
      res.json = function(data) {
        cacheService.set(cacheKey, data, ttl);
        return originalSend.call(this, data);
      };
      
      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

module.exports = {
  cacheService,
  cacheMiddleware,
  initRedis
};

