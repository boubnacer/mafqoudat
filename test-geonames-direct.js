const axios = require('axios');

async function testGeoNamesDirect() {
  try {
    console.log('🧪 Testing GeoNames API Directly...\n');
    
    const GEONAMES_USERNAME = 'mafqoudatGeo';
    const GEONAMES_API_URL = 'http://api.geonames.org';
    
      // Test 1: Search for "Safi" in Morocco (using service parameters)
      console.log('1. Searching for "Safi" in Morocco (service params):');
      const response1 = await axios.get(`${GEONAMES_API_URL}/searchJSON`, {
        params: {
          q: 'Safi',
          country: 'MA',
          featureClass: 'P',
          featureCode: 'PPL,PPLA,PPLA2,PPLA3,PPLA4,PPLC',
          maxRows: 20,
          username: GEONAMES_USERNAME,
          style: 'FULL'
        }
      });
    
    console.log('Status:', response1.status);
    console.log('Results:', response1.data.geonames?.length || 0);
    if (response1.data.geonames && response1.data.geonames.length > 0) {
      console.log('First result:', response1.data.geonames[0]);
    }
    console.log('');
    
    // Test 2: Search for "Tiflet" in Morocco
    console.log('2. Searching for "Tiflet" in Morocco:');
    const response2 = await axios.get(`${GEONAMES_API_URL}/searchJSON`, {
      params: {
        q: 'Tiflet',
        country: 'MA',
        lang: 'en',
        username: GEONAMES_USERNAME,
        maxRows: 10,
        featureClass: 'P'
      }
    });
    
    console.log('Status:', response2.status);
    console.log('Results:', response2.data.geonames?.length || 0);
    if (response2.data.geonames && response2.data.geonames.length > 0) {
      console.log('First result:', response2.data.geonames[0]);
    }
    console.log('');
    
    // Test 3: Search for "Casablanca" in Morocco
    console.log('3. Searching for "Casablanca" in Morocco:');
    const response3 = await axios.get(`${GEONAMES_API_URL}/searchJSON`, {
      params: {
        q: 'Casablanca',
        country: 'MA',
        lang: 'en',
        username: GEONAMES_USERNAME,
        maxRows: 10,
        featureClass: 'P'
      }
    });
    
    console.log('Status:', response3.status);
    console.log('Results:', response3.data.geonames?.length || 0);
    if (response3.data.geonames && response3.data.geonames.length > 0) {
      console.log('First result:', response3.data.geonames[0]);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testGeoNamesDirect();
