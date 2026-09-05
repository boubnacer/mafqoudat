// Server-rendered crawler pages for the routes React owns at runtime.
//
// Two audiences, one renderer.
//
// Social scrapers - facebookexternalhit, WhatsApp, Twitterbot and the rest -
// fetch the URL once and parse the raw HTML without executing any script. For a
// client-rendered route they see the SPA shell's generic tags: the Mafqoudat
// logo and the English tagline, instead of the item's photo and its Arabic
// title. On a platform where posts spread mainly through WhatsApp groups, that
// is the difference between a shareable card and a blank one.
//
// Search crawlers are the second audience, and the reason this file grew past
// being an OG card. Googlebot was deliberately left out of the vercel.json
// rewrite on the theory that it renders JavaScript well enough on its own. In
// production that turned out to be wrong in the way that matters: every post
// URL and the /dash/posts listing answered Googlebot with the same 7,752-byte
// shell, the same English <title>, and zero headings - 37 listings that looked
// to a first-pass crawl like 37 copies of one English page, while competitors
// serving plain server-rendered Arabic HTML outranked them. Bingbot and
// YandexBot were already routed here for the same underlying reason.
//
// So the markup below is no longer a card. It is a real page: the item's facts,
// its description, breadcrumbs, JSON-LD, and links onward to the listing and to
// sibling posts, so a crawler that arrives on one post has a path to the rest
// instead of a dead end. It describes exactly what a human sees on the same
// URL, which is what keeps dynamic rendering on the right side of the cloaking
// line - the crawler gets the same content, just already assembled.
//
// The URL is unchanged by the rewrite, so the canonical here is self-referencing.

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Post = require("../models/Post");
const City = require("../models/City");

const BASE_URL = "https://www.mafqoudat.com";
const LOGO = `${BASE_URL}/maflogo1200-630.png`;

// Arabic is what a first-time visitor with no stored preference gets
// (languageContext.resolveLanguage), and a crawler never has one - so these
// pages are built in Arabic, matching what someone clicking through will
// actually see.
//
// Mirrored from client/src/utils/translations.js (the `ar` block) and
// client/src/utils/postSeo.js. That file is ESM and cannot be required here
// without a build step, so these are kept in sync by hand - the same
// arrangement client/scripts/prerenderSeo.js uses for its static page copy.
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

  // Page furniture
  siteName: "مفقودات",
  home: "الرئيسية",
  posts: "المفقودات والموجودات",
  statusLabel: "الحالة",
  statusLost: "مفقود",
  statusFound: "تم العثور عليه",
  statusReturned: "أُعيد إلى صاحبه",
  categoryLabel: "الفئة",
  cityLabel: "المدينة",
  countryLabel: "البلد",
  locationLabel: "الموقع بالتحديد",
  dateLabel: "التاريخ",
  descriptionLabel: "الوصف",
  relatedLabel: "منشورات أخرى قد تهمّك",
  moreLink: "تصفّح كل المفقودات والموجودات",
  aboutLink: "من نحن",
  helpLink: "مركز المساعدة",
  safetyLink: "نصائح السلامة",
  blogLink: "المدونة",

  // Listing page
  listTitle: "المفقودات والموجودات في المغرب والعالم العربي | مفقودات",
  listDescription:
    "تصفّح أحدث بلاغات المفقودات والموجودات على مفقودات: أشياء ضاعت وأشياء عُثر عليها في مدن المغرب والعالم العربي. ابحث عن غرضك أو ساعد في إعادة ما وجدته إلى صاحبه.",
  listHeading: "أحدث المفقودات والموجودات",
  listIntro:
    "هذه أحدث البلاغات المنشورة على مفقودات. كل بلاغ يحمل صورة الغرض ومدينته وتاريخه، ويمكنك فتحه للاطلاع على التفاصيل الكاملة والتواصل مع صاحبه.",
  listEmpty: "لا توجد بلاغات منشورة حالياً.",
};

const CACHE_SECONDS = 3600;
const LIST_CACHE_SECONDS = 900;

// How many listings the crawler-facing listing page carries, and how many
// siblings a post page links onward to. Both exist to give a crawler somewhere
// to go next; neither needs to be the whole database.
const LIST_LIMIT = 30;
const RELATED_LIMIT = 6;

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

