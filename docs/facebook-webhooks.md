# Facebook Page webhooks

Real-time-ish reach: when someone reacts to, comments on, or shares the
Facebook Page copy of a listing, Meta pushes an event naming that post, and
the site refreshes that one post's numbers within moments instead of waiting
for the next scheduled poll.

This is an **accelerant on top of** `server/services/socialStatsService.js`'s
existing TTL-based polling (`docs/social-reach.md`), never a replacement for
it. Meta documents webhook delivery as best-effort — it can be delayed or
dropped — so the poll stays the guarantee that a post's numbers eventually
catch up even if a delivery is missed. And Instagram has no equivalent for
likes at all (only comments/mentions are ever pushed), so IG engagement stays
entirely poll-based regardless of anything here.

**Fully optional.** Without any of this configured, the site behaves exactly
as it did before — the poll-only system keeps working on its own schedule.

## How it fits together

```
someone reacts/comments/shares on the Page post
  → Meta POSTs to /webhooks/facebook (signed with the app secret)
  → routes/facebookWebhookRoutes.js verifies the signature, extracts the
    Facebook post id(s) named in the event, responds 200 immediately
  → services/socialStatsService.js#scheduleRefreshByFacebookPostIds
    (deferred, so the webhook response isn't held up)
  → looks the post(s) up by social.facebook.postId, refreshes them from
    Graph right away - ignoring the freshness TTL, since a webhook is a
    stronger signal than "it's been a while"
```

### Files

| Where | What |
| --- | --- |
| `routes/facebookWebhookRoutes.js` | The two endpoints: `GET` (Meta's verification handshake) and `POST` (actual events) |
| `middleware/facebookWebhookSecurity.js` | Verifies `X-Hub-Signature-256` against the raw request body |
| `services/socialStatsService.js` | `refreshByFacebookPostIds` / `scheduleRefreshByFacebookPostIds` - the TTL-bypassing refresh path |
| `server.js` | Captures `req.rawBody` on the global JSON parser (signature verification needs the exact bytes Meta signed) |

## One-time setup

Needs an existing Facebook App with `FACEBOOK_APP_ID`/`FACEBOOK_APP_SECRET`
already configured (the same app used for auto-posting) and the server
already deployed and publicly reachable over HTTPS — Meta requires this to
even attempt the verification handshake.

### 1. Choose a verify token

Pick any random string — it isn't a secret from Meta, it's one *you* invent
and both sides check against each other during the handshake.

```
FACEBOOK_WEBHOOK_VERIFY_TOKEN=<anything - e.g. a generated UUID>
```

Set it in the server's environment and deploy before continuing — the
verification step below fails immediately if the server isn't already running
with this value set.

### 2. Register the callback URL in the Meta App Dashboard

1. Open the app at [developers.facebook.com/apps](https://developers.facebook.com/apps) → your app.
2. Add the **Webhooks** product if it isn't already added.
3. Choose **Page** as the object.
4. **Callback URL**: `https://mafqoudat-api.onrender.com/webhooks/facebook`
   (swap in the real deployed URL if different from `env.production.example`'s).
5. **Verify Token**: the exact value of `FACEBOOK_WEBHOOK_VERIFY_TOKEN`.
6. Click **Verify and Save**. Meta sends a `GET` to the callback URL; the
   route checks the token and echoes back the challenge it was sent
   (`routes/facebookWebhookRoutes.js`'s `resolveVerificationChallenge`). A
   green checkmark means it worked.
7. Once verified, subscribe to the **`feed`** field for the Page object
   (this is what carries reactions/comments/shares).

### 3. Subscribe the actual Page to the app

Registering the callback in step 2 configures the *app*; the specific *Page*
still has to opt in separately, via one Graph API call using the same Page
access token already in `FACEBOOK_PAGE_ACCESS_TOKEN`:

```
curl -X POST "https://graph.facebook.com/v26.0/<FACEBOOK_PAGE_ID>/subscribed_apps" \
  -d "subscribed_fields=feed" \
  -d "access_token=<FACEBOOK_PAGE_ACCESS_TOKEN>"
```

A `{"success": true}` response means the Page is subscribed. This only needs
to be run once per Page (re-run it if the Page access token is ever rotated).

### 4. Confirm it end to end

React to (or comment on) a real listing's Page post, then check the server
logs for a `POST /webhooks/facebook` request. The affected post's
`socialStats.facebook.fetchedAt` should update within seconds, well inside
even the young-post polling window.

## Does this need App Review?

Subscribing to `feed` events on a Page you already administer, using a Page
token that already holds `pages_read_engagement` (already required for
auto-posting and for reading reactions/comments at all), generally does not
require an additional review pass beyond what auto-posting already needed —
it changes *when* you're told about data you can already read via polling,
not *what* data you can access. Meta's exact review requirements do shift
over time, though, so treat the App Dashboard as the source of truth if it
asks for anything at the "Verify and Save" step.

## Troubleshooting

- **Verification fails at step 2.6** — confirm the server is deployed and the
  callback URL is reachable over plain HTTPS with no auth in front of it, and
  that `FACEBOOK_WEBHOOK_VERIFY_TOKEN` in the running environment exactly
  matches what was typed into the dashboard.
- **Events never arrive despite a successful verification** — step 3 is easy
  to miss; the app-level subscription in step 2 does nothing until the Page
  itself is also subscribed.
- **Every delivery gets rejected with 401** — `FACEBOOK_APP_SECRET` in the
  running environment doesn't match the app the callback URL was registered
  under, or something in front of the server (a proxy, a WAF) is altering the
  request body before it reaches Express. The signature is computed over the
  *exact* bytes Meta sent; anything that reserializes the JSON along the way
  breaks it.
- **Nothing happens for a post that should be tracked** — the post needs
  `social.facebook.postId` set, which only happens for posts created after
  the reach feature shipped (see the "posts created before this" limitation
  in `docs/social-reach.md`) and only for a post_id Meta's payload actually
  names — a reaction on a post from a different Page than `FACEBOOK_PAGE_ID`
  is deliberately ignored.

## Checking it offline

```
cd server && npm run test-facebook-webhook
```

No database, no network, no running server — exercises the signature
verification middleware and the payload-parsing logic directly with mock
request objects. Covers a forged signature, a tampered body under a real
signature, a misconfigured server failing closed, the verification handshake,
and parsing a batched delivery covering several posts at once.

`refreshByFacebookPostIds`/`scheduleRefreshByFacebookPostIds` themselves are
covered in `npm run test-social-stats` alongside the rest of the reader.
