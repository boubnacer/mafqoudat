# City Search in NewPostForm — How It Works & Why It Might Be DB-Only Now

Context file for discussing a regression: city search used to cascade
Database → GeoNames → Google Places, but currently only database cities
show up as suggestions.

## 1. Where the code lives

- Frontend trigger: `client/src/features/posts/NewPost/NewPostForm.js`
  - `searchCitiesHybrid()` (line ~329) — calls `/cities/search` (the 3-phase endpoint)
  - `searchCitiesTraditional()` (line ~382) — calls `/cities/search-name` (DB-only fallback)
  - `handleCitySearchChange()` (line ~528) — the input's `onChange`, orchestrates the fallback chain
- Backend: `server/controllers/cityController.js`
  - `searchCities()` (line ~212) — the actual 3-phase cascade (DB → GeoNames → Google)
  - `searchCitiesByName()` (line ~888) — DB-only search used by the traditional fallback
- Supporting services:
  - `server/services/geonamesService.js`
  - `server/services/googlePlacesService.js`
- Routes: `server/routes/cityRoutes.js` (mounted at `/cities` in `server/server.js`)
- Caching: `server/middleware/cacheMiddleware.js` (route-level) + `server/config/cache.js` `cacheService` (controller-level)

## 2. Frontend flow (what happens when you type in the city box)

`handleCitySearchChange` runs on every keystroke in the dropdown's search input:

1. If the query is `< 2` characters: just filters the already-loaded `cities`
   array client-side (the list preloaded for the selected country via
   `fetchCitiesByCountry`). No network call.
