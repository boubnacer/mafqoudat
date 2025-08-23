const mongoose = require("mongoose");
const City = require("./models/City");
const Country = require("./models/Country");
require('dotenv').config();

const testSpecificCountry = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Test the specific country ID from the error
    const testCountryId = '68a4b54ab46524c54c553cc1';
    
    console.log(`\n🔍 Testing country ID: ${testCountryId}`);
    
    // Check if country exists
    const country = await Country.findById(testCountryId).lean();
    if (country) {
      console.log(`✅ Country found: ${country.labels?.en || country.code}`);
      console.log(`   Code: ${country.code}`);
      console.log(`   Labels:`, country.labels);
    } else {
      console.log(`❌ Country not found with ID: ${testCountryId}`);
    }

    // Check for cities in this country
    const cities = await City.find({ 
      country: testCountryId, 
      isActive: true 
    }).select('_id code labels names isCapital').lean();

    console.log(`\n🏙️ Found ${cities.length} cities for this country:`);
    
    if (cities.length > 0) {
      cities.forEach((city, index) => {
        console.log(`   ${index + 1}. ${city.labels?.en || city.code} (${city.code})`);
        console.log(`      Labels:`, city.labels);
        console.log(`      Is Capital: ${city.isCapital}`);
      });
    } else {
      console.log(`❌ No cities found for country ID: ${testCountryId}`);
      
      // Let's check what countries do have cities
      console.log(`\n🔍 Checking what countries have cities:`);
      const countriesWithCities = await City.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$country', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      
      console.log(`Found ${countriesWithCities.length} countries with cities:`);
      for (const item of countriesWithCities) {
        const countryInfo = await Country.findById(item._id).select('code labels').lean();
        console.log(`   ${countryInfo?.labels?.en || countryInfo?.code || item._id}: ${item.count} cities`);
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

testSpecificCountry();
