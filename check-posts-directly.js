const axios = require('axios');

async function checkPostsDirectly() {
  try {
    const apiUrl = 'https://mafqoudat-production.up.railway.app';
    
    console.log('🔍 Checking posts directly...');
    console.log('API URL:', apiUrl);
    
    // Test 1: Get all posts without any filters
    console.log('\n1️⃣ Getting all posts without filters...');
    try {
      const postsResponse = await axios.get(`${apiUrl}/posts?page=1&pageSize=20`, { timeout: 15000 });
      console.log('✅ Posts endpoint working');
      console.log('📊 Total posts found:', postsResponse.data?.ids?.length || 0);
      
      if (postsResponse.data?.ids?.length > 0) {
        console.log('\n📝 All posts details:');
        postsResponse.data.ids.forEach((postId, index) => {
          const post = postsResponse.data.entities[postId];
          console.log(`\nPost ${index + 1}:`);
          console.log('- ID:', post._id);
          console.log('- Country ID:', post.country);
          console.log('- FoundLost ID:', post.foundLost);
          console.log('- Category ID:', post.category);
          console.log('- Title:', post.title || 'No title');
          console.log('- Created:', post.createdAt);
          console.log('- Status:', post.status);
        });
        
        // Check if any posts match Morocco
        const moroccoPosts = postsResponse.data.ids.filter(postId => {
          const post = postsResponse.data.entities[postId];
          return post.country === '68a4b54ab46524c54c553ca9';
        });
        
        console.log(`\n🌍 Posts for Morocco: ${moroccoPosts.length}`);
        
        if (moroccoPosts.length > 0) {
          console.log('✅ Found posts for Morocco!');
          moroccoPosts.forEach((postId, index) => {
            const post = postsResponse.data.entities[postId];
            console.log(`\nMorocco Post ${index + 1}:`);
            console.log('- ID:', post._id);
            console.log('- FoundLost:', post.foundLost);
            console.log('- Category:', post.category);
            console.log('- Title:', post.title || 'No title');
          });
        } else {
          console.log('❌ No posts found for Morocco');
        }
        
      } else {
        console.log('❌ No posts found in database at all');
      }
      
    } catch (error) {
      console.log('❌ Failed to get posts:', error.response?.data || error.message);
    }
    
    // Test 2: Try different query parameters
    console.log('\n2️⃣ Trying different query parameters...');
    try {
      const postsResponse2 = await axios.get(`${apiUrl}/posts?page=0&pageSize=20`, { timeout: 15000 });
      console.log('✅ Posts endpoint with page=0 working');
      console.log('📊 Posts found with page=0:', postsResponse2.data?.ids?.length || 0);
    } catch (error) {
      console.log('❌ Posts endpoint with page=0 failed:', error.response?.data || error.message);
    }
    
    // Test 3: Try without pagination
    console.log('\n3️⃣ Trying without pagination...');
    try {
      const postsResponse3 = await axios.get(`${apiUrl}/posts`, { timeout: 15000 });
      console.log('✅ Posts endpoint without pagination working');
      console.log('📊 Posts found without pagination:', postsResponse3.data?.ids?.length || 0);
    } catch (error) {
      console.log('❌ Posts endpoint without pagination failed:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ General Error:', error.message);
  }
}

checkPostsDirectly();
