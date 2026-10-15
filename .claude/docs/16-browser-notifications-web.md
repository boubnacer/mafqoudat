## Browser notifications (web)

The Web Push half of the channel the mobile app has had since match alerts
shipped: an alert that reaches someone who is not currently looking at
Mafqoudat. Setup, env vars and debugging: [web-push.md](docs/web-push.md).

- **A second transport, not a second feature.** All three alert kinds (match,
  comment, social publish) already existed and already decided who gets one and
  in what language; `pushNotificationService` now hands each composed message
  to two transports — Expo for the app's devices,
  [webPushService.js](server/services/webPushService.js) for the browsers —
  rather than each channel owning its own copy of the wording and the
  preference gate. They cannot share a transport (an Expo token and an endpoint
  URL plus two encryption keys are different protocols), but the decision
  behind the message is one.
- **Subscriptions are their own array on `User`**, beside `pushTokens` and for
  the same per-device reasons, including the stored `language` (a push is
  composed server-side, with no request to read one from) and the same
  cross-account migration guard — a shared computer can carry one browser
  subscription across two accounts, so registering clears the endpoint from
  every other user first. Dead endpoints are pruned on a `404`/`410`, and only
  those: a `429` or a `500` is that delivery's problem, not the subscription's.
- **The VAPID public key is served, not built in.** `GET
  /notifications/web-push-key` answers it, and an empty string when the
  deployment has no keys — which the client reads as "browser alerts are not
  available here", not an error. Building it into the bundle as a second
  environment variable is how the two halves drift: a client built against last
  month's key subscribes to a service that then refuses every send.
- **The service worker is not a PWA worker.**
  [push-sw.js](client/public/push-sw.js) handles `push` and `notificationclick`
  and nothing else — no `fetch` handler, no caching, no Workbox, and it is
  copied verbatim out of `public/` rather than generated. A worker that started
  intercepting requests would quietly become the thing that decides which
  version of the site a visitor sees, which is a much larger commitment than
  receiving a notification. A click reuses a tab already on the site and
  navigates it rather than opening a second window.
- **A browser notification carries a URL, not a screen name** — the one thing
  with no counterpart on the Expo side, and the one that fails silently
  (a notification that looks right and does nothing when clicked). So each
  sender states it: a single match opens the counterpart listing, a burst opens
  the inbox, a comment opens its post, and a social publish alert opens the
  listing's reach section via the same `?section=` deep link the in-app row
  uses. `npm run test-push` pins all four.
