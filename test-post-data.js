const mongoose = require('mongoose');

const Post = require('./server/models/Post');

async function testPostData() {
  try {
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect('mongodb+srv://boubkraouinacer:NB%40mafBase2025@clustermafqm0.mty6zln.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=ClusterMafqM0');
    
    console.log('Connected to MongoDB');
    
    // First, let's check if we have any posts at all
    const totalPosts = await Post.countDocuments();
    console.log('Total posts in database:', totalPosts);
    
    if (totalPosts === 0) {
      console.log('No posts found in database');
      return;
    }
    
    // Let's also check the raw post structure
    const rawPost = await Post.findOne().lean();
    console.log('Raw post structure:', JSON.stringify(rawPost, null, 2));
    
    const posts = await Post.aggregate([
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'Category'
        }
      },
      {
        $lookup: {
          from: 'cities',
          localField: 'city',
          foreignField: '_id',
          as: 'City'
        }
      },
      {
        $project: {
          categoryname: { $ifNull: ['$Category.code', 'OTHER'] },
          cityName: { $ifNull: ['$City.labels.en', null] },
          createdAt: 1,
          _id: 1,
          exactLocation: 1
        }
      },
      {
        $limit: 1
      }
    ]);
    
    console.log('Aggregated post data:', JSON.stringify(posts[0], null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
}

testPostData();
