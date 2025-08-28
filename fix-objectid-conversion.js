const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'server', 'controllers', 'dependenciesController.js');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Replace the ObjectId conversion with conditional conversion
content = content.replace(
  /\/\/ Convert string IDs to ObjectIds for lookups\n      \{\n        \$addFields: \{\n          categoryObjectId: \{ \$toObjectId: "\$category" \},\n          cityObjectId: \{ \$toObjectId: "\$city" \},\n          foundLostObjectId: \{ \$toObjectId: "\$foundLost" \},\n          countryObjectId: \{ \$toObjectId: "\$country" \}\n        \}\n      \},/g,
  `// Convert string IDs to ObjectIds for lookups (with error handling)
      {
        $addFields: {
          categoryObjectId: {
            $cond: {
              if: { $and: [{ $ne: ["$category", null] }, { $ne: ["$category", ""] }] },
              then: { $toObjectId: "$category" },
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
          }
        }
      },`
);

// Write the file back
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Fixed ObjectId conversion with proper error handling');
console.log('📝 Added conditional conversion to prevent errors on null/empty values');
console.log('🚀 Please commit and deploy these changes');
