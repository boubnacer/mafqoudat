require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');

// MongoDB URI
const MONGODB_URI = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';

async function testSimpleCitiesQuery() {
  try {
    console.log('🔍 Testing Simple Cities Query...');
    
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
    
    // Use the exact country ID from the user's example
    const countryId = '68a4b54ab46524c54c553ca9';
    
    console.log(`\n🌍 Testing with country ID: ${countryId}`);
    
    // Test 1: Check if country exists
    const country = await Country.findById(countryId).lean();
    console.log(`Country found: ${country ? 'Yes' : 'No'}`);
    if (country) {
      console.log(`Country code: ${country.code}`);
      console.log(`Country name: ${country.names?.en}`);
    }
    
    // Test 2: Simple cities query
    console.log('\n🏙️  Testing cities query...');
    const cities = await City.find({ 
      country: countryId 
    }).lean();
    
    console.log(`Total cities found: ${cities.length}`);
    
    if (cities.length > 0) {
      console.log('Sample cities:');
      cities.slice(0, 3).forEach((city, index) => {
        console.log(`${index + 1}. ${city.code} - isActive: ${city.isActive}`);
      });
    }
    
    // Test 3: Cities with isActive filter
    console.log('\n🏙️  Testing cities with isActive filter...');
    const activeCities = await City.find({ 
      country: countryId,
      isActive: true
    }).lean();
    
    console.log(`Active cities found: ${activeCities.length}`);
    
    if (activeCities.length > 0) {
      console.log('Sample active cities:');
      activeCities.slice(0, 3).forEach((city, index) => {
        console.log(`${index + 1}. ${city.code} - isActive: ${city.isActive}`);
      });
    }
    
    // Test 4: Check all cities in database
    console.log('\n🏙️  Checking all cities in database...');
    const allCities = await City.find().select('code country isActive').lean();
    console.log(`Total cities in database: ${allCities.length}`);
    
    const citiesWithThisCountry = allCities.filter(city => 
      city.country && city.country.toString() === countryId
    );
    console.log(`Cities with this country ID: ${citiesWithThisCountry.length}`);
    
    if (citiesWithThisCountry.length > 0) {
      console.log('Cities with this country:');
      citiesWithThisCountry.forEach((city, index) => {
        console.log(`${index + 1}. ${city.code} - isActive: ${city.isActive}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testSimpleCitiesQuery();
