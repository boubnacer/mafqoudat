## Reach: post views + social engagement (web + mobile)

How much attention a listing has had, from two independent sources. Both front
ends read the same fields off the posts API; the numbers are produced entirely
server-side.

- **Site views**: `Post.views`/`lastViewedAt` were on the schema and rendered on
  both platforms long before anything incremented them — every listing reported
  zero forever. [postViewTracker.js](server/middleware/postViewTracker.js) now
  counts them, mounted on `GET /posts/:id` **ahead of** `postsCache` — on a cache
  hit the controller never runs, so a counter incremented inside `getPost` would
  miss most views. One viewer counts once per `POST_VIEW_DEDUPE_MINUTES` (30),
  keyed on account id when a token is present and on IP otherwise, and an author
  viewing their own post is not counted. It reads the token through
  `readBearerUserInfo` (exported from
  [optionalAuth.js](server/middleware/optionalAuth.js)) *without* touching
  `req.user`: the detail cache key includes `req.user`, so populating the request
  there would hand every signed-in viewer their own copy of an identical
  response. Consequence: the stored count is always current, the *displayed* one
  can lag by the detail cache TTL (30 min).
- **Social engagement**: every post is auto-posted to the Facebook Page and the
  Instagram account on creation (queued and paced — see **Auto-posting to
  Facebook/Instagram** above). Those publish responses used to be logged and
  discarded; `Post.social.{facebook.postId,instagram.mediaId}` + permalinks are
  now persisted as each publish lands, which is what makes it possible to ask
  Graph anything afterwards. **Posts created before this
  have no ids and can never get stats** — there is no reliable way to map an old
  listing back to its Page copy.
- **Reader**: [socialStatsService.js](server/services/socialStatsService.js) fills
  `Post.socialStats` (fb: views/reactions/comments/shares/engagedUsers/clicks,
  ig: views/likes/comments/saved, plus `fetchedAt` and a per-platform
  `unavailable`). Never on a request's critical path — called fire-and-forget
  via `scheduleRefresh(posts)` and serves whatever is stored. Reads go through
  **Graph's Batch API** (`POST` with a `batch=[...]` form body, 50 objects
  max) — *not* `?ids=`, which **Meta deprecated in v26.0**: it answers every
  such call with `(#100) The ids query parameter is deprecated in v26.0+`, so
  the whole feature silently fetched nothing until this was changed. A
  regression check in `test-social-stats` pins that the parameter never comes
  back. Batch sub-requests each carry their own status code, so one deleted
  Page post costs exactly its own entry and no retry pass is needed; that post
  is marked `unavailable` and never asked about again. Counts and insight
  metrics are fetched as separate
  concerns on purpose: counts (reactions/comments/shares/likes) come off
  ordinary edges the page token already has, while **views, engaged users and
  clicks (FB) / views and saved (IG) all need `read_insights` (FB) /
  `instagram_manage_insights` (IG)** and are simply absent without them.
  Insight metric names are **probed, not assumed — independently per metric,
  not per platform** (Meta replaced `impressions` with `views` on IG in v22
  and retired the Page reach/impressions family in June 2026; `engagedUsers`/
  `clicks`/`saved` are unrelated concepts from views, not alternate names for
  it) — first candidate that answers wins and is memoized per metric for the
  process; a failed probe is remembered for 6h so a missing permission costs
  one probe per metric, not one per refresh, and a rename or missing
  permission on one metric never costs the others. `engagedUsers` (a rollup
  that already overlaps reactions/comments/shares) and `clicks`/`saved` (real
  but separate actions) are deliberately **not** folded into the card-level
  `interactions` total — each stays its own row on the detail-page breakdown
  instead of silently redefining a number that already shipped. Every knob is
  env: `SOCIAL_STATS_TTL_MINUTES` (180), `_BATCH_SIZE` (50), `_MAX_PER_RUN`
  (50), `_FB_VIEW_METRICS`, `_FB_ENGAGED_METRICS`, `_FB_CLICKS_METRICS`,
  `_IG_VIEW_METRICS`, `_IG_SAVED_METRICS`, plus shared `GRAPH_API_VERSION`.
  Graph plumbing common to all three Meta services (version, error predicates)
  lives in [graphApi.js](server/services/graphApi.js). **Freshness is
  two-tier** (`SocialStatsService.ttlFor`): a post younger than
  `SOCIAL_STATS_YOUNG_POST_HOURS` (24) uses `SOCIAL_STATS_YOUNG_TTL_MINUTES`
  (10) instead of the settled-post TTL above. Without this, the very first
  read — moments after creation, before anyone off-site could have reacted —
  stamps `fetchedAt` and blocks every re-check for the next three hours
  regardless of what happens on the Page in between, which is exactly the
  window an owner is most likely checking (post, go react to it yourself,
  come back to look). Requires `createdAt` selected on whatever's passed to
  `isStale`/`refreshStale` — `postStatsOverlay.js` and
  `scripts/refreshSocialStats.js` both select it purely for this, never
  expose it. Missing `createdAt` falls back to the long TTL, never "always
  young". No push/webhook alternative: Instagram doesn't expose a likes
  webhook at all (comments/mentions only), so even a webhook build wouldn't
  make IG likes instant, and it would still need its own public endpoint +
  signature verification + App Review — the two-tier TTL gets most of the
  practical benefit (minutes, not hours) without that project.
  **Deletion is not recoverable**: this is a poll-based reader, not a webhook
  subscriber, so engagement that happened between the last successful read
  and a Page-side deletion is gone the moment the object disappears — the
  post is marked `unavailable` with whatever numbers it last had, not
  whatever activity actually occurred.
