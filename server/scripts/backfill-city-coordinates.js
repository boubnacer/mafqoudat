/**
 * Gives City rows that have no coordinates their coordinates, so the dashboard
 * map can place them (small towns like Irherm are not in the offline name
 * dataset the map used to rely on - see utils/cityGeocode.js).
 *
 * Dry-run by default: looks everything up, prints what it found, writes
 * nothing. Pass --apply to save.
 *
 * Usage:
 *   node scripts/backfill-city-coordinates.js --report         (inventory only, no lookups)
 *   node scripts/backfill-city-coordinates.js                  (dry run)
 *   node scripts/backfill-city-coordinates.js --apply          (writes)
 *   node scripts/backfill-city-coordinates.js --country=MA     (one country)
 *   node scripts/backfill-city-coordinates.js --only-used      (only cities a post points at)
 *   node scripts/backfill-city-coordinates.js --offline-only   (no network at all)
 *   node scripts/backfill-city-coordinates.js --max-google=10  (billed-call ceiling, default 25)
 *   node scripts/backfill-city-coordinates.js --no-google      (never call Google)
 *
 * --report is the one to start with: it says how many rows are missing
 * coordinates, how many of them a post actually points at (the only ones the
 * map can ever ask for), and how many the offline dataset could place for
 * free - so the size of the billed part of the job is known before any of it
 * is run.
 *
 * Targets MONGODB_URI_PROD by default; MONGO_TARGET=dev uses MONGODB_URI.
 *
 * Where each city's position comes from, cheapest and safest first:
 *   1. It has a Google placeId -> one Place Details call asking for `geometry`
 *      only. This is the only billed request, and the one that is exact (the
 *      id names the place; a name search could land on a namesake).
 *   2. Otherwise an EXACT name match in the offline dataset (free).
 *   3. Otherwise one GeoNames name_equals search (free tier), most populous hit.
 *
 * It cannot loop and cannot run away: the cities are fetched once into a
 * fixed array and each is attempted exactly once, sequentially - no retries,
 * no pagination, no follow-up requests. Google calls stop at --max-google, and
 * a quota/permission refusal (OVER_QUERY_LIMIT, REQUEST_DENIED, ...) switches
 * that source off for the rest of the run instead of asking the next city.
 * A city nothing can place is reported and left alone.
 */

