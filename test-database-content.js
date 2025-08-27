const mongoose = require('mongoose');

// MongoDB Atlas connection string
const MONGODB_URI = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Test the specific IDs from the error
async function testSpecificIds() {
  console.log('\n🔍 Testing specific IDs from the error...');
  
  const testIds = {
    user: '68af89bb30464c5a97ca8fcf',
    country: '68a4b54ab46524c54c553cae',
    category: '68a4b54ab46524c54c553cc9',
    foundLost: '68a4b54ab46524c54c553cc3',
    city: '68a9d9be6bbbb3b407a5be07'
  };

  // Test each ID
  for (const [type, id] of Object.entries(testIds)) {
    try {
      const collection = mongoose.connection.collection(type === 'foundLost' ? 'foundlosts' : type + 's');
      const doc = await collection.findOne({ _id: new mongoose.Types.ObjectId(id) });
      console.log(`${type}: ${id} - ${doc ? '✅ EXISTS' : '❌ NOT FOUND'}`);
      if (doc) {
        console.log(`  Data:`, JSON.stringify(doc, null, 2));
      }
    } catch (error) {
      console.log(`${type}: ${id} - ❌ ERROR: ${error.message}`);
    }
  }
}

// Check all available data
async function checkAllData() {
  console.log('\n📊 Checking all available data...');
  
  const collections = ['users', 'countries', 'categories', 'foundlosts', 'cities'];
  
  for (const collectionName of collections) {
    try {
      const collection = mongoose.connection.collection(collectionName);
      const count = await collection.countDocuments();
      console.log(`\n${collectionName.toUpperCase()}: ${count} documents`);
      
      if (count > 0) {
        const sampleDocs = await collection.find().limit(3).toArray();
        console.log('Sample documents:');
        sampleDocs.forEach((doc, index) => {
          console.log(`  ${index + 1}. ID: ${doc._id}`);
          if (doc.code) console.log(`     Code: ${doc.code}`);
          if (doc.labels?.en) console.log(`     Name (EN): ${doc.labels.en}`);
          if (doc.names?.en) console.log(`     Name (EN): ${doc.names.en}`);
          if (doc.username) console.log(`     Username: ${doc.username}`);
        });
      }
    } catch (error) {
      console.log(`${collectionName}: ❌ ERROR: ${error.message}`);
    }
  }
}

// Main function
async function main() {
  await connectDB();
  await testSpecificIds();
  await checkAllData();
  
  console.log('\n✅ Database check completed');
  process.exit(0);
}

main().catch(console.error);
