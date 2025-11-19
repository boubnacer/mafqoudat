// Conditional postbuild script for react-snap
// On Vercel, we skip react-snap since Puppeteer requires system dependencies
// For local builds and other platforms, react-snap will run normally

const fs = require('fs');
const path = require('path');

// Inject Google Analytics Measurement ID into built HTML
const injectGoogleAnalytics = () => {
  console.log('🔍 Starting Google Analytics injection...');
  console.log('📁 Current working directory:', process.cwd());
  console.log('📁 Script directory:', __dirname);
  
  const gaMeasurementId = process.env.REACT_APP_GA_MEASUREMENT_ID;
  console.log('🔑 REACT_APP_GA_MEASUREMENT_ID:', gaMeasurementId || 'NOT FOUND');
  
  // Log all environment variables that start with REACT_APP_ for debugging
  console.log('🔍 All REACT_APP_ environment variables:');
  Object.keys(process.env)
    .filter(key => key.startsWith('REACT_APP_'))
    .forEach(key => {
      console.log(`   ${key}: ${process.env[key] ? 'SET' : 'NOT SET'}`);
    });
  
  const buildDir = path.join(__dirname, '..', 'build');
  const indexPath = path.join(buildDir, 'index.html');
  
  console.log('📂 Build directory:', buildDir);
  console.log('📄 Index.html path:', indexPath);
  console.log('📄 Index.html exists:', fs.existsSync(indexPath));

  if (!fs.existsSync(indexPath)) {
    console.log('⚠️  index.html not found in build directory, skipping GA injection');
    console.log('📂 Build directory contents:', fs.existsSync(buildDir) ? fs.readdirSync(buildDir) : 'DOES NOT EXIST');
    return;
  }

  if (!gaMeasurementId) {
    console.log('⚠️  REACT_APP_GA_MEASUREMENT_ID not found, skipping GA injection');
    console.log('💡 Make sure the environment variable is set in Railway');
    return;
  }

  try {
    let html = fs.readFileSync(indexPath, 'utf8');
    console.log('📄 Read index.html, length:', html.length);
    
    // Check if placeholder exists
    const placeholderCount = (html.match(/GA_MEASUREMENT_ID_PLACEHOLDER/g) || []).length;
    console.log('🔍 Found', placeholderCount, 'placeholder(s) to replace');
    
    if (placeholderCount === 0) {
      console.log('⚠️  No placeholders found in index.html - may have already been replaced');
    }
    
    // Replace placeholder with actual Measurement ID
    html = html.replace(/GA_MEASUREMENT_ID_PLACEHOLDER/g, gaMeasurementId);
    
    // Verify replacement
    const remainingPlaceholders = (html.match(/GA_MEASUREMENT_ID_PLACEHOLDER/g) || []).length;
    const measurementIdCount = (html.match(new RegExp(gaMeasurementId, 'g')) || []).length;
    
    console.log('✅ Replacement complete:');
    console.log('   - Remaining placeholders:', remainingPlaceholders);
    console.log('   - Measurement ID occurrences:', measurementIdCount);
    
    fs.writeFileSync(indexPath, html, 'utf8');
    console.log(`✅ Google Analytics Measurement ID (${gaMeasurementId}) injected into index.html`);
  } catch (error) {
    console.error('❌ Failed to inject Google Analytics:', error.message);
    console.error('❌ Error stack:', error.stack);
  }
};

// Inject GA before react-snap (if it runs)
injectGoogleAnalytics();

const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;

if (isVercel) {
  console.log('⚠️  Skipping react-snap on Vercel (Puppeteer not supported in serverless environment)');
  console.log('💡 Your site will deploy successfully, but without pre-rendered HTML');
  console.log('💡 For SEO on Vercel, consider:');
  console.log('   1. Using Prerender.io service (free tier: 250 pages/month)');
  console.log('   2. Deploying to Netlify (supports Puppeteer)');
  console.log('   3. Using Vercel Edge Functions with a headless browser service');
  console.log('');
  console.log('✅ Build will continue without pre-rendering...');
  process.exit(0);
} else {
  console.log('✅ Running react-snap for pre-rendering...');
  // Run react-snap for non-Vercel deployments
  const { execSync } = require('child_process');
  try {
    execSync('react-snap', { stdio: 'inherit' });
    console.log('✅ react-snap completed successfully');
    // Re-inject GA after react-snap (in case it modified the HTML)
    injectGoogleAnalytics();
  } catch (error) {
    console.error('❌ react-snap failed:', error.message);
    // Don't fail the build if react-snap fails
    console.log('⚠️  Continuing build without pre-rendering...');
    process.exit(0);
  }
}

