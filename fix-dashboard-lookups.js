const fs = require('fs');
const path = require('path');

// Read the current dashboard controller
const controllerPath = path.join(__dirname, 'server', 'controllers', 'dependenciesController.js');
let content = fs.readFileSync(controllerPath, 'utf8');

console.log('🔧 Fixing dashboard aggregation pipeline...');

// Replace the aggregation pipelines with more robust ID handling
const fixes = [
  // Fix trendingPost aggregation
  {
    from: `    // Add error handling for aggregation
    let trendingPost = [];
    try {
      trendingPost = await Post.aggregate([
      { $match: { country: new mongoose.Types.ObjectId(currentCountry) } },
      // Convert string IDs to ObjectIds for proper lookups
      {
        $addFields: {
          categoryObjectId: { $toObjectId: "$category" },
          foundLostObjectId: { $toObjectId: "$foundLost" },
          countryObjectId: { $toObjectId: "$country" },
          cityObjectId: { $toObjectId: "$city" }
        }
      },`,
    to: `    // Add error handling for aggregation
    let trendingPost = [];
    try {
      trendingPost = await Post.aggregate([
      { $match: { country: new mongoose.Types.ObjectId(currentCountry) } },
      // Convert string IDs to ObjectIds for proper lookups with error handling
      {
        $addFields: {
          categoryObjectId: {
            $cond: {
              if: { $and: [{ $ne: ["$category", null] }, { $ne: ["$category", ""] }] },
              then: { $toObjectId: "$category" },
              else: null
            }
          },
          foundLostObjectId: {
            $cond: {
              if: { $and: [{ $ne: ["$foundLost", null] }, { $ne: ["$foundLost", ""] }] },
              then: { $toObjectId: "$foundLost" },
              else: null
            }
          },
          countryObjectId: {
            $cond: {
              if: { $and: [{ $ne: ["$country", null] }, { $ne: ["$country", ""] }] },
              then: { $toObjectId: "$country" },
              else: null
            }
          },
          cityObjectId: {
            $cond: {
              if: { $and: [{ $ne: ["$city", null] }, { $ne: ["$city", ""] }] },
              then: { $toObjectId: "$city" },
              else: null
            }
          }
        }
      },`
  },
  
  // Fix recentFounds aggregation
  {
    from: `      // Convert string IDs to ObjectIds for proper lookups
      {
        $addFields: {
          categoryObjectId: { $toObjectId: "$category" },
          foundLostObjectId: { $toObjectId: "$foundLost" },
          countryObjectId: { $toObjectId: "$country" },
          cityObjectId: { $toObjectId: "$city" },
          userObjectId: { $toObjectId: "$user" }
        }
      },`,
    to: `      // Convert string IDs to ObjectIds for proper lookups with error handling
      {
        $addFields: {
          categoryObjectId: {
            $cond: {
              if: { $and: [{ $ne: ["$category", null] }, { $ne: ["$category", ""] }] },
              then: { $toObjectId: "$category" },
              else: null
            }
          },
          foundLostObjectId: {
            $cond: {
              if: { $and: [{ $ne: ["$foundLost", null] }, { $ne: ["$foundLost", ""] }] },
              then: { $toObjectId: "$foundLost" },
              else: null
            }
          },
          countryObjectId: {
            $cond: {
              if: { $and: [{ $ne: ["$country", null] }, { $ne: ["$country", ""] }] },
              then: { $toObjectId: "$country" },
              else: null
            }
          },
          cityObjectId: {
            $cond: {
              if: { $and: [{ $ne: ["$city", null] }, { $ne: ["$city", ""] }] },
              then: { $toObjectId: "$city" },
              else: null
            }
          },
          userObjectId: {
            $cond: {
              if: { $and: [{ $ne: ["$user", null] }, { $ne: ["$user", ""] }] },
              then: { $toObjectId: "$user" },
              else: null
            }
          }
        }
      },`
  },
  
  // Fix recentLosts aggregation
  {
    from: `      // Convert string IDs to ObjectIds for proper lookups
      {
        $addFields: {
          categoryObjectId: { $toObjectId: "$category" },
          foundLostObjectId: { $toObjectId: "$foundLost" },
          countryObjectId: { $toObjectId: "$country" },
          cityObjectId: { $toObjectId: "$city" },
          userObjectId: { $toObjectId: "$user" }
        }
      },`,
    to: `      // Convert string IDs to ObjectIds for proper lookups with error handling
      {
        $addFields: {
          categoryObjectId: {
            $cond: {
              if: { $and: [{ $ne: ["$category", null] }, { $ne: ["$category", ""] }] },
              then: { $toObjectId: "$category" },
              else: null
            }
          },
          foundLostObjectId: {
            $cond: {
              if: { $and: [{ $ne: ["$foundLost", null] }, { $ne: ["$foundLost", ""] }] },
              then: { $toObjectId: "$foundLost" },
              else: null
            }
          },
          countryObjectId: {
            $cond: {
              if: { $and: [{ $ne: ["$country", null] }, { $ne: ["$country", ""] }] },
              then: { $toObjectId: "$country" },
              else: null
            }
          },
          cityObjectId: {
            $cond: {
              if: { $and: [{ $ne: ["$city", null] }, { $ne: ["$city", ""] }] },
              then: { $toObjectId: "$city" },
              else: null
            }
          },
          userObjectId: {
            $cond: {
              if: { $and: [{ $ne: ["$user", null] }, { $ne: ["$user", ""] }] },
              then: { $toObjectId: "$user" },
              else: null
            }
          }
        }
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
console.log('📝 The dashboard should now properly handle ID conversions');
console.log('🚀 Please commit and deploy these changes');
