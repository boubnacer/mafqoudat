/**
 * Reads Post.mainDate, which is deliberately stored as free text.
 *
 * The client writes it through DateEntryDialog.formatDateValue: a spelled-out
 * Gregorian month name in the UI language plus Latin digits, e.g.
 * "March 5, 2026" / "5 mars 2026" / "5 مارس 2026". Month names are matched in
 * all three site languages (plus the Mashriqi Arabic set used before the
 * switch to ar-MA) because the author may have changed language since posting.
 *
 * The tables are hard-coded rather than derived from Intl so the parser
 * behaves identically regardless of the ICU data shipped with the runtime.
 */

const MONTH_NAMES = {
  en: ['january', 'february', 'march', 'april', 'may', 'june', 'july',
    'august', 'september', 'october', 'november', 'december'],
  fr: ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin', 'juillet',
    'aout', 'septembre', 'octobre', 'novembre', 'decembre'],
  // ar-MA (current)
  arMa: ['يناير', 'فبراير', 'مارس', 'أبريل', 'ماي', 'يونيو', 'يوليوز', 'غشت',
    'شتنبر', 'أكتوبر', 'نونبر', 'دجنبر'],
  // ar (Mashriqi) - only ever read, never written
  arLegacy: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو',
    'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
};

const MIN_YEAR = 1900;
const MAX_YEAR = 2200;

// Strip Latin accents and Arabic hamza forms so "février"/"fevrier" and
// "أبريل"/"ابريل" both resolve. Mirrors textMatching's normalization but is
// kept local: this parser must stay usable on its own.
const fold = (value) => String(value)
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[\u0300-\u036F]/g, '')
  .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '')
  .replace(/[آأإٱ]/g, 'ا')
  .replace(/ى/g, 'ي')
  .replace(/ة/g, 'ه');

// month name (folded) -> 0-based index, first table wins on collisions (they
// all agree where they overlap).
const MONTH_INDEX = new Map();
Object.values(MONTH_NAMES).forEach((names) => {
  names.forEach((name, index) => {
    const key = fold(name);
    if (!MONTH_INDEX.has(key)) MONTH_INDEX.set(key, index);
  });
});

/**
 * Parses a mainDate string into a Date (UTC midnight), or null when the value
 * is empty or unrecognisable. A missing day defaults to the 15th so the value
 * sits in the middle of the month rather than skewing every month-only date to
 * its first day when measuring how far apart two posts are.
 */
const parseMainDate = (value) => {
  if (!value || typeof value !== 'string') return null;

  const folded = fold(value)
    // Arabic-Indic digits are not written by the current client, but older
    // rows and hand-edited data can carry them.
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));

  const yearMatch = folded.match(/\b(\d{4})\b/);
  if (!yearMatch) return null;
  const year = Number(yearMatch[1]);
  if (year < MIN_YEAR || year > MAX_YEAR) return null;

  let month = null;
  for (const [name, index] of MONTH_INDEX) {
    if (folded.includes(name)) {
      month = index;
      break;
    }
  }
  if (month === null) return null;

  const dayMatch = folded.replace(yearMatch[0], ' ').match(/\b(\d{1,2})\b/);
  let day = dayMatch ? Number(dayMatch[1]) : 15;
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  if (!day || day > daysInMonth) day = Math.min(15, daysInMonth);

  return new Date(Date.UTC(year, month, day));
};

/**
 * Best available "when did this happen" timestamp for a post: the author's
 * stated date when it parses, otherwise when the post was created.
 * `isExact` tells the caller which one it got.
 */
const resolveEventDate = (post) => {
  const parsed = parseMainDate(post?.mainDate);
  if (parsed) return { date: parsed, isExact: true };
  const created = post?.createdAt ? new Date(post.createdAt) : null;
  if (created && !Number.isNaN(created.getTime())) return { date: created, isExact: false };
  return { date: null, isExact: false };
};

module.exports = { parseMainDate, resolveEventDate, MONTH_NAMES };
