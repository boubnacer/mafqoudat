const mongoose = require("mongoose");
const City = require("./models/City");
const Country = require("./models/Country");
require('dotenv').config();

const testCitiesEndpoint = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Get Morocco country ID
    const morocco = await Country.findOne({ code: 'MA' });
    if (!morocco) {
      console.log('❌ Morocco not found in database');
      return;
    }

    console.log(`\n🌍 Testing cities for ${morocco.labels.en} (${morocco.code}) - ID: ${morocco._id}`);

    // Test the exact query that the API uses
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

    // Test the API response format
    const transformedCities = cities.map(city => ({
      id: city._id,
      code: city.code,
      label: city.labels.en,
      labels: city.labels,
      names: city.names || {},
      isCapital: city.isCapital
    }));

    console.log(`\n📋 API Response format:`);
    console.log(JSON.stringify({
      success: true,
      data: transformedCities,
      total: transformedCities.length
    }, null, 2));

    // Test with a different country
    const egypt = await Country.findOne({ code: 'EG' });
    if (egypt) {
      console.log(`\n🌍 Testing cities for ${egypt.labels.en} (${egypt.code}) - ID: ${egypt._id}`);
      
      const egyptCities = await City.find({ 
        country: egypt._id, 
        isActive: true 
      })
      .select('_id code labels names isCapital')
      .sort({ 'labels.en': 1 })
      .lean()
      .exec();

      console.log(`📊 Found ${egyptCities.length} cities for Egypt`);
    }

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error testing cities endpoint:', error);
    process.exit(1);
  }
};

// Run the test
testCitiesEndpoint();
