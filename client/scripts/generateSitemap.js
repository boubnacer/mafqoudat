// Regenerates the sitemap files from the static route manifest + blogPosts.json
// so every blog post gets its own <url> entry automatically. Emits two files:
// sitemap-static.xml (these build-time routes) and sitemap.xml (an index that
// also points at the database-backed /sitemap-posts.xml). Runs standalone
// (`node scripts/generateSitemap.js [outputDir]`) or from postbuild.js.

const fs = require('fs');
const path = require('path');
const { STATIC_ROUTES } = require('./seoRoutes');

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

const buildUrlEntry = ({ loc, lastmod, changefreq, priority }) => `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;

const generateSitemap = () => {
  const today = new Date().toISOString().slice(0, 10);

  const staticEntries = STATIC_ROUTES.map((route) =>
    buildUrlEntry({
      loc: `${BASE_URL}${route.path}`,
      lastmod: today,
      changefreq: route.changefreq,
      priority: route.priority,
    })
  );

  const blogEntries = blogPosts.map((post) =>
    buildUrlEntry({
      loc: `${BASE_URL}/blog/${post.slug}`,
      lastmod: post.date,
      changefreq: 'monthly',
      priority: '0.7',
    })
  );

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticEntries, ...blogEntries].join('\n')}
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
    `Sitemap written: ${staticPath} (${STATIC_ROUTES.length} static + ${blogPosts.length} blog URLs)`
  );

  const indexPath = path.join(outputDir, 'sitemap.xml');
  fs.writeFileSync(indexPath, generateSitemapIndex(), 'utf8');
  console.log(`Sitemap index written: ${indexPath} (static + dynamic posts)`);
};

module.exports = { generateSitemap, generateSitemapIndex, writeSitemaps };

if (require.main === module) {
  const target = process.argv[2] || path.join(__dirname, '..', 'public');
  writeSitemaps(target);
}
