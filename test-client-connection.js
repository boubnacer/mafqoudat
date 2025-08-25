const axios = require('axios');

const BASE_URL = 'http://localhost:3500';

async function testClientConnection() {
  console.log('🔧 Testing Client-Server Connection...\n');
  
  try {
    // Test 1: Basic connectivity
    console.log('1. Testing basic connectivity...');
    const healthResponse = await axios.get(`${BASE_URL}/`);
    console.log('✅ Server is accessible');
    console.log('Response status:', healthResponse.status);
    
    // Test 2: Test report endpoint with a real post ID
    console.log('\n2. Testing report endpoint with real data...');
    
    // First, get some posts to get a real post ID
    const postsResponse = await axios.get(`${BASE_URL}/posts?currentCountry=MA&page=0&pageSize=1`);
    console.log('Posts response status:', postsResponse.status);
    
    if (postsResponse.data?.postsWithUser?.length > 0) {
      const postId = postsResponse.data.postsWithUser[0]._id;
      console.log('Found post ID:', postId);
      
      // Test report endpoint with real post ID
      try {
        const reportResponse = await axios.post(`${BASE_URL}/posts/report`, {
          postId: postId,
          reason: 'Test reason for debugging',
          userId: 'anonymous'
        });
        console.log('✅ Report endpoint working with real post ID');
        console.log('Response:', reportResponse.data);
      } catch (error) {
        console.log('❌ Report endpoint error with real post ID:');
        console.log('Status:', error.response?.status);
        console.log('Data:', error.response?.data);
      }
    } else {
      console.log('No posts found to test with');
    }
    
    // Test 3: Test CORS headers
    console.log('\n3. Testing CORS headers...');
    const corsResponse = await axios.options(`${BASE_URL}/posts/report`);
    console.log('CORS headers:', corsResponse.headers);
    
    console.log('\n🎉 Connection test completed!');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Server is not running on port 3500');
    }
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

// Run the test
testClientConnection();
