const mongoose = require('mongoose');

async function quickFixCategories() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    const uri = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    const Post = require('./server/models/Post');
    const Category = require('./server/models/Category');

    // Get all categories
    const categories = await Category.find();
    console.log(`📋 Found ${categories.length} categories`);

    if (categories.length === 0) {
      console.log('❌ No categories found');
      return;
    }

    // Get posts with undefined or null category
    const postsToFix = await Post.find({
      $or: [
        { category: { $exists: false } },
        { category: null },
        { category: undefined }
      ]
    });

    console.log(`📝 Found ${postsToFix.length} posts with missing categories`);

    if (postsToFix.length === 0) {
      console.log('✅ All posts already have valid categories');
      return;
    }

    // Get the ELECTRONICS category as default, or first available
    const defaultCategory = categories.find(cat => cat.code === 'ELECTRONICS') || categories[0];
    console.log(`🎯 Using default category: ${defaultCategory.code}`);

    // Update all posts with missing categories
    const result = await Post.updateMany(
      {
        $or: [
          { category: { $exists: false } },
          { category: null },
          { category: undefined }
        ]
      },
      {
        $set: { category: defaultCategory._id }
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} posts with category: ${defaultCategory.code}`);

    // Verify the fix
    const remainingPosts = await Post.find({
      $or: [
        { category: { $exists: false } },
        { category: null },
        { category: undefined }
      ]
    });

    console.log(`🔍 Posts still missing categories: ${remainingPosts.length}`);

    // Test the dashboard API
    console.log('\n🧪 Testing dashboard API...');
    const axios = require('axios');
    try {
      const response = await axios.get('https://mafqoudat-production.up.railway.app/dashboard?currentCountry=68a4b54ab46524c54c553ca9', {
        timeout: 15000
      });
      
      if (response.data?.recentFounds?.length > 0) {
        const post = response.data.recentFounds[0];
        console.log('✅ Dashboard API test successful!');
        console.log(`  - categoryname: ${post.categoryname}`);
        console.log(`  - cityName: ${post.cityName}`);
        console.log(`  - countryname: ${post.countryname}`);
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

console.log('🚀 Starting quick category fix...');
quickFixCategories();
