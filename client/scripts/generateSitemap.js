// Regenerates sitemap.xml from the static route manifest + blogPosts.json so
// every blog post gets its own <url> entry automatically. Runs standalone
// (`node scripts/generateSitemap.js`) or is invoked from postbuild.js.

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

const writeSitemap = (outputPath) => {
  const xml = generateSitemap();
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, xml, 'utf8');
  console.log(`Sitemap written: ${outputPath} (${STATIC_ROUTES.length} static + ${blogPosts.length} blog URLs)`);
};

module.exports = { generateSitemap, writeSitemap };

if (require.main === module) {
  const target = process.argv[2] || path.join(__dirname, '..', 'public', 'sitemap.xml');
  writeSitemap(target);
}
