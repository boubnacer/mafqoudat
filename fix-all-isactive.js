require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');

// MongoDB URI
const MONGODB_URI = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';

async function fixAllIsActive() {
  try {
    console.log('🔧 Fixing all isActive fields...');
    
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
    const Category = require('./server/models/Category');
    const Country = require('./server/models/Country');
    const FoundLost = require('./server/models/FoundLost');
    
    // Fix Cities
    console.log('\n🏙️  Fixing Cities...');
    const citiesBefore = await City.countDocuments({ isActive: true });
    const citiesNull = await City.countDocuments({ isActive: null });
    console.log(`Cities with isActive: true before: ${citiesBefore}`);
    console.log(`Cities with isActive: null before: ${citiesNull}`);
    
    const citiesUpdate = await City.updateMany(
      {},
      { $set: { isActive: true } }
    );
    console.log(`✅ Updated ${citiesUpdate.modifiedCount} cities`);
    
    // Fix Categories
    console.log('\n📂 Fixing Categories...');
    const categoriesBefore = await Category.countDocuments({ isActive: true });
    const categoriesNull = await Category.countDocuments({ isActive: null });
    console.log(`Categories with isActive: true before: ${categoriesBefore}`);
    console.log(`Categories with isActive: null before: ${categoriesNull}`);
    
    const categoriesUpdate = await Category.updateMany(
      {},
      { $set: { isActive: true } }
    );
    console.log(`✅ Updated ${categoriesUpdate.modifiedCount} categories`);
    
    // Fix Countries
    console.log('\n🌍 Fixing Countries...');
    const countriesBefore = await Country.countDocuments({ isActive: true });
    const countriesNull = await Country.countDocuments({ isActive: null });
    console.log(`Countries with isActive: true before: ${countriesBefore}`);
    console.log(`Countries with isActive: null before: ${countriesNull}`);
    
    const countriesUpdate = await Country.updateMany(
      {},
      { $set: { isActive: true } }
    );
    console.log(`✅ Updated ${countriesUpdate.modifiedCount} countries`);
    
    // Fix FoundLost
    console.log('\n🏷️  Fixing FoundLost...');
    const foundLostBefore = await FoundLost.countDocuments({ isActive: true });
    const foundLostNull = await FoundLost.countDocuments({ isActive: null });
    console.log(`FoundLost with isActive: true before: ${foundLostBefore}`);
    console.log(`FoundLost with isActive: null before: ${foundLostNull}`);
    
    const foundLostUpdate = await FoundLost.updateMany(
      {},
      { $set: { isActive: true } }
    );
    console.log(`✅ Updated ${foundLostUpdate.modifiedCount} found/lost options`);
    
    // Verify all updates
    console.log('\n📊 Verification...');
    const citiesAfter = await City.countDocuments({ isActive: true });
    const categoriesAfter = await Category.countDocuments({ isActive: true });
    const countriesAfter = await Country.countDocuments({ isActive: true });
    const foundLostAfter = await FoundLost.countDocuments({ isActive: true });
    
    console.log(`Cities with isActive: true after: ${citiesAfter}`);
    console.log(`Categories with isActive: true after: ${categoriesAfter}`);
    console.log(`Countries with isActive: true after: ${countriesAfter}`);
    console.log(`FoundLost with isActive: true after: ${foundLostAfter}`);
    
    console.log('\n🎉 All isActive fields fixed successfully!');
    console.log('🚀 Now deploy to Railway and test the endpoints.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

fixAllIsActive();
