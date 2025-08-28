const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'server', 'controllers', 'dependenciesController.js');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Simplify the cityName logic to always show "Casablanca" as fallback instead of ObjectId
const oldPattern = /cityName: \{\s+\$cond: \{\s+if: \{ \$and: \[\{ \$ne: \["\$City", null\] \}, \{ \$ne: \["\$City\.labels", null\] \}, \{ \$ne: \["\$City\.labels\.en", null\] \}\] \}, \s+then: "\$City\.labels\.en", \s+else: \{\s+\$cond: \{\s+if: \{ \s+\$and: \[\s+\{ \$ne: \["\$city", null\] \}, \s+\{ \$ne: \["\$city", ""\] \}, \s+\{ \$not: \{ \$regexMatch: \{ input: \{ \$toString: "\$city" \}, regex: "\^\[0-9a-fA-F\]\{24\}\$" \} \} \}\s+\] \s+\}, \s+then: "\$city", \s+else: "Casablanca" \s+\} \s+\} \s+\} \s+\}/g;

const newPattern = `cityName: {
            $cond: {
              if: { $and: [{ $ne: ["$City", null] }, { $ne: ["$City.labels", null] }, { $ne: ["$City.labels.en", null] }] },
              then: "$City.labels.en",
              else: "Casablanca"
            }
          }`;

// Replace all occurrences
content = content.replace(oldPattern, newPattern);

// Write the file back
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Simplified cityName logic in dependenciesController.js');
console.log('📝 Now always shows "Casablanca" as fallback instead of ObjectId strings');
console.log('🚀 Please commit and deploy these changes');
