const mongoose = require("mongoose");
require('dotenv').config();

const debugDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📋 Collections in database:');
    collections.forEach(collection => {
      console.log(`   • ${collection.name}`);
    });

    // Check countries collection
    const countriesCollection = mongoose.connection.db.collection('countries');
    const countriesCount = await countriesCollection.countDocuments();
    console.log(`\n🌍 Countries collection has ${countriesCount} documents`);

    if (countriesCount > 0) {
      const countries = await countriesCollection.find({}).limit(5).toArray();
      console.log('\n📋 Sample countries:');
      countries.forEach(country => {
        console.log(`   • ${country.code}: ${country.labels?.en || 'No English label'}`);
      });
    }

    // Check cities collection
    const citiesCollection = mongoose.connection.db.collection('cities');
    const citiesCount = await citiesCollection.countDocuments();
    console.log(`\n🏙️  Cities collection has ${citiesCount} documents`);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error debugging database:', error);
    process.exit(1);
  }
};

// Run the debug if this file is executed directly
if (require.main === module) {
  debugDatabase();
}

module.exports = debugDatabase;
