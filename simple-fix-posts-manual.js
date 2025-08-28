const mongoose = require('mongoose');

async function fixPostsManual() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    
    // Try different connection options
    const uri = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';
    
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      maxPoolSize: 10,
      minPoolSize: 1
    });
    
    console.log('✅ Connected to MongoDB');

    const Post = require('./server/models/Post');
    const Category = require('./server/models/Category');
    const City = require('./server/models/City');

    // Get categories and cities
    console.log('📋 Fetching categories...');
    const categories = await Category.find().lean();
    console.log(`Found ${categories.length} categories:`, categories.map(c => c.code));
    
    console.log('🏙️ Fetching cities...');
    const cities = await City.find().lean();
    console.log(`Found ${cities.length} cities`);

    // Get Morocco cities
    const moroccoCities = cities.filter(city => city.country.toString() === '68a4b54ab46524c54c553ca9');
    console.log(`Found ${moroccoCities.length} Morocco cities:`, moroccoCities.map(c => c.code));

    if (moroccoCities.length === 0) {
      console.log('❌ No Morocco cities found');
      return;
    }

    // Get all posts
    console.log('📝 Fetching posts...');
    const posts = await Post.find().lean();
    console.log(`Found ${posts.length} posts`);

    // Fix each post
    let fixedCount = 0;
    
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      
      // Assign a city (currently all posts have city: null)
      const cityIndex = i % moroccoCities.length;
      const city = moroccoCities[cityIndex];
      
      // Keep the existing category (it seems to be valid)
      const updateData = {
        city: city._id
      };
      
      // Update the post
      await Post.findByIdAndUpdate(post._id, updateData);
      
      console.log(`✅ Fixed post ${post._id}: city = ${city.code}`);
      fixedCount++;
    }

    console.log(`\n🎉 Fixed ${fixedCount} posts with valid cities`);

    // Test the dashboard API
    console.log('\n🧪 Testing dashboard API...');
    const axios = require('axios');
    try {
      const response = await axios.get('https://mafqoudat-production.up.railway.app/dashboard?currentCountry=68a4b54ab46524c54c553ca9', {
        timeout: 15000
      });
      
      if (response.data?.recentFounds?.length > 0) {
        console.log('✅ Dashboard API test successful!');
        response.data.recentFounds.forEach((post, index) => {
          console.log(`Post ${index + 1}: ${post.categoryname} in ${post.cityName}`);
        });
      }
    } catch (error) {
      console.log('❌ Dashboard API test failed:', error.message);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    try {
      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB');
    } catch (e) {
      console.log('⚠️ Error disconnecting:', e.message);
    }
  }
}

console.log('🚀 Starting to fix posts manually...');
fixPostsManual();
