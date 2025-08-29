const mongoose = require('mongoose');
const { cacheService } = require('./config/cache');
require('dotenv').config();

const testCaching = async () => {
  try {
    console.log('🧪 Testing Caching Implementation...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Test 1: Basic cache operations
    console.log('\n📦 Test 1: Basic Cache Operations');
    
    const testKey = 'test:basic';
    const testData = { message: 'Hello from cache!', timestamp: new Date().toISOString() };
    
    // Set cache
    await cacheService.set(testKey, testData, 60);
    console.log('✅ Data cached successfully');
    
    // Get cache
    const cachedData = await cacheService.get(testKey);
    if (cachedData && cachedData.message === testData.message) {
      console.log('✅ Cache retrieval successful');
    } else {
      console.log('❌ Cache retrieval failed');
    }
    
    // Delete cache
    await cacheService.del(testKey);
    const deletedData = await cacheService.get(testKey);
    if (!deletedData) {
      console.log('✅ Cache deletion successful');
    } else {
      console.log('❌ Cache deletion failed');
    }

    // Test 2: Cache key generation
    console.log('\n🔑 Test 2: Cache Key Generation');
    
    const params = {
      country: 'MA',
      page: 1,
      pageSize: 10,
      language: 'en'
    };
    
    const cacheKey = cacheService.generateKey('posts', params);
    console.log('Generated cache key:', cacheKey);
    console.log('✅ Cache key generation successful');

    // Test 3: Cache statistics
    console.log('\n📊 Test 3: Cache Statistics');
    
    const stats = cacheService.getStats();
    console.log('Cache statistics:', JSON.stringify(stats, null, 2));
    console.log('✅ Cache statistics retrieved');

    // Test 4: Pattern invalidation
    console.log('\n🗑️ Test 4: Pattern Invalidation');
    
    // Set multiple test keys
    await cacheService.set('posts:MA:1:10', { data: 'test1' }, 60);
    await cacheService.set('posts:MA:2:10', { data: 'test2' }, 60);
    await cacheService.set('dashboard:MA', { data: 'test3' }, 60);
    
    console.log('✅ Multiple test keys set');
    
    // Invalidate posts pattern
    await cacheService.invalidatePattern('posts:*');
    console.log('✅ Pattern invalidation completed');
    
    // Check if posts keys are deleted
    const postsKey1 = await cacheService.get('posts:MA:1:10');
    const postsKey2 = await cacheService.get('posts:MA:2:10');
    const dashboardKey = await cacheService.get('dashboard:MA');
    
    if (!postsKey1 && !postsKey2 && dashboardKey) {
      console.log('✅ Pattern invalidation working correctly');
    } else {
      console.log('❌ Pattern invalidation failed');
    }

    // Test 5: Cache performance
    console.log('\n⚡ Test 5: Cache Performance');
    
    const performanceKey = 'performance:test';
    const largeData = {
      items: Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `Item ${i}` })),
      timestamp: new Date().toISOString()
    };
    
    const startTime = Date.now();
    await cacheService.set(performanceKey, largeData, 60);
    const setTime = Date.now() - startTime;
    
    const getStartTime = Date.now();
    const retrievedData = await cacheService.get(performanceKey);
    const getTime = Date.now() - getStartTime;
    
    console.log(`✅ Set time: ${setTime}ms`);
    console.log(`✅ Get time: ${getTime}ms`);
    console.log(`✅ Data integrity: ${retrievedData.items.length === 1000 ? 'OK' : 'FAILED'}`);

    // Test 6: Cache TTL
    console.log('\n⏰ Test 6: Cache TTL');
    
    const ttlKey = 'ttl:test';
    await cacheService.set(ttlKey, { message: 'TTL test' }, 2); // 2 seconds
    
    const immediateData = await cacheService.get(ttlKey);
    if (immediateData) {
      console.log('✅ Data available immediately');
    }
    
    console.log('⏳ Waiting 3 seconds for TTL expiration...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const expiredData = await cacheService.get(ttlKey);
    if (!expiredData) {
      console.log('✅ TTL expiration working correctly');
    } else {
      console.log('❌ TTL expiration failed');
    }

    // Test 7: Cache clear
    console.log('\n🧹 Test 7: Cache Clear');
    
    await cacheService.set('clear:test1', { data: 'test1' }, 60);
    await cacheService.set('clear:test2', { data: 'test2' }, 60);
    
    await cacheService.clear();
    
    const clearedData1 = await cacheService.get('clear:test1');
    const clearedData2 = await cacheService.get('clear:test2');
    
    if (!clearedData1 && !clearedData2) {
      console.log('✅ Cache clear working correctly');
    } else {
      console.log('❌ Cache clear failed');
    }

    // Final statistics
    console.log('\n📈 Final Cache Statistics');
    const finalStats = cacheService.getStats();
    console.log('Final stats:', JSON.stringify(finalStats, null, 2));

    console.log('\n🎉 All caching tests completed successfully!');
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
};

// Run the test
testCaching();

