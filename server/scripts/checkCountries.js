const mongoose = require("mongoose");
const Country = require("../models/Country");
require('dotenv').config();

const checkCountries = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Get all countries
    const countries = await Country.find({}).select('code labels.en').lean();
    
    console.log(`\n📋 Found ${countries.length} countries in database:`);
    countries.forEach(country => {
      console.log(`   • ${country.code}: ${country.labels.en}`);
    });

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error checking countries:', error);
    process.exit(1);
  }
};

// Run the check if this file is executed directly
if (require.main === module) {
  checkCountries();
}

module.exports = checkCountries;
