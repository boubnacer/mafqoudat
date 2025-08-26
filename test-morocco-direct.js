require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');

// MongoDB URI
const MONGODB_URI = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';

async function testMoroccoDirect() {
  try {
    console.log('🇲🇦 Testing Morocco Directly...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 3,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 15000,
      retryWrites: true,
      w: 'majority',
    });
    
    console.log('✅ Connected to MongoDB successfully');
    
    const City = require('./server/models/City');
    const Country = require('./server/models/Country');
    
    // Morocco ID from the logs
    const moroccoId = '68a4b54ab46524c54c553ca9';
    
    console.log('\n🔍 Test 1: Find Morocco by ID');
    console.log('🔍 ID:', moroccoId);
    console.log('🔍 ID type:', typeof moroccoId);
    console.log('🔍 Is valid ObjectId:', mongoose.Types.ObjectId.isValid(moroccoId));
    
    let morocco = null;
    
    // Try different approaches to find Morocco
    if (mongoose.Types.ObjectId.isValid(moroccoId)) {
      const moroccoObjectId = new mongoose.Types.ObjectId(moroccoId);
      console.log('🔍 Trying with ObjectId:', moroccoObjectId);
      morocco = await Country.findById(moroccoObjectId).lean();
    }
    
    if (!morocco) {
      console.log('🔍 Trying with string ID');
      morocco = await Country.findById(moroccoId).lean();
    }
    
    if (!morocco) {
      console.log('🔍 Trying with findOne');
      morocco = await Country.findOne({ _id: moroccoId }).lean();
    }
    
    console.log('🔍 Morocco found:', morocco ? 'Yes' : 'No');
    if (morocco) {
      console.log('  Code:', morocco.code);
      console.log('  Name:', morocco.names?.en);
      console.log('  isActive:', morocco.isActive);
    }
    
    console.log('\n🔍 Test 2: Find cities for Morocco');
    if (morocco) {
      let cities = [];
      
      // Try with ObjectId
      if (mongoose.Types.ObjectId.isValid(moroccoId)) {
        const moroccoObjectId = new mongoose.Types.ObjectId(moroccoId);
        console.log('🔍 Trying cities with ObjectId:', moroccoObjectId);
        cities = await City.find({ 
          country: moroccoObjectId,
          isActive: true
        }).lean();
        console.log('🔍 Found cities with ObjectId:', cities.length);
      }
      
      // Try with string
      if (cities.length === 0) {
        console.log('🔍 Trying cities with string ID');
        cities = await City.find({ 
          country: moroccoId,
          isActive: true
        }).lean();
        console.log('🔍 Found cities with string:', cities.length);
      }
      
      // Try without isActive filter
      if (cities.length === 0) {
        console.log('🔍 Trying cities without isActive filter');
        cities = await City.find({ 
          country: moroccoId
        }).lean();
        console.log('🔍 Found cities without isActive filter:', cities.length);
      }
      
      if (cities.length > 0) {
        console.log('\n📋 Cities found:');
        cities.forEach((city, index) => {
          console.log(`  ${index + 1}. ${city.code} (isActive: ${city.isActive})`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testMoroccoDirect();
