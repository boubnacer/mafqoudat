const mongoose = require('mongoose');

async function debugActualData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    const uri = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    const Post = require('./server/models/Post');
    const Category = require('./server/models/Category');
    const City = require('./server/models/City');

    // Check what's in the database
    console.log('\n📋 Categories in database:');
    const categories = await Category.find();
    categories.forEach(cat => {
      console.log(`- ${cat._id}: ${cat.code}`);
    });

    console.log('\n🏙️ Cities in database:');
    const cities = await City.find();
    cities.forEach(city => {
      console.log(`- ${city._id}: ${city.code} (Country: ${city.country})`);
    });

    console.log('\n📝 Posts in database:');
    const posts = await Post.find();
    posts.forEach(post => {
      console.log(`- Post ${post._id}:`);
      console.log(`  Category: ${post.category}`);
      console.log(`  City: ${post.city}`);
      console.log(`  Country: ${post.country}`);
    });

    // Check if the category and city IDs in posts actually exist
    console.log('\n🔍 Checking if post references are valid:');
    for (const post of posts) {
      const categoryExists = await Category.findById(post.category);
      const cityExists = await City.findById(post.city);
      
      console.log(`Post ${post._id}:`);
      console.log(`  Category ${post.category}: ${categoryExists ? 'EXISTS' : 'MISSING'} (${categoryExists?.code || 'N/A'})`);
      console.log(`  City ${post.city}: ${cityExists ? 'EXISTS' : 'MISSING'} (${cityExists?.code || 'N/A'})`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

console.log('🔍 Debugging actual database data...');
debugActualData();
