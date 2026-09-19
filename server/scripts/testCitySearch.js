/**
 * Offline check of the city search.
 *
 *   node scripts/testCitySearch.js
 *
 * Needs no database and no network. It covers the four ways a city that
 * exists could fail to reach the reader typing its name, all of which are
 * silent - the picker shows other places and says nothing about the one that
 * is missing:
 *
 *   1. Folding. "Aït Melloul" is stored with the trema and the space;
 *      somebody types "ait melloul", "Ait-Melloul" or "aitmelloul". The
 *      database search is a literal $regex, so an unfolded query misses the
 *      row that is sitting right there. Same in Arabic, where the hamza and
 *      the ta marbuta are written both ways.
 *   2. The Google gate. It used to be "ask Google only if the list isn't
 *      full", and GeoNames' prefix search fills all ten slots with places
 *      that merely share a few letters - so the source with the best
 *      small-place coverage was never asked precisely when it was needed.
 *   3. Ranking. The three sources are merged in the order they were asked
 *      and then cut to ten. A late source's exact match has to rise to the
 *      top, or it is cut off the end instead.
 *   4. Google's own type filter. Requiring `locality` drops the douars,
 *      rural communes and quarters people name as their city - which is
 *      exactly the set that was missing.
 *
 * Exits non-zero if any assertion failed.
 */

const {
  normalizeCityText,
  buildCitySearchPattern,
  scoreCityMatch,
  rankCityMatches,
  hasStrongCityMatch,
  cityDedupeKey,
  shouldConsultGooglePlaces,
  MATCH_EXACT,
  MATCH_PREFIX,
  MATCH_NONE,
} = require('../utils/cityMatching');
const googlePlacesService = require('../services/googlePlacesService');

let failures = 0;
let checks = 0;

const check = (label, actual, expected) => {
  checks += 1;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) {
    failures += 1;
    console.error(`FAIL  ${label}\n        expected ${JSON.stringify(expected)}\n        actual   ${JSON.stringify(actual)}`);
  } else {
    console.log(`ok    ${label}`);
  }
};

const checkThat = (label, condition, detail = '') => {
  checks += 1;
  if (!condition) {
    failures += 1;
    console.error(`FAIL  ${label}${detail ? `\n        ${detail}` : ''}`);
  } else {
    console.log(`ok    ${label}${detail ? `  (${detail})` : ''}`);
  }
};

// A query matches a stored label the way the database would: the pattern,
// case-insensitive, anywhere in the string.
const patternMatches = (query, storedLabel) =>
  new RegExp(buildCitySearchPattern(query), 'i').test(storedLabel);

console.log('\n--- folding ---');

check('latin accents fold', normalizeCityText('Aït Melloul'), 'ait melloul');
check('hyphens and apostrophes are separators', normalizeCityText("Sidi Bou-Sa'id"), 'sidi bou sa id');
check('arabic hamza folds onto plain alif', normalizeCityText('أكادير'), 'اكادير');
check('arabic ta marbuta folds onto ha', normalizeCityText('الجديدة'), 'الجديده');
check('arabic harakat are dropped', normalizeCityText('مَرَّاكُش'), 'مراكش');
check('a missing name folds to nothing', normalizeCityText(undefined), '');

console.log('\n--- the database pattern matches how people type ---');

checkThat('unaccented query finds the accented row', patternMatches('ait melloul', 'Aït Melloul'));
checkThat('hyphenated query finds the spaced row', patternMatches('Ait-Melloul', 'Aït Melloul'));
checkThat('run-together query finds the spaced row', patternMatches('aitmelloul', 'Aït Melloul'));
checkThat('spaced query finds the hyphenated row', patternMatches('sidi ifni', 'Sidi-Ifni'));
checkThat('partial prefix still matches', patternMatches('Dchei', 'Dcheira El Jihadia'));
checkThat('plain alif finds the hamza row', patternMatches('اكادير', 'أكادير'));
checkThat('hamza finds the plain alif row', patternMatches('أكادير', 'اكادير'));
checkThat('ta marbuta and ha are one letter', patternMatches('الجديده', 'الجديدة'));
checkThat(
  'a different place is still not a match',
  !patternMatches('ait melloul', 'Agadir'),
  'folding must not turn the search into a wildcard'
);
checkThat(
  'regex metacharacters are escaped, not executed',
  !patternMatches('a.adir', 'Agadir') && patternMatches('a.adir', 'A.adir'),
  'a typed dot is a dot'
);

console.log('\n--- scoring ---');

const aitMelloul = { labels: { en: 'Aït Melloul', fr: 'Aït Melloul', ar: 'أيت ملول' }, code: 'AIT_MELLOUL' };

check('exact name scores exact', scoreCityMatch(aitMelloul, 'ait melloul'), MATCH_EXACT);
check('prefix of the name scores prefix', scoreCityMatch(aitMelloul, 'ait mel'), MATCH_PREFIX);
check('a later word of the name scores prefix', scoreCityMatch(aitMelloul, 'melloul'), MATCH_PREFIX);
check('the arabic name scores too', scoreCityMatch(aitMelloul, 'ايت ملول'), MATCH_EXACT);
check('an unrelated place scores nothing', scoreCityMatch(aitMelloul, 'tangier'), MATCH_NONE);
check('searchTerms count as names', scoreCityMatch({ labels: {}, searchTerms: ['taghazout'] }, 'taghazout'), MATCH_EXACT);

