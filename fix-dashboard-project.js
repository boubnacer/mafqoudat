const fs = require('fs');
const path = require('path');

// Read the current dashboard controller
const controllerPath = path.join(__dirname, 'server', 'controllers', 'dependenciesController.js');
let content = fs.readFileSync(controllerPath, 'utf8');

console.log('🔧 Fixing dashboard project stages...');

// Fix all project stage operations to handle null values properly
const fixes = [
  // Fix cityName and cityLabels
  {
    from: 'cityName: "$City.labels.en",',
    to: 'cityName: { $ifNull: ["$City.labels.en", "Unknown"] },'
  },
  {
    from: 'cityLabels: "$City.labels",',
    to: 'cityLabels: { $ifNull: ["$City.labels", {}] },'
  },
  // Fix countryLabels and countryname
  {
    from: 'countryLabels: "$Country.labels",',
    to: 'countryLabels: { $ifNull: ["$Country.labels", {}] },'
  },
  {
    from: 'countryname: "$Country.code",',
    to: 'countryname: { $ifNull: ["$Country.code", "Unknown"] },'
  }
];

let fixCount = 0;
fixes.forEach(fix => {
  const beforeCount = (content.match(new RegExp(fix.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  content = content.replace(new RegExp(fix.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fix.to);
  
  if (beforeCount > 0) {
    console.log(`✅ Fixed ${beforeCount} instances of: ${fix.from}`);
    fixCount += beforeCount;
  }
});

// Write the fixed content back
fs.writeFileSync(controllerPath, content, 'utf8');

console.log(`\n🎉 Fixed ${fixCount} project stage operations in dashboard controller`);
console.log('📝 The dashboard should now handle null/undefined values properly in project stages');
console.log('🚀 Please commit and deploy these changes');
