const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';

async function checkDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully!');
    
    // Get the database
    const db = mongoose.connection.db;
    
    // Check collections
    const collections = await db.listCollections().toArray();
    console.log('\n📋 Available collections:');
    collections.forEach(col => console.log(`  - ${col.name}`));
    
    // Check posts
    const Post = require('./server/models/Post');
    const postCount = await Post.countDocuments();
    console.log(`\n📝 Total posts in database: ${postCount}`);
    
    if (postCount > 0) {
      const samplePosts = await Post.find().limit(3).lean();
      console.log('\n📄 Sample posts:');
      samplePosts.forEach((post, index) => {
        console.log(`\nPost ${index + 1}:`);
        console.log(`  ID: ${post._id}`);
        console.log(`  City: ${post.city}`);
        console.log(`  Country: ${post.country}`);
        console.log(`  Category: ${post.category}`);
        console.log(`  Found/Lost: ${post.foundLost}`);
        console.log(`  Created: ${post.createdAt}`);
      });
    }
    
    // Check countries
    const Country = require('./server/models/Country');
    const countryCount = await Country.countDocuments();
    console.log(`\n🌍 Total countries in database: ${countryCount}`);
    
    if (countryCount > 0) {
      const countries = await Country.find().limit(5).lean();
      console.log('\n🌍 Sample countries:');
      countries.forEach(country => {
        console.log(`  - ${country.code}: ${country.labels?.en || country.name || 'No name'}`);
      });
    }
    
    // Check cities
    const City = require('./server/models/City');
    const cityCount = await City.countDocuments();
    console.log(`\n🏙️ Total cities in database: ${cityCount}`);
    
    if (cityCount > 0) {
      const cities = await City.find().limit(5).lean();
      console.log('\n🏙️ Sample cities:');
      cities.forEach(city => {
        console.log(`  - ${city.code}: ${city.labels?.en || city.name || 'No name'}`);
      });
    }
    
    // Check Morocco specifically
    const morocco = await Country.findOne({ code: 'MA' }).lean();
    if (morocco) {
      console.log(`\n🇲🇦 Morocco found: ${morocco._id}`);
      
      // Check posts for Morocco
      const moroccoPosts = await Post.find({ country: morocco._id }).limit(3).lean();
      console.log(`\n📝 Posts in Morocco: ${moroccoPosts.length}`);
      
      if (moroccoPosts.length > 0) {
        console.log('\n📄 Morocco posts:');
        moroccoPosts.forEach((post, index) => {
          console.log(`\nPost ${index + 1}:`);
          console.log(`  City: ${post.city}`);
          console.log(`  Category: ${post.category}`);
          console.log(`  Found/Lost: ${post.foundLost}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error connecting to database:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkDatabase();
