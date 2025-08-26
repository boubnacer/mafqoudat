const axios = require('axios');

async function testCitiesPublicEndpoint() {
  console.log('🧪 Testing Cities Public Endpoint...\n');

  const API_BASE_URL = 'https://mafqoudat-production.up.railway.app';

  // Use the correct Morocco ID (the one that has cities)
  const countryId = '68a4b54ab46524c54c553ca9'; // Morocco ID

  try {
    console.log(`Testing /cities-public endpoint with countryId: ${countryId}`);
    
    const response = await axios.get(`${API_BASE_URL}/cities-public`, {
      timeout: 15000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      params: {
        countryId: countryId,
        language: 'en'
      }
    });

    console.log(`✅ Cities Public: Status ${response.status}`);
    console.log(`   Success: ${response.data?.success}`);
    console.log(`   Data count: ${response.data?.data?.length || 'N/A'}`);
    
    if (response.data?.data && response.data.data.length > 0) {
      console.log(`   Sample city: ${JSON.stringify(response.data.data[0], null, 2)}`);
    } else {
      console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
    }
    
  } catch (error) {
    console.log(`❌ Cities Public: Error ${error.response?.status || error.code}`);
    if (error.response?.data) {
      console.log(`   Error data: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.log(`   Message: ${error.message}`);
    }
  }
}

testCitiesPublicEndpoint().catch(console.error);
