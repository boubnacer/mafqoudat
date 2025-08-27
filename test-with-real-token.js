const axios = require('axios');

const RAILWAY_URL = 'https://mafqoudat-production.up.railway.app';

// Real token from user
const REAL_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJVc2VySW5mbyI6eyJ1c2VybmFtZSI6IjAwMDAwMDAwMDAiLCJ1c2VybmFtZUlkIjoiNjhhZjg5YmIzMDQ2NGM1YTk3Y2E4ZmNmIiwiY291bnRyeSI6IjY4YTRiNTRhYjQ2NTI0YzU0YzU1M2NhZSJ9LCJpYXQiOjE3NTYzMzQ1ODUsImV4cCI6MTc1NjMzNTQ4NX0.9S1YAZUwSB3ncco_rauQO6nQ01vc7876B58CSv2fc64';

async function testWithRealToken() {
  console.log('🔐 Testing with real authentication token...\n');
  
  // Test 1: Verify token is valid
  console.log('1️⃣ Testing token validity...');
  try {
    const healthResponse = await axios.get(`${RAILWAY_URL}/health`);
    console.log('✅ Health endpoint accessible');
  } catch (error) {
    console.log('❌ Health endpoint failed:', error.message);
    return;
  }

  // Test 2: Try to create a post with the real token
  console.log('\n2️⃣ Testing post creation with real token...');
  
  const testPostData = {
    user: '68af89bb30464c5a97ca8fcf',
    country: '68a4b54ab46524c54c553cae',
    category: '68a4b54ab46524c54c553cc9',
    foundLost: '68a4b54ab46524c54c553cc3',
    contact: '0000000000',
    exactLocation: 'Test Location',
    exactDate: '2025-01-27',
    description: 'Test post'
  };

  try {
    const postResponse = await axios.post(`${RAILWAY_URL}/posts`, testPostData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${REAL_TOKEN}`
      }
    });
    console.log('✅ Post creation successful!');
    console.log('Response:', JSON.stringify(postResponse.data, null, 2));
  } catch (error) {
    console.log('❌ Post creation failed');
    console.log('Error:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }

  // Test 3: Check if token is expired
  console.log('\n3️⃣ Checking token expiration...');
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.decode(REAL_TOKEN);
    console.log('Token payload:', JSON.stringify(decoded, null, 2));
    
    const now = Math.floor(Date.now() / 1000);
    const exp = decoded.exp;
    const iat = decoded.iat;
    
    console.log(`Current time: ${now}`);
    console.log(`Token issued at: ${iat}`);
    console.log(`Token expires at: ${exp}`);
    console.log(`Token is expired: ${now > exp ? 'YES' : 'NO'}`);
    console.log(`Token age: ${now - iat} seconds`);
    console.log(`Time until expiry: ${exp - now} seconds`);
    
    if (now > exp) {
      console.log('❌ Token is expired! This is why post creation is failing.');
    } else {
      console.log('✅ Token is still valid');
    }
  } catch (error) {
    console.log('❌ Error decoding token:', error.message);
  }

  // Test 4: Try to refresh the token
  console.log('\n4️⃣ Testing token refresh...');
  try {
    const refreshResponse = await axios.get(`${RAILWAY_URL}/auth/refresh`, {
      headers: {
        'Authorization': `Bearer ${REAL_TOKEN}`
      }
    });
    console.log('✅ Token refresh successful');
    console.log('New token:', refreshResponse.data.accessToken ? 'Received' : 'Not received');
  } catch (error) {
    console.log('❌ Token refresh failed:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }

  // Test 5: Try to login again to get a fresh token
  console.log('\n5️⃣ Testing fresh login...');
  try {
    const loginResponse = await axios.post(`${RAILWAY_URL}/auth`, {
      emailOrPhone: '0000000000',
      password: '0000'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Fresh login successful');
    const freshToken = loginResponse.data.accessToken;
    console.log('Fresh token received:', freshToken ? 'Yes' : 'No');
    
    // Test post creation with fresh token
    console.log('\n6️⃣ Testing post creation with fresh token...');
    const freshPostResponse = await axios.post(`${RAILWAY_URL}/posts`, testPostData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${freshToken}`
      }
    });
    console.log('✅ Post creation with fresh token successful!');
    console.log('Response:', JSON.stringify(freshPostResponse.data, null, 2));
    
  } catch (error) {
    console.log('❌ Fresh login failed:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testWithRealToken().catch(console.error);
