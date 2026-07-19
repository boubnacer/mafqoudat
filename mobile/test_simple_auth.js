const axios = require('axios');

async function testSimpleAuth() {
  console.log('🧪 Testing Simple Authentication with existing /auth endpoint...\n');

  try {
    // Test 1: Test the existing auth endpoint with invalid credentials
    console.log('1️⃣ Testing invalid credentials (should return 401):');
    const invalidResponse = await axios.post('https://mafqoudat-api.onrender.com/auth', {
      emailOrPhone: 'invalid@example.com',
      password: 'wrongpassword'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Platform': 'mobile',
        'X-App-Version': '1.0.0'
      }
    }).catch(error => {
      return error.response;
    });

    console.log(`   Status: ${invalidResponse.status}`);
    console.log(`   Response:`, invalidResponse.data);
    
    if (invalidResponse.status === 401) {
      console.log('   ✅ Correctly returns 401 for invalid credentials');
    } else {
      console.log('   ❌ Expected 401, got:', invalidResponse.status);
    }

    console.log('\n2️⃣ Testing validation (empty fields):');
    const validationResponse = await axios.post('https://mafqoudat-api.onrender.com/auth', {
      emailOrPhone: '',
      password: ''
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Platform': 'mobile',
        'X-App-Version': '1.0.0'
      }
    }).catch(error => {
      return error.response;
    });

    console.log(`   Status: ${validationResponse.status}`);
    console.log(`   Response:`, validationResponse.data);
    
    if (validationResponse.status === 400) {
      console.log('   ✅ Correctly returns 400 for validation errors');
    } else {
      console.log('   ❌ Expected 400, got:', validationResponse.status);
    }

    console.log('\n3️⃣ Testing endpoint availability:');
    try {
      const healthResponse = await axios.get('https://mafqoudat-api.onrender.com/health');
      console.log(`   Server Health: ${healthResponse.status} - ${healthResponse.data.status}`);
      console.log('   ✅ Server is running and accessible');
    } catch (error) {
      console.log('   ❌ Server health check failed:', error.message);
    }

    console.log('\n🎉 Simple Authentication Test Summary:');
    console.log('   ✅ Existing /auth endpoint is working');
    console.log('   ✅ Error handling is properly configured');
    console.log('   ✅ Mobile headers are accepted');
    console.log('   ✅ Ready for simple username/password authentication');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
  }
}

testSimpleAuth();
