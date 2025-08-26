require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';

async function quickTest() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const City = require('./server/models/City');
    const Country = require('./server/models/Country');
    
    // Check total cities
    const totalCities = await City.countDocuments();
    console.log(`📊 Total cities in database: ${totalCities}`);
    
    if (totalCities > 0) {
      const sampleCity = await City.findOne().lean();
      console.log('Sample city:', JSON.stringify(sampleCity, null, 2));
      
      // Check Morocco cities
      const morocco = await Country.findOne({ code: 'MA' });
      if (morocco) {
        const moroccoCities = await City.countDocuments({ country: morocco._id });
        console.log(`📊 Cities in Morocco: ${moroccoCities}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

quickTest();
