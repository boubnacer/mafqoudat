const axios = require('axios');

async function checkPostCountry() {
  try {
    const apiUrl = 'https://mafqoudat-production.up.railway.app';
    
    console.log('🔍 Checking post country and fixing dashboard...');
    console.log('API URL:', apiUrl);
    
    // Test 1: Get all posts to see what countries they belong to
    console.log('\n1️⃣ Getting all posts to check countries...');
    try {
      const postsResponse = await axios.get(`${apiUrl}/posts?page=1&pageSize=10`, { timeout: 10000 });
      const posts = postsResponse.data?.entities || {};
      const postIds = postsResponse.data?.ids || [];
      
      console.log(`📊 Found ${postIds.length} posts in database`);
      
      if (postIds.length > 0) {
        console.log('\n📝 Post details:');
        postIds.forEach((postId, index) => {
          const post = posts[postId];
          console.log(`\nPost ${index + 1}:`);
          console.log('- ID:', post._id);
          console.log('- Country ID:', post.country);
          console.log('- FoundLost ID:', post.foundLost);
          console.log('- Category ID:', post.category);
          console.log('- Title:', post.title || 'No title');
          console.log('- Created:', post.createdAt);
        });
        
        // Get the country ID from the first post
        const firstPost = posts[postIds[0]];
        const actualCountryId = firstPost.country;
        
        console.log(`\n🎯 Actual country ID from posts: ${actualCountryId}`);
        
        // Test 2: Test dashboard with the actual country ID
        console.log('\n2️⃣ Testing dashboard with actual country ID...');
        try {
          const dashboardResponse = await axios.get(`${apiUrl}/dashboard?currentCountry=${actualCountryId}`, { timeout: 10000 });
          
          console.log('✅ Dashboard working with actual country!');
          console.log('📈 Dashboard data:');
          console.log('- Total Posts:', dashboardResponse.data.totalPosts);
          console.log('- Total Founds:', dashboardResponse.data.totalFounds);
          console.log('- Total Losts:', dashboardResponse.data.totalLosts);
          console.log('- Recent Founds:', dashboardResponse.data.recentFounds?.length || 0);
          console.log('- Recent Losts:', dashboardResponse.data.recentLosts?.length || 0);
          console.log('- Trending Post:', dashboardResponse.data.trendingPost ? 'Yes' : 'No');
          
          if (dashboardResponse.data.totalPosts > 0) {
            console.log('\n🎉 SUCCESS! Dashboard is working and showing posts!');
            console.log(`💡 The correct country ID to use is: ${actualCountryId}`);
          }
          
        } catch (dashboardError) {
          console.log('❌ Dashboard still failing with actual country:', dashboardError.response?.data || dashboardError.message);
        }
        
        // Test 3: Compare with Morocco country ID
        console.log('\n3️⃣ Testing dashboard with Morocco country ID...');
        const moroccoCountryId = '68a4b54ab46524c54c553ca9';
        try {
          const moroccoDashboardResponse = await axios.get(`${apiUrl}/dashboard?currentCountry=${moroccoCountryId}`, { timeout: 10000 });
          
          console.log('📊 Morocco dashboard data:');
          console.log('- Total Posts:', moroccoDashboardResponse.data.totalPosts);
          console.log('- Total Founds:', moroccoDashboardResponse.data.totalFounds);
          console.log('- Total Losts:', moroccoDashboardResponse.data.totalLosts);
          
        } catch (moroccoError) {
          console.log('❌ Morocco dashboard failing:', moroccoError.response?.data || moroccoError.message);
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

checkPostCountry();
