const fs = require('fs');
const path = require('path');

console.log('🔍 Debugging Build Issues...\n');

// Check if build directory exists
const buildPath = path.join(__dirname, 'build');
if (!fs.existsSync(buildPath)) {
  console.log('❌ Build directory does not exist. Run "npm run build" first.');
  process.exit(1);
}

console.log('✅ Build directory exists');

// Check main JavaScript file
const jsPath = path.join(buildPath, 'static', 'js');
if (fs.existsSync(jsPath)) {
  const jsFiles = fs.readdirSync(jsPath).filter(file => file.endsWith('.js'));
  console.log(`✅ Found ${jsFiles.length} JavaScript files:`);
  jsFiles.forEach(file => {
    const filePath = path.join(jsPath, file);
    const stats = fs.statSync(filePath);
    console.log(`   - ${file} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
    
    // Check if file starts with valid JavaScript
    const content = fs.readFileSync(filePath, 'utf8').substring(0, 100);
    if (content.startsWith('!function(') || content.startsWith('(function(')) {
      console.log(`   ✅ ${file} has valid JavaScript content`);
    } else {
      console.log(`   ❌ ${file} might have invalid content (starts with: ${content.substring(0, 50)}...)`);
    }
  });
} else {
  console.log('❌ No static/js directory found');
}

// Check index.html
const indexPath = path.join(buildPath, 'index.html');
if (fs.existsSync(indexPath)) {
  console.log('✅ index.html exists');
  const htmlContent = fs.readFileSync(indexPath, 'utf8');
  
  // Check for script tags
  const scriptMatches = htmlContent.match(/<script[^>]*src="([^"]*)"[^>]*>/g);
  if (scriptMatches) {
    console.log(`✅ Found ${scriptMatches.length} script tags in index.html`);
    scriptMatches.forEach(script => {
      const srcMatch = script.match(/src="([^"]*)"/);
      if (srcMatch) {
        console.log(`   - ${srcMatch[1]}`);
      }
    });
  }
} else {
  console.log('❌ index.html not found');
}

// Check manifest.json
const manifestPath = path.join(buildPath, 'manifest.json');
if (fs.existsSync(manifestPath)) {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    console.log('✅ manifest.json is valid JSON');
  } catch (error) {
    console.log('❌ manifest.json is not valid JSON:', error.message);
  }
} else {
  console.log('❌ manifest.json not found');
}

console.log('\n📋 Troubleshooting Tips:');
console.log('1. Clear browser cache and hard refresh (Ctrl+F5)');
console.log('2. Check if your server is configured to serve static files correctly');
console.log('3. Ensure your server handles client-side routing (returns index.html for all routes)');
console.log('4. If using a CDN or proxy, check if it\'s caching old files');
console.log('5. Try accessing the app directly via the server URL, not through a cached link');

console.log('\n🚀 To test locally:');
console.log('1. Run: npm start (for development)');
console.log('2. Or serve the build folder: npx serve -s build');

console.log('\n🔧 If the issue persists:');
console.log('1. Delete the build folder and rebuild: rm -rf build && npm run build');
console.log('2. Check your server logs for any routing or file serving errors');
console.log('3. Verify that your deployment platform supports single-page applications');
