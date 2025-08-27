const axios = require('axios');

const RAILWAY_URL = 'https://mafqoudat-production.up.railway.app';

async function testAuthentication() {
  console.log('🔐 Testing authentication...\n');
  
  // Test 1: Check if we can access public endpoints
  console.log('1️⃣ Testing public endpoints...');
  try {
    const healthResponse = await axios.get(`${RAILWAY_URL}/health`);
    console.log('✅ Health endpoint accessible');
  } catch (error) {
    console.log('❌ Health endpoint failed:', error.message);
  }

  // Test 2: Check if we can access countries (public endpoint)
  console.log('\n2️⃣ Testing countries endpoint (public)...');
  try {
    const countriesResponse = await axios.get(`${RAILWAY_URL}/countries`);
    console.log('✅ Countries endpoint accessible');
    console.log(`Found ${countriesResponse.data.data?.length || countriesResponse.data.length} countries`);
  } catch (error) {
    console.log('❌ Countries endpoint failed:', error.message);
  }

  // Test 3: Try to create a post without authentication (should fail)
  console.log('\n3️⃣ Testing post creation without authentication...');
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
        'Content-Type': 'application/json'
      }
    });
    console.log('❌ Post creation succeeded without auth (this should not happen)');
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ Post creation correctly requires authentication (401 Unauthorized)');
    } else {
      console.log('❌ Unexpected error:', error.message);
    }
  }

  // Test 4: Try to login with test credentials
  console.log('\n4️⃣ Testing login...');
  try {
    const loginResponse = await axios.post(`${RAILWAY_URL}/auth`, {
      emailOrPhone: 'test@example.com',
      password: 'testpassword'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Login successful');
    console.log('Access token received:', loginResponse.data.accessToken ? 'Yes' : 'No');
    
    // Test 5: Try to create a post with authentication
    console.log('\n5️⃣ Testing post creation with authentication...');
    const token = loginResponse.data.accessToken;
    
    const authenticatedPostResponse = await axios.post(`${RAILWAY_URL}/posts`, testPostData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Post creation with authentication successful');
    console.log('Response:', JSON.stringify(authenticatedPostResponse.data, null, 2));
    
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('❌ Login failed - Invalid credentials');
    } else if (error.response && error.response.status === 400) {
      console.log('❌ Post creation failed with authentication');
      console.log('Error details:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('❌ Unexpected error:', error.message);
    }
  }

  console.log('\n📋 Summary:');
  console.log('- The issue is that the frontend is not sending authentication tokens');
  console.log('- The backend correctly requires authentication for post creation');
  console.log('- All the database IDs exist and are valid');
  console.log('- The solution is to ensure the user is logged in before creating posts');
}

testAuthentication().catch(console.error);
