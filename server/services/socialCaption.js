const FoundLost = require('../models/FoundLost');
const City = require('../models/City');
const Category = require('../models/Category');
const Country = require('../models/Country');

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
    dateLabel: 'التاريخ الدقيق',
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

// Deliberately not translated (see buildLocaleBlock) - the user asked for
// this exact Arabic word in every language block, unlike every other
// "not provided" fallback which is localized per block.
const IMAGE_NOT_AVAILABLE_TEXT = 'غير متاحة';

const BLOCK_DIVIDER = '➖➖➖➖➖➖➖➖➖➖';

// Hashtags can't contain spaces or punctuation - strip both.
const toHashtag = (label) => label && `#${label.replace(/[\s'"،.,-]/g, '')}`;

/**
 * A post without an uploaded image still posts with this branded graphic
 * instead of being skipped (Instagram has no text-only post type) or
 * falling back to plain text (Facebook, for visual consistency with IG).
 */
function resolveListingImage(post) {
  const imageUrl = post.cloudinaryUrl || post.image;
  if (imageUrl) return { imageUrl, isPlaceholder: false };

  const siteUrl = process.env.CLIENT_URL || 'https://mafqoudat.com';
  return { imageUrl: `${siteUrl}/no-image-placeholder.png`, isPlaceholder: true };
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
    isPlaceholder && `🖼️ ${t.imageLabel}: ${IMAGE_NOT_AVAILABLE_TEXT}`,
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
async function buildListingCaption(post, { isPlaceholder = false } = {}) {
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

  const blocks = LOCALES.map((locale) => buildLocaleBlock(locale, {
    statusCode,
    categoryLabel: categories.map((c) => c.labels?.[locale]).filter(Boolean).join(LOCALE_TEXT[locale].listSeparator),
    countryLabel: country?.names?.[locale] || '',
    cityLabel: city?.labels?.[locale] || '',
    exactLocation: post.exactLocation,
    mainDate: post.mainDate && post.mainDate.trim(),
    isPlaceholder,
    description: post.description,
    postUrl,
  }));

  const categoryLabelsAr = categories.map((c) => c.labels?.ar).filter(Boolean);
  const hashtags = [
    '#مفقودات',
    '#Mafqoudat',
    toHashtag(city?.labels?.ar),
    ...categoryLabelsAr.map(toHashtag),
  ].filter(Boolean).join(' ');

  return `${blocks.join(`\n\n${BLOCK_DIVIDER}\n\n`)}\n\n${hashtags}`;
}

module.exports = { buildListingCaption, resolveListingImage };
