require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');

// MongoDB URI from your message
const MONGODB_URI = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';

async function testDatabaseConnection() {
  try {
    console.log('🔌 Testing database connection...');
    console.log('Using URI:', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority',
    });
    
    console.log('✅ Connected to MongoDB successfully');
    
    // Test collections
    const collections = ['countries', 'categories', 'foundlosts'];
    
    for (const collectionName of collections) {
      try {
        const collection = mongoose.connection.db.collection(collectionName);
        const count = await collection.countDocuments();
        console.log(`📊 ${collectionName}: ${count} documents`);
        
        if (count > 0) {
          const sample = await collection.findOne();
          console.log(`   Sample document:`, JSON.stringify(sample, null, 2));
        }
      } catch (error) {
        console.log(`❌ Error checking ${collectionName}:`, error.message);
      }
    }
    
    // Test with Mongoose models
    console.log('\n🔍 Testing with Mongoose models...');
    
    const Country = require('./server/models/Country');
    const Category = require('./server/models/Category');
    const FoundLost = require('./server/models/FoundLost');
    
    const countries = await Country.find().limit(3);
    console.log(`Countries found: ${countries.length}`);
    if (countries.length > 0) {
      console.log('Sample country:', countries[0]);
    }
    
    const categories = await Category.find().limit(3);
    console.log(`Categories found: ${categories.length}`);
    if (categories.length > 0) {
      console.log('Sample category:', categories[0]);
    }
    
    const foundLosts = await FoundLost.find().limit(3);
    console.log(`Found/Lost options found: ${foundLosts.length}`);
    if (foundLosts.length > 0) {
      console.log('Sample found/lost option:', foundLosts[0]);
    }
    
  } catch (error) {
    console.error('❌ Database connection error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testDatabaseConnection();
