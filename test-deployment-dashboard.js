const axios = require('axios');

async function testDeploymentDashboard() {
  try {
    const apiUrl = 'https://mafqoudat-production.up.railway.app';
    const moroccoCountryId = '68a4b54ab46524c54c553ca9';
    
    console.log('Testing deployment dashboard API...');
    console.log('API URL:', apiUrl);
    console.log('Country ID:', moroccoCountryId);
    
    // First, test the FoundLost options endpoint
    console.log('\n1. Testing FoundLost options endpoint...');
    try {
      const flResponse = await axios.get(`${apiUrl}/dependencies/foundlost-options`);
      console.log('FoundLost options status:', flResponse.status);
      console.log('FoundLost options data:', JSON.stringify(flResponse.data, null, 2));
    } catch (flError) {
      console.error('FoundLost options error:', flError.response?.data || flError.message);
    }
    
    // Test the dashboard endpoint
    console.log('\n2. Testing dashboard endpoint...');
    try {
      const dashboardResponse = await axios.get(`${apiUrl}/dashboard?currentCountry=${moroccoCountryId}`);
      console.log('Dashboard status:', dashboardResponse.status);
      console.log('Dashboard data:', JSON.stringify(dashboardResponse.data, null, 2));
    } catch (dashboardError) {
      console.error('Dashboard error:', dashboardError.response?.data || dashboardError.message);
    }
    
    // Test posts endpoint to see if there are any posts
    console.log('\n3. Testing posts endpoint...');
    try {
      const postsResponse = await axios.get(`${apiUrl}/posts?currentCountry=${moroccoCountryId}&page=1&pageSize=5`);
      console.log('Posts status:', postsResponse.status);
      console.log('Posts count:', postsResponse.data?.ids?.length || 0);
      if (postsResponse.data?.ids?.length > 0) {
        console.log('First post:', JSON.stringify(postsResponse.data.entities[postsResponse.data.ids[0]], null, 2));
      }
    } catch (postsError) {
      console.error('Posts error:', postsError.response?.data || postsError.message);
    }
    
  } catch (error) {
    console.error('General error:', error.message);
  }
}

testDeploymentDashboard();
