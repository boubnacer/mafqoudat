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
  // Prerendered mainly so it stops inheriting the homepage's markup. '/' is the
  // SPA fallback, so every route without a build-time file of its own answers
  // with build/index.html - which now carries the homepage's own <h1>. /dash is
  // the one remaining public route where that would read as duplicated content,
  // so it gets its own file and its own title.
  { path: '/dash', changefreq: 'daily', priority: '0.7' },
];

// Routes that belong in the sitemap but must NOT get a build-time HTML file.
//
// /dash/posts is the browse listing - the most important page on the site for
// search, and until now it was in no sitemap at all. It is served to crawlers
// by the API's /og/posts renderer through a user-agent rewrite in vercel.json,
// which only fires when the path misses the filesystem. Writing a static
// build/dash/posts/index.html here would shadow that rewrite and hand crawlers
// a page with no live listings on it, so this list is deliberately separate
// from STATIC_ROUTES: generateSitemap.js reads both, prerenderSeo.js reads
// only STATIC_ROUTES.
const SITEMAP_ONLY_ROUTES = [
  { path: '/dash/posts', changefreq: 'daily', priority: '0.9' },
];

module.exports = { STATIC_ROUTES, SITEMAP_ONLY_ROUTES };
