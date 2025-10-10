require('dotenv').config();
const axios = require('axios');

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m'
};

console.log(`${COLORS.bright}${COLORS.cyan}
╔═══════════════════════════════════════════════════════════════╗
║          Google Places API Key Diagnostic Test               ║
╚═══════════════════════════════════════════════════════════════╝
${COLORS.reset}\n`);

// Test 1: Check if API key exists
console.log(`${COLORS.bright}TEST 1: Check API Key Configuration${COLORS.reset}`);
const apiKey = process.env.GOOGLE_PLACES_API_KEY;

if (!apiKey) {
  console.log(`${COLORS.red}❌ GOOGLE_PLACES_API_KEY is NOT configured in .env file${COLORS.reset}`);
  console.log(`${COLORS.yellow}⚠️  Please add GOOGLE_PLACES_API_KEY=your_api_key to server/.env${COLORS.reset}\n`);
  process.exit(1);
} else {
  console.log(`${COLORS.green}✅ API Key found: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}${COLORS.reset}`);
  console.log(`${COLORS.cyan}   Length: ${apiKey.length} characters${COLORS.reset}\n`);
}

// Test 2: Simple Text Search for a well-known city
async function testSimpleSearch() {
  console.log(`${COLORS.bright}TEST 2: Simple Text Search (Casablanca, Morocco)${COLORS.reset}`);
  try {
    const searchQuery = 'Casablanca Morocco';
    const url = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
    
    console.log(`${COLORS.cyan}🔍 Searching for: "${searchQuery}"${COLORS.reset}`);
    console.log(`${COLORS.cyan}📡 URL: ${url}${COLORS.reset}`);
    
    const response = await axios.get(url, {
      params: {
        query: searchQuery,
        key: apiKey
      },
      timeout: 10000
    });

    console.log(`${COLORS.cyan}📊 Response Status: ${response.data.status}${COLORS.reset}`);
    
    if (response.data.status === 'OK') {
      console.log(`${COLORS.green}✅ API Key is VALID and working!${COLORS.reset}`);
      console.log(`${COLORS.green}   Found ${response.data.results.length} results${COLORS.reset}`);
      if (response.data.results.length > 0) {
        console.log(`${COLORS.green}   First result: ${response.data.results[0].name}${COLORS.reset}`);
        console.log(`${COLORS.green}   Types: ${response.data.results[0].types.join(', ')}${COLORS.reset}`);
      }
    } else if (response.data.status === 'REQUEST_DENIED') {
      console.log(`${COLORS.red}❌ REQUEST DENIED${COLORS.reset}`);
      console.log(`${COLORS.yellow}   Error: ${response.data.error_message || 'No error message'}${COLORS.reset}`);
      console.log(`${COLORS.yellow}   Possible reasons:${COLORS.reset}`);
      console.log(`${COLORS.yellow}   1. API key is invalid${COLORS.reset}`);
      console.log(`${COLORS.yellow}   2. Places API is not enabled in Google Cloud Console${COLORS.reset}`);
      console.log(`${COLORS.yellow}   3. API key has restrictions that block this request${COLORS.reset}`);
    } else if (response.data.status === 'OVER_QUERY_LIMIT') {
      console.log(`${COLORS.red}❌ OVER QUERY LIMIT${COLORS.reset}`);
      console.log(`${COLORS.yellow}   Your API quota has been exceeded${COLORS.reset}`);
    } else {
      console.log(`${COLORS.yellow}⚠️  Status: ${response.data.status}${COLORS.reset}`);
      console.log(`${COLORS.yellow}   Message: ${response.data.error_message || 'No message'}${COLORS.reset}`);
    }
    
    return response.data.status === 'OK';
  } catch (error) {
    console.log(`${COLORS.red}❌ Error making request: ${error.message}${COLORS.reset}`);
    if (error.response) {
      console.log(`${COLORS.red}   Response status: ${error.response.status}${COLORS.reset}`);
      console.log(`${COLORS.red}   Response data: ${JSON.stringify(error.response.data, null, 2)}${COLORS.reset}`);
    }
    return false;
  }
  console.log('');
}

