const mongoose = require('mongoose');

async function fixPostsWithValidIds() {
  try {
    console.log('🔌 Connecting to MongoDB...');
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
      console.log('❌ No categories found');
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
      const categoryExists = categories.some(cat => cat._id.toString() === post.category?.toString());
      if (!categoryExists) {
        console.log(`❌ Post ${post._id}: Category ${post.category} not found`);
        // Assign a random category (not just ELECTRONICS)
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        updateData.category = randomCategory._id;
        needsUpdate = true;
        console.log(`✅ Will assign category: ${randomCategory.code}`);
      }

      // Check if post has a valid city for its country
      const cityExists = cities.some(city => city._id.toString() === post.city?.toString());
      if (!cityExists) {
        console.log(`❌ Post ${post._id}: City ${post.city} not found`);
        // Find cities from the same country
        const countryCities = cities.filter(city => city.country.toString() === post.country.toString());
        if (countryCities.length > 0) {
          // Assign a random city from the same country (not just Casablanca)
          const randomCity = countryCities[Math.floor(Math.random() * countryCities.length)];
          updateData.city = randomCity._id;
          needsUpdate = true;
          console.log(`✅ Will assign city: ${randomCity.code}`);
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

    // Test the dashboard API after the fix
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
        
        // Check if we're still getting fallback values
        if (post.categoryname === 'ELECTRONICS' || post.cityName === 'Casablanca') {
          console.log('⚠️ Still getting fallback values - this might be expected for some posts');
        } else {
          console.log('✅ Getting real category and city names!');
        }
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

console.log('🚀 Starting to fix posts with valid IDs...');
fixPostsWithValidIds();
