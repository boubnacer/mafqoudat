const mongoose = require('mongoose');

// Use the Railway MongoDB URI (with mafqoudat database)
const MONGODB_URI = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';

async function testRailwayConnection() {
  try {
    console.log('🔌 Testing Railway database connection...');
    console.log('URI:', MONGODB_URI);
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to Railway database');
    
    // Get database info
    const db = mongoose.connection.db;
    console.log('📊 Database name:', db.databaseName);
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log('📋 Collections:', collections.map(c => c.name));
    
    // Test basic operations
    console.log('\n🧪 Testing basic operations...');
    
    // Test Country model
    const Country = require('./server/models/Country');
    const countryCount = await Country.countDocuments();
    console.log('Countries count:', countryCount);
    
    if (countryCount > 0) {
      const morocco = await Country.findOne({ code: 'MA' }).lean();
      console.log('Morocco found:', !!morocco);
      if (morocco) {
        console.log('Morocco ID:', morocco._id);
      }
    }
    
    console.log('\n✅ Railway connection test completed!');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
  } finally {
    try {
      await mongoose.disconnect();
      console.log('🔌 Disconnected from Railway database');
    } catch (e) {
      // Ignore disconnect errors
    }
  }
}

testRailwayConnection();
