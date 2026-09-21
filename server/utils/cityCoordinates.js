// Coordinates a City row carries, so the dashboard map can place a city
// without guessing from its name (see cityGeocode.js for why guessing fails).
//
// Every source spells them differently - city search answers
// { latitude, longitude } (GeoNames and Google Places both), the geocode
// dataset answers { lon, lat }, Google's raw geometry is { lat, lng } - so
// everything is funnelled through here and stored as { lat, lon }.

const toFiniteNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const number = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(number) ? number : null;
};

// Returns { lat, lon } or null. Rejects anything out of range, and (0, 0):
// GeoNames answers parseFloat(undefined) -> NaN and a missing Google geometry
// often arrives as zeros, and "null island" in the Gulf of Guinea is never a
// city in these countries - a wrong dot is worse than a missing one.
const normalizeCoordinates = (input) => {
  if (!input || typeof input !== 'object') return null;

  const lat = toFiniteNumber(input.lat ?? input.latitude);
  const lon = toFiniteNumber(input.lon ?? input.lng ?? input.longitude);
  if (lat === null || lon === null) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  if (lat === 0 && lon === 0) return null;

  return { lat, lon };
};

// Where a city about to be written to the database is, cheapest source first
// and never a network call:
//
//   1. the coordinates that came back with the search result the author
//      picked - GeoNames and Google Places both answer with them, so a city
//      created from a search is placed exactly, village or not;
//   2. an EXACT name match in the offline dataset (utils/cityGeocode.js), for
//      a city that reached us without any - the free-text fallback path, or an
//      edit form that only kept the label. Exact only: the fuzzy pass is fine
//      for a marker recomputed every request, and wrong for a value that is
//      then stored and reused.
//
// Answers null when neither can place it, which is not a failure - the city is
// saved without coordinates and `scripts/backfill-city-coordinates.js` can
// complete it later. Never throws.
const resolveCityCoordinates = ({ apiCityData, labels, countryCode } = {}) => {
  const fromSearch = normalizeCoordinates(apiCityData?.coordinates);
  if (fromSearch) return fromSearch;

  if (!countryCode) return null;
  const names = (Array.isArray(labels) ? labels : [labels]).filter(
    (value) => typeof value === 'string' && value.trim()
  );
  if (!names.length) return null;

  try {
    // Required lazily so a caller that only needs normalizeCoordinates does
    // not pull in cityGeocode's 135k-row index along with it.
    const { geocodeCityName } = require('./cityGeocode');
    return normalizeCoordinates(geocodeCityName(names, countryCode, { exactOnly: true }));
  } catch (error) {
    console.error('Offline city geocode failed:', error.message);
    return null;
  }
};

// The filter every "does this row still need placing?" query and every guarded
// write uses. `{ field: null }` matches a missing field AND an explicit null in
// MongoDB, while `{ $exists: false }` matches only the first - and a row whose
// coordinates were once set to null would then be skipped by the backfill and
// by every self-healing write, i.e. stay off the map with nothing saying why.
const MISSING_COORDINATES = { coordinates: null };

module.exports = { normalizeCoordinates, resolveCityCoordinates, MISSING_COORDINATES };
