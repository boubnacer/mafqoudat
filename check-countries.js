const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const Country = require('./server/models/Country');
    const countries = await Country.find({});
    
    console.log('Countries in database:');
    console.log(JSON.stringify(countries, null, 2));
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });
