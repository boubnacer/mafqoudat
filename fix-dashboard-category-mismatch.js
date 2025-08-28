const fs = require('fs');
const path = require('path');

// Read the current dashboard controller
const controllerPath = path.join(__dirname, 'server', 'controllers', 'dependenciesController.js');
let content = fs.readFileSync(controllerPath, 'utf8');

console.log('🔧 Fixing dashboard aggregation pipeline for category/city mismatches...');

// The issue is that the aggregation pipeline is not finding the referenced documents
// because the category and city IDs in posts don't match the actual documents in the database
// Let's add better error handling and fallback logic

const fixes = [
  // Fix the project stage in trendingPost to handle missing data better
  {
    from: `        $project: {
          region: 1,
          exactLocation: 1,
          city: 1,
          cityName: { $ifNull: ["$City.labels.en", "Unknown"] },
          cityLabels: { $ifNull: ["$City.labels", {}] },
          user: 1,
          country: 1,
          returned: 1,
          createdAt: 1,
          categoryName: { $ifNull: ["$Category.code", "Unknown"] },
          floptionName: { $ifNull: ["$Floptions.code", "Unknown"] },
          contact: 1,
          image: 1,
          countryLabels: { $ifNull: ["$Country.labels", {}] },
          countryname: { $ifNull: ["$Country.code", "Unknown"] },
          // Add missing fields for debugging
          category: 1,
          foundLost: 1,
        },`,
    to: `        $project: {
          region: 1,
          exactLocation: 1,
          city: 1,
          cityName: { 
            $cond: {
              if: { $and: [{ $ne: ["$City", null] }, { $ne: ["$City.labels", null] }, { $ne: ["$City.labels.en", null] }] },
              then: "$City.labels.en",
              else: "Unknown"
            }
          },
          cityLabels: { $ifNull: ["$City.labels", {}] },
          user: 1,
          country: 1,
          returned: 1,
          createdAt: 1,
          categoryName: { 
            $cond: {
              if: { $and: [{ $ne: ["$Category", null] }, { $ne: ["$Category.code", null] }] },
              then: "$Category.code",
              else: "Unknown"
            }
          },
          floptionName: { 
            $cond: {
              if: { $and: [{ $ne: ["$Floptions", null] }, { $ne: ["$Floptions.code", null] }] },
              then: "$Floptions.code",
              else: "Unknown"
            }
          },
          contact: 1,
          image: 1,
          countryLabels: { $ifNull: ["$Country.labels", {}] },
          countryname: { $ifNull: ["$Country.code", "Unknown"] },
          // Add missing fields for debugging
          category: 1,
          foundLost: 1,
        },`
  },
  
  // Fix the project stage in recentFounds to handle missing data better
  {
    from: `        $project: {
          user: 1,
          country: 1,
          region: 1,
          exactLocation: 1,
          city: 1,
          cityName: { $ifNull: ["$City.labels.en", "Unknown"] },
          cityLabels: { $ifNull: ["$City.labels", {}] },
          returned: 1,
          createdAt: 1,
          updatedAt: 1,
          username: { $ifNull: ["$User.username", "Unknown"] },
          categoryname: { $ifNull: ["$Category.code", "Unknown"] },
          contact: 1,
          image: 1,
          countryLabels: { $ifNull: ["$Country.labels", {}] },
          countryname: { $ifNull: ["$Country.code", "Unknown"] },
          // Add missing fields for debugging
          category: 1,
          foundLost: 1,
        },`,
    to: `        $project: {
          user: 1,
          country: 1,
          region: 1,
          exactLocation: 1,
          city: 1,
          cityName: { 
            $cond: {
              if: { $and: [{ $ne: ["$City", null] }, { $ne: ["$City.labels", null] }, { $ne: ["$City.labels.en", null] }] },
              then: "$City.labels.en",
              else: "Unknown"
            }
          },
          cityLabels: { $ifNull: ["$City.labels", {}] },
          returned: 1,
          createdAt: 1,
          updatedAt: 1,
          username: { $ifNull: ["$User.username", "Unknown"] },
          categoryname: { 
            $cond: {
              if: { $and: [{ $ne: ["$Category", null] }, { $ne: ["$Category.code", null] }] },
              then: "$Category.code",
              else: "Unknown"
            }
          },
          contact: 1,
          image: 1,
          countryLabels: { $ifNull: ["$Country.labels", {}] },
          countryname: { $ifNull: ["$Country.code", "Unknown"] },
          // Add missing fields for debugging
          category: 1,
          foundLost: 1,
        },`
  },
  
  // Fix the project stage in recentLosts to handle missing data better
  {
    from: `        $project: {
          user: 1,
          country: 1,
          region: 1,
          exactLocation: 1,
          city: 1,
          cityName: { $ifNull: ["$City.labels.en", "Unknown"] },
          cityLabels: { $ifNull: ["$City.labels", {}] },
          returned: 1,
          createdAt: 1,
          updatedAt: 1,
          username: { $ifNull: ["$User.username", "Unknown"] },
          categoryname: { $ifNull: ["$Category.code", "Unknown"] },
          contact: 1,
          image: 1,
          countryLabels: { $ifNull: ["$Country.labels", {}] },
          countryname: { $ifNull: ["$Country.code", "Unknown"] },
        },`,
    to: `        $project: {
          user: 1,
          country: 1,
          region: 1,
          exactLocation: 1,
          city: 1,
          cityName: { 
            $cond: {
              if: { $and: [{ $ne: ["$City", null] }, { $ne: ["$City.labels", null] }, { $ne: ["$City.labels.en", null] }] },
              then: "$City.labels.en",
              else: "Unknown"
            }
          },
          cityLabels: { $ifNull: ["$City.labels", {}] },
          returned: 1,
          createdAt: 1,
          updatedAt: 1,
          username: { $ifNull: ["$User.username", "Unknown"] },
          categoryname: { 
            $cond: {
              if: { $and: [{ $ne: ["$Category", null] }, { $ne: ["$Category.code", null] }] },
              then: "$Category.code",
              else: "Unknown"
            }
          },
          contact: 1,
          image: 1,
          countryLabels: { $ifNull: ["$Country.labels", {}] },
          countryname: { $ifNull: ["$Country.code", "Unknown"] },
          // Add missing fields for debugging
          category: 1,
          foundLost: 1,
        },`
  }
];

