# Browser notifications (Web Push)

Match alerts, comment alerts and "your listing is on our Facebook page" alerts
reach browsers the same way they already reach the mobile app — including when
Mafqoudat is closed. Nothing here runs until the VAPID keys below are set, so
the feature is safe to deploy before configuring it: the client asks the server
for a key, gets an empty string, and the offer never appears.

## 1. Generate a VAPID key pair

VAPID is what identifies this server to every push service (Google's for
Chrome, Mozilla's for Firefox, Apple's for Safari). There is no account to
create with any of them, and no API key to buy.

```bash
cd server
node -e "console.log(require('web-push').generateVAPIDKeys())"
```

That prints a `publicKey` / `privateKey` pair. Generate it **once** and keep it:
every browser subscription is bound to the public key that created it, so
replacing the pair silently invalidates every existing subscription — each of
those browsers goes quiet until it subscribes again.

## 2. Set the server environment

| Variable | Required | What it is |
| --- | --- | --- |
| `VAPID_PUBLIC_KEY` | yes | The public half. Served to browsers at `GET /notifications/web-push-key`. |
| `VAPID_PRIVATE_KEY` | yes | The private half. Never leaves the server. |
| `VAPID_SUBJECT` | recommended | `mailto:` or `https:` URL naming whoever operates the site. Push services use it to reach a human about abusive sending. Defaults to `CLIENT_URL`, then a `mailto:` fallback. |
| `WEB_PUSH_ENABLED` | no | `false` turns the channel off without removing the keys. |
| `CLIENT_URL` | yes (already) | Every notification carries a URL to open; this is its origin. Already required by the social-image pipeline. |

No client-side environment variable is involved. The public key is **served**,
not built into the bundle, so the two halves cannot drift apart the way two
separately-configured values do — a client built against last month's key would
subscribe to a service that then refuses every send.

`render.yaml` declares all four (the two keys and `EXPO_ACCESS_TOKEN` as
`sync: false`, so they are set in the Render dashboard rather than committed).
A deployment that never set them is the single most common reason browser
notifications "don't work": everything is implemented, nothing is sent, and
every layer fails quietly on purpose.

## 3. Deploy and check

The service worker (`client/public/push-sw.js`) is copied verbatim into the
build and served from the site root. Nothing in the build step touches it.

The server states the answer itself, once, at boot:

```
🌐 Browser push (Web Push): on - key BGMrIq6K9B5A..., subject mailto:contact@mafqoudat.com
```

or, when something is wrong, the reason and what to do about it:

```
🌐 Browser push (Web Push): OFF - VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY not set - generate a pair with: ...
   Browsers will never receive a notification until this is fixed.
```

That line exists because every failure below it is swallowed by design - a push
that cannot be sent must never cost a match, a comment or a publish - which
means an unconfigured deployment behaves exactly like a working one that simply
has no subscribers.

Ask the same question at any time, without restarting anything:

```bash
cd server
npm run doctor-push                              # configuration only
npm run doctor-push -- --db                      # and how many browsers are subscribed
npm run doctor-push -- --user=someone@example.com   # one account's browsers, devices and preference gates
npm run doctor-push -- --user=someone@example.com --send   # really deliver a test alert
```

`--send` goes through the real sender to the real push services, so a
notification actually appears. It writes nothing to the inbox - it is a
delivery test, not a fake alert in someone's notifications.

To verify by hand on the deployed site:

1. Sign in and open the New Post form. Fill it in and press the submit button —
   the offer appears immediately before the listing is created.
2. Accept, and the browser's own permission prompt follows.
3. `GET /notifications/web-push-key` should answer a non-empty `publicKey`.
4. The account's `webPushSubscriptions` should now hold one entry.

## Things worth knowing before debugging

- **HTTPS only.** Service workers do not run over plain http, except on
  `localhost`. A staging site without a certificate cannot test this.
- **iOS needs the site installed.** Safari supports Web Push from 16.4, but on
  iPhone/iPad only after "Add to Home Screen". Until then the browser reports
  no Push API at all and the app treats it as unsupported — the offer is never
  shown and posting is unaffected.
- **A denial is permanent.** Once a visitor blocks notifications for the site,
  no click can re-open the prompt; only the browser's own site settings can.
  This is why the offer is shown once, with an explanation, rather than firing
  the prompt on arrival — and why publishing a listing never depends on it.
- **Subscriptions expire, and the once-per-page-load sync is what repairs
  that.** Push services rotate endpoints, and the server prunes one as soon as
  a delivery comes back `404`/`410`. `NotificationBell` calls
  `syncSubscription` once per page load, and that call does not only re-register
  an endpoint it finds - it *creates* one when the permission is granted and no
  subscription exists, and replaces one built against a superseded VAPID key.
  All three of those states look identical from the page (permission granted,
  nothing ever arriving), and only the first was previously repairable. A
  failed sync no longer latches either: it is retried on the next mount rather
  than being remembered as done.
- **`pushAlerts` is the account-level master over *both* transports** - the
  app's devices and the browser alike. A browser can be subscribed, permitted
  and completely healthy while this preference silences every send. It now has
  a switch on the web settings panel (it only ever had one in the mobile app),
  turning on browser alerts turns it back on, and `doctor-push` reports it per
  account.
- **The VAPID public key is fetched, not built in, and a failed fetch is
  retried.** The `/notifications/web-push-key` route is public - the key is
  public by definition and authorises nothing. It used to sit behind
  `verifyJWT`, and the client remembers the answer for the page load, so one
  request landing on an expired access token was read as "this deployment
  cannot send" until the next reload: no offer on the New Post form, and a
  settings row reporting the channel unavailable.
- **Signing out unsubscribes.** A shared computer must not keep delivering one
  account's alerts to whoever signs in next — the copy states what kind of
  listing each alert concerns.

## Offline check

```bash
cd server
npm run test-push
```

Covers the browser transport with no network and no keys of its own: per-device
language, the URL each kind of alert opens, the TTLs, pruning on `410`, and
keeping the subscription on a `429` - plus the configuration diagnostics
themselves (missing keys, a malformed pair, a non-https `CLIENT_URL` falling
back to a `mailto:` subject, and `WEB_PUSH_ENABLED=false` outranking a valid
pair).
