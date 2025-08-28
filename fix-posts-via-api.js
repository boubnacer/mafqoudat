const axios = require('axios');

async function fixPostsViaAPI() {
  try {
    console.log('🔍 Getting posts via API...');
    
    // First, let's get all posts from the API
    const response = await axios.get('https://mafqoudat-production.up.railway.app/dashboard?currentCountry=68a4b54ab46524c54c553ca9', {
      timeout: 15000
    });

    console.log('✅ Got posts from API');
    
    // Get categories and cities from the API
    console.log('📋 Getting categories...');
    const categoriesResponse = await axios.get('https://mafqoudat-production.up.railway.app/categories', {
      timeout: 15000
    });
    
    console.log('🏙️ Getting cities...');
    const citiesResponse = await axios.get('https://mafqoudat-production.up.railway.app/cities', {
      timeout: 15000
    });

    const categories = categoriesResponse.data;
    const cities = citiesResponse.data;
    
    console.log('Categories response:', typeof categories, Array.isArray(categories));
    console.log('Cities response:', typeof cities, Array.isArray(cities));
    
    if (Array.isArray(categories)) {
      console.log(`Found ${categories.length} categories:`, categories.map(c => c.code));
    } else {
      console.log('Categories response:', categories);
    }
    
    if (Array.isArray(cities)) {
      console.log(`Found ${cities.length} cities`);
    } else {
      console.log('Cities response:', cities);
    }

    // Get Morocco cities
    let moroccoCities = [];
    if (Array.isArray(cities)) {
      moroccoCities = cities.filter(city => city.country === '68a4b54ab46524c54c553ca9');
      console.log(`Found ${moroccoCities.length} Morocco cities:`, moroccoCities.map(c => c.code));
    }

    if (moroccoCities.length === 0) {
      console.log('❌ No Morocco cities found');
      return;
    }

    // Get all posts from the response
    const allPosts = [
      ...(response.data?.trendingPost || []),
      ...(response.data?.recentFounds || []),
      ...(response.data?.recentLosts || [])
    ];

    console.log(`Found ${allPosts.length} posts to fix`);

    // Since we can't update posts via API (no update endpoint), let's create a script
    // that you can run manually to update the posts
    console.log('\n📝 Here are the MongoDB commands to fix the posts:');
    
    for (let i = 0; i < allPosts.length; i++) {
      const post = allPosts[i];
      const cityIndex = i % moroccoCities.length;
      const city = moroccoCities[cityIndex];
      
      console.log(`db.posts.updateOne({_id: ObjectId("${post._id}")}, {$set: {city: ObjectId("${city._id}")}})`);
    }

    console.log('\n🎯 To fix this, you need to:');
    console.log('1. Connect to your MongoDB database');
    console.log('2. Run the above commands to update each post');
    console.log('3. Or create a simple script that connects to MongoDB and runs these updates');

  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
}

console.log('🚀 Starting to analyze posts via API...');
fixPostsViaAPI();
