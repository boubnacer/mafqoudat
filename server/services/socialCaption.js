const FoundLost = require('../models/FoundLost');
const City = require('../models/City');
const Category = require('../models/Category');
const Country = require('../models/Country');
const DocumentType = require('../models/DocumentType');
const { ensureSocialImage } = require('./socialImageService');
const { generateCategoryImage, isAvailable: dynamicImageAvailable } = require('./dynamicCategoryImage');
const { cloudinary } = require('../config/cloudinary');

// ---------------------------------------------------------------- constants

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
    exactlyAt: '، تحديداً في :',
    contactHeading: 'للمزيد من المعلومات والتواصل :',
    listSeparator: '، ',
    ownerHeading: 'الاسم على الوثيقة',
  },
  fr: {
    lostVerb: 'Perte de',
    foundVerb: 'Découverte de',
    inCountry: 'dans le pays',
    inCity: (city) => `, dans la ville de ${city}`,
    exactlyAt: ', exactement à :',
    contactHeading: "Pour plus d'informations et contact :",
    listSeparator: ', ',
    ownerHeading: 'Nom figurant sur le document',
  },
  en: {
    lostVerb: 'Lost',
    foundVerb: 'Found',
    inCountry: 'in the country of',
    inCity: (city) => `, in the city of ${city}`,
    exactlyAt: ', exactly at:',
    contactHeading: 'For more information & contact:',
    listSeparator: ', ',
    ownerHeading: 'Name on the document',
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
 * plain text (Facebook, for visual consistency with IG). The graphic is
 * generated dynamically from the listing's own categories: a single-category
 * post gets that category's pale background with its icon centred in the
 * accent colour; a multi-category post splits the background diagonally
 * between the categories' pale colours with the icons side by side, each in
 * its own accent colour.
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
const DYNAMIC_IMAGE_FOLDER = 'mafqoudat/social-categories';

/** Uploads a JPEG buffer to Cloudinary and returns the secure_url. */
function uploadDynamicImage(buffer, publicId) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: 'image',
        format: 'jpg',
        overwrite: true,
        invalidate: true,
        transformation: [],
      },
      (error, result) => (error ? reject(error) : resolve(result)),
    );
    stream.end(buffer);
  });
}

/**
 * Removes the dynamic category image from Cloudinary once social posts
 * are published.
 */
async function deleteDynamicCategoryImage(post) {
  const postId = post?._id || post;
  if (!postId) return;
  try {
    const publicId = `${DYNAMIC_IMAGE_FOLDER}/${postId}`;
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.warn(`Dynamic category image cleanup failed for ${postId}: ${error.message}`);
  }
}

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

  // Collect all category IDs from the post
  const categoryIds = (post.categories && post.categories.length > 0)
    ? post.categories
    : (post.category ? [post.category] : []);

  // Fetch category codes
  const categories = categoryIds.length > 0
    ? await Category.find({ _id: { $in: categoryIds } }).select('code').lean()
    : [];

  const categoryCodes = categories.map((c) => c.code).filter(Boolean);

  // Dynamic generation
  if (dynamicImageAvailable()) {
    try {
      const buffer = await generateCategoryImage(categoryCodes);
      if (buffer) {
        // Deterministic public_id so re-publishing the same post reuses the
        // same Cloudinary slot rather than creating a new one each time.
        const sortedCodes = (categoryCodes.length > 0 ? [...categoryCodes].sort() : ['other']).join('-').toLowerCase();
        const publicId = `${DYNAMIC_IMAGE_FOLDER}/${post._id || sortedCodes}`;

        const result = await uploadDynamicImage(buffer, publicId);
        return { imageUrl: result.secure_url, isPlaceholder: true };
      }
    } catch (error) {
      console.warn(
        `Dynamic category image generation failed for post ${post._id}: ${error.message}. `
        + 'Falling back to generic placeholder image.'
      );
    }
  }

  // Fallback: use generic placeholder image
  const siteUrl = process.env.CLIENT_URL || 'https://mafqoudat.com';
  return {
    imageUrl: `${siteUrl}/no-image-placeholder.jpg`,
    isPlaceholder: true,
  };
}

const DOCUMENTS_CATEGORY_CODE = 'DOCUMENTS';
const LRM = '\u200E';
const RLM = '\u200F';

function getCountryFlag(country) {
  if (country?.flag) return country.flag;
  if (country?.code && country.code.length === 2) {
    const code = country.code.toUpperCase();
    return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
  }
  return '';
}

function buildLocaleBlock(locale, data) {
  const t = LOCALE_TEXT[locale];
  const {
    statusCode,
    categoryLabel,
    ownerName,
    countryFlag,
    countryLabel,
    cityLabel,
    exactLocation,
    postUrl,
  } = data;

  // Social platforms (IG/FB) determine text direction per paragraph from its
  // first strong character. Since the post begins with Arabic, emojis (neutral)
  // at the start of French/English lines would otherwise inherit RTL alignment
  // and flip punctuation/parentheses. Injecting LRM (\u200E) at the start of
  // Latin lines locks each paragraph into Left-To-Right direction.
  const isRTL = locale === 'ar';
  const mark = isRTL ? RLM : LRM;

  const verb = statusCode === 'FOUND' ? t.foundVerb : t.lostVerb;
  const emoji = HEADER_EMOJI[statusCode] || '📢';
  const flagPrefix = countryFlag ? `${countryFlag} ` : '';
  const categoryClause = categoryLabel ? `${categoryLabel} ` : '';

  let locationText = '';
  if (cityLabel) {
    locationText += t.inCity(cityLabel);
  }
  if (exactLocation) {
    locationText += `${t.exactlyAt}\n${mark}📍 ${exactLocation}`;
  }

  const header = `${mark}${flagPrefix}${emoji} ${verb} ${categoryClause}${t.inCountry} ${countryLabel}${locationText}${mark}`;

  // And the name written on them, which is what its owner recognises the
  // listing by - the same reason the site itself asks for it. Only ever
  // present on a documents listing, so no other caption gains a line.
  const ownerLine = ownerName ? `${mark}👤 ${t.ownerHeading}: ${ownerName}${mark}` : null;

  const contactLine = `${mark}👉 ${t.contactHeading}\n${LRM}${postUrl}`;

  return [header, ownerLine, contactLine]
    .filter(Boolean)
    .join('\n\n\n');
}

