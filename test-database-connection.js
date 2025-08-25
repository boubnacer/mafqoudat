const mongoose = require('mongoose');

// Your MongoDB URI - let's try different variations
const MONGODB_URI_1 = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const MONGODB_URI_2 = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority';
const MONGODB_URI_3 = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';

async function testDatabaseConnection() {
  console.log('🔍 Testing Database Connection...\\n');
  
  const uris = [
    { name: 'Original URI', uri: MONGODB_URI_1 },
    { name: 'URI with database name', uri: MONGODB_URI_2 },
    { name: 'URI with database name and app name', uri: MONGODB_URI_3 }
  ];
  
  for (const { name, uri } of uris) {
    console.log(`\\n📡 Testing: ${name}`);
    console.log(`URI: ${uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`); // Hide credentials
    
    try {
      // Connect with timeout
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000, // 10 seconds timeout
        socketTimeoutMS: 45000, // 45 seconds timeout
        connectTimeoutMS: 10000, // 10 seconds timeout
      });
      
      console.log('✅ Connection successful!');
      
      // Get database info
      const db = mongoose.connection.db;
      const adminDb = db.admin();
      
      try {
        const dbInfo = await adminDb.listDatabases();
        console.log('📊 Available databases:');
        dbInfo.databases.forEach(db => {
          console.log(`  - ${db.name} (${db.sizeOnDisk} bytes)`);
        });
        
        // Check collections in current database
        const collections = await db.listCollections().toArray();
        console.log(`\\n📁 Collections in current database: ${collections.length}`);
        collections.forEach(col => {
          console.log(`  - ${col.name}`);
        });
        
        // Try to access posts collection
        try {
          const postsCollection = db.collection('posts');
          const postsCount = await postsCollection.countDocuments();
          console.log(`\\n📝 Posts count: ${postsCount}`);
          
          if (postsCount > 0) {
            const samplePost = await postsCollection.findOne({});
            console.log('Sample post ID:', samplePost._id);
          }
        } catch (error) {
          console.log('❌ Could not access posts collection:', error.message);
        }
        
      } catch (error) {
        console.log('⚠️  Could not get database info:', error.message);
      }
      
      await mongoose.disconnect();
      console.log('🔌 Disconnected');
      
      // If we get here, the connection worked
      console.log(`\\n🎉 SUCCESS: ${name} works!`);
      return { success: true, uri: name };
      
    } catch (error) {
      console.log(`❌ Connection failed: ${error.message}`);
      
      if (error.name === 'MongoServerSelectionError') {
        console.log('💡 This usually means:');
        console.log('   - Network connectivity issue');
        console.log('   - Wrong connection string');
        console.log('   - MongoDB Atlas IP whitelist issue');
        console.log('   - Authentication problem');
      }
      
      await mongoose.disconnect();
    }
  }
  
  console.log('\\n❌ All connection attempts failed');
  return { success: false };
}

// Run the test
testDatabaseConnection().then(result => {
  if (result.success) {
    console.log(`\\n✅ Found working connection: ${result.uri}`);
  } else {
    console.log('\\n❌ No working connection found');
    console.log('\\n💡 Troubleshooting tips:');
    console.log('1. Check your internet connection');
    console.log('2. Verify the MongoDB Atlas cluster is running');
    console.log('3. Check if your IP is whitelisted in MongoDB Atlas');
    console.log('4. Verify username and password are correct');
    console.log('5. Check if the database name is correct');
  }
});
