const axios = require('axios');

const DEPLOYMENT_URL = 'https://mafqoudat-production.up.railway.app';

async function checkAllPosts() {
  console.log('🔍 Checking All Posts...\\n');
  console.log('Testing URL:', DEPLOYMENT_URL);
  
  try {
    // Step 1: Check posts with different country parameters
    console.log('\\n1. Checking posts with different country parameters...');
    
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
    
    // Step 2: Try to get posts without country filter
    console.log('\\n2. Checking posts without country filter...');
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
    
    // Step 3: Check if there are any posts in the database at all
    console.log('\\n3. Checking database directly...');
    try {
      // Try to get posts with a very broad query
      const response = await axios.get(`${DEPLOYMENT_URL}/posts?currentCountry=MA&page=0&pageSize=100`);
      const posts = response.data?.postsWithUser || [];
      console.log(`Total posts in database: ${posts.length}`);
      
      if (posts.length > 0) {
        console.log('  All posts:');
        posts.forEach((post, index) => {
          console.log(`    ${index + 1}. ID: ${post._id}`);
          console.log(`       User: ${post.user}`);
          console.log(`       Country: ${post.countryname}`);
          console.log(`       Found/Lost: ${post.foundLost}`);
          console.log(`       Category: ${post.categoryname}`);
          console.log(`       Location: ${post.exactLocation}`);
          console.log(`       Created: ${post.createdAt}`);
        });
      }
    } catch (error) {
      console.log(`Error getting all posts: ${error.response?.status || error.message}`);
    }
    
    console.log('\\n🎉 Post check completed!');
    
    // Summary
    console.log('\\n📋 SUMMARY:');
    console.log('If no posts are found, the issue might be:');
    console.log('1. Post was not saved properly');
    console.log('2. Post was created in a different country');
    console.log('3. Post was deleted or expired');
    console.log('4. Database connection issue');
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the check
checkAllPosts();
