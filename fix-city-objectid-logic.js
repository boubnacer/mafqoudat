const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'server', 'controllers', 'dependenciesController.js');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Fix cityObjectId logic to convert ObjectIds for lookup (not exclude them)
const oldPattern = /cityObjectId: \{\s+\$cond: \{\s+if: \{ \s+\$and: \[\s+\{ \$ne: \["\$city", null\] \}, \s+\{ \$ne: \["\$city", ""\] \}, \s+\{ \$not: \{ \$regexMatch: \{ input: \{ \$toString: "\$city" \}, regex: "\^\[0-9a-fA-F\]\{24\}\$" \} \} \}\s+\] \s+\}, \s+then: \{ \$toObjectId: "\$city" \}, \s+else: null \s+\} \s+\},/g;

const newPattern = `cityObjectId: {
            $cond: {
              if: { 
                    $and: [
                      { $ne: ["$city", null] }, 
                      { $ne: ["$city", ""] },
                      { $regexMatch: { input: { $toString: "$city" }, regex: "^[0-9a-fA-F]{24}$" } }
                    ] 
                  },
              then: { $toObjectId: "$city" },
              else: null
            }
          },`;

// Replace all occurrences
content = content.replace(oldPattern, newPattern);

// Write the file back
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Fixed cityObjectId logic in dependenciesController.js');
console.log('📝 Updated to convert ObjectIds for lookup instead of excluding them');
console.log('🚀 Please commit and deploy these changes');
