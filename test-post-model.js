require("dotenv").config();
const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';

async function testPostModel() {
  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // Test if we can load the Post model
    console.log('\n🧪 Testing Post model loading...');
    try {
      const Post = require('./server/models/Post');
      console.log('✅ Post model loaded successfully');
      
      // Test basic operations
      console.log('Testing Post.countDocuments()...');
      const count = await Post.countDocuments();
      console.log(`✅ Post.countDocuments() works - ${count} posts found`);
      
      // Test creating a simple post without AutoIncrement
      console.log('\n🧪 Testing post creation...');
      
      const testPostData = {
        user: new mongoose.Types.ObjectId(),
        country: new mongoose.Types.ObjectId(),
        category: new mongoose.Types.ObjectId(),
        foundLost: new mongoose.Types.ObjectId(),
        exactLocation: 'Test Location',
        exactDate: new Date(),
        contact: 'test@example.com',
        description: 'Test description'
      };
      
      console.log('Test data:', testPostData);
      
      const post = await Post.create(testPostData);
      console.log('✅ Post created successfully:', post._id);
      
      // Clean up
      await Post.findByIdAndDelete(post._id);
      console.log('🧹 Test post cleaned up');
      
    } catch (error) {
      console.log('❌ Post model error:', error.message);
      console.log('Error stack:', error.stack);
      
      // Check if it's an AutoIncrement issue
      if (error.message.includes('AutoIncrement') || error.message.includes('ticket')) {
        console.log('\n🔍 This might be an AutoIncrement plugin issue');
        console.log('Let\'s try creating a simple post schema without AutoIncrement...');
        
        // Create a simple test schema
        const simplePostSchema = new mongoose.Schema({
          user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
          },
          country: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Country",
          },
          category: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Category",
          },
          foundLost: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "FoundLost",
          },
          exactLocation: {
            type: String,
            required: true,
          },
          exactDate: {
            type: Date,
            required: true,
            default: Date.now,
          },
          contact: {
            type: String,
            required: true,
          },
          description: {
            type: String,
            default: "",
          }
        }, {
          timestamps: true,
        });
        
        const SimplePost = mongoose.model("SimplePost", simplePostSchema);
        
        const simplePost = await SimplePost.create(testPostData);
        console.log('✅ Simple post created successfully:', simplePost._id);
        
        // Clean up
        await SimplePost.findByIdAndDelete(simplePost._id);
        console.log('🧹 Simple test post cleaned up');
      }
    }

  } catch (error) {
    console.error('❌ Test error:', error);
    console.error('Error stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testPostModel();
