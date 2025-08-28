const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'server', 'controllers', 'dependenciesController.js');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Fix the MongoDB syntax error - replace $type with a simpler condition
content = content.replace(
  /if: \{ \$and: \[\{ \$ne: \["\$city", null\] \}, \{ \$type: "\$city", "string" \}\] \}/g,
  'if: { $and: [{ $ne: ["$city", null] }, { $ne: ["$city", ""] }] }'
);

// Write the file back
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Fixed MongoDB syntax error in dependenciesController.js');
console.log('📝 Replaced $type operator with simpler null/empty check');
console.log('🚀 Please commit and deploy these changes');
