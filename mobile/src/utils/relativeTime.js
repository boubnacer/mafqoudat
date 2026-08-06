/**
 * Shared "posted X ago" formatter for post cards (home recent found/lost,
 * posts list, my posts, post detail). Previously copy-pasted per screen.
 *
 * English and French read fine from a single numeric template ("{count}h ago",
 * "il y a {count}h"), but Arabic doesn't: it has distinct singular, dual and
 * small-plural forms, so "منذ 1 ساعة" / "منذ 2 ساعة" are ungrammatical the way
 * "About 1 hour ago" is in English. The web app avoids this by going through
 * date-fns' `ar` locale; mobile has no date-fns dependency, so the same plural
 * categories are picked here and resolved against per-form translation keys.
 */

// CLDR plural categories for Arabic, mapped to the translation-key suffix each
// one uses. `many` (11-99) and `other` (100, 101, 102, ...) both take the plain
// numeric template, i.e. the base key with no suffix.
const arabicFormSuffix = (count) => {
  if (count === 1) return 'One';
  if (count === 2) return 'Two';
  const mod100 = count % 100;
  if (mod100 >= 3 && mod100 <= 10) return 'Few';
  return '';
};

// Only Arabic carries the One/Two/Few key variants - every other language
// resolves to its single base key.
const unitKey = (baseKey, count, language) =>
  language === 'ar' ? `${baseKey}${arabicFormSuffix(count)}` : baseKey;

export const formatRelativeTime = (dateString, t, language) => {
  const date = new Date(dateString);
  if (!dateString || isNaN(date.getTime())) return '';

  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return t('justNow');
  if (diffMin < 60) return t(unitKey('minutesAgo', diffMin, language), { count: diffMin });

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return t(unitKey('hoursAgo', diffHour, language), { count: diffHour });

  const diffDay = Math.floor(diffHour / 24);
  return t(unitKey('daysAgo', diffDay, language), { count: diffDay });
};

export default formatRelativeTime;
