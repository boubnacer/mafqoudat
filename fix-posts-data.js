const mongoose = require('mongoose');

async function fixPostsData() {
  try {
    const uri = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    const Post = require('./server/models/Post');
    const Category = require('./server/models/Category');
    const City = require('./server/models/City');

    // Get all categories and cities
    const categories = await Category.find();
    const cities = await City.find();
    
    console.log(`📋 Found ${categories.length} categories`);
    console.log(`🏙️ Found ${cities.length} cities`);

    if (categories.length === 0) {
      console.log('❌ No categories found in database');
      return;
    }

    // Get all posts
    const posts = await Post.find();
    console.log(`📝 Found ${posts.length} posts to check`);

    let fixedCount = 0;

    for (const post of posts) {
      let needsUpdate = false;
      const updateData = {};

      // Check if post has a valid category
      if (!post.category || !categories.some(cat => cat._id.toString() === post.category?.toString())) {
        console.log(`❌ Post ${post._id}: Invalid or missing category`);
        // Assign the first available category (ELECTRONICS is usually first)
        const defaultCategory = categories.find(cat => cat.code === 'ELECTRONICS') || categories[0];
        updateData.category = defaultCategory._id;
        needsUpdate = true;
        console.log(`✅ Will assign category: ${defaultCategory.code}`);
      }

      // Check if post has a valid city for its country
      if (!post.city || !cities.some(city => city._id.toString() === post.city?.toString())) {
        console.log(`❌ Post ${post._id}: Invalid or missing city`);
        // Find a city from the same country
        const countryCities = cities.filter(city => city.country.toString() === post.country.toString());
        if (countryCities.length > 0) {
          // Prefer Casablanca if available, otherwise take the first city
          const defaultCity = countryCities.find(city => city.code === 'CASABLANCA') || countryCities[0];
          updateData.city = defaultCity._id;
          needsUpdate = true;
          console.log(`✅ Will assign city: ${defaultCity.code}`);
        }
      }

      // Update the post if needed
      if (needsUpdate) {
        await Post.findByIdAndUpdate(post._id, updateData);
        fixedCount++;
        console.log(`✅ Fixed post ${post._id}`);
      }
    }

    console.log(`\n🎉 Fixed ${fixedCount} posts with invalid references`);

    // Verify the fix by checking a few posts
    console.log('\n🔍 Verifying the fix...');
    const samplePosts = await Post.find().limit(3);
    for (const post of samplePosts) {
      const category = await Category.findById(post.category);
      const city = await City.findById(post.city);
      console.log(`Post ${post._id}:`);
      console.log(`  - Category: ${category?.code || 'NOT FOUND'}`);
      console.log(`  - City: ${city?.code || 'NOT FOUND'}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the fix
fixPostsData();
