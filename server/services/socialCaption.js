const FoundLost = require('../models/FoundLost');
const City = require('../models/City');
const Category = require('../models/Category');
const Country = require('../models/Country');
const { categorySocialImagePath } = require('../config/categorySocialImages');
const { ensureSocialImage } = require('./socialImageService');

// One post, one caption, three stacked language blocks (ar/fr/en) separated
// by a divider - there is no per-post language field to pick just one, and
// the Facebook Page / Instagram account serve the whole en/fr/ar audience.
// Country/city/category names come from their own DB `labels`/`names`
// (already fetched in full below, not projected to one language), so those
// are real per-language translations. Each block is just a header line (what
// was lost/found, category, country, city) and a link back to the listing -
// the exact location, date, description and a "posted automatically" footer
// used to fill this out too, but were cut on request: none of that is
// something a reader searches by, and it only pushed the link and the
// hashtags further down the post.
const LOCALES = ['ar', 'fr', 'en'];

// Matches client/src/utils/translations.js's "Post details translations"
// block (exactLocation/exactDate/etc.) so the header reads the same as the
// site itself. The caption is intentionally just a header + contact line per
// language now - the exact-location/date/description/footer lines that used
// to fill this out were cut on request: they repeated free text nobody
// searches by and pushed the link (the one actionable part of the post) and
// the hashtags (how it's found) further down the feed card.
const LOCALE_TEXT = {
  ar: {
    lostVerb: 'فقدان',
    foundVerb: 'عثور على',
    inCountry: 'بدولة',
    inCity: (city) => ` في مدينة ${city}`,
    contactHeading: 'للمزيد من المعلومات والتواصل :',
    listSeparator: '، ',
  },
  fr: {
    lostVerb: 'Perte de',
    foundVerb: 'Découverte de',
    inCountry: 'dans le pays',
    inCity: (city) => `, dans la ville de ${city}`,
    contactHeading: "Pour plus d'informations et contact :",
    listSeparator: ', ',
  },
  en: {
    lostVerb: 'Lost',
    foundVerb: 'Found',
    inCountry: 'in the country of',
    inCity: (city) => `, in the city of ${city}`,
    contactHeading: 'For more information & contact:',
    listSeparator: ', ',
  },
};

const HEADER_EMOJI = { FOUND: '🟢', LOST: '🔴' };

const BLOCK_DIVIDER = '➖➖➖➖➖➖➖➖➖➖';

// Instagram refuses a container carrying more than 30 hashtags. Facebook has
// no such rule, but one caption is built for both and 30 tags is already far
// past the point of diminishing returns, so the cap is applied either way.
const MAX_HASHTAGS = 30;

// Fixed SEO tags on every post, in addition to the per-post city/category
// ones below - drawn from the same vocabulary the site's own SEO copy uses
// (seoDefaultRegion / defaultSeo.title in seoConfig.js: "lost and found
// platform", "Morocco and the Arab world"), so a search on any of these
// general terms in ar/fr/en lands on the Page/account too, not just a search
// for one city or category.
const SEED_HASHTAGS = [
  '#مفقودات', '#Mafqoudat',
  '#مفقود', '#موجودات', '#مفقودين', '#العثور_على_مفقودات', '#المغرب', '#الوطن_العربي',
  '#LostAndFound', '#Lost', '#Found', '#Missing', '#Morocco',
  '#ObjetsPerdus', '#ObjetsTrouvés', '#PersonnesDisparues', '#Maroc',
];

// What a hard-truncated caption ends with, in the rare case even zero
// hashtags don't bring it under the limit. Trimming is only ever reached on
// Instagram, whose caption limit the caller passes in.
const TRUNCATION_MARK = '…';

// Hashtags can't contain spaces or punctuation - strip both.
const toHashtag = (label) => label && `#${label.replace(/[\s'"،.,-]/g, '')}`;

/**
 * A post without an uploaded image still posts with a branded graphic instead
 * of being skipped (Instagram has no text-only post type) or falling back to
 * plain text (Facebook, for visual consistency with IG). The graphic is the
 * one for the listing's own category - a lost phone goes up with the phone
 * icon - which says something about the item at a glance, unlike the generic
 * placeholder that graphic family started as.
 *
 * `isPlaceholder` stays true either way: the listing still has no photo of
 * the item. It no longer changes the caption text (that per-locale "no photo"
 * line was cut along with the rest of the details section - see LOCALE_TEXT),
 * but is kept on the return value in case a future caller needs to tell a
 * real photo from a category graphic.
 *
 * The category read is its own query rather than a share of the one
 * buildListingCaption makes - one indexed point read on a path that already
 * waits on several Graph calls, and publishing is paced at one post per
 * SOCIAL_QUEUE_MIN_INTERVAL_SECONDS anyway.
 */
