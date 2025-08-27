require("dotenv").config();
const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';

async function debugDatabaseContent() {
  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // Check what's in each collection
    console.log('\n📊 Checking database content...');
    
    // Check Users
    console.log('\n👥 USERS:');
    const User = require('./server/models/User');
    const users = await User.find().select('_id username email').lean();
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`  - ${user._id} | ${user.username} | ${user.email}`);
    });

    // Check Countries
    console.log('\n🌍 COUNTRIES:');
    const Country = require('./server/models/Country');
    const countries = await Country.find().select('_id code names.en').lean();
    console.log(`Found ${countries.length} countries:`);
    countries.forEach(country => {
      console.log(`  - ${country._id} | ${country.code} | ${country.names?.en || 'N/A'}`);
    });

    // Check Categories
    console.log('\n📂 CATEGORIES:');
    const Category = require('./server/models/Category');
    const categories = await Category.find().select('_id code labels.en').lean();
    console.log(`Found ${categories.length} categories:`);
    categories.forEach(category => {
      console.log(`  - ${category._id} | ${category.code} | ${category.labels?.en || 'N/A'}`);
    });

    // Check FoundLost
    console.log('\n🔍 FOUND/LOST OPTIONS:');
    const FoundLost = require('./server/models/FoundLost');
    const foundLostOptions = await FoundLost.find().select('_id code labels.en').lean();
    console.log(`Found ${foundLostOptions.length} found/lost options:`);
    foundLostOptions.forEach(option => {
      console.log(`  - ${option._id} | ${option.code} | ${option.labels?.en || 'N/A'}`);
    });

    // Check Cities
    console.log('\n🏙️ CITIES:');
    const City = require('./server/models/City');
    const cities = await City.find().select('_id code labels.en country').lean();
    console.log(`Found ${cities.length} cities:`);
    cities.forEach(city => {
      console.log(`  - ${city._id} | ${city.code} | ${city.labels?.en || 'N/A'} | Country: ${city.country}`);
    });

    // Check the specific IDs from the error
    console.log('\n🔍 CHECKING SPECIFIC IDs FROM ERROR:');
    const specificIds = {
      user: '68adafcbfbee01557b7f5bf6',
      country: '68a4b54ab46524c54c553ca9',
      category: '68a4b54ab46524c54c553cc9',
      foundLost: '68a4b54ab46524c54c553cc3',
      city: '68a9d9bb6bbbb3b407a5bdce'
    };

    console.log('Checking if these IDs exist in database:');
    
    const userExists = await User.findById(specificIds.user).lean();
    console.log(`  User ${specificIds.user}: ${userExists ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    
    const countryExists = await Country.findById(specificIds.country).lean();
    console.log(`  Country ${specificIds.country}: ${countryExists ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    
    const categoryExists = await Category.findById(specificIds.category).lean();
    console.log(`  Category ${specificIds.category}: ${categoryExists ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    
    const foundLostExists = await FoundLost.findById(specificIds.foundLost).lean();
    console.log(`  FoundLost ${specificIds.foundLost}: ${foundLostExists ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    
    const cityExists = await City.findById(specificIds.city).lean();
    console.log(`  City ${specificIds.city}: ${cityExists ? '✅ EXISTS' : '❌ NOT FOUND'}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

debugDatabaseContent();
