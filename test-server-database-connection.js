const mongoose = require('mongoose');

// Use the same MongoDB URI as your database
const MONGODB_URI = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';

async function testServerDatabaseConnection() {
  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');
    
    // Get the database instance
    const db = mongoose.connection.db;
    console.log('📊 Database name:', db.databaseName);
    
    // List all collections
    console.log('\n📋 All collections in database:');
    const collections = await db.listCollections().toArray();
    collections.forEach(collection => {
      console.log(`  - ${collection.name}`);
    });
    
    // Test each model with the exact same queries as the server
    console.log('\n🧪 Testing server models...');
    
    // Test FoundLost model
    console.log('\n🔍 Testing FoundLost model...');
    const FoundLost = require('./server/models/FoundLost');
    const foundLostCount = await FoundLost.countDocuments();
    console.log(`FoundLost count: ${foundLostCount}`);
    
    if (foundLostCount > 0) {
      const foundLostSample = await FoundLost.findOne().lean();
      console.log('FoundLost sample:', {
        _id: foundLostSample._id,
        code: foundLostSample.code,
        labels: foundLostSample.labels
      });
    }
    
    // Test Category model
    console.log('\n📂 Testing Category model...');
    const Category = require('./server/models/Category');
    const categoryCount = await Category.countDocuments();
    console.log(`Category count: ${categoryCount}`);
    
    if (categoryCount > 0) {
      const categorySample = await Category.findOne().lean();
      console.log('Category sample:', {
        _id: categorySample._id,
        code: categorySample.code,
        labels: categorySample.labels
      });
    }
    
    // Test Country model
    console.log('\n🌍 Testing Country model...');
    const Country = require('./server/models/Country');
    const countryCount = await Country.countDocuments();
    console.log(`Country count: ${countryCount}`);
    
    if (countryCount > 0) {
      const countrySample = await Country.findOne().lean();
      console.log('Country sample:', {
        _id: countrySample._id,
        code: countrySample.code,
        labels: countrySample.labels
      });
    }
    
    // Test User model
    console.log('\n👤 Testing User model...');
    const User = require('./server/models/User');
    const userCount = await User.countDocuments();
    console.log(`User count: ${userCount}`);
    
    if (userCount > 0) {
      const userSample = await User.findOne().lean();
      console.log('User sample:', {
        _id: userSample._id,
        username: userSample.username,
        country: userSample.country
      });
    }
    
    // Test the exact validation queries from postsController
    console.log('\n🔍 Testing exact validation queries from postsController...');
    
    // Test the IDs that the client is sending
    const testIds = {
      user: '68adafcbfbee01557b7f5bf6',
      country: '68a4b54ab46524c54c553ca9',
      category: '68a4b54ab46524c54c553cc9',
      foundLost: '68a4b54ab46524c54c553cc3'
    };
    
    console.log('\n📋 Testing validation for client-sent IDs:');
    
    // Test user validation
    const userExists = await User.findById(testIds.user).lean();
    console.log(`User validation: ${userExists ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    
    // Test country validation
    const countryExists = await Country.findById(testIds.country).lean();
    console.log(`Country validation: ${countryExists ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    
    // Test category validation
    const categoryExists = await Category.findById(testIds.category).lean();
    console.log(`Category validation: ${categoryExists ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    
    // Test foundLost validation
    const foundLostExists = await FoundLost.findById(testIds.foundLost).lean();
    console.log(`FoundLost validation: ${foundLostExists ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    
    console.log('\n✅ Database connection test completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testServerDatabaseConnection();
