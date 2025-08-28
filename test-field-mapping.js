const axios = require('axios');

async function testFieldMapping() {
  try {
    const apiUrl = 'https://mafqoudat-production.up.railway.app';
    const moroccoCountryId = '68a4b54ab46524c54c553ca9';

    console.log('🔍 Testing field mapping between client and server...');
    console.log('API URL:', apiUrl);
    console.log('Country ID:', moroccoCountryId);

    const response = await axios.get(`${apiUrl}/dashboard?currentCountry=${moroccoCountryId}`, {
      timeout: 15000
    });

    console.log('✅ Dashboard API call successful!');
    console.log('Status:', response.status);

    // Test trending post fields
    if (response.data?.trendingPost?.length > 0) {
      const trendingPost = response.data.trendingPost[0];
      console.log('\n🔥 Trending Post Fields:');
      console.log('- categoryName:', trendingPost.categoryName);
      console.log('- floptionName:', trendingPost.floptionName);
      console.log('- countryLabels:', trendingPost.countryLabels);
      console.log('- countryname:', trendingPost.countryname);
      console.log('- Raw category field:', trendingPost.category);
      console.log('- Raw city field:', trendingPost.city);
    }

    // Test recent founds fields
    if (response.data?.recentFounds?.length > 0) {
      const recentFound = response.data.recentFounds[0];
      console.log('\n📝 Recent Found Fields:');
      console.log('- categoryname:', recentFound.categoryname);
      console.log('- cityName:', recentFound.cityName);
      console.log('- cityLabels:', recentFound.cityLabels);
      console.log('- countryLabels:', recentFound.countryLabels);
      console.log('- countryname:', recentFound.countryname);
      console.log('- Raw category field:', recentFound.category);
      console.log('- Raw city field:', recentFound.city);
    }

    // Test recent losts fields
    if (response.data?.recentLosts?.length > 0) {
      const recentLost = response.data.recentLosts[0];
      console.log('\n📝 Recent Lost Fields:');
      console.log('- categoryname:', recentLost.categoryname);
      console.log('- cityName:', recentLost.cityName);
      console.log('- cityLabels:', recentLost.cityLabels);
      console.log('- countryLabels:', recentLost.countryLabels);
      console.log('- countryname:', recentLost.countryname);
      console.log('- Raw category field:', recentLost.category);
      console.log('- Raw city field:', recentLost.city);
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

testFieldMapping();
