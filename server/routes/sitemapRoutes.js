// Dynamic posts sitemap.
//
// The build-time sitemap (client/scripts/generateSitemap.js) can only cover
// routes known at build time - static pages and blog posts. Individual post
// pages are created by users continuously, so they need a sitemap generated
// from the database at request time. /sitemap.xml on the frontend is a sitemap
// index pointing at both this endpoint and the static one.

const express = require("express");
const router = express.Router();
const Post = require("../models/Post");

const BASE_URL = "https://www.mafqoudat.com";

// The sitemaps protocol caps a single file at 50,000 URLs / 50MB uncompressed.
// Staying well under keeps one file valid without needing to shard.
const MAX_URLS = 45000;

// Posts change rarely once published, and this query hits the database on every
// crawl, so the response is cached at the edge/CDN for an hour.
const CACHE_SECONDS = 3600;

const escapeXml = (value) =>
  String(value).replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&apos;",
    '"': "&quot;",
  }[char]));

const toIsoDate = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

// @desc Sitemap of every publicly visible post
// @route GET /sitemap-posts.xml
// @access Public
router.get("/sitemap-posts.xml", async (req, res) => {
  try {
    // Only 'active' posts are listed. Suspended posts are moderation-hidden
    // (and carry noindex on the page itself), and resolved/expired posts are
    // kept out of the sitemap so crawl budget goes to live listings - they stay
    // indexable if already known, they are just not advertised here.
    const posts = await Post.find({ status: "active" })
      .select("_id updatedAt createdAt")
      .sort({ createdAt: -1 })
      .limit(MAX_URLS)
      .lean();

    const urls = posts
      .map((post) => {
        const lastmod = toIsoDate(post.updatedAt || post.createdAt);
        return [
          "  <url>",
          `    <loc>${escapeXml(`${BASE_URL}/dash/posts/${post._id}`)}</loc>`,
          ...(lastmod ? [`    <lastmod>${lastmod}</lastmod>`] : []),
          "    <changefreq>weekly</changefreq>",
          "    <priority>0.6</priority>",
          "  </url>",
        ].join("\n");
      })
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

    res.set("Content-Type", "application/xml; charset=utf-8");
    res.set("Cache-Control", `public, max-age=${CACHE_SECONDS}, s-maxage=${CACHE_SECONDS}`);
    res.status(200).send(xml);
  } catch (error) {
    console.error("Error generating posts sitemap:", error);
    // Return a well-formed empty sitemap rather than an error page: a crawler
    // parsing HTML/JSON here would log a sitemap format error against the site.
    res.set("Content-Type", "application/xml; charset=utf-8");
    res.set("Cache-Control", "no-store");
    res.status(500).send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>
`);
  }
});

module.exports = router;
