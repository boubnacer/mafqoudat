const axios = require('axios');

const RAILWAY_URL = 'https://mafqoudat-production.up.railway.app';

async function testFreshLogin() {
  console.log('🔐 Testing fresh login and post creation...\n');
  
  // Step 1: Login with fresh credentials
  console.log('1️⃣ Logging in with fresh credentials...');
  try {
    const loginResponse = await axios.post(`${RAILWAY_URL}/auth`, {
      emailOrPhone: '0000000000',
      password: '0000'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Fresh login successful!');
    const freshToken = loginResponse.data.accessToken;
    console.log('Fresh token received:', freshToken ? 'Yes' : 'No');
    
    // Step 2: Test post creation with fresh token
    console.log('\n2️⃣ Testing post creation with fresh token...');
    
    const testPostData = {
      user: '68af89bb30464c5a97ca8fcf',
      country: '68a4b54ab46524c54c553cae',
      category: '68a4b54ab46524c54c553cc9',
      foundLost: '68a4b54ab46524c54c553cc3',
      contact: '0000000000',
      exactLocation: 'Test Location',
      exactDate: '2025-01-27',
      description: 'Test post created with fresh token'
    };
    
    const postResponse = await axios.post(`${RAILWAY_URL}/posts`, testPostData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${freshToken}`
      }
    });
    
    console.log('✅ Post creation with fresh token successful!');
    console.log('Response:', JSON.stringify(postResponse.data, null, 2));
    console.log('\n🎉 SUCCESS! Post creation works with a fresh token.');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testFreshLogin().catch(console.error);
