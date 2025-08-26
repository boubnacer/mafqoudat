const axios = require('axios');

async function testCountriesAPI() {
  console.log('🌍 Testing Countries API...\n');

  const API_BASE_URL = 'https://mafqoudat-production.up.railway.app';

  try {
    console.log('Testing /countries endpoint...');
    
    const response = await axios.get(`${API_BASE_URL}/countries`, {
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

    console.log(`✅ Countries API: Status ${response.status}`);
    console.log(`   Success: ${response.data?.success}`);
    console.log(`   Data count: ${response.data?.data?.length || 'N/A'}`);
    
    if (response.data?.data && response.data.data.length > 0) {
      console.log('\n📋 Countries returned:');
      response.data.data.forEach((country, index) => {
        console.log(`${index + 1}. ID: ${country._id} | Code: ${country.code} | Name: ${country.names?.en || country.labels?.en} | isActive: ${country.isActive}`);
      });
      
      // Look for Morocco specifically
      const morocco = response.data.data.find(c => c.code === 'MA');
      if (morocco) {
        console.log('\n🇲🇦 Morocco found:');
        console.log(`   ID: ${morocco._id}`);
        console.log(`   Code: ${morocco.code}`);
        console.log(`   Name: ${morocco.names?.en || morocco.labels?.en}`);
        console.log(`   isActive: ${morocco.isActive}`);
      } else {
        console.log('\n❌ Morocco (MA) not found in the response');
      }
    } else {
      console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
    }
    
  } catch (error) {
    console.log(`❌ Countries API: Error ${error.response?.status || error.code}`);
    if (error.response?.data) {
      console.log(`   Error data: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.log(`   Message: ${error.message}`);
    }
  }
}

testCountriesAPI().catch(console.error);
