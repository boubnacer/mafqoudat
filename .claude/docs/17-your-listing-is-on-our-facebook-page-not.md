## "Your listing is on our Facebook page" notifications (web + mobile)

Tells a listing's author what became of its auto-posted copy. The publish is
queued and paced (see **Auto-posting to Facebook/Instagram** above), so it lands
anywhere from a minute to — after a quota deferral or a spam-block cooldown —
many hours later, and until now that happened entirely out of sight.

- **One alert per platform, sent the moment that platform's job reaches a
  terminal state.** Never one combined "shared to both": the two jobs are
  independent (Facebook paces at 60-105s, Instagram at 180-300s, either can be
  deferred alone, either can fail while the other succeeds), so holding the
  first until the second resolves would delay an alert whose whole value is
  immediacy, and would need cross-job state the queue does not otherwise keep.
  Two rows is what actually happened.
- **Only a terminal outcome writes anything.** `recordPublished` announces a
  success (including the `recovered` path, where the platform turned out to
  already carry the listing); `retryOrFail` announces a failure *only* when it
  gives up after `MAX_ATTEMPTS`. A retry, a rate-limit cooldown, a quota
  deferral and a credentials stand-down all still end with the listing going up
  by itself — saying "failed" while the queue is still working on it would be
  wrong twice over. A cancelled job (listing deleted or no longer active) says
  nothing at all.
- **The write is fire-and-forget and doubly guarded.**
  [socialPublishNotificationService.js](server/services/socialPublishNotificationService.js)
  never throws, and `SocialPublishQueue.announce` catches on top of that: a
  notification must never be able to turn a successful publish into a retried
  one. It is a constructor seam (`notifyAuthor`) for the same reason
  `invalidateSocialImage` is — the offline harness has no `Notification`/`User`.
- **`Notification.type` gained `social_published`**, with `platform`
  (facebook|instagram) and `socialStatus` (published|failed) required only for
  it, and its own `partialFilterExpression` unique index on
  `{user, type, post, platform}` — the queue retries, reclaims stalled jobs and
  can be re-run by hand, and that index is what stops one listing reaching one
  page from buzzing its author twice. `server.js`'s `Notification.syncIndexes()`
  picks it up on deploy.
- **The inbox gains a third source.** `notificationsController.listNotifications`
  already merged grouped match leads with flat comment rows in JS; social rows
  are flat too (`kind: 'social'`) and join the same time-sorted merge, with
  `getUnreadCount` summing all three so the bell badge and the list agree.
  Unlike matches, a *returned* or resolved listing is not filtered out — the
  copy really is on that page whatever the listing did since, and this is the
  reader's own post, not a lead to chase. No permalink travels with the row:
  both clients open the listing's reach section, which reads the links live off
  the post, so a copy deleted from the Page afterwards cannot leave a dead link
  in an inbox.
- **Preference**: `notificationPreferences.socialAlerts` (default on),
  independent of `matchAlerts`/`commentAlerts` — this one reports what the
  platform did with the reader's own listing, not someone else's activity. Push
  still rides the shared `pushAlerts` switch and the existing `match-alerts`
  Android channel (a second channel would need its own app-side registration
  for a toggle this preference already covers), but at `priority: 'normal'` and
  a 7-day TTL rather than the match/comment alerts' `high`/2 days: the listing
  is already live, nothing here is time-critical, and a status report on your
  own post does not go stale the way an unread lead does.
- **Tapping the alert opens the listing scrolled to its reach section**, which
  is where both platforms' numbers and permalinks live and the obvious next
  question ("how is it doing?"). This is the app's first deep link *into* a
  section, so it was built as a mechanism rather than a one-off:
  `?section=social-reach` on web
  ([useSectionDeepLink.js](client/src/hooks/useSectionDeepLink.js)), a `section`
  route param on mobile (`PostDetailScreen`), and the same `'social-reach'`
  string in the push payload's `section` field so both platforms land in the
  same place. Web's hook handles the four things that break a naive
  `scrollIntoView`: the section may not exist yet (it retries for up to 15s
  rather than looking once — sized for the cold-start case below, not just a
  slow API call), **a tap on a real push notification is a fresh document
  load, not a client-side route change** (`push-sw.js`'s `notificationclick`
  navigates via `Client.navigate`/`clients.openWindow`, so the bundle has to
  download and boot and the post has to fetch before the section exists at
  all — this is why the deep link worked instantly from an already-open tab
  but did nothing on a phone tapping the actual notification until the retry
  window was widened past the original 4s), the lazy-loaded hero photo above
  the section keeps shifting the page on that same slow connection (a few
  correction passes at 700ms/2s/4s, each a no-op unless the section actually
  drifted — never an unconditional jump at a reader who has since scrolled),
  and `prefers-reduced-motion` gets placement instead of travel. It arrives
  with a brief brand-colored ring, because landing mid-page with no
  explanation reads as a mis-scroll. Mobile measures with two `onLayout`s (the
  body block's offset plus the section's offset inside it) rather than
  `measureLayout` node handles or a scroll listener.
- **The reach section now renders as soon as a copy exists**, numbers or not
  (web `SocialReach.jsx` and mobile `SocialReach.js`, both gated on
  `permalink || any count`). It used to render nothing until engagement had been
  read back — which is exactly the state an author arrives in from this alert,
  moments after publishing, and an empty screen there reads as if the listing
  was never shared. What is still never rendered is a count nobody measured:
  every metric chip drops itself when its value is null, and a "numbers show up
  here once the page reports them" line explains the gap.
- **Offline checks**: `npm run test-social-queue` covers when the author is and
  is not told (both platforms announce their own publish; a retry says nothing;
  giving up is the one failure that speaks; a platform-wide throttle and a
  cancelled listing stay silent), and `npm run test-push` covers the tray copy
  per platform, per language, the failure wording, the `section` payload, and a
  platform this build has no wording for sending nothing at all.
