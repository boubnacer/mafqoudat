const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3500/api/cities';
const TEST_CASES = [
  {
    name: 'Search "Casablanca" in English (should find in database)',
    params: { q: 'Casablanca', language: 'en', countryCode: 'MA', limit: 5 }
  },
  {
    name: 'Search "الدار البيضاء" in Arabic (should find in database)',
    params: { q: 'الدار البيضاء', language: 'ar', countryCode: 'MA', limit: 5 }
  },
  {
    name: 'Search "Casablanca" in French (should find in database)',
    params: { q: 'Casablanca', language: 'fr', countryCode: 'MA', limit: 5 }
  },
  {
    name: 'Search "Tiflet" in English (should use API)',
    params: { q: 'Tiflet', language: 'en', countryCode: 'MA', limit: 5 }
  },
  {
    name: 'Search "القاهرة" in Arabic (should find in database)',
    params: { q: 'القاهرة', language: 'ar', countryCode: 'EG', limit: 5 }
  },
  {
    name: 'Search "Alexandria" in English (should find in database)',
    params: { q: 'Alexandria', language: 'en', countryCode: 'EG', limit: 5 }
  }
];

async function testHybridSearch() {
  console.log('🧪 Testing Hybrid City Search Implementation\n');
  console.log('=' .repeat(60));

  for (const testCase of TEST_CASES) {
    try {
      console.log(`\n🔍 ${testCase.name}`);
      console.log(`   Parameters:`, testCase.params);
      
      const response = await axios.get(`${BASE_URL}/search`, {
        params: testCase.params,
        timeout: 10000
      });

      if (response.data.success) {
        const { data, total, sources, geonamesStats } = response.data;
        
        console.log(`   ✅ Success: Found ${total} cities`);
        console.log(`   📊 Sources: Database: ${sources.database}, API: ${sources.api}`);
        
        if (geonamesStats) {
          console.log(`   🌐 GeoNames: ${geonamesStats.requestsUsed}/${geonamesStats.maxRequests} requests used`);
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
    
    console.log('   ' + '-'.repeat(50));
  }

  // Test GeoNames stats endpoint
  try {
    console.log(`\n📊 Testing GeoNames Stats Endpoint`);
    const response = await axios.get(`${BASE_URL}/geonames-stats`);
    
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

  console.log('\n' + '='.repeat(60));
  console.log('🏁 Test completed!');
}

// Run the test
testHybridSearch().catch(console.error);
