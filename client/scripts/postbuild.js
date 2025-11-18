// Conditional postbuild script for react-snap
// On Vercel, we skip react-snap since Puppeteer requires system dependencies
// For local builds and other platforms, react-snap will run normally

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
  } catch (error) {
    console.error('❌ react-snap failed:', error.message);
    // Don't fail the build if react-snap fails
    console.log('⚠️  Continuing build without pre-rendering...');
    process.exit(0);
  }
}

