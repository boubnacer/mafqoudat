const FoundLost = require('../models/FoundLost');
const City = require('../models/City');
const Category = require('../models/Category');
const Country = require('../models/Country');

// Matches the badge text in client/src/utils/translations.js (found/lost, ar)
// exactly - intentionally not FoundLost.labels.ar, which reads differently.
const STATUS_TEXT = {
  FOUND: { emoji: '✅', label: 'عثر عليه', dateLabel: 'التاريخ الذي تم العثور فيه على العنصر' },
  LOST: { emoji: '🔍', label: 'مفقود', dateLabel: 'التاريخ الذي فقد فيه العنصر' },
};

// Matches translations.js noDescriptionProvided (ar) - same fallback the
// post detail page shows for a missing description.
const NO_DESCRIPTION_TEXT = 'هذا المنشور لا يحتوي على وصف';

// City and exact date are the only genuinely optional fields on a post
// (country/category/type are schema-required, always present) - give them
// the same "shown, but says it's missing" treatment as the description.
const NOT_PROVIDED_TEXT = 'غير متوفر';

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

  const status = STATUS_TEXT[foundLost?.code] || { emoji: '📢', label: '', dateLabel: '' };
  const countryLabel = country?.names?.ar || '';
  const cityLabel = city?.labels?.ar || '';
  const categoryLabels = categories.map((c) => c.labels?.ar).filter(Boolean);
  const categoryLabel = categoryLabels.join('، ');

  const infoLines = [
    countryLabel && `🌍 الدولة: ${countryLabel}`,
    `📍 المدينة: ${cityLabel || NOT_PROVIDED_TEXT}`,
    post.exactLocation && `🧭 الموقع الدقيق: ${post.exactLocation}`,
    categoryLabel && `🏷️ الفئة: ${categoryLabel}`,
    status.label && `${status.emoji} النوع: ${status.label}`,
    `🗓️ ${status.dateLabel || 'التاريخ'}: ${(post.mainDate && post.mainDate.trim()) || NOT_PROVIDED_TEXT}`,
    isPlaceholder && '🖼️ الصورة: هذا المنشور لا يحتوي على صورة',
  ].filter(Boolean).join('\n');

  const lines = [infoLines, post.description || NO_DESCRIPTION_TEXT];

  const siteUrl = process.env.CLIENT_URL || 'https://mafqoudat.com';
  const postUrl = `${siteUrl}/dash/posts/${post._id}`;
  lines.push(`👉 التفاصيل والتواصل: ${postUrl}`);

  const hashtags = [
    '#مفقودات',
    '#Mafqoudat',
    toHashtag(cityLabel),
    ...categoryLabels.map(toHashtag),
  ].filter(Boolean).join(' ');
  lines.push(hashtags);

  return lines.join('\n\n');
}

module.exports = { buildListingCaption, resolveListingImage };