console.log('\n--- ranking: the answer must survive the cut ---');

// What GeoNames' prefix search actually answers for "ait": twenty places
// that begin with those letters, none of which is the one being looked for.
const geonamesNoise = [
  'Aït Ourir', 'Aït Baha', 'Aït Attab', 'Aït Amira', 'Aït Yazza',
  'Aït Bouguemez', 'Aït Faska', 'Aït Hani', 'Aït Ishaq', 'Aït Majden',
].map((name) => ({ labels: { en: name, fr: name, ar: name }, source: 'geonames' }));

const googleAnswer = { labels: { en: 'Ait Melloul', fr: 'Ait Melloul', ar: 'أيت ملول' }, source: 'google' };

const merged = [...geonamesNoise, googleAnswer];
const ranked = rankCityMatches(merged, 'ait melloul').slice(0, 10);

check('the exact match is first', ranked[0].labels.en, 'Ait Melloul');
checkThat(
  'and it is inside the ten rows the reader is shown',
  ranked.some((city) => city.labels.en === 'Ait Melloul'),
  'merged eleventh, it would otherwise be cut off the end'
);
check(
  'ties keep source order, so a database row still outranks an API one',
  rankCityMatches(
    [{ labels: { en: 'Agadir' }, source: 'geonames' }, { labels: { en: 'Agadir' }, source: 'database' }],
    'agadir'
  ).map((city) => city.source),
  ['geonames', 'database']
);

console.log('\n--- the google gate ---');

checkThat(
  'a full list of near-misses still asks google',
  shouldConsultGooglePlaces({
    resultCount: 10,
    limit: 10,
    hasStrongMatch: hasStrongCityMatch(geonamesNoise, 'ait melloul'),
    needsArabicSupplement: false,
  }),
  'this is the case the row-count gate got wrong'
);
checkThat(
  'a full list containing the answer does not',
  !shouldConsultGooglePlaces({
    resultCount: 10,
    limit: 10,
    hasStrongMatch: hasStrongCityMatch(merged, 'ait melloul'),
    needsArabicSupplement: false,
  }),
  'the budget is not spent on a search that is already answered'
);
checkThat(
  'a short list still asks, as it always did',
  shouldConsultGooglePlaces({ resultCount: 2, limit: 10, hasStrongMatch: true, needsArabicSupplement: false })
);
checkThat(
  'an arabic search with no arabic name still asks',
  shouldConsultGooglePlaces({ resultCount: 10, limit: 10, hasStrongMatch: true, needsArabicSupplement: true })
);

console.log('\n--- de-duplication across sources ---');

check(
  'two spellings of one place share a key',
  cityDedupeKey({ labels: { en: 'Aït Melloul' } }),
  cityDedupeKey({ labels: { en: 'Ait-Melloul' } })
);
checkThat(
  'two different places do not',
  cityDedupeKey({ labels: { en: 'Agadir' } }) !== cityDedupeKey({ labels: { en: 'Agadir Ida Ou Tanane' } })
);

console.log('\n--- google: what counts as a place someone lost something in ---');

const settlement = (types) => googlePlacesService.isSettlement({ types });

checkThat('a town is a place', settlement(['locality', 'political']));
checkThat('a rural commune is a place', settlement(['administrative_area_level_4', 'political']));
checkThat('a level 5 division is a place', settlement(['administrative_area_level_5', 'political']));
checkThat('a quarter is a place', settlement(['sublocality', 'sublocality_level_1', 'political']));
checkThat('a neighborhood is a place', settlement(['neighborhood', 'political']));
checkThat(
  'so is one google tags only as political',
  settlement(['political']),
  'dropping these is how the small places went missing'
);
checkThat('a region is not', !settlement(['administrative_area_level_1', 'political']));
checkThat('a country is not', !settlement(['country', 'political']));
checkThat('a business is not', !settlement(['establishment', 'point_of_interest']));
checkThat('a road is not', !settlement(['route']));
checkThat(
  'a business inside a locality is not',
  !settlement(['locality', 'establishment']),
  'the establishment types win, whatever else is on the result'
);
checkThat('an untyped result is not', !settlement(undefined));

console.log('\n--- google: capital-ness is read from the name, not the type ---');

const formatted = googlePlacesService.formatCityData(
  { name: 'Aït Melloul', place_id: 'x', types: ['locality', 'political'], geometry: null },
  'MA',
  'en'
);
check(
  'an ordinary town is not flagged a capital',
  formatted.isCapital,
  false
);
check(
  'the capital still is',
  googlePlacesService.formatCityData(
    { name: 'Rabat', place_id: 'y', types: ['locality', 'political'], geometry: null },
    'MA',
    'en'
  ).isCapital,
  true
);

console.log(`\n${checks - failures}/${checks} checks passed`);
if (failures > 0) {
  console.error(`${failures} FAILED`);
  process.exit(1);
}
