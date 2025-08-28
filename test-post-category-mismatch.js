const mongoose = require('mongoose');

async function testPostCategoryMismatch() {
  try {
    // Connect to MongoDB
    const uri = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    // Import models
    const Post = require('./server/models/Post');
    const Category = require('./server/models/Category');
    const City = require('./server/models/City');
    const FoundLost = require('./server/models/FoundLost');

    // Test post ID from your example
    const postId = '68af9600db9a6be16dd868a4';
    const post = await Post.findById(postId);
    
    if (!post) {
      console.log('❌ Post not found');
      return;
    }

    console.log('\n📝 Post Analysis:');
    console.log('- Post ID:', post._id);
    console.log('- Category ID:', post.category);
    console.log('- City ID:', post.city);
    console.log('- FoundLost ID:', post.foundLost);
    console.log('- Country ID:', post.country);

    // Check if category exists
    console.log('\n🔍 Checking Category...');
    const category = await Category.findById(post.category);
    if (category) {
      console.log('✅ Category found:', category.code, '-', category.labels?.en);
    } else {
      console.log('❌ Category not found with ID:', post.category);
      
      // List all categories
      const allCategories = await Category.find().select('_id code labels.en');
      console.log('📋 Available categories:');
      allCategories.forEach(cat => {
        console.log(`  - ${cat._id}: ${cat.code} (${cat.labels?.en})`);
      });
    }

    // Check if city exists
    console.log('\n🔍 Checking City...');
    const city = await City.findById(post.city);
    if (city) {
      console.log('✅ City found:', city.code, '-', city.labels?.en);
    } else {
      console.log('❌ City not found with ID:', post.city);
      
      // List cities for the same country
      const countryCities = await City.find({ country: post.country }).select('_id code labels.en');
      console.log('📋 Available cities for this country:');
      countryCities.forEach(city => {
        console.log(`  - ${city._id}: ${city.code} (${city.labels?.en})`);
      });
    }

    // Check if foundLost exists
    console.log('\n🔍 Checking FoundLost...');
    const foundLost = await FoundLost.findById(post.foundLost);
    if (foundLost) {
      console.log('✅ FoundLost found:', foundLost.code, '-', foundLost.labels?.en);
    } else {
      console.log('❌ FoundLost not found with ID:', post.foundLost);
    }

    // Test aggregation pipeline
    console.log('\n🔍 Testing Aggregation Pipeline...');
    const aggregationResult = await Post.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(postId) } },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "Category",
        },
      },
      { $unwind: { path: "$Category", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "cities",
          localField: "city",
          foreignField: "_id",
          as: "City",
        },
      },
      { $unwind: { path: "$City", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          category: 1,
          city: 1,
          categoryName: { $ifNull: ["$Category.code", "Unknown"] },
          cityName: { $ifNull: ["$City.labels.en", "Unknown"] },
          categoryDetails: "$Category",
          cityDetails: "$City"
        }
      }
    ]);

    if (aggregationResult.length > 0) {
      const result = aggregationResult[0];
      console.log('\n📊 Aggregation Result:');
      console.log('- Category Name:', result.categoryName);
      console.log('- City Name:', result.cityName);
      console.log('- Category Details:', result.categoryDetails);
      console.log('- City Details:', result.cityDetails);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testPostCategoryMismatch();
