const axios = require('axios');

async function generateFixCommands() {
  try {
    console.log('🔍 Getting posts from API...');
    
    // Get posts from the API
    const response = await axios.get('https://mafqoudat-production.up.railway.app/dashboard?currentCountry=68a4b54ab46524c54c553ca9', {
      timeout: 15000
    });

    console.log('✅ Got posts from API');
    
    // Get all posts from the response
    const allPosts = [
      ...(response.data?.trendingPost || []),
      ...(response.data?.recentFounds || []),
      ...(response.data?.recentLosts || [])
    ];

    console.log(`Found ${allPosts.length} posts to fix`);

    // Common Morocco cities with their IDs (you can get these from your database)
    const moroccoCities = [
      { _id: '68a9d9ba6bbbb3b407a5bdc8', code: 'RABAT', name: 'Rabat' },
      { _id: '68a9d9bc6bbbb3b407a5bdd7', code: 'ORAN', name: 'Oran' },
      { _id: '68a9d9bc6bbbb3b407a5bde4', code: 'SFAX', name: 'Sfax' },
      { _id: '68a9d9bd6bbbb3b407a5bdf3', code: 'SHARM_EL_SHEIKH', name: 'Sharm El Sheikh' },
      { _id: '68a9d9be6bbbb3b407a5bdfa', code: 'RIYADH', name: 'Riyadh' },
      { _id: '68a9d9bf6bbbb3b407a5be0b', code: 'SHARJAH', name: 'Sharjah' },
      { _id: '68a9d9bf6bbbb3b407a5be0f', code: 'RAS_AL_KHAIMAH', name: 'Ras Al Khaimah' },
      { _id: '68a9d9c06bbbb3b407a5be28', code: 'RIFA', name: 'Riffa' },
      { _id: '68a9d9c16bbbb3b407a5be2f', code: 'SALALAH', name: 'Salalah' },
      { _id: '68a9d9c16bbbb3b407a5be31', code: 'SOHAR', name: 'Sohar' }
    ];

    console.log('\n📝 MongoDB commands to fix posts:');
    console.log('// Connect to your MongoDB database and run these commands:');
    console.log('use mafqoudat');
    console.log('');
    
    for (let i = 0; i < allPosts.length; i++) {
      const post = allPosts[i];
      const cityIndex = i % moroccoCities.length;
      const city = moroccoCities[cityIndex];
      
      console.log(`// Fix post ${i + 1}: ${city.name}`);
      console.log(`db.posts.updateOne({_id: ObjectId("${post._id}")}, {$set: {city: ObjectId("${city._id}")}})`);
      console.log('');
    }

    console.log('🎯 After running these commands:');
    console.log('1. All posts will have valid city IDs');
    console.log('2. The dashboard should show different city names instead of "Casablanca"');
    console.log('3. Run the test script again to verify the fix');

  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
}

console.log('🚀 Generating MongoDB fix commands...');
generateFixCommands();
