# Mafqoudat

Multi-country/multilingual (en/fr/ar, full RTL) lost-and-found classifieds platform. `client/` = CRA + MUI v5 + Emotion, `server/` = Express, `mobile/` = Expo/React Native. `mobile/` historically out of scope for design work, now brought in for specific passes (dashboard header port, category picker parity, border removal, card shadow removal) — check recent commits/CLAUDE.md before assuming mobile screen untouched.

## Design tokens

Source of truth: [client/src/designTokens.js](client/src/designTokens.js), resolved per light/dark mode, consumed by [client/src/theme.js](client/src/theme.js) (`themeSettings(mode, currentLanguage)`, exposed on MUI theme as `theme.custom`). New work reads from `theme.custom.*`, never hardcode. [mobile/src/theme/tokens.js](mobile/src/theme/tokens.js)'s `colorTokens`/`radiusTokens`/`fontFamilies` mirror these 1:1 for RN screens (separate `getElevation(isDark, level)` helper per screen file stands in for `elevationTokens`, since RN has no CSS boxShadow) — mobile also carries older, pre-existing `lightColors`/`darkColors`/`radii` palette most legacy screens read from instead; prefer `colorTokens` for new/touched work there too.

**Palette** (`colorTokens`, light / dark):
- `brandPrimary`: `#1B4DFF` / `#5B7FFF` — brand accent
- `ink`: `#0B1220` / `#EDEFF5` — primary text
- `surfaceBase`: `#F7F8FB` / `#0E1116` — page background
- `surfaceRaised`: `#FFFFFF` / `#171B22` — card/paper background
- `postsListBackdrop`: `#EDEFF6` / `#0E1116` — page-level backdrop (not a card color) for the posts list screens themselves, since plain `surfaceRaised` cards sat directly on flat `surfaceBase` w/ no panel/gradient between them and were only ~3% off it in light mode, nearly invisible. Cards on that page stay plain `surfaceRaised` (white); the page behind them gets this deeper tone instead so the cards read clearly. Dark mode value equals `surfaceBase`'s dark value verbatim (no-op) — `surfaceRaised` already separates from `surfaceBase` enough there. Used by the posts list page container only (web `PostsList.js`/`PostsListSkeleton.jsx` root Box, mobile `PostsListScreen.js`/`MyPostsScreen.js` `container`/`searchRow`) — other pages keep plain `surfaceBase`.
- `status.lost`: main `#D6483B` / `#FF6B5E`, bg `#FBEAE8` / `rgba(255,107,94,0.16)`, border=main — semantic color, "Lost" posts
- `status.found`: main `#1E8F6B` / `#3DDCA6`, bg `#E5F5EF` / `rgba(61,220,166,0.16)`, border=main — semantic color, "Found" posts

Note: `theme.js` still carries large legacy `palette.floptions` / `palette.categories` block (pre-Phase-1, per-category colors) — leave as-is unless phase targets it; prefer `colorTokens.status` for new Lost/Found UI.

**Typefaces** (`fontFamilies`): `display` = Cairo, `body` = IBM Plex Sans Arabic (both w/ Segoe UI/Roboto/Helvetica/Arial fallbacks). Chosen: both solid Arabic + Latin glyph coverage, no per-language font swap needed — same faces work across en/fr/ar.

**Spacing**: 8px base unit (`theme.spacing(factor) = 8 * factor`px).

**Radius** (`radiusTokens`, 8px-based scale): `sm` 8, `md` 12, `lg` 16, `xl` 24.

**Elevation** (`elevationTokens`): `e1`/`e2`/`e3`, shadow values differ per light/dark mode.

## Established component patterns

Reuse these, don't invent new card/panel treatment — now house style:

