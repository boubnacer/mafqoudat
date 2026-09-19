/**
 * Text folding and match ranking shared by every city lookup.
 *
 * Two separate jobs, both of which used to be done differently (or not at
 * all) in each of the three places that search cities:
 *
 *   1. Folding. A Moroccan place name is written half a dozen ways - "Aït
 *      Melloul" / "Ait-Melloul" / "ait melloul", "أكادير" / "اكادير" - and
 *      nobody types the accents or the hyphen. The DB search is a `$regex`,
 *      which is literal, so an unfolded query simply misses the row that is
 *      sitting right there.
 *   2. Ranking. The hybrid search merges three sources, and the external ones
 *      are prefix/fuzzy searches that answer with plenty of places that are
 *      not what was typed. Merged in source order and cut at ten, the one
 *      real match can be the eleventh entry and never reach the reader.
 */

const ARABIC_SCRIPT = /[؀-ۿ]/;
// Latin combining marks, left behind by NFD.
const LATIN_MARKS = /[̀-ͯ]/g;
// Arabic harakat, plus the combining hamza (ٔ) NFD leaves behind when it
// decomposes أ/إ/ؤ/ئ.
const ARABIC_MARKS = /[ً-ٰٟ]/g;
const SEPARATORS = /[\s\-'’_.,]+/g;

const isArabicText = (text) => ARABIC_SCRIPT.test(text || '');

/**
 * Fold a place name down to the form two spellings of it have in common:
 * no accents, no harakat, one alif, lower case, single-spaced.
 * @param {string} text
 * @returns {string}
 */
const normalizeCityText = (text) => {
  if (!text || typeof text !== 'string') return '';

  return text
    .normalize('NFD')
    .replace(LATIN_MARKS, '')
    .replace(ARABIC_MARKS, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ئ/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .toLowerCase()
    .replace(SEPARATORS, ' ')
    .trim();
};

// Separators are noise in a name, not structure: "Ait Melloul", "Aït-Melloul"
// and "AitMelloul" are one place. The tight form is what lets them compare
// equal without the loose one losing word boundaries for prefix scoring.
const tightenCityText = (text) => normalizeCityText(text).replace(/ /g, '');

// Latin letters and the accented forms that fold onto them. Used to expand a
// folded query back into a regex that still matches the unfolded rows stored
// in the database.
const LATIN_VARIANTS = {
  a: 'aàáâãäåāăą',
  c: 'cçćĉċč',
  d: 'dďđ',
  e: 'eèéêëēĕėęě',
  g: 'gĝğġģ',
  i: 'iìíîïĩīĭįı',
  l: 'lĺļľŀł',
  n: 'nñńņň',
  o: 'oòóôõöøōŏő',
  r: 'rŕŗř',
  s: 'sśŝşš',
  t: 'tţťŧ',
  u: 'uùúûüũūŭůűų',
  y: 'yýÿŷ',
  z: 'zźżž',
};

const ARABIC_VARIANTS = {
  'ا': 'اأإآٱ',
  'ي': 'يىئ',
  'ه': 'هة',
  'و': 'وؤ',
};

const REGEX_METACHARACTERS = /[.*+?^${}()|[\]\\]/;

/**
 * Build a MongoDB `$regex` pattern (to be used with the `i` flag) that matches
 * a stored city label however it is accented, hamza'd or hyphenated.
 * @param {string} text - Raw search term
 * @returns {string} - Regex pattern source
 */
const buildCitySearchPattern = (text) => {
  // Separators are dropped from the query and made optional between every
  // pair of letters instead, so "Ait-Melloul", "ait melloul" and
  // "aitmelloul" are one pattern. Only separators may be skipped - never a
  // letter - so this stays a search, not a wildcard.
  const normalized = tightenCityText(text);
  if (!normalized) return '';

  return Array.from(normalized)
    .map((character) => {
      if (LATIN_VARIANTS[character]) {
        return `[${LATIN_VARIANTS[character]}]`;
      }
      if (ARABIC_VARIANTS[character]) {
        return `[${ARABIC_VARIANTS[character]}]`;
      }
      if (REGEX_METACHARACTERS.test(character)) {
        return `\\${character}`;
      }
      return character;
    })
    .join("[\\s\\-'’_.,]*");
};

const MATCH_EXACT = 3;
const MATCH_PREFIX = 2;
const MATCH_CONTAINS = 1;
const MATCH_NONE = 0;

// A prefix match is the weakest score that still means "this is the place
// they are typing" - anything below it is a neighbour the external API threw
// in, and a list made only of those is a list with no answer in it.
const STRONG_MATCH_SCORE = MATCH_PREFIX;

const scoreText = (text, normalizedQuery) => {
  const candidate = normalizeCityText(text);
  if (!candidate || !normalizedQuery) return MATCH_NONE;

  if (candidate === normalizedQuery) return MATCH_EXACT;
  if (candidate.startsWith(normalizedQuery)) return MATCH_PREFIX;
  // Any word of a multi-word name: someone typing "melloul" means Aït Melloul.
  if (candidate.split(' ').some((word) => word.startsWith(normalizedQuery))) return MATCH_PREFIX;

  const tightCandidate = candidate.replace(/ /g, '');
  const tightQuery = normalizedQuery.replace(/ /g, '');
  if (tightCandidate === tightQuery) return MATCH_EXACT;
  if (tightCandidate.startsWith(tightQuery)) return MATCH_PREFIX;

  if (candidate.includes(normalizedQuery) || tightCandidate.includes(tightQuery)) return MATCH_CONTAINS;

  return MATCH_NONE;
};

/**
 * How well a city (from any source) answers what was typed.
 * @param {Object} city - A city in either the DB or the external-API shape
 * @param {string} rawQuery - What the reader typed
 * @returns {number} 3 exact, 2 prefix, 1 contains, 0 not a match
 */
const scoreCityMatch = (city, rawQuery) => {
  const normalizedQuery = normalizeCityText(rawQuery);
  if (!normalizedQuery || !city) return MATCH_NONE;

  const candidates = [
    city.label,
    city.labels?.en,
    city.labels?.fr,
    city.labels?.ar,
    city.code,
    ...(Array.isArray(city.searchTerms) ? city.searchTerms : []),
  ];

  return candidates.reduce(
    (best, candidate) => Math.max(best, scoreText(candidate, normalizedQuery)),
    MATCH_NONE
  );
};

/**
 * Sort merged results so the ones that actually match what was typed come
 * first, keeping source order (database, then GeoNames, then Google) as the
 * tie-break. Stable: an equally good database row still outranks an API one.
 * @param {Array<Object>} cities
 * @param {string} rawQuery
 * @returns {Array<Object>}
 */
const rankCityMatches = (cities, rawQuery) => {
  if (!Array.isArray(cities)) return [];

  return cities
    .map((city, index) => ({ city, index, score: scoreCityMatch(city, rawQuery) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.city);
};

/**
 * Does this set of results contain an answer to the query, as opposed to a
 * list of places that merely came back from asking?
 * @param {Array<Object>} cities
 * @param {string} rawQuery
 * @returns {boolean}
 */
const hasStrongCityMatch = (cities, rawQuery) =>
  Array.isArray(cities) && cities.some((city) => scoreCityMatch(city, rawQuery) >= STRONG_MATCH_SCORE);

// How many results to ask Google for when it is consulted because nothing
// found so far answers the query, rather than because the list is short.
const MIN_GOOGLE_RESULTS = 3;

// How many database candidates to fetch per row shown. MongoDB's $text
// answers in no particular order, so fetching exactly as many as will be
// shown can drop the exact match and keep the near-misses. Ranking cuts.
const CANDIDATE_OVERFETCH = 3;

/**
 * Whether to spend a Google Places request on this search.
 *
 * The old rule was "only if the result list isn't full yet", and that is why
 * small places Google knows about never appeared: GeoNames' prefix and fuzzy
 * searches answer with up to twenty populated places, which fills all ten
 * slots with whatever shares a few letters with the query, and Google was
 * then never asked. Match quality, not row count, is what says whether there
 * is an answer in hand.
 *
 * @param {Object} params
 * @param {number} params.resultCount - Results gathered so far
 * @param {number} params.limit - Results the caller asked for
 * @param {boolean} params.hasStrongMatch - Does any of them answer the query
 * @param {boolean} params.needsArabicSupplement - GeoNames had no Arabic name
 * @returns {boolean}
 */
const shouldConsultGooglePlaces = ({ resultCount, limit, hasStrongMatch, needsArabicSupplement }) =>
  resultCount < limit || !hasStrongMatch || Boolean(needsArabicSupplement);

/**
 * The key two spellings of one place share, for de-duplicating results that
 * arrive from different sources ("Aït Melloul" from the DB, "Ait Melloul"
 * from Google).
 * @param {Object} city
 * @param {string} language
 * @returns {string}
 */
const cityDedupeKey = (city, language = 'en') => {
  const label = city?.labels?.[language] || city?.labels?.en || city?.label || city?.code || '';
  return tightenCityText(label);
};

module.exports = {
  isArabicText,
  normalizeCityText,
  tightenCityText,
  buildCitySearchPattern,
  scoreCityMatch,
  rankCityMatches,
  hasStrongCityMatch,
  cityDedupeKey,
  shouldConsultGooglePlaces,
  MIN_GOOGLE_RESULTS,
  CANDIDATE_OVERFETCH,
  MATCH_EXACT,
  MATCH_PREFIX,
  MATCH_CONTAINS,
  MATCH_NONE,
  STRONG_MATCH_SCORE,
};
