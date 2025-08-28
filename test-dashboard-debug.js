const axios = require('axios');

async function testDashboardDebug() {
  try {
    const apiUrl = 'https://mafqoudat-production.up.railway.app';
    const moroccoCountryId = '68a4b54ab46524c54c553ca9';
    
    console.log('🔍 Debugging dashboard aggregation...');
    console.log('API URL:', apiUrl);
    console.log('Country ID:', moroccoCountryId);
    
    // Test dashboard with detailed logging
    console.log('\n📊 Testing dashboard...');
    try {
      const dashboardResponse = await axios.get(`${apiUrl}/dashboard?currentCountry=${moroccoCountryId}`, { 
        timeout: 15000
      });
      
      console.log('✅ Dashboard call successful!');
      console.log('Status:', dashboardResponse.status);
      
      // Analyze the first post in detail
      if (dashboardResponse.data?.recentFounds?.length > 0) {
        const firstPost = dashboardResponse.data.recentFounds[0];
        console.log('\n📝 First post analysis:');
        console.log('- ID:', firstPost._id);
        console.log('- Category Name:', firstPost.categoryname);
        console.log('- FoundLost Name:', firstPost.floptionName);
        console.log('- City Name:', firstPost.cityName);
        console.log('- Country Name:', firstPost.countryname);
        console.log('- Username:', firstPost.username);
        
        // Check if the post has the original IDs
        console.log('\n🔍 Original field values:');
        console.log('- Category field:', firstPost.category);
        console.log('- FoundLost field:', firstPost.foundLost);
        console.log('- City field:', firstPost.city);
        console.log('- Country field:', firstPost.country);
        console.log('- User field:', firstPost.user);
      }
      
      // Check trending post
      if (dashboardResponse.data?.trendingPost?.length > 0) {
        const trendingPost = dashboardResponse.data.trendingPost[0];
        console.log('\n🔥 Trending post analysis:');
        console.log('- ID:', trendingPost._id);
        console.log('- Category Name:', trendingPost.categoryName);
        console.log('- FoundLost Name:', trendingPost.floptionName);
        console.log('- City Name:', trendingPost.cityName);
        console.log('- Country Name:', trendingPost.countryname);
      }
      
    } catch (error) {
      console.log('❌ Dashboard call failed');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ General Error:', error.message);
  }
}

testDashboardDebug();