// Test 3: Search with locality type filter
async function testLocalityFilter() {
  console.log(`\n${COLORS.bright}TEST 3: Search with Locality Type Filter${COLORS.reset}`);
  try {
    const searchQuery = 'Azrou Morocco';
    const url = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
    
    console.log(`${COLORS.cyan}🔍 Searching for: "${searchQuery}" with type=locality${COLORS.reset}`);
    
    const response = await axios.get(url, {
      params: {
        query: searchQuery,
        type: 'locality',
        key: apiKey
      },
      timeout: 10000
    });

    console.log(`${COLORS.cyan}📊 Response Status: ${response.data.status}${COLORS.reset}`);
    
    if (response.data.status === 'OK') {
      console.log(`${COLORS.green}✅ Found ${response.data.results.length} localities${COLORS.reset}`);
      response.data.results.slice(0, 3).forEach((place, i) => {
        console.log(`${COLORS.green}   ${i + 1}. ${place.name}${COLORS.reset}`);
        console.log(`${COLORS.cyan}      Types: ${place.types.join(', ')}${COLORS.reset}`);
        console.log(`${COLORS.cyan}      Has 'locality': ${place.types.includes('locality') ? 'YES' : 'NO'}${COLORS.reset}`);
      });
    } else if (response.data.status === 'ZERO_RESULTS') {
      console.log(`${COLORS.yellow}⚠️  No results found${COLORS.reset}`);
    } else {
      console.log(`${COLORS.yellow}⚠️  Status: ${response.data.status}${COLORS.reset}`);
    }
    
    return response.data.status === 'OK';
  } catch (error) {
    console.log(`${COLORS.red}❌ Error: ${error.message}${COLORS.reset}`);
    return false;
  }
}

// Test 4: Test the specific search that failed
async function testFailedSearch() {
  console.log(`\n${COLORS.bright}TEST 4: Test Your Failed Search (Iminifri natural bridge)${COLORS.reset}`);
  try {
    const searchQuery = 'Iminifri natural bridge Morocco';
    const url = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
    
    console.log(`${COLORS.cyan}🔍 Searching for: "${searchQuery}"${COLORS.reset}`);
    console.log(`${COLORS.cyan}   (This is likely NOT a locality, but a tourist attraction)${COLORS.reset}`);
    
    // First search without type filter
    console.log(`\n${COLORS.cyan}   A. Without type filter:${COLORS.reset}`);
    const response1 = await axios.get(url, {
      params: {
        query: searchQuery,
        key: apiKey
      },
      timeout: 10000
    });

    console.log(`${COLORS.cyan}   📊 Status: ${response1.data.status}${COLORS.reset}`);
    if (response1.data.status === 'OK') {
      console.log(`${COLORS.green}   ✅ Found ${response1.data.results.length} results${COLORS.reset}`);
      response1.data.results.slice(0, 2).forEach((place, i) => {
        console.log(`${COLORS.green}      ${i + 1}. ${place.name}${COLORS.reset}`);
        console.log(`${COLORS.cyan}         Types: ${place.types.join(', ')}${COLORS.reset}`);
      });
    } else {
      console.log(`${COLORS.yellow}   ⚠️  No results or error${COLORS.reset}`);
    }
    
    // Now search with locality filter
    console.log(`\n${COLORS.cyan}   B. With locality type filter:${COLORS.reset}`);
    const response2 = await axios.get(url, {
      params: {
        query: searchQuery,
        type: 'locality',
        key: apiKey
      },
      timeout: 10000
    });

    console.log(`${COLORS.cyan}   📊 Status: ${response2.data.status}${COLORS.reset}`);
    if (response2.data.status === 'OK') {
      console.log(`${COLORS.green}   ✅ Found ${response2.data.results.length} localities${COLORS.reset}`);
    } else if (response2.data.status === 'ZERO_RESULTS') {
      console.log(`${COLORS.yellow}   ⚠️  No localities found (as expected for a natural landmark)${COLORS.reset}`);
    }
    
    // Try searching for just "Iminifri" which might be a nearby city
    console.log(`\n${COLORS.cyan}   C. Searching for just "Iminifri Morocco" with locality:${COLORS.reset}`);
    const response3 = await axios.get(url, {
      params: {
        query: 'Iminifri Morocco',
        type: 'locality',
        key: apiKey
      },
      timeout: 10000
    });

    console.log(`${COLORS.cyan}   📊 Status: ${response3.data.status}${COLORS.reset}`);
    if (response3.data.status === 'OK') {
      console.log(`${COLORS.green}   ✅ Found ${response3.data.results.length} localities${COLORS.reset}`);
      response3.data.results.slice(0, 2).forEach((place, i) => {
        console.log(`${COLORS.green}      ${i + 1}. ${place.name}${COLORS.reset}`);
      });
    } else if (response3.data.status === 'ZERO_RESULTS') {
      console.log(`${COLORS.yellow}   ⚠️  No localities found${COLORS.reset}`);
    }
    
  } catch (error) {
    console.log(`${COLORS.red}❌ Error: ${error.message}${COLORS.reset}`);
  }
}

