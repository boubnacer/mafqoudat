const mongoose = require('mongoose');

async function fixDataInconsistencies() {
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

    // Get all posts
    const posts = await Post.find();
    console.log(`📝 Found ${posts.length} posts to check`);

    let fixedCount = 0;

    for (const post of posts) {
      let needsUpdate = false;
      const updateData = {};

      // Check if category exists, if not assign a default one
      if (post.category) {
        const categoryExists = categories.some(cat => cat._id.toString() === post.category.toString());
        if (!categoryExists) {
          console.log(`❌ Post ${post._id}: Category ${post.category} not found`);
          // Assign the first available category as default
          if (categories.length > 0) {
            updateData.category = categories[0]._id;
            needsUpdate = true;
            console.log(`✅ Will fix: Assigning category ${categories[0].code}`);
          }
        }
      }

      // Check if city exists, if not assign a default one for the same country
      if (post.city) {
        const cityExists = cities.some(city => city._id.toString() === post.city.toString());
        if (!cityExists) {
          console.log(`❌ Post ${post._id}: City ${post.city} not found`);
          // Find a city from the same country
          const countryCities = cities.filter(city => city.country.toString() === post.country.toString());
          if (countryCities.length > 0) {
            updateData.city = countryCities[0]._id;
            needsUpdate = true;
            console.log(`✅ Will fix: Assigning city ${countryCities[0].code}`);
          }
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
// fixDataInconsistencies();
console.log('💡 To fix data inconsistencies, uncomment the last line in this script and run it');