// "مفقود: ملابس في الدار البيضاء | مفقودات" is a <title>: the brand suffix is
// there so the tab and the SERP row say which site this is. A heading on the
// page is already on the site, so it drops the suffix - repeating it in an <h1>
// reads as boilerplate to a reader and adds a term to the heading that has
// nothing to do with the item.
const stripBrandSuffix = (title) => collapse(String(title).split("|")[0]);

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

// A thumbnail for the listing page. Same reasoning as socialImage, smaller box:
// the listing renders 30 of these, so it asks Cloudinary for 400px rather than
// linking 30 full-size originals.
const thumbImage = (post) => {
  const raw = collapse(post.cloudinaryUrl || post.image);
  if (!raw) return LOGO;
  if (raw.includes("/image/upload/")) {
    return raw.replace(
      "/image/upload/",
      "/image/upload/w_400,h_300,c_fill,q_auto:eco,f_jpg/"
    );
  }
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  return `${BASE_URL}${raw.startsWith("/") ? "" : "/"}${raw}`;
};

// `city` is a Mixed field: sometimes a populated object, sometimes an id,
// sometimes free text. Resolving one post at a time is fine for a detail page,
// but the listing would turn that into one query per row - so ids are collected
// across the whole page and looked up in a single find().
const buildCityResolver = async (posts) => {
  const ids = new Set();
  posts.forEach((post) => {
    const { city } = post;
    const isObject = city && typeof city === "object" && city.labels;
    if (!isObject && city && mongoose.Types.ObjectId.isValid(String(city))) {
      ids.add(String(city));
    }
  });

  let byId = new Map();
  if (ids.size) {
    const found = await City.find({ _id: { $in: Array.from(ids) } })
      .select("code labels")
      .lean();
    byId = new Map(found.map((city) => [String(city._id), arLabel(city.labels, city.code)]));
  }

  return (post) => {
    const { city } = post;
    if (city && typeof city === "object" && city.labels) return arLabel(city.labels, city.code);
    if (city && byId.has(String(city))) return byId.get(String(city));
    if (typeof city === "string" && collapse(city)) return collapse(city);
    const location = collapse(post.exactLocation);
    if (location) return collapse(location.split(",")[0].split("(")[0]);
    return "";
  };
};

// Everything a post page and the listing page share: the same Arabic labels
// derived from the same populated documents, so the two never describe the same
// listing differently.
const describePost = (post, cityOf) => {
  const categoryLabels = (Array.isArray(post.categories) ? post.categories : [])
    .map((cat) => arLabel(cat && cat.labels, cat && cat.code))
    .filter(Boolean);
  if (!categoryLabels.length && post.category) {
    const legacy = arLabel(post.category.labels, post.category.code);
    if (legacy) categoryLabels.push(legacy);
  }

  const cityLabel = cityOf(post);
  const countryLabel = post.country
    ? arLabel(post.country.names, "") || arLabel(post.country.labels, post.country.code)
    : "";

  const item = categoryLabels.join("، ") || AR.unknownCategory;
  const city = cityLabel || AR.unknownLocation;
  const country = countryLabel || AR.defaultRegion;

  const code = post.foundLost && post.foundLost.code
    ? String(post.foundLost.code).toUpperCase()
    : null;

  const titleTemplate =
    code === "FOUND" ? AR.titleFound : code === "LOST" ? AR.titleLost : AR.titleUnknown;
  const descTemplate =
    code === "FOUND" ? AR.descFound : code === "LOST" ? AR.descLost : AR.descUnknown;

  const status = post.returned
    ? AR.statusReturned
    : code === "FOUND"
    ? AR.statusFound
    : code === "LOST"
    ? AR.statusLost
    : "";

  return {
    url: `${BASE_URL}/dash/posts/${post._id}`,
    item,
    city,
    country,
    status,
    categoryLabels,
    exactLocation: collapse(post.exactLocation),
    mainDate: collapse(post.mainDate),
    description: collapse(post.description),
    createdAt: post.createdAt,
    title: truncate(fill(titleTemplate, { item, city }), 70),
    heading: stripBrandSuffix(truncate(fill(titleTemplate, { item, city }), 70)),
    metaDescription: truncate(fill(descTemplate, { item, city, country }), 160),
  };
};

