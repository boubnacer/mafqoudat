const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3500/api';
const TEST_CASES = [
  {
    name: 'Test 1: Search "Casablanca" in English (should find in database)',
    searchParams: { q: 'Casablanca', language: 'en', countryCode: 'MA', limit: 5 },
    expectedSource: 'database'
  },
  {
    name: 'Test 2: Search "الدار البيضاء" in Arabic (should find in database)',
    searchParams: { q: 'الدار البيضاء', language: 'ar', countryCode: 'MA', limit: 5 },
    expectedSource: 'database'
  },
  {
    name: 'Test 3: Search "Tiflet" in English (should use API)',
    searchParams: { q: 'Tiflet', language: 'en', countryCode: 'MA', limit: 5 },
    expectedSource: 'api'
  },
  {
    name: 'Test 4: Search "القاهرة" in Arabic (should find in database)',
    searchParams: { q: 'القاهرة', language: 'ar', countryCode: 'EG', limit: 5 },
    expectedSource: 'database'
  },
  {
    name: 'Test 5: Search "Alexandria" in French (should find in database)',
    searchParams: { q: 'Alexandria', language: 'fr', countryCode: 'EG', limit: 5 },
    expectedSource: 'database'
  },
  {
    name: 'Test 6: Search "SmallCity" in English (should use API)',
    searchParams: { q: 'SmallCity', language: 'en', countryCode: 'MA', limit: 5 },
    expectedSource: 'api'
  }
];

async function testCompleteIntegration() {
  console.log('🧪 Testing Complete Frontend-Backend Integration\n');
  console.log('=' .repeat(70));

  let passedTests = 0;
  let totalTests = TEST_CASES.length;

  for (const testCase of TEST_CASES) {
    try {
      console.log(`\n🔍 ${testCase.name}`);
      console.log(`   Parameters:`, testCase.searchParams);
      
      const response = await axios.get(`${BASE_URL}/cities/search`, {
        params: testCase.searchParams,
        timeout: 15000
      });

      if (response.data.success) {
        const { data, total, sources, geonamesStats } = response.data;
        
        console.log(`   ✅ Success: Found ${total} cities`);
        console.log(`   📊 Sources: Database: ${sources.database}, API: ${sources.api}`);
        
        if (geonamesStats) {
          console.log(`   🌐 GeoNames: ${geonamesStats.requestsUsed}/${geonamesStats.maxRequests} requests used`);
        }
        
        // Check if we got results from the expected source
        const hasExpectedSource = data.some(city => city.source === testCase.expectedSource);
        if (hasExpectedSource) {
          console.log(`   ✅ Expected source (${testCase.expectedSource}) found in results`);
          passedTests++;
        } else {
          console.log(`   ⚠️  Expected source (${testCase.expectedSource}) not found in results`);
        }
        
        // Show first few results
        data.slice(0, 3).forEach((city, index) => {
          console.log(`   ${index + 1}. ${city.label} (${city.source}) - ${city.isCapital ? 'Capital' : 'City'}`);
        });
        
        if (data.length > 3) {
          console.log(`   ... and ${data.length - 3} more`);
        }
      } else {
        console.log(`   ❌ Failed: ${response.data.message}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      if (error.response) {
        console.log(`   Response: ${error.response.data.message || 'Unknown error'}`);
      }
    }
    
    console.log('   ' + '-'.repeat(60));
  }

  // Test GeoNames stats endpoint
  try {
    console.log(`\n📊 Testing GeoNames Stats Endpoint`);
    const response = await axios.get(`${BASE_URL}/cities/geonames-stats`);
    
    if (response.data.success) {
      const stats = response.data.data;
      console.log(`   ✅ GeoNames Usage Stats:`);
      console.log(`   - Requests Used: ${stats.requestsUsed}`);
      console.log(`   - Requests Remaining: ${stats.requestsRemaining}`);
      console.log(`   - Hours Until Reset: ${stats.hoursUntilReset}`);
      console.log(`   - Can Make Request: ${stats.canMakeRequest}`);
    } else {
      console.log(`   ❌ Failed to get stats: ${response.data.message}`);
    }
  } catch (error) {
    console.log(`   ❌ Error getting stats: ${error.message}`);
  }

  // Test traditional city endpoint (fallback)
  try {
    console.log(`\n🏙️ Testing Traditional City Endpoint (Fallback)`);
    const response = await axios.get(`${BASE_URL}/cities-public?countryCode=MA&language=en`);
    
    if (response.data.success) {
      console.log(`   ✅ Traditional endpoint working: Found ${response.data.data.length} cities`);
      response.data.data.slice(0, 3).forEach((city, index) => {
        console.log(`   ${index + 1}. ${city.label || city.name}`);
      });
    } else {
      console.log(`   ❌ Traditional endpoint failed: ${response.data.message}`);
    }
  } catch (error) {
    console.log(`   ❌ Error testing traditional endpoint: ${error.message}`);
  }

  console.log('\n' + '='.repeat(70));
  console.log(`🏁 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! The integration is working perfectly.');
  } else {
    console.log('⚠️  Some tests failed. Check the implementation.');
  }

  console.log('\n📋 Next Steps:');
  console.log('1. Deploy the changes to Railway');
  console.log('2. Test the frontend integration');
  console.log('3. Verify GeoNames API is working in production');
  console.log('4. Monitor API usage and performance');
}

// Run the test
testCompleteIntegration().catch(console.error);
