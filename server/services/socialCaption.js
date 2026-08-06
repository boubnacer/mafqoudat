const FoundLost = require('../models/FoundLost');
const City = require('../models/City');
const Category = require('../models/Category');
const Country = require('../models/Country');

// Matches the badge text in client/src/utils/translations.js (found/lost, ar)
// exactly - intentionally not FoundLost.labels.ar, which reads differently.
const STATUS_TEXT = {
  FOUND: { emoji: '✅', label: 'عثر عليه' },
  LOST: { emoji: '🔍', label: 'مفقود' },
};

// Hashtags can't contain spaces or punctuation - strip both.
const toHashtag = (label) => label && `#${label.replace(/[\s'"،.,-]/g, '')}`;

/**
 * Shared by facebookService and instagramService - both post the same
 * listing content, just through different Graph API endpoints.
 */
async function buildListingCaption(post) {
  const primaryCategoryId = post.category || (post.categories && post.categories[0]);

  const [foundLost, city, category, country] = await Promise.all([
    FoundLost.findById(post.foundLost).select('code').lean(),
    post.city ? City.findById(post.city).select('labels').lean() : Promise.resolve(null),
    primaryCategoryId ? Category.findById(primaryCategoryId).select('labels').lean() : Promise.resolve(null),
    post.country ? Country.findById(post.country).select('names').lean() : Promise.resolve(null),
  ]);

  const status = STATUS_TEXT[foundLost?.code] || { emoji: '📢', label: '' };
  const countryLabel = country?.names?.ar || '';
  const cityLabel = city?.labels?.ar || '';
  const categoryLabel = category?.labels?.ar || '';

  const infoLines = [
    countryLabel && `🌍 الدولة: ${countryLabel}`,
    cityLabel && `📍 المدينة: ${cityLabel}`,
    post.exactLocation && `🧭 الموقع الدقيق: ${post.exactLocation}`,
    categoryLabel && `🏷️ الفئة: ${categoryLabel}`,
    status.label && `${status.emoji} النوع: ${status.label}`,
  ].filter(Boolean).join('\n');

  const lines = [infoLines];

  if (post.description) lines.push(post.description);

  const siteUrl = process.env.CLIENT_URL || 'https://mafqoudat.com';
  const postUrl = `${siteUrl}/dash/posts/${post._id}`;
  lines.push(`👉 التفاصيل والتواصل: ${postUrl}`);

  const hashtags = [
    '#مفقودات',
    '#Mafqoudat',
    toHashtag(cityLabel),
    toHashtag(categoryLabel),
  ].filter(Boolean).join(' ');
  lines.push(hashtags);

  return lines.join('\n\n');
}

module.exports = { buildListingCaption };
