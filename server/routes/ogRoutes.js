// Server-rendered Open Graph cards for post detail pages.
//
// Google renders JavaScript, so SeoMeta's runtime tags are enough for search.
// Social scrapers are not: facebookexternalhit, WhatsApp, Twitterbot and the
// rest fetch the URL once and parse the raw HTML without executing any script.
// For a client-rendered route they therefore see the SPA shell's generic tags -
// the Mafqoudat logo and the English tagline - instead of the item's photo and
// its Arabic title. On a platform where posts spread mainly through WhatsApp
// groups, that is the difference between a shareable card and a blank one.
//
// Bingbot and YandexBot are routed here for the same reason. Both do run some
// JavaScript, but far less reliably than Googlebot, so a client-rendered route
// is a coin flip for them - this is dynamic rendering, which both Bing and
// Yandex document as an accepted way to serve a JS-heavy site. The markup they
// get here describes the same post a human sees, so it is not cloaking.
//
// Vercel routes only those user-agents here (see client/vercel.json); browsers
// and Googlebot keep getting the normal SPA, since Googlebot renders it fine
// and the full page is richer than this card. The URL is unchanged by the
// rewrite, so the canonical below is self-referencing.

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Post = require("../models/Post");
const City = require("../models/City");

const BASE_URL = "https://www.mafqoudat.com";
const LOGO = `${BASE_URL}/maflogo1200-630.png`;

// Arabic is what a first-time visitor with no stored preference gets
// (languageContext.resolveLanguage), and a scraper never has one - so the card
// is built in Arabic, matching what someone clicking through will actually see.
//
// Mirrored from client/src/utils/translations.js (the `ar` block) and
// client/src/utils/postSeo.js. That file is ESM and cannot be required here
// without a build step, so these are kept in sync by hand - the same
// arrangement scripts/prerenderSeo.js already uses for its static page copy.
const AR = {
  titleFound: "عُثر على: {item} في {city} | مفقودات",
  titleLost: "مفقود: {item} في {city} | مفقودات",
  titleUnknown: "{item} في {city} | مفقودات",
  descFound:
    "تم العثور على {item} في {city}. اطّلع على التفاصيل الكاملة وتواصل مع صاحب البلاغ عبر مفقودات، منصة المفقودات والموجودات في {country}.",
  descLost:
    "بلاغ عن فقدان {item} في {city}. اطّلع على التفاصيل الكاملة وساعد في إعادة المفقود إلى صاحبه عبر مفقودات، منصة المفقودات والموجودات في {country}.",
  descUnknown:
    "{item} في {city}. اطّلع على التفاصيل الكاملة عبر مفقودات، منصة المفقودات والموجودات في {country}.",
  unknownCategory: "فئة غير معروفة",
  unknownLocation: "موقع غير معروف",
  defaultRegion: "المغرب والعالم العربي",
  viewPost: "عرض المنشور على مفقودات",
  notFoundTitle: "المنشور غير موجود | مفقودات",
  notFoundDescription: "لم يعد هذا المنشور متاحاً على مفقودات.",
};

const CACHE_SECONDS = 3600;

const escapeHtml = (value) =>
  String(value == null ? "" : value).replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&apos;",
    '"': "&quot;",
  }[char]));

const fill = (template, values) =>
  Object.keys(values).reduce(
    (out, key) => out.split(`{${key}}`).join(values[key]),
    template
  );

const collapse = (value) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "");

const truncate = (value, max) => {
  const text = collapse(value);
  if (text.length <= max) return text;
  const clipped = text.slice(0, max - 1);
  const lastSpace = clipped.lastIndexOf(" ");
  const body = lastSpace > max * 0.6 ? clipped.slice(0, lastSpace) : clipped;
  return `${body.replace(/[\s,.;:،؛-]+$/, "")}…`;
};

const arLabel = (labels, fallback = "") => {
  if (!labels || typeof labels !== "object") return collapse(fallback);
  return collapse(labels.ar || labels.en || labels.fr) || collapse(fallback);
};

// Social scrapers are unreliable with WebP (many post images are stored as
// .webp), so the card is served as a JPEG cropped to the 1200x630 both
// Facebook and WhatsApp expect - which also lets the dimensions below be
// declared truthfully.
const socialImage = (post) => {
  const raw = collapse(post.cloudinaryUrl || post.image);
  if (!raw) return LOGO;
  if (raw.includes("/image/upload/")) {
    return raw.replace(
      "/image/upload/",
      "/image/upload/w_1200,h_630,c_fill,q_auto:good,f_jpg/"
    );
  }
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  return `${BASE_URL}${raw.startsWith("/") ? "" : "/"}${raw}`;
};

