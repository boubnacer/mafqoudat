const mongoose = require("mongoose");
const Country = require("../models/Country");

// Use the MongoDB URI directly
const MONGODB_URI = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';

const debugCountriesData = async () => {
  try {
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Get all countries with full data
    console.log('\n🔍 Getting all countries...');
    const countries = await Country.find({}).lean().exec();

    console.log(`📊 Found ${countries.length} countries`);
    
    if (countries.length > 0) {
      console.log('\n📋 Country data structure:');
      countries.slice(0, 5).forEach(country => {
        console.log(`\n   Country: ${country.code}`);
        console.log(`   ID: ${country._id}`);
        console.log(`   Labels:`, JSON.stringify(country.labels, null, 2));
        console.log(`   Names:`, JSON.stringify(country.names, null, 2));
        console.log(`   Flag: ${country.flag}`);
        console.log(`   IsActive: ${country.isActive}`);
      });
    }

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error debugging countries data:', error);
    process.exit(1);
  }
};

// Run the debug if this file is executed directly
if (require.main === module) {
  debugCountriesData();
}

module.exports = debugCountriesData;
