const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'server', 'controllers', 'dependenciesController.js');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Add ObjectId conversion stages to all three aggregations
content = content.replace(
  /\/\/ Handle undefined category and city fields\n      \{\n        \$addFields: \{\n          category: \{ \$ifNull: \["\$category", null\] \},\n          city: \{ \$ifNull: \["\$city", null\] \},\n          hasValidCategory: \{ \$ne: \["\$category", null\] \},\n          hasValidCity: \{ \$ne: \["\$city", null\] \},\n          hasValidFoundLost: \{ \$ne: \["\$foundLost", null\] \}\n        \}\n      \},/g,
  `// Handle undefined category and city fields and convert to ObjectIds
      {
        $addFields: {
          category: { $ifNull: ["$category", null] },
          city: { $ifNull: ["$city", null] },
          hasValidCategory: { $ne: ["$category", null] },
          hasValidCity: { $ne: ["$city", null] },
          hasValidFoundLost: { $ne: ["$foundLost", null] }
        }
      },
      // Convert string IDs to ObjectIds for lookups
      {
        $addFields: {
          categoryObjectId: { $toObjectId: "$category" },
          cityObjectId: { $toObjectId: "$city" },
          foundLostObjectId: { $toObjectId: "$foundLost" },
          countryObjectId: { $toObjectId: "$country" }
        }
      },`
);

// Update all lookup stages to use ObjectId fields
content = content.replace(
  /localField: "category"/g,
  'localField: "categoryObjectId"'
);

content = content.replace(
  /localField: "city"/g,
  'localField: "cityObjectId"'
);

content = content.replace(
  /localField: "foundLost"/g,
  'localField: "foundLostObjectId"'
);

content = content.replace(
  /localField: "country"/g,
  'localField: "countryObjectId"'
);

// Write the file back
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Fixed all lookup stages in dependenciesController.js');
console.log('📝 Added ObjectId conversion and updated lookup fields');
console.log('🚀 Please commit and deploy these changes');
