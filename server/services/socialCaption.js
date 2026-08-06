const FoundLost = require('../models/FoundLost');
const City = require('../models/City');

/**
 * Shared by facebookService and instagramService - both post the same
 * listing content, just through different Graph API endpoints.
 */
async function buildListingCaption(post) {
  const [foundLost, city] = await Promise.all([
    FoundLost.findById(post.foundLost).select('labels').lean(),
    post.city ? City.findById(post.city).select('labels').lean() : Promise.resolve(null),
  ]);

  const foundLostLabel = foundLost?.labels?.en || '';
  const cityLabel = city?.labels?.en || '';
  const heading = cityLabel ? `${foundLostLabel} — ${cityLabel}` : foundLostLabel;

  const lines = [heading];
  if (post.description) lines.push(post.description);
  if (post.exactLocation) lines.push(post.exactLocation);
  return lines.join('\n\n');
}

module.exports = { buildListingCaption };
