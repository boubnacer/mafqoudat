// Dependency-free SEO prerender fallback.
//
// react-snap (Puppeteer) gives the fullest prerendering but is skipped on
// Vercel entirely (see postbuild.js) and may fail elsewhere too. This script
// needs no headless browser: it writes per-route static HTML files with
// correct <title>/meta/canonical/hreflang/OG/Twitter/JSON-LD, and for blog
// posts also injects the real article text into the initial HTML.
//
// It never overwrites a route react-snap already prerendered successfully
// (detected simply as: that route's build/<path>/index.html already exists)
// - so on non-Vercel builds where react-snap works, this only fills gaps
// (currently: nothing, once reactSnap.include covers the same routes); on
// Vercel, where react-snap never runs, this is the sole source of
// route-specific SEO output.
//
// Note on hydration safety: client/src/index.js uses ReactDOM.createRoot()
// (not hydrateRoot()), so injected content in #root is simply replaced when
// React mounts - there is no hydration-mismatch risk here.

const fs = require('fs');
const path = require('path');
const { STATIC_ROUTES } = require('./seoRoutes');

const BASE_URL = 'https://www.mafqoudat.com';
const BUILD_DIR = path.join(__dirname, '..', 'build');
const SHELL_PATH = path.join(BUILD_DIR, 'index.html');

const blogPosts = require('../src/data/blogPosts.json');

// English copy for static marketing pages, mirrored from src/utils/seoConfig.js
// pageSeoConfig (kept in sync manually - that file is ESM and can't be
// required from plain Node without a build step). SeoMeta.jsx does not
// localize title/description per language today, so English-only here
// matches actual runtime behavior, not a regression.
const STATIC_PAGE_SEO = {
  '/': {
    title: 'Mafqoudat - Lost and Found Platform | Morocco',
    description:
      'Reconnect with your belongings through Mafqoudat. Report lost items, browse found items, and collaborate with your community across Morocco and the Arab region.',
  },
  '/about': {
    title: 'About Mafqoudat | Lost and Found Community',
    description:
      'Learn about Mafqoudat’s mission to connect communities across Morocco and the Arab world to reunite lost items with their owners through a trusted platform.',
  },
  '/blog': {
    title: 'Mafqoudat Blog | Lost and Found Stories & Tips',
    description:
      'Explore Mafqoudat blog articles featuring success stories, prevention tips, and community updates about lost and found efforts in Morocco and beyond.',
  },
  '/contact': {
    title: 'Contact Mafqoudat | Support & Partnerships',
    description:
      'Need help with a lost or found item? Contact Mafqoudat for support, media inquiries, and partnership opportunities. We are here to help 24/7.',
  },
  '/help': {
    title: 'Help Center | Mafqoudat Lost and Found',
    description:
      'Get answers to common questions about Mafqoudat. Learn how to report lost items, verify found items, and stay safe while using our platform.',
  },
  '/guidelines': {
    title: 'Community Guidelines | Mafqoudat',
    description:
      'Read the Mafqoudat community guidelines to ensure a respectful and safe environment while helping people recover lost items across the region.',
  },
  '/safety': {
    title: 'Safety Tips | Mafqoudat',
    description:
      'Stay safe while meeting to exchange lost and found items. Mafqoudat shares best practices to protect yourself and ensure trustworthy interactions.',
  },
  '/privacy': {
    title: 'Privacy Policy | Mafqoudat',
    description:
      'Read the Mafqoudat privacy policy to understand how we protect your personal data and ensure security for everyone using our lost and found platform.',
  },
  '/terms': {
    title: 'Terms of Use | Mafqoudat',
    description:
      'Review the Mafqoudat terms of use for our lost and found services. Learn about user responsibilities, acceptable use, and platform guidelines.',
  },
  '/cookies': {
    title: 'Cookie Notice | Mafqoudat',
    description:
      'Understand how Mafqoudat uses cookies to improve your experience on our lost and found platform. Learn about your options and privacy settings.',
  },
};

const SUPPORTED_LANGUAGES = ['en', 'ar', 'fr'];
const LOCALE_MAP = { en: 'en_US', ar: 'ar_AR', fr: 'fr_FR' };

const escapeHtml = (value) =>
  String(value).replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&apos;',
    '"': '&quot;',
  }[char]));

