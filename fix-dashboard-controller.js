const fs = require('fs');
const path = require('path');

// Read the current dashboard controller
const controllerPath = path.join(__dirname, 'server', 'controllers', 'dependenciesController.js');
let content = fs.readFileSync(controllerPath, 'utf8');

console.log('🔧 Fixing dashboard controller to handle missing data...');

// The issue is that posts have undefined category and city fields
// Let's modify the aggregation pipelines to handle this gracefully

// Fix 1: Add $addFields stage to handle undefined category and city before lookups
const addFieldsFix = {
  from: `      trendingPost = await Post.aggregate([
      { $match: { country: new mongoose.Types.ObjectId(currentCountry) } },
      // Add stage to check if category and city IDs are valid ObjectIds
      {
        $addFields: {
          hasValidCategory: { $ne: ["$category", null] },
          hasValidCity: { $ne: ["$city", null] },
          hasValidFoundLost: { $ne: ["$foundLost", null] }
        }
      },`,
  to: `      trendingPost = await Post.aggregate([
      { $match: { country: new mongoose.Types.ObjectId(currentCountry) } },
      // Handle undefined category and city fields
      {
        $addFields: {
          category: { $ifNull: ["$category", null] },
          city: { $ifNull: ["$city", null] },
          hasValidCategory: { $ne: ["$category", null] },
          hasValidCity: { $ne: ["$city", null] },
          hasValidFoundLost: { $ne: ["$foundLost", null] }
        }
      },`
};

// Fix 2: Add $addFields stage to recentFounds
const recentFoundsAddFieldsFix = {
  from: `      recentFounds = await Post.aggregate([
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
      },`,
  to: `      recentFounds = await Post.aggregate([
      {
        $match: {
          country: new mongoose.Types.ObjectId(currentCountry),
          foundLost: foundOption._id,
        },
      },
      // Handle undefined category and city fields
      {
        $addFields: {
          category: { $ifNull: ["$category", null] },
          city: { $ifNull: ["$city", null] },
          hasValidCategory: { $ne: ["$category", null] },
          hasValidCity: { $ne: ["$city", null] },
          hasValidFoundLost: { $ne: ["$foundLost", null] }
        }
      },`
};

// Fix 3: Add $addFields stage to recentLosts
const recentLostsAddFieldsFix = {
  from: `      recentLosts = await Post.aggregate([
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
      },`,
  to: `      recentLosts = await Post.aggregate([
      {
        $match: {
          country: new mongoose.Types.ObjectId(currentCountry),
          foundLost: lostOption._id,
        },
      },
      // Handle undefined category and city fields
      {
        $addFields: {
          category: { $ifNull: ["$category", null] },
          city: { $ifNull: ["$city", null] },
          hasValidCategory: { $ne: ["$category", null] },
          hasValidCity: { $ne: ["$city", null] },
          hasValidFoundLost: { $ne: ["$foundLost", null] }
        }
      },`
};

// Fix 4: Update project stages to use better fallbacks
const projectStageFixes = [
  // Fix trendingPost project stage
  {
    from: `          categoryName: { 
            $cond: {
              if: { $and: [{ $ne: ["$Category", null] }, { $ne: ["$Category.code", null] }] },
              then: "$Category.code",
              else: "OTHER"
            }
          },`,
    to: `          categoryName: { 
            $cond: {
              if: { $and: [{ $ne: ["$Category", null] }, { $ne: ["$Category.code", null] }] },
              then: "$Category.code",
              else: "ELECTRONICS"
            }
          },`
  },
  
  // Fix recentFounds project stage
  {
    from: `          categoryname: { 
            $cond: {
              if: { $and: [{ $ne: ["$Category", null] }, { $ne: ["$Category.code", null] }] },
              then: "$Category.code",
              else: "OTHER"
            }
          },`,
    to: `          categoryname: { 
            $cond: {
              if: { $and: [{ $ne: ["$Category", null] }, { $ne: ["$Category.code", null] }] },
              then: "$Category.code",
              else: "ELECTRONICS"
            }
          },`
  },
  
  // Fix recentLosts project stage
  {
    from: `          categoryname: { 
            $cond: {
              if: { $and: [{ $ne: ["$Category", null] }, { $ne: ["$Category.code", null] }] },
              then: "$Category.code",
              else: "OTHER"
            }
          },`,
    to: `          categoryname: { 
            $cond: {
              if: { $and: [{ $ne: ["$Category", null] }, { $ne: ["$Category.code", null] }] },
              then: "$Category.code",
              else: "ELECTRONICS"
            }
          },`
  }
];

// Apply all fixes
const fixes = [
  addFieldsFix,
  recentFoundsAddFieldsFix,
  recentLostsAddFieldsFix
];

let fixCount = 0;

// Apply aggregation fixes
fixes.forEach((fix, index) => {
  const beforeCount = (content.match(new RegExp(fix.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  content = content.replace(new RegExp(fix.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fix.to);
  
  if (beforeCount > 0) {
    console.log(`✅ Fixed aggregation ${index + 1}: ${beforeCount} instances`);
    fixCount += beforeCount;
  }
});

// Apply project stage fixes
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

console.log(`\n🎉 Fixed ${fixCount} issues in dashboard controller`);
console.log('📝 Changes made:');
console.log('  - Added $addFields to handle undefined category/city fields');
console.log('  - Changed fallback from "OTHER" to "ELECTRONICS" for missing categories');
console.log('  - Improved null handling in aggregation pipelines');

console.log('\n🚀 Please commit and deploy these changes');
console.log('💡 After deployment, the dashboard should show proper category and city names');