const CSS = `
  :root { color-scheme: light; }
  body { margin:0; padding:1.5rem; background:#F7F8FB; color:#0B1220;
         font-family:'IBM Plex Sans Arabic',Segoe UI,Roboto,Helvetica,Arial,sans-serif;
         line-height:1.7; }
  main { max-width:52rem; margin:0 auto; }
  a { color:#1B4DFF; }
  h1 { font-size:1.5rem; font-weight:700; margin:0 0 .5rem; }
  h2 { font-size:1.15rem; font-weight:700; margin:2rem 0 .5rem; }
  img { max-width:100%; height:auto; border-radius:16px; }
  dl { display:grid; grid-template-columns:auto 1fr; gap:.35rem 1rem; margin:1rem 0; }
  dt { font-weight:600; }
  dd { margin:0; }
  nav ul, ul.cards { list-style:none; padding:0; margin:0; }
  nav li { display:inline; }
  nav li + li::before { content:" / "; color:#6B7280; }
  ul.cards li { margin:0 0 1rem; }
  .cta { display:inline-block; padding:.75rem 1.5rem; border-radius:12px;
         background:#1B4DFF; color:#fff; text-decoration:none; font-weight:600; }
  footer { margin-top:2.5rem; padding-top:1rem; border-top:1px solid #D9DEE8; }
`;

// The shared document. `head` carries the page-specific meta, `body` the
// visible markup; everything common - charset, direction, stylesheet, the
// footer's site links - lives here so a post page and the listing page cannot
// drift apart.
const renderDocument = ({ title, description, canonical, head, body }) => `<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="robots" content="index, follow" />

    <meta property="og:site_name" content="Mafqoudat" />
    <meta property="og:locale" content="ar_AR" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
${head}
    <style>${CSS}</style>
  </head>
  <body>
    <!-- Scrapers stop at </head>. Everything below is for search crawlers, and
         for the rare human whose in-app browser sends a scraper-like
         user-agent: it has to be a usable page, not a blank one. It cannot
         auto-redirect - the rewrite keeps the same URL, so any redirect here
         would loop back into this handler. -->
    <main>
${body}
      <footer>
        <nav>
          <ul>
            <li><a href="${BASE_URL}/">${escapeHtml(AR.home)}</a></li>
            <li><a href="${BASE_URL}/dash/posts">${escapeHtml(AR.posts)}</a></li>
            <li><a href="${BASE_URL}/blog">${escapeHtml(AR.blogLink)}</a></li>
            <li><a href="${BASE_URL}/about">${escapeHtml(AR.aboutLink)}</a></li>
            <li><a href="${BASE_URL}/help">${escapeHtml(AR.helpLink)}</a></li>
            <li><a href="${BASE_URL}/safety">${escapeHtml(AR.safetyLink)}</a></li>
          </ul>
        </nav>
      </footer>
    </main>
  </body>
</html>
`;

const breadcrumbSchema = (items) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((entry, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: entry.name,
    item: entry.url,
  })),
});

// JSON inside a <script> block is raw text, not parsed markup: the only thing
// that can end it early is a literal "<" (as "</script" or "<!--"). A post
// description is free text from a stranger, so it has to be escaped on the way
// out. "\u003C" is what the JSON parser reads back as "<", so the payload is
// unchanged for a crawler while being inert as markup - the encoding belongs
// here, at the point of output, not in a filter on the way into the database.
const escapeJsonLd = (json) => json.replace(/</g, "\\u003C");

const jsonLd = (schema) =>
  `    <script type="application/ld+json">${escapeJsonLd(JSON.stringify(schema))}</script>`;

// One row of the listing page, and of a post page's "related" block.
const renderCard = (info, image) => `        <li>
          <a href="${escapeHtml(info.url)}">
            <img src="${escapeHtml(image)}" alt="${escapeHtml(info.heading)}" width="400" height="300" loading="lazy" />
            <strong>${escapeHtml(info.heading)}</strong>
          </a>
          <div>${escapeHtml([info.status, info.city, info.mainDate].filter(Boolean).join(" · "))}</div>
        </li>`;

const renderNotFound = (url) =>
  renderDocument({
    title: AR.notFoundTitle,
    description: AR.notFoundDescription,
    canonical: url,
    head: [
      `    <meta property="og:type" content="website" />`,
      `    <meta property="og:image" content="${LOGO}" />`,
      `    <meta name="twitter:image" content="${LOGO}" />`,
    ].join("\n"),
    body: `      <h1>${escapeHtml(AR.notFoundTitle)}</h1>
      <p>${escapeHtml(AR.notFoundDescription)}</p>
      <p><a class="cta" href="${BASE_URL}/dash/posts">${escapeHtml(AR.moreLink)}</a></p>`,
  });

