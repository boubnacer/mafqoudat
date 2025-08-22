const mongoose = require("mongoose");
const City = require("./models/City");
const Country = require("./models/Country");
require('dotenv').config();

const testProductionCities = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Get all countries
    const countries = await Country.find({ isActive: true }).select('_id code labels names').lean();
    console.log(`\n🌍 Found ${countries.length} countries:`);
    countries.forEach(country => {
      console.log(`   - ${country.labels.en} (${country.code}) - ID: ${country._id}`);
    });

    // Get all cities
    const cities = await City.find({ isActive: true }).select('_id code labels names country').populate('country', 'code labels').lean();
    console.log(`\n🏙️ Found ${cities.length} cities:`);
    
    // Group cities by country
    const citiesByCountry = {};
    cities.forEach(city => {
      const countryCode = city.country?.code || 'Unknown';
      if (!citiesByCountry[countryCode]) {
        citiesByCountry[countryCode] = [];
      }
      citiesByCountry[countryCode].push(city);
    });

    Object.keys(citiesByCountry).forEach(countryCode => {
      console.log(`\n   ${countryCode}: ${citiesByCountry[countryCode].length} cities`);
      citiesByCountry[countryCode].forEach(city => {
        console.log(`     - ${city.labels.en} (${city.code})`);
      });
    });

    // Test the specific country ID from the error
    const testCountryId = '68a4b54ab46524c54c553cc1';
    console.log(`\n🔍 Testing specific country ID: ${testCountryId}`);
    
    const testCountry = await Country.findById(testCountryId);
    if (testCountry) {
      console.log(`✅ Country found: ${testCountry.labels.en} (${testCountry.code})`);
      
      const testCities = await City.find({ country: testCountryId, isActive: true }).select('_id code labels names').lean();
      console.log(`📊 Found ${testCities.length} cities for this country:`);
      testCities.forEach(city => {
        console.log(`   - ${city.labels.en} (${city.code})`);
      });
    } else {
      console.log(`❌ Country with ID ${testCountryId} not found`);
    }

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error testing production cities:', error);
    process.exit(1);
  }
};

// Run the test
testProductionCities();
