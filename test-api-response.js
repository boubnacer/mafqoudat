const axios = require('axios');

async function testApiResponse() {
  try {
    console.log('🔍 Testing dashboard API response...');
    
    const response = await axios.get('https://mafqoudat-production.up.railway.app/dashboard?currentCountry=68a4b54ab46524c54c553ca9', {
      timeout: 15000
    });

    console.log('✅ API Response Status:', response.status);
    console.log('📊 Response Data:');
    
    // Log trending post data
    if (response.data?.trendingPost?.length > 0) {
      const trendingPost = response.data.trendingPost[0];
      console.log('\n🔥 Trending Post Raw Data:');
      console.log(JSON.stringify(trendingPost, null, 2));
    }

    // Log recent founds data
    if (response.data?.recentFounds?.length > 0) {
      console.log('\n📝 Recent Founds Raw Data:');
      response.data.recentFounds.forEach((post, index) => {
        console.log(`\nPost ${index + 1}:`);
        console.log(JSON.stringify(post, null, 2));
      });
    }

    // Log recent losts data
    if (response.data?.recentLosts?.length > 0) {
      console.log('\n📝 Recent Losts Raw Data:');
      response.data.recentLosts.forEach((post, index) => {
        console.log(`\nPost ${index + 1}:`);
        console.log(JSON.stringify(post, null, 2));
      });
    }

  } catch (error) {
    console.log('❌ API call failed:');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data || error.message);
  }
}

testApiResponse();
