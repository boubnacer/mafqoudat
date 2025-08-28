const axios = require('axios');

async function testDashboardSimple() {
  try {
    const apiUrl = 'https://mafqoudat-production.up.railway.app';
    const moroccoCountryId = '68a4b54ab46524c54c553ca9';
    
    console.log('🔍 Testing dashboard after deployment...');
    console.log('API URL:', apiUrl);
    console.log('Country ID:', moroccoCountryId);
    
    // Test dashboard endpoint
    console.log('\n📊 Testing dashboard endpoint...');
    try {
      const response = await axios.get(`${apiUrl}/dashboard?currentCountry=${moroccoCountryId}`, {
        timeout: 10000 // 10 second timeout
      });
      
      console.log('✅ Dashboard Status:', response.status);
      console.log('📈 Dashboard Data:');
      console.log('- Total Posts:', response.data.totalPosts || 0);
      console.log('- Total Founds:', response.data.totalFounds || 0);
      console.log('- Total Losts:', response.data.totalLosts || 0);
      console.log('- Recent Founds:', response.data.recentFounds?.length || 0);
      console.log('- Recent Losts:', response.data.recentLosts?.length || 0);
      console.log('- Trending Post:', response.data.trendingPost ? 'Yes' : 'No');
      
      if (response.data.totalPosts === 0) {
        console.log('\n💡 Dashboard is working but no posts found for Morocco.');
        console.log('This is expected since you just created posts with the new country/city IDs.');
        console.log('The dashboard should now show your posts once they are created.');
      } else {
        console.log('\n🎉 Dashboard is working and showing posts!');
      }
      
    } catch (error) {
      console.error('❌ Dashboard Error:', error.response?.data || error.message);
      
      if (error.response?.status === 404) {
        console.log('\n💡 The deployment might still be in progress.');
        console.log('Please wait a few minutes and try again.');
      }
    }
    
  } catch (error) {
    console.error('❌ General Error:', error.message);
  }
}

testDashboardSimple();
