/**
 * Reads the engagement numbers the server mirrors back from the Facebook Page
 * and Instagram account a listing was auto-posted to
 * (server/services/socialStatsService.js).
 *
 * Two rules shape everything here, both from the same instinct as the stat
 * boxes on the dashboard - never decorate real numbers with invented ones:
 *
 *  1. A missing number is not zero. Every counter is null until it has
 *     actually been fetched, so "not fetched yet", "no permission to read
 *     views" and "genuinely nobody reacted" stay three different states. Only
 *     the last of them is worth rendering.
 *  2. Site views and social views are never added together. They count
 *     different things (a page visit here versus an impression in someone's
 *     feed) and merging them would state a total nobody measured.
 */

const asCount = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : null);

/** Sum of the values that are actually known, or null if none are. */
const sumKnown = (values) => {
  const known = values.filter((value) => value !== null);
  return known.length > 0 ? known.reduce((total, value) => total + value, 0) : null;
};

const readPlatform = (stats, links, countKeys) => {
  const counts = {};
  countKeys.forEach((key) => { counts[key] = asCount(stats?.[key]); });

  return {
    ...counts,
    views: asCount(stats?.views),
    permalink: links?.permalink || null,
    // Interactions, not views: a reaction and an impression are not the same
    // unit and are never mixed into one number.
    interactions: sumKnown(countKeys.map((key) => counts[key])),
    // A post deleted off the Page keeps its last numbers, but there is nothing
    // to link to any more.
    unavailable: !!stats?.unavailable,
  };
};

/**
 * Normalizes a post's social numbers into something a component can render
 * without null-checking every field.
 */
export const summarizeSocialStats = (post) => {
  const facebook = readPlatform(
    post?.socialStats?.facebook,
    post?.social?.facebook,
    ['reactions', 'comments', 'shares']
  );
  const instagram = readPlatform(
    post?.socialStats?.instagram,
    post?.social?.instagram,
    ['likes', 'comments']
  );

  const interactions = sumKnown([facebook.interactions, instagram.interactions]);
  const socialViews = sumKnown([facebook.views, instagram.views]);

  return {
    facebook,
    instagram,
    interactions,
    socialViews,
    fetchedAt: post?.socialStats?.fetchedAt || null,
    // Whether there is anything at all worth showing. A listing whose copies
    // exist but have not been read back yet renders nothing rather than a row
    // of zeros.
    hasStats: interactions !== null || socialViews !== null,
  };
};

/** The site's own view counter, or null when the post predates view tracking. */
export const readSiteViews = (post) => asCount(post?.views);