// @desc Crawler-facing page for a single post
// @route GET /og/posts/:id
// @access Public
router.get("/og/posts/:id", async (req, res) => {
  const { id } = req.params;
  const url = `${BASE_URL}/dash/posts/${id}`;

  const sendNotFound = () => {
    res.set("Content-Type", "text/html; charset=utf-8");
    res.set("Cache-Control", "public, max-age=300");
    // noindex on the 404 body as well as the 404 status: a crawler that
    // ignores the status code must not index a "post is gone" page as content.
    res.status(404).send(renderNotFound(url).replace("index, follow", "noindex, follow"));
  };

  if (!mongoose.Types.ObjectId.isValid(id)) return sendNotFound();

  try {
    const post = await Post.findById(id)
      .populate("categories", "code labels")
      .populate("category", "code labels")
      .populate("foundLost", "code")
      .populate("country", "code names labels")
      .lean();

    // Moderation-suspended posts get no shareable card and no indexable page.
    if (!post || post.status === "suspended") return sendNotFound();

    // Siblings in the same country, so a crawler landing here has somewhere to
    // go. Same filter the sitemap uses (active only), newest first, this post
    // excluded.
    const related = await Post.find({
      _id: { $ne: post._id },
      status: "active",
      ...(post.country ? { country: post.country._id || post.country } : {}),
    })
      .select("_id categories category foundLost country city exactLocation mainDate returned cloudinaryUrl image createdAt")
      .populate("categories", "code labels")
      .populate("category", "code labels")
      .populate("foundLost", "code")
      .populate("country", "code names labels")
      .sort({ createdAt: -1 })
      .limit(RELATED_LIMIT)
      .lean();

    const cityOf = await buildCityResolver([post, ...related]);
    const info = describePost(post, cityOf);
    const image = socialImage(post);

    const facts = [
      [AR.statusLabel, info.status],
      [AR.categoryLabel, info.categoryLabels.join("، ")],
      [AR.cityLabel, info.city],
      [AR.countryLabel, info.country],
      [AR.locationLabel, info.exactLocation],
      [AR.dateLabel, info.mainDate],
    ]
      .filter(([, value]) => Boolean(value))
      .map(([label, value]) => `        <dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>`)
      .join("\n");

    const relatedCards = related
      .map((sibling) => renderCard(describePost(sibling, cityOf), thumbImage(sibling)))
      .join("\n");

    const head = [
      `    <meta property="og:type" content="article" />`,
      `    <meta property="og:image" content="${escapeHtml(image)}" />`,
      `    <meta property="og:image:secure_url" content="${escapeHtml(image)}" />`,
      `    <meta property="og:image:type" content="image/${image !== LOGO ? "jpeg" : "png"}" />`,
      `    <meta property="og:image:width" content="1200" />`,
      `    <meta property="og:image:height" content="630" />`,
      `    <meta property="og:image:alt" content="${escapeHtml(info.heading)}" />`,
      `    <meta name="twitter:image" content="${escapeHtml(image)}" />`,
      jsonLd(
        breadcrumbSchema([
          { name: AR.home, url: `${BASE_URL}/` },
          { name: AR.posts, url: `${BASE_URL}/dash/posts` },
          { name: info.heading, url },
        ])
      ),
      // Deliberately WebPage + a plain Thing, not Product/Offer. Nothing here
      // is for sale and none of it is rated, and schema.org has no lost-and-
      // found type - claiming one that carries commercial semantics would be
      // describing the page as something it is not.
      jsonLd({
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: info.title,
        description: info.metaDescription,
        url,
        inLanguage: "ar",
        primaryImageOfPage: image !== LOGO ? { "@type": "ImageObject", url: image } : undefined,
        datePublished: info.createdAt ? new Date(info.createdAt).toISOString() : undefined,
        about: {
          "@type": "Thing",
          name: info.item,
          ...(info.description ? { description: truncate(info.description, 300) } : {}),
        },
        ...(info.city
          ? { contentLocation: { "@type": "Place", name: [info.city, info.country].filter(Boolean).join("، ") } }
          : {}),
        isPartOf: { "@type": "WebSite", name: "Mafqoudat", url: BASE_URL },
      }),
    ].join("\n");

    const body = `      <nav>
        <ul>
          <li><a href="${BASE_URL}/">${escapeHtml(AR.home)}</a></li>
          <li><a href="${BASE_URL}/dash/posts">${escapeHtml(AR.posts)}</a></li>
        </ul>
      </nav>
      <h1>${escapeHtml(info.heading)}</h1>
      <img src="${escapeHtml(image)}" alt="${escapeHtml(info.heading)}" width="1200" height="630" />
      <p>${escapeHtml(info.metaDescription)}</p>
      <dl>
${facts}
      </dl>
${info.description ? `      <h2>${escapeHtml(AR.descriptionLabel)}</h2>\n      <p>${escapeHtml(info.description)}</p>\n` : ""}      <p><a class="cta" href="${escapeHtml(url)}">${escapeHtml(AR.viewPost)}</a></p>
${
  relatedCards
    ? `      <h2>${escapeHtml(AR.relatedLabel)}</h2>\n      <ul class="cards">\n${relatedCards}\n      </ul>\n      <p><a href="${BASE_URL}/dash/posts">${escapeHtml(AR.moreLink)}</a></p>`
    : ""
}`;

    const html = renderDocument({
      title: info.title,
      description: info.metaDescription,
      canonical: url,
      head,
      body,
    });

    res.set("Content-Type", "text/html; charset=utf-8");
    res.set("Cache-Control", `public, max-age=${CACHE_SECONDS}, s-maxage=${CACHE_SECONDS}`);
    res.status(200).send(html);
  } catch (error) {
    console.error("Error rendering post crawler page:", error);
    // 503 rather than a generic 200 page: scrapers cache aggressively, and a
    // wrong preview cached for a transient database blip is worse than none.
    res.set("Cache-Control", "no-store");
    res.status(503).send("Service Unavailable");
  }
});

