require('dotenv').config();
const { cacheService, initRedis } = require('../config/cache');

const clearAllCache = async () => {
  try {
    console.log('🔄 Starting cache clearing process...');
    console.log('🔄 Environment check - REDIS_URL:', process.env.REDIS_URL ? 'Set' : 'Not set');
    console.log('🔄 Initializing Redis connection...');
    await initRedis();
    
    console.log('🗑️  Clearing regular cache...');
    await cacheService.invalidatePattern('categories*');
    await cacheService.invalidatePattern('posts*');
    await cacheService.invalidatePattern('static*');
    await cacheService.clear();
    
    console.log('🗑️  Attempting to clear optimized cache...');
    try {
      // Try to clear optimized cache if available
      const { optimizedCacheService } = require('../config/optimizedCache');
      await optimizedCacheService.invalidatePattern('categories*');
      await optimizedCacheService.invalidatePattern('posts*');
      await optimizedCacheService.clear(true);
      console.log('✅ Optimized cache cleared');
    } catch (optimizedError) {
      console.log('⚠️  Optimized cache not available or error:', optimizedError.message);
    }
    
    console.log('✅ All cache cleared successfully!');
    
    // Get cache stats
    const stats = cacheService.getStats();
    console.log('📊 Cache stats:', stats);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    process.exit(1);
  }
};

clearAllCache();