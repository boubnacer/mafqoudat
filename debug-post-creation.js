const mongoose = require('mongoose');
const Post = require('./server/models/Post');
const User = require('./server/models/User');
const Country = require('./server/models/Country');
const Category = require('./server/models/Category');
const FoundLost = require('./server/models/FoundLost');
const City = require('./server/models/City');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mafqoudat';

async function debugPostCreation() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get sample data
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

    // Test post data
    const testPostData = {
      user: user._id,
      country: country._id,
      category: category._id,
      foundLost: foundLost._id,
      city: city._id, // This might be the issue
      exactLocation: 'Test Location',
      exactDate: new Date(),
      contact: 'test@example.com',
      description: 'Test description'
    };

    console.log('\n🧪 Testing post creation with data:', testPostData);

    // Try to create post
    try {
      const post = await Post.create(testPostData);
      console.log('✅ Post created successfully:', post._id);
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

    // Test without city
    console.log('\n🧪 Testing post creation WITHOUT city...');
    const testPostDataNoCity = { ...testPostData };
    delete testPostDataNoCity.city;

    try {
      const post = await Post.create(testPostDataNoCity);
      console.log('✅ Post created successfully without city:', post._id);
    } catch (error) {
      console.log('❌ Post creation failed without city:');
      console.log('Error message:', error.message);
    }

  } catch (error) {
    console.error('❌ Debug script error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

debugPostCreation();
