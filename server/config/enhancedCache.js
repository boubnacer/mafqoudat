const NodeCache = require('node-cache');
const redis = require('redis');

/**
 * Enhanced Caching Strategy for MongoDB Atlas Flex Plan
 * 
 * Features:
 * - Multi-tier caching (Memory + Redis)
 * - Intelligent cache warming
 * - Selective cache invalidation
 * - Query result caching
 * - Reference data caching with longer TTL
 */

// In-memory cache configuration - Optimized for reference data
const memoryCache = new NodeCache({
  stdTTL: 1800, // 30 minutes default TTL (increased from 5 minutes)
  checkperiod: 120, // Check for expired keys every 2 minutes
  useClones: false, // Better performance
  maxKeys: 2000, // Increased memory limit
  deleteOnExpire: true
});

// Redis client configuration
let redisClient = null;
let redisConnected = false;

// Initialize Redis connection
const initRedis = async () => {
  try {
    if (process.env.REDIS_URL) {
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
        }
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

// Cache TTL configurations
const CACHE_TTL = {
  // Reference data (rarely changes)
  COUNTRIES: 86400, // 24 hours
  CATEGORIES: 86400, // 24 hours
  FOUNDLOST: 86400, // 24 hours
  CITIES: 43200, // 12 hours
  
  // Dynamic data (changes frequently)
  POSTS: 600, // 10 minutes
  DASHBOARD: 900, // 15 minutes
  USER_DATA: 1800, // 30 minutes
  
  // Query results (expensive aggregations)
  AGGREGATION_RESULTS: 300, // 5 minutes
  
  // Search results
  SEARCH_RESULTS: 180, // 3 minutes
};

// Enhanced cache service class
class EnhancedCacheService {
  constructor() {
    this.memoryCache = memoryCache;
    this.redisClient = redisClient;
    this.redisConnected = redisConnected;
    this.cacheStats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
  }

  // Generate cache key with namespace
  generateKey(namespace, prefix, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    return `${namespace}:${prefix}:${sortedParams}`;
  }

  // Set cache value with intelligent TTL
  async set(key, value, ttl = null, options = {}) {
    try {
      // Determine TTL based on key pattern or provided value
      const finalTTL = ttl || this.getTTLForKey(key);
      
      // Set in memory cache
      this.memoryCache.set(key, value, finalTTL);
      
      // Set in Redis if available
      if (this.redisClient && this.redisConnected) {
        await this.redisClient.setEx(key, finalTTL, JSON.stringify(value));
      }
      
      this.cacheStats.sets++;
      return true;
    } catch (error) {
      console.error('Enhanced cache set error:', error);
      return false;
    }
  }

  // Get cache value with fallback strategy
  async get(key) {
    try {
      // Try memory cache first
      let value = this.memoryCache.get(key);
      
      if (value !== undefined) {
        this.cacheStats.hits++;
        return value;
      }
      
      // Try Redis if memory cache miss
      if (this.redisClient && this.redisConnected) {
        const redisValue = await this.redisClient.get(key);
        if (redisValue) {
          const parsedValue = JSON.parse(redisValue);
          // Store in memory cache for faster subsequent access
          this.memoryCache.set(key, parsedValue, this.getTTLForKey(key));
          this.cacheStats.hits++;
          return parsedValue;
        }
      }
      
      this.cacheStats.misses++;
      return null;
    } catch (error) {
      console.error('Enhanced cache get error:', error);
      this.cacheStats.misses++;
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
      
      this.cacheStats.deletes++;
      return true;
    } catch (error) {
      console.error('Enhanced cache delete error:', error);
      return false;
    }
  }

  // Intelligent cache invalidation by pattern
  async invalidatePattern(pattern) {
    try {
      // For memory cache, we need to clear all (node-cache limitation)
      // In production, consider using a more sophisticated memory cache
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
      console.error('Enhanced cache pattern invalidation error:', error);
      return false;
    }
  }

  // Selective cache invalidation for specific data types
  async invalidateByType(dataType) {
    const patterns = {
      posts: ['posts:*', 'dashboard:*'],
      dashboard: ['dashboard:*'],
      reference: ['countries:*', 'categories:*', 'foundlost:*', 'cities:*'],
      users: ['users:*', 'user:*']
    };

    const patternsToInvalidate = patterns[dataType] || [];
    
    for (const pattern of patternsToInvalidate) {
      await this.invalidatePattern(pattern);
    }
  }

  // Cache warming for frequently accessed data
  async warmCache() {
    try {
      console.log('🔥 Starting cache warming...');
      
      // Import models
      const Country = require('../models/Country');
      const Category = require('../models/Category');
      const FoundLost = require('../models/FoundLost');
      const City = require('../models/City');
      
      // Warm reference data caches
      const countries = await Country.find({ isActive: true })
        .select('code labels flag isActive')
        .lean();
      
      const categories = await Category.find({ isActive: true })
        .select('code labels color icon isActive')
        .lean();
      
      const foundLostOptions = await FoundLost.find({ isActive: true })
        .select('code labels color icon isActive')
        .lean();
      
      // Cache reference data
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
      
      console.log('✅ Cache warming completed');
      return true;
    } catch (error) {
      console.error('❌ Cache warming failed:', error);
      return false;
    }
  }

  // Get TTL for key based on pattern
  getTTLForKey(key) {
    if (key.includes('countries:') || key.includes('categories:') || key.includes('foundlost:')) {
      return CACHE_TTL.COUNTRIES;
    }
    if (key.includes('cities:')) {
      return CACHE_TTL.CITIES;
    }
    if (key.includes('posts:')) {
      return CACHE_TTL.POSTS;
    }
    if (key.includes('dashboard:')) {
      return CACHE_TTL.DASHBOARD;
    }
    if (key.includes('users:') || key.includes('user:')) {
      return CACHE_TTL.USER_DATA;
    }
    if (key.includes('search:')) {
      return CACHE_TTL.SEARCH_RESULTS;
    }
    if (key.includes('aggregation:')) {
      return CACHE_TTL.AGGREGATION_RESULTS;
    }
    return 1800; // Default 30 minutes
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
      },
      service: {
        hits: this.cacheStats.hits,
        misses: this.cacheStats.misses,
        sets: this.cacheStats.sets,
        deletes: this.cacheStats.deletes,
        hitRate: this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) || 0
      }
    };
  }

  // Clear all cache
  async clear() {
    try {
      this.memoryCache.flushAll();
      
      if (this.redisClient && this.redisConnected) {
        await this.redisClient.flushAll();
      }
      
      return true;
    } catch (error) {
      console.error('Enhanced cache clear error:', error);
      return false;
    }
  }

  // Cache middleware for Express with enhanced features
  cacheMiddleware(namespace, prefix, ttl = null, options = {}) {
    return async (req, res, next) => {
      // Skip caching for non-GET requests
      if (req.method !== 'GET') {
        return next();
      }

      // Skip caching for authenticated admin requests (if specified)
      if (options.skipForAdmin && req.user?.role === 'admin') {
        return next();
      }

      const cacheKey = this.generateKey(namespace, prefix, {
        ...req.query,
        ...req.params,
        user: req.user?.id || 'anonymous'
      });

      try {
        const cachedData = await this.get(cacheKey);
        
        if (cachedData) {
          res.set('X-Cache', 'HIT');
          res.set('X-Cache-Key', cacheKey);
          return res.json(cachedData);
        }
        
        res.set('X-Cache', 'MISS');
        res.set('X-Cache-Key', cacheKey);
        
        // Store original send method
        const originalSend = res.json;
        
        // Override send method to cache response
        res.json = function(data) {
          this.set(cacheKey, data, ttl, options);
          return originalSend.call(this, data);
        }.bind(this);
        
        next();
      } catch (error) {
        console.error('Enhanced cache middleware error:', error);
        next();
      }
    };
  }
}

// Create singleton instance
const enhancedCacheService = new EnhancedCacheService();

// Cache warming function
const warmCache = async () => {
  await enhancedCacheService.warmCache();
};

// Scheduled cache warming (every 6 hours)
const scheduleCacheWarming = () => {
  setInterval(async () => {
    console.log('🔄 Scheduled cache warming...');
    await warmCache();
  }, 6 * 60 * 60 * 1000); // 6 hours
};

module.exports = {
  enhancedCacheService,
  warmCache,
  scheduleCacheWarming,
  initRedis,
  CACHE_TTL
};