// Everything this script injects that SeoMeta also renders at runtime carries
// data-rh="true". react-helmet-async only removes tags matching `[data-rh]`, so
// an untagged prerendered tag would sit in the document forever next to the
// Helmet-rendered one - two canonicals, two og:title, and so on. Tagging them
// lets Helmet reuse the identical ones and replace the rest, leaving exactly
// one of each. See the comment block in public/index.html.
const RH = 'data-rh="true"';

const buildHreflangLinks = (routePath) => {
  const links = SUPPORTED_LANGUAGES.map((lang) => {
    const url = `${BASE_URL}${routePath}?lang=${lang}`;
    return `    <link rel="alternate" hreflang="${lang}" href="${escapeHtml(url)}" ${RH} />`;
  });
  links.push(`    <link rel="alternate" hreflang="x-default" href="${escapeHtml(BASE_URL + routePath)}" ${RH} />`);
  return links.join('\n');
};

// The shell already carries generic og:image*/og:locale*/og:type tags (see
// public/index.html). Strip them before injecting route-specific values so a
// crawler never sees two conflicting og:image or og:locale pairs.
//
// The patterns match on the property name alone and end at the tag's closing
// bracket, rather than assuming `content="..." />` comes next: the shell's tags
// now carry a trailing data-rh attribute, which the stricter form silently
// failed to match. (The og:image:[a-z_]+ character class also has to allow the
// underscore in og:image:secure_url, which [a-z]+ never matched.)
const stripGenericOgTags = (html) =>
  html
    .replace(/<meta property="og:image"[^>]*>/g, '')
    .replace(/<meta property="og:image:[a-z_]+"[^>]*>/g, '')
    .replace(/<meta property="og:locale"[^>]*>/g, '')
    .replace(/<meta property="og:locale:alternate"[^>]*>/g, '')
    .replace(/<meta property="og:type"[^>]*>/g, '');

const buildHeadInjection = ({ routePath, title, description, image, structuredData, locale, ogType }) => {
  const canonicalUrl = `${BASE_URL}${routePath}`;
  const absoluteImage = image
    ? (image.startsWith('http') ? image : `${BASE_URL}${image}`)
    : `${BASE_URL}/maflogo1200-630.png`;
  const parts = [
    `    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" ${RH} />`,
    buildHreflangLinks(routePath),
    `    <meta property="og:type" content="${ogType || 'website'}" ${RH} />`,
    `    <meta property="og:locale" content="${LOCALE_MAP[locale] || LOCALE_MAP.en}" ${RH} />`,
    `    <meta property="og:title" content="${escapeHtml(title)}" ${RH} />`,
    `    <meta property="og:description" content="${escapeHtml(description)}" ${RH} />`,
    `    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" ${RH} />`,
    `    <meta property="og:image" content="${escapeHtml(absoluteImage)}" ${RH} />`,
    `    <meta name="twitter:title" content="${escapeHtml(title)}" ${RH} />`,
    `    <meta name="twitter:description" content="${escapeHtml(description)}" ${RH} />`,
    `    <meta name="twitter:image" content="${escapeHtml(absoluteImage)}" ${RH} />`,
  ];
  // Tagged like the meta above: the route components render the equivalent
  // schema through SeoMeta once React mounts (blog posts pass an Article +
  // breadcrumb pair, static pages get breadcrumbs from pageSeoConfig), so
  // without the attribute each page ended up with two BreadcrumbList blocks -
  // and blog posts with two BlogPosting. Helmet replaces the tagged ones.
  //
  // This only ever applies to routes this script writes. The shell's site-wide
  // WebSite/Organization blocks stay untagged and survive on every page,
  // including "/", which this script deliberately never rewrites.
  (structuredData || []).forEach((schema) => {
    parts.push(`    <script type="application/ld+json" ${RH}>${JSON.stringify(schema)}</script>`);
  });
  return parts.join('\n');
};

const createBreadcrumbSchema = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: `${BASE_URL}${item.path}`,
  })),
});

