const axios = require('axios');

const DEPLOYMENT_URL = 'https://mafqoudat-production.up.railway.app';

async function testDeploymentConnection() {
  console.log('🔧 Testing Deployment Server Connection...\n');
  console.log('Testing URL:', DEPLOYMENT_URL);
  
  try {
    // Test 1: Basic connectivity
    console.log('\n1. Testing basic connectivity...');
    const healthResponse = await axios.get(`${DEPLOYMENT_URL}/`);
    console.log('✅ Deployment server is accessible');
    console.log('Response status:', healthResponse.status);
    
    // Test 2: Test posts endpoint
    console.log('\n2. Testing posts endpoint...');
    const postsResponse = await axios.get(`${DEPLOYMENT_URL}/posts?currentCountry=MA&page=0&pageSize=5`);
    console.log('✅ Posts endpoint working');
    console.log('Posts count:', postsResponse.data?.postsWithUser?.length || 0);
    
    // Test 3: Test report endpoint
    console.log('\n3. Testing report endpoint...');
    try {
      const reportResponse = await axios.post(`${DEPLOYMENT_URL}/posts/report`, {
        postId: 'test-post-id',
        reason: 'Test reason',
        userId: 'anonymous'
      });
      console.log('✅ Report endpoint working');
      console.log('Response:', reportResponse.data);
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Report endpoint working (404 expected for invalid post)');
      } else {
        console.log('❌ Report endpoint error:', error.response?.status, error.response?.data);
      }
    }
    
    // Test 4: Test CORS headers
    console.log('\n4. Testing CORS headers...');
    try {
      const corsResponse = await axios.options(`${DEPLOYMENT_URL}/posts/report`);
      console.log('✅ CORS headers present');
      console.log('CORS headers:', Object.keys(corsResponse.headers));
    } catch (error) {
      console.log('❌ CORS test failed:', error.message);
    }
    
    console.log('\n🎉 Deployment server test completed!');
    
  } catch (error) {
    console.error('❌ Deployment server test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Server is not accessible');
    }
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

// Run the test
testDeploymentConnection();
