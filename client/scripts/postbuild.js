// Postbuild pipeline: GA + consent-manager injection -> react-snap (where
// available) -> sitemap generation -> dependency-free SEO prerender fallback
// (fills in whatever react-snap didn't cover - this is the only prerendering
// that runs on Vercel, where Puppeteer/react-snap is skipped entirely).
//
// Both injections have to run before prerenderSeo, which copies build/index.html
// as the shell for every route it writes: whatever is missing from the shell at
// that point is missing from every prerendered page.

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
    console.log('💡 Make sure the environment variable is set in Vercel (frontend env vars are not read from the Render backend)');
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


// Inject the Funding Choices (Google CMP) publisher ID into built HTML.
//
// public/index.html carries a loader that reads this placeholder and refuses to
// request anything while it is still a placeholder, so a build without the
// variable ships no CMP - and, because src/utils/consent.js reads "no CMP" as
// "no consent", no Google Analytics either. That is deliberate: analytics
// running with nobody asked is the thing this change exists to stop. Set
// REACT_APP_FC_PUBLISHER_ID (the AdSense publisher ID, with or without the
// leading `ca-`) in Vercel to turn both back on.
const injectFundingChoices = () => {
  console.log('🔍 Starting Funding Choices (CMP) injection...');

  const rawPublisherId = process.env.REACT_APP_FC_PUBLISHER_ID;
  console.log('🔑 REACT_APP_FC_PUBLISHER_ID:', rawPublisherId || 'NOT FOUND');

  const indexPath = path.join(__dirname, '..', 'build', 'index.html');

  if (!fs.existsSync(indexPath)) {
    console.log('⚠️  index.html not found in build directory, skipping CMP injection');
    return;
  }

  if (!rawPublisherId) {
    console.log('⚠️  REACT_APP_FC_PUBLISHER_ID not found, skipping CMP injection');
    console.log('⚠️  No consent manager will load, and Google Analytics stays off as a result.');
    console.log('💡 Set REACT_APP_FC_PUBLISHER_ID in Vercel to the AdSense publisher ID (e.g. pub-1234567890123456)');
    return;
  }

  // The Funding Choices message URL takes the bare `pub-...` form; accept the
  // `ca-pub-...` spelling too, since that is how AdSense shows it.
  const publisherId = rawPublisherId.trim().replace(/^ca-/, '');

  if (!/^pub-\d+$/.test(publisherId)) {
    console.log(`⚠️  REACT_APP_FC_PUBLISHER_ID ("${rawPublisherId}") does not look like a publisher ID (pub-1234567890123456), skipping CMP injection`);
    return;
  }

  try {
    let html = fs.readFileSync(indexPath, 'utf8');

    const placeholderCount = (html.match(/FC_PUBLISHER_ID_PLACEHOLDER/g) || []).length;
    console.log('🔍 Found', placeholderCount, 'CMP placeholder(s) to replace');

    if (placeholderCount === 0) {
      console.log('⚠️  No CMP placeholder found in index.html - may have already been replaced');
      return;
    }

    html = html.replace(/FC_PUBLISHER_ID_PLACEHOLDER/g, publisherId);
    fs.writeFileSync(indexPath, html, 'utf8');
    console.log(`✅ Funding Choices publisher ID (${publisherId}) injected into index.html`);
  } catch (error) {
    console.error('❌ Failed to inject Funding Choices:', error.message);
    console.error('❌ Error stack:', error.stack);
  }
};

// Inject GA + CMP before react-snap (if it runs)
injectGoogleAnalytics();
injectFundingChoices();

const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;

if (isVercel) {
  console.log('⚠️  Skipping react-snap on Vercel (Puppeteer not supported in serverless environment)');
  console.log('💡 Falling back to the dependency-free SEO prerender script for route-specific meta/content.');
} else {
  console.log('✅ Running react-snap for pre-rendering...');
  const { execSync } = require('child_process');
  try {
    execSync('react-snap', { stdio: 'inherit' });
    console.log('✅ react-snap completed successfully');
    // Re-inject after react-snap (in case it modified the HTML)
    injectGoogleAnalytics();
    injectFundingChoices();
  } catch (error) {
    console.error('❌ react-snap failed:', error.message);
    // Don't fail the build if react-snap fails - the SEO prerender fallback
    // below still gives every route correct meta tags.
    console.log('⚠️  Continuing build without react-snap pre-rendering...');
  }
}

// Sitemap: always regenerate from the current static-route manifest + blog
// posts, so newly added blog posts show up automatically on every build.
try {
  const { writeSitemaps } = require('./generateSitemap');
  writeSitemaps(path.join(__dirname, '..', 'build'));
} catch (error) {
  console.error('❌ Sitemap generation failed:', error.message);
}

// SEO prerender fallback: fills in per-route meta/OG/JSON-LD (and, for blog
// posts, real visible article text) for any route react-snap didn't already
// prerender. This is what actually runs on Vercel.
try {
  require('./prerenderSeo').run();
} catch (error) {
  console.error('❌ SEO prerender fallback failed:', error.message);
}
