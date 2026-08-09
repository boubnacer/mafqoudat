/**
 * Presentation helpers shared by every mobile surface that renders a lost/found
 * match (the notifications inbox, the post-detail matches section).
 * Mirrors: client/src/features/notifications/matchDisplay.js
 *
 * The server sends stable codes - `tier`, `reasons` - and never user-facing
 * text, so all wording resolves through translations.js here.
 */

/** Confidence band -> translation key. The band leads; the number is detail. */
export const TIER_LABEL_KEYS = {
  strong: 'matchTierStrong',
  good: 'matchTierGood',
  possible: 'matchTierPossible',
};

/**
 * Colour for a confidence band, drawn from the existing status tokens rather
 * than a new palette: a strong match is the same "act on this" green as a found
 * post, a weak one is neutral ink.
 */
export const getTierTone = (tokens, isDark, tier) => {
  if (tier === 'strong') return { main: tokens.status.found.main, bg: tokens.status.found.bg };
  if (tier === 'good') {
    return {
      main: tokens.brandPrimary,
      bg: `${tokens.brandPrimary}${isDark ? '29' : '1A'}`,
    };
  }
  return { main: `${tokens.ink}99`, bg: `${tokens.ink}${isDark ? '1F' : '0F'}` };
};

/** Reason code -> translation key. Unknown codes are skipped, never shown raw. */
export const REASON_LABEL_KEYS = {
  same_category: 'matchReasonSameCategory',
  same_city: 'matchReasonSameCity',
  nearby_location: 'matchReasonNearbyLocation',
  close_dates: 'matchReasonCloseDates',
  similar_description: 'matchReasonSimilarDescription',
  shared_reference: 'matchReasonSharedReference',
};

/** Reason code -> Ionicons glyph. */
export const REASON_ICONS = {
  same_category: 'pricetag-outline',
  same_city: 'location-outline',
  nearby_location: 'navigate-outline',
  close_dates: 'calendar-outline',
  similar_description: 'document-text-outline',
  shared_reference: 'barcode-outline',
};

/**
 * "Same day" / "1 day apart" / "12 days apart", or null when unknown.
 *
 * Arabic needs distinct singular, dual and small-plural forms here for exactly
 * the reason utils/relativeTime.js documents - "1 يوم" reads as wrong as
 * "1 days" would - so those CLDR categories get their own keys instead of one
 * numeric template. Every other language resolves to the single base key.
 */
export const formatDaysApart = (daysApart, t, language) => {
  if (daysApart === null || daysApart === undefined) return null;
  if (daysApart <= 0) return t('matchSameDay');

  if (language === 'ar') {
    if (daysApart === 1) return t('matchOneDayApart');
    if (daysApart === 2) return t('matchTwoDaysApart');
    const mod100 = daysApart % 100;
    if (mod100 >= 3 && mod100 <= 10) return t('matchDaysApartFew', { days: daysApart });
    return t('matchDaysApart', { days: daysApart });
  }

  if (daysApart === 1) return t('matchOneDayApart');
  return t('matchDaysApart', { days: daysApart });
};

/**
 * Headline for a match, written from the reader's point of view: what matters
 * is what the *other* listing is, relative to the one they posted.
 */
export const getMatchHeadlineKey = (ownFoundLostCode) => (
  String(ownFoundLostCode).toUpperCase() === 'LOST'
    ? 'notifMatchHeadlineForLost'
    : 'notifMatchHeadlineForFound'
);

/** Joins a match's city and free-text location into one meta line. */
export const formatMatchLocation = (post) => (
  [post?.cityLabel, post?.exactLocation].filter(Boolean).join(' · ')
);
