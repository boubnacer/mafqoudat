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

// Hashtags can't contain spaces or punctuation - strip both.
const toHashtag = (label) => label && `#${label.replace(/[\s'"،.,-]/g, '')}`;

/**
 * Shared by facebookService and instagramService - both post the same
 * listing content, just through different Graph API endpoints.
 */
async function buildListingCaption(post) {
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
    cityLabel && `📍 المدينة: ${cityLabel}`,
    post.exactLocation && `🧭 الموقع الدقيق: ${post.exactLocation}`,
    categoryLabel && `🏷️ الفئة: ${categoryLabel}`,
    status.label && `${status.emoji} النوع: ${status.label}`,
    // Matches the post detail page: the date row only appears when set.
    post.mainDate && post.mainDate.trim() && `🗓️ ${status.dateLabel}: ${post.mainDate}`,
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

module.exports = { buildListingCaption };
