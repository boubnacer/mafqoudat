const mongoose = require("mongoose");
const City = require("./models/City");
const Country = require("./models/Country");
require('dotenv').config();

const testCitiesAPI = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Test 1: Get Morocco
    const morocco = await Country.findOne({ code: 'MA' });
    if (morocco) {
      console.log(`\n🌍 Testing cities for ${morocco.labels.en} (${morocco.code})...`);
      
      const cities = await City.find({ 
        country: morocco._id, 
        isActive: true 
      })
      .select('_id code labels names isCapital')
      .sort({ 'labels.en': 1 })
      .lean()
      .exec();

      console.log(`📊 Found ${cities.length} cities for Morocco:`);
      cities.forEach(city => {
        console.log(`   - ${city.labels.en} (${city.code}) ${city.isCapital ? '🏛️' : ''}`);
      });

      // Test API response format
      const transformedCities = cities.map(city => ({
        id: city._id,
        code: city.code,
        label: city.labels.en,
        labels: city.labels,
        names: city.names || {},
        isCapital: city.isCapital
      }));

      console.log(`\n📋 API Response format:`);
      console.log(JSON.stringify(transformedCities.slice(0, 3), null, 2));
    }

    // Test 2: Get Egypt
    const egypt = await Country.findOne({ code: 'EG' });
    if (egypt) {
      console.log(`\n🌍 Testing cities for ${egypt.labels.en} (${egypt.code})...`);
      
      const cities = await City.find({ 
        country: egypt._id, 
        isActive: true 
      })
      .select('_id code labels names isCapital')
      .sort({ 'labels.en': 1 })
      .lean()
      .exec();

      console.log(`📊 Found ${cities.length} cities for Egypt:`);
      cities.slice(0, 5).forEach(city => {
        console.log(`   - ${city.labels.en} (${city.code}) ${city.isCapital ? '🏛️' : ''}`);
      });
    }

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error testing cities API:', error);
    process.exit(1);
  }
};

// Run the test
testCitiesAPI();
