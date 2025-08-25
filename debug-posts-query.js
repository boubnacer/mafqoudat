const axios = require('axios');

const DEPLOYMENT_URL = 'https://mafqoudat-production.up.railway.app';

async function debugPostsQuery() {
  console.log('🔍 Debugging Posts Query...\\n');
  console.log('Testing URL:', DEPLOYMENT_URL);
  
  try {
    // Step 1: Check server health
    console.log('\\n1. Checking server health...');
    const healthResponse = await axios.get(`${DEPLOYMENT_URL}/`);
    console.log('✅ Server is healthy');
    
    // Step 2: Check posts with different country parameters
    console.log('\\n2. Checking posts with different country parameters...');
    
    const countries = ['MA', 'DZ', 'TN', 'EG', 'SA'];
    
    for (const country of countries) {
      try {
        const response = await axios.get(`${DEPLOYMENT_URL}/posts?currentCountry=${country}&page=0&pageSize=5`);
        const posts = response.data?.postsWithUser || [];
        console.log(`${country}: ${posts.length} posts`);
        
        if (posts.length > 0) {
          console.log(`  Found posts in ${country}:`);
          posts.forEach((post, index) => {
            console.log(`    ${index + 1}. ID: ${post._id}`);
            console.log(`       User: ${post.user}`);
            console.log(`       Found/Lost: ${post.foundLost}`);
            console.log(`       Category: ${post.categoryname}`);
            console.log(`       Location: ${post.exactLocation}`);
            console.log(`       Created: ${post.createdAt}`);
          });
        }
      } catch (error) {
        console.log(`${country}: Error - ${error.response?.status || error.message}`);
      }
    }
    
    // Step 3: Check posts without country filter
    console.log('\\n3. Checking posts without country filter...');
    try {
      const response = await axios.get(`${DEPLOYMENT_URL}/posts`);
      const posts = response.data?.postsWithUser || [];
      console.log(`Total posts (no filter): ${posts.length}`);
      
      if (posts.length > 0) {
        console.log('  Found posts:');
        posts.forEach((post, index) => {
          console.log(`    ${index + 1}. ID: ${post._id}`);
          console.log(`       User: ${post.user}`);
          console.log(`       Country: ${post.countryname}`);
          console.log(`       Found/Lost: ${post.foundLost}`);
          console.log(`       Category: ${post.categoryname}`);
          console.log(`       Location: ${post.exactLocation}`);
        });
      }
    } catch (error) {
      console.log(`Error getting posts without filter: ${error.response?.status || error.message}`);
    }
    
    // Step 4: Check posts with different page parameters
    console.log('\\n4. Checking posts with different page parameters...');
    try {
      const response = await axios.get(`${DEPLOYMENT_URL}/posts?currentCountry=MA&page=1&pageSize=10`);
      const posts = response.data?.postsWithUser || [];
      console.log(`Posts with page=1: ${posts.length}`);
      
      if (posts.length > 0) {
        console.log('  Found posts:');
        posts.forEach((post, index) => {
          console.log(`    ${index + 1}. ID: ${post._id}`);
          console.log(`       User: ${post.user}`);
          console.log(`       Found/Lost: ${post.foundLost}`);
          console.log(`       Category: ${post.categoryname}`);
          console.log(`       Location: ${post.exactLocation}`);
        });
      }
    } catch (error) {
      console.log(`Error getting posts with page=1: ${error.response?.status || error.message}`);
    }
    
    // Step 5: Check the response structure
    console.log('\\n5. Checking response structure...');
    try {
      const response = await axios.get(`${DEPLOYMENT_URL}/posts?currentCountry=MA&page=0&pageSize=5`);
      console.log('Response structure:');
      console.log('  Status:', response.status);
      console.log('  Headers:', Object.keys(response.headers));
      console.log('  Data keys:', Object.keys(response.data));
      console.log('  postsWithUser type:', typeof response.data.postsWithUser);
      console.log('  postsWithUser length:', response.data.postsWithUser?.length || 0);
      console.log('  Full response data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log(`Error checking response structure: ${error.response?.status || error.message}`);
      if (error.response?.data) {
        console.log('Error response data:', JSON.stringify(error.response.data, null, 2));
      }
    }
    
    console.log('\\n🎉 Posts query debug completed!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the debug
debugPostsQuery();
