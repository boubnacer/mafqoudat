const axios = require('axios');

async function testDashboardWithPostCountry() {
  try {
    const apiUrl = 'https://mafqoudat-production.up.railway.app';
    
    // Country ID from your post
    const postCountryId = '68a4b54ab46524c54c553cae';
    
    console.log('🔍 Testing dashboard with post country...');
    console.log('API URL:', apiUrl);
    console.log('Post Country ID:', postCountryId);
    
    // Test dashboard with the country ID from your post
    console.log('\n📊 Testing dashboard with post country ID...');
    try {
      const dashboardResponse = await axios.get(`${apiUrl}/dashboard?currentCountry=${postCountryId}`, { timeout: 10000 });
      
      console.log('✅ Dashboard working with post country!');
      console.log('📈 Dashboard data:');
      console.log('- Total Posts:', dashboardResponse.data.totalPosts);
      console.log('- Total Founds:', dashboardResponse.data.totalFounds);
      console.log('- Total Losts:', dashboardResponse.data.totalLosts);
      console.log('- Recent Founds:', dashboardResponse.data.recentFounds?.length || 0);
      console.log('- Recent Losts:', dashboardResponse.data.recentLosts?.length || 0);
      console.log('- Trending Post:', dashboardResponse.data.trendingPost ? 'Yes' : 'No');
      
      if (dashboardResponse.data.totalPosts > 0) {
        console.log('\n🎉 SUCCESS! Dashboard is working and showing posts!');
        console.log(`💡 The correct country ID to use is: ${postCountryId}`);
        
        // Show recent posts details
        if (dashboardResponse.data.recentFounds?.length > 0) {
          console.log('\n📝 Recent Founds:');
          dashboardResponse.data.recentFounds.forEach((post, index) => {
            console.log(`  ${index + 1}. ${post.title || 'No title'} - ${post.createdAt}`);
          });
        }
        
        if (dashboardResponse.data.recentLosts?.length > 0) {
          console.log('\n📝 Recent Losts:');
          dashboardResponse.data.recentLosts.forEach((post, index) => {
            console.log(`  ${index + 1}. ${post.title || 'No title'} - ${post.createdAt}`);
          });
        }
        
        if (dashboardResponse.data.trendingPost) {
          console.log('\n🔥 Trending Post:');
          console.log(`  Title: ${dashboardResponse.data.trendingPost.title || 'No title'}`);
          console.log(`  Category: ${dashboardResponse.data.trendingPost.categoryName}`);
          console.log(`  Type: ${dashboardResponse.data.trendingPost.floptionName}`);
        }
        
      } else {
        console.log('\n❌ Dashboard working but no posts found for this country');
      }
      
    } catch (dashboardError) {
      console.log('❌ Dashboard failing with post country:', dashboardError.response?.data || dashboardError.message);
    }
    
    // Also test with Morocco for comparison
    console.log('\n📊 Testing dashboard with Morocco for comparison...');
    const moroccoCountryId = '68a4b54ab46524c54c553ca9';
    try {
      const moroccoDashboardResponse = await axios.get(`${apiUrl}/dashboard?currentCountry=${moroccoCountryId}`, { timeout: 10000 });
      
      console.log('📈 Morocco dashboard data:');
      console.log('- Total Posts:', moroccoDashboardResponse.data.totalPosts);
      console.log('- Total Founds:', moroccoDashboardResponse.data.totalFounds);
      console.log('- Total Losts:', moroccoDashboardResponse.data.totalLosts);
      
    } catch (moroccoError) {
      console.log('❌ Morocco dashboard failing:', moroccoError.response?.data || moroccoError.message);
    }
    
  } catch (error) {
    console.error('❌ General Error:', error.message);
  }
}

testDashboardWithPostCountry();