// @desc Crawler-facing version of the /dash/posts browse listing
// @route GET /og/posts
// @access Public
//
// The listing is the site's main crawl hub: before this existed, the only path
// a crawler had to a post was sitemap-posts.xml, with no page anywhere linking
// to one. A sitemap tells a crawler a URL exists; a linked listing tells it the
// URL matters.
router.get("/og/posts", async (req, res) => {
  const url = `${BASE_URL}/dash/posts`;

  try {
    const posts = await Post.find({ status: "active" })
      .select("_id categories category foundLost country city exactLocation mainDate returned cloudinaryUrl image createdAt")
      .populate("categories", "code labels")
      .populate("category", "code labels")
      .populate("foundLost", "code")
      .populate("country", "code names labels")
      .sort({ createdAt: -1 })
      .limit(LIST_LIMIT)
      .lean();

    const cityOf = await buildCityResolver(posts);
    const described = posts.map((post) => describePost(post, cityOf));

    const cards = described
      .map((info, index) => renderCard(info, thumbImage(posts[index])))
      .join("\n");

    const head = [
      `    <meta property="og:type" content="website" />`,
      `    <meta property="og:image" content="${LOGO}" />`,
      `    <meta name="twitter:image" content="${LOGO}" />`,
      jsonLd(
        breadcrumbSchema([
          { name: AR.home, url: `${BASE_URL}/` },
          { name: AR.posts, url },
        ])
      ),
      jsonLd({
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: AR.listTitle,
        description: AR.listDescription,
        url,
        inLanguage: "ar",
        isPartOf: { "@type": "WebSite", name: "Mafqoudat", url: BASE_URL },
        mainEntity: {
          "@type": "ItemList",
          // The count of what this page actually lists, not of the whole
          // database - the number has to describe the page it is on.
          numberOfItems: described.length,
          itemListElement: described.map((info, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: info.title,
            url: info.url,
          })),
        },
      }),
    ].join("\n");

    const body = `      <nav>
        <ul>
          <li><a href="${BASE_URL}/">${escapeHtml(AR.home)}</a></li>
        </ul>
      </nav>
      <h1>${escapeHtml(AR.listHeading)}</h1>
      <p>${escapeHtml(AR.listIntro)}</p>
${
  cards
    ? `      <ul class="cards">\n${cards}\n      </ul>`
    : `      <p>${escapeHtml(AR.listEmpty)}</p>`
}`;

    const html = renderDocument({
      title: AR.listTitle,
      description: AR.listDescription,
      canonical: url,
      head,
      body,
    });

    res.set("Content-Type", "text/html; charset=utf-8");
    res.set("Cache-Control", `public, max-age=${LIST_CACHE_SECONDS}, s-maxage=${LIST_CACHE_SECONDS}`);
    res.status(200).send(html);
  } catch (error) {
    console.error("Error rendering posts listing crawler page:", error);
    res.set("Cache-Control", "no-store");
    res.status(503).send("Service Unavailable");
  }
});

module.exports = router;
