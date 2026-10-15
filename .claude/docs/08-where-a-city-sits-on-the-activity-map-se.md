## Where a city sits on the activity map (server)

The dashboard map's city dots are drawn from `cityActivity`, built in
[dependenciesController.js](server/controllers/dependenciesController.js)'s
`getDashboard` — one aggregation over the country's posts, grouped by the city
each one points at. **It asks nothing outside the database, and never will**:
every consumer (web `Dash.js`, `WelcomePage.jsx`'s hero, mobile
`HomeScreen.js`) renders whatever that one payload carries, and the geometry
itself is generated and committed (see **World activity map**).

- **A city's position is stored on its own row** (`City.coordinates`, `{ lat,
  lon }`, absent — not zero — when unknown), saved from the search result the
  author picked. GeoNames and Google Places both answer with coordinates, so a
  village that was found by search is placeable *because* it was found, and the
  read path does no lookup at all. Everything funnels through
  `normalizeCoordinates` in [cityCoordinates.js](server/utils/cityCoordinates.js),
  because each source spells them differently (`{ latitude, longitude }` from
  city search, `{ lat, lng }` from Google's raw geometry, `{ lon, lat }` from
  the offline dataset), and (0, 0) is refused — a missing dot is better than a
  dot in the Gulf of Guinea.
- **Guessing from the name is the fallback, and it was placing towns in the
  wrong province.** [cityGeocode.js](server/utils/cityGeocode.js) fuzzy-matches
  a name against a static 135k-row dataset, and at its old 0.72 threshold "Aït
  Melloul" (outside Agadir) scored 0.727 against "Tit Mellil" (outside
  Casablanca) and took its coordinates — a dot 450km from the city it claimed
  to be. The threshold is 0.85 now *and* the two names have to start with the
  same letter, both measured against the labels this database actually holds:
  every match that is genuinely one place clears both ("Marrakech"/"Marrakesh"
  0.889, "Tanger"/"Tangier" 0.857, "El Jadida"/"El Jadid" 0.889,
  "Ouarzazate"/"Ouarzazat" 0.900, "Sidi Kacem"/"Sidi Qacem" 0.900). A name
  nothing close is found for is left off the map, which is the honest outcome:
  the dot it would otherwise draw is somewhere else.
- **The dataset cannot do villages at all**, which is the whole reason the
  coordinates are stored rather than derived. Irherm, Biougra, Dcheira El
  Jihadia — real towns with listings — are simply not in it, and no threshold
  brings them back.
- **`exactOnly` separates reading from writing.** The dashboard keeps the fuzzy
  pass (a marker recomputed on every request, never stored). Anything that
  *saves* a position — `resolveCityCoordinates`, the backfill script — takes
  the exact match only. A guess that gets written is a guess that gets reused.
- **Rows created before this gain coordinates through ordinary use, with no
  extra API call.** Two paths, both free, both guarded on the field still being
  absent so concurrent writers cannot fight over it and nothing is ever
  overwritten:
  1. `searchCities`'s `adoptApiCoordinates` — a GeoNames/Google result that is
     about to be dropped as a duplicate of a stored row is exactly what can
     place that row, and it has already been paid for. Fire-and-forget: a
     search must never fail or wait for it.
  2. `postsController`'s `fillMissingCityCoordinates` — the author picked a
     search result, we matched it to an existing row, so the coordinates that
     came with the result complete it. It fires **only on an exact label
     match**, even when the row was found by substring, because stamping one
     town's position onto another is worse than leaving the row unplaced.
- **Which row a picked city resolves to is now exact-first** (`findCityByLabels`).
  The lookup has always been an unanchored regex, which is what tolerates a
  stored spelling nobody types twice the same way — and also what answered
  "Agadir Melloul" to somebody who picked Agadir, filing the listing against
  the wrong town and putting its dot in the wrong place. Exact match first, the
  old substring match only if nothing matched exactly.
- **An edit that changes the city shows up immediately.** The dashboard response
  is cached for 5 minutes, and both `createNewPost` and `updatePost` already
  invalidate `dashboard:*`. What was missing is that an update sending a bare
  name or code with no `cityData` behind it stored that string in `post.city`
  (Mixed), leaving every read to guess from text forever; it is now linked to
  the City row it names when one exists — exact label or `code` only, so an edit
  cannot silently move a listing to a namesake town.
- **`npm run backfill-city-coordinates` in `server/`** completes the rows that
  predate all of this. `--report` first: it looks nothing up and writes nothing,
  and says how many rows are missing coordinates, how many of those a post
  actually points at (the only ones the map can ask for), how many carry a
  Google `placeId`, and how many the offline dataset would place for free — so
  the size of the billed part of the job is known before any of it runs. Then
  `--offline-only --apply` for the free pass, and only then the networked one.
  Per city, cheapest and safest first: a Google Place Details call for
  `geometry` when the row has a `placeId` (the only billed request, and the only
  exact one — an id names the place, a name search can land on a namesake), then
  the offline dataset's exact match, then a GeoNames `name_equals` search **per
  label, not just the English one** — GeoNames indexes a place's alternate names
  in every script, so the Arabic label is what finds a city whose Latin label is
  a transliteration nobody else writes that way ("Almhmdya" matches nothing
  anywhere; "المحمدية" is Mohammedia). It stops at the first answer, so a city
  named the same in all three costs one request. A source that cannot answer
  hands the city to the next one rather than giving up on it, and a city nothing
  could place is printed with all three of its labels, because a stored
  transliteration is the usual reason. It cannot run away: the rows are fetched once, each is attempted
  exactly once, Google stops at `--max-google` (25), and a quota or permission
  refusal switches that source off for the rest of the run instead of asking the
  next city. Dry-run by default, `MONGO_TARGET=dev` for the dev database, and it
  never deletes or overwrites anything.
- **Offline check**: `npm run test-city-coordinates` in `server/` — no DB, no
  network. Covers every source's coordinate spelling folding onto one stored
  shape, the pairs that are refused, which source a city about to be written
  takes its position from, that a near-miss is left unplaced rather than
  guessed, and both halves of the tightened fuzzy pass: Aït Melloul no longer
  answers with Tit Mellil, and the five spellings that really are one place
  still resolve.
