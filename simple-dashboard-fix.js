const fs = require('fs');
const path = require('path');

// Read the current dashboard controller
const controllerPath = path.join(__dirname, 'server', 'controllers', 'dependenciesController.js');
let content = fs.readFileSync(controllerPath, 'utf8');

console.log('🔧 Applying simple fix to dashboard aggregation pipeline...');

// The issue is that the category and city IDs in posts don't match any documents in the database
// Let's add better error handling in the project stage to handle missing data gracefully

// Find and replace the project stages to handle missing data better
const projectStageFixes = [
  // Fix trendingPost project stage
  {
    from: `          categoryName: { 
            $cond: {
              if: { $and: [{ $ne: ["$Category", null] }, { $ne: ["$Category.code", null] }] },
              then: "$Category.code",
              else: "Unknown"
            }
          },`,
    to: `          categoryName: { 
            $cond: {
              if: { $and: [{ $ne: ["$Category", null] }, { $ne: ["$Category.code", null] }] },
              then: "$Category.code",
              else: "OTHER"
            }
          },`
  },
  
  // Fix recentFounds project stage
  {
    from: `          categoryname: { 
            $cond: {
              if: { $and: [{ $ne: ["$Category", null] }, { $ne: ["$Category.code", null] }] },
              then: "$Category.code",
              else: "Unknown"
            }
          },`,
    to: `          categoryname: { 
            $cond: {
              if: { $and: [{ $ne: ["$Category", null] }, { $ne: ["$Category.code", null] }] },
              then: "$Category.code",
              else: "OTHER"
            }
          },`
  },
  
  // Fix recentLosts project stage
  {
    from: `          categoryname: { 
            $cond: {
              if: { $and: [{ $ne: ["$Category", null] }, { $ne: ["$Category.code", null] }] },
              then: "$Category.code",
              else: "Unknown"
            }
          },`,
    to: `          categoryname: { 
            $cond: {
              if: { $and: [{ $ne: ["$Category", null] }, { $ne: ["$Category.code", null] }] },
              then: "$Category.code",
              else: "OTHER"
            }
          },`
  }
];

let fixCount = 0;
projectStageFixes.forEach((fix, index) => {
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
console.log('📝 Changed "Unknown" to "OTHER" for missing categories');
console.log('🚀 Please commit and deploy these changes');

// Also create a simple data fix script
console.log('\n📋 Creating simple data fix script...');

const simpleFixScript = `const mongoose = require('mongoose');

async function simpleDataFix() {
  try {
    const uri = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    const Post = require('./server/models/Post');
    const Category = require('./server/models/Category');

    // Get the "OTHER" category
    const otherCategory = await Category.findOne({ code: 'OTHER' });
    if (!otherCategory) {
      console.log('❌ OTHER category not found, creating it...');
      const newOtherCategory = await Category.create({
        code: 'OTHER',
        labels: {
          en: 'Other',
          fr: 'Autre',
          ar: 'أخرى'
        },
        color: '#9E9E9E',
        isActive: true,
        description: 'Other items'
      });
      console.log('✅ Created OTHER category:', newOtherCategory._id);
    }

    // Get all posts that have invalid category references
    const posts = await Post.find();
    console.log(\`📝 Found \${posts.length} posts to check\`);

    let fixedCount = 0;

    for (const post of posts) {
      if (!post.category) {
        console.log(\`❌ Post \${post._id}: No category assigned\`);
        // Assign the OTHER category
        await Post.findByIdAndUpdate(post._id, { category: otherCategory._id });
        fixedCount++;
        console.log(\`✅ Fixed post \${post._id}: Assigned OTHER category\`);
      }
    }

    console.log(\`\\n🎉 Fixed \${fixedCount} posts with missing categories\`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\\n🔌 Disconnected from MongoDB');
  }
}

// Uncomment the line below to run the fix
// simpleDataFix();
console.log('💡 To fix missing categories, uncomment the last line in this script and run it');
`;

fs.writeFileSync('simple-data-fix.js', simpleFixScript, 'utf8');
console.log('✅ Created simple-data-fix.js script');
console.log('💡 Run "node simple-data-fix.js" to fix missing categories (after uncommenting the last line)');
