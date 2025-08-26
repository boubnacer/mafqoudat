require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');

// MongoDB URI
const MONGODB_URI = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';

async function testCitiesDatabase() {
  try {
    console.log('🔌 Testing cities database...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority',
    });
    
    console.log('✅ Connected to MongoDB successfully');
    
    const City = require('./server/models/City');
    const Country = require('./server/models/Country');
    
    // Test 1: Get all cities
    console.log('\n📊 Test 1: All cities');
    const allCities = await City.find().lean().exec();
    console.log(`Total cities: ${allCities.length}`);
    
    if (allCities.length > 0) {
      console.log('Sample city:', JSON.stringify(allCities[0], null, 2));
    }
    
    // Test 2: Get cities with isActive = true
    console.log('\n📊 Test 2: Cities with isActive = true');
    const activeCities = await City.find({ isActive: true }).lean().exec();
    console.log(`Active cities: ${activeCities.length}`);
    
    // Test 3: Get cities with isActive = null
    console.log('\n📊 Test 3: Cities with isActive = null');
    const nullActiveCities = await City.find({ isActive: null }).lean().exec();
    console.log(`Null isActive cities: ${nullActiveCities.length}`);
    
    // Test 4: Get cities for a specific country
    console.log('\n📊 Test 4: Cities for Morocco (MA)');
    const morocco = await Country.findOne({ code: 'MA' }).lean().exec();
    if (morocco) {
      console.log(`Morocco ID: ${morocco._id}`);
      const moroccoCities = await City.find({ country: morocco._id }).lean().exec();
      console.log(`Cities in Morocco: ${moroccoCities.length}`);
      
      if (moroccoCities.length > 0) {
        console.log('Sample Morocco city:', JSON.stringify(moroccoCities[0], null, 2));
      }
    }
    
    // Test 5: Get cities without isActive filter
    console.log('\n📊 Test 5: Cities without isActive filter');
    const noFilterCities = await City.find()
      .select('_id code labels names isCapital isActive')
      .sort({ 'labels.en': 1 })
      .lean()
      .exec();
    console.log(`Cities without filter: ${noFilterCities.length}`);
    
    if (noFilterCities.length > 0) {
      console.log('Sample city without filter:', JSON.stringify(noFilterCities[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testCitiesDatabase();
