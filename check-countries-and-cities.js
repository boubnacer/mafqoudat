require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');

// MongoDB URI
const MONGODB_URI = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';

async function checkCountriesAndCities() {
  try {
    console.log('🔍 Checking Countries and Cities...');
    
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
    
    // Get all countries
    console.log('\n🌍 All Countries:');
    const allCountries = await Country.find().select('_id code names isActive').lean();
    console.log(`Total countries: ${allCountries.length}`);
    
    allCountries.forEach((country, index) => {
      console.log(`${index + 1}. ID: ${country._id} | Code: ${country.code} | Name: ${country.names?.en} | isActive: ${country.isActive}`);
    });
    
    // Get all cities
    console.log('\n🏙️ All Cities:');
    const allCities = await City.find().select('_id code country isActive').lean();
    console.log(`Total cities: ${allCities.length}`);
    
    allCities.forEach((city, index) => {
      console.log(`${index + 1}. ID: ${city._id} | Code: ${city.code} | Country: ${city.country} | isActive: ${city.isActive}`);
    });
    
    // Check which countries have cities
    console.log('\n🔗 Countries with Cities:');
    const countriesWithCities = new Map();
    
    for (const city of allCities) {
      const countryId = city.country;
      if (!countriesWithCities.has(countryId)) {
        countriesWithCities.set(countryId, []);
      }
      countriesWithCities.get(countryId).push(city);
    }
    
    countriesWithCities.forEach((cities, countryId) => {
      const country = allCountries.find(c => c._id.toString() === countryId || c._id === countryId);
      console.log(`Country: ${country?.code || 'Unknown'} (${countryId}) - Cities: ${cities.length}`);
      cities.forEach(city => {
        console.log(`  - ${city.code} (isActive: ${city.isActive})`);
      });
    });
    
    // Check the specific IDs from the logs
    console.log('\n🔍 Checking Specific IDs:');
    const id1 = '68a4b54ab46524c54c553cbc'; // From Railway logs
    const id2 = '68a4b54ab46524c54c553ca9'; // From your example
    
    console.log(`\nChecking ID from Railway logs: ${id1}`);
    const country1 = await Country.findById(id1).lean();
    console.log(`Country found: ${country1 ? 'Yes' : 'No'}`);
    if (country1) {
      console.log(`  Code: ${country1.code} | Name: ${country1.names?.en} | isActive: ${country1.isActive}`);
    }
    
    const cities1 = await City.find({ country: id1 }).lean();
    console.log(`Cities found: ${cities1.length}`);
    
    console.log(`\nChecking ID from your example: ${id2}`);
    const country2 = await Country.findById(id2).lean();
    console.log(`Country found: ${country2 ? 'Yes' : 'No'}`);
    if (country2) {
      console.log(`  Code: ${country2.code} | Name: ${country2.names?.en} | isActive: ${country2.isActive}`);
    }
    
    const cities2 = await City.find({ country: id2 }).lean();
    console.log(`Cities found: ${cities2.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

checkCountriesAndCities();
