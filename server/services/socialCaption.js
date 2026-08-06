const FoundLost = require('../models/FoundLost');
const City = require('../models/City');
const Category = require('../models/Category');

const STATUS_EMOJI = {
  LOST: '🔴',
  FOUND: '🟢',
};

// Hashtags can't contain spaces or punctuation - strip both.
const toHashtag = (label) => label && `#${label.replace(/[\s'"،.,-]/g, '')}`;

/**
 * Shared by facebookService and instagramService - both post the same
 * listing content, just through different Graph API endpoints.
 */
async function buildListingCaption(post) {
  const primaryCategoryId = post.category || (post.categories && post.categories[0]);

  const [foundLost, city, category] = await Promise.all([
    FoundLost.findById(post.foundLost).select('code labels').lean(),
    post.city ? City.findById(post.city).select('labels').lean() : Promise.resolve(null),
    primaryCategoryId ? Category.findById(primaryCategoryId).select('labels').lean() : Promise.resolve(null),
  ]);

  const statusEmoji = STATUS_EMOJI[foundLost?.code] || '📢';
  const statusLabel = foundLost?.labels?.ar || '';
  const categoryLabel = category?.labels?.ar || '';
  const cityLabel = city?.labels?.ar || '';

  const heading = [
    `${statusEmoji} ${statusLabel}`,
    categoryLabel && `🏷️ ${categoryLabel}`,
    cityLabel && `📍 ${cityLabel}`,
  ].filter(Boolean).join('  |  ');

  const lines = [heading];

  if (post.description) lines.push(post.description);
  if (post.exactLocation) lines.push(`🧭 الموقع الدقيق: ${post.exactLocation}`);

  const postUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/dash/posts/${post._id}`;
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
