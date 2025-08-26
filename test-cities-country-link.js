require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');

// MongoDB URI
const MONGODB_URI = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';

async function testCitiesCountryLink() {
  try {
    console.log('🔍 Testing Cities-Country Relationship...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority',
    });
    
    console.log('✅ Connected to MongoDB successfully');
    
    const City = require('./server/models/City');
    const Country = require('./server/models/Country');
    
    // Get Morocco country
    const morocco = await Country.findOne({ code: 'MA' }).lean();
    console.log('\n🌍 Morocco Country:');
    console.log(`   ID: ${morocco?._id}`);
    console.log(`   Code: ${morocco?.code}`);
    console.log(`   Name: ${morocco?.names?.en}`);
    console.log(`   isActive: ${morocco?.isActive}`);
    
    if (!morocco) {
      console.log('❌ Morocco country not found!');
      return;
    }
    
    // Test 1: Find cities by Morocco ID
    console.log('\n🏙️  Test 1: Cities linked to Morocco by ID');
    const citiesByCountryId = await City.find({ 
      country: morocco._id 
    }).lean();
    
    console.log(`   Found ${citiesByCountryId.length} cities for Morocco ID: ${morocco._id}`);
    
    if (citiesByCountryId.length > 0) {
      console.log('   Sample cities:');
      citiesByCountryId.slice(0, 3).forEach((city, index) => {
        console.log(`   ${index + 1}. ${city.code} - isActive: ${city.isActive}`);
      });
    }
    
    // Test 2: Find cities by Morocco ID with isActive filter
    console.log('\n🏙️  Test 2: Cities linked to Morocco by ID with isActive: true');
    const activeCitiesByCountryId = await City.find({ 
      country: morocco._id,
      isActive: true
    }).lean();
    
    console.log(`   Found ${activeCitiesByCountryId.length} active cities for Morocco ID: ${morocco._id}`);
    
    if (activeCitiesByCountryId.length > 0) {
      console.log('   Sample active cities:');
      activeCitiesByCountryId.slice(0, 3).forEach((city, index) => {
        console.log(`   ${index + 1}. ${city.code} - isActive: ${city.isActive}`);
      });
    }
    
    // Test 3: Check all cities and their country references
    console.log('\n🏙️  Test 3: All cities and their country references');
    const allCities = await City.find().select('code country isActive').lean();
    console.log(`   Total cities in database: ${allCities.length}`);
    
    const citiesWithMoroccoRef = allCities.filter(city => 
      city.country && city.country.toString() === morocco._id.toString()
    );
    console.log(`   Cities with Morocco reference: ${citiesWithMoroccoRef.length}`);
    
    if (citiesWithMoroccoRef.length > 0) {
      console.log('   Cities linked to Morocco:');
      citiesWithMoroccoRef.forEach((city, index) => {
        console.log(`   ${index + 1}. ${city.code} - isActive: ${city.isActive} - Country ID: ${city.country}`);
      });
    }
    
    // Test 4: Check for orphaned cities (cities without valid country reference)
    console.log('\n🏙️  Test 4: Checking for orphaned cities');
    const allCountries = await Country.find().select('_id code').lean();
    const validCountryIds = allCountries.map(c => c._id.toString());
    
    const orphanedCities = allCities.filter(city => 
      !city.country || !validCountryIds.includes(city.country.toString())
    );
    
    console.log(`   Orphaned cities (no valid country reference): ${orphanedCities.length}`);
    if (orphanedCities.length > 0) {
      orphanedCities.forEach((city, index) => {
        console.log(`   ${index + 1}. ${city.code} - Country ID: ${city.country}`);
      });
    }
    
    // Test 5: Simulate the exact query from the API
    console.log('\n🏙️  Test 5: Simulating API query');
    const apiQueryResult = await City.find({ 
      country: morocco._id,
      isActive: true
    })
    .select('_id code labels names isCapital')
    .sort({ 'labels.en': 1 })
    .lean()
    .exec();
    
    console.log(`   API query result: ${apiQueryResult.length} cities`);
    if (apiQueryResult.length > 0) {
      console.log('   Sample API result:');
      apiQueryResult.slice(0, 2).forEach((city, index) => {
        console.log(`   ${index + 1}. ${JSON.stringify(city, null, 2)}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testCitiesCountryLink();
