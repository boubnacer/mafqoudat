/**
 * Formatting shared by every admin page.
 *
 * All of it goes through the reader's own locale, so a date, a number and a
 * relative time are written the way the rest of the app writes them - the old
 * panel called `toLocaleDateString()` with no locale at all, which answers the
 * browser's language rather than the one the admin picked, and read
 * `labels.en` for every category and city no matter what language the panel
 * was in.
 */

const localeFor = (language) => (language === 'ar' ? 'ar' : language === 'fr' ? 'fr' : 'en');

export const formatDate = (value, language = 'en') => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(localeFor(language), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (value, language = 'en') => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(localeFor(language), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatNumber = (value, language = 'en') =>
  Number(value || 0).toLocaleString(localeFor(language));

/**
 * How long ago, in words. Falls back to a date past a week, because "23 days
 * ago" is harder to place than the date itself.
 */
export const formatRelative = (value, language = 'en', t) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return t('justNow');
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t('minutesAgoShort', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('hoursAgoShort', { count: hours });
  const days = Math.floor(hours / 24);
  if (days <= 7) return t('daysAgoShort', { count: days });
  return formatDate(value, language);
};

/**
 * A localized label off a `{ labels: { en, fr, ar } }` / `{ names: {...} }`
 * document, falling back through English to the code rather than rendering
 * "undefined" - which is what the panel's tables did for a city whose Arabic
 * label was missing.
 */
export const labelOf = (doc, language = 'en', fallback = '') => {
  if (!doc) return fallback;
  const lang = localeFor(language);
  return (
    doc.labels?.[lang] ||
    doc.names?.[lang] ||
    doc.labels?.en ||
    doc.names?.en ||
    doc.code ||
    fallback
  );
};

/** A listing has no title; it is named by its description. */
export const postTitle = (post, fallback = '') => {
  const text = (post?.postLabel || post?.description || post?.exactLocation || '').trim();
  return text || fallback;
};

export const truncate = (text, length = 90) => {
  const value = String(text || '');
  return value.length > length ? `${value.slice(0, length - 1)}…` : value;
};
