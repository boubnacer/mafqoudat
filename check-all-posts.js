const axios = require('axios');

async function checkAllPosts() {
  try {
    const apiUrl = 'https://mafqoudat-production.up.railway.app';
    
    console.log('🔍 Checking all posts in database...');
    console.log('API URL:', apiUrl);
    
    // Get all posts without country filter
    console.log('\n📊 Getting all posts...');
    try {
      const postsResponse = await axios.get(`${apiUrl}/posts?page=1&pageSize=20`, { timeout: 15000 });
      console.log('✅ Posts endpoint working');
      console.log('📊 Total posts found:', postsResponse.data?.ids?.length || 0);
      
      if (postsResponse.data?.ids?.length > 0) {
        console.log('\n📝 Post details:');
        postsResponse.data.ids.forEach((postId, index) => {
          const post = postsResponse.data.entities[postId];
          console.log(`\nPost ${index + 1}:`);
          console.log('- ID:', post._id);
          console.log('- Country ID:', post.country);
          console.log('- FoundLost ID:', post.foundLost);
          console.log('- Category ID:', post.category);
          console.log('- Title:', post.title || 'No title');
          console.log('- Created:', post.createdAt);
        });
        
        // Group posts by country
        const postsByCountry = {};
        postsResponse.data.ids.forEach(postId => {
          const post = postsResponse.data.entities[postId];
          const countryId = post.country;
          if (!postsByCountry[countryId]) {
            postsByCountry[countryId] = [];
          }
          postsByCountry[countryId].push(post);
        });
        
        console.log('\n🌍 Posts by country:');
        Object.keys(postsByCountry).forEach(countryId => {
          console.log(`- Country ${countryId}: ${postsByCountry[countryId].length} posts`);
        });
        
        // Test dashboard for each country that has posts
        console.log('\n📊 Testing dashboard for each country with posts...');
        for (const countryId of Object.keys(postsByCountry)) {
          console.log(`\nTesting country: ${countryId}`);
          try {
            const dashboardResponse = await axios.get(`${apiUrl}/dashboard?currentCountry=${countryId}`, { timeout: 10000 });
            console.log('✅ Dashboard working for this country!');
            console.log('- Total Posts:', dashboardResponse.data.totalPosts);
            console.log('- Total Founds:', dashboardResponse.data.totalFounds);
            console.log('- Total Losts:', dashboardResponse.data.totalLosts);
            console.log('- Recent Founds:', dashboardResponse.data.recentFounds?.length || 0);
            console.log('- Recent Losts:', dashboardResponse.data.recentLosts?.length || 0);
            
            if (dashboardResponse.data.totalPosts > 0) {
              console.log('🎉 SUCCESS! Found working dashboard with posts!');
              console.log(`💡 Use country ID: ${countryId}`);
              return;
            }
          } catch (error) {
            console.log('❌ Dashboard failed for this country:', error.response?.data?.message || error.message);
          }
        }
        
      } else {
        console.log('❌ No posts found in database');
      }
      
    } catch (error) {
      console.log('❌ Failed to get posts:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ General Error:', error.message);
  }
}

checkAllPosts();
