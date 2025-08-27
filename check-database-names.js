const mongoose = require('mongoose');

// Test both connection strings
const uris = [
  {
    name: 'Your Atlas URI (no database specified)',
    uri: 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0'
  },
  {
    name: 'Railway URI (with mafqoudat database)',
    uri: 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0'
  }
];

async function checkDatabases() {
  for (const connection of uris) {
    try {
      console.log(`\n🔍 Testing: ${connection.name}`);
      console.log(`URI: ${connection.uri}`);
      
      // Connect to MongoDB
      await mongoose.connect(connection.uri);
      console.log('✅ Connected successfully');
      
      // Get database info
      const db = mongoose.connection.db;
      console.log(`📊 Database name: ${db.databaseName}`);
      
      // List all collections
      const collections = await db.listCollections().toArray();
      console.log(`📋 Collections found: ${collections.length}`);
      collections.forEach(collection => {
        console.log(`  - ${collection.name}`);
      });
      
      // Check if our expected collections exist
      const expectedCollections = ['countries', 'categories', 'foundlosts', 'users', 'cities'];
      const foundCollections = collections.map(c => c.name);
      
      console.log('\n🔍 Checking for expected collections:');
      expectedCollections.forEach(expected => {
        const exists = foundCollections.includes(expected);
        console.log(`  ${expected}: ${exists ? '✅' : '❌'}`);
      });
      
      // Test if we can find the specific data
      if (foundCollections.includes('countries')) {
        const Country = require('./server/models/Country');
        const morocco = await Country.findOne({ code: 'MA' }).lean();
        console.log(`\n🌍 Morocco found: ${morocco ? '✅' : '❌'}`);
        if (morocco) {
          console.log(`  ID: ${morocco._id}`);
        }
      }
      
      if (foundCollections.includes('foundlosts')) {
        const FoundLost = require('./server/models/FoundLost');
        const found = await FoundLost.findOne({ code: 'FOUND' }).lean();
        console.log(`🔍 FOUND option found: ${found ? '✅' : '❌'}`);
        if (found) {
          console.log(`  ID: ${found._id}`);
        }
      }
      
      if (foundCollections.includes('categories')) {
        const Category = require('./server/models/Category');
        const clothing = await Category.findOne({ code: 'CLOTHING' }).lean();
        console.log(`📂 CLOTHING category found: ${clothing ? '✅' : '❌'}`);
        if (clothing) {
          console.log(`  ID: ${clothing._id}`);
        }
      }
      
      await mongoose.disconnect();
      console.log('🔌 Disconnected');
      
    } catch (error) {
      console.error(`❌ Error with ${connection.name}:`, error.message);
      try {
        await mongoose.disconnect();
      } catch (e) {
        // Ignore disconnect errors
      }
    }
  }
}

checkDatabases();
