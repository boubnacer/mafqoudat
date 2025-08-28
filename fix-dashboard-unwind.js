const fs = require('fs');
const path = require('path');

// Read the current dashboard controller
const controllerPath = path.join(__dirname, 'server', 'controllers', 'dependenciesController.js');
let content = fs.readFileSync(controllerPath, 'utf8');

console.log('🔧 Fixing dashboard unwind operations...');

// Fix all unwind operations to handle null values properly
const fixes = [
  // Fix Category unwind operations
  {
    from: '{ $unwind: "$Category" },',
    to: '{ $unwind: { path: "$Category", preserveNullAndEmptyArrays: true } },'
  },
  // Fix Country unwind operations  
  {
    from: '{ $unwind: "$Country" },',
    to: '{ $unwind: { path: "$Country", preserveNullAndEmptyArrays: true } },'
  },
  // Fix Floptions unwind operations (already fixed, but ensure consistency)
  {
    from: '{ $unwind: "$Floptions" },',
    to: '{ $unwind: { path: "$Floptions", preserveNullAndEmptyArrays: true } },'
  }
];

let fixCount = 0;
fixes.forEach(fix => {
  const beforeCount = (content.match(new RegExp(fix.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  content = content.replace(new RegExp(fix.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fix.to);
  const afterCount = (content.match(new RegExp(fix.to.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  
  if (beforeCount > 0) {
    console.log(`✅ Fixed ${beforeCount} instances of: ${fix.from}`);
    fixCount += beforeCount;
  }
});

// Write the fixed content back
fs.writeFileSync(controllerPath, content, 'utf8');

console.log(`\n🎉 Fixed ${fixCount} unwind operations in dashboard controller`);
console.log('📝 The dashboard should now handle null/undefined values properly');
console.log('🚀 Please commit and deploy these changes');
