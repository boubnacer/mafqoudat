## City search (server, one endpoint behind both clients)

`GET /cities/search` ([cityController.js](server/controllers/cityController.js)'s
`searchCities`) is the only city lookup either front end uses while writing a
listing — web's `NewPostForm.js`/`EditPostForm.js` and mobile's
`CityPickerModal.js` all send the same `q`/`countryCode`/`language`/`limit=10`.
It merges three sources: the `City` collection, GeoNames, then Google Places.
Nothing here is a front-end concern; a fix belongs on the server.

- **Which sources get asked, and when, is a billing decision — leave it
  alone.** Google Places is charged per request and each kept result costs
  2-3 further Place Details calls for its translations, so the gate stays
  what it has always been: ask GeoNames only when the database came up short
  of the requested limit, and Google only when the two of them together
  still have not filled it, plus the Arabic-supplement case. A quality-based gate (ask Google whenever
  nothing found so far actually matches what was typed) was written and then
  **reverted on request** — it finds more small places and it also puts a
  billed request behind most searches. Do not re-land it without deciding the
  cost deliberately.
- **Everything is ranked before it is cut.** Sources are merged in the order
  they were asked and then sliced to ten, so a later source's exact match
  landed eleventh and was thrown away. `rankCityMatches` in
  [cityMatching.js](server/utils/cityMatching.js) sorts by how well each
  result matches what was typed (exact / prefix / contains), stably, so ties
  keep source order and an equally good database row still outranks an API
  one. The database query over-fetches (`CANDIDATE_OVERFETCH`, 3x) for the
  same reason: MongoDB's `$text` answers in no particular order, so cutting
  at the display limit there can drop the exact match and keep nine
  near-misses. This costs no external call — it only changes what is done
  with results already fetched.
- **Folding is not only an Arabic problem.** The lookup is a literal
  `$regex`, and nobody types "Aït-Melloul" with the trema and the hyphen.
  `normalizeCityText` folds Latin accents, Arabic harakat, hamza, ta marbuta
  and alif maksura, and `buildCitySearchPattern` expands the folded query
  back into a pattern that matches the unfolded rows — with separators
  optional between every letter, so "ait melloul", "Ait-Melloul" and
  "aitmelloul" are one search. Only separators may be skipped, never a
  letter: this stays a search, not a wildcard. The same folding is what
  de-duplicates one place arriving from two sources under two spellings
  (`cityDedupeKey`), and it is what the database was missing — a row that is
  already stored is found without asking anyone.
- **Offline check**: `npm run test-city-search` in `server/` — no DB, no
  network. Covers the folding in both scripts, that the pattern stays a
  search (a different place still doesn't match, a typed dot is a dot), the
  ranking rescuing an eleventh-placed exact match, and cross-source
  de-duplication.
