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

const FUZZY_THRESHOLD = 0.72;

// Returns { lon, lat, matchedName } or null if nothing close enough was
// found in that country's city list.
const geocodeCityName = (rawName, countryIso2) => {
  const candidates = citiesByCountry.get((countryIso2 || "").toUpperCase());
  if (!candidates || !rawName) return null;

  const target = normalize(rawName);
  if (!target) return null;

  const exact = candidates.find((c) => normalize(c.name) === target);
  if (exact) {
    return { lon: exact.loc.coordinates[0], lat: exact.loc.coordinates[1], matchedName: exact.name };
  }

  let best = null;
  let bestScore = 0;
  candidates.forEach((c) => {
    const candidateName = normalize(c.name);
    const dist = levenshtein(target, candidateName);
    const score = 1 - dist / Math.max(target.length, candidateName.length, 1);
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  });

  if (best && bestScore >= FUZZY_THRESHOLD) {
    return { lon: best.loc.coordinates[0], lat: best.loc.coordinates[1], matchedName: best.name };
  }
  return null;
};

module.exports = { geocodeCityName };
