require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';

async function testConnection() {
  try {
    console.log('🔌 Testing MongoDB connection...');
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB Atlas');

    // Test basic operations
    const db = mongoose.connection.db;
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log('\n📊 Collections found:', collections.map(c => c.name));

    // Check if we can query each collection
    for (const collection of collections) {
      try {
        const count = await db.collection(collection.name).countDocuments();
        console.log(`  - ${collection.name}: ${count} documents`);
      } catch (error) {
        console.log(`  - ${collection.name}: Error - ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Connection error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testConnection();
