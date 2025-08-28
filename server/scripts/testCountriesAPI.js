const mongoose = require("mongoose");
const Country = require("../models/Country");

// Use the MongoDB URI directly
const MONGODB_URI = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';

const testCountriesAPI = async () => {
  try {
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Test the same query that the controller uses
    console.log('\n🔍 Testing countries query...');
    const countries = await Country.find({ isActive: true })
      .select('code labels names flag isActive')
      .sort({ 'labels.en': 1 })
      .lean()
      .exec();

    console.log(`📊 Found ${countries.length} countries`);
    
    if (countries.length > 0) {
      console.log('\n📋 Sample countries:');
      countries.slice(0, 5).forEach(country => {
        console.log(`   • ${country.code}: ${country.labels?.en || 'No English label'} (ID: ${country._id})`);
      });
      
      // Test the transformation logic
      console.log('\n🔄 Testing transformation logic...');
      const transformedCountries = countries.map(country => ({
        _id: country._id,
        code: country.code,
        label: country.labels?.en || 'Unknown',
        labels: country.labels,
        names: country.names || {},
        flag: country.flag,
        isActive: country.isActive
      }));
      
      console.log('✅ Transformation successful');
      console.log('📋 Transformed sample:');
      transformedCountries.slice(0, 3).forEach(country => {
        console.log(`   • ${country.code}: ${country.label} (ID: ${country._id})`);
      });
    } else {
      console.log('❌ No countries found in database');
    }

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error testing countries API:', error);
    process.exit(1);
  }
};

// Run the test if this file is executed directly
if (require.main === module) {
  testCountriesAPI();
}

module.exports = testCountriesAPI;
