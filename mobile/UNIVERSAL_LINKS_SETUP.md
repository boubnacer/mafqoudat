# Universal Links / App Links setup

Lets a tap on `https://www.mafqoudat.com/dash/posts/:id` — from the WhatsApp/
Facebook share card, a search result, anywhere — open straight into the app's
`PostDetailScreen` instead of a browser, when the app is installed.

Three pieces, already wired up in code:

- `mobile/app.config.js` — `ios.associatedDomains` and a new Android
  `intentFilters` entry declare the domains this app claims.
- `mobile/App.js` — `NavigationContainer`'s `linking` config maps
  `dash/posts/:id` to `PostDetailScreen`.
- `client/public/.well-known/apple-app-site-association` and
  `.../assetlinks.json` — served from the web app, these are how Apple and
  Google verify the app is actually allowed to claim the domain (anyone could
  otherwise put your domain in their own app's config).

**The two `.well-known` files currently contain placeholder values and do
nothing until you replace them.** Universal/App Links degrade safely in the
meantime — a shared link just opens in the browser, exactly like today.

## 1. iOS: replace the Team ID

`client/public/.well-known/apple-app-site-association` has:

```json
"appID": "TEAMID.com.mafqoudat.app"
```

Replace `TEAMID` with your actual 10-character Apple Developer Team ID.

Find it at either:
- https://developer.apple.com/account → **Membership details**
- Or, if this project is already linked to EAS: `eas credentials -p ios` (select the build profile, it's printed in the credentials summary)

## 2. Android: replace the SHA-256 fingerprint

`client/public/.well-known/assetlinks.json` has:

```json
"sha256_cert_fingerprints": ["REPLACE_WITH_YOUR_APP_SIGNING_SHA256_FINGERPRINT"]
```

This must be the fingerprint of the certificate your **released** APK/AAB is
actually signed with — for a Play Store release using Play App Signing,
that's Google's certificate, not your local upload key.

Find it at either:
- Google Play Console → your app → **Setup → App signing** → "App signing key certificate" → SHA-256
- Or: `eas credentials -p android` (select `production`, look for "SHA256 Fingerprint")

If you support multiple build variants (e.g. a separate debug/internal
signing key you want to deep-link too), add each fingerprint as an
additional string in that array — it's a list, not a single value.

## 3. Deploy the web files, then rebuild the app natively

- The `.well-known` files ship with the normal Vercel deploy — no separate
  step, just merge and deploy as usual.
- `associatedDomains` (iOS) and the App Links `intentFilters` (Android) are
  native config, baked in at build time. **A new `eas build` is required for
  each platform** — this cannot ship via an OTA/Expo Updates push, and
  won't take effect on devices running an already-installed build until they
  update to the new one.

## 4. Verify

- **iOS**: install the new build, then open Notes and type
  `https://www.mafqoudat.com/dash/posts/<a-real-post-id>` — tapping it
  should open the app, not Safari. (If it opens Safari, long-press the link
  first — iOS sometimes needs one prior successful App Store install +
  reboot cycle before it re-checks the AASA file. Apple also caches AASA
  fetches, so a stale value can take a little while to clear even after
  you've fixed it.)
- **Android**: `adb shell pm get-app-links com.mafqoudat.app` should list
  `mafqoudat.com` and `www.mafqoudat.com` as `verified`. If it says
  `legacy_failure` or `none`, re-check the fingerprint matches the exact
  build you installed (debug vs. release signing produce different
  fingerprints), then `adb shell pm verify-app-links --re-verify com.mafqoudat.app`.
- Either platform: Google's own checker validates the JSON shape (though not
  whether the values are *correct* for your app) —
  https://developers.google.com/digital-asset-links/tools/generator

## Known limitation (by design, not a bug)

If someone taps a post link on a fresh install with no app data yet (no
country picked, not signed in), the app opens to the normal
Onboarding/Welcome screen, **not** the post — `PostDetailScreen` only exists
in the navigator that mounts once a country is set (see `App.js`'s
`AppNavigator` vs `AuthNavigator`), so the linking config has nothing to
match against yet. This is a plain cold start, not a crash or an error.
Carrying the pending post through onboarding and resuming it afterward
("deferred deep linking") is a real feature some apps add, but it's a
separate, larger piece of work than what this fixes — ask if you want it
scoped.
