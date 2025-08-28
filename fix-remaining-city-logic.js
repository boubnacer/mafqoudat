const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'server', 'controllers', 'dependenciesController.js');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Replace the complex nested $cond logic with simple fallback
const oldPattern = /else: \{\s+\$cond: \{\s+if: \{ \s+\$and: \[\s+\{ \$ne: \["\$city", null\] \}, \s+\{ \$ne: \["\$city", ""\] \}, \s+\{ \$not: \{ \$regexMatch: \{ input: \{ \$toString: "\$city" \}, regex: "\^\[0-9a-fA-F\]\{24\}\$" \} \} \}\s+\] \s+\}, \s+then: "\$city", \s+else: "Casablanca" \s+\} \s+\}/g;

const newPattern = 'else: "Casablanca"';

// Replace all occurrences
content = content.replace(oldPattern, newPattern);

// Write the file back
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Fixed remaining cityName logic in dependenciesController.js');
console.log('📝 Simplified all nested $cond logic to use "Casablanca" fallback');
console.log('🚀 Please commit and deploy these changes');