const resolveCityLabel = async (post) => {
  const { city } = post;
  if (city && typeof city === "object" && city.labels) return arLabel(city.labels, city.code);
  if (city && mongoose.Types.ObjectId.isValid(String(city))) {
    const found = await City.findById(city).select("code labels").lean();
    if (found) return arLabel(found.labels, found.code);
  }
  if (typeof city === "string" && collapse(city)) return collapse(city);
  const location = collapse(post.exactLocation);
  if (location) return collapse(location.split(",")[0].split("(")[0]);
  return "";
};

const renderPage = ({ title, description, image, url, imageIsPhoto }) => `<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <link rel="canonical" href="${escapeHtml(url)}" />
    <meta name="description" content="${escapeHtml(description)}" />

    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="Mafqoudat" />
    <meta property="og:locale" content="ar_AR" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(url)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta property="og:image:secure_url" content="${escapeHtml(image)}" />
    <meta property="og:image:type" content="image/${imageIsPhoto ? "jpeg" : "png"}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeHtml(title)}" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />
  </head>
  <body style="margin:0;padding:2rem;font-family:'IBM Plex Sans Arabic',Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#F7F8FB;color:#0B1220;text-align:center">
    <!-- Scrapers stop at </head>. This body exists for the rare human whose
         in-app browser sends a scraper-like user-agent: it has to be a usable
         page, not a blank one. It cannot auto-redirect - the rewrite keeps the
         same URL, so any redirect here would loop back into this handler. -->
    <img src="${escapeHtml(image)}" alt="" style="max-width:100%;height:auto;border-radius:16px" />
    <h1 style="font-size:1.25rem;font-weight:700">${escapeHtml(title)}</h1>
    <p style="max-width:40rem;margin:0 auto 1.5rem;line-height:1.7">${escapeHtml(description)}</p>
    <p><a href="${escapeHtml(url)}" style="display:inline-block;padding:.75rem 1.5rem;border-radius:12px;background:#1B4DFF;color:#fff;text-decoration:none;font-weight:600">${escapeHtml(AR.viewPost)}</a></p>
  </body>
</html>
`;

// @desc Open Graph card for a single post, for social scrapers only
// @route GET /og/posts/:id
// @access Public
router.get("/og/posts/:id", async (req, res) => {
  const { id } = req.params;
  const url = `${BASE_URL}/dash/posts/${id}`;

  const sendNotFound = () => {
    res.set("Content-Type", "text/html; charset=utf-8");
    res.set("Cache-Control", "public, max-age=300");
    res.status(404).send(
      renderPage({
        title: AR.notFoundTitle,
        description: AR.notFoundDescription,
        image: LOGO,
        url,
        imageIsPhoto: false,
      })
    );
  };

  if (!mongoose.Types.ObjectId.isValid(id)) return sendNotFound();

  try {
    const post = await Post.findById(id)
      .populate("categories", "code labels")
      .populate("category", "code labels")
      .populate("foundLost", "code")
      .populate("country", "code names labels")
      .lean();

    // Moderation-suspended posts get no shareable card.
    if (!post || post.status === "suspended") return sendNotFound();

    const categoryLabels = (Array.isArray(post.categories) ? post.categories : [])
      .map((cat) => arLabel(cat && cat.labels, cat && cat.code))
      .filter(Boolean);
    if (!categoryLabels.length && post.category) {
      const legacy = arLabel(post.category.labels, post.category.code);
      if (legacy) categoryLabels.push(legacy);
    }

    const cityLabel = await resolveCityLabel(post);
    const countryLabel = post.country
      ? arLabel(post.country.names, "") || arLabel(post.country.labels, post.country.code)
      : "";

    const item = categoryLabels.join("، ") || AR.unknownCategory;
    const city = cityLabel || AR.unknownLocation;
    const country = countryLabel || AR.defaultRegion;

    const code = post.foundLost && post.foundLost.code ? String(post.foundLost.code).toUpperCase() : null;
    const titleTemplate =
      code === "FOUND" ? AR.titleFound : code === "LOST" ? AR.titleLost : AR.titleUnknown;
    const descTemplate =
      code === "FOUND" ? AR.descFound : code === "LOST" ? AR.descLost : AR.descUnknown;

    const image = socialImage(post);
    const html = renderPage({
      title: truncate(fill(titleTemplate, { item, city }), 70),
      description: truncate(fill(descTemplate, { item, city, country }), 160),
      image,
      url,
      imageIsPhoto: image !== LOGO,
    });

    res.set("Content-Type", "text/html; charset=utf-8");
    res.set("Cache-Control", `public, max-age=${CACHE_SECONDS}, s-maxage=${CACHE_SECONDS}`);
    res.status(200).send(html);
  } catch (error) {
    console.error("Error rendering OG card:", error);
    // 503 rather than a generic 200 card: scrapers cache aggressively, and a
    // wrong preview cached for a transient database blip is worse than none.
    res.set("Cache-Control", "no-store");
    res.status(503).send("Service Unavailable");
  }
});

module.exports = router;
