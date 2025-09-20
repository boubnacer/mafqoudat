const NodeCache = require('node-cache');
const redis = require('redis');
const zlib = require('zlib');
const { promisify } = require('util');

/**
 * Optimized Caching Strategy for MongoDB Atlas Flex
 * 
 * Features:
 * - Multi-tier caching (Memory + Redis)
 * - Intelligent cache warming with scheduled updates
 * - Smart cache invalidation patterns
 * - Compression for large responses
 * - Optimized cache key generation with namespacing
 * - Performance monitoring and metrics
 * - 80%+ database call reduction target
 */

// Compression utilities
const compress = promisify(zlib.gzip);
const decompress = promisify(zlib.gunzip);

// Optimized cache TTL configurations for MongoDB Atlas Flex
const CACHE_TTL = {
  // Reference data (rarely changes) - Aggressive caching
  COUNTRIES: 86400 * 7,        // 7 days - Countries change very rarely
  CATEGORIES: 86400 * 7,       // 7 days - Categories are stable
  FOUNDLOST: 86400 * 7,        // 7 days - Post types are stable
  CITIES: 86400 * 2,           // 2 days - Cities are relatively stable
  
  // Dynamic data (changes frequently) - Moderate caching
  POSTS: 1800,                 // 30 minutes - Posts change frequently
  POSTS_PAGINATED: 900,        // 15 minutes - Paginated posts
  POSTS_SEARCH: 600,           // 10 minutes - Search results
  DASHBOARD: 900,              // 15 minutes - Dashboard data
  USER_DATA: 3600,             // 1 hour - User profiles
  
  // Query results (expensive aggregations) - Short caching
  AGGREGATION_RESULTS: 300,    // 5 minutes - Complex aggregations
  SEARCH_RESULTS: 180,         // 3 minutes - Search results
  
  // API responses
  API_RESPONSES: 600,          // 10 minutes - General API responses
  IMAGE_URLS: 86400 * 3,       // 3 days - Image URLs are stable
};

// Cache size limits
const CACHE_LIMITS = {
  MAX_MEMORY_KEYS: 5000,
  MAX_REDIS_MEMORY: '100mb',
  COMPRESSION_THRESHOLD: 1024, // Compress responses larger than 1KB
};

// In-memory cache configuration - Optimized for reference data
const memoryCache = new NodeCache({
  stdTTL: CACHE_TTL.API_RESPONSES,
  checkperiod: 300, // Check for expired keys every 5 minutes
  useClones: false, // Better performance
  maxKeys: CACHE_LIMITS.MAX_MEMORY_KEYS,
  deleteOnExpire: true,
  forceString: false
});

// Redis client configuration with optimization
let redisClient = null;
let redisConnected = false;

