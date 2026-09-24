/**
 * Offline check of where the dashboard map gets a city's position from.
 *
 *   node scripts/testCityCoordinates.js
 *
 * Needs no database and no network. It covers the three ways a city with
 * listings could still be missing from the map, or worse, drawn in the wrong
 * place - all of them silent, since a map with a dot on it looks finished:
 *
 *   1. The coordinates the search result arrived with are dropped on the way
 *      to the City row, because every source spells them differently
 *      (GeoNames and Google Places answer { latitude, longitude }, Google's
 *      raw geometry is { lat, lng }, the offline dataset is { lon, lat }).
 *   2. Nothing is stored, so the map guesses from the name - and the fuzzy
 *      guess answers one town's name with another town's position. "Aït
 *      Melloul", outside Agadir, used to take "Tit Mellil"'s coordinates,
 *      outside Casablanca: a dot 450km from the city it claimed to be.
 *   3. A village is left unplaceable because only the fuzzy guess was tried
 *      and the offline dataset does not contain it at all.
 *
 * Exits non-zero if any assertion failed.
 */

const { normalizeCoordinates, resolveCityCoordinates } = require('../utils/cityCoordinates');
const { geocodeCityName } = require('../utils/cityGeocode');

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

const checkTruthy = (label, actual) => {
  checks += 1;
  if (actual) {
    console.log(`ok    ${label}`);
  } else {
    failures += 1;
    console.error(`FAIL  ${label}\n        expected something truthy, got ${JSON.stringify(actual)}`);
  }
};

// --- 1. Every source's spelling folds onto one stored shape -----------------

console.log('\n# normalizeCoordinates');

check(
  'city search answers latitude/longitude (GeoNames and Google both)',
  normalizeCoordinates({ latitude: 30.42018, longitude: -9.59815 }),
  { lat: 30.42018, lon: -9.59815 }
);
check(
  "Google's raw geometry is lat/lng",
  normalizeCoordinates({ lat: 33.5731, lng: -7.5898 }),
  { lat: 33.5731, lon: -7.5898 }
);
check(
  'the offline dataset is lon/lat',
  normalizeCoordinates({ lon: -6.8498, lat: 34.0209 }),
  { lat: 34.0209, lon: -6.8498 }
);
check(
  'numbers that arrived as strings are numbers once stored',
  normalizeCoordinates({ latitude: '31.6295', longitude: '-7.9811' }),
  { lat: 31.6295, lon: -7.9811 }
);

// A wrong dot is worse than a missing one, so everything doubtful is refused.
check('null island is refused', normalizeCoordinates({ lat: 0, lon: 0 }), null);
check('out of range is refused', normalizeCoordinates({ lat: 91, lon: 10 }), null);
check('a longitude out of range is refused', normalizeCoordinates({ lat: 30, lon: -181 }), null);
check('NaN (parseFloat of nothing) is refused', normalizeCoordinates({ lat: NaN, lon: 10 }), null);
check('a missing longitude is refused', normalizeCoordinates({ latitude: 30.4 }), null);
check('nothing at all is refused', normalizeCoordinates(null), null);
check('a non-object is refused', normalizeCoordinates('30.4,-9.5'), null);
// Zero on one axis alone is a real place (the Greenwich meridian runs through
// Morocco and Algeria), so only the pair is refused.
check(
  'a zero longitude on its own is kept',
  normalizeCoordinates({ lat: 31.6295, lon: 0 }),
  { lat: 31.6295, lon: 0 }
);

// --- 2. What a city about to be written takes its position from ------------

console.log('\n# resolveCityCoordinates');

check(
  'the search result the author picked wins',
  resolveCityCoordinates({
    apiCityData: { coordinates: { latitude: 29.5731, longitude: -9.7269 } },
    labels: ['Agadir'],
    countryCode: 'MA',
  }),
  { lat: 29.5731, lon: -9.7269 }
);

// The free-text path and an edit form that only kept the label arrive with no
// coordinates at all; the offline dataset is the only thing that can place
// those, and it costs nothing.
checkTruthy(
  'a city that arrived without coordinates falls back to the offline dataset',
  resolveCityCoordinates({ labels: ['Casablanca'], countryCode: 'MA' })
);
check(
  'and only on an exact name match - a near-miss is left unplaced, not guessed',
  resolveCityCoordinates({ labels: ['Aït Melloul'], countryCode: 'MA' }),
  null
);
check(
  'a village the dataset does not contain is left unplaced',
  resolveCityCoordinates({ labels: ['Irherm'], countryCode: 'MA' }),
  null
);
check('with no country there is nothing to look up in', resolveCityCoordinates({ labels: ['Casablanca'] }), null);
check('with no labels either', resolveCityCoordinates({ countryCode: 'MA' }), null);
check('and it never throws on nothing', resolveCityCoordinates(), null);

// A refused pair does not stop the fallback from answering: the search result
// said (0, 0), the dataset knows where Rabat is.
checkTruthy(
  'a refused pair falls through to the dataset rather than winning',
  resolveCityCoordinates({
    apiCityData: { coordinates: { lat: 0, lon: 0 } },
    labels: ['Rabat'],
    countryCode: 'MA',
  })
);

// --- 3. The guess from the name, for rows that have no stored position -----

console.log('\n# geocodeCityName');

check(
  "one town's name never answers with another town's position",
  geocodeCityName(['Aït Melloul', 'Ait Melloul'], 'MA'),
  null
);
check('nor does a name the dataset has nothing close to', geocodeCityName('Biougra', 'MA'), null);

// The spellings that really are the same place still resolve - this is what
// the fuzzy pass is for, and tightening it must not cost them.
[
  ['Marrakech', 'Marrakesh'],
  ['Tanger', 'Tangier'],
  ['El Jadida', 'El Jadid'],
  ['Ouarzazate', 'Ouarzazat'],
  ['Sidi Kacem', 'Sidi Qacem'],
].forEach(([written, inDataset]) => {
  const hit = geocodeCityName(written, 'MA');
  check(`"${written}" still resolves to the dataset's "${inDataset}"`, hit?.matchedName, inDataset);
});

check(
  'exactOnly skips the fuzzy pass, so nothing a write would store is guessed',
  geocodeCityName('Marrakech', 'MA', { exactOnly: true }),
  null
);
checkTruthy(
  'while an exact name still answers under exactOnly',
  geocodeCityName('Marrakesh', 'MA', { exactOnly: true })
);
check('an unknown country answers nothing', geocodeCityName('Casablanca', 'ZZ'), null);

console.log(`\n${checks - failures}/${checks} checks passed.`);
if (failures) {
  console.error(`${failures} check(s) failed.`);
  process.exit(1);
}
