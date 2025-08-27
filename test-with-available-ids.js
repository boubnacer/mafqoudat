const axios = require('axios');

const RAILWAY_URL = 'https://mafqoudat-production.up.railway.app';

async function testWithAvailableIds() {
  console.log('🔐 Testing with available IDs from the error response...\n');
  
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
    
    // Step 2: Test post creation with IDs from available options
    console.log('\n2️⃣ Testing post creation with available IDs...');
    
    // Use the first available options from the error response
    const testPostData = {
      user: '68af89bb30464c5a97ca8fcf',
      country: '68a4b54ab46524c54c553ca9', // Morocco (first in list)
      category: '68a4b54ab46524c54c553cca', // Pets (first in list)
      foundLost: '68a4b54ab46524c54c553cc4', // Lost (first in list)
      contact: '0000000000',
      exactLocation: 'Test Location',
      exactDate: '2025-01-27',
      description: 'Test post with available IDs'
    };
    
    console.log('Using these IDs:');
    console.log('- Country:', testPostData.country, '(Morocco)');
    console.log('- Category:', testPostData.category, '(Pets)');
    console.log('- FoundLost:', testPostData.foundLost, '(Lost)');
    
    const postResponse = await axios.post(`${RAILWAY_URL}/posts`, testPostData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${freshToken}`
      }
    });
    
    console.log('✅ Post creation with available IDs successful!');
    console.log('Response:', JSON.stringify(postResponse.data, null, 2));
    console.log('\n🎉 SUCCESS! Post creation works with available IDs.');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testWithAvailableIds().catch(console.error);
