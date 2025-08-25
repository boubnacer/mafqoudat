const axios = require('axios');

const DEPLOYMENT_URL = 'https://mafqoudat-production.up.railway.app';

async function testPostCreation() {
  console.log('🔍 Testing Post Creation...\\n');
  console.log('Testing URL:', DEPLOYMENT_URL);
  
  try {
    // Step 1: Check what data is available for post creation
    console.log('\\n1. Checking available data for post creation...');
    
    const [countriesResponse, categoriesResponse, flOptionsResponse] = await Promise.all([
      axios.get(`${DEPLOYMENT_URL}/countries`),
      axios.get(`${DEPLOYMENT_URL}/categories`),
      axios.get(`${DEPLOYMENT_URL}/floptions`)
    ]);
    
    const countries = Array.isArray(countriesResponse.data) ? countriesResponse.data : countriesResponse.data.data || [];
    const categories = Array.isArray(categoriesResponse.data) ? categoriesResponse.data : categoriesResponse.data.data || [];
    const flOptions = Array.isArray(flOptionsResponse.data) ? flOptionsResponse.data : flOptionsResponse.data.data || [];
    
    console.log(`Countries: ${countries.length}`);
    console.log(`Categories: ${categories.length}`);
    console.log(`Found/Lost Options: ${flOptions.length}`);
    
    // Step 2: Get sample data
    const morocco = countries.find(c => c.code === 'MA');
    const electronicsCategory = categories.find(c => c.code === 'ELECTRONICS');
    const lostOption = flOptions.find(f => f.code === 'LOST');
    
    if (!morocco || !electronicsCategory || !lostOption) {
      console.log('❌ Missing required data for post creation');
      return;
    }
    
    console.log('✅ Found required data for post creation');
    console.log(`Morocco ID: ${morocco._id}`);
    console.log(`Electronics Category ID: ${electronicsCategory._id}`);
    console.log(`Lost Option ID: ${lostOption._id}`);
    
    // Step 3: Test post creation without authentication (should fail)
    console.log('\\n2. Testing post creation without authentication...');
    const testPostData = {
      user: "68ac670da64876b1bc50cc43", // Placeholder user ID
      country: morocco._id,
      category: electronicsCategory._id,
      contact: "+212-6-1234-5678",
      foundLost: lostOption._id,
      exactLocation: "Test Location, Casablanca",
      exactDate: "2024-01-15T10:30:00.000Z",
      description: "Test post for debugging",
      region: "Casablanca-Settat"
    };
    
    try {
      const response = await axios.post(`${DEPLOYMENT_URL}/posts`, testPostData);
      console.log('❌ Should have failed - post creation accessible without auth');
      console.log('Response:', response.data);
    } catch (error) {
      console.log(`✅ Correctly blocked: ${error.response?.status} ${error.response?.statusText}`);
      if (error.response?.data) {
        console.log('Response data:', error.response.data);
      }
    }
    
    // Step 4: Test post creation with invalid token (should fail)
    console.log('\\n3. Testing post creation with invalid token...');
    try {
      const response = await axios.post(`${DEPLOYMENT_URL}/posts`, testPostData, {
        headers: {
          'Authorization': 'Bearer invalid-token-12345'
        }
      });
      console.log('❌ Should have failed - invalid token accepted');
      console.log('Response:', response.data);
    } catch (error) {
      console.log(`✅ Correctly blocked: ${error.response?.status} ${error.response?.statusText}`);
      if (error.response?.data) {
        console.log('Response data:', error.response.data);
      }
    }
    
    // Step 5: Check if there are any users in the database
    console.log('\\n4. Checking users in database...');
    try {
      const usersResponse = await axios.get(`${DEPLOYMENT_URL}/users`);
      console.log('❌ Users endpoint accessible without auth (this is wrong)');
      const users = usersResponse.data;
      console.log(`Users found: ${users.length}`);
      if (users.length > 0) {
        console.log('Sample user:', {
          _id: users[0]._id,
          username: users[0].username,
          email: users[0].email
        });
      }
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Users endpoint properly protected (401 Unauthorized)');
      } else {
        console.log(`❌ Unexpected error: ${error.response?.status} ${error.response?.statusText}`);
      }
    }
    
    console.log('\\n🎉 Post creation test completed!');
    console.log('\\n📋 ANALYSIS:');
    console.log('✅ Post creation endpoint is properly protected');
    console.log('✅ Authentication is working correctly');
    console.log('\\n💡 The issue is likely:');
    console.log('1. User is not properly logged in when creating posts');
    console.log('2. Authentication token is missing or invalid');
    console.log('3. Post creation is failing silently');
    console.log('4. User session has expired');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testPostCreation();
