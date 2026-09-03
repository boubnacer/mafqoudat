const mongoose = require('mongoose');
const City = require('../models/City');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set. Define it in server/.env (or export it) before running this script.');
  process.exit(1);
}

const removeCityNamesField = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all cities
    const cities = await City.find({});
    console.log(`Found ${cities.length} cities to process`);

    // Remove the 'names' field from each city
    let updatedCount = 0;
    for (const city of cities) {
      if (city.names) {
        // Remove the names field
        city.names = undefined;
        await city.save();
        updatedCount++;
        console.log(`Updated city: ${city.code} - ${city.labels.en}`);
      }
    }

    console.log(`Successfully updated ${updatedCount} cities`);
    console.log('City names field removal completed successfully');

  } catch (error) {
    console.error('Error removing city names field:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script if called directly
if (require.main === module) {
  removeCityNamesField();
}

module.exports = removeCityNamesField;