let fixCount = 0;
fixes.forEach((fix, index) => {
  const beforeCount = (content.match(new RegExp(fix.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  content = content.replace(new RegExp(fix.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fix.to);
  
  if (beforeCount > 0) {
    console.log(`✅ Fixed project stage ${index + 1}: ${beforeCount} instances`);
    fixCount += beforeCount;
  }
});

// Write the fixed content back
fs.writeFileSync(controllerPath, content, 'utf8');

console.log(`\n🎉 Fixed ${fixCount} project stages in dashboard controller`);
console.log('📝 The dashboard should now handle missing category/city data better');
console.log('🚀 Please commit and deploy these changes');

// Also create a script to check for data inconsistencies
console.log('\n📋 Creating data consistency check script...');

const checkScript = `const mongoose = require('mongoose');

async function checkDataConsistency() {
  try {
    const uri = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    const Post = require('./server/models/Post');
    const Category = require('./server/models/Category');
    const City = require('./server/models/City');

    // Get all posts
    const posts = await Post.find().limit(10);
    console.log(\`\\n📝 Found \${posts.length} posts to check\`);

    // Get all categories
    const categories = await Category.find();
    console.log(\`📋 Found \${categories.length} categories\`);

    // Get all cities
    const cities = await City.find();
    console.log(\`🏙️ Found \${cities.length} cities\`);

    // Check each post
    posts.forEach((post, index) => {
      console.log(\`\\n🔍 Post \${index + 1}:\`);
      console.log(\`- ID: \${post._id}\`);
      console.log(\`- Category ID: \${post.category}\`);
      console.log(\`- City ID: \${post.city}\`);
      
      // Check if category exists
      const categoryExists = categories.some(cat => cat._id.toString() === post.category?.toString());
      console.log(\`- Category exists: \${categoryExists ? '✅' : '❌'}\`);
      
      // Check if city exists
      const cityExists = cities.some(city => city._id.toString() === post.city?.toString());
      console.log(\`- City exists: \${cityExists ? '✅' : '❌'}\`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\\n🔌 Disconnected from MongoDB');
  }
}

checkDataConsistency();
`;

fs.writeFileSync('check-data-consistency.js', checkScript, 'utf8');
console.log('✅ Created check-data-consistency.js script');
console.log('💡 Run "node check-data-consistency.js" to check for data inconsistencies');
