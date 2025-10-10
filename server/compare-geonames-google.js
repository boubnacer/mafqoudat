require('dotenv').config();
const geonamesService = require('./services/geonamesService');
const googlePlacesService = require('./services/googlePlacesService');

console.log('🔬 Comparing GeoNames vs Google Places Language Handling\n');
console.log('Testing with: Casablanca, Morocco\n');

async function compareAPIs() {
  console.log(`${'='.repeat(80)}`);
  console.log('TEST 1: GeoNames API - How it handles languages');
  console.log(`${'='.repeat(80)}\n`);
  
  try {
    // Test GeoNames with different languages
    console.log('🔍 Searching GeoNames in ENGLISH:');
    const geoEN = await geonamesService.searchCities('Casablanca', 'MA', 'en');
    if (geoEN[0]) {
      console.log('   Result:');
      console.log(`   - English: ${geoEN[0].labels.en}`);
      console.log(`   - French:  ${geoEN[0].labels.fr}`);
      console.log(`   - Arabic:  ${geoEN[0].labels.ar}`);
    }
    
    await new Promise(r => setTimeout(r, 1000));
    
    console.log('\n🔍 Searching GeoNames in FRENCH:');
    const geoFR = await geonamesService.searchCities('Casablanca', 'MA', 'fr');
    if (geoFR[0]) {
      console.log('   Result:');
      console.log(`   - English: ${geoFR[0].labels.en}`);
      console.log(`   - French:  ${geoFR[0].labels.fr}`);
      console.log(`   - Arabic:  ${geoFR[0].labels.ar}`);
    }
    
    await new Promise(r => setTimeout(r, 1000));
    
    console.log('\n🔍 Searching GeoNames in ARABIC:');
    const geoAR = await geonamesService.searchCities('الدار البيضاء', 'MA', 'ar');
    if (geoAR[0]) {
      console.log('   Result:');
      console.log(`   - English: ${geoAR[0].labels.en}`);
      console.log(`   - French:  ${geoAR[0].labels.fr}`);
      console.log(`   - Arabic:  ${geoAR[0].labels.ar}`);
    }
    
    console.log('\n💡 Key Insight:');
    console.log('   GeoNames returns the SAME city with ALL language labels');
    console.log('   regardless of which language you search in!');
    console.log('   It uses alternateNames[] array from the API response.\n');
    
  } catch (error) {
    console.error('Error with GeoNames:', error.message);
  }
  
  console.log(`\n${'='.repeat(80)}`);
  console.log('TEST 2: Google Places API - Current implementation');
  console.log(`${'='.repeat(80)}\n`);
  
  try {
    console.log('🔍 Searching Google Places in ENGLISH:');
    const googleEN = await googlePlacesService.searchCities('Casablanca', 'MA', 'en');
    if (googleEN[0]) {
      console.log('   Result:');
      console.log(`   - English: ${googleEN[0].labels.en}`);
      console.log(`   - French:  ${googleEN[0].labels.fr}`);
      console.log(`   - Arabic:  ${googleEN[0].labels.ar}`);
    }
    
    await new Promise(r => setTimeout(r, 1000));
    
    console.log('\n🔍 Searching Google Places in FRENCH:');
    const googleFR = await googlePlacesService.searchCities('Casablanca', 'MA', 'fr');
    if (googleFR[0]) {
      console.log('   Result:');
      console.log(`   - English: ${googleFR[0].labels.en}`);
      console.log(`   - French:  ${googleFR[0].labels.fr}`);
      console.log(`   - Arabic:  ${googleFR[0].labels.ar}`);
    }
    
    await new Promise(r => setTimeout(r, 1000));
    
    console.log('\n🔍 Searching Google Places in ARABIC:');
    const googleAR = await googlePlacesService.searchCities('الدار البيضاء', 'MA', 'ar');
    if (googleAR[0]) {
      console.log('   Result:');
      console.log(`   - English: ${googleAR[0].labels.en}`);
      console.log(`   - French:  ${googleAR[0].labels.fr}`);
      console.log(`   - Arabic:  ${googleAR[0].labels.ar}`);
    }
    
    console.log('\n💡 Key Insight:');
    console.log('   Google Places uses Translation Service for FR/AR labels');
    console.log('   The primary name changes based on language parameter.\n');
    
  } catch (error) {
    console.error('Error with Google Places:', error.message);
  }
  
  console.log(`\n${'='.repeat(80)}`);
  console.log('COMPARISON SUMMARY');
  console.log(`${'='.repeat(80)}\n`);
  
  console.log('GeoNames:');
  console.log('  ✅ Returns alternateNames[] with all languages from API');
  console.log('  ✅ Service extracts en/fr/ar from alternateNames');
  console.log('  ✅ Always has native names in each language');
  console.log('  ✅ No additional translation needed\n');
  
  console.log('Google Places (Current):');
  console.log('  ⚠️  Returns only one name per language request');
  console.log('  ⚠️  Uses Translation Service for other languages');
  console.log('  ⚠️  Transliteration might not match native names');
  console.log('  ⚠️  May not match how locals write city names\n');
  
  console.log('📝 RECOMMENDATION:');
  console.log('   Google Places should search in ALL 3 languages');
  console.log('   and collect the native name for each language,');
  console.log('   similar to how GeoNames provides alternateNames.\n');
}

compareAPIs();

