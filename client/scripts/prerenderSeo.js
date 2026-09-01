// Dependency-free SEO prerender fallback.
//
// react-snap (Puppeteer) gives the fullest prerendering but is skipped on
// Vercel entirely (see postbuild.js) and may fail elsewhere too. This script
// needs no headless browser: it writes per-route static HTML files with
// correct <title>/meta/canonical/OG/Twitter/JSON-LD, and injects the route's
// real <h1> (and, for blog posts, the full article text) into the initial HTML.
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
//
// Everything injected is in Arabic, because Arabic is what a first-time
// visitor with no stored preference actually gets (languageContext's
// resolveLanguage returns 'ar'), and a crawler never has a stored preference.
// The pages used to be prerendered with English titles on top of a page that
// renders in Arabic, which is a mismatch a searcher sees the moment they click.

const fs = require('fs');
const path = require('path');
const { STATIC_ROUTES } = require('./seoRoutes');
const { loadTranslations, translator } = require('./loadTranslations');

const BASE_URL = 'https://www.mafqoudat.com';
const BUILD_DIR = path.join(__dirname, '..', 'build');
const SHELL_PATH = path.join(BUILD_DIR, 'index.html');

const blogPosts = require('../src/data/blogPosts.json');

// The brand as it is written in the language these pages are prerendered in.
const BRAND_AR = 'مفقودات';

// What each static route needs, and nothing that is written twice.
//
// `pageKey` points into translations.js's `seoPages` block - the same object
// SeoMeta reads at runtime - so the <title> a crawler gets from this script and
// the one Helmet sets a moment later are the same string by construction. They
// used to be two hand-maintained copies, and had already drifted into
// prerendering Arabic and then re-rendering English over it.
//
// `h1Key`/`subKey` name the translation keys the page component itself passes
// to t(), so the injected heading is the same string React will render. That is
// what keeps this on the right side of the cloaking line - the crawler is shown
// the page's own heading, just already assembled. If a page's heading changes,
// the key here is what has to be repointed; the copy follows automatically.
const STATIC_PAGE_SEO = {
  // WelcomePage.jsx renders t('heroHeadline') as its h1, then
  // t('welcomeMessage') under it.
  '/': { pageKey: 'home', h1Key: 'heroHeadline', subKey: 'welcomeMessage' },
  '/about': { pageKey: 'about', h1Key: 'aboutUs', subKey: 'reunitingCommunities' },
  '/blog': { pageKey: 'blog', h1Key: 'blog', subKey: 'blogSubtitle' },
  '/contact': { pageKey: 'contact', h1Key: 'contactUs', subKey: 'getInTouch' },
  '/help': { pageKey: 'help', h1Key: 'helpCenter', subKey: 'helpCenterSubtitle' },
  '/guidelines': { pageKey: 'guidelines', h1Key: 'communityGuidelines', subKey: null },
  // SafetyTips.jsx renders {t('staySafeWhileUsing')} followed by the literal
  // brand name, so the injected h1 has to carry it too.
  '/safety': { pageKey: 'safety', h1Key: 'staySafeWhileUsing', h1Suffix: ' Mafqoudat', subKey: null },
  '/privacy': { pageKey: 'privacy', h1Key: 'privacyPolicy', subKey: null },
  '/terms': { pageKey: 'terms', h1Key: 'termsOfUse', subKey: null },
  '/cookies': { pageKey: 'cookies', h1Key: 'cookieNotice', subKey: null },
  // No h1Key: Dash.js is a panel layout with no single page heading, and
  // inventing one here would put text on the page React never renders. Meta
  // only - the point of prerendering this route is that it stops answering with
  // the homepage's markup, not that it gains copy.
  '/dash': { pageKey: 'dash', h1Key: null, subKey: null },
};

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

