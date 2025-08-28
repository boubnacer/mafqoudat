const fs = require('fs');
const path = require('path');

// Read the current dashboard controller
const controllerPath = path.join(__dirname, 'server', 'controllers', 'dependenciesController.js');
let content = fs.readFileSync(controllerPath, 'utf8');

console.log('🔧 Fixing dashboard controller fallback logic...');

// The issue is that the $cond logic isn't working properly
// Let's simplify the fallback logic to use $ifNull instead

// Fix 1: Update trendingPost project stage
const trendingPostProjectFix = {
  from: `          categoryName: { 
            $cond: {
              if: { $and: [{ $ne: ["$Category", null] }, { $ne: ["$Category.code", null] }] },
              then: "$Category.code",
              else: "ELECTRONICS"
            }
          },`,
  to: `          categoryName: { 
            $ifNull: ["$Category.code", "ELECTRONICS"]
          },`
};

// Fix 2: Update recentFounds project stage
const recentFoundsProjectFix = {
  from: `          categoryname: { 
            $cond: {
              if: { $and: [{ $ne: ["$Category", null] }, { $ne: ["$Category.code", null] }] },
              then: "$Category.code",
              else: "ELECTRONICS"
            }
          },`,
  to: `          categoryname: { 
            $ifNull: ["$Category.code", "ELECTRONICS"]
          },`
};

// Fix 3: Update recentLosts project stage
const recentLostsProjectFix = {
  from: `          categoryname: { 
            $cond: {
              if: { $and: [{ $ne: ["$Category", null] }, { $ne: ["$Category.code", null] }] },
              then: "$Category.code",
              else: "ELECTRONICS"
            }
          },`,
  to: `          categoryname: { 
            $ifNull: ["$Category.code", "ELECTRONICS"]
          },`
};

// Fix 4: Update cityName fallback
const cityNameFix = {
  from: `          cityName: { 
            $cond: {
              if: { $and: [{ $ne: ["$City", null] }, { $ne: ["$City.labels", null] }, { $ne: ["$City.labels.en", null] }] },
              then: "$City.labels.en",
              else: "Casablanca"
            }
          },`,
  to: `          cityName: { 
            $ifNull: ["$City.labels.en", "Casablanca"]
          },`
};

// Fix 5: Update floptionName fallback
const floptionNameFix = {
  from: `          floptionName: { 
            $cond: {
              if: { $and: [{ $ne: ["$Floptions", null] }, { $ne: ["$Floptions.code", null] }] },
              then: "$Floptions.code",
              else: "FOUND"
            }
          },`,
  to: `          floptionName: { 
            $ifNull: ["$Floptions.code", "FOUND"]
          },`
};

const fixes = [
  trendingPostProjectFix,
  recentFoundsProjectFix,
  recentLostsProjectFix,
  cityNameFix,
  floptionNameFix
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
console.log('  - Simplified $cond logic to use $ifNull for better reliability');
console.log('  - This should ensure fallback values are always displayed');

console.log('\n🚀 Please commit and deploy these changes');
console.log('💡 After deployment, categories should show "ELECTRONICS" instead of undefined');
