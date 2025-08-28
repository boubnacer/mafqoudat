const axios = require('axios');

async function testCurrentState() {
  try {
    const apiUrl = 'https://mafqoudat-production.up.railway.app';
    const moroccoCountryId = '68a4b54ab46524c54c553ca9';

    console.log('🔍 Testing current dashboard state...');
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
      console.log('\n🔥 Trending Post:');
      console.log('- categoryName:', trendingPost.categoryName);
      console.log('- floptionName:', trendingPost.floptionName);
      console.log('- cityName:', trendingPost.cityName);
      console.log('- countryname:', trendingPost.countryname);
    }

    // Test recent founds fields
    if (response.data?.recentFounds?.length > 0) {
      console.log('\n📝 Recent Founds:');
      response.data.recentFounds.forEach((post, index) => {
        console.log(`Post ${index + 1}:`);
        console.log(`  - categoryname: ${post.categoryname}`);
        console.log(`  - cityName: ${post.cityName}`);
        console.log(`  - countryname: ${post.countryname}`);
      });
    }

    // Test recent losts fields
    if (response.data?.recentLosts?.length > 0) {
      console.log('\n📝 Recent Losts:');
      response.data.recentLosts.forEach((post, index) => {
        console.log(`Post ${index + 1}:`);
        console.log(`  - categoryname: ${post.categoryname}`);
        console.log(`  - cityName: ${post.cityName}`);
        console.log(`  - countryname: ${post.countryname}`);
      });
    }

    console.log('\n📊 Summary:');
    console.log('- Total Founds:', response.data?.totalFounds);
    console.log('- Total Losts:', response.data?.totalLosts);
    console.log('- Recent Founds:', response.data?.recentFounds?.length || 0);
    console.log('- Recent Losts:', response.data?.recentLosts?.length || 0);
    console.log('- Trending Posts:', response.data?.trendingPost?.length || 0);

    // Check if we're getting variety in categories and cities
    const allPosts = [
      ...(response.data?.trendingPost || []),
      ...(response.data?.recentFounds || []),
      ...(response.data?.recentLosts || [])
    ];

    const categories = [...new Set(allPosts.map(post => post.categoryName || post.categoryname))];
    const cities = [...new Set(allPosts.map(post => post.cityName))];

    console.log('\n🎯 Variety Check:');
    console.log(`- Unique categories: ${categories.length} (${categories.join(', ')})`);
    console.log(`- Unique cities: ${cities.length} (${cities.join(', ')})`);

    if (categories.length > 1 && cities.length > 1) {
      console.log('✅ Great! We have variety in categories and cities');
    } else if (categories.length === 1 && categories[0] === 'ELECTRONICS') {
      console.log('⚠️ All posts still showing ELECTRONICS - need to run the fix script');
    } else if (cities.length === 1 && cities[0] === 'Casablanca') {
      console.log('⚠️ All posts still showing Casablanca - need to run the fix script');
    }

  } catch (error) {
    console.log('❌ Dashboard API call failed');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data || error.message);
  }
}

testCurrentState();