- **The offer is made once, immediately before a first listing is published**
  ([EnablePushDialog.jsx](client/src/features/notifications/EnablePushDialog.jsx),
  awaited from `NewPostForm`'s `handleSubmit`). The moment is the argument:
  someone who has just written down what they lost is, right then, a person who
  wants to be told when it turns up. It is an explainer, and the browser's own
  prompt is fired by its Enable button — a denial is permanent, so spending one
  on a visitor who has not been told what it is for spends it badly.
- **Publishing never depends on the answer.** The dialog resolves a promise
  `handleSubmit` awaits, both buttons resolve it, and the listing is created
  either way. A hard gate was considered and rejected: a browser that has
  already denied notifications can never be prompted again, and iOS Safari has
  no Push API at all until the site is installed to the Home Screen — so
  "cannot accept" and "will not accept" are indistinguishable from the page,
  and gating on it would lock those people out of posting entirely. Chrome also
  penalizes sites that gate content behind permission prompts. `canOfferWebPush`
  narrows the offer to a first-time, undecided, capable browser **on a
  deployment that has VAPID keys** — without that last check a site whose keys
  are not configured yet still fires the browser's prompt and registers
  nothing, spending a decision that can never be re-asked. The settings row
  answers to `isWebPushAvailable` instead: someone who dismissed the one-time
  offer must still be able to turn alerts on there, so only "can this work"
  applies.
- **The settings row is not a switch over an account preference.** The browser
  owns this permission, per origin and per profile, so the row in
  `NotificationPreferences` reads the permission *and* the subscription
  together ('on' / 'off' / 'blocked' / 'unsupported') and offers only the
  action that state allows — a browser that granted permission and then turned
  alerts off here is still `granted` and receiving nothing, which the
  permission alone cannot express.
- **Re-registered once per page load** (`NotificationBell`), because push
  services rotate endpoints and the server prunes one the moment a delivery
  comes back "gone" — without it a browser can stop receiving alerts with
  nothing on either side saying so. Signing out unsubscribes, server first
  while the session still has a token.
- **That sync subscribes, it does not only re-register.** Three states look
  identical from the page — permission granted and nothing ever arriving — and
  only one of them was repairable: an endpoint that rotated, a browser with
  permission but *no* subscription at all (site data cleared, a first save that
  failed, a sign-in on a browser that granted for another account), and a
  subscription bound to a superseded VAPID key, which the push service will
  accept from nobody. `ensureSubscription` is now the one path both
  `requestSubscription` and `syncSubscription` take, and it creates or replaces
  as needed; `subscribe()` needs no user gesture, only the prompt does. The New
  Post offer cannot cover any of this — it only fires while the permission is
  still `default`. The page-load flag also no longer latches on failure: it was
  set *before* the call, so one attempt landing on an expired access token left
  the browser unregistered for the whole session.
- **The key route is public, and a failed key fetch is retried rather than
  remembered.** The VAPID public key authorises nothing — every subscribing
  browser receives it — but it sat behind `verifyJWT`, and the client asks once
  per page load and caches the answer. So a request landing while the access
  token was expired (the boot-time silent refresh, a rate-limited burst)
  answered 401, and `''` became "this deployment cannot send" until the next
  reload: no offer on the New Post form, and a settings row reporting the
  channel unavailable. It is the one route in `notificationRoutes.js` declared
  above `router.use(verifyJWT)`. The subscription save is a plain `fetch`, so
  it does not inherit `apiSlice`'s refresh-and-retry either — it now refreshes
  once itself on a 401, which is what the long-lived tab the sync exists to
  repair actually hits.
- **`pushAlerts` gates both transports, and only the app could see it.** It is
  the account-level master over Expo *and* Web Push (all three senders check
  it), but its only control lived in the mobile preferences panel — so a
  subscribed, permitted browser could be silenced by a switch the web UI never
  showed, which is the one failure that looks completely healthy from the
  client. The web panel now carries the same switch above the browser row, the
  browser row says so when it is subscribed under a muted master, and turning
  browser alerts on from settings turns it back on.
- **Nothing said whether the channel was configured at all.** Every failure
  here is swallowed on purpose — a push must never cost a match, a comment or a
  publish — which makes a deployment with no VAPID keys behave exactly like a
  working one with no subscribers. `webPushService.describeConfiguration()` is
  the one thing that separates them: `server.js` states it in one line at boot
  (naming the missing variable and the command that generates a pair), and
  `npm run doctor-push` answers it on demand — configuration, subscriber
  counts, one account's browsers/devices/preference gates, and `--send` for a
  real end-to-end delivery that writes nothing to the inbox. It validates the
  pair through `web-push` itself rather than by eye, and a `CLIENT_URL` that is
  neither `mailto:` nor `https:` (every developer's `http://localhost:3000`)
  falls back to a `mailto:` subject instead of taking the whole channel down —
  `setVapidDetails` rejects it outright. `render.yaml` declares the keys, which
  it never did; they are `sync: false`, so an unset deployment is now a visible
  gap rather than an invisible one.
- **`/push-sw.js` is served `no-cache`.** Vercel's generic `/(.*)\.js` header
  rule gave it `max-age=3600, s-maxage=86400`, so a changed service worker
  could be a day stale on the CDN and a browser is allowed to satisfy its own
  update check from the HTTP cache while `max-age` holds. Its rule is declared
  *after* the generic one, because every matching header rule is applied in
  order and the last value set for a key wins.
- **`webPushSubscriptions.endpoint` is indexed**, like `pushTokens.token`
  beside it and for the same two lookups: registration asks which account
  already holds an endpoint, and pruning a dead one asks the same — the second
  inside the send loop.
