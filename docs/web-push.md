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

## 3. Deploy and check

The service worker (`client/public/push-sw.js`) is copied verbatim into the
build and served from the site root. Nothing in the build step touches it.

To verify on the deployed site:

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
- **Subscriptions expire.** Push services rotate endpoints, and the server
  prunes one as soon as a delivery comes back `404`/`410`. The web client
  re-registers its subscription once per page load (`NotificationBell`), which
  is what repairs that silently.
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
keeping the subscription on a `429`.
