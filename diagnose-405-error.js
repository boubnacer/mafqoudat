// Diagnostic script to figure out why we're getting 405 error
const axios = require('axios');

const runDiagnostics = async () => {
  console.log('='.repeat(60));
  console.log('PASSWORD RESET 405 ERROR - DIAGNOSTICS');
  console.log('='.repeat(60));
  console.log('\n');

  const tests = [
    {
      name: 'Test 1: Basic POST to /test-post',
      url: 'https://www.mafqoudat.com/test-post',
      data: { test: 'data' },
      description: 'Tests if POST requests work at all'
    },
    {
      name: 'Test 2: POST to /api/test',
      url: 'https://www.mafqoudat.com/api/test',
      data: { test: 'api route' },
      description: 'Tests if POST to /api/* routes work'
    },
    {
      name: 'Test 3: OPTIONS to /api/password-reset/request (CORS preflight)',
      url: 'https://www.mafqoudat.com/api/password-reset/request',
      method: 'OPTIONS',
      description: 'Tests CORS preflight'
    },
    {
      name: 'Test 4: POST to /api/password-reset/request',
      url: 'https://www.mafqoudat.com/api/password-reset/request',
      data: { contactInfo: 'test@example.com' },
      description: 'The actual password reset endpoint'
    }
  ];

  for (const test of tests) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`${test.name}`);
    console.log(`Description: ${test.description}`);
    console.log(`URL: ${test.url}`);
    console.log('-'.repeat(60));

    try {
      let response;
      if (test.method === 'OPTIONS') {
        response = await axios.options(test.url, {
          headers: {
            'Origin': 'https://www.mafqoudat.com',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'content-type'
          }
        });
      } else {
        response = await axios.post(test.url, test.data, {
          headers: {
            'Content-Type': 'application/json',
            'Origin': 'https://www.mafqoudat.com'
          },
          timeout: 10000
        });
      }

      console.log(`✅ SUCCESS`);
      console.log(`Status: ${response.status} ${response.statusText}`);
      console.log(`Response:`, JSON.stringify(response.data, null, 2));
      
    } catch (error) {
      if (error.response) {
        console.log(`❌ FAILED`);
        console.log(`Status: ${error.response.status} ${error.response.statusText}`);
        console.log(`Response:`, error.response.data || '(empty)');
        console.log(`Headers:`, JSON.stringify(error.response.headers, null, 2));
        
        if (error.response.status === 405) {
          console.log(`\n⚠️  405 METHOD NOT ALLOWED`);
          console.log(`This usually means:`);
          console.log(`- Route exists but doesn't support this HTTP method`);
          console.log(`- There's a reverse proxy blocking the method`);
          console.log(`- CORS preflight is failing`);
        }
      } else if (error.request) {
        console.log(`❌ NO RESPONSE`);
        console.log(`Error:`, error.message);
      } else {
        console.log(`❌ ERROR`);
        console.log(`Message:`, error.message);
      }
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('DIAGNOSTICS COMPLETE');
  console.log('='.repeat(60));
  console.log('\n📋 INSTRUCTIONS:');
  console.log('\n1. After Railway redeploys, check the server logs');
  console.log('   Look for:');
  console.log('   - 📧 Loading password reset routes');
  console.log('   - 🔍 INCOMING REQUEST (when you test)');
  console.log('\n2. If Test 1 works but Test 2 fails:');
  console.log('   → There\'s an issue with /api/* routes specifically');
  console.log('\n3. If Test 2 works but Test 4 fails:');
  console.log('   → There\'s an issue with the password reset route');
  console.log('\n4. If Test 3 (OPTIONS) fails:');
  console.log('   → CORS preflight is being blocked');
  console.log('\n5. Share the server logs showing:');
  console.log('   - When the server starts');
  console.log('   - When you submit the password reset request');
  console.log('\n');
};

runDiagnostics();

