const mongoose = require('mongoose');

async function compareDatabases() {
  console.log('🔍 Comparing test and mafqoudat databases...\n');
  
  // Test database
  try {
    console.log('📊 Checking test database...');
    await mongoose.connect('mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0');
    
    const Country = require('./server/models/Country');
    const Category = require('./server/models/Category');
    const FoundLost = require('./server/models/FoundLost');
    const User = require('./server/models/User');
    
    const testData = {
      countries: await Country.countDocuments(),
      categories: await Category.countDocuments(),
      foundLost: await FoundLost.countDocuments(),
      users: await User.countDocuments()
    };
    
    console.log('✅ Test database data:');
    console.log(`  Countries: ${testData.countries}`);
    console.log(`  Categories: ${testData.categories}`);
    console.log(`  Found/Lost: ${testData.foundLost}`);
    console.log(`  Users: ${testData.users}`);
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.log('❌ Test database error:', error.message);
  }
  
  // Mafqoudat database
  try {
    console.log('\n📊 Checking mafqoudat database...');
    await mongoose.connect('mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0');
    
    const Country = require('./server/models/Country');
    const Category = require('./server/models/Category');
    const FoundLost = require('./server/models/FoundLost');
    const User = require('./server/models/User');
    
    const mafqoudatData = {
      countries: await Country.countDocuments(),
      categories: await Category.countDocuments(),
      foundLost: await FoundLost.countDocuments(),
      users: await User.countDocuments()
    };
    
    console.log('✅ Mafqoudat database data:');
    console.log(`  Countries: ${mafqoudatData.countries}`);
    console.log(`  Categories: ${mafqoudatData.categories}`);
    console.log(`  Found/Lost: ${mafqoudatData.foundLost}`);
    console.log(`  Users: ${mafqoudatData.users}`);
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.log('❌ Mafqoudat database error:', error.message);
  }
  
  console.log('\n🎯 Solution:');
  console.log('Use the database that has the most data. Update Railway MONGODB_URI accordingly.');
}

compareDatabases();
