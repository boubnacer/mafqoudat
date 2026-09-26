/**
 * Shared date formatting & parsing utilities for post event dates (mainDate / exactDate).
 *
 * Stored server-side as free text with spelled-out month names (or legacy numeric formats).
 * These helpers allow parsing any stored date and reformatting it dynamically into the
 * viewer's active language (English, French, or Moroccan Arabic 'ar-MA').
 */

export const DATE_LOCALES = { en: 'en-US', fr: 'fr-FR', ar: 'ar-MA' };

// Explicit Gregorian month names for each supported language.
// Arabic strictly uses the Maghrebi Gregorian month names (ar-MA: ماي/يوليوز/غشت/شتنبر/نونبر/دجنبر).
export const MONTH_NAMES = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'ماي', 'يونيو', 'يوليوز', 'غشت', 'شتنبر', 'أكتوبر', 'نونبر', 'دجنبر'],
};

// Legacy Arabic month names (Mashriqi) - only used when parsing/reading older posts, never when formatting.
export const LEGACY_AR_MONTH_NAMES = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

export const MIN_YEAR = 1900;

export const getMonthNames = (language) => {
  return MONTH_NAMES[language] || MONTH_NAMES.en;
};

export const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();

/**
 * Formats a { day, month, year } object into a readable date string.
 * For Arabic, strictly outputs the current Arabic month format (ar-MA).
 */
export const formatDateValue = ({ day, month, year }, language) => {
  const monthName = getMonthNames(language)[month];
  if (!day) return `${monthName} ${year}`;
  if (language === 'en') return `${monthName} ${day}, ${year}`;
  return `${day} ${monthName} ${year}`;
};

/**
 * Normalizes Latin accents, Arabic diacritics, and hamza variants for resilient matching.
 */
const fold = (str) =>
  String(str)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036F]/g, '')
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '')
    .replace(/[آأإٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه');

const FOLDED_MONTH_TABLES = [
  // en
  MONTH_NAMES.en.map(fold),
  // fr
  MONTH_NAMES.fr.map(fold),
  // ar-MA (current)
  MONTH_NAMES.ar.map(fold),
  // ar legacy (Mashriqi)
  LEGACY_AR_MONTH_NAMES.map(fold),
];

/**
 * Best-effort parser for any date string previously saved into Post.mainDate / exactDate.
 * Handles English, French, Moroccan Arabic (ar-MA), legacy Mashriqi Arabic, ISO (YYYY-MM-DD),
 * and slashed (DD/MM/YYYY) formats.
 *
 * Returns { day: number | null, month: number, year: number } or null if unparseable.
 */
export const parseDateValue = (value) => {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  // 1. ISO date: YYYY-MM-DD or YYYY-MM
  const isoMatch = /^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$/.exec(trimmed);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]) - 1;
    const day = isoMatch[3] ? Number(isoMatch[3]) : null;
    if (month >= 0 && month <= 11) return { day, month, year };
  }

  // 2. Slashed date: DD/MM/YYYY
  const slashedMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
  if (slashedMatch) {
    const day = Number(slashedMatch[1]);
    const month = Number(slashedMatch[2]) - 1;
    const year = Number(slashedMatch[3]);
    if (month >= 0 && month <= 11) return { day, month, year };
  }

  // 3. Spelled-out month names (EN, FR, AR-MA, AR-LEGACY) with Latin or Arabic-Indic digits
  const folded = fold(trimmed).replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
  const yearMatch = folded.match(/\b(\d{4})\b/);
  if (!yearMatch) return null;
  const year = Number(yearMatch[1]);

  let month = null;
  for (const table of FOLDED_MONTH_TABLES) {
    for (let i = 0; i < table.length; i++) {
      if (folded.includes(table[i])) {
        month = i;
        break;
      }
    }
    if (month !== null) break;
  }
  if (month === null) return null;

  // Standalone 1-2 digit number left over is the day
  const dayMatch = folded.replace(yearMatch[0], ' ').match(/\b(\d{1,2})\b/);
  const day = dayMatch ? Number(dayMatch[1]) : null;

  return { day, month, year };
};

/**
 * Formats a saved mainDate/exactDate string for display in the active UI language.
 * If the date can be parsed, returns it formatted in the target language.
 * If the date is unparseable or empty, returns the original value safely.
 */
export const formatDisplayDate = (value, language) => {
  if (!value || typeof value !== 'string') return '';
  const parsed = parseDateValue(value);
  if (!parsed) return value;
  return formatDateValue(parsed, language);
};
