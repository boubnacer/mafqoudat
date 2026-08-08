// Per-post SEO metadata derivation.
//
// Post detail pages are the platform's long-tail search surface ("lost
// passport casablanca", "objet trouvé rabat"), but they are rendered entirely
// from API data, so nothing about them can be baked into the build-time
// prerender the way blog posts are. This module turns a post payload into the
// title / description / image / keywords / JSON-LD that SeoMeta renders into
// the document head at runtime.
//
// It deliberately re-derives found/lost, category, city and country from the
// raw post rather than importing SinglePostPage's memoized values: the SEO
// tags have to be correct even in render paths where that component's display
// logic isn't involved, and keeping this dependency-free makes it testable.

import {
  buildAbsoluteUrl,
  createBreadcrumbSchema,
  defaultKeywords,
  defaultSeo,
} from './seoConfig';
import { getOptimizedImageUrl } from './cloudinaryUtils';

// Google truncates around 155-160 characters; staying under keeps the whole
// sentence visible in the result snippet.
const MAX_DESCRIPTION_LENGTH = 160;

// Google renders roughly 60-70 characters of a title before eliding it.
const MAX_TITLE_LENGTH = 70;

const collapseWhitespace = (value) =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';

// Truncate on a word boundary so snippets never end mid-word.
const truncate = (value, maxLength) => {
  const text = collapseWhitespace(value);
  if (text.length <= maxLength) return text;
  const clipped = text.slice(0, maxLength - 1);
  const lastSpace = clipped.lastIndexOf(' ');
  const body = lastSpace > maxLength * 0.6 ? clipped.slice(0, lastSpace) : clipped;
  return `${body.replace(/[\s,.;:،؛-]+$/, '')}…`;
};

// Every seoPostTitle* template ends in " | <brand>" (the brand itself is
// localized, so match on the separator rather than the word).
const stripBrandSuffix = (title) => {
  const separator = title.lastIndexOf('|');
  if (separator === -1) return title;
  return collapseWhitespace(title.slice(0, separator)) || title;
};

const pickLabel = (labels, language) => {
  if (!labels || typeof labels !== 'object') return '';
  return collapseWhitespace(labels[language] || labels.en || labels.fr || labels.ar);
};

/**
 * Resolve a post's FOUND/LOST code, mirroring the priority order
 * SinglePostPage uses: the populated Floptions lookup first, then the raw
 * foundLost reference. Returns 'FOUND', 'LOST' or null (never guesses from
 * free text - a wrong status in a <title> is worse than an unlabelled one).
 */
export const resolveFoundLostCode = (post) => {
  if (!post) return null;

  const { Floptions, foundLost } = post;

  const fromOption = Array.isArray(Floptions) ? Floptions[0] : Floptions;
  const optionCode = fromOption && typeof fromOption === 'object' ? fromOption.code : null;
  if (optionCode === 'FOUND' || optionCode === 'LOST') return optionCode;

  if (foundLost && typeof foundLost === 'object' && foundLost.code) {
    const code = String(foundLost.code).toUpperCase();
    if (code === 'FOUND' || code === 'LOST') return code;
  }

  // A 24-char value is a raw ObjectId the server didn't populate - unresolvable
  // here, so fall through to null rather than inventing a status.
  if (typeof foundLost === 'string' && foundLost.length !== 24) {
    const code = foundLost.toUpperCase();
    if (code === 'FOUND' || code === 'LOST') return code;
  }

  return null;
};

/** Localized category names, newest (Categories array) format first. */
export const resolvePostCategoryLabels = (post, language) => {
  if (!post) return [];

  const fromArray = Array.isArray(post.Categories)
    ? post.Categories.map((cat) => pickLabel(cat?.labels, language) || collapseWhitespace(cat?.code))
    : [];
  const labels = fromArray.filter(Boolean);
  if (labels.length) return labels;

  const legacy = post.Category
    ? pickLabel(post.Category.labels, language) || collapseWhitespace(post.Category.code)
    : '';
  if (legacy) return [legacy];

  const name = collapseWhitespace(post.categoryname);
  return name ? [name] : [];
};

/** Localized city name, falling back through the API's city shapes. */
export const resolvePostCityLabel = (post, language) => {
  if (!post) return '';

  const fromLabels = pickLabel(post.cityLabels, language);
  if (fromLabels) return fromLabels;

  if (post.city && typeof post.city === 'object') {
    const fromCity = pickLabel(post.city.labels, language) || collapseWhitespace(post.city.code);
    if (fromCity) return fromCity;
  }

  const cityName = collapseWhitespace(post.cityName);
  if (cityName) return cityName;

  if (typeof post.city === 'string') {
    const city = collapseWhitespace(post.city);
    if (city) return city;
  }

  // exactLocation is free text like "Maarif, Casablanca" - the leading segment
  // is the closest thing to a city we have left.
  const location = collapseWhitespace(post.exactLocation);
  if (location) return collapseWhitespace(location.split(',')[0].split('(')[0]);

  return '';
};

/** Localized country name. */
export const resolvePostCountryLabel = (post, language) => {
  if (!post) return '';
  return pickLabel(post.countryLabels, language) || collapseWhitespace(post.countryname);
};

/**
 * Absolute, crawler-friendly image URL. Cloudinary originals get resized to
 * the 1200px 'detail' variant so social crawlers aren't handed a multi-MB
 * file; legacy relative upload paths resolve against the site origin, which
 * proxies /uploads/* through to the API host.
 */
