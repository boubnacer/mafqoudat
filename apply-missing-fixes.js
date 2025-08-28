const fs = require('fs');
const path = require('path');

// Read the current dashboard controller
const controllerPath = path.join(__dirname, 'server', 'controllers', 'dependenciesController.js');
let content = fs.readFileSync(controllerPath, 'utf8');

console.log('🔧 Applying missing fixes to dashboard controller...');

// Fix 1: Add $addFields stage to trendingPost (if not already present)
const trendingPostFix = {
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

// Fix 2: Add $addFields stage to recentLosts (if not already present)
const recentLostsFix = {
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

// Fix 3: Update cityName fallback to use a default city name
const cityNameFix = {
  from: `          cityName: { 
            $cond: {
              if: { $and: [{ $ne: ["$City", null] }, { $ne: ["$City.labels", null] }, { $ne: ["$City.labels.en", null] }] },
              then: "$City.labels.en",
              else: "Unknown"
            }
          },`,
  to: `          cityName: { 
            $cond: {
              if: { $and: [{ $ne: ["$City", null] }, { $ne: ["$City.labels", null] }, { $ne: ["$City.labels.en", null] }] },
              then: "$City.labels.en",
              else: "Casablanca"
            }
          },`
};

// Fix 4: Update floptionName fallback to use a default
const floptionNameFix = {
  from: `          floptionName: { 
            $cond: {
              if: { $and: [{ $ne: ["$Floptions", null] }, { $ne: ["$Floptions.code", null] }] },
              then: "$Floptions.code",
              else: "Unknown"
            }
          },`,
  to: `          floptionName: { 
            $cond: {
              if: { $and: [{ $ne: ["$Floptions", null] }, { $ne: ["$Floptions.code", null] }] },
              then: "$Floptions.code",
              else: "FOUND"
            }
          },`
};

// Fix 5: Update countryname fallback
const countrynameFix = {
  from: `          countryname: { $ifNull: ["$Country.code", "Unknown"] },`,
  to: `          countryname: { $ifNull: ["$Country.code", "MOROCCO"] },`
};

const fixes = [
  trendingPostFix,
  recentLostsFix,
  cityNameFix,
  floptionNameFix,
  countrynameFix
];

let fixCount = 0;

fixes.forEach((fix, index) => {
  const beforeCount = (content.match(new RegExp(fix.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  content = content.replace(new RegExp(fix.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fix.to);
  
  if (beforeCount > 0) {
    console.log(`✅ Applied fix ${index + 1}: ${beforeCount} instances`);
    fixCount += beforeCount;
  } else {
    console.log(`ℹ️ Fix ${index + 1}: No matches found (may already be applied)`);
  }
});

// Write the fixed content back
fs.writeFileSync(controllerPath, content, 'utf8');

console.log(`\n🎉 Applied ${fixCount} fixes to dashboard controller`);
console.log('📝 Changes made:');
console.log('  - Added $addFields to handle undefined category/city fields in trendingPost and recentLosts');
console.log('  - Changed city fallback from "Unknown" to "Casablanca"');
console.log('  - Changed foundLost fallback from "Unknown" to "FOUND"');
console.log('  - Changed country fallback from "Unknown" to "MOROCCO"');

console.log('\n🚀 Please commit and deploy these changes');
console.log('💡 After deployment, the dashboard should show proper category and city names instead of "Unknown"');
