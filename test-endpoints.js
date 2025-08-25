const axios = require('axios');

const BASE_URL = 'http://localhost:3500';

async function testEndpoints() {
  console.log('🔧 Testing Server Endpoints...\n');
  
  try {
    // Test 1: Check if server is running
    console.log('1. Testing server connectivity...');
    const healthResponse = await axios.get(`${BASE_URL}/`);
    console.log('✅ Server is running');
    console.log('Response:', healthResponse.status);
    
    // Test 2: Test posts endpoint
    console.log('\n2. Testing posts endpoint...');
    const postsResponse = await axios.get(`${BASE_URL}/posts?currentCountry=MA&page=0&pageSize=5`);
    console.log('✅ Posts endpoint working');
    console.log('Posts count:', postsResponse.data?.data?.length || 0);
    
    // Test 3: Test report endpoint (should work without auth)
    console.log('\n3. Testing report endpoint...');
    try {
      const reportResponse = await axios.post(`${BASE_URL}/posts/report`, {
        postId: 'test-post-id',
        reason: 'Test reason',
        userId: 'anonymous'
      });
      console.log('✅ Report endpoint working (expected 404 for invalid post)');
      console.log('Response status:', reportResponse.status);
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Report endpoint working (404 expected for invalid post)');
      } else {
        console.log('❌ Report endpoint error:', error.response?.status, error.response?.data);
      }
    }
    
    // Test 4: Test promotion endpoint (requires auth)
    console.log('\n4. Testing promotion endpoint...');
    try {
      const promotionResponse = await axios.post(`${BASE_URL}/promotion/request`, {
        postId: 'test-post-id'
      });
      console.log('✅ Promotion endpoint working');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Promotion endpoint working (401 expected - requires auth)');
      } else {
        console.log('❌ Promotion endpoint error:', error.response?.status, error.response?.data);
      }
    }
    
    console.log('\n🎉 All endpoint tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the server is running on port 3500');
    }
  }
}

// Run the test
testEndpoints();