export const resolvePostImage = (post) => {
  const raw = collapseWhitespace(post?.image);
  if (!raw) return defaultSeo.image;
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return getOptimizedImageUrl(raw, 'detail') || raw;
  }
  return buildAbsoluteUrl(raw.startsWith('/') ? raw : `/${raw}`);
};

/** Canonical path for a post detail page. */
export const buildPostPath = (postId) => `/dash/posts/${postId}`;

/**
 * Build everything SeoMeta needs for a single post.
 *
 * @param {object}   options.post     Post payload as returned by GET /posts/:id
 * @param {string}   options.language Active UI language ('en' | 'fr' | 'ar')
 * @param {function} options.t        Translator from useTranslation()
 */
export const buildPostSeo = ({ post, language = 'en', t }) => {
  const translate = typeof t === 'function' ? t : (key) => key;

  const code = resolveFoundLostCode(post);
  const categoryLabels = resolvePostCategoryLabels(post, language);
  const cityLabel = resolvePostCityLabel(post, language);
  const countryLabel = resolvePostCountryLabel(post, language);

  // A post with neither a category nor a city has nothing distinguishing to
  // say, and "Unknown Category in Unknown Location" is a worse title than the
  // site default - fall back rather than publish filler.
  if (!categoryLabels.length && !cityLabel) {
    return {
      title: defaultSeo.title,
      description: defaultSeo.description,
      keywords: defaultKeywords,
      image: resolvePostImage(post),
      path: buildPostPath(post?._id),
      // Explicitly empty rather than omitted: SeoMeta falls back to the
      // site-wide WebSite/SearchAction schema when this is undefined, and that
      // one belongs on the homepage, not on a post detail page.
      structuredData: [],
      noindex: post?.status === 'suspended',
    };
  }

  const item = categoryLabels.join(', ') || translate('unknownCategory');
  const city = cityLabel || translate('unknownLocation');
  // Never "the lost and found platform in Mafqoudat": with no country on the
  // post, name the region the platform actually covers.
  const country = countryLabel || translate('seoDefaultRegion');

  const titleKey =
    code === 'FOUND'
      ? 'seoPostTitleFound'
      : code === 'LOST'
        ? 'seoPostTitleLost'
        : 'seoPostTitleUnknown';
  const descriptionKey =
    code === 'FOUND'
      ? 'seoPostDescFound'
      : code === 'LOST'
        ? 'seoPostDescLost'
        : 'seoPostDescUnknown';

  // Trim the (variable-length) category rather than the whole line, so a long
  // category name can't push the brand suffix off the end of the title.
  const composeTitle = (itemText) => translate(titleKey, { item: itemText, city });
  let title = composeTitle(item);
  if (title.length > MAX_TITLE_LENGTH) {
    const overflow = title.length - MAX_TITLE_LENGTH;
    title = composeTitle(truncate(item, Math.max(12, item.length - overflow)));
  }
  title = truncate(title, MAX_TITLE_LENGTH);
  // The templated sentence (not the raw user description) is the meta
  // description: it is guaranteed well-formed in all three languages and
  // always carries the status + item + city + country terms people search for.
  // The user's own wording is unique content, so it goes into the JSON-LD
  // below, where there is no length budget to fight over.
  const description = truncate(
    translate(descriptionKey, { item, city, country }),
    MAX_DESCRIPTION_LENGTH
  );

  const path = buildPostPath(post?._id);
  const canonicalUrl = buildAbsoluteUrl(path);
  const image = resolvePostImage(post);
  const userDescription = collapseWhitespace(post?.description);

  const statusKeyword = code === 'FOUND' ? translate('found') : code === 'LOST' ? translate('lost') : '';
  const keywords = Array.from(
    new Set(
      [...categoryLabels, cityLabel, countryLabel, statusKeyword, ...defaultKeywords].filter(Boolean)
    )
  );

  const itemPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemPage',
    name: title,
    description,
    url: canonicalUrl,
    inLanguage: language,
    isPartOf: {
      '@type': 'WebSite',
      name: defaultSeo.siteName,
      url: buildAbsoluteUrl('/'),
    },
    mainEntity: {
      '@type': 'Thing',
      name: item,
      ...(userDescription ? { description: userDescription } : {}),
      ...(post?.image ? { image } : {}),
    },
  };

  if (post?.createdAt) itemPageSchema.datePublished = post.createdAt;
  if (post?.updatedAt || post?.createdAt) {
    itemPageSchema.dateModified = post.updatedAt || post.createdAt;
  }
  if (post?.image) {
    itemPageSchema.primaryImageOfPage = { '@type': 'ImageObject', url: image };
  }
  if (cityLabel) {
    itemPageSchema.contentLocation = {
      '@type': 'Place',
      name: cityLabel,
      ...(countryLabel
        ? {
            address: {
              '@type': 'PostalAddress',
              addressLocality: cityLabel,
              addressCountry: countryLabel,
            },
          }
        : {}),
    };
  }

  const structuredData = [
    itemPageSchema,
    createBreadcrumbSchema([
      { name: defaultSeo.siteName, path: '/' },
      { name: translate('posts'), path: '/dash/posts' },
      // Breadcrumb trails show the page's place in the site, so the brand
      // suffix the <title> carries would just repeat the first crumb.
      { name: stripBrandSuffix(title), path },
    ]),
  ];

  return {
    title,
    description,
    keywords,
    image,
    path,
    structuredData,
    // Only moderation-suspended posts are hidden from search. Resolved and
    // expired posts keep their long-tail value and stay indexed.
    noindex: post?.status === 'suspended',
  };
};

export default buildPostSeo;
