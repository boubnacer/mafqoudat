const axios = require('axios');

async function testSearchAPI() {
  try {
    console.log('🧪 Testing Search API...\n');
    
    // Test 1: Search for "Casablanca" (should be in database)
    console.log('1. Testing "Casablanca" search:');
    const response1 = await axios.get('https://mafqoudat-production.up.railway.app/cities/search', {
      params: {
        q: 'Casablanca',
        language: 'en',
        countryCode: 'MA',
        limit: 5
      }
    });
    
    console.log('Status:', response1.status);
    console.log('Data:', JSON.stringify(response1.data, null, 2));
    console.log('');
    
    // Test 2: Search for "Tiflet" (should be from API)
    console.log('2. Testing "Tiflet" search:');
    const response2 = await axios.get('https://mafqoudat-production.up.railway.app/cities/search', {
      params: {
        q: 'Tiflet',
        language: 'en',
        countryCode: 'MA',
        limit: 5
      }
    });
    
    console.log('Status:', response2.status);
    console.log('Data:', JSON.stringify(response2.data, null, 2));
    console.log('');
    
    // Test 3: Search for "Safi" (should be from API)
    console.log('3. Testing "Safi" search:');
    const response3 = await axios.get('https://mafqoudat-production.up.railway.app/cities/search', {
      params: {
        q: 'Safi',
        language: 'en',
        countryCode: 'MA',
        limit: 5
      }
    });
    
    console.log('Status:', response3.status);
    console.log('Data:', JSON.stringify(response3.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testSearchAPI();
