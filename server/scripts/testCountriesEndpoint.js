const mongoose = require("mongoose");
const Country = require("../models/Country");

// Use the MongoDB URI directly
const MONGODB_URI = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';

const testCountriesEndpoint = async () => {
  try {
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Simulate the controller logic
    console.log('\n🔍 Testing countries endpoint logic...');
    const language = 'en';
    const active = true;
    
    let query = {};
    
    // Filter by active status
    if (active === true) {
      query.isActive = true;
    }
    
    const countries = await Country.find(query)
      .select('code labels names flag isActive')
      .sort({ 'labels.en': 1 })
      .lean()
      .exec();

    console.log(`📊 Found ${countries.length} countries`);
    
    if (countries.length > 0) {
      // Transform response to include language-specific labels and names
      const transformedCountries = countries.map(country => ({
        _id: country._id,
        code: country.code,
        label: country.names?.[language] || country.names?.en || country.labels[language] || country.labels.en,
        labels: country.labels,
        names: country.names || {},
        flag: country.flag,
        isActive: country.isActive
      }));

      console.log('\n📋 Transformed countries (first 5):');
      transformedCountries.slice(0, 5).forEach(country => {
        console.log(`   • ${country.code}: ${country.label} (ID: ${country._id})`);
        console.log(`     Names: ${JSON.stringify(country.names)}`);
        console.log(`     Labels: ${JSON.stringify(country.labels)}`);
      });
      
      // Simulate the API response
      const apiResponse = {
        success: true,
        data: transformedCountries,
        total: transformedCountries.length
      };
      
      console.log('\n✅ API Response structure:');
      console.log(`   Success: ${apiResponse.success}`);
      console.log(`   Total: ${apiResponse.total}`);
      console.log(`   Data length: ${apiResponse.data.length}`);
    }

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error testing countries endpoint:', error);
    process.exit(1);
  }
};

// Run the test if this file is executed directly
if (require.main === module) {
  testCountriesEndpoint();
}

module.exports = testCountriesEndpoint;
