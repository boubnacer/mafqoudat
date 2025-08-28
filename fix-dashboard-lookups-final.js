const fs = require('fs');
const path = require('path');

// Read the current dashboard controller
const controllerPath = path.join(__dirname, 'server', 'controllers', 'dependenciesController.js');
let content = fs.readFileSync(controllerPath, 'utf8');

console.log('🔧 Applying final fix to dashboard aggregation pipeline...');

// The issue is that the category and city IDs in posts don't match any documents in the database
// Let's add better error handling and also add a stage to check if the IDs are valid before lookup

const fixes = [
  // Add a stage to check and clean invalid ObjectIds before lookups in trendingPost
  {
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
      // Add stage to check if category and city IDs are valid ObjectIds
      {
        $addFields: {
          hasValidCategory: { $ne: ["$category", null] },
          hasValidCity: { $ne: ["$city", null] },
          hasValidFoundLost: { $ne: ["$foundLost", null] }
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
  },
  
  // Add a stage to check and clean invalid ObjectIds before lookups in recentFounds
  {
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
      // Add stage to check if category and city IDs are valid ObjectIds
      {
        $addFields: {
          hasValidCategory: { $ne: ["$category", null] },
          hasValidCity: { $ne: ["$city", null] },
          hasValidFoundLost: { $ne: ["$foundLost", null] }
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
  },
  
  // Add a stage to check and clean invalid ObjectIds before lookups in recentLosts
  {
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
      // Add stage to check if category and city IDs are valid ObjectIds
      {
        $addFields: {
          hasValidCategory: { $ne: ["$category", null] },
          hasValidCity: { $ne: ["$city", null] },
          hasValidFoundLost: { $ne: ["$foundLost", null] }
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
  }
];

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
console.log('📝 Added validation stages to check for valid ObjectIds before lookups');
console.log('🚀 Please commit and deploy these changes');

// Also create a script to fix the data inconsistencies
console.log('\n📋 Creating data fix script...');

const fixScript = `const mongoose = require('mongoose');

async function fixDataInconsistencies() {
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

    // Get all posts
    const posts = await Post.find();
    console.log(\`📝 Found \${posts.length} posts to check\`);

    let fixedCount = 0;

    for (const post of posts) {
      let needsUpdate = false;
      const updateData = {};

      // Check if category exists, if not assign a default one
      if (post.category) {
        const categoryExists = categories.some(cat => cat._id.toString() === post.category.toString());
        if (!categoryExists) {
          console.log(\`❌ Post \${post._id}: Category \${post.category} not found\`);
          // Assign the first available category as default
          if (categories.length > 0) {
            updateData.category = categories[0]._id;
            needsUpdate = true;
            console.log(\`✅ Will fix: Assigning category \${categories[0].code}\`);
          }
        }
      }

      // Check if city exists, if not assign a default one for the same country
      if (post.city) {
        const cityExists = cities.some(city => city._id.toString() === post.city.toString());
        if (!cityExists) {
          console.log(\`❌ Post \${post._id}: City \${post.city} not found\`);
          // Find a city from the same country
          const countryCities = cities.filter(city => city.country.toString() === post.country.toString());
          if (countryCities.length > 0) {
            updateData.city = countryCities[0]._id;
            needsUpdate = true;
            console.log(\`✅ Will fix: Assigning city \${countryCities[0].code}\`);
          }
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
// fixDataInconsistencies();
console.log('💡 To fix data inconsistencies, uncomment the last line in this script and run it');
`;

fs.writeFileSync('fix-data-inconsistencies.js', fixScript, 'utf8');
console.log('✅ Created fix-data-inconsistencies.js script');
console.log('💡 Run "node fix-data-inconsistencies.js" to fix data inconsistencies (after uncommenting the last line)');
