const axios = require('axios');

async function testDashboardEndpoint() {
  try {
    const apiUrl = 'https://mafqoudat-production.up.railway.app';
    const moroccoCountryId = '68a4b54ab46524c54c553ca9';
    
    console.log('🔍 Testing dashboard endpoint accessibility...');
    console.log('API URL:', apiUrl);
    console.log('Country ID:', moroccoCountryId);
    
    // Test 1: Check if server is responding
    console.log('\n1️⃣ Testing server health...');
    try {
      const healthResponse = await axios.get(`${apiUrl}/`, { timeout: 5000 });
      console.log('✅ Server is responding');
      console.log('Server info:', healthResponse.data);
    } catch (error) {
      console.log('❌ Server health check failed:', error.message);
    }
    
    // Test 2: Check if dashboard endpoint exists
    console.log('\n2️⃣ Testing dashboard endpoint...');
    try {
      const dashboardResponse = await axios.get(`${apiUrl}/dashboard?currentCountry=${moroccoCountryId}`, { 
        timeout: 10000,
        validateStatus: function (status) {
          return status < 500; // Accept all status codes less than 500
        }
      });
      
      console.log('✅ Dashboard endpoint is accessible!');
      console.log('Status:', dashboardResponse.status);
      console.log('Response:', dashboardResponse.data);
      
    } catch (error) {
      console.log('❌ Dashboard endpoint failed');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data || error.message);
      
      if (error.response?.status === 404) {
        console.log('🔍 404 Error - Dashboard route not found');
        console.log('This suggests the deployment might not be complete or there\'s a routing issue');
      }
    }
    
    // Test 3: Check if posts endpoint works (for comparison)
    console.log('\n3️⃣ Testing posts endpoint for comparison...');
    try {
      const postsResponse = await axios.get(`${apiUrl}/posts?page=1&pageSize=5`, { timeout: 10000 });
      console.log('✅ Posts endpoint working');
      console.log('Posts count:', postsResponse.data?.ids?.length || 0);
    } catch (error) {
      console.log('❌ Posts endpoint failed:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ General Error:', error.message);
  }
}

testDashboardEndpoint();
