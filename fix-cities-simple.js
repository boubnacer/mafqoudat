require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');

// MongoDB URI
const MONGODB_URI = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';

async function fixCitiesSimple() {
  try {
    console.log('🔧 Fixing cities isActive field...');
    
    // Connect to MongoDB with longer timeout
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 60000,
      socketTimeoutMS: 60000,
      retryWrites: true,
      w: 'majority',
    });
    
    console.log('✅ Connected to MongoDB successfully');
    
    const City = require('./server/models/City');
    
    // Simple update - set all cities to isActive: true
    console.log('\n🔧 Updating all cities to isActive: true...');
    const updateResult = await City.updateMany(
      {}, // Update all cities
      { $set: { isActive: true } }
    );
    
    console.log(`✅ Updated ${updateResult.modifiedCount} cities`);
    
    // Quick verification
    console.log('\n📊 Quick verification...');
    const totalCities = await City.countDocuments();
    const activeCities = await City.countDocuments({ isActive: true });
    console.log(`Total cities: ${totalCities}`);
    console.log(`Cities with isActive: true: ${activeCities}`);
    
    console.log('\n🎉 Cities isActive field fix completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

fixCitiesSimple();
