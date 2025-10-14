// File: server/scripts/clearCache.js
require('dotenv').config();
const { cacheService, initRedis } = require('../config/cache');

const clearAllCache = async () => {
  try {
    console.log('🔄 Initializing Redis connection...');
    await initRedis();
    
    console.log('🗑️  Clearing categories cache...');
    await cacheService.invalidatePattern('categories*');
    
    console.log('🗑️  Clearing posts cache...');
    await cacheService.invalidatePattern('posts*');
    
    console.log('🗑️  Clearing all static data cache...');
    await cacheService.invalidatePattern('static*');
    
    console.log('🗑️  Clearing all cache...');
    await cacheService.clear();
    
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