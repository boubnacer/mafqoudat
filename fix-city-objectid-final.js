const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'server', 'controllers', 'dependenciesController.js');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Fix cityObjectId logic to convert ObjectIds (not exclude them)
const oldPattern = /\{ \$not: \{ \$regexMatch: \{ input: \{ \$toString: "\$city" \}, regex: "\^\[0-9a-fA-F\]\{24\}\$" \} \} \}/g;
const newPattern = '{ $regexMatch: { input: { $toString: "$city" }, regex: "^[0-9a-fA-F]{24}$" } }';

// Replace all occurrences
content = content.replace(oldPattern, newPattern);

// Write the file back
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Fixed cityObjectId logic in dependenciesController.js');
console.log('📝 Now properly converts ObjectIds for lookup instead of excluding them');
console.log('🚀 Please commit and deploy these changes');
