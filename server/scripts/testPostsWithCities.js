const mongoose = require("mongoose");
const Post = require("../models/Post");
const Country = require("../models/Country");
const City = require("../models/City");

// Use the MongoDB URI directly
const MONGODB_URI = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';

const testPostsWithCities = async () => {
  try {
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Get a sample country (Morocco)
    const country = await Country.findOne({ code: 'MA' }).lean();
    if (!country) {
      console.log('❌ Country MA not found');
      return;
    }

    console.log(`\n🌍 Testing posts for country: ${country.labels.en} (${country.code})`);

    // Test the same aggregation pipeline that the posts controller uses
    const postsWithUser = await Post.aggregate([
      {
        $match: {
          country: new mongoose.Types.ObjectId(country._id),
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "Category",
        },
      },
      { $unwind: "$Category" },
      {
        $lookup: {
          from: "foundlosts",
          localField: "foundLost",
          foreignField: "_id",
          as: "Floptions",
        },
      },
      {
        $lookup: {
          from: "countries",
          localField: "country",
          foreignField: "_id",
          as: "Country",
        },
      },
      { $unwind: "$Country" },
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
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "User",
        },
      },
      { $unwind: { path: "$User", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          user: 1,
          country: 1,
          exactLocation: 1,
          city: 1,
          cityName: { $ifNull: ["$City.labels.en", null] },
          cityLabels: { $ifNull: ["$City.labels", null] },
          returned: 1,
          createdAt: 1,
          updatedAt: 1,
          username: "$User.username",
          categoryname: "$Category.code",
          countryname: "$Country.code",
          countryLabels: "$Country.labels",
          contact: 1,
          image: 1,
          foundLost: 1,
          description: 1,
          contactPreferences: 1,
          additionalContact: 1,
        },
      },
      {
        $limit: 5,
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
    ]);

    console.log(`📊 Found ${postsWithUser.length} posts`);
    
    if (postsWithUser.length > 0) {
      console.log('\n📋 Sample posts with city data:');
      postsWithUser.forEach((post, index) => {
        console.log(`\n   Post ${index + 1}:`);
        console.log(`   • ID: ${post._id}`);
        console.log(`   • Category: ${post.categoryname}`);
        console.log(`   • City ID: ${post.city}`);
        console.log(`   • City Name: ${post.cityName}`);
        console.log(`   • City Labels: ${JSON.stringify(post.cityLabels)}`);
        console.log(`   • Exact Location: ${post.exactLocation}`);
        console.log(`   • Created: ${new Date(post.createdAt).toLocaleDateString()}`);
      });
    } else {
      console.log('❌ No posts found for this country');
    }

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error testing posts with cities:', error);
    process.exit(1);
  }
};

// Run the test if this file is executed directly
if (require.main === module) {
  testPostsWithCities();
}

module.exports = testPostsWithCities;
