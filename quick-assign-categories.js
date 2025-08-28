const mongoose = require('mongoose');

async function quickAssignCategories() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    const uri = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    const Post = require('./server/models/Post');
    const Category = require('./server/models/Category');
    const City = require('./server/models/City');

    // Get categories and cities
    const categories = await Category.find();
    const cities = await City.find();
    
    console.log(`📋 Found ${categories.length} categories`);
    console.log(`🏙️ Found ${cities.length} cities`);

    if (categories.length === 0) {
      console.log('❌ No categories found');
      return;
    }

    // Get Morocco cities
    const moroccoCities = cities.filter(city => city.country.toString() === '68a4b54ab46524c54c553ca9');
    console.log(`🏙️ Found ${moroccoCities.length} cities in Morocco`);

    // Get all posts
    const posts = await Post.find();
    console.log(`📝 Found ${posts.length} posts`);

    // Assign different categories and cities to posts
    let updatedCount = 0;
    
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      
      // Assign different categories in rotation
      const categoryIndex = i % categories.length;
      const category = categories[categoryIndex];
      
      // Assign different cities in rotation (only Morocco cities)
      const cityIndex = i % moroccoCities.length;
      const city = moroccoCities[cityIndex];
      
      await Post.findByIdAndUpdate(post._id, {
        category: category._id,
        city: city._id
      });
      
      console.log(`✅ Updated post ${post._id}: ${category.code} in ${city.code}`);
      updatedCount++;
    }

    console.log(`\n🎉 Updated ${updatedCount} posts with valid categories and cities`);

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
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

console.log('🚀 Starting quick category assignment...');
quickAssignCategories();
