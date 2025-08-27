require("dotenv").config();
const mongoose = require('mongoose');
const Post = require('./server/models/Post');
const User = require('./server/models/User');
const Country = require('./server/models/Country');
const Category = require('./server/models/Category');
const FoundLost = require('./server/models/FoundLost');
const City = require('./server/models/City');

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';

async function debugDatabaseStructure() {
  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // Check if there are any existing posts
    console.log('\n📊 Checking existing posts...');
    const existingPosts = await Post.find().limit(1).lean();
    console.log(`Found ${existingPosts.length} existing posts`);
    
    if (existingPosts.length > 0) {
      console.log('Sample post structure:', JSON.stringify(existingPosts[0], null, 2));
    }

    // Get sample data for testing
    console.log('\n📊 Getting sample data...');
    
    const user = await User.findOne().lean();
    const country = await Country.findOne().lean();
    const category = await Category.findOne().lean();
    const foundLost = await FoundLost.findOne().lean();
    const city = await City.findOne().lean();

    console.log('Sample data found:');
    console.log('- User:', user ? user._id : 'None');
    console.log('- Country:', country ? `${country.code} (${country._id})` : 'None');
    console.log('- Category:', category ? `${category.code} (${category._id})` : 'None');
    console.log('- FoundLost:', foundLost ? `${foundLost.code} (${foundLost._id})` : 'None');
    console.log('- City:', city ? `${city.code} (${city._id})` : 'None');

    if (!user || !country || !category || !foundLost) {
      console.log('❌ Missing required data for post creation');
      return;
    }

    // Test post data based on the Railway logs
    const testPostData = {
      user: user._id,
      country: country._id,
      category: category._id,
      foundLost: foundLost._id,
      city: city._id,
      exactLocation: 'Test Location',
      exactDate: new Date('2025-08-27'),
      contact: 'test@example.com',
      description: 'Test description',
      contactPreferences: {
        phone: true,
        email: false,
        whatsapp: false
      },
      additionalContact: {
        phone: '',
        email: '',
        whatsapp: ''
      }
    };

    console.log('\n🧪 Testing post creation with Railway-style data...');
    console.log('Test data:', JSON.stringify(testPostData, null, 2));

    // Try to create post
    try {
      const post = await Post.create(testPostData);
      console.log('✅ Post created successfully:', post._id);
      console.log('Created post:', JSON.stringify(post.toObject(), null, 2));
      
      // Clean up - delete the test post
      await Post.findByIdAndDelete(post._id);
      console.log('🧹 Test post cleaned up');
      
    } catch (error) {
      console.log('❌ Post creation failed:');
      console.log('Error name:', error.name);
      console.log('Error message:', error.message);
      console.log('Error code:', error.code);
      
      if (error.errors) {
        console.log('Validation errors:');
        Object.keys(error.errors).forEach(key => {
          console.log(`- ${key}: ${error.errors[key].message}`);
        });
      }
    }

    // Test with the exact data from Railway logs
    console.log('\n🧪 Testing with exact Railway log data...');
    const railwayLogData = {
      user: '68adafcbfbee01557b7f5bf6',
      country: '68a4b54ab46524c54c553ca9',
      category: '68a4b54ab46524c54c553cc8',
      foundLost: '68a4b54ab46524c54c553cc3',
      city: '68a9d9bb6bbbb3b407a5bdce',
      exactLocation: 'dotzodi',
      exactDate: new Date('2025-08-27'),
      contact: '0654597065',
      description: '',
      contactPreferences: {
        phone: true,
        email: false,
        whatsapp: false
      },
      additionalContact: {
        phone: '',
        email: '',
        whatsapp: ''
      }
    };

    try {
      const post = await Post.create(railwayLogData);
      console.log('✅ Railway-style post created successfully:', post._id);
      
      // Clean up
      await Post.findByIdAndDelete(post._id);
      console.log('🧹 Railway test post cleaned up');
      
    } catch (error) {
      console.log('❌ Railway-style post creation failed:');
      console.log('Error name:', error.name);
      console.log('Error message:', error.message);
      console.log('Error code:', error.code);
      
      if (error.errors) {
        console.log('Validation errors:');
        Object.keys(error.errors).forEach(key => {
          console.log(`- ${key}: ${error.errors[key].message}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Debug script error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

debugDatabaseStructure();
