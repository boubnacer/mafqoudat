const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'server', 'controllers', 'dependenciesController.js');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Replace all cityName fields to handle custom cities from region field
content = content.replace(
  /cityName: \{ \$ifNull: \["\$City\.labels\.en", "Casablanca"\] \},/g,
  `cityName: {
            $cond: {
              if: { $and: [{ $ne: ["$City", null] }, { $ne: ["$City.labels", null] }, { $ne: ["$City.labels.en", null] }] },
              then: "$City.labels.en",
              else: {
                $cond: {
                  if: { $ne: ["$region", null] },
                  then: "$region",
                  else: "Casablanca"
                }
              }
            }
          },`
);

// Write the file back
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Fixed cityName display logic in dependenciesController.js');
console.log('📝 Now custom cities from region field will be displayed instead of "Casablanca"');
console.log('🚀 Please commit and deploy these changes');
