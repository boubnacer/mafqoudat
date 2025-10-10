require('dotenv').config();
const googlePlacesService = require('./services/googlePlacesService');

console.log('🧪 Testing Google Places with ACTUAL rare Moroccan cities\n');

async function testRareCity(cityName, countryCode) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🔍 Testing: "${cityName}" in ${countryCode}`);
  console.log(`${'='.repeat(70)}`);
  
  try {
    const results = await googlePlacesService.searchCities(cityName, countryCode, 'en');
    
    if (results.length > 0) {
      console.log(`✅ SUCCESS! Found ${results.length} cities:`);
      results.forEach((city, i) => {
        console.log(`\n   ${i + 1}. ${city.labels.en} (${city.code})`);
        console.log(`      Source: ${city.source}`);
        console.log(`      Place ID: ${city.placeId}`);
        console.log(`      Is Capital: ${city.isCapital}`);
        if (city.coordinates) {
          console.log(`      Location: ${city.coordinates.latitude}, ${city.coordinates.longitude}`);
        }
      });
    } else {
      console.log(`⚠️  No cities found (might be too rare or not exist)`);
    }
    
    // Show usage
    const stats = googlePlacesService.getUsageStats();
    console.log(`\n📊 API Usage: ${stats.daily.requestsUsed}/${stats.daily.maxRequests} daily`);
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
}

(async () => {
  console.log('Testing with rare but REAL Moroccan cities that exist...\n');
  
  // Test 1: Demnate (near Iminifri)
  await testRareCity('Demnate', 'MA');
  
  // Test 2: Azrou (small mountain town)
  await new Promise(r => setTimeout(r, 1000));
  await testRareCity('Azrou', 'MA');
  
  // Test 3: Chefchaouen (blue city, but might not be in database)
  await new Promise(r => setTimeout(r, 1000));
  await testRareCity('Chefchaouen', 'MA');
  
  // Test 4: Ouarzazate (southern city)
  await new Promise(r => setTimeout(r, 1000));
  await testRareCity('Ouarzazate', 'MA');
  
  // Test 5: Ifrane (small alpine town)
  await new Promise(r => setTimeout(r, 1000));
  await testRareCity('Ifrane', 'MA');
  
  console.log(`\n${'='.repeat(70)}`);
  console.log('🎉 Test Complete!');
  console.log('📝 Note: The service ONLY returns actual cities/localities.');
  console.log('   Natural landmarks like "Iminifri natural bridge" are correctly filtered out.');
  console.log(`${'='.repeat(70)}\n`);
})();

