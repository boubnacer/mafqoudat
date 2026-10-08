// Regenerates the sitemap files from the static route manifest + blogPosts.json
// so every blog post gets its own <url> entry automatically. Emits two files:
// sitemap-static.xml (these build-time routes) and sitemap.xml (an index that
// also points at the database-backed /sitemap-posts.xml). Runs standalone
// (`node scripts/generateSitemap.js [outputDir]`) or from postbuild.js.

const fs = require('fs');
const path = require('path');
const { STATIC_ROUTES, SITEMAP_ONLY_ROUTES } = require('./seoRoutes');

const BASE_URL = 'https://www.mafqoudat.com';
const blogPosts = require('../src/data/blogPosts.json');

const escapeXml = (value) =>
  String(value).replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&apos;',
    '"': '&quot;',
  }[char]));

/**
 * Normalizes a route path to a strictly canonical sitemap URL:
 * - Root path ('/' or empty) resolves to canonical 'https://www.mafqoudat.com/'
 * - Non-root paths always strip trailing slashes to prevent Vercel 308 redirects
 * - Legacy paths like '/posts' are automatically mapped to '/dash/posts'
 * - Query strings and hash fragments are stripped
 */
const normalizeSitemapUrl = (routePath) => {
  if (!routePath || routePath === '/') {
    return `${BASE_URL}/`;
  }

  // Strip query parameters and hash fragments
  const cleanPath = String(routePath).split('?')[0].split('#')[0].trim();

  // Collapse consecutive slashes and strip leading/trailing slashes
  const collapsed = cleanPath.replace(/\/+/g, '/');
  const trimmed = collapsed.replace(/^\/+|\/+$/g, '');

  if (!trimmed) {
    return `${BASE_URL}/`;
  }

  // Intercept legacy routes that redirect (e.g. /posts -> /dash/posts)
  if (trimmed === 'posts') {
    return `${BASE_URL}/dash/posts`;
  }

  return `${BASE_URL}/${trimmed}`;
};

const buildUrlEntry = ({ loc, lastmod, changefreq, priority }) => `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;

const generateSitemap = () => {
  const today = new Date().toISOString().slice(0, 10);
  const seenUrls = new Set();
  const urlEntries = [];

  const addEntry = ({ rawPath, lastmod, changefreq, priority }) => {
    const loc = normalizeSitemapUrl(rawPath);

    // Invariant checks:
    // 1. Must use canonical protocol and domain
    if (!loc.startsWith(`${BASE_URL}/`)) {
      throw new Error(`Sitemap URL violates canonical domain: ${loc}`);
    }
    // 2. Non-root URLs must NEVER have a trailing slash (avoids 308 redirect)
    if (loc.length > `${BASE_URL}/`.length && loc.endsWith('/')) {
      throw new Error(`Sitemap URL contains trailing slash: ${loc}`);
    }
    // 3. No legacy routes (e.g. /posts)
    if (loc === `${BASE_URL}/posts`) {
      throw new Error(`Legacy redirecting route detected in sitemap: ${loc}`);
    }

    if (seenUrls.has(loc)) {
      return; // Deduplicate
    }
    seenUrls.add(loc);

    urlEntries.push(buildUrlEntry({ loc, lastmod, changefreq, priority }));
  };

  // Add static and listing routes
  [...STATIC_ROUTES, ...SITEMAP_ONLY_ROUTES].forEach((route) => {
    addEntry({
      rawPath: route.path,
      lastmod: today,
      changefreq: route.changefreq,
      priority: route.priority,
    });
  });

  // Add individual blog post routes
  blogPosts.forEach((post) => {
    if (!post?.slug) return;
    addEntry({
      rawPath: `/blog/${post.slug}`,
      lastmod: post.date || today,
      changefreq: 'monthly',
      priority: '0.7',
    });
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries.join('\n')}
</urlset>
`;
};

// Sitemap index. Post detail pages are user-generated and change constantly,
// so they can't live in a build-time file - /sitemap-posts.xml is served from
// the database by the API (server/routes/sitemapRoutes.js) and reaches this
// origin through the Vercel rewrite. /sitemap.xml stays the single URL to
// submit in Search Console; it now points at both children.
//
// No <lastmod> on the posts entry on purpose: its real value changes whenever
// a user posts, which build time can't know. A stale timestamp there would
// discourage Google from refetching it.
const generateSitemapIndex = () => {
  const today = new Date().toISOString().slice(0, 10);

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${BASE_URL}/sitemap-static.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-posts.xml</loc>
  </sitemap>
</sitemapindex>
`;
};

// Writes the sitemap index plus the static/blog child sitemap into outputDir.
const writeSitemaps = (outputDir) => {
  fs.mkdirSync(outputDir, { recursive: true });

  const staticPath = path.join(outputDir, 'sitemap-static.xml');
  fs.writeFileSync(staticPath, generateSitemap(), 'utf8');
  console.log(
    `Sitemap written: ${staticPath} (${STATIC_ROUTES.length} static + ` +
      `${SITEMAP_ONLY_ROUTES.length} listing + ${blogPosts.length} blog URLs)`
  );

  const indexPath = path.join(outputDir, 'sitemap.xml');
  fs.writeFileSync(indexPath, generateSitemapIndex(), 'utf8');
  console.log(`Sitemap index written: ${indexPath} (static + dynamic posts)`);
};

module.exports = {
  generateSitemap,
  generateSitemapIndex,
  writeSitemaps,
  normalizeSitemapUrl,
  BASE_URL,
};

if (require.main === module) {
  const target = process.argv[2] || path.join(__dirname, '..', 'public');
  writeSitemaps(target);
}
