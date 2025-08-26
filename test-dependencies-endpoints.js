const axios = require('axios');

const API_BASE_URL = 'https://mafqoudat-production.up.railway.app';

async function testEndpoints() {
  console.log('🧪 Testing Dependencies Endpoints...\n');

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
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log(`✅ ${endpoint.name}: Status ${response.status}`);
      console.log(`   Data length: ${response.data?.data?.length || response.data?.length || 'N/A'}`);
      
      if (response.data?.data && response.data.data.length > 0) {
        console.log(`   Sample item: ${JSON.stringify(response.data.data[0], null, 2)}`);
      }
      
    } catch (error) {
      console.log(`❌ ${endpoint.name}: Error ${error.response?.status || error.code}`);
      console.log(`   Message: ${error.response?.data?.message || error.message}`);
    }
    console.log('');
  }
}

testEndpoints().catch(console.error);
