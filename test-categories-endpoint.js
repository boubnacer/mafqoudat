const axios = require('axios');

async function testCategoriesEndpoint() {
  console.log('🧪 Testing Categories Endpoint...\n');

  const API_BASE_URL = 'https://mafqoudat-production.up.railway.app';

  try {
    console.log('Testing /categories endpoint...');
    const response = await axios.get(`${API_BASE_URL}/categories`, {
      timeout: 15000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      params: {
        language: 'en',
        active: 'true'
      }
    });

    console.log(`✅ Categories: Status ${response.status}`);
    console.log(`   Data count: ${response.data?.data?.length || 'N/A'}`);
    
    if (response.data?.data && response.data.data.length > 0) {
      console.log(`   Sample category: ${JSON.stringify(response.data.data[0], null, 2)}`);
    }
    
  } catch (error) {
    console.log(`❌ Categories: Error ${error.response?.status || error.code}`);
    if (error.response?.data) {
      console.log(`   Error data: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.log(`   Message: ${error.message}`);
    }
  }
}

testCategoriesEndpoint().catch(console.error);
