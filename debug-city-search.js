// Simple debug script to test city search functionality
console.log('🔍 City Search Debug Script');
console.log('==========================');

// Test 1: Check if server is running
async function testServerConnection() {
  try {
    const response = await fetch('http://localhost:3500/api/cities-public?countryCode=MA&language=en');
    const data = await response.json();
    console.log('✅ Server is running');
    console.log('📊 Traditional endpoint response:', data);
    return true;
  } catch (error) {
    console.log('❌ Server is not running or not accessible');
    console.log('Error:', error.message);
    return false;
  }
}

// Test 2: Check hybrid search endpoint
async function testHybridSearch() {
  try {
    const response = await fetch('http://localhost:3500/api/cities/search?q=Casablanca&language=en&countryCode=MA&limit=5');
    const data = await response.json();
    console.log('✅ Hybrid search endpoint is working');
    console.log('📊 Hybrid search response:', data);
    return true;
  } catch (error) {
    console.log('❌ Hybrid search endpoint failed');
    console.log('Error:', error.message);
    return false;
  }
}

// Test 3: Check GeoNames stats
async function testGeonamesStats() {
  try {
    const response = await fetch('http://localhost:3500/api/cities/geonames-stats');
    const data = await response.json();
    console.log('✅ GeoNames stats endpoint is working');
    console.log('📊 GeoNames stats:', data);
    return true;
  } catch (error) {
    console.log('❌ GeoNames stats endpoint failed');
    console.log('Error:', error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('\n🧪 Running tests...\n');
  
  const serverOk = await testServerConnection();
  console.log('');
  
  if (serverOk) {
    await testHybridSearch();
    console.log('');
    await testGeonamesStats();
  }
  
  console.log('\n📋 Debugging Steps:');
  console.log('1. Make sure your server is running: npm start (in server directory)');
  console.log('2. Check browser console for search debug logs');
  console.log('3. Verify GeoNames username is set in environment variables');
  console.log('4. Check if country object has a "code" property');
  console.log('5. Try typing at least 2 characters in the search field');
}

// Run the tests
runTests().catch(console.error);