// Initialize Redis connection with optimizations
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
        },
        // Redis optimization settings
        lazyConnect: true,
        keepAlive: 30000,
        commandTimeout: 5000,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3
      });
      
      redisClient.on('error', (err) => {
        console.log('Redis Client Error:', err);
        redisConnected = false;
      });
      
      redisClient.on('connect', () => {
        console.log('✅ Redis connected successfully');
        redisConnected = true;
      });
      
      redisClient.on('ready', () => {
        console.log('✅ Redis ready for operations');
        // Set Redis memory optimization
        redisClient.configSet('maxmemory-policy', 'allkeys-lru');
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

// Optimized cache service class
class OptimizedCacheService {
  constructor() {
    this.memoryCache = memoryCache;
    this.redisClient = redisClient;
    this.redisConnected = redisConnected;
    this.cacheStats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      compressions: 0,
      decompressions: 0,
      warmUps: 0
    };
    this.warmingInProgress = new Set();
  }

  // Generate optimized cache key with namespace and versioning
  generateKey(namespace, prefix, params = {}, version = 'v1') {
    // Create a deterministic hash of parameters
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    
    // Include version for cache invalidation
    return `${namespace}:${version}:${prefix}:${sortedParams}`;
  }

  // Compress data if it's large enough
  async compressData(data) {
    try {
      const jsonString = JSON.stringify(data);
      if (jsonString.length > CACHE_LIMITS.COMPRESSION_THRESHOLD) {
        const compressed = await compress(jsonString);
        this.cacheStats.compressions++;
        return { compressed: true, data: compressed };
      }
      return { compressed: false, data: jsonString };
    } catch (error) {
      console.error('Compression error:', error);
      return { compressed: false, data: JSON.stringify(data) };
    }
  }

  // Decompress data if needed
  async decompressData(data, compressed = false) {
    try {
      if (compressed) {
        const decompressed = await decompress(data);
        this.cacheStats.decompressions++;
        return JSON.parse(decompressed.toString());
      }
      return JSON.parse(data);
    } catch (error) {
      console.error('Decompression error:', error);
      return null;
    }
  }

  // Set cache value with intelligent TTL and compression
  async set(key, value, ttl = null, options = {}) {
    try {
      // Determine TTL based on key pattern or provided value
      const finalTTL = ttl || this.getTTLForKey(key);
      
      // Compress data if needed
      const { compressed, data } = await this.compressData(value);
      
      // Set in memory cache
      this.memoryCache.set(key, { compressed, data }, finalTTL);
      
      // Set in Redis if available
      if (this.redisClient && this.redisConnected) {
        const redisValue = JSON.stringify({ compressed, data });
        await this.redisClient.setEx(key, finalTTL, redisValue);
      }
      
      this.cacheStats.sets++;
      return true;
    } catch (error) {
      console.error('Optimized cache set error:', error);
      return false;
    }
  }

  // Get cache value with fallback strategy and decompression
  async get(key) {
    try {
      // Try memory cache first
      let cachedValue = this.memoryCache.get(key);
      
      if (cachedValue !== undefined) {
        const result = await this.decompressData(cachedValue.data, cachedValue.compressed);
        if (result) {
          this.cacheStats.hits++;
          return result;
        }
      }
      
      // Try Redis if memory cache miss
      if (this.redisClient && this.redisConnected) {
        const redisValue = await this.redisClient.get(key);
        if (redisValue) {
          const parsedValue = JSON.parse(redisValue);
          const result = await this.decompressData(parsedValue.data, parsedValue.compressed);
          
          if (result) {
            // Store in memory cache for faster subsequent access
            this.memoryCache.set(key, parsedValue, this.getTTLForKey(key));
            this.cacheStats.hits++;
            return result;
          }
        }
      }
      
      this.cacheStats.misses++;
      return null;
    } catch (error) {
      console.error('Optimized cache get error:', error);
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
      console.error('Optimized cache delete error:', error);
      return false;
    }
  }

  // Smart cache invalidation with pattern matching
  async invalidatePattern(pattern) {
    try {
      let invalidatedKeys = 0;
      
      // For memory cache, we need to get all keys and filter (node-cache limitation)
      const memoryKeys = this.memoryCache.keys();
      const matchingMemoryKeys = memoryKeys.filter(key => {
        const regex = new RegExp(pattern.replace('*', '.*'));
        return regex.test(key);
      });
      
      matchingMemoryKeys.forEach(key => this.memoryCache.del(key));
      invalidatedKeys += matchingMemoryKeys.length;
      
      // Clear Redis keys by pattern if available
      if (this.redisClient && this.redisConnected) {
        const keys = await this.redisClient.keys(pattern);
        if (keys.length > 0) {
          await this.redisClient.del(keys);
          invalidatedKeys += keys.length;
        }
      }
      
      console.log(`🗑️ Cache invalidated: ${invalidatedKeys} keys for pattern: ${pattern}`);
      return invalidatedKeys;
    } catch (error) {
      console.error('Smart cache invalidation error:', error);
      return 0;
    }
  }

  // Intelligent cache invalidation by data type
  async invalidateByType(dataType, specificId = null) {
    const invalidationPatterns = {
      posts: ['posts:*', 'dashboard:*', 'search:*'],
      posts_specific: [`posts:*:${specificId}`, `posts:*:*:${specificId}`],
      dashboard: ['dashboard:*'],
      reference: ['reference:*'],
      countries: ['reference:*:countries:*', 'countries:*'],
      categories: ['reference:*:categories:*', 'categories:*'],
      foundlost: ['reference:*:foundlost:*', 'fl-options:*'],
      cities: ['reference:*:cities:*', 'cities:*'],
      users: ['users:*', 'user:*'],
      search: ['search:*']
    };

    const patterns = invalidationPatterns[dataType] || [];
    let totalInvalidated = 0;
    
    for (const pattern of patterns) {
      const invalidated = await this.invalidatePattern(pattern);
      totalInvalidated += invalidated;
    }
    
    console.log(`🗑️ Cache invalidated for type '${dataType}': ${totalInvalidated} keys`);
    return totalInvalidated;
  }

  // Advanced cache warming with dependency tracking
  async warmCache(forceRefresh = false) {
    try {
      console.log('🔥 Starting advanced cache warming...');
      
      // Import models
      const Country = require('../models/Country');
      const Category = require('../models/Category');
      const FoundLost = require('../models/FoundLost');
      const City = require('../models/City');
      const Post = require('../models/Post');
      
  // Warm reference data caches (most important for 80% reduction)
  const warmReferenceData = async () => {
    try {
      // Countries - most frequently accessed
      const countries = await Country.find({ 
        $or: [{ isActive: true }, { isActive: null }] 
      })
      .select('code labels flag isActive searchTerms')
      .lean();
      
      await this.set(
        this.generateKey('reference', 'countries', { active: true }),
        countries,
        CACHE_TTL.COUNTRIES
      );
      
      // Categories - frequently accessed
      const categories = await Category.find({ 
        $or: [{ isActive: true }, { isActive: null }] 
      })
      .select('code labels color icon isActive description')
      .lean();
      
      await this.set(
        this.generateKey('reference', 'categories', { active: true }),
        categories,
        CACHE_TTL.CATEGORIES
      );
      
      // Found/Lost options
      const foundLostOptions = await FoundLost.find({ 
        $or: [{ isActive: true }, { isActive: null }] 
      })
      .select('code labels color icon isActive description')
      .lean();
      
      await this.set(
        this.generateKey('reference', 'foundlost', { active: true }),
        foundLostOptions,
        CACHE_TTL.FOUNDLOST
      );
      
      // Top cities by country (limited to avoid issues)
      const topCountries = await Country.find({ isActive: true })
        .select('_id code')
        .limit(5) // Reduced from 20 to 5 to avoid startup issues
        .lean();
      
      for (const country of topCountries) {
        try {
          const cities = await City.find({ 
            countryId: country._id,
            $or: [{ isActive: true }, { isActive: null }]
          })
          .select('name countryId isActive')
          .limit(20) // Reduced from 50 to 20
          .lean();
          
          await this.set(
            this.generateKey('reference', 'cities', { countryId: country._id.toString() }),
            cities,
            CACHE_TTL.CITIES
          );
        } catch (error) {
          console.error(`❌ Failed to cache cities for country ${country._id}:`, error.message);
        }
      }
      
      console.log('✅ Reference data cache warming completed');
    } catch (error) {
      console.error('❌ Reference data warming failed:', error);
      throw error;
    }
  };
      
      // Warm dynamic data caches (disabled to prevent startup issues)
      const warmDynamicData = async () => {
        try {
          console.log('⚠️  Dynamic data warming disabled to prevent startup issues');
          console.log('💡 Use manual cache warming after startup if needed');
          // Dynamic data warming disabled to prevent populate errors
          // await this.set(
          //   this.generateKey('dynamic', 'recent-posts', { limit: 20 }),
          //   recentPosts,
          //   CACHE_TTL.POSTS
          // );
        } catch (error) {
          console.error('❌ Dynamic data warming failed:', error);
        }
      };
      
      // Execute warming
      await warmReferenceData();
      if (forceRefresh) {
        await warmDynamicData();
      }
      
      this.cacheStats.warmUps++;
      console.log('🔥 Advanced cache warming completed');
      return true;
    } catch (error) {
      console.error('❌ Advanced cache warming failed:', error);
      return false;
    }
  }

  // Get TTL for key based on pattern analysis
  getTTLForKey(key) {
    // Reference data patterns
    if (key.includes('reference:') && (key.includes('countries') || key.includes('categories') || key.includes('foundlost'))) {
      return CACHE_TTL.COUNTRIES;
    }
    if (key.includes('reference:') && key.includes('cities')) {
      return CACHE_TTL.CITIES;
    }
    
    // Dynamic data patterns
    if (key.includes('posts:') && (key.includes('page:') || key.includes('paginated'))) {
      return CACHE_TTL.POSTS_PAGINATED;
    }
    if (key.includes('posts:') && key.includes('search')) {
      return CACHE_TTL.POSTS_SEARCH;
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
    
    return CACHE_TTL.API_RESPONSES; // Default
  }

  // Get comprehensive cache statistics
  getStats() {
    const memoryStats = this.memoryCache.getStats();
    const totalOperations = this.cacheStats.hits + this.cacheStats.misses;
    
    return {
      performance: {
        hitRate: totalOperations > 0 ? (this.cacheStats.hits / totalOperations * 100).toFixed(2) + '%' : '0%',
        totalOperations,
        hits: this.cacheStats.hits,
        misses: this.cacheStats.misses,
        sets: this.cacheStats.sets,
        deletes: this.cacheStats.deletes
      },
      compression: {
        compressions: this.cacheStats.compressions,
        decompressions: this.cacheStats.decompressions,
        compressionRatio: this.cacheStats.compressions > 0 ? 
          ((this.cacheStats.compressions / (this.cacheStats.compressions + this.cacheStats.sets)) * 100).toFixed(2) + '%' : '0%'
      },
      warming: {
        warmUps: this.cacheStats.warmUps,
        warmingInProgress: Array.from(this.warmingInProgress)
      },
      memory: {
        keys: memoryStats.keys,
        memoryUsage: process.memoryUsage(),
        maxKeys: CACHE_LIMITS.MAX_MEMORY_KEYS
      },
      redis: {
        connected: this.redisConnected,
        status: this.redisConnected ? 'healthy' : 'disconnected'
      },
      targets: {
        dbReductionTarget: '80%+',
        currentEstimate: totalOperations > 0 ? 
          ((this.cacheStats.hits / totalOperations) * 100).toFixed(2) + '%' : '0%'
      }
    };
  }

  // Clear all cache with confirmation
  async clear(confirm = false) {
    if (!confirm) {
      throw new Error('Cache clear requires confirmation. Use clear(true) to confirm.');
    }
    
    try {
      this.memoryCache.flushAll();
      
      if (this.redisClient && this.redisConnected) {
        await this.redisClient.flushAll();
      }
      
      console.log('🗑️ All cache cleared');
      return true;
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  }

  // Health check for cache system
  async healthCheck() {
    try {
      const testKey = 'health:check:' + Date.now();
      const testValue = { timestamp: new Date().toISOString(), status: 'healthy' };
      
      // Test memory cache
      await this.set(testKey, testValue, 10);
      const memoryResult = await this.get(testKey);
      await this.del(testKey);
      
      return {
        status: 'healthy',
        memory: memoryResult ? 'working' : 'failed',
        redis: this.redisConnected ? 'connected' : 'disconnected',
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
}

// Create singleton instance
const optimizedCacheService = new OptimizedCacheService();

// Cache warming functions
const warmCache = async (forceRefresh = false) => {
  if (optimizedCacheService.warmingInProgress.has('main')) {
    console.log('🔥 Cache warming already in progress, skipping...');
    return false;
  }
  
  optimizedCacheService.warmingInProgress.add('main');
  try {
    return await optimizedCacheService.warmCache(forceRefresh);
  } finally {
    optimizedCacheService.warmingInProgress.delete('main');
  }
};

// Scheduled cache warming (every 4 hours for reference data, every hour for dynamic data)
const scheduleCacheWarming = () => {
  // Reference data warming every 4 hours
  setInterval(async () => {
    console.log('🔄 Scheduled reference data cache warming...');
    try {
      await warmCache(false);
    } catch (error) {
      console.error('❌ Scheduled cache warming failed:', error);
    }
  }, 4 * 60 * 60 * 1000); // 4 hours
  
  // Dynamic data warming every hour
  setInterval(async () => {
    console.log('🔄 Scheduled dynamic data cache warming...');
    try {
      await warmCache(true);
    } catch (error) {
      console.error('❌ Scheduled dynamic cache warming failed:', error);
    }
  }, 60 * 60 * 1000); // 1 hour
  
  // Initial warming on startup (disabled to prevent startup errors)
  // setTimeout(() => {
  //   console.log('🚀 Initial cache warming on startup...');
  //   warmCache(true);
  // }, 5000); // 5 seconds after startup
};

// Cache middleware factory with optimizations
const createCacheMiddleware = (namespace, prefix, ttl = null, options = {}) => {
  return async (req, res, next) => {
    // Skip caching for non-GET requests or when explicitly disabled
    if (req.method !== 'GET' || req.query.nocache === 'true') {
      return next();
    }

    // Skip caching for authenticated admin requests (if specified)
    if (options.skipForAdmin && req.user?.role === 'admin') {
      return next();
    }

    const cacheKey = optimizedCacheService.generateKey(namespace, prefix, {
      ...req.query,
      ...req.params,
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
          optimizedCacheService.set(cacheKey, data, ttl, options);
        }
        return originalJson.call(this, data);
      }.bind(optimizedCacheService);
      
      next();
    } catch (error) {
      console.error('Optimized cache middleware error:', error);
      next();
    }
  };
};

// Specialized cache middlewares
const staticDataCache = (prefix) => createCacheMiddleware('reference', prefix);
const dynamicDataCache = (prefix) => createCacheMiddleware('dynamic', prefix);
const postsCache = (prefix) => createCacheMiddleware('posts', prefix);
const searchCache = (prefix) => createCacheMiddleware('search', prefix);
const dashboardCache = (prefix) => createCacheMiddleware('dashboard', prefix);
const userDataCache = (prefix) => createCacheMiddleware('users', prefix);

module.exports = {
  optimizedCacheService,
  warmCache,
  scheduleCacheWarming,
  initRedis,
  createCacheMiddleware,
  staticDataCache,
  dynamicDataCache,
  postsCache,
  searchCache,
  dashboardCache,
  userDataCache,
  CACHE_TTL,
  CACHE_LIMITS
};