async function resolveListingImage(post) {
  const imageUrl = post.cloudinaryUrl || post.image;
  if (imageUrl) {
    // The listing's own photo goes up watermarked with the domain, so a
    // reader who meets it in a feed - or two shares further on, with the
    // caption long gone - can still see where it came from. Only this copy
    // carries the mark; the site keeps rendering the clean photo. A listing
    // with no id is not a stored post (the offline checks pass plain
    // objects), and a mark that could not be made answers null, in which case
    // the plain photo is published rather than nothing.
    const watermarked = post._id ? await ensureSocialImage(post) : null;
    return { imageUrl: watermarked || imageUrl, isPlaceholder: false };
  }

  const categoryId = (post.categories && post.categories.length > 0)
    ? post.categories[0]
    : post.category;

  const category = categoryId
    ? await Category.findById(categoryId).select('code').lean()
    : null;

  const siteUrl = process.env.CLIENT_URL || 'https://mafqoudat.com';
  return {
    imageUrl: `${siteUrl}/${categorySocialImagePath(category?.code)}`,
    isPlaceholder: true,
  };
}

function buildLocaleBlock(locale, data) {
  const t = LOCALE_TEXT[locale];
  const { statusCode, categoryLabel, countryLabel, cityLabel, postUrl } = data;

  const verb = statusCode === 'FOUND' ? t.foundVerb : t.lostVerb;
  const emoji = HEADER_EMOJI[statusCode] || '📢';
  const header = `${emoji} ${verb} ${categoryLabel} ${t.inCountry} ${countryLabel}${cityLabel ? t.inCity(cityLabel) : ''}`;

  return [header, `👉 ${t.contactHeading}\n${postUrl}`].join('\n\n\n');
}

/**
 * Shared by facebookService and instagramService - both post the same
 * listing content, just through different Graph API endpoints.
 */
async function buildListingCaption(post, { maxLength = null } = {}) {
  const categoryIds = (post.categories && post.categories.length > 0)
    ? post.categories
    : (post.category ? [post.category] : []);

  const [foundLost, city, categories, country] = await Promise.all([
    FoundLost.findById(post.foundLost).select('code').lean(),
    post.city ? City.findById(post.city).select('labels').lean() : Promise.resolve(null),
    categoryIds.length > 0 ? Category.find({ _id: { $in: categoryIds } }).select('labels').lean() : Promise.resolve([]),
    post.country ? Country.findById(post.country).select('names').lean() : Promise.resolve(null),
  ]);

  const statusCode = foundLost?.code;
  const siteUrl = process.env.CLIENT_URL || 'https://mafqoudat.com';
  const postUrl = `${siteUrl}/dash/posts/${post._id}`;

  // Caption is trilingual, so the per-post hashtags follow: one set per
  // language (city + every category), not just Arabic - a French or English
  // reader searching a hashtag should find the post too. A city/category
  // whose fr and en labels happen to be spelled the same (e.g. "Agadir")
  // would otherwise repeat the identical tag - a Set collapses that. These
  // sit after the fixed SEED_HASHTAGS so a trim (below) drops the specific
  // ones before the general-reach ones.
  const localizedHashtags = LOCALES.flatMap((locale) => [
    toHashtag(city?.labels?.[locale]),
    ...categories.map((c) => toHashtag(c.labels?.[locale])),
  ]).filter(Boolean);
  const allHashtags = [...new Set([...SEED_HASHTAGS, ...localizedHashtags])].slice(0, MAX_HASHTAGS);

  const blocks = LOCALES.map((locale) => buildLocaleBlock(locale, {
    statusCode,
    categoryLabel: categories.map((c) => c.labels?.[locale]).filter(Boolean).join(LOCALE_TEXT[locale].listSeparator),
    countryLabel: country?.names?.[locale] || '',
    cityLabel: city?.labels?.[locale] || '',
    postUrl,
  }));
  const body = blocks.join(`\n\n${BLOCK_DIVIDER}\n\n`);

  const compose = (tags) => (tags.length ? `${body}\n\n\n${tags.join(' ')}` : body);

  const caption = compose(allHashtags);
  if (!maxLength || caption.length <= maxLength) return caption;

  // Over the platform's limit. With no free-text description in the caption
  // anymore, the hashtags are the only elastic part left - the header says
  // what was lost/found and where, and the link is how anyone acts on it, so
  // cutting the string at its end would drop exactly those. Binary search how
  // many tags fit, dropping from the end of the list (the per-post
  // city/category tags) before the fixed brand/SEO ones at the front.
  let low = 0;
  let high = allHashtags.length;
  let best = 0;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (compose(allHashtags.slice(0, mid)).length <= maxLength) {
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  const trimmed = compose(allHashtags.slice(0, best));

  // Even zero hashtags can overrun, given long enough category/city names in
  // every block. Nothing left to negotiate at that point: a caption cut
  // short still publishes, and a refused container does not.
  return trimmed.length <= maxLength
    ? trimmed
    : `${trimmed.slice(0, maxLength - 1).trimEnd()}${TRUNCATION_MARK}`;
}

module.exports = { buildListingCaption, resolveListingImage };
