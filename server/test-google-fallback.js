require('dotenv').config();
const axios = require('axios');

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

console.log('🧪 Testing Google Places as Last Resort Fallback\n');
console.log('This test will search for cities that are:');
console.log('  ❌ NOT in database');
console.log('  ❌ NOT in GeoNames');
console.log('  ✅ Only in Google Places\n');

async function testCitySearch(cityName, countryCode) {
  console.log(`${'='.repeat(70)}`);
  console.log(`🔍 Searching: "${cityName}" in ${countryCode}`);
  console.log(`${'='.repeat(70)}`);
  
  try {
    const response = await axios.get(`${API_BASE_URL}/cities/search`, {
      params: { q: cityName, countryCode, language: 'en', limit: 10 }
    });
    
    const data = response.data;
    
    if (data.success) {
      console.log('📊 Source Breakdown:');
      console.log(`   💾 Database: ${data.sources.database}`);
      console.log(`   🗺️  GeoNames: ${data.sources.geonames}`);
      console.log(`   🌐 Google Places: ${data.sources.google}`);
      console.log(`   📍 Total: ${data.total}`);
      
      if (data.sources.google > 0) {
        console.log('\n✅ SUCCESS! Google Places was called as last resort!\n');
        data.data.forEach((city, i) => {
          console.log(`   ${i + 1}. ${city.label} (${city.code}) - Source: ${city.source}`);
        });
      } else if (data.sources.geonames > 0) {
        console.log('\n⚠️  GeoNames found results, Google Places was NOT called (correct behavior)\n');
      } else if (data.sources.database > 0) {
        console.log('\n⚠️  Database found results, APIs were NOT called (correct behavior)\n');
      } else {
        console.log('\n❌ No results from any source\n');
      }
      
      // Show API stats
      if (data.googlePlacesStats) {
        console.log('📈 Google Places Usage:');
        console.log(`   Daily: ${data.googlePlacesStats.daily.requestsUsed}/${data.googlePlacesStats.daily.maxRequests}`);
        console.log(`   Monthly: ${data.googlePlacesStats.monthly.requestsUsed}/${data.googlePlacesStats.monthly.maxRequests}`);
      }
    } else {
      console.log(`❌ Error: ${data.message}`);
    }
    
  } catch (error) {
    console.error(`❌ Request failed: ${error.message}`);
  }
  
  console.log('');
}

(async () => {
  console.log('Starting tests...\n');
  
  // Test 1: A city that might trigger Google Places
  await testCitySearch('Akka', 'MA');
  await new Promise(r => setTimeout(r, 1000));
  
  // Test 2: Another rare city
  await testCitySearch('Tata', 'MA');
  await new Promise(r => setTimeout(r, 1000));
  
  // Test 3: Common city (should use Database or GeoNames, NOT Google)
  await testCitySearch('Casablanca', 'MA');
  
  console.log(`${'='.repeat(70)}`);
  console.log('🎉 Test Complete!');
  console.log('\nExpected behavior:');
  console.log('  ✅ Common cities: Database only');
  console.log('  ✅ Less common: Database + GeoNames only');
  console.log('  ✅ Very rare: Google Places as last resort');
  console.log(`${'='.repeat(70)}\n`);
})();

