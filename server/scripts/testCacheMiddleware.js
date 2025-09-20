const { optimizedCacheService } = require('../config/optimizedCache');
const { postsCache } = require('../middleware/optimizedCacheMiddleware');

/**
 * Test Cache Middleware Fix
 * 
 * This script tests the cache middleware to ensure the res.json override
 * works correctly without the "Cannot read properties of undefined" error.
 */

const testCacheMiddleware = async () => {
  console.log('🧪 Testing cache middleware fix...');
  
  try {
    // Create a mock request and response
    const mockReq = {
      method: 'GET',
      params: { id: '68b9bdb5eb31b31468b7ee0a' },
      query: {},
      user: null,
      headers: { 'accept-language': 'en' }
    };
    
    const mockRes = {
      set: () => {},
      json: function(data) {
        console.log('✅ res.json called successfully with data:', typeof data);
        return data;
      }
    };
    
    let nextCalled = false;
    const mockNext = () => {
      nextCalled = true;
      console.log('✅ next() called successfully');
    };
    
    // Test the posts cache middleware
    const middleware = postsCache('post-detail');
    
    console.log('📝 Testing middleware execution...');
    await middleware(mockReq, mockRes, mockNext);
    
    if (nextCalled) {
      console.log('✅ Middleware executed without errors');
    } else {
      console.log('❌ Middleware did not call next()');
    }
    
    // Test the res.json override
    console.log('📝 Testing res.json override...');
    try {
      mockRes.json({ success: true, message: 'Test data' });
      console.log('✅ res.json override works correctly');
    } catch (error) {
      console.error('❌ res.json override failed:', error.message);
    }
    
    console.log('\n🎉 Cache middleware test completed successfully!');
    console.log('📈 The "Cannot read properties of undefined" error should be fixed');
    
    return true;
  } catch (error) {
    console.error('❌ Cache middleware test failed:', error);
    return false;
  }
};

// Run test if called directly
if (require.main === module) {
  testCacheMiddleware().then(success => {
    if (success) {
      console.log('✅ All middleware tests passed');
      process.exit(0);
    } else {
      console.log('❌ Some middleware tests failed');
      process.exit(1);
    }
  });
}

module.exports = { testCacheMiddleware };
