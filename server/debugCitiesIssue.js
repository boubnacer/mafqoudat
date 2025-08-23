const mongoose = require("mongoose");
const City = require("./models/City");
const Country = require("./models/Country");
require('dotenv').config();

const debugCitiesIssue = async () => {
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
      console.log(`   - ${country.labels?.en || country.code} (${country.code}) - ID: ${country._id}`);
    });

    // Get all cities
    const cities = await City.find({ isActive: true }).select('_id code labels names country isCapital').lean();
    console.log(`\n🏙️ Found ${cities.length} cities:`);
    
    // Group cities by country
    const citiesByCountry = {};
    cities.forEach(city => {
      const countryId = city.country.toString();
      if (!citiesByCountry[countryId]) {
        citiesByCountry[countryId] = [];
      }
      citiesByCountry[countryId].push(city);
    });

    console.log(`\n📊 Cities by country:`);
    Object.keys(citiesByCountry).forEach(countryId => {
      const country = countries.find(c => c._id.toString() === countryId);
      const countryName = country ? (country.labels?.en || country.code) : 'Unknown Country';
      console.log(`   ${countryName} (${countryId}): ${citiesByCountry[countryId].length} cities`);
      
      // Show first few cities for each country
      citiesByCountry[countryId].slice(0, 3).forEach(city => {
        console.log(`     - ${city.labels?.en || city.code} (${city.code})`);
      });
      if (citiesByCountry[countryId].length > 3) {
        console.log(`     ... and ${citiesByCountry[countryId].length - 3} more`);
      }
    });

    // Check for countries with no cities
    const countriesWithNoCities = countries.filter(country => 
      !citiesByCountry[country._id.toString()]
    );
    
    if (countriesWithNoCities.length > 0) {
      console.log(`\n⚠️ Countries with NO cities:`);
      countriesWithNoCities.forEach(country => {
        console.log(`   - ${country.labels?.en || country.code} (${country.code}) - ID: ${country._id}`);
      });
    }

    // Test the specific country ID from the error (if it exists)
    const testCountryId = '68a4b54ab46524c54c553cc1';
    const testCountry = countries.find(c => c._id.toString() === testCountryId);
    
    if (testCountry) {
      console.log(`\n🔍 Testing specific country ID: ${testCountryId}`);
      console.log(`   Country: ${testCountry.labels?.en || testCountry.code} (${testCountry.code})`);
      
      const testCities = citiesByCountry[testCountryId] || [];
      console.log(`   Cities found: ${testCities.length}`);
      
      if (testCities.length > 0) {
        console.log(`   First few cities:`);
        testCities.slice(0, 5).forEach(city => {
          console.log(`     - ${city.labels?.en || city.code} (${city.code})`);
        });
      }
    } else {
      console.log(`\n❌ Country ID ${testCountryId} not found in database`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

debugCitiesIssue();
