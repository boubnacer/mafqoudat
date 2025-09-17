const mongoose = require('mongoose');
const City = require('./server/models/City');
const Country = require('./server/models/Country');

const MONGODB_URI = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@clustermafqm0.mty6zln.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=ClusterMafqM0';

async function testDatabaseCities() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get Morocco country
    const morocco = await Country.findOne({ code: 'MA' });
    console.log('🇲🇦 Morocco country:', morocco ? morocco.labels.en : 'Not found');
    
    if (morocco) {
      // Get all cities for Morocco
      const cities = await City.find({ country: morocco._id }).limit(10);
      console.log(`\n🏙️ Cities in Morocco (${cities.length} found):`);
      
      cities.forEach((city, index) => {
        console.log(`${index + 1}. ${city.labels.en} (${city.labels.ar}) - ${city.isCapital ? 'Capital' : 'City'}`);
      });
      
      // Test search for "sifi ifni"
      console.log('\n🔍 Testing search for "sifi ifni":');
      const searchResults = await City.find({
        country: morocco._id,
        $or: [
          { "labels.en": { $regex: /sifi/i } },
          { "labels.ar": { $regex: /sifi/i } },
          { "labels.fr": { $regex: /sifi/i } }
        ]
      });
      
      console.log(`Found ${searchResults.length} cities matching "sifi"`);
      searchResults.forEach(city => {
        console.log(`- ${city.labels.en} (${city.labels.ar})`);
      });
      
      // Test search for "ifni"
      console.log('\n🔍 Testing search for "ifni":');
      const ifniResults = await City.find({
        country: morocco._id,
        $or: [
          { "labels.en": { $regex: /ifni/i } },
          { "labels.ar": { $regex: /ifni/i } },
          { "labels.fr": { $regex: /ifni/i } }
        ]
      });
      
      console.log(`Found ${ifniResults.length} cities matching "ifni"`);
      ifniResults.forEach(city => {
        console.log(`- ${city.labels.en} (${city.labels.ar})`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testDatabaseCities();
