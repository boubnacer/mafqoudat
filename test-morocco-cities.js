const axios = require('axios');

async function testMoroccoCities() {
  console.log('🇲🇦 Testing Morocco Cities...\n');

  const API_BASE_URL = 'https://mafqoudat-production.up.railway.app';

  try {
    // First, get all countries to find Morocco
    console.log('1. Getting all countries...');
    const countriesResponse = await axios.get(`${API_BASE_URL}/countries`, {
      params: { language: 'en', active: 'true' }
    });

    const morocco = countriesResponse.data.data.find(c => c.code === 'MA');
    if (!morocco) {
      console.log('❌ Morocco not found in countries list');
      return;
    }

    console.log(`✅ Morocco found: ${morocco.names?.en} (${morocco._id})`);

    // Now test cities for Morocco
    console.log('\n2. Testing cities for Morocco...');
    const citiesResponse = await axios.get(`${API_BASE_URL}/cities-public`, {
      params: {
        countryId: morocco._id,
        language: 'en'
      }
    });

    console.log(`✅ Cities response: ${citiesResponse.status}`);
    console.log(`   Success: ${citiesResponse.data?.success}`);
    console.log(`   Data count: ${citiesResponse.data?.data?.length || 'N/A'}`);
    
    if (citiesResponse.data?.data && citiesResponse.data.data.length > 0) {
      console.log('\n📋 Cities found:');
      citiesResponse.data.data.forEach((city, index) => {
        console.log(`${index + 1}. ${city.label} (${city.code})`);
      });
    } else {
      console.log(`   Response: ${JSON.stringify(citiesResponse.data, null, 2)}`);
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

testMoroccoCities().catch(console.error);