/**
 * Shared by facebookService and instagramService - both post the same
 * listing content, just through different Graph API endpoints.
 */
async function buildListingCaption(post, { maxLength = null } = {}) {
  const rawCategoryIds = (post.categories && post.categories.length > 0)
    ? post.categories
    : (post.category ? [post.category] : []);
  const categoryIds = rawCategoryIds.map((c) => (c && typeof c === 'object' && c._id ? c._id : c));

  const documentTypeIds = Array.isArray(post.documentTypes) ? post.documentTypes : [];

  const [foundLost, city, categories, country, documentTypes] = await Promise.all([
    FoundLost.findById(post.foundLost).select('code').lean(),
    post.city ? City.findById(post.city).select('labels').lean() : Promise.resolve(null),
    categoryIds.length > 0 ? Category.find({ _id: { $in: categoryIds } }).select('labels code').lean() : Promise.resolve([]),
    post.country ? Country.findById(post.country).select('names flag code').lean() : Promise.resolve(null),
    documentTypeIds.length > 0
      ? DocumentType.find({ _id: { $in: documentTypeIds } }).select('labels').lean()
      : Promise.resolve([]),
  ]);

  // Rendered in the order the author picked them, which a $in query does not
  // preserve - the same re-walk the detail read does.
  const orderedDocumentTypes = documentTypeIds
    .map((id) => documentTypes.find((documentType) => String(documentType._id) === String(id)))
    .filter(Boolean);
  const ownerNameAr = (post.documentOwnerName?.ar || '').trim();
  const ownerNameLatin = (post.documentOwnerName?.latin || '').trim();

  const orderedCategories = categoryIds
    .map((id) => categories.find((c) => c && String(c._id || c.id) === String(id)))
    .filter(Boolean);
  const activeCategories = (orderedCategories.length === categories.length && orderedCategories.length > 0)
    ? orderedCategories
    : categories;

  // Identify the Documents category: by its contract code 'DOCUMENTS', or falling
  // back to the single/last category if the listing carries document types.
  const isDocCategory = (category) => (
    String(category?.code || '').toUpperCase() === DOCUMENTS_CATEGORY_CODE
  );
  let docIndex = activeCategories.findIndex(isDocCategory);
  if (docIndex === -1 && orderedDocumentTypes.length > 0 && activeCategories.length > 0) {
    docIndex = activeCategories.length - 1;
  }

  // When there are multiple categories and one is Documents, Documents must be
  // the last one in the caption.
  let sortedCategories = activeCategories;
  let docCategory = null;
  if (docIndex !== -1) {
    docCategory = activeCategories[docIndex];
    if (activeCategories.length > 1) {
      sortedCategories = [
        ...activeCategories.filter((_, idx) => idx !== docIndex),
        docCategory,
      ];
    }
  }

  const countryFlag = getCountryFlag(country);
  const cleanExactLocation = (post.exactLocation || '').replace(/[\r\n]+/g, ' ').trim();

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
    ...sortedCategories.map((c) => toHashtag(c.labels?.[locale])),
  ]).filter(Boolean);
  const allHashtags = [...new Set([...SEED_HASHTAGS, ...localizedHashtags])].slice(0, MAX_HASHTAGS);

  const blocks = LOCALES.map((locale) => {
    const t = LOCALE_TEXT[locale];
    const docLabels = orderedDocumentTypes
      .map((documentType) => documentType.labels?.[locale] || documentType.labels?.en)
      .filter(Boolean);
    const docClause = docLabels.length > 0
      ? ` (${docLabels.join(t.listSeparator)})`
      : '';

    // The document type names go in parentheses right after the Documents category:
    // "Lost Keys, Documents (passport, driving licence)" instead of appending after all categories.
    const categoryParts = sortedCategories.map((c) => {
      const label = c.labels?.[locale] || c.labels?.en || '';
      if (!label) return '';
      return c === docCategory ? `${label}${docClause}` : label;
    }).filter(Boolean);

    const categoryLabel = categoryParts.join(t.listSeparator);

    return buildLocaleBlock(locale, {
      statusCode,
      categoryLabel,
      // Each block gets the name in its own script, falling back to the other
      // one when only that was written - an Arabic block with a Latin name still
      // beats no name at all on a listing whose photo nobody will ever see.
      ownerName: orderedDocumentTypes.length > 0
        ? (locale === 'ar' ? (ownerNameAr || ownerNameLatin) : (ownerNameLatin || ownerNameAr))
        : '',
      countryFlag,
      countryLabel: country?.names?.[locale] || '',
      cityLabel: city?.labels?.[locale] || '',
      exactLocation: cleanExactLocation,
      postUrl,
    });
  });
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

module.exports = { buildListingCaption, resolveListingImage, deleteDynamicCategoryImage };
