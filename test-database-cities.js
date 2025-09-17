const axios = require('axios');

async function testDatabaseCities() {
  try {
    console.log('🧪 Testing Database Cities...\n');
    
    // Test 1: Get all cities for Morocco
    console.log('1. Getting all cities for Morocco:');
    const response1 = await axios.get('https://mafqoudat-production.up.railway.app/cities-public', {
      params: {
        countryId: '68b708a085dd243c40a90809', // Morocco ID from your logs
        language: 'en'
      }
    });
    
    console.log('Status:', response1.status);
    console.log('Total cities:', response1.data.data?.length || 0);
    
    if (response1.data.data && response1.data.data.length > 0) {
      console.log('First 5 cities:');
      response1.data.data.slice(0, 5).forEach((city, index) => {
        console.log(`${index + 1}. ${city.label || city.name} (${city.code})`);
      });
    }
    console.log('');
    
    // Test 2: Search for "Casablanca" in database
    console.log('2. Searching for "Casablanca" in database:');
    const response2 = await axios.get('https://mafqoudat-production.up.railway.app/cities/search-name', {
      params: {
        query: 'Casablanca',
        countryId: '68b708a085dd243c40a90809',
        limit: 5
      }
    });
    
    console.log('Status:', response2.status);
    console.log('Results:', response2.data.data?.length || 0);
    if (response2.data.data && response2.data.data.length > 0) {
      console.log('Found:', response2.data.data[0]);
    }
    console.log('');
    
    // Test 3: Search for "Safi" in database
    console.log('3. Searching for "Safi" in database:');
    const response3 = await axios.get('https://mafqoudat-production.up.railway.app/cities/search-name', {
      params: {
        query: 'Safi',
        countryId: '68b708a085dd243c40a90809',
        limit: 5
      }
    });
    
    console.log('Status:', response3.status);
    console.log('Results:', response3.data.data?.length || 0);
    if (response3.data.data && response3.data.data.length > 0) {
      console.log('Found:', response3.data.data[0]);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testDatabaseCities();