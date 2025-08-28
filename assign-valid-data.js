const mongoose = require('mongoose');

async function assignValidData() {
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
        // Assign the first available category
        updateData.category = categories[0]._id;
        needsUpdate = true;
        console.log(`✅ Will assign category: ${categories[0].code}`);
      }

      // Check if post has a valid city for its country
      if (!post.city || !cities.some(city => city._id.toString() === post.city?.toString())) {
        console.log(`❌ Post ${post._id}: Invalid or missing city`);
        // Find a city from the same country
        const countryCities = cities.filter(city => city.country.toString() === post.country.toString());
        if (countryCities.length > 0) {
          updateData.city = countryCities[0]._id;
          needsUpdate = true;
          console.log(`✅ Will assign city: ${countryCities[0].code}`);
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

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Uncomment the line below to run the fix
// assignValidData();
console.log('💡 To fix data by assigning valid category/city IDs, uncomment the last line in this script and run it');
