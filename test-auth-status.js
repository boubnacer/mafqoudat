const axios = require('axios');

const DEPLOYMENT_URL = 'https://mafqoudat-production.up.railway.app';

async function testAuthStatus() {
  console.log('🔍 Testing Authentication Status...\\n');
  console.log('Testing URL:', DEPLOYMENT_URL);
  
  try {
    // Test 1: Check if server is running
    console.log('\\n1. Checking server health...');
    const healthResponse = await axios.get(`${DEPLOYMENT_URL}/`);
    console.log('✅ Server is healthy');
    
    // Test 2: Check if there are any users in the database
    console.log('\\n2. Checking users endpoint (should require auth)...');
    try {
      const usersResponse = await axios.get(`${DEPLOYMENT_URL}/users`);
      console.log('❌ Users endpoint accessible without auth (this is wrong)');
      console.log('Users count:', usersResponse.data?.length || 0);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Users endpoint properly protected (401 Unauthorized)');
      } else {
        console.log('❌ Unexpected error:', error.response?.status, error.response?.data);
      }
    }
    
    // Test 3: Test report endpoint without auth (should fail)
    console.log('\\n3. Testing report endpoint without authentication...');
    try {
      const reportResponse = await axios.post(`${DEPLOYMENT_URL}/posts/report`, {
        postId: '507f1f77bcf86cd799439011',
        reason: 'Test reason'
      });
      console.log('❌ Report endpoint accessible without auth (this is wrong)');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Report endpoint properly protected (401 Unauthorized)');
      } else if (error.response?.status === 403) {
        console.log('✅ Report endpoint properly protected (403 Forbidden)');
      } else {
        console.log('❌ Unexpected error:', error.response?.status, error.response?.data);
      }
    }
    
    // Test 4: Check if there are any posts to test with
    console.log('\\n4. Checking posts availability...');
    const postsResponse = await axios.get(`${DEPLOYMENT_URL}/posts?currentCountry=MA&page=0&pageSize=5`);
    console.log('Posts count:', postsResponse.data?.postsWithUser?.length || 0);
    
    if (postsResponse.data?.postsWithUser?.length > 0) {
      console.log('✅ Posts available for testing');
      const post = postsResponse.data.postsWithUser[0];
      console.log('Sample post ID:', post._id);
    } else {
      console.log('❌ No posts available for testing');
    }
    
    console.log('\\n🎉 Authentication status test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the server is running');
    }
  }
}

// Run the test
testAuthStatus();