- **Post card DNA** (canonical in [Post.js](client/src/features/posts/PostsList/Post.js), reused in [TrendingItem.jsx](client/src/components/dashboard/TrendingItem.jsx)): `surfaceRaised` background, `radius.lg`, `elevation.e1` → `e2` on hover w/ `translateY(-4px)` lift, no border (elevation alone separates from page), `borderInlineStart: 6px solid <status.found|lost main>` accent bar. Status shown as solid-fill tag (`TaskAltOutlined`/`SearchOffOutlined` icon + label, `theme.palette.getContrastText()` for text) at `insetInlineStart`, paired w/ translucent `alpha(surfaceRaised, 0.85)` date badge at `insetInlineEnd`. Also reused as compact variant by `HeroPostCard` in [WelcomePage.jsx](client/src/components/WelcomePage.jsx) (hero's live-post snapshot row): same surface/radius/accent-bar, hover-lift eased to `translateY(-3px)` for smaller card, but status tag + date move inline into card body/meta row instead of absolute overlay badges on thumbnail — use condensed layout when card small (e.g. 3-up row) and overlay badge would crowd image.
- **Paired dashboard panel** (`SectionPanel` + `SectionTitle` in [LeftSide.jsx](client/src/components/dashboard/LeftSide.jsx) / [TrendingItem.jsx](client/src/components/dashboard/TrendingItem.jsx)): blurred-gradient `surfaceRaised` container, `radius.lg` (16px) mobile / `radius.xl` (24px) desktop, no border, centered `ink`-colored title (`h5`, weight 700, `{xs:1.5rem, sm:1.75rem, md:2rem}`). Use shell for new dashboard section sitting alongside stats/trending row.
- **Generic surface card** (`SurfaceCard` in [WelcomePage.jsx](client/src/components/WelcomePage.jsx)): plain `surfaceRaised` box, `radius.xl`, `elevation.e2`, no border — no title treatment, no status accent bar. For one-off content blocks (coverage-stats bar, safety/trust callout, error state) not needing panel title or card accent bar; use instead of bespoke box styling.
- **Header control pill** (`ControlButton`, now living in [WelcomePage.jsx](client/src/components/WelcomePage.jsx)): `surfaceRaised` background, `radius.md`, no border, `elevation.e1` → `e2` on hover (no lift) — used for language selector, paired w/ matching elevated (borderless) `IconButton` for light/dark mode toggle. Use for any new top-bar/header control instead of bespoke button.
- **No borders on containers**: cards/panels/pills (web `theme.custom`-based components + mobile `colorTokens`-based screens alike) separated from page background by `elevation`/`getElevation()` shadow alone, never `1px solid` border — removed platform-wide in later pass (see Design phases). Does *not* apply to buttons, form inputs, toggle/select controls, dropdown/menu/dialog chrome, or post card's status accent bar — all keep borders.
- **Section eyebrow label** (`SectionEyebrow` in [WelcomePage.jsx](client/src/components/WelcomePage.jsx)): `variant="overline"`, weight 600, `letterSpacing: 1`, `text.secondary` color — small caps-style label introducing subsection inline (e.g. "Recent near you" above hero post snapshot). Lighter-weight than `SectionTitle`'s h5 panel heading; use for inline subsection labels not warranting full panel shell.
- **Found/Lost duality as one connected shape, not two separate cards** ([FoundLostStrip.jsx](client/src/components/dashboard/FoundLostStrip.jsx)): when section shows both counts side by side, prefer single component w/ proportional fill (found:lost ratio) over two independent stat boxes — shape should carry relationship, not just two numbers.
- **RTL**: newer components (`FoundLostStrip.jsx`, `TrendingItem.jsx`, `WelcomePage.jsx`) use CSS logical properties (`insetInlineStart/End`, `borderInlineStart/End`, `marginInlineStart/End`) which auto-flip w/ document direction — prefer over manual `currentLanguage === 'ar' ? ... : ...` checks or `'[dir="rtl"] &'` selector overrides (still present in older dashboard components) when writing new UI.
- **Data integrity**: don't decorate real numbers w/ fabricated ones. Found + removed hardcoded fake `increase` percentage (`+14%` etc., never actually rendered) on stat boxes, reframed `TrendingItem` — query is `$limit: 1` sorted by `createdAt desc` (intentionally "latest post," not popularity/engagement metric) — so UI doesn't imply metric not backed by real data.

## Known tokenization debt (not yet fixed — out of scope so far)

- [RenderIcon.jsx](client/src/components/RenderIcon.jsx): `Found`/`Lost`/`total`/`returned` icons carry own hardcoded `sx={{ color: '#...' }}` (e.g. Lost's icon grey, not red) not following `theme.custom.status`. Newer components (`FoundLostStrip.jsx`, `TrendingItem.jsx`) sidestep by importing MUI icons directly instead of going through `RenderIcon` for Found/Lost. Worth real fix if future phase touches icon rendering broadly.
- [LoadingStates.jsx](client/src/components/LoadingStates.jsx): shared `EmptyState` component (used by `NoPosts`, `NoRecentFounds`, `NoTrending`, etc.) still styles off `theme.palette.mode`/`theme.palette[variant]` rather than `theme.custom`. Left alone — shared across many non-redesigned sections; retheming good candidate for whichever phase does broader empty-state pass.

## Design phases

- Phase 1 — design system / [theme.js](client/src/theme.js) + [designTokens.js](client/src/designTokens.js): done
- Phase 2 — [WelcomePage.jsx](client/src/components/WelcomePage.jsx): done
- Phase 3 — post card + the public posts listing: done. (That listing, `PublicPostsPage.jsx`, was later deleted — it duplicated `/dash/posts`, and the `vercel.json` `/posts/:path*` API rewrite meant `/posts` could not reliably serve it. `/dash/posts` is the only listing; the card treatment lives on in `Post.js`.)
- Phase 4 — [NewPostForm.js](client/src/features/posts/NewPost/NewPostForm.js): in progress
- Phase 7 — dashboard header: stats ([LeftSide.jsx](client/src/components/dashboard/LeftSide.jsx) + new [FoundLostStrip.jsx](client/src/components/dashboard/FoundLostStrip.jsx)) and the trending/latest-post spotlight ([TrendingItem.jsx](client/src/components/dashboard/TrendingItem.jsx)), both in [Dash.js](client/src/features/dashboard/Dash.js): done. (Phases 5-6 aren't tracked in this file — fill in if they happened elsewhere.)
- Phase 8 — remove borders from containers platform-wide (elevation-only surfaces), across both `client/` (WelcomePage, the since-removed PublicPostsPage, dashboard panels/cards in `LeftSide.jsx`/`TrendingItem.jsx`/`RecentPosts.jsx`/`Categories.jsx`/`QuickActions.jsx`/`RecentSection.jsx`/`Process.jsx`/`HelpSupportSection.jsx`/`SearchPartyHero.jsx`/`Dash.js`/`TotalBox.jsx`) and `mobile/` (`HomeScreen.js`, `WelcomeScreen.js`, `PostDetailScreen.js`, `PostsListScreen.js`, `MyPostsScreen.js`, `ProfileScreen.js`, `AppHeader.js`, `LoginScreen.js`, `SignUpScreen.js`): done. This is the first design pass to touch `mobile/`.
- Phase 9 — `mobile/` parent card/panel containers lose their shadow entirely (border was already gone from Phase 8); their nested badge/icon/pill sub-elements (still borderless) pick up a small shadow (`getElevation(isDark, 1)`) instead, so depth reads from the sub-elements rather than the outer card. Touched `HomeScreen.js` (`panelContainer`/`foundLostStrip`/`bigStatCard`/`posterCard`/`recentEmpty`/`socialPanel` parents; `statSegmentIcon`/`bigStatCardIcon`/`posterStatusPill`/`posterReturnedPill`/`socialIconCircle` sub-elements), `PostsListScreen.js` + `MyPostsScreen.js` (`postCard`/`postCardSkeleton` parents; `statusTag`/`dateBadge`/`categoryPill`/`lifecycleBadge` sub-elements), `PostDetailScreen.js` (`body` parent; `statusTag`/`dateBadge`/`categoryChip` sub-elements), `ProfileScreen.js` (`infoCard`/`menuCard` parents; `infoRowIcon`/`menuRowIcon` sub-elements), `SettingsScreen.js` (`card`/`menuCard` parents, no sub-element badges), `WelcomeScreen.js` (`heroCard` parent; `heroStatusTag` sub-element — `createStyles` there now also takes `isDark`), `LoginScreen.js`/`SignUpScreen.js`/`EditProfileScreen.js` (`card` parent only — their inner elements are form inputs/buttons, exempt from this treatment same as the border rule). Buttons, form inputs, and dropdown/menu/dialog chrome (`filterButton`/`paginationBar`/`addPostButton`/`chip`/`countryDropdown`/toast/notice banners) were left with their existing elevation — same exemption list as Phase 8's border removal, not new "cards." Where a screen's `getElevation` helper ended up with no remaining callers (`LoginScreen.js`, `SignUpScreen.js`, `EditProfileScreen.js`, `SettingsScreen.js`), the now-dead helper was deleted rather than left unused: done.
- Phase 10 — mobile `HomeScreen.js` statistics section brought to parity with web's `LeftSide.jsx` mobile/xs layout: done. Phase 9 had left the stats panel an opaque `surfaceRaised` card containing an equally opaque `surfaceRaised` Found/Lost strip and stat cards, so the inner boxes vanished into their own parent. Now the panel itself is a bare wrapper (`statsPanelGlass`: transparent, no padding — mirrors web's 14%-opacity wash, which reads as nothing on a flat background), the Found/Lost strip and the two stat cards keep their own fill and are the only shapes that read, and Total items takes web's `brandPrimary` tint (8% light / 14% dark) against Returned's plain `surfaceRaised`. The stats-section icon squares (`statSegmentIcon`/`bigStatCardIcon`) drop the Phase 9 sub-element shadow and go flat-tinted like web's, since the parents carry separation again — the Phase 9 treatment still stands everywhere else. Lost segment icon switched to `search-outline` (web's `SearchOffOutlined`, and what the same screen's recent-posts section already uses) instead of `help-circle-outline`.

- Phase 11 — mobile `HomeScreen.js` world activity map brought to parity with web's `Dash.js` mobile header: done. Map loses its `Panel` wrapper (no `worldActivityCountries` title, no card, no radius, no loading tint) and becomes a chrome-less full-bleed backdrop — absolutely positioned, bottom-anchored in the header stack, pulled out past `scrollContent`'s 16px padding (`SCREEN_PADDING`) to the screen edges, with a square `mapSpacer` below the stats reserving its room (web's spacer row). Stats now float over it, same as web. Web's oversized/CSS-percentage-cropped map layer isn't reproduced (react-native-svg percentage sizing renders corrupted on a `flex: 1` parent); the placement comes from layout instead.

- Phase 12 — neumorphic ("soft UI") treatment for mobile `HomeScreen.js`'s **Browse by category** and **Follow us** sections only: done. Both now paint their elements in the page's own `surfaceBase` tone and read purely from a top-left highlight + bottom-right shade, so the category circles lose their `config.backgroundColor` tint and the social panel/buttons lose their `surfaceRaised` fill and brand tint (category/brand color survives in the icon — a tinted fill would break the one rule the effect rests on). Palette lives in [mobile/src/theme/neumorphism.js](mobile/src/theme/neumorphism.js) (derived from `colorTokens[mode].surfaceBase`, deliberately outside `tokens.js` since that file mirrors web 1:1 and this has no web counterpart), rendered by [mobile/src/components/NeumorphicSurface.js](mobile/src/components/NeumorphicSurface.js): three layers (shade view / highlight view / two-stop gradient face), because RN takes one shadow per view and Android renders only `elevation` — the gradient is what carries the bevel there, and the highlight layer omits `elevation` so it no-ops instead of stacking a second dark drop. Sizing/padding go on the component's `contentStyle`, not `style`. Press state sinks the face (reversed gradient, both shadows dropped) instead of fading it, so these two sections use `Pressable` with a render-prop child rather than `TouchableOpacity`. Light source is fixed at the physical top-left in LTR and RTL alike. Rest of the Home screen (stats, map, recent posts, safety footer) is untouched and still Phase 9-11.

- Phase 13 — neumorphic treatment extended to the mobile first-launch onboarding slides ([mobile/src/screens/onboarding/OnboardingScreen.js](mobile/src/screens/onboarding/OnboardingScreen.js)): done. Same `NeumorphicSurface` + `theme/neumorphism.js` machinery as Phase 12, now on every interactive field of the slides — language chips, light/dark options, filter pills, the country picker button and its list. All lose their `surfaceRaised` fill, borders and brand tints and become faces in the screen's own `surfaceBase` tone; brand blue survives in icons and text only. Selected state is the sunken face (`pressed`), which is also the press affordance, so those controls are `Pressable` with a render-prop child. Three structural consequences: the light/dark segmented control **dropped its track** and became two standalone pebbles beside each other (a raised face nested inside another face gets its shadow clipped by `NeumorphicSurface`'s `overflow: 'hidden'` highlight layer — fine where the parent's padding exceeds the shadow, as in Home's social panel, not at a segmented control's 4px), the country dropdown became a sunken well instead of a floating card, and the selected country row lost its tint in favour of a brand-colored label + checkmark. The footer CTA deliberately stays a filled brand-blue button — a soft UI still needs one shape that outranks the rest, and a face in the page tone cannot be it; only its *disabled* state drops to a sunken face (`ctaFace` is shared by both so the footer never changes height), while the submitting state keeps the filled button and its spinner. Illustrations, headlines, dots and Skip untouched.

## Match notifications (web + mobile)

Lost↔found matching engine + in-app notifications. The engine and API are shared —
`client/` and `mobile/` are two front ends over the same `/notifications/*` routes,
so a scoring or wording change belongs on the server or in both translation files,
never in one platform's UI.

- **Engine**: [matchingService.js](server/services/matchingService.js). On post create/edit
  (fire-and-forget `scheduleMatchScan`, deferred via `setImmediate` — never blocks or fails
  a post write) it scans the *opposite* `foundLost` side of the same country, sharing ≥1
  category, within `MATCH_LOOKBACK_DAYS`. Scores each pair 0-100 on five weighted signals:
  category 30 / city 20 / location-text 10 / date 15 / keywords 25 (+8 bonus for a shared
  reference number). Category alone never qualifies — a pair needs at least one
  corroborating signal. **Shared category + same city is floored onto the strong-match
  boundary (75)** by `applyCoreMatchFloor`, whatever the other signals say: that pair is the
  product's core promise, and free text is the least reliable part of a listing. Consequence:
  `PostMatch.breakdown` can sum to less than `score` — it's a per-signal record, not the
  arithmetic behind the total. `GOOD_MATCH_SCORE`/`STRONG_MATCH_SCORE` are exported and the
  API's tier bands read them rather than restating the numbers.
  Pure helpers live in [textMatching.js](server/utils/textMatching.js)
  (en/fr/ar script-normalized tokenizer + Dice similarity) and
  [postDates.js](server/utils/postDates.js) (parses the free-text `mainDate` written by
  `DateEntryDialog`, month names in all three languages).
- **Tunables** (all env, all optional): `MATCH_MIN_SCORE` (store floor, 40),
  `MATCH_NOTIFY_MIN_SCORE` (notify floor, 50), `MATCH_EMAIL_MIN_SCORE` (70),
  `MATCH_LOOKBACK_DAYS` (180), `MATCH_CANDIDATE_LIMIT` (300), `MATCH_MAX_PER_RUN` (10).
  `MATCH_LOOKBACK_DAYS` and `MATCH_MAX_PER_RUN` are the two levers on alert volume — with
  the category+city floor in place, every same-category counterpart in the same city within
  the lookback window is a strong match, so a dense city/category combination produces a lot
  of them. The per-user confidence slider caps at 75 (client and API both) so a strong match
  can never be filtered out by a preference; turning match alerts off entirely still works.
- **Models**: [PostMatch.js](server/models/PostMatch.js) (the scored pair — canonical
  `postA`/`postB` ordering for its unique index, per-user `dismissedBy`) and
  [Notification.js](server/models/Notification.js) (one row per recipient, unique on
  user+type+post+matchedPost so re-scoring updates in place). `User.notificationPreferences`
  and `Post.lastMatchScanAt` were added for this.
- **API**: `/notifications/*` ([notificationRoutes.js](server/routes/notificationRoutes.js) /
  [notificationsController.js](server/controllers/notificationsController.js)), all behind
  `verifyJWT` and scoped to `req.user`. The inbox and the unread badge share one pipeline so
  the badge can never claim a count the list won't render; both drop notifications whose
  posts are no longer active/unreturned. Localization happens server-side from a `language`
  query param — reason/tier codes stay stable, wording lives in `translations.js`.
- **The inbox returns groups, not rows.** `GET /notifications` `$group`s by the *recipient's
  own post* and pages over groups: `{ id (own post id), post, matches[], matchCount,
  unreadCount, topScore, topTier, latestAt }`. One new listing in a dense city/category
  produces a notification per pair all at once, and flat that is a wall of near-identical
  rows. Grouping is a **read-time** concern only — the per-pair rows stay the unit of
  read/dismiss state (each counterpart is judged on its own), nothing was migrated, and
  older notifications group retroactively. `unreadCount` everywhere still counts individual
  alerts, so it matches the bell badge exactly; `total`/`totalPages` count groups. Matches
  inside a group are sorted by score in JS (not `$sortArray`, to stay off a server-version
  floor) and capped at 20, with `matchCount` reporting the true total.
- **Client**: [features/notifications/](client/src/features/notifications/) — navbar
  `NotificationBell` (60s unread poll, popover of `NotificationGroupPreview` rows),
  `/dash/notifications` page (tabs + inline `NotificationPreferences`) rendering
  `NotificationGroup` (header + up to 3 `NotificationItem` rows, expandable), and
  `PostMatchesPanel` on post detail for the owner
  (which is also the retroactive path: it triggers an on-demand, 6h-throttled scan, so posts
  predating the engine still get leads). Reuses the paired-panel and status-tag patterns
  above; no new card language.
- **Mobile**: [components/notifications/](mobile/src/components/notifications/) +
  [NotificationsScreen.js](mobile/src/screens/NotificationsScreen.js), over
  [notificationsApi.js](mobile/src/api/notificationsApi.js) (plain axios wrappers, no
  RTK Query on this side). Same three surfaces as web: a badged bell in
  [AppHeader.js](mobile/src/components/AppHeader.js) (plus a counted row in `HeaderMenu`),
  the inbox screen with tabs + inline preferences, and `PostMatchesSection` on
  `PostDetailScreen` for the owner. Unread count lives in
  [NotificationsContext.js](mobile/src/context/NotificationsContext.js) rather than in each
  header — AppHeader remounts on every navigation, so a per-component poll would restart
  its timer constantly; it polls only while signed in *and* foregrounded (`AppState`).
  `NotificationGroupCard` is the mobile twin of web's `NotificationGroup`, with
  `NotificationCard` as the per-counterpart row inside it.
  Follows Phase 9 for parent cards (borderless and shadowless) and routes every
  direction-dependent style through `utils/rtl.js`. The sub-elements are the one
  documented departure from Phase 9: `MatchThumbnail`'s square and `MatchMeta`'s
  confidence badge + reason chips carry a `StyleSheet.hairlineWidth` ink outline
  (`${ink}33` dark / `${ink}1F` light) instead of the sub-element shadow — several
  pills to a row made those shadows read as smudges on the post-detail section.
  Differences from web, both deliberate: the confidence floor is a row of discrete
  options instead of a slider (no slider dependency in this app, and a tap beats a drag
  on a phone), and `formatDaysApart` carries Arabic dual/small-plural forms the way
  `utils/relativeTime.js` does — the web copy was given the same forms so both platforms
  word it identically.
- **Device push (Android only, mobile)**: the third delivery channel, after the in-app
  inbox and the opt-in email, and the only one that reaches a user who is not looking at
  the app. Sent through Expo's push service (one HTTPS POST, no vendor SDK) by
  [pushNotificationService.js](server/services/pushNotificationService.js); tokens live on
  `User.pushTokens` (per device, each carrying the language its messages are written in,
  since a push is composed server-side with no request to read a language from) and are
  registered/revoked via `POST`/`DELETE /notifications/push-token`. Gated by
  `notificationPreferences.pushAlerts` *and* the master `matchAlerts` switch *and* the OS
  permission. **One push per recipient per scan run, never one per pair** — `matchingService`
  collects them (`pushQueue` → `dispatchQueuedPushes`) precisely because the category+city
  floor makes bursts normal; the inbox can group after the fact, a notification tray cannot.
  Only a genuinely new notification row queues one, so a rescan never re-buzzes a seen pair.
  App side: [pushNotifications.js](mobile/src/utils/pushNotifications.js) (permission, token,
  the `match-alerts` Android channel whose id is a contract with the server, tap targets),
  registration in `NotificationsContext`, tap routing in `App.js` (reuses the deferred
  deep-link machinery — a tap can land before either navigator is mounted), revocation on
  sign-out in `AuthContext`. iOS is switched off in exactly one place
  (`SUPPORTED_PLATFORMS`) pending an APNs key; nothing else is platform-specific. Setup,
  FCM credentials and the Expo Go caveat: [PUSH_NOTIFICATIONS.md](mobile/PUSH_NOTIFICATIONS.md).
- **Offline checks**: `npm run test-matching` in `server/` — no DB needed, covers
  normalization, date parsing and scoring. `npm run test-push` — no DB or network, stubs
  the Expo transport and covers what a recipient actually receives (direction wording,
  per-device language, burst collapsing, dead-token pruning).

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
  Instagram account on creation. Those publish responses used to be logged and
  discarded; `Post.social.{facebook.postId,instagram.mediaId}` + permalinks are
  now persisted by `createNewPost` (each on its own subpath, so the two
  concurrent fire-and-forget writes cannot clobber each other), which is what
  makes it possible to ask Graph anything afterwards. **Posts created before this
  have no ids and can never get stats** — there is no reliable way to map an old
  listing back to its Page copy.
- **Reader**: [socialStatsService.js](server/services/socialStatsService.js) fills
  `Post.socialStats` (fb: views/reactions/comments/shares, ig: views/likes/
  comments, plus `fetchedAt` and a per-platform `unavailable`). Never on a
  request's critical path — called fire-and-forget via `scheduleRefresh(posts)`
  and serves whatever is stored. Reads are batched (`?ids=`, 50 max); a batch
  that fails on an unreadable object is retried one id at a time so one deleted
  Page post costs one listing's numbers, not the page's. A post whose Page copy
  is gone is marked `unavailable` and never asked about again. Counts and views
  are fetched as separate concerns on purpose: counts come off ordinary edges
  the page token already has, **views need `read_insights` (FB) /
  `instagram_manage_insights` (IG)** and are simply absent without them.
  Insight metric names are **probed, not assumed** (Meta replaced `impressions`
  with `views` on IG in v22 and retired the Page reach/impressions family in
  June 2026) — first candidate that answers wins and is memoized for the process;
  a failed probe is remembered for 6h so a missing permission costs one probe,
  not one per refresh. Every knob is env: `SOCIAL_STATS_TTL_MINUTES` (180),
  `_BATCH_SIZE` (50), `_MAX_PER_RUN` (50), `_FB_VIEW_METRICS`, `_IG_VIEW_METRICS`,
  plus shared `GRAPH_API_VERSION`. Graph plumbing common to all three Meta
  services (version, error predicates) lives in
  [graphApi.js](server/services/graphApi.js).
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
  listings nobody has opened.
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

## Rules for this work

- Use existing design tokens (`theme.custom.*` from designTokens.js); never hardcode colors or font-families in component styles.
- Pull user-facing text from [translations.js](client/src/utils/translations.js) via `useTranslation()`; never hardcode English strings.
- Verify light/dark mode + LTR/RTL before considering page done.
- For `NewPostForm.js`: styling/layout changes only. Never touch Formik state, validation logic, city search `fetch()` calls, or submission logic without explicit user confirmation first.
- Don't invent new card/panel visual language where established pattern (above) fits — extend/adapt instead.


SaaS design

<!-- caveman-begin -->
## Response style (caveman mode)

Applies to Claude's response *style* only, not scope of work. The existing
rules above (design tokens, translations, NewPostForm constraints, phase
scope, etc.) govern what Claude does and always win on conflict.

- Terse. Technical substance stays intact — only fluff drops.
- Drop articles (a/an/the), filler (just/really/basically/actually/simply),
  pleasantries (sure/certainly/happy to), hedging. Fragments OK. Short
  synonyms over long phrasing ("fix" not "implement a solution for").
- No tool-call narration, no decorative tables/emoji, no dumping raw error
  logs — quote only the shortest decisive line.
- Standard tech acronyms OK (DB/API/HTTP). Never invent new abbreviations
  (cfg/impl/req/res) — saves no tokens, adds friction. No causal arrows (→).
- Code blocks, technical terms, API names, CLI commands, commit-type
  keywords (feat/fix/...), and error strings: always exact, verbatim.
- Reply in the user's language; compress style, not language.
- Never name or announce the style ("caveman mode on", etc.) — just answer.
- Default shape: state the thing, then the action or fix, then why. Skip
  the shape when it doesn't fit.
- Drop compression for: security warnings, irreversible-action
  confirmations, multi-step sequences where compression risks misreading,
  or when the user asks to clarify — write normal prose there, then resume.
- Code, commit messages, and PR descriptions: always written normal, never
  compressed.
- To get a normal-prose reply for one message, ask: "explain this in full
  prose" or "normal mode for this reply."
<!-- caveman-end -->