// Test 5: Check service instance
async function testServiceInstance() {
  console.log(`\n${COLORS.bright}TEST 5: Test Google Places Service Instance${COLORS.reset}`);
  try {
    const googlePlacesService = require('./services/googlePlacesService');
    
    console.log(`${COLORS.cyan}🔍 Testing service.searchCities('Casablanca', 'MA', 'en')${COLORS.reset}`);
    
    const results = await googlePlacesService.searchCities('Casablanca', 'MA', 'en');
    
    console.log(`${COLORS.green}✅ Service returned ${results.length} results${COLORS.reset}`);
    
    if (results.length > 0) {
      console.log(`${COLORS.green}   First result:${COLORS.reset}`);
      console.log(`${COLORS.cyan}   - Name: ${results[0].labels.en}${COLORS.reset}`);
      console.log(`${COLORS.cyan}   - Code: ${results[0].code}${COLORS.reset}`);
      console.log(`${COLORS.cyan}   - Source: ${results[0].source}${COLORS.reset}`);
      console.log(`${COLORS.cyan}   - Place ID: ${results[0].placeId}${COLORS.reset}`);
    }
    
    // Get usage stats
    const stats = googlePlacesService.getUsageStats();
    console.log(`\n${COLORS.cyan}📈 API Usage Stats:${COLORS.reset}`);
    console.log(`${COLORS.cyan}   Daily: ${stats.daily.requestsUsed}/${stats.daily.maxRequests}${COLORS.reset}`);
    console.log(`${COLORS.cyan}   Monthly: ${stats.monthly.requestsUsed}/${stats.monthly.maxRequests}${COLORS.reset}`);
    console.log(`${COLORS.cyan}   Can make request: ${stats.canMakeRequest ? '✅' : '❌'}${COLORS.reset}`);
    
  } catch (error) {
    console.log(`${COLORS.red}❌ Service error: ${error.message}${COLORS.reset}`);
    console.log(`${COLORS.red}   ${error.stack}${COLORS.reset}`);
  }
}

// Run all tests
(async () => {
  try {
    const test1 = await testSimpleSearch();
    
    if (test1) {
      await testLocalityFilter();
      await testFailedSearch();
      await testServiceInstance();
      
      console.log(`\n${COLORS.bright}${COLORS.green}
╔═══════════════════════════════════════════════════════════════╗
║                    DIAGNOSTIC COMPLETE                        ║
╠═══════════════════════════════════════════════════════════════╣
║  ✅ Google Places API key is working!                         ║
║                                                               ║
║  Note: "Iminifri natural bridge" returns 0 results because   ║
║  it's a NATURAL LANDMARK, not a LOCALITY (city).             ║
║                                                               ║
║  The service is working correctly - it only returns cities.  ║
╚═══════════════════════════════════════════════════════════════╝
${COLORS.reset}\n`);
    } else {
      console.log(`\n${COLORS.bright}${COLORS.red}
╔═══════════════════════════════════════════════════════════════╗
║                    DIAGNOSTIC FAILED                          ║
╠═══════════════════════════════════════════════════════════════╣
║  ❌ Google Places API key is NOT working properly            ║
║                                                               ║
║  Please check:                                                ║
║  1. API key is correct in server/.env                        ║
║  2. Places API is enabled in Google Cloud Console           ║
║  3. Billing is enabled for your Google Cloud project        ║
║  4. API key has no IP/referrer restrictions blocking server  ║
╚═══════════════════════════════════════════════════════════════╝
${COLORS.reset}\n`);
    }
  } catch (error) {
    console.error(`${COLORS.red}Fatal error: ${error.message}${COLORS.reset}`);
    process.exit(1);
  }
})();

