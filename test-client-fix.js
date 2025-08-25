const axios = require('axios');

async function testClientFix() {
  try {
    const apiUrl = 'https://mafqoudat-production.up.railway.app';
    
    console.log('Testing client-side fix...');
    console.log('Testing with correct Morocco country ID: 68a4b54ab46524c54c553ca9');
    
    // Test dashboard with correct Morocco ID
    const dashboardResponse = await axios.get(`${apiUrl}/dashboard?currentCountry=68a4b54ab46524c54c553ca9`);
    const data = dashboardResponse.data;
    
    console.log('\nDashboard Results:');
    console.log('Total Posts:', data.totalPosts);
    console.log('Total Founds:', data.totalFounds);
    console.log('Total Losts:', data.totalLosts);
    console.log('Has Trending Post:', data.trendingPost && data.trendingPost.length > 0);
    console.log('Recent Founds Count:', data.recentFounds?.length || 0);
    console.log('Recent Losts Count:', data.recentLosts?.length || 0);
    
    if (data.totalPosts > 0) {
      console.log('\n✅ SUCCESS: Posts are found in the database!');
      console.log('The issue was the incorrect country ID in the client code.');
      console.log('The fix should work once you deploy the updated client code.');
    } else {
      console.log('\n❌ Still no posts found. There might be another issue.');
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testClientFix();