// No hreflang here, deliberately.
//
// This used to emit <link rel="alternate" hreflang="ar|fr|en"> pointing at
// ?lang=xx variants of the same path - while the canonical on every one of
// those variants pointed back at the bare URL. Google discards an hreflang
// cluster whose members canonicalise elsewhere, so the tags bought nothing and
// spent crawl budget on three extra URLs per page. The site has one URL per
// page and switches language client-side; until there are genuinely distinct
// localised URLs (/ar/..., /fr/...) with self-referencing canonicals, the
// honest markup is a single canonical and no alternates.
const buildHeadInjection = ({ routePath, title, description, image, structuredData, locale, ogType }) => {
  const canonicalUrl = `${BASE_URL}${routePath}`;
  const absoluteImage = image
    ? (image.startsWith('http') ? image : `${BASE_URL}${image}`)
    : `${BASE_URL}/maflogo1200-630.png`;
  const parts = [
    `    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" ${RH} />`,
    `    <meta property="og:type" content="${ogType || 'website'}" ${RH} />`,
    `    <meta property="og:locale" content="${locale === 'ar' ? 'ar_AR' : 'en_US'}" ${RH} />`,
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
  // WebSite/Organization blocks stay untagged and survive on every page.
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

// The `content=` in the pattern is load-bearing, not decoration.
//
// public/index.html carries an explanatory comment above the real tag that
// contains the literal text `<meta name="description">` (it is explaining why
// the page must not end up with two of them). String#replace takes the FIRST
// match, and that comment sits earlier in the file - so the looser
// /<meta name="description"[^>]*>/ rewrote the text inside the comment and left
// the actual tag alone. Every prerendered route shipped the generic site
// description as a result, silently, while the <title> beside it was correct.
// Requiring a content attribute makes the pattern match a real tag only.
const setDescription = (html, description) =>
  html.replace(
    /<meta name="description"[^>]*content=[^>]*>/,
    `<meta name="description" content="${escapeHtml(description)}" ${RH} />`
  );

// Matches the opening tag whatever attributes it currently carries, rather than
// the literal '<html lang="en">' this used to look for - the shell now ships
// lang="ar" dir="rtl" itself, and a literal match would have silently stopped
// applying the moment that changed.
const setHtmlLang = (html, lang, dir) =>
  html.replace(/<html[^>]*>/, `<html lang="${lang}"${dir ? ` dir="${dir}"` : ''}>`);

const writeRoute = (routePath, html) => {
  const outDir = path.join(BUILD_DIR, routePath);
  const outFile = path.join(outDir, 'index.html');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, html, 'utf8');
};

// '/' is the shell itself, which always exists - checking the filesystem for it
// would report every build as already prerendered and skip the homepage.
const alreadyPrerendered = (routePath) =>
  routePath !== '/' && fs.existsSync(path.join(BUILD_DIR, routePath, 'index.html'));

// A static page's initial markup: its own heading, its own subtitle where it
// has one, and the site's real navigation so a crawler arriving here has links
// to follow. React replaces all of it on mount.
const renderStaticBody = (heading, subtitle, t) => {
  const nav = [
    ['/', 'goHome'],
    ['/dash/posts', 'posts'],
    ['/blog', 'blog'],
    ['/about', 'aboutUs'],
    ['/help', 'helpCenter'],
    ['/safety', 'safetyTips'],
    ['/contact', 'contactUs'],
  ]
    .map(([href, key]) => {
      const label = t(key) || key;
      return `<li><a href="${BASE_URL}${href}">${escapeHtml(label)}</a></li>`;
    })
    .join('');

  return `<div id="root"><main>
    <h1>${escapeHtml(heading)}</h1>
${subtitle ? `    <p>${escapeHtml(subtitle)}</p>\n` : ''}    <nav><ul>${nav}</ul></nav>
  </main></div>`;
};

const renderArticleBody = (post, localized, t) => {
  const tagsHtml = post.tagKeys
    .map((key) => `<li>${escapeHtml(key)}</li>`)
    .join('');
  // The two links out are new: an article that linked nowhere left a crawler
  // that arrived from search with no route into the listings the article is
  // about.
  return `<div id="root"><main>
    <h1>${escapeHtml(localized.title)}</h1>
    <p>${escapeHtml(localized.excerpt)}</p>
    <img src="${escapeHtml(post.image)}" alt="${escapeHtml(localized.title)}" />
    <article><p>${escapeHtml(localized.content)}</p></article>
    <ul>${tagsHtml}</ul>
    <nav><ul>
      <li><a href="${BASE_URL}/blog">${escapeHtml(t('blog') || 'Blog')}</a></li>
      <li><a href="${BASE_URL}/dash/posts">${escapeHtml(t('posts') || 'Posts')}</a></li>
    </ul></nav>
  </main></div>`;
};

const run = () => {
  if (!fs.existsSync(SHELL_PATH)) {
    console.log('prerenderSeo: build/index.html not found, skipping (did the CRA build run?)');
    return;
  }

  const shellHtml = fs.readFileSync(SHELL_PATH, 'utf8');

  // Both the meta and the body copy come from the app's own translation table.
  // If it ever stops parsing, the static routes are left alone rather than
  // written with half their content - the shell's own tags are a worse page
  // than the previous build's, but a page with a heading and no title, or a
  // title in the wrong language, is worse still. Blog posts read from
  // blogPosts.json and are unaffected.
  let t = () => '';
  let seoPages = null;
  try {
    t = translator('ar');
    seoPages = loadTranslations().ar.seoPages || null;
  } catch (error) {
    console.error('prerenderSeo: could not read translations:', error.message);
  }

  let written = 0;
  let skipped = 0;

  STATIC_ROUTES.forEach((route) => {
    if (alreadyPrerendered(route.path)) {
      skipped += 1;
      return;
    }
    const seo = STATIC_PAGE_SEO[route.path];
    if (!seo) return;

    const copy = seoPages && seoPages[seo.pageKey];
    if (!copy || !copy.title || !copy.description) {
      console.error(`prerenderSeo: no seoPages copy for "${seo.pageKey}" (${route.path}), skipping`);
      return;
    }

    let html = stripGenericOgTags(shellHtml);
    html = setHtmlLang(html, 'ar', 'rtl');
    html = setTitle(html, copy.title);
    html = setDescription(html, copy.description);

    // No breadcrumb on '/': it is the root of the trail, and a one-item
    // BreadcrumbList pointing at itself says nothing.
    const breadcrumbs =
      route.path === '/'
        ? null
        : createBreadcrumbSchema([
            { name: t('goHome') || 'Home', path: '/' },
            { name: copy.title.split('|')[0].trim(), path: route.path },
          ]);

    html = injectHead(
      html,
      buildHeadInjection({
        routePath: route.path,
        title: copy.title,
        description: copy.description,
        structuredData: breadcrumbs ? [breadcrumbs] : [],
        locale: 'ar',
      })
    );

    const heading = seo.h1Key ? `${t(seo.h1Key)}${seo.h1Suffix || ''}`.trim() : '';
    const subtitle = seo.subKey ? t(seo.subKey) : '';
    if (heading) {
      html = html.replace('<div id="root"></div>', renderStaticBody(heading, subtitle, t));
    }

    writeRoute(route.path, html);
    written += 1;
  });

  // Blog post detail pages: meta + real visible article content, in Arabic.
  blogPosts.forEach((post) => {
    const routePath = `/blog/${post.slug}`;
    if (alreadyPrerendered(routePath)) {
      skipped += 1;
      return;
    }
    const localized = post.i18n.ar;
    const title = `${localized.title} | ${BRAND_AR}`;

    let html = stripGenericOgTags(shellHtml);
    html = setHtmlLang(html, 'ar', 'rtl');
    html = setTitle(html, title);
    html = setDescription(html, localized.excerpt);
    const headAdditions = buildHeadInjection({
      routePath,
      title,
      description: localized.excerpt,
      image: post.image,
      ogType: 'article',
      structuredData: [
        createArticleSchema(post, localized, routePath),
        createBreadcrumbSchema([
          { name: t('goHome') || 'Home', path: '/' },
          { name: t('blog') || 'Blog', path: '/blog' },
          { name: localized.title, path: routePath },
        ]),
      ],
      locale: 'ar',
    });
    html = injectHead(html, headAdditions);
    html = html.replace('<div id="root"></div>', renderArticleBody(post, localized, t));
    writeRoute(routePath, html);
    written += 1;
  });

  console.log(`prerenderSeo: wrote ${written} route(s), skipped ${skipped} already-prerendered route(s)`);
};

module.exports = { run };

if (require.main === module) {
  run();
}
