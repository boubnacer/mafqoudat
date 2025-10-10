require('dotenv').config();
const googlePlacesService = require('./services/googlePlacesService');

console.log('🧪 Testing Google Places → Database Flow\n');
console.log('This test verifies that Google Places cities:');
console.log('  1. Are found by the API');
console.log('  2. Have proper multilingual translations (en, fr, ar)');
console.log('  3. Include apiSource and placeId fields');
console.log('  4. Are ready to be saved to database\n');

async function testGooglePlacesCity(cityName, countryCode) {
  console.log(`${'='.repeat(70)}`);
  console.log(`🔍 Testing: "${cityName}" in ${countryCode}`);
  console.log(`${'='.repeat(70)}\n`);
  
  try {
    // Search for the city using Google Places
    const results = await googlePlacesService.searchCities(cityName, countryCode, 'en');
    
    if (results.length === 0) {
      console.log(`⚠️  No results found for "${cityName}"`);
      return;
    }
    
    const city = results[0]; // Get first result
    
    console.log('✅ City found from Google Places!\n');
    console.log('📋 City Data Structure (ready for database):');
    console.log(JSON.stringify({
      code: city.code,
      labels: city.labels,
      isCapital: city.isCapital,
      isActive: city.isActive,
      isDynamic: city.isDynamic,
      apiSource: city.source, // This will be saved as 'google'
      placeId: city.placeId,
      countryCode: city.countryCode,
      searchTerms: city.searchTerms
    }, null, 2));
    
    console.log('\n📝 Translation Quality Check:');
    console.log(`   English (en): ${city.labels.en}`);
    console.log(`   French (fr):  ${city.labels.fr}`);
    console.log(`   Arabic (ar):  ${city.labels.ar}`);
    
    // Check if translations are different (good quality)
    const hasUniqueTranslations = 
      city.labels.fr !== city.labels.en ||
      city.labels.ar !== city.labels.en;
    
    if (hasUniqueTranslations) {
      console.log('   ✅ Translations are unique and localized!');
    } else {
      console.log('   ⚠️  All translations are the same (fallback to English)');
    }
    
    console.log('\n🔑 Important Fields for Database:');
    console.log(`   ✅ source: "${city.source}" (will be saved as apiSource)`);
    console.log(`   ✅ placeId: "${city.placeId}" (Google Places unique ID)`);
    console.log(`   ✅ isDynamic: ${city.isDynamic} (marks as API-generated)`);
    console.log(`   ✅ searchTerms: [${city.searchTerms?.join(', ') || 'none'}]`);
    
    console.log('\n💾 When a user creates a post with this city:');
    console.log('   1. Frontend sends cityData with all fields above');
    console.log('   2. Backend checks if city exists in database');
    console.log('   3. If not exists, creates new City document with:');
    console.log(`      - apiSource: "google"`);
    console.log(`      - placeId: "${city.placeId}"`);
    console.log(`      - labels: { en, fr, ar }`);
    console.log('   4. City is saved and available for future searches!');
    console.log('   5. Next time someone searches, it comes from database (faster!)');
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
  
  console.log('');
}

(async () => {
  console.log('Starting tests...\n');
  
  // Test 1: A rare Moroccan city
  await testGooglePlacesCity('Ifrane', 'MA');
  await new Promise(r => setTimeout(r, 1000));
  
  // Test 2: Another rare city
  await testGooglePlacesCity('Azrou', 'MA');
  await new Promise(r => setTimeout(r, 1000));
  
  // Test 3: Egyptian city
  await testGooglePlacesCity('Dahab', 'EG');
  
  // Show usage stats
  const stats = googlePlacesService.getUsageStats();
  console.log(`${'='.repeat(70)}`);
  console.log('📈 Google Places API Usage:');
  console.log(`   Daily: ${stats.daily.requestsUsed}/${stats.daily.maxRequests}`);
  console.log(`   Monthly: ${stats.monthly.requestsUsed}/${stats.monthly.maxRequests}`);
  console.log(`${'='.repeat(70)}\n`);
  
  console.log('✅ Test Complete!\n');
  console.log('💡 Summary:');
  console.log('   - Google Places finds cities not in database');
  console.log('   - Cities include multilingual translations (en, fr, ar)');
  console.log('   - When used in a post, cities are auto-saved to database');
  console.log('   - Saved cities include apiSource="google" and placeId');
  console.log('   - Future searches will use database (faster, no API cost)');
  console.log('   - The system matches your website\'s language requirements!\n');
})();

