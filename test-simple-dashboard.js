const axios = require('axios');

async function testDashboard() {
  try {
    const apiUrl = 'https://mafqoudat-production.up.railway.app';
    const moroccoCountryId = '68a4b54ab46524c54c553ca9';
    
    console.log('🔍 Testing dashboard API...');
    console.log('API URL:', apiUrl);
    console.log('Country ID:', moroccoCountryId);
    
    const response = await axios.get(`${apiUrl}/dashboard?currentCountry=${moroccoCountryId}`, { 
      timeout: 15000
    });
    
    console.log('✅ Dashboard API call successful!');
    console.log('Status:', response.status);
    
    // Check if we have data
    if (response.data?.recentFounds?.length > 0) {
      const firstPost = response.data.recentFounds[0];
      console.log('\n📝 First post data:');
      console.log('- ID:', firstPost._id);
      console.log('- Category Name:', firstPost.categoryname);
      console.log('- City Name:', firstPost.cityName);
      console.log('- FoundLost Name:', firstPost.floptionName);
      console.log('- Username:', firstPost.username);
      
      // Check the raw category and city IDs
      console.log('\n🔍 Raw field values:');
      console.log('- Category field:', firstPost.category);
      console.log('- City field:', firstPost.city);
      console.log('- FoundLost field:', firstPost.foundLost);
    }
    
    if (response.data?.trendingPost?.length > 0) {
      const trendingPost = response.data.trendingPost[0];
      console.log('\n🔥 Trending post data:');
      console.log('- ID:', trendingPost._id);
      console.log('- Category Name:', trendingPost.categoryName);
      console.log('- City Name:', trendingPost.cityName);
      console.log('- FoundLost Name:', trendingPost.floptionName);
    }
    
    console.log('\n📊 Summary:');
    console.log('- Total Founds:', response.data?.totalFounds);
    console.log('- Total Losts:', response.data?.totalLosts);
    console.log('- Recent Founds:', response.data?.recentFounds?.length || 0);
    console.log('- Recent Losts:', response.data?.recentLosts?.length || 0);
    console.log('- Trending Posts:', response.data?.trendingPost?.length || 0);
    
  } catch (error) {
    console.log('❌ Dashboard API call failed');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data || error.message);
  }
}

testDashboard();