- **These three fields never enter the response cache.** `views`,
  `social` and `socialStats` are the fastest-changing fields on a post, while
  `postsCache`/`optimizedPaginatedCache`/`searchResultsCache` (and
  `getUserPosts`' own inline cache) hold the rest of a post response for
  10-30 minutes on purpose — the wrong tradeoff for numbers that change on
  every page view. They first shipped projected straight into the same
  cached aggregate, which froze a fresh view, a just-stored Facebook/
  Instagram id, or a newly-fetched engagement count for up to the cache TTL —
  and because a cache hit skips the controller entirely, the refresh that was
  supposed to keep them current never even fired during that window.
  [postStatsOverlay.js](server/middleware/postStatsOverlay.js) fixes this: none
  of the four read controllers project these fields anymore, and the
  middleware wraps `res.json` **ahead of every cache layer** on all four
  routes, so it runs whether the rest of the response came from a cache hit or
  a fresh aggregate. It reads the three fields fresh (one `findById`/batched
  `find` by `_id`, cheap since it's an indexed point read with no `$lookup`s),
  merges them into the outgoing payload, and is now the *only* place that
  calls `scheduleRefresh` — a listing page's cache hit still triggers a stats
  refresh, which it could never do before. `npm run test-post-stats-overlay`
  covers it offline (both response shapes, a deleted post, an empty page, and
  a DB failure that must not break the response).
- **Refresh paths**: opportunistic on every listing/detail read regardless of
  cache state (see above — covers anything anyone is looking at), plus
  `npm run refresh-social-stats` in `server/` for a scheduler to catch
  listings nobody has opened. A third, optional path:
  [facebookWebhookRoutes.js](server/routes/facebookWebhookRoutes.js) receives
  Meta's Page `feed` webhook (reaction/comment/share on a specific post) and
  calls `scheduleRefreshByFacebookPostIds` — an accelerant on top of the poll,
  never a replacement (webhook delivery is best-effort per Meta's own docs;
  the poll is what guarantees eventual correctness). Signature-verified via
  [facebookWebhookSecurity.js](server/middleware/facebookWebhookSecurity.js)
  against `req.rawBody`, which `server.js`'s global `express.json({ verify })`
  stashes before parsing — HMAC has to run over the exact bytes Meta signed.
  Instagram has no likes webhook at all (comments/mentions only), so IG stays
  entirely poll-based regardless. Fully optional — nothing here does anything
  until `FACEBOOK_WEBHOOK_VERIFY_TOKEN` is set and the Page is subscribed via
  the Meta App Dashboard; setup walkthrough and troubleshooting:
  [facebook-webhooks.md](docs/facebook-webhooks.md). `npm run
  test-facebook-webhook` covers the signature check, the verification
  handshake, and payload parsing offline; the TTL-bypassing refresh path
  itself is covered in `test-social-stats`.
- **Two numbers, never one.** A page visit here, a Facebook reaction and an
  impression in someone's feed are different units — site views and social views
  are never summed, and platforms are never pooled into one total. Same rule as
  the dashboard stat boxes: don't state a measurement nobody took. Counters are
  `null` until actually fetched, so "not fetched", "no insights permission" and
  "genuinely zero" stay distinct; only the last renders.
- **UI**: shared normalizer in [socialStats.js](client/src/utils/socialStats.js)
  mirrored 1:1 at [mobile/src/utils/socialStats.js](mobile/src/utils/socialStats.js).
  Web — [ReachRow.jsx](client/src/components/ReachRow.jsx) on cards (`Post.js`
  grid *and* list layouts, plus `MyPostsPage.jsx`, which still carries its own
  pre-redesign card) and [SocialReach.jsx](client/src/features/posts/PostPage/SocialReach.jsx)
  on the detail page, using the existing eyebrow + icon-and-text vocabulary, no
  new card treatment. Mobile — `PostReachRow` and `SocialReachSection` in
  [SocialReach.js](mobile/src/components/SocialReach.js), used by
  `PostsListScreen`/`MyPostsScreen` cards and `PostDetailScreen`; Phase 9 rules
  apply and direction goes through `utils/rtl.js`. Facebook/Instagram brand
  colors are the one documented exception to the token rule — those rows point at
  Meta, so the palette is not ours to pick.
- **Offline check**: `npm run test-social-stats` in `server/` — no DB, no network,
  stubs Graph with a fake that answers in Meta's error envelope; covers batching,
  the deleted-post fallback, metric probing, permission-less degradation and
  outage handling.
