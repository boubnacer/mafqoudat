const mongoose = require('mongoose');

async function simpleFixPosts() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    const uri = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    console.log('📋 Loading models...');
    const Post = require('./server/models/Post');
    const Category = require('./server/models/Category');
    const City = require('./server/models/City');

    console.log('🔍 Fetching data...');
    const categories = await Category.find();
    const cities = await City.find();
    const posts = await Post.find();
    
    console.log(`📊 Found ${categories.length} categories, ${cities.length} cities, ${posts.length} posts`);

    if (categories.length === 0) {
      console.log('❌ No categories found in database');
      return;
    }

    console.log('🔧 Starting to fix posts...');
    let fixedCount = 0;

    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      console.log(`\n📝 Processing post ${i + 1}/${posts.length}: ${post._id}`);
      
      let needsUpdate = false;
      const updateData = {};

      // Check category
      if (!post.category) {
        console.log('  ❌ No category assigned');
        const defaultCategory = categories.find(cat => cat.code === 'ELECTRONICS') || categories[0];
        updateData.category = defaultCategory._id;
        needsUpdate = true;
        console.log(`  ✅ Will assign category: ${defaultCategory.code}`);
      } else {
        const categoryExists = categories.some(cat => cat._id.toString() === post.category.toString());
        if (!categoryExists) {
          console.log(`  ❌ Category ${post.category} not found`);
          const defaultCategory = categories.find(cat => cat.code === 'ELECTRONICS') || categories[0];
          updateData.category = defaultCategory._id;
          needsUpdate = true;
          console.log(`  ✅ Will assign category: ${defaultCategory.code}`);
        } else {
          console.log(`  ✅ Category exists: ${post.category}`);
        }
      }

      // Check city
      if (!post.city) {
        console.log('  ❌ No city assigned');
        const countryCities = cities.filter(city => city.country.toString() === post.country.toString());
        if (countryCities.length > 0) {
          const defaultCity = countryCities.find(city => city.code === 'CASABLANCA') || countryCities[0];
          updateData.city = defaultCity._id;
          needsUpdate = true;
          console.log(`  ✅ Will assign city: ${defaultCity.code}`);
        }
      } else {
        const cityExists = cities.some(city => city._id.toString() === post.city.toString());
        if (!cityExists) {
          console.log(`  ❌ City ${post.city} not found`);
          const countryCities = cities.filter(city => city.country.toString() === post.country.toString());
          if (countryCities.length > 0) {
            const defaultCity = countryCities.find(city => city.code === 'CASABLANCA') || countryCities[0];
            updateData.city = defaultCity._id;
            needsUpdate = true;
            console.log(`  ✅ Will assign city: ${defaultCity.code}`);
          }
        } else {
          console.log(`  ✅ City exists: ${post.city}`);
        }
      }

      // Update if needed
      if (needsUpdate) {
        console.log(`  🔄 Updating post...`);
        await Post.findByIdAndUpdate(post._id, updateData);
        fixedCount++;
        console.log(`  ✅ Post updated successfully`);
      } else {
        console.log(`  ✅ Post is already correct`);
      }
    }

    console.log(`\n🎉 Fixed ${fixedCount} posts with invalid references`);

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
      }
    } catch (error) {
      console.log('❌ Dashboard API test failed:', error.message);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    console.log('\n🔌 Disconnecting from MongoDB...');
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

console.log('🚀 Starting post data fix...');
simpleFixPosts();
