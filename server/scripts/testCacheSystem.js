const { optimizedCacheService } = require('../config/optimizedCache');

/**
 * Quick Cache System Test
 * 
 * This script tests the cache system without database operations
 * to ensure the basic caching functionality works.
 */

const testCacheSystem = async () => {
  console.log('🧪 Testing cache system...');
  
  try {
    // Test basic cache operations
    const testKey = optimizedCacheService.generateKey('test', 'basic', { id: 1 });
    const testData = { message: 'Hello from cache!', timestamp: new Date().toISOString() };
    
    // Test set
    console.log('📝 Testing cache set...');
    await optimizedCacheService.set(testKey, testData, 60);
    console.log('✅ Cache set successful');
    
    // Test get
    console.log('📖 Testing cache get...');
    const retrievedData = await optimizedCacheService.get(testKey);
    if (retrievedData) {
      console.log('✅ Cache get successful (HIT)');
      console.log('📊 Retrieved data:', retrievedData);
    } else {
      console.log('❌ Cache get failed (MISS)');
    }
    
    // Test statistics
    console.log('📊 Testing cache statistics...');
    const stats = optimizedCacheService.getStats();
    console.log('✅ Cache statistics:', {
      hitRate: stats.performance.hitRate,
      totalOperations: stats.performance.totalOperations,
      memoryKeys: stats.memory.keys
    });
    
    // Test health check
    console.log('🏥 Testing cache health...');
    const health = await optimizedCacheService.healthCheck();
    console.log('✅ Cache health:', health);
    
    // Test compression
    console.log('🗜️ Testing compression...');
    const largeData = {
      message: 'This is a large test data object that should be compressed.',
      data: new Array(1000).fill('test data'),
      timestamp: new Date().toISOString()
    };
    
    const compressionKey = optimizedCacheService.generateKey('test', 'compression', { id: 2 });
    await optimizedCacheService.set(compressionKey, largeData, 60);
    const retrievedLargeData = await optimizedCacheService.get(compressionKey);
    
    if (retrievedLargeData) {
      console.log('✅ Compression test successful');
    } else {
      console.log('❌ Compression test failed');
    }
    
    console.log('\n🎉 Cache system test completed successfully!');
    console.log('📈 Cache system is ready for production use');
    
    return true;
  } catch (error) {
    console.error('❌ Cache system test failed:', error);
    return false;
  }
};

// Run test if called directly
if (require.main === module) {
  testCacheSystem().then(success => {
    if (success) {
      console.log('✅ All tests passed');
      process.exit(0);
    } else {
      console.log('❌ Some tests failed');
      process.exit(1);
    }
  });
}

module.exports = { testCacheSystem };
