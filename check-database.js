const mongoose = require('mongoose');
const Post = require('./server/models/Post');
const Country = require('./server/models/Country');
const FoundLost = require('./server/models/FoundLost');

async function checkDatabase() {
  try {
    // Use the same connection string as the seed script
    const MONGODB_URI = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';
    
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB Atlas');
    
    // Check total posts
    const totalPosts = await Post.countDocuments();
    console.log('Total posts:', totalPosts);
    
    // Get sample posts
    const posts = await Post.find().limit(5);
    console.log('Sample posts:', posts.map(p => ({
      id: p._id,
      country: p.country,
      foundLost: p.foundLost,
      createdAt: p.createdAt,
      category: p.category
    })));
    
    // Check countries
    const countries = await Country.find().limit(3);
    console.log('Countries:', countries.map(c => ({
      id: c._id,
      code: c.code,
      name: c.name
    })));
    
    // Check FoundLost options
    const foundLost = await FoundLost.find();
    console.log('FoundLost options:', foundLost.map(fl => ({
      id: fl._id,
      code: fl.code
    })));
    
    // Test dashboard query for a specific country
    if (countries.length > 0) {
      const testCountry = countries[0]._id;
      console.log('\nTesting dashboard query for country:', testCountry);
      
      const foundOption = await FoundLost.findOne({ code: "FOUND" });
      const lostOption = await FoundLost.findOne({ code: "LOST" });
      
      console.log('Found option:', foundOption ? foundOption._id : 'NOT FOUND');
      console.log('Lost option:', lostOption ? lostOption._id : 'NOT FOUND');
      
      // Check posts for this country
      const countryPosts = await Post.find({ country: testCountry });
      console.log('Posts for test country:', countryPosts.length);
      
      // Check found posts
      if (foundOption) {
        const foundPosts = await Post.find({ 
          country: testCountry, 
          foundLost: foundOption._id 
        });
        console.log('Found posts for test country:', foundPosts.length);
      }
      
      // Check lost posts
      if (lostOption) {
        const lostPosts = await Post.find({ 
          country: testCountry, 
          foundLost: lostOption._id 
        });
        console.log('Lost posts for test country:', lostPosts.length);
      }
    }
    
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error:', error);
  }
}

checkDatabase();
