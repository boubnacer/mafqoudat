require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');

// MongoDB URI
const MONGODB_URI = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';

async function testCitiesDirect() {
  try {
    console.log('🔍 Testing Cities Directly...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 3,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 15000,
      retryWrites: true,
      w: 'majority',
    });
    
    console.log('✅ Connected to MongoDB successfully');
    
    const City = require('./server/models/City');
    const Country = require('./server/models/Country');
    
    // Test 1: Get all cities
    console.log('\n📊 Test 1: All Cities');
    const allCities = await City.find().select('_id code country isActive').lean();
    console.log(`Total cities: ${allCities.length}`);
    
    // Test 2: Get Morocco
    console.log('\n🇲🇦 Test 2: Morocco');
    const morocco = await Country.findOne({ code: 'MA' }).lean();
    console.log(`Morocco found: ${morocco ? 'Yes' : 'No'}`);
    if (morocco) {
      console.log(`  ID: ${morocco._id}`);
      console.log(`  Code: ${morocco.code}`);
      console.log(`  Name: ${morocco.names?.en}`);
    }
    
    // Test 3: Get cities for Morocco
    console.log('\n🏙️ Test 3: Cities for Morocco');
    if (morocco) {
      const moroccoCities = await City.find({ country: morocco._id }).lean();
      console.log(`Cities for Morocco: ${moroccoCities.length}`);
      moroccoCities.forEach((city, index) => {
        console.log(`  ${index + 1}. ${city.code} (isActive: ${city.isActive})`);
      });
    }
    
    // Test 4: Check data types
    console.log('\n🔍 Test 4: Data Types');
    if (allCities.length > 0) {
      const sampleCity = allCities[0];
      console.log(`Sample city country field type: ${typeof sampleCity.country}`);
      console.log(`Sample city country value: ${sampleCity.country}`);
      console.log(`Is ObjectId: ${mongoose.Types.ObjectId.isValid(sampleCity.country)}`);
    }
    
    // Test 5: Check which countries have cities
    console.log('\n🌍 Test 5: Countries with Cities');
    const countriesWithCities = new Map();
    for (const city of allCities) {
      const countryId = city.country;
      if (!countriesWithCities.has(countryId)) {
        countriesWithCities.set(countryId, []);
      }
      countriesWithCities.get(countryId).push(city);
    }
    
    console.log('Countries with cities:');
    countriesWithCities.forEach((cities, countryId) => {
      console.log(`  ${countryId}: ${cities.length} cities`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testCitiesDirect();
