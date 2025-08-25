const axios = require('axios');

const DEPLOYMENT_URL = 'https://mafqoudat-production.up.railway.app';

async function comprehensivePostsTest() {
  console.log('🔍 Comprehensive Posts Test...\\n');
  console.log('Testing URL:', DEPLOYMENT_URL);
  
  try {
    // Step 1: Check server health
    console.log('\\n1. Checking server health...');
    const healthResponse = await axios.get(`${DEPLOYMENT_URL}/`);
    console.log('✅ Server is healthy');
    
    // Step 2: Get all countries
    console.log('\\n2. Getting all countries...');
    const countriesResponse = await axios.get(`${DEPLOYMENT_URL}/countries`);
    const countries = Array.isArray(countriesResponse.data) ? countriesResponse.data : countriesResponse.data.data || [];
    console.log(`Countries found: ${countries.length}`);
    
    // Step 3: Test posts query without any filters
    console.log('\\n3. Testing posts query without any filters...');
    try {
      const response = await axios.get(`${DEPLOYMENT_URL}/posts`);
      console.log('Response status:', response.status);
      console.log('Response data keys:', Object.keys(response.data));
      console.log('Full response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log('Error with no filters:', error.response?.status, error.response?.data);
    }
    
    // Step 4: Test posts query with minimal parameters
    console.log('\\n4. Testing posts query with minimal parameters...');
    try {
      const response = await axios.get(`${DEPLOYMENT_URL}/posts?page=0&pageSize=10`);
      console.log('Response status:', response.status);
      console.log('Response data keys:', Object.keys(response.data));
      console.log('Full response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log('Error with minimal params:', error.response?.status, error.response?.data);
    }
    
    // Step 5: Test posts query with different country codes
    console.log('\\n5. Testing posts query with different country codes...');
    const testCountries = ['MA', 'DZ', 'TN', 'EG', 'SA'];
    
    for (const countryCode of testCountries) {
      try {
        const response = await axios.get(`${DEPLOYMENT_URL}/posts?currentCountry=${countryCode}&page=0&pageSize=5`);
        const posts = response.data?.postsWithUser || [];
        console.log(`${countryCode}: ${posts.length} posts`);
        
        if (posts.length > 0) {
          console.log(`  Found posts in ${countryCode}:`);
          posts.forEach((post, index) => {
            console.log(`    ${index + 1}. ID: ${post._id}`);
            console.log(`       User: ${post.user}`);
            console.log(`       Found/Lost: ${post.foundLost}`);
            console.log(`       Category: ${post.categoryname}`);
            console.log(`       Location: ${post.exactLocation}`);
          });
        }
      } catch (error) {
        console.log(`${countryCode}: Error - ${error.response?.status || error.message}`);
        if (error.response?.data) {
          console.log(`  Error data: ${JSON.stringify(error.response.data)}`);
        }
      }
    }
    
    // Step 6: Test posts query with country IDs
    console.log('\\n6. Testing posts query with country IDs...');
    const morocco = countries.find(c => c.code === 'MA');
    if (morocco) {
      try {
        const response = await axios.get(`${DEPLOYMENT_URL}/posts?currentCountry=${morocco._id}&page=0&pageSize=5`);
        const posts = response.data?.postsWithUser || [];
        console.log(`Morocco (ID): ${posts.length} posts`);
        
        if (posts.length > 0) {
          console.log('  Found posts with Morocco ID:');
          posts.forEach((post, index) => {
            console.log(`    ${index + 1}. ID: ${post._id}`);
            console.log(`       User: ${post.user}`);
            console.log(`       Found/Lost: ${post.foundLost}`);
            console.log(`       Category: ${post.categoryname}`);
            console.log(`       Location: ${post.exactLocation}`);
          });
        }
      } catch (error) {
        console.log(`Morocco (ID): Error - ${error.response?.status || error.message}`);
        if (error.response?.data) {
          console.log(`  Error data: ${JSON.stringify(error.response.data)}`);
        }
      }
    }
    
    // Step 7: Check if there are any posts at all in the database
    console.log('\\n7. Checking for any posts in database...');
    try {
      // Try to get posts without any country filter
      const response = await axios.get(`${DEPLOYMENT_URL}/posts?page=0&pageSize=100`);
      const posts = response.data?.postsWithUser || [];
      console.log(`Total posts in database: ${posts.length}`);
      
      if (posts.length > 0) {
        console.log('  Found posts:');
        posts.forEach((post, index) => {
          console.log(`    ${index + 1}. ID: ${post._id}`);
          console.log(`       User: ${post.user}`);
          console.log(`       Country: ${post.countryname || 'Unknown'}`);
          console.log(`       Found/Lost: ${post.foundLost}`);
          console.log(`       Category: ${post.categoryname}`);
          console.log(`       Location: ${post.exactLocation}`);
          console.log(`       Created: ${post.createdAt}`);
        });
      }
    } catch (error) {
      console.log(`Error getting all posts: ${error.response?.status || error.message}`);
      if (error.response?.data) {
        console.log(`  Error data: ${JSON.stringify(error.response.data)}`);
      }
    }
    
    console.log('\\n🎉 Comprehensive test completed!');
    console.log('\\n📋 SUMMARY:');
    console.log('This test will help us understand:');
    console.log('1. If posts exist in the database');
    console.log('2. If the query is working correctly');
    console.log('3. If there are issues with country filtering');
    console.log('4. What the actual response structure looks like');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
comprehensivePostsTest();
