const axios = require('axios');

// Test the API endpoints to see if they work
async function testAPIEndpoints() {
  console.log('🧪 Testing API endpoints with Railway deployment...\n');

  const API_BASE_URL = 'https://mafqoudat-production.up.railway.app';

  const endpoints = [
    { name: 'Countries', url: '/countries' },
    { name: 'Categories', url: '/categories' },
    { name: 'Found/Lost Options', url: '/floptions' },
    { name: 'Health Check', url: '/health' }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.name}...`);
      const response = await axios.get(`${API_BASE_URL}${endpoint.url}`, {
        timeout: 15000,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log(`✅ ${endpoint.name}: Status ${response.status}`);
      
      if (response.data?.data) {
        console.log(`   Data count: ${response.data.data.length}`);
        if (response.data.data.length > 0) {
          console.log(`   Sample: ${JSON.stringify(response.data.data[0], null, 2)}`);
        }
      } else if (response.data) {
        console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
      }
      
    } catch (error) {
      console.log(`❌ ${endpoint.name}: Error ${error.response?.status || error.code}`);
      if (error.response?.data) {
        console.log(`   Error data: ${JSON.stringify(error.response.data, null, 2)}`);
      } else {
        console.log(`   Message: ${error.message}`);
      }
    }
    console.log('');
  }
}

testAPIEndpoints().catch(console.error);
