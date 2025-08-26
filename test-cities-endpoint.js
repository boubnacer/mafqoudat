const axios = require('axios');

async function testCitiesEndpoint() {
  console.log('🧪 Testing Cities Endpoint...\n');

  const API_BASE_URL = 'https://mafqoudat-production.up.railway.app';

  // First, get a country ID to test with
  try {
    console.log('1. Getting countries to find a country ID...');
    const countriesResponse = await axios.get(`${API_BASE_URL}/countries`, {
      timeout: 15000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (countriesResponse.data?.data && countriesResponse.data.data.length > 0) {
      const countryId = countriesResponse.data.data[0]._id;
      console.log(`✅ Found country ID: ${countryId}`);
      
      // Now test cities endpoint with this country ID
      console.log('\n2. Testing cities endpoint...');
      const citiesResponse = await axios.get(`${API_BASE_URL}/dependencies/cities`, {
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

      console.log(`✅ Cities: Status ${citiesResponse.status}`);
      console.log(`   Data count: ${citiesResponse.data?.data?.length || 'N/A'}`);
      
      if (citiesResponse.data?.data && citiesResponse.data.data.length > 0) {
        console.log(`   Sample city: ${JSON.stringify(citiesResponse.data.data[0], null, 2)}`);
      }
      
    } else {
      console.log('❌ No countries found');
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.response?.status || error.code}`);
    if (error.response?.data) {
      console.log(`   Error data: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.log(`   Message: ${error.message}`);
    }
  }
}

testCitiesEndpoint().catch(console.error);
