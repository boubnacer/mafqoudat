import { formatDistanceToNow } from 'date-fns';
import { ar, fr, enUS } from 'date-fns/locale';

/**
 * Presentation helpers shared by every surface that renders a lost/found match
 * (the navbar bell, the notifications page, the post-detail panel).
 *
 * The server sends stable codes - `tier`, `reasons` - and never user-facing
 * text, so all of the wording lives here and goes through translations.js.
 */

const DATE_LOCALES = { en: enUS, fr, ar };

export const getDateLocale = (language) => DATE_LOCALES[language] || enUS;

/** "3 days ago" in the reader's language; empty string on an unusable value. */
export const formatRelativeTime = (value, language) => {
  if (!value) return '';
  try {
    return formatDistanceToNow(new Date(value), {
      addSuffix: true,
      locale: getDateLocale(language),
    });
  } catch (error) {
    return '';
  }
};

/**
 * Confidence band -> translation key. The band is what the UI leads with; the
 * numeric score is secondary detail for people who want it.
 */
export const TIER_LABEL_KEYS = {
  strong: 'matchTierStrong',
  good: 'matchTierGood',
  possible: 'matchTierPossible',
};

/**
 * Colour for a confidence band, drawn from the existing status tokens rather
 * than a new palette: a strong match is the same "resolved, act on this" green
 * as a found post, a weak one is neutral ink.
 */
export const getTierTone = (theme, tier) => {
  if (tier === 'strong') return theme.custom.status.found;
  if (tier === 'good') return {
    main: theme.custom.color.brandPrimary,
    bg: theme.palette.mode === 'dark'
      ? 'rgba(91, 127, 255, 0.16)'
      : 'rgba(27, 77, 255, 0.10)',
    border: theme.custom.color.brandPrimary,
  };
  return {
    main: theme.palette.text.secondary,
    bg: theme.palette.mode === 'dark'
      ? 'rgba(237, 239, 245, 0.10)'
      : 'rgba(11, 18, 32, 0.06)',
    border: theme.palette.text.secondary,
  };
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

/**
 * "Same day" / "1 day apart" / "12 days apart", or null when unknown.
 *
 * Arabic has distinct singular, dual and small-plural forms, so "بفارق 2 يومًا"
 * is as ungrammatical as "2 day apart" would be in English. Those CLDR
 * categories get their own keys; every other language resolves to the single
 * numeric template. Mirrors the same split in the mobile app's copy of this
 * helper and in client's own date handling.
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