2. If the query is `>= 2` characters **and** a country is selected:
   - Resolves `countryCode` from the selected country object. **This must be
     exactly a 2-letter uppercase ISO code** (`selectedCountryObj?.code`,
     `.toUpperCase()`'d). If it isn't exactly 2 characters, `countryCode` is
     forced to `null` and a console warning is logged.
   - Calls `searchCitiesHybrid(query, countryCode)` → `GET /cities/search?q=...&countryCode=...&language=...`
     (this is the endpoint that's supposed to do DB → GeoNames → Google).
   - **If that returns results, they're shown as-is — no further fallback
     is attempted.**
   - **Only if hybrid search returns an empty array** does it fall back to
     `searchCitiesTraditional()` → `GET /cities/search-name` (DB only, by
     `countryId` not `countryCode`).
   - **Only if that is also empty** does it fall back to filtering the
     already-loaded `cities` state array client-side (DB only, whatever was
     preloaded for the country).

So from the frontend's point of view, there are really only two real
network paths: the hybrid endpoint (which is supposed to include external
APIs), and a pure-DB fallback that only fires when hybrid returns nothing.
**If you're seeing only DB cities, the hybrid endpoint itself is returning
DB-only results** — the fallback logic isn't the culprit, the cascade inside
`/cities/search` is.

## 3. Backend flow — the intended 3 phases (`searchCities` in `cityController.js`)

### Phase 0 — cache check
Before anything else, the controller builds a cache key
(`cities-hybrid-search-google:{q,language,countryCode,limit}`) and checks
`cacheService` (Redis if configured, else in-memory). **If a cached response
exists, it's returned immediately — none of the phases below run at all.**
TTL for this cache entry is 1 hour (line ~425).

There is a **second, separate cache layer** at the route level:
`router.route("/search").get(staticDataCache('cities-search'), cityController.searchCities)`
in `cityRoutes.js`. `staticDataCache` uses `CACHE_TTL.STATIC_DATA` = **24
hours** (`cacheMiddleware.js` line 5), and its cache key includes the query
params + user + language, but is otherwise the same shape of request. So a
given `(q, countryCode, language, user)` combination can have its full JSON
response cached for up to 24 hours at the HTTP layer, on top of the
controller's own 1-hour cache. If a DB-only response ever got cached here
(e.g. during a temporary outage of the external APIs), it will keep being
served for up to 24h afterwards regardless of whether the underlying issue
was fixed.

### Phase 1 — local database search
```js
let query = { $text: { $search: q }, $or: [{isActive:true},{isActive:null}] };
if (countryCode) query.country = <resolved country ObjectId>;
const localCities = await City.find(query)...limit(limit)
```
Uses the MongoDB text index defined in `City.js`
(`labels.en/fr/ar` + `searchTerms`, all `"text"`). Returns up to `limit`
(default 10) matches.

### Phase 2 — GeoNames, gated by:
```js
if (localCities.length < parseInt(limit) && countryCode) { ... }
```
Only runs if **fewer than `limit` DB results were found** and a valid
2-letter `countryCode` was passed. Calls
`geonamesService.searchCities(q, countryCode, language)`, which:
- Requires `process.env.GEONAMES_USERNAME` to be set — **throws immediately
  if missing**.
- Enforces a 1000 requests/24h in-memory counter — throws if exceeded.
- Calls `http://api.geonames.org/searchJSON`.

Results are filtered to drop any city whose name already matches a DB
result, then there's a quality check:
```js
const hasProperTranslations = apiCities.some(city => {
  const hasDifferentNames = labels.en !== labels.fr || ...;
  if (language === 'ar') return hasDifferentNames && isArabicText(labels.ar);
  return hasDifferentNames;
});
if (apiCities.length > 0 && !hasProperTranslations) {
  apiCities = []; // discard — treated as "not found", falls through to Google
}
```
So even if GeoNames *does* return cities, they're thrown away if all three
language labels are identical (common for GeoNames results without
alternate-name data), and the code treats that as "GeoNames found nothing."

**Any error thrown by `geonamesService` (missing username, rate limit,
network error, timeout) is caught and logged with `console.warn`, and the
function silently continues with `apiCities = []`.** No error surfaces to
the client.

### Phase 3 — Google Places, gated by:
```js
if ((allCities.length === 0 || apiCities.length === 0) && countryCode) { ... }
```
Note this condition is **not** "phase 1 and 2 both found nothing." It's
"total results are empty OR GeoNames specifically found nothing" — which is
true almost every time GeoNames didn't contribute, *even if the database
already had a full page of results*. When Google Places does run and
returns results, the code does:
```js
allCities = [...googleCities.slice(0, parseInt(limit))];
```
This **replaces** `allCities` entirely — if Google returns anything, the
local DB matches computed in Phase 1 are discarded from the response. (This
is a separate bug from the one you're describing, but relevant: it means
Google results, when they do come back, silently hide DB matches rather
than merging with them.)

`googlePlacesService.searchCities()`:
- Requires `process.env.GOOGLE_PLACES_API_KEY` — **throws immediately if
  missing**.
- Enforces 100 requests/day AND 2000/month in-memory counters.
- Calls Google's Text Search API (`type=locality`), then for each result
  makes up to 2 more calls to the Place Details API per result to fetch
  French/Arabic native names (`enrichWithTranslations`) — so a single search
  keystroke can cost several Google API calls.
- Any thrown error (missing key, quota, network) is caught with
  `console.warn` and the function continues with `googleCities = []`.
  Again, no error surfaces to the client.

### Phase 4 — response assembly
Response includes a `sources: { database, geonames, google }` count and
`geonamesStats` / `googlePlacesStats` (usage counters) — these are visible
in the raw API response even though the UI doesn't display them, and are
the fastest way to tell which phases actually ran.

## 4. Tools/services involved, end to end

| Layer | Tool | Auth/config |
|---|---|---|
| DB search | MongoDB text index (`City` model) | none |
| Phase 2 | GeoNames `searchJSON` HTTP API | `GEONAMES_USERNAME`, `GEONAMES_API_URL` |
| Phase 3 | Google Places Text Search + Place Details API | `GOOGLE_PLACES_API_KEY` |
| Controller cache | `cacheService` (Redis if `REDIS_URL` set, else in-memory) | `REDIS_URL` optional |
| Route cache | `staticDataCache` middleware (same cache backend, 24h TTL) | same |
| Frontend HTTP | plain `fetch()` (not RTK Query, intentionally — see `docs/NewPost-Form-Analysis.md` constraint C3) | `REACT_APP_API_URL` |

Both API keys are declared in `render.yaml` with `sync: false`, meaning
**they are not stored in the repo and must be set manually in the Render
dashboard** per environment — they don't automatically carry over between
deploys or environments, and a redeploy/env reset can silently drop them.

## 5. Most likely explanations for "only DB suggestions now"

Ranked by likelihood, given the code above:

1. **A required env var is missing/invalid in the running backend**:
   `GEONAMES_USERNAME` or `GOOGLE_PLACES_API_KEY` (or both) not set on
   Render. Both services throw synchronously in that case, both errors are
   swallowed with `console.warn` in the controller, and the response quietly
   degrades to DB-only. Nothing in the client-visible response indicates a
   config error — you'd only see it in server logs, or in the
   `geonamesStats`/`googlePlacesStats` fields of the raw `/cities/search`
   response.
2. **A cached DB-only response is stuck**: because of the double caching
   (1h controller cache + 24h route-level `staticDataCache`), if either
   external API failed even once for a given query/language/user
   combination, that DB-only result can keep being served long after the
   underlying cause is fixed.
3. **`countryCode` isn't resolving client-side**: Phases 2 and 3 both
   require a valid 2-letter uppercase `countryCode`; if the `countries` data
   no longer has `code` as a clean 2-letter ISO string (e.g. it changed
   shape, or is missing for some countries), `handleCitySearchChange` sets
   `countryCode = null` and neither external phase ever runs, no matter what.
4. **Rate limits exhausted**: GeoNames free tier is 1000 req/day, Google is
   100/day + 2000/month, tracked via **in-memory counters that reset on
   process restart** — on a host with frequent restarts/cold starts (e.g.
   Render free tier spinning down), this is inconsistent, but if the
   process has been up and searches are frequent, either limit could be hit
   and then silently degrade for the rest of the window.
5. **GeoNames "poor translation" filter discarding real results**: if
   GeoNames is working but returning identical strings for `en`/`fr`/`ar`,
   Phase 2's `hasProperTranslations` check throws those results away,
   which *should* still trigger Phase 3 (Google) — so this alone wouldn't
   explain DB-only results unless Google is *also* failing for one of the
   reasons above.

## 6. What would confirm the cause

- Hit `GET /cities/search?q=<partial city name not in DB>&countryCode=<XX>&language=en`
  directly and inspect the raw JSON: the `sources` and `geonamesStats` /
  `googlePlacesStats` fields will show whether GeoNames/Google were even
  attempted, and why (`canMakeRequest: false` = rate-limited, missing
  username/key = config issue).
- Check Render's environment variables for `GEONAMES_USERNAME` and
  `GOOGLE_PLACES_API_KEY` are actually present and correct for the current
  deploy.
- Check server logs for `⚠️ GeoNames API error` / `⚠️ Google Places API
  error` around the time of a search.
- Try the same query with `?nocache=true` isn't currently supported on this
  route's controller-level cache (only the route-level `cacheMiddleware`
  honors `req.query.nocache === 'true'`) — worth checking if that's enough
  to bypass the 24h layer for a clean test, or if the controller's own
  cache needs a manual `invalidatePattern('cities-hybrid-search-google*')`
  call to fully rule out stale caching.
