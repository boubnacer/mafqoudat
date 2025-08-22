const mongoose = require("mongoose");
const City = require("./models/City");
const Country = require("./models/Country");
require('dotenv').config();

const testCities = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Test 1: Check if cities exist
    const cityCount = await City.countDocuments();
    console.log(`📊 Total cities in database: ${cityCount}`);

    if (cityCount === 0) {
      console.log('⚠️  No cities found. Running seeding script...');
      const seedCities = require('./scripts/seedCities');
      await seedCities();
    }

    // Test 2: Get cities by country
    const morocco = await Country.findOne({ code: 'MA' });
    if (morocco) {
      const moroccoCities = await City.find({ country: morocco._id, isActive: true });
      console.log(`🏙️  Cities in Morocco: ${moroccoCities.length}`);
      moroccoCities.forEach(city => {
        console.log(`   - ${city.labels.en} (${city.code})`);
      });
    }

    // Test 3: Search cities
    const searchResults = await City.find({
      $text: { $search: 'cairo' },
      isActive: true
    }).populate('country', 'code labels.en');
    
    console.log(`🔍 Search results for 'cairo': ${searchResults.length}`);
    searchResults.forEach(city => {
      console.log(`   - ${city.labels.en} in ${city.country.labels.en}`);
    });

    // Test 4: Get capital cities
    const capitals = await City.find({ isCapital: true, isActive: true })
      .populate('country', 'code labels.en')
      .limit(5);
    
    console.log(`🏛️  Capital cities (first 5):`);
    capitals.forEach(city => {
      console.log(`   - ${city.labels.en} (${city.country.labels.en})`);
    });

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error testing cities:', error);
    process.exit(1);
  }
};

// Run the test
testCities();