require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');
const City = require('../models/City');
require('../models/Country'); // registered so populate('country') can resolve it
const { geocodeCityName } = require('../utils/cityGeocode');
const { normalizeCoordinates, MISSING_COORDINATES } = require('../utils/cityCoordinates');

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name) => {
  const hit = args.find((arg) => arg.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
};

const APPLY = flag('apply');
const REPORT = flag('report');
const OFFLINE_ONLY = flag('offline-only');
const NO_GOOGLE = flag('no-google') || OFFLINE_ONLY;
const ONLY_USED = flag('only-used');
const COUNTRY = (option('country') || '').toUpperCase() || null;
const parsedMax = parseInt(option('max-google'), 10);
const MAX_GOOGLE = Number.isFinite(parsedMax) && parsedMax >= 0 ? parsedMax : 25;

const uri = process.env.MONGO_TARGET === 'dev'
  ? process.env.MONGODB_URI
  : process.env.MONGODB_URI_PROD;

const GOOGLE_URL = 'https://maps.googleapis.com/maps/api/place/details/json';
const GEONAMES_URL = `${process.env.GEONAMES_API_URL || 'http://api.geonames.org'}/searchJSON`;
const REQUEST_TIMEOUT_MS = 8000;
const PAUSE_MS = 250;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Sources switched off for the rest of the run after a refusal.
const disabled = {
  google: NO_GOOGLE || !process.env.GOOGLE_PLACES_API_KEY,
  geonames: OFFLINE_ONLY || !process.env.GEONAMES_USERNAME,
};
let googleCalls = 0;

const fromGoogle = async (city) => {
  if (disabled.google) return null;
  if (googleCalls >= MAX_GOOGLE) return { skipped: `--max-google=${MAX_GOOGLE} reached` };

  googleCalls += 1;
  const { data } = await axios.get(GOOGLE_URL, {
    params: { place_id: city.placeId, fields: 'geometry', key: process.env.GOOGLE_PLACES_API_KEY },
    timeout: REQUEST_TIMEOUT_MS,
  });

  if (data.status === 'OK') {
    const location = data.result?.geometry?.location;
    const coordinates = normalizeCoordinates(location && { lat: location.lat, lon: location.lng });
    return coordinates ? { coordinates, source: 'google' } : null;
  }
  // A dead placeId is this city's problem; anything else is the account's.
  if (data.status === 'NOT_FOUND' || data.status === 'ZERO_RESULTS' || data.status === 'INVALID_REQUEST') {
    return { skipped: `google ${data.status}` };
  }
  disabled.google = true;
  return { skipped: `google ${data.status} - Google switched off for this run` };
};

// One name_equals search. Still exact: the name has to be one GeoNames knows
// for a populated place in that country, so this cannot land on a namesake in
// another region the way a free-text query can.
const askGeoNames = async (name, countryCode) => {
  const { data } = await axios.get(GEONAMES_URL, {
    params: {
      name_equals: name,
      country: countryCode,
      featureClass: 'P',
      maxRows: 5,
      orderby: 'population',
      username: process.env.GEONAMES_USERNAME,
    },
    timeout: REQUEST_TIMEOUT_MS,
  });

  // GeoNames reports refusals (bad username, credit limit) as HTTP 200.
  if (data.status) {
    disabled.geonames = true;
    return { skipped: `geonames: ${data.status.message} - GeoNames switched off for this run` };
  }

  const hits = data.geonames || [];
  const coordinates = hits[0] && normalizeCoordinates({ lat: hits[0].lat, lon: hits[0].lng });
  if (!coordinates) return null;
  return {
    coordinates,
    source: 'geonames',
    note: [
      name,
      hits.length > 1 ? 'several places share this name, took the most populous' : null,
    ].filter(Boolean).join(' - '),
  };
};

// Every label in turn, not just the English one. GeoNames indexes a place's
// alternate names in every script, so the Arabic label finds a city whose Latin
// label is a transliteration nobody else writes that way - "Almhmdya" matches
// nothing anywhere, while "المحمدية" is Mohammedia. Stops at the first answer,
// so a city named the same in all three costs one request, not three.
const fromGeoNames = async (city, countryCode) => {
  if (disabled.geonames) return null;

  const names = [...new Set(
    ['en', 'fr', 'ar']
      .map((lang) => city.labels?.[lang])
      .filter((name) => typeof name === 'string' && name.trim())
      .map((name) => name.trim())
  )];

  const notes = [];
  for (const name of names) {
    if (disabled.geonames) break;
    try {
      const result = await askGeoNames(name, countryCode);
      if (result?.coordinates) return result;
      if (result?.skipped) notes.push(result.skipped);
    } catch (error) {
      // One label failing must not cost the city its other labels: the Arabic
      // name is often the only one GeoNames knows, and it is asked last.
      const status = error.response?.status;
      // GeoNames states the real reason in the body even on a 401 ("user does
      // not exist", value 10), and axios throws that body away with the rest of
      // the response unless it is read out here - leaving a bare HTTP 401 that
      // reads like a network problem when it is a credentials one.
      const reason = error.response?.data?.status?.message;
      notes.push(`geonames "${name}": ${[status ? `HTTP ${status}` : null, reason || (status ? null : error.message)].filter(Boolean).join(' - ')}`);
      // 401/403 is the account being refused and 429 is it being told to stop -
      // neither is about this name, so asking again with the next one only
      // makes it worse.
      if (status === 401 || status === 403 || status === 429) {
        disabled.geonames = true;
        notes.push('GeoNames switched off for this run');
        break;
      }
    }
    // Spaced out even within one city: this is the free tier.
    if (names.length > 1) await sleep(PAUSE_MS);
  }

  return notes.length ? { skipped: notes.join('; ') } : null;
};

// Each source is tried in turn and a source that cannot answer hands the city
// to the next one - a dead placeId, a spent Google budget or a refused account
// must not cost a city a position the free dataset was holding all along. The
// notes from the sources that gave up are kept so a city nothing could place
// says why.
const resolveCity = async (city) => {
  const countryCode = city.country?.code;
  if (!countryCode) return { skipped: 'no country code' };

  const notes = [];

  if (city.placeId) {
    const google = await fromGoogle(city);
    if (google?.coordinates) return google;
    if (google?.skipped) notes.push(google.skipped);
  }

  const offline = geocodeCityName([city.labels.en, city.labels.fr], countryCode, { exactOnly: true });
  const offlineCoordinates = offline && normalizeCoordinates(offline);
  if (offlineCoordinates) return { coordinates: offlineCoordinates, source: 'offline dataset' };

  const geonames = await fromGeoNames(city, countryCode);
  if (geonames?.coordinates) return geonames;
  if (geonames?.skipped) notes.push(geonames.skipped);

  return notes.length ? { skipped: notes.join('; ') } : null;
};

// What is missing, without looking anything up: no network, no writes. The
// offline column is what the free pass alone would fix.
const report = (cities, usedIds) => {
  const used = new Set(usedIds.map(String));
  const rows = new Map();

  cities.forEach((city) => {
    const code = city.country?.code || '??';
    const row = rows.get(code) || { total: 0, used: 0, placeId: 0, offline: 0 };
    row.total += 1;
    if (used.has(String(city._id))) row.used += 1;
    if (city.placeId) row.placeId += 1;
    if (geocodeCityName([city.labels.en, city.labels.fr], code, { exactOnly: true })) row.offline += 1;
    rows.set(code, row);
  });

  console.log('country  missing  used by a post  has a Google placeId  placeable offline');
  [...rows.entries()]
    .sort((a, b) => b[1].total - a[1].total)
    .forEach(([code, row]) => {
      console.log(`  ${code.padEnd(7)}${String(row.total).padStart(7)}${String(row.used).padStart(16)}${String(row.placeId).padStart(22)}${String(row.offline).padStart(19)}`);
    });

  const totals = [...rows.values()].reduce((acc, row) => ({
    total: acc.total + row.total,
    used: acc.used + row.used,
    placeId: acc.placeId + row.placeId,
    offline: acc.offline + row.offline,
  }), { total: 0, used: 0, placeId: 0, offline: 0 });
  console.log(`  ${'all'.padEnd(7)}${String(totals.total).padStart(7)}${String(totals.used).padStart(16)}${String(totals.placeId).padStart(22)}${String(totals.offline).padStart(19)}`);
  console.log('\nNothing was looked up and nothing was written. Run with --offline-only --apply for the free pass first.');
};

const main = async () => {
  if (!uri) {
    console.error('No Mongo URI: set MONGODB_URI_PROD (or MONGO_TARGET=dev with MONGODB_URI).');
    process.exit(1);
  }
  await mongoose.connect(uri);

  // post.city is Mixed - an ObjectId, or its string form in older rows.
  const Post = require('../models/Post');
  const usedRaw = await Post.distinct('city');
  const usedIds = usedRaw
    .filter((id) => mongoose.isValidObjectId(id))
    .map((id) => new mongoose.Types.ObjectId(String(id)));
  const freeTextCities = usedRaw.filter((id) => id && !mongoose.isValidObjectId(id));

  const filter = { ...MISSING_COORDINATES };
  if (ONLY_USED) filter._id = { $in: usedIds };

  let cities = await City.find(filter).populate('country', 'code').lean();
  if (COUNTRY) cities = cities.filter((city) => city.country?.code === COUNTRY);

  if (REPORT) {
    const total = await City.countDocuments({});
    console.log(`${total} cities in all, ${cities.length} of them without coordinates${COUNTRY ? ` in ${COUNTRY}` : ''}.\n`);
    report(cities, usedIds);
    if (freeTextCities.length) {
      // Not City rows at all, so no backfill reaches them: the map has to
      // guess their position from the text on every request.
      console.log(`\n${freeTextCities.length} listing(s) store their city as free text rather than a City row: ${JSON.stringify(freeTextCities.slice(0, 20))}`);
    }
    await mongoose.disconnect();
    return;
  }

  console.log(`${APPLY ? 'APPLY' : 'DRY RUN'}: ${cities.length} cit${cities.length === 1 ? 'y' : 'ies'} without coordinates` +
    `${COUNTRY ? ` in ${COUNTRY}` : ''}. Google: ${disabled.google ? 'off' : `on, max ${MAX_GOOGLE} calls`}, GeoNames: ${disabled.geonames ? 'off' : 'on'}.\n`);

  const tally = { found: 0, missed: 0, skipped: 0 };

  for (const city of cities) {
    const name = `${city.labels.en} (${city.country?.code || '??'})`;
    try {
      const result = await resolveCity(city);

      if (result?.coordinates) {
        const { lat, lon } = result.coordinates;
        console.log(`  ok      ${name}  ${lat.toFixed(4)}, ${lon.toFixed(4)}  [${result.source}]${result.note ? ` - ${result.note}` : ''}`);
        tally.found += 1;
        if (APPLY) {
          // Guarded so a coordinate saved by a post in the meantime is not overwritten.
          await City.updateOne({ _id: city._id, ...MISSING_COORDINATES }, { $set: { coordinates: result.coordinates } });
        }
      } else if (result?.skipped) {
        console.log(`  skipped ${name}  ${result.skipped}`);
        tally.skipped += 1;
      } else {
        // Printing every label, because the usual reason nothing can place a
        // city is that its stored name is a transliteration no source uses.
        const labels = ['en', 'fr', 'ar'].map((lang) => city.labels?.[lang] || '-').join(' / ');
        console.log(`  missed  ${name}  no source could place it  [${labels}]`);
        tally.missed += 1;
      }
    } catch (error) {
      console.log(`  failed  ${name}  ${error.message}`);
      tally.skipped += 1;
    }
    // Only the network sources need spacing out; the offline pass does not.
    if (!disabled.google || !disabled.geonames) await sleep(PAUSE_MS);
  }

  console.log(`\nfound ${tally.found}, missed ${tally.missed}, skipped ${tally.skipped}. Google calls made: ${googleCalls}.`);
  if (!APPLY && tally.found) console.log('Nothing was written. Re-run with --apply to save.');
  await mongoose.disconnect();
};

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
