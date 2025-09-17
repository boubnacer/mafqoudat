require('dotenv').config({ path: './server/.env' });
const geonamesService = require('./server/services/geonamesService');

async function testBackendService() {
  try {
    console.log('🧪 Testing Backend GeoNames Service...\n');
    
    // Test 1: Search for "Safi"
    console.log('1. Testing "Safi" search:');
    const result1 = await geonamesService.searchCities('Safi', 'MA', 'en');
    console.log('Results:', result1.length);
    if (result1.length > 0) {
      console.log('First result:', JSON.stringify(result1[0], null, 2));
    }
    console.log('');
    
    // Test 2: Search for "Tiflet"
    console.log('2. Testing "Tiflet" search:');
    const result2 = await geonamesService.searchCities('Tiflet', 'MA', 'en');
    console.log('Results:', result2.length);
    if (result2.length > 0) {
      console.log('First result:', JSON.stringify(result2[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testBackendService();
