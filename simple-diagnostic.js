require("dotenv").config();
const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';

async function simpleDiagnostic() {
  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // Test basic database operations
    console.log('\n📊 Testing basic database operations...');
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections found:', collections.map(c => c.name));
    
    // Test each model individually
    console.log('\n🧪 Testing models individually...');
    
    // Test User model
    try {
      console.log('Testing User model...');
      const User = require('./server/models/User');
      const userCount = await User.countDocuments();
      console.log(`✅ User model works - ${userCount} users found`);
    } catch (error) {
      console.log('❌ User model error:', error.message);
    }
    
    // Test Country model
    try {
      console.log('Testing Country model...');
      const Country = require('./server/models/Country');
      const countryCount = await Country.countDocuments();
      console.log(`✅ Country model works - ${countryCount} countries found`);
    } catch (error) {
      console.log('❌ Country model error:', error.message);
    }
    
    // Test Category model
    try {
      console.log('Testing Category model...');
      const Category = require('./server/models/Category');
      const categoryCount = await Category.countDocuments();
      console.log(`✅ Category model works - ${categoryCount} categories found`);
    } catch (error) {
      console.log('❌ Category model error:', error.message);
    }
    
    // Test FoundLost model
    try {
      console.log('Testing FoundLost model...');
      const FoundLost = require('./server/models/FoundLost');
      const foundLostCount = await FoundLost.countDocuments();
      console.log(`✅ FoundLost model works - ${foundLostCount} found/lost options found`);
    } catch (error) {
      console.log('❌ FoundLost model error:', error.message);
    }
    
    // Test City model
    try {
      console.log('Testing City model...');
      const City = require('./server/models/City');
      const cityCount = await City.countDocuments();
      console.log(`✅ City model works - ${cityCount} cities found`);
    } catch (error) {
      console.log('❌ City model error:', error.message);
    }
    
    // Test Post model - this is where it's likely failing
    try {
      console.log('Testing Post model...');
      const Post = require('./server/models/Post');
      console.log('✅ Post model loaded successfully');
      
      const postCount = await Post.countDocuments();
      console.log(`✅ Post model works - ${postCount} posts found`);
      
      // Try to get one post
      const onePost = await Post.findOne().lean();
      console.log('✅ Post.findOne() works');
      
    } catch (error) {
      console.log('❌ Post model error:', error.message);
      console.log('Error stack:', error.stack);
    }

  } catch (error) {
    console.error('❌ Diagnostic error:', error);
    console.error('Error stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

simpleDiagnostic();
