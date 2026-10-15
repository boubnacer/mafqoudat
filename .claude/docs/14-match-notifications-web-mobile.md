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
