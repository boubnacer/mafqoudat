// Shared route manifest for the build-time SEO scripts (sitemap + static
// prerender). Plain CommonJS on purpose: these scripts run under plain Node
// (no webpack/babel), and this keeps them independent of the ESM-only
// src/utils/seoConfig.js used by the React app.
//
// Keep this in sync with the public routes declared in src/App.js.

const STATIC_ROUTES = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/about', changefreq: 'monthly', priority: '0.8' },
  { path: '/blog', changefreq: 'weekly', priority: '0.8' },
  { path: '/contact', changefreq: 'monthly', priority: '0.7' },
  { path: '/help', changefreq: 'monthly', priority: '0.7' },
  { path: '/guidelines', changefreq: 'monthly', priority: '0.6' },
  { path: '/safety', changefreq: 'monthly', priority: '0.6' },
  { path: '/privacy', changefreq: 'monthly', priority: '0.6' },
  { path: '/terms', changefreq: 'monthly', priority: '0.6' },
  { path: '/cookies', changefreq: 'monthly', priority: '0.5' },
];

module.exports = { STATIC_ROUTES };
