const mongoose = require("mongoose");
require('dotenv').config();

const simpleTest = async () => {
  try {
    console.log('🔍 Testing database connection...');
    console.log('MongoDB URI exists:', !!process.env.MONGODB_URI);
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Check if City model exists
    const City = require("./models/City");
    const cityCount = await City.countDocuments();
    console.log(`📊 Total cities in database: ${cityCount}`);

    if (cityCount > 0) {
      const sampleCities = await City.find().limit(3).lean();
      console.log('🏙️  Sample cities:');
      sampleCities.forEach(city => {
        console.log(`   - ${city.labels.en} (${city.code})`);
      });
    } else {
      console.log('⚠️  No cities found in database');
    }

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

simpleTest();
