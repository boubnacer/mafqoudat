require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');

// MongoDB URI
const MONGODB_URI = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';

async function fixCitiesIsActive() {
  try {
    console.log('🔧 Fixing cities isActive field...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority',
    });
    
    console.log('✅ Connected to MongoDB successfully');
    
    const City = require('./server/models/City');
    
    // Check current state
    console.log('\n📊 Checking current cities state...');
    const totalCities = await City.countDocuments();
    console.log(`Total cities: ${totalCities}`);
    
    const activeCities = await City.countDocuments({ isActive: true });
    console.log(`Cities with isActive: true: ${activeCities}`);
    
    const nullActiveCities = await City.countDocuments({ isActive: null });
    console.log(`Cities with isActive: null: ${nullActiveCities}`);
    
    const falseActiveCities = await City.countDocuments({ isActive: false });
    console.log(`Cities with isActive: false: ${falseActiveCities}`);
    
    // Update all cities to have isActive: true
    console.log('\n🔧 Updating all cities to isActive: true...');
    const updateResult = await City.updateMany(
      {}, // Update all cities
      { $set: { isActive: true } }
    );
    
    console.log(`✅ Updated ${updateResult.modifiedCount} cities`);
    
    // Verify the update
    console.log('\n📊 Verifying update...');
    const newActiveCities = await City.countDocuments({ isActive: true });
    console.log(`Cities with isActive: true after update: ${newActiveCities}`);
    
    const newNullActiveCities = await City.countDocuments({ isActive: null });
    console.log(`Cities with isActive: null after update: ${newNullActiveCities}`);
    
    // Show sample cities
    console.log('\n📋 Sample cities after update:');
    const sampleCities = await City.find().limit(3).lean();
    sampleCities.forEach((city, index) => {
      console.log(`City ${index + 1}: ${city.code} - isActive: ${city.isActive}`);
    });
    
    console.log('\n🎉 Cities isActive field fix completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

fixCitiesIsActive();
