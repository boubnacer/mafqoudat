const fs = require('fs');
const path = require('path');

// Read the current dashboard controller
const controllerPath = path.join(__dirname, 'server', 'controllers', 'dependenciesController.js');
let content = fs.readFileSync(controllerPath, 'utf8');

console.log('🔧 Applying direct fix to dashboard aggregation pipeline...');

// The issue is that posts don't have valid category and city IDs
// Let's add a stage to handle posts with missing category/city data

// Add a stage to handle posts with missing category/city data in trendingPost
const trendingPostFix = {
  from: `      trendingPost = await Post.aggregate([
      { $match: { country: new mongoose.Types.ObjectId(currentCountry) } },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "Category",
        },
      },`,
  to: `      trendingPost = await Post.aggregate([
      { $match: { country: new mongoose.Types.ObjectId(currentCountry) } },
      // Handle posts with missing category/city data
      {
        $addFields: {
          category: { $ifNull: ["$category", null] },
          city: { $ifNull: ["$city", null] }
        }
      },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "Category",
        },
      },`
};

// Add a stage to handle posts with missing category/city data in recentFounds
const recentFoundsFix = {
  from: `      recentFounds = await Post.aggregate([
      {
        $match: {
          country: new mongoose.Types.ObjectId(currentCountry),
          foundLost: foundOption._id,
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "Category",
        },
      },`,
  to: `      recentFounds = await Post.aggregate([
      {
        $match: {
          country: new mongoose.Types.ObjectId(currentCountry),
          foundLost: foundOption._id,
        },
      },
      // Handle posts with missing category/city data
      {
        $addFields: {
          category: { $ifNull: ["$category", null] },
          city: { $ifNull: ["$city", null] }
        }
      },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "Category",
        },
      },`
};

// Add a stage to handle posts with missing category/city data in recentLosts
const recentLostsFix = {
  from: `      recentLosts = await Post.aggregate([
      {
        $match: {
          country: new mongoose.Types.ObjectId(currentCountry),
          foundLost: lostOption._id,
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "Category",
        },
      },`,
  to: `      recentLosts = await Post.aggregate([
      {
        $match: {
          country: new mongoose.Types.ObjectId(currentCountry),
          foundLost: lostOption._id,
        },
      },
      // Handle posts with missing category/city data
      {
        $addFields: {
          category: { $ifNull: ["$category", null] },
          city: { $ifNull: ["$city", null] }
        }
      },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "Category",
        },
      },`
};

const fixes = [trendingPostFix, recentFoundsFix, recentLostsFix];

let fixCount = 0;
fixes.forEach((fix, index) => {
  const beforeCount = (content.match(new RegExp(fix.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  content = content.replace(new RegExp(fix.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fix.to);
  
  if (beforeCount > 0) {
    console.log(`✅ Fixed aggregation ${index + 1}: ${beforeCount} instances`);
    fixCount += beforeCount;
  }
});

// Write the fixed content back
fs.writeFileSync(controllerPath, content, 'utf8');

console.log(`\n🎉 Fixed ${fixCount} aggregation pipelines in dashboard controller`);
console.log('📝 Added stages to handle posts with missing category/city data');
console.log('🚀 Please commit and deploy these changes');

// Also create a script to fix the data by assigning valid category/city IDs
console.log('\n📋 Creating data assignment script...');

const dataFixScript = `const mongoose = require('mongoose');

async function assignValidData() {
  try {
    const uri = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    const Post = require('./server/models/Post');
    const Category = require('./server/models/Category');
    const City = require('./server/models/City');

    // Get all categories and cities
    const categories = await Category.find();
    const cities = await City.find();
    
    console.log(\`📋 Found \${categories.length} categories\`);
    console.log(\`🏙️ Found \${cities.length} cities\`);

    if (categories.length === 0) {
      console.log('❌ No categories found in database');
      return;
    }

    // Get all posts
    const posts = await Post.find();
    console.log(\`📝 Found \${posts.length} posts to check\`);

    let fixedCount = 0;

    for (const post of posts) {
      let needsUpdate = false;
      const updateData = {};

      // Check if post has a valid category
      if (!post.category || !categories.some(cat => cat._id.toString() === post.category?.toString())) {
        console.log(\`❌ Post \${post._id}: Invalid or missing category\`);
        // Assign the first available category
        updateData.category = categories[0]._id;
        needsUpdate = true;
        console.log(\`✅ Will assign category: \${categories[0].code}\`);
      }

      // Check if post has a valid city for its country
      if (!post.city || !cities.some(city => city._id.toString() === post.city?.toString())) {
        console.log(\`❌ Post \${post._id}: Invalid or missing city\`);
        // Find a city from the same country
        const countryCities = cities.filter(city => city.country.toString() === post.country.toString());
        if (countryCities.length > 0) {
          updateData.city = countryCities[0]._id;
          needsUpdate = true;
          console.log(\`✅ Will assign city: \${countryCities[0].code}\`);
        }
      }

      // Update the post if needed
      if (needsUpdate) {
        await Post.findByIdAndUpdate(post._id, updateData);
        fixedCount++;
        console.log(\`✅ Fixed post \${post._id}\`);
      }
    }

    console.log(\`\\n🎉 Fixed \${fixedCount} posts with invalid references\`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\\n🔌 Disconnected from MongoDB');
  }
}

// Uncomment the line below to run the fix
// assignValidData();
console.log('💡 To fix data by assigning valid category/city IDs, uncomment the last line in this script and run it');
`;

fs.writeFileSync('assign-valid-data.js', dataFixScript, 'utf8');
console.log('✅ Created assign-valid-data.js script');
console.log('💡 Run "node assign-valid-data.js" to assign valid category/city IDs (after uncommenting the last line)');
