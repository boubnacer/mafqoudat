## Comment threads (web + mobile)

One thread per post, merging two sources that are never allowed to look
equivalent: comments written on the site, and comments left on the
auto-posted Facebook/Instagram copies.

- **Model**: [Comment.js](server/models/Comment.js) — site comments only.
  Social comments are *not* stored here; they're cached on
  `Post.socialComments.{facebook,instagram}` by `socialStatsService` and
  merged at read time. Deletion is **soft** (`status: 'removed'`) so a report
  filed against a comment stays judgeable after the author deletes it.
- **Reading is public, writing needs an account.** `GET /posts/:id/comments`
  runs under `optionalAuth` — guests get the thread, a signed-in reader
  additionally gets per-comment `canDelete`/`canReport` flags and has blocked
  authors filtered out. `POST`/`DELETE`/report are all behind `verifyJWT`.
- **Who can delete**: the comment's author, the post's owner (it's their
  listing), or an admin. Reporting reuses the existing `Report` collection
  with a new optional `commentId`, so admins keep **one** moderation queue
  rather than two.
- **Social comments are read-only, for everyone.** No delete, no report-to-us,
  no reply — we have no authority over that platform. `canDelete`/`canReport`
  are hardcoded false and their ids are namespaced (`facebook:<id>`) so they
  can never collide with a site comment id.
- **One-way by deliberate decision — never post to Facebook on a user's
  behalf.** The only mechanism available is the Page token, which would
  publish the user's words as the *Mafqoudat Page itself*, not as them:
  misattribution, a moderation liability on your own Page, confusing for
  Facebook readers, and the kind of bulk automated posting Meta's spam systems
  flag. Don't add this without re-deciding it explicitly.
- **The merge is by time, across sources** (`mergeCommentSources`) — someone
  reading a lost-property thread wants it in the order it happened, not the
  site's half followed by Facebook's. A social comment with no usable
  timestamp sorts last, never first. Every entry keeps its `source`, and both
  UIs keep that badge visible: "a stranger on Facebook said this" and "a
  registered user here said this" are different claims to a reader judging a
  lead about their property.
- **Bounded, not paginated by page number.** The merged list is re-sorted on
  every request, so a later page isn't stable enough to append to (a new
  comment shifts everything down by one). Both clients "load more" by growing
  the first page instead. Site comments cap at `MAX_SITE_COMMENTS` (200),
  social at `SOCIAL_COMMENTS_LIMIT` (25/platform, env) — this is context
  beside the site's own thread, not a mirror of the Page.
- **Comment text rides along with the counts**, in the same batched Graph call
  that already fetched reactions/comments/shares — no extra request. A `null`
  comment list means the edge wasn't readable and keeps whatever was cached;
  `[]` is a real answer and overwrites.
- **Comment text is a separate, stronger permission** — `pages_read_user_content`
  (FB) / `instagram_manage_comments` (IG), distinct from the grant that reads
  the *count*. And Graph does not politely omit a field it won't serve: it
  **rejects the whole object**, so asking for comment text without the
  permission took reactions, shares and insights down with it and left
  listings blank. `readWithFallback` catches that refusal, drops the
  comment-text field and re-reads, then remembers the refusal for 6h (same
  memo shape as `resolvedMetrics`) so it costs one wasted request twice a day,
  not one per refresh — and picks comments up by itself if granted later.
  Covered in `test-social-stats`; the general rule is that an optional field
  must never be able to cost a required one.
- **UI**: [CommentsSection.jsx](client/src/features/posts/PostPage/CommentsSection.jsx)
  and [CommentsSection.js](mobile/src/components/CommentsSection.js). Meta
  brand colors on the source badges are the same documented exception as
  `SocialReach`. Mobile follows Phase 9 (parent borderless/shadowless, badges
  carry the sub-element shadow) and routes direction through `utils/rtl.js`.
- **Comment notifications**: the post's owner gets an in-app alert and,
  preference permitting, a push, when someone comments on a *site* comment
  (social comments read back from Facebook/Instagram never notify — the
  platform's own notifications already cover that, and this app has no
  authority over that side anyway). Never fires on your own comment.
  `Notification.type` gained `new_comment` alongside `match_found`
  ([Notification.js](server/models/Notification.js)); `matchedPost`/`match`/
  `score` are required only for `match_found`, a new `comment` ref only for
  `new_comment`, and the old single unique index was split into two
  `partialFilterExpression`-scoped ones (an unscoped compound unique index
  would treat every comment row's missing `matchedPost` as an equal `null`
  and reject the second comment on any post as a duplicate key) — `server.js`
  runs `Notification.syncIndexes()` on connect so an existing deployment picks
  up the corrected index rather than keeping the stale one.
  [commentNotificationService.js](server/services/commentNotificationService.js)
  writes the row and queues the push, called fire-and-forget from
  `commentsController.createComment` so a failed alert can never fail the
  comment write. Push copy/channel:
  [pushNotificationService.js](server/services/pushNotificationService.js)'s
  `sendCommentAlert` — same Android channel as match alerts (`match-alerts`),
  not a second one; the in-app `commentAlerts` preference is what gates the
  feature, independent of `matchAlerts`/`pushAlerts` which stay match-only.
  **The inbox merges two differently-shaped sources**: match alerts group by
  the reader's own post (see above); comment alerts are flat, one row per
  comment, fetched and paginated separately (bounded at
  `MAX_ITEMS_PER_SOURCE`, 300, per source) then merged and re-sorted by
  time in JS in `notificationsController.listNotifications` — not a DB-level
  `$unionWith`, to stay off the same server-version floor `$sortArray` is
  avoided for elsewhere in this doc. `getUnreadCount` sums both sources' exact
  unread counts, so the bell badge and the two list kinds never disagree.
  Client: web's `CommentNotificationItem.jsx` (a `kind: 'comment'` entry
  alongside `NotificationGroup`'s `kind: 'match'` in `NotificationsPage.jsx`
  and the bell popover) and mobile's `CommentNotificationCard.js` (same split
  in `NotificationsScreen.js`), styled from the existing row/badge vocabulary
  rather than inventing new card language — no found/lost tag or confidence
  score, since a comment isn't a counterpart listing to judge.
- **Offline check**: `npm run test-comments` — no DB, no network; covers the
  permission flags per viewer and the cross-source time merge.
  `npm run test-push` also covers `sendCommentAlert` (commenter-name wording,
  the anonymous fallback, truncation).
