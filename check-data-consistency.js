const mongoose = require('mongoose');

async function checkDataConsistency() {
  try {
    const uri = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    const Post = require('./server/models/Post');
    const Category = require('./server/models/Category');
    const City = require('./server/models/City');

    // Get all posts
    const posts = await Post.find().limit(10);
    console.log(`\n📝 Found ${posts.length} posts to check`);

    // Get all categories
    const categories = await Category.find();
    console.log(`📋 Found ${categories.length} categories`);

    // Get all cities
    const cities = await City.find();
    console.log(`🏙️ Found ${cities.length} cities`);

    // Check each post
    posts.forEach((post, index) => {
      console.log(`\n🔍 Post ${index + 1}:`);
      console.log(`- ID: ${post._id}`);
      console.log(`- Category ID: ${post.category}`);
      console.log(`- City ID: ${post.city}`);
      
      // Check if category exists
      const categoryExists = categories.some(cat => cat._id.toString() === post.category?.toString());
      console.log(`- Category exists: ${categoryExists ? '✅' : '❌'}`);
      
      // Check if city exists
      const cityExists = cities.some(city => city._id.toString() === post.city?.toString());
      console.log(`- City exists: ${cityExists ? '✅' : '❌'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkDataConsistency();
