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
// are real per-language translations. Free text the user actually typed
// (exactLocation, mainDate, description) cannot be machine-translated
// reliably, so it repeats verbatim in every block; only the surrounding
// labels and "not provided" fallbacks are localized.
const LOCALES = ['ar', 'fr', 'en'];

// Matches client/src/utils/translations.js's "Post details translations"
// block (noDescriptionProvided/exactLocation/exactDate/etc.) so the caption
// reads the same as the site itself.
const LOCALE_TEXT = {
  ar: {
    lostVerb: 'فقدان',
    foundVerb: 'عثور على',
    inCountry: 'بدولة',
    inCity: (city) => ` في مدينة ${city}`,
    detailsHeading: 'التفاصيل :',
    exactLocationLabel: 'المكان بالتحديد',
    dateLabel: 'التاريخ بالتحديد',
    imageLabel: 'الصورة',
    descriptionHeading: 'الوصف :',
    contactHeading: 'للمزيد من المعلومات والتواصل :',
    notAvailable: 'غير متاح',
    noDescription: 'هذا المنشور لا يحتوي على وصف',
    footer: 'تم نشر هذا الإعلان بشكل أوتوماتيكي من خلال موقع مفقودات\nmafqoudat.com',
    listSeparator: '، ',
  },
  fr: {
    lostVerb: 'Perte de',
    foundVerb: 'Découverte de',
    inCountry: 'dans le pays',
    inCity: (city) => `, dans la ville de ${city}`,
    detailsHeading: 'Détails :',
    exactLocationLabel: 'Emplacement exact',
    dateLabel: 'Date exacte',
    imageLabel: 'Image',
    descriptionHeading: 'Description :',
    contactHeading: "Pour plus d'informations et contact :",
    notAvailable: 'Non disponible',
    noDescription: "Ce post n'a pas de description",
    footer: 'Cette annonce a été publiée automatiquement via le site Mafqoudat\nmafqoudat.com',
    listSeparator: ', ',
  },
  en: {
    lostVerb: 'Lost',
    foundVerb: 'Found',
    inCountry: 'in the country of',
    inCity: (city) => `, in the city of ${city}`,
    detailsHeading: 'Details:',
    exactLocationLabel: 'Exact Location',
    dateLabel: 'Exact Date',
    imageLabel: 'Image',
    descriptionHeading: 'Description:',
    contactHeading: 'For more information & contact:',
    notAvailable: 'Not available',
    noDescription: 'This post has no description',
    footer: 'This listing was posted automatically via the Mafqoudat website\nmafqoudat.com',
    listSeparator: ', ',
  },
};

const HEADER_EMOJI = { FOUND: '🟢', LOST: '🔴' };

// Missing-image notice: Arabic word, Arabic block only - it reads as
// broken embedded in an English/French sentence, so fr/en blocks omit
// the image line entirely rather than mixing scripts.
const IMAGE_NOT_AVAILABLE_TEXT = 'غير متاحة';

const BLOCK_DIVIDER = '➖➖➖➖➖➖➖➖➖➖';

// Instagram refuses a container carrying more than 30 hashtags. Facebook has
// no such rule, but one caption is built for both and 30 tags is already far
// past the point of diminishing returns, so the cap is applied either way.
const MAX_HASHTAGS = 30;

// What a shortened description ends with. Trimming is only ever reached on
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
 * `isPlaceholder` stays true either way: the listing still has no photo of the
 * item, and the caption has to keep saying so, or a reader would take the
 * category icon for the thing that was lost.
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
  const {
    statusCode, categoryLabel, countryLabel, cityLabel,
    exactLocation, mainDate, isPlaceholder, description, postUrl,
  } = data;

  const verb = statusCode === 'FOUND' ? t.foundVerb : t.lostVerb;
  const emoji = HEADER_EMOJI[statusCode] || '📢';
  const header = `${emoji} ${verb} ${categoryLabel} ${t.inCountry} ${countryLabel}${cityLabel ? t.inCity(cityLabel) : ''}`;

  const detailLines = [
    `📍 ${t.exactLocationLabel}: ${exactLocation || t.notAvailable}`,
    `📅 ${t.dateLabel}: ${mainDate || t.notAvailable}`,
    isPlaceholder && locale === 'ar' && `🖼️ ${t.imageLabel}: ${IMAGE_NOT_AVAILABLE_TEXT}`,
  ].filter(Boolean).join('\n');

  return [
    header,
    `${t.detailsHeading}\n\n${detailLines}`,
    `${t.descriptionHeading}\n${description || t.noDescription}`,
    `👉 ${t.contactHeading}\n${postUrl}`,
    t.footer,
  ].join('\n\n');
}

/**
 * Shared by facebookService and instagramService - both post the same
 * listing content, just through different Graph API endpoints.
 */
async function buildListingCaption(post, { isPlaceholder = false, maxLength = null } = {}) {
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

  // Caption is trilingual now, so the hashtags follow: one set per language
  // (city + every category), not just Arabic - a French or English reader
  // searching a hashtag should find the post too. A city/category whose
  // fr and en labels happen to be spelled the same (e.g. "Agadir") would
  // otherwise repeat the identical tag - a Set collapses that.
  const localizedHashtags = LOCALES.flatMap((locale) => [
    toHashtag(city?.labels?.[locale]),
    ...categories.map((c) => toHashtag(c.labels?.[locale])),
  ]);
  const hashtags = [...new Set([
    '#مفقودات',
    '#Mafqoudat',
    ...localizedHashtags.filter(Boolean),
  ])].slice(0, MAX_HASHTAGS).join(' ');

  const compose = (description) => {
    const blocks = LOCALES.map((locale) => buildLocaleBlock(locale, {
      statusCode,
      categoryLabel: categories.map((c) => c.labels?.[locale]).filter(Boolean).join(LOCALE_TEXT[locale].listSeparator),
      countryLabel: country?.names?.[locale] || '',
      cityLabel: city?.labels?.[locale] || '',
      exactLocation: post.exactLocation,
      mainDate: post.mainDate && post.mainDate.trim(),
      isPlaceholder,
      description,
      postUrl,
    }));

    return `${blocks.join(`\n\n${BLOCK_DIVIDER}\n\n`)}\n\n${hashtags}`;
  };

  const caption = compose(post.description);
  if (!maxLength || caption.length <= maxLength) return caption;

  // Over the platform's limit. The description is the elastic part and the
  // only one: the header says what was lost and where, the link is how anyone
  // acts on it, and the hashtags are how it is found - cutting the string at
  // its end would drop exactly those and keep the part a reader can already
  // see on the site. And the description is repeated verbatim in all three
  // language blocks (free text cannot be machine-translated reliably), so one
  // character saved here is three off the caption.
  //
  // Binary search rather than a fixed budget: how much room the description
  // has depends on the city, the country, the category list and the hashtags,
  // all of which vary by an order of magnitude between listings.
  const full = (post.description || '').trim();
  const shorten = (length) => (length > 0 ? `${full.slice(0, length).trimEnd()}${TRUNCATION_MARK}` : '');

  let low = 0;
  let high = full.length;
  let best = 0;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (compose(shorten(mid)).length <= maxLength) {
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  const trimmed = compose(shorten(best));

  // Even an empty description can overrun, given a maximum-length exact
  // location and date in every block. Nothing left to negotiate at that
  // point: a caption cut short still publishes, and a refused container
  // does not.
  return trimmed.length <= maxLength
    ? trimmed
    : `${trimmed.slice(0, maxLength - 1).trimEnd()}${TRUNCATION_MARK}`;
}

module.exports = { buildListingCaption, resolveListingImage };
