// Offline city-name -> coordinates lookup for the dashboard's world map city
// markers. Free/no-API-key: all-the-cities bundles a static GeoNames-derived
// dataset (MIT), so there's no live geocoding call and no dependency on the
// GeoNames/Google Places credentials this project only has placeholders for
// locally (real creds are Render-only — see project memory).
//
// Why fuzzy matching is needed at all: posts don't reliably carry a linked
// City document (many countries have zero City records in this DB — city
// search creates "dynamic" free-text cities that are never persisted), so
// the only city signal is often a free-text string a user typed or the
// first segment of exactLocation. Real-world spelling varies from the
// dataset's canonical name (diacritics — "Fès" vs "Fes" — or a different
// transliteration entirely — "Marrakech" vs the dataset's "Marrakesh"), so
// exact string matching alone misses common real cases.
const allCities = require("all-the-cities");

const normalize = (name) =>
  (name || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

// Levenshtein edit distance — no need for a package for this; the whole
// point is comparing a handful of short city-name strings per request.
const levenshtein = (a, b) => {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
};

// Index once at module load (135k rows) rather than per request.
const citiesByCountry = new Map();
allCities.forEach((city) => {
  const list = citiesByCountry.get(city.country);
  if (list) list.push(city);
  else citiesByCountry.set(city.country, [city]);
});

// Measured against the real city labels this database holds, not picked by
// feel. Every fuzzy match that is genuinely the same place scores at least
// 0.857 and starts with the same letter - "Marrakech"/"Marrakesh" 0.889,
// "Tanger"/"Tangier" 0.857, "El Jadida"/"El Jadid" 0.889,
// "Ouarzazate"/"Ouarzazat" 0.900, "Sidi Kacem"/"Sidi Qacem" 0.900. The old
// 0.72 let one town's name answer with another's position: "Aït Melloul",
// outside Agadir, scored 0.727 against "Tit Mellil" outside Casablanca and
// took its coordinates - a dot 450km from the city it claimed to be. So both
// conditions have to hold, and a name nothing close is found for is left off
// the map instead (the dot it would draw would be somewhere else entirely).
const FUZZY_THRESHOLD = 0.85;

// Returns { lon, lat, matchedName } or null if nothing close enough was
// found in that country's city list.
//
// rawNames can be a single string or an array of candidate spellings for the
// same city (e.g. a City doc's English AND French labels) — some cities have
// an English DB label the dataset's transliteration doesn't fuzzy-match at
// all ("Fez" vs the dataset's "Fès" scores 0.667, under FUZZY_THRESHOLD) while
// a second spelling matches exactly, so trying only one name silently drops
// the city from the map rather than mis-placing it. Every exact check runs
// before any fuzzy one, so an exact match on a later candidate always wins
// over a fuzzy match on an earlier one.
// `exactOnly` skips the fuzzy pass. The dashboard wants the fuzzy pass (a
// wrong-ish dot beats no dot for a marker that is recomputed every request);
// something that WRITES the result to the database does not.
const geocodeCityName = (rawNames, countryIso2, { exactOnly = false } = {}) => {
  const candidates = citiesByCountry.get((countryIso2 || "").toUpperCase());
  if (!candidates) return null;

  const names = (Array.isArray(rawNames) ? rawNames : [rawNames])
    .map((name) => normalize(name))
    .filter(Boolean);
  if (!names.length) return null;

  for (const target of names) {
    const exact = candidates.find((c) => normalize(c.name) === target);
    if (exact) {
      return { lon: exact.loc.coordinates[0], lat: exact.loc.coordinates[1], matchedName: exact.name };
    }
  }

  if (exactOnly) return null;

  let best = null;
  let bestScore = 0;
  names.forEach((target) => {
    candidates.forEach((c) => {
      const candidateName = normalize(c.name);
      // Two spellings of one place agree on their first letter; two different
      // places that merely score alike often do not.
      if (candidateName[0] !== target[0]) return;
      const dist = levenshtein(target, candidateName);
      const score = 1 - dist / Math.max(target.length, candidateName.length, 1);
      if (score > bestScore) {
        bestScore = score;
        best = c;
      }
    });
  });

  if (best && bestScore >= FUZZY_THRESHOLD) {
    return { lon: best.loc.coordinates[0], lat: best.loc.coordinates[1], matchedName: best.name };
  }
  return null;
};

module.exports = { geocodeCityName };
