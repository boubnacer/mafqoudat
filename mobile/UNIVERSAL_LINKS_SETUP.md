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

**Android is configured for the `preview` build profile only; iOS is still a
placeholder.** Until a platform's file holds a real value *and* that file is
live on the deployed site, that platform's links degrade safely — a shared
link just opens in the browser, exactly like today.

## 1. iOS: replace the Team ID

`client/public/.well-known/apple-app-site-association` has:

```json
"appID": "TEAMID.com.mafqoudat.app"
```

Replace `TEAMID` with your actual 10-character Apple Developer Team ID.

Find it at either:
- https://developer.apple.com/account → **Membership details**
- Or, if this project is already linked to EAS: `eas credentials -p ios` (select the build profile, it's printed in the credentials summary)

## 2. Android: the SHA-256 fingerprint

`client/public/.well-known/assetlinks.json` lists the fingerprint of the
certificate the installed APK/AAB is signed with. Android downloads that file
after install and compares it against the app's actual signature; a match is
what lets a tapped link open the app instead of the browser.

It currently holds the EAS-managed keystore for the **`preview`** build
profile (`E3:57:12:…:D3:00`), so internal builds from that profile verify.

**Before a Play Store release, the release fingerprint has to be added.** With
Play App Signing that is Google's certificate, not the upload key EAS holds —
the two are different, and a build distributed through Play is signed with
Google's. `sha256_cert_fingerprints` is a list, so add it as a second entry
rather than replacing the preview one; both keys can be trusted at once.

Find each at:
- **Preview / internal builds:** `npx eas-cli credentials` from `mobile/` → Android → the build profile → "SHA256 Fingerprint"
- **Play release:** Google Play Console → your app → **Setup → App signing** → "App signing key certificate" → SHA-256

The value must be uppercase hex, colon-separated, 32 bytes. A SHA-1 (20 bytes)
will not work here regardless of formatting — that is a different hash of the
same certificate, and is what Google Sign-In uses, not App Links.

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

## Deferred deep linking

A post link tapped on a fresh install (no country picked, not signed in)
doesn't get dropped: `App.js`'s `RootNavigator` captures the URL
independently of the `linking` config above — via `Linking.getInitialURL()` /
`Linking.addEventListener('url', ...)`, gated so it only captures while
`AuthNavigator` (no `PostDetailScreen` route) is what's mounted — and
replays it as soon as the user picks a country and `AppNavigator` takes
over. The user sees Onboarding/Welcome first, same as any first launch, and
lands on the post right after finishing that step rather than on Home.

Session-scoped only: if the OS kills the app before a country gets picked,
the pending post is lost on the next launch rather than persisted across
restarts. That mirrors this codebase's existing pattern for pending
navigation intent (`AuthContext`'s `loginNotice`), which makes the same
tradeoff, and adding `SecureStore`/`AsyncStorage` persistence for a case
this narrow isn't worth the extra surface.
