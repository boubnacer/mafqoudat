const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'server', 'controllers', 'dependenciesController.js');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Replace all $cond statements with simple $ifNull
content = content.replace(
  /cityName:\s*\{\s*\$cond:\s*\{\s*if:\s*\{\s*\$and:\s*\[\s*\{\s*\$ne:\s*\[\s*"\$City",\s*null\s*\]\s*\},\s*\{\s*\$ne:\s*\[\s*"\$City\.labels",\s*null\s*\]\s*\},\s*\{\s*\$ne:\s*\[\s*"\$City\.labels\.en",\s*null\s*\]\s*\}\s*\]\s*\},\s*then:\s*"\$City\.labels\.en",\s*else:\s*"Casablanca"\s*\}\s*\}/g,
  'cityName: { $ifNull: ["$City.labels.en", "Casablanca"] }'
);

content = content.replace(
  /categoryName:\s*\{\s*\$cond:\s*\{\s*if:\s*\{\s*\$and:\s*\[\s*\{\s*\$ne:\s*\[\s*"\$Category",\s*null\s*\]\s*\},\s*\{\s*\$ne:\s*\[\s*"\$Category\.code",\s*null\s*\]\s*\}\s*\]\s*\},\s*then:\s*"\$Category\.code",\s*else:\s*"ELECTRONICS"\s*\}\s*\}/g,
  'categoryName: { $ifNull: ["$Category.code", "ELECTRONICS"] }'
);

content = content.replace(
  /floptionName:\s*\{\s*\$cond:\s*\{\s*if:\s*\{\s*\$and:\s*\[\s*\{\s*\$ne:\s*\[\s*"\$Floptions",\s*null\s*\]\s*\},\s*\{\s*\$ne:\s*\[\s*"\$Floptions\.code",\s*null\s*\]\s*\}\s*\]\s*\},\s*then:\s*"\$Floptions\.code",\s*else:\s*"FOUND"\s*\}\s*\}/g,
  'floptionName: { $ifNull: ["$Floptions.code", "FOUND"] }'
);

content = content.replace(
  /categoryname:\s*\{\s*\$cond:\s*\{\s*if:\s*\{\s*\$and:\s*\[\s*\{\s*\$ne:\s*\[\s*"\$Category",\s*null\s*\]\s*\},\s*\{\s*\$ne:\s*\[\s*"\$Category\.code",\s*null\s*\]\s*\}\s*\]\s*\},\s*then:\s*"\$Category\.code",\s*else:\s*"ELECTRONICS"\s*\}\s*\}/g,
  'categoryname: { $ifNull: ["$Category.code", "ELECTRONICS"] }'
);

// Write the file back
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Fixed all $cond statements in dependenciesController.js');
console.log('📝 Replaced complex $cond logic with simple $ifNull operators');
console.log('🚀 Please commit and deploy these changes');
