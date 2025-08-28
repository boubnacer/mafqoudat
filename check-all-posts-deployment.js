const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';

async function checkAllPosts() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully!');
    
    // Get the database
    const db = mongoose.connection.db;
    
    // Check posts collection directly
    const postsCollection = db.collection('posts');
    const totalPosts = await postsCollection.countDocuments();
    console.log(`\n📝 Total posts in database: ${totalPosts}`);
    
    if (totalPosts > 0) {
      // Get sample posts
      const samplePosts = await postsCollection.find({}).limit(5).toArray();
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
      
      // Check posts by country
      const postsByCountry = await postsCollection.aggregate([
        {
          $group: {
            _id: '$country',
            count: { $sum: 1 }
          }
        }
      ]).toArray();
      
      console.log('\n🌍 Posts by country:');
      postsByCountry.forEach(item => {
        console.log(`  Country ${item._id}: ${item.count} posts`);
      });
    }
    
    // Check countries
    const countriesCollection = db.collection('countries');
    const countries = await countriesCollection.find({}).toArray();
    console.log('\n🌍 All countries:');
    countries.forEach(country => {
      console.log(`  ${country.code}: ${country.labels?.en || country.name || 'No name'} (${country._id})`);
    });
    
    // Check cities
    const citiesCollection = db.collection('cities');
    const totalCities = await citiesCollection.countDocuments();
    console.log(`\n🏙️ Total cities in database: ${totalCities}`);
    
    if (totalCities > 0) {
      const sampleCities = await citiesCollection.find({}).limit(5).toArray();
      console.log('\n🏙️ Sample cities:');
      sampleCities.forEach(city => {
        console.log(`  ${city.code}: ${city.labels?.en || city.name || 'No name'} (Country: ${city.country})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkAllPosts();