const createArticleSchema = (post, localized, routePath) => ({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: localized.title,
  description: localized.excerpt,
  image: `${BASE_URL}${post.image}`,
  url: `${BASE_URL}${routePath}`,
  mainEntityOfPage: `${BASE_URL}${routePath}`,
  datePublished: post.date,
  dateModified: post.date,
  inLanguage: 'ar',
  author: { '@type': 'Organization', name: 'Mafqoudat Team' },
  publisher: {
    '@type': 'Organization',
    name: 'Mafqoudat',
    logo: { '@type': 'ImageObject', url: `${BASE_URL}/maflogo1200-630.png` },
  },
});

const injectHead = (html, headAdditions) => html.replace('</head>', `${headAdditions}\n  </head>`);

const setTitle = (html, title) => html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);

const setDescription = (html, description) =>
  html.replace(
    /<meta name="description"[^>]*>/,
    `<meta name="description" content="${escapeHtml(description)}" ${RH} />`
  );

const writeRoute = (routePath, html) => {
  const outDir = path.join(BUILD_DIR, routePath);
  const outFile = path.join(outDir, 'index.html');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, html, 'utf8');
};

const alreadyPrerendered = (routePath) => fs.existsSync(path.join(BUILD_DIR, routePath, 'index.html'));

const renderArticleBody = (post, localized) => {
  const tagsHtml = post.tagKeys
    .map((key) => `<li>${escapeHtml(key)}</li>`)
    .join('');
  return `<div id="root"><main>
    <h1>${escapeHtml(localized.title)}</h1>
    <p>${escapeHtml(localized.excerpt)}</p>
    <img src="${escapeHtml(post.image)}" alt="${escapeHtml(localized.title)}" />
    <article><p>${escapeHtml(localized.content)}</p></article>
    <ul>${tagsHtml}</ul>
  </main></div>`;
};

const run = () => {
  if (!fs.existsSync(SHELL_PATH)) {
    console.log('prerenderSeo: build/index.html not found, skipping (did the CRA build run?)');
    return;
  }

  const shellHtml = fs.readFileSync(SHELL_PATH, 'utf8');
  let written = 0;
  let skipped = 0;

  // Static marketing/info pages: meta-only injection, English copy (matches
  // current SeoMeta.jsx behavior, which does not localize title/description).
  STATIC_ROUTES.forEach((route) => {
    if (route.path === '/') return; // root index.html is the shell itself, already correct
    if (alreadyPrerendered(route.path)) {
      skipped += 1;
      return;
    }
    const seo = STATIC_PAGE_SEO[route.path];
    if (!seo) return;

    let html = stripGenericOgTags(shellHtml);
    html = setTitle(html, `${seo.title}`);
    html = setDescription(html, seo.description);
    const headAdditions = buildHeadInjection({
      routePath: route.path,
      title: seo.title,
      description: seo.description,
      structuredData: [createBreadcrumbSchema([{ name: 'Home', path: '/' }, { name: seo.title, path: route.path }])],
      locale: 'en',
    });
    html = injectHead(html, headAdditions);
    writeRoute(route.path, html);
    written += 1;
  });

  // Blog post detail pages: meta + real visible article content, in Arabic
  // (the app's actual default language for a first-time visitor with no
  // stored preference - see src/utils/languageContext.js resolveLanguage()).
  blogPosts.forEach((post) => {
    const routePath = `/blog/${post.slug}`;
    if (alreadyPrerendered(routePath)) {
      skipped += 1;
      return;
    }
    const localized = post.i18n.ar;
    const title = `${localized.title} | Mafqoudat Blog`;

    let html = stripGenericOgTags(shellHtml);
    html = setTitle(html, title);
    html = setDescription(html, localized.excerpt);
    html = html.replace('<html lang="en">', '<html lang="ar" dir="rtl">');
    const headAdditions = buildHeadInjection({
      routePath,
      title,
      description: localized.excerpt,
      image: post.image,
      ogType: 'article',
      structuredData: [
        createArticleSchema(post, localized, routePath),
        createBreadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Blog', path: '/blog' },
          { name: localized.title, path: routePath },
        ]),
      ],
      locale: 'ar',
    });
    html = injectHead(html, headAdditions);
    html = html.replace('<div id="root"></div>', renderArticleBody(post, localized));
    writeRoute(routePath, html);
    written += 1;
  });

  console.log(`prerenderSeo: wrote ${written} route(s), skipped ${skipped} already-prerendered route(s)`);
};

module.exports = { run };

if (require.main === module) {
  run();
}
