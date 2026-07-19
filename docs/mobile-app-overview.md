# Mafqoudat Mobile App — Current State Overview

> Written 2026-07-19 by inspecting the `mobile/` folder and its integration points in `server/` as they exist right now. This is a **snapshot document**, meant to be pasted into a Claude.ai chat to get advice on where to take the mobile app next — it is not aspirational and not a spec. Where something looks unfinished, duplicated, or inconsistent, it's called out explicitly rather than smoothed over.

---

## 1. What this is

`mobile/` is a **separate Expo / React Native app**, added recently to the existing `mafqoudat` project (a multi-country, multilingual lost-and-found classifieds platform whose web stack is React 18 SPA + Node/Express API — see `PROJECT_DESCRIPTION.md` at the repo root for the web-only writeup). The mobile app talks to the **same backend** (`server/`, deployed on Railway) that the website uses — there is no separate mobile API.

It is early-stage: scaffolding, auth, and a single read-only list screen exist. There is no post creation, no post detail view, no profile/messaging, and no production build has been made yet (no `eas.json`, no App Store/Play Store submission artifacts).

---

## 2. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Expo SDK ~54** (`expo` in `mobile/package.json`) | Managed workflow |
| UI runtime | **React 19.1.0** + **React Native 0.81.5** | |
| Navigation | `@react-navigation/native` + `native-stack` v6 | Single stack, auth-gated |
| HTTP client | `axios` | Wrapped with interceptors, mirrors the web app's API slice pattern |
| Auth storage | `expo-secure-store` **and** `@react-native-async-storage/async-storage` | Used inconsistently — see §6 |
| OAuth/browser | `expo-web-browser`, `expo-auth-session` (installed but not actually driving the flow — see §5) | |
| Google native sign-in | `@react-native-google-signin/google-signin` | **Installed but not imported/used anywhere in `src/`** — dead dependency right now |
| Images | `expo-image-picker` | Permissions declared in `app.json`/`app.config.js`, not yet wired to any screen |
| Crypto/JWT | `expo-crypto`, `jwt-decode` | |
| i18n | Custom hand-rolled solution (`src/context/LanguageContext.js` + `src/utils/translations.js`, ~250 lines) | **Not** `i18next`/`react-i18next` like the web client — a from-scratch reimplementation for en/fr/ar |

Root-level oddity: the repo's top-level `package.json` (`main: server/server.js`, a server-only entry point) also lists `expo` and `mongoose` as direct dependencies. That looks like a leftover from initializing the mobile app at the repo root before it was moved into `mobile/` — worth confirming it's not accidentally required anywhere in `server/`.

---

## 3. Folder structure (as it exists today)

```
mobile/
├── App.js                     # Entry point actually used by Expo (main: node_modules/expo/AppEntry.js → App.js)
├── AppNew.js                  # Alternate/experimental entry point, not wired up — see §4
├── AppSimple.js                # Another alternate entry point, not wired up — see §4
├── app.json / app.config.js   # Expo config (app.config.js wins; adds Android deep-link intent filter app.json lacks)
├── babel.config.js, metro.config.js
├── assets/                    # icon.png, splash.png only — no adaptive-icon/favicon yet despite app.json referencing them
├── src/
│   ├── app/api/apiService.js  # Axios instance, mirrors client/src/app/api/apiSlice.js
│   ├── config/api.js          # Base URL, OAuth config, endpoint map
│   ├── context/
│   │   ├── AuthContextNew.js   # Currently-wired auth provider (Google OAuth focus)
│   │   ├── SimpleAuthContext.js# Parallel/older auth provider, not wired up
│   │   └── LanguageContext.js  # i18n context
│   ├── screens/
│   │   ├── LoginScreenNew.js   # Currently-wired login screen (password + Google)
│   │   ├── LoginScreen.js      # Older variant, not wired up
│   │   ├── SimpleLoginScreen.js# Another variant, not wired up
│   │   ├── PostsListScreen.js  # Currently-wired post-auth screen
│   │   ├── WelcomeScreen.js    # Country-picker landing screen, exists but not in the navigator
│   │   ├── CountrySelectionScreen.js # Exists but not in the navigator
│   │   └── OAuthCallbackScreen.js    # Exists but not in the navigator (deep link is handled in App.js instead — see §5)
│   ├── components/            # LanguageDropdown, LanguageSwitcher
│   ├── hooks/useAuth.js        # Older auth hook, unclear if still referenced
│   └── utils/                 # storage.js, tokenUtils.js, googleAuth.js / googleAuthNew.js, oauthState.js, languageStorage.js, translations.js
├── *.md (12 files)            # OAuth debugging/troubleshooting notes — see §5
└── test_*.js (7 files)        # Ad-hoc manual test scripts run with `node`, not an actual test suite/runner
```

Server-side integration points:
```
server/routes/googleAuthRoutes.js   # mounted at /auth — shared web+mobile OAuth (Passport-based), THIS is what mobile actually uses today
server/routes/mobileAuthRoutes.js   # mounted at /auth — a separate token-exchange OAuth flow, NOT currently called by the mobile app
server/views/mobile-callback.html   # bridge page served at /auth/mobile-callback, fires the mafqoudat:// deep link back into the app
```

---

## 4. Duplicated / parallel implementations (the biggest "needs a decision" item)

The mobile app currently has **three app entry points, three login screens, two auth contexts, and two Google-auth utility modules**, of which only one of each is actually wired into `App.js`:

| Wired in (used) | Not wired in (orphaned/experimental) |
|---|---|
| `App.js` | `AppNew.js` (106 lines), `AppSimple.js` (155 lines) |
| `AuthContextNew.js` (285 lines) | `SimpleAuthContext.js` (229 lines) |
| `LoginScreenNew.js` (521 lines) | `LoginScreen.js` (471 lines), `SimpleLoginScreen.js` (276 lines) |
| `googleAuthNew.js` (128 lines) | `googleAuth.js` (188 lines) |

This is roughly **2,500+ lines of near-duplicate code** across the "old" and "new" variants, almost all of it the result of iterating on the Google OAuth flow (see the 10+ troubleshooting markdown files: `DEBUG_OAUTH_FLOW.md`, `FINAL_OAUTH_SOLUTION.md`, `FIX_PLATFORMCONSTANTS.md`, `NEW_OAUTH_IMPLEMENTATION.md`, `OAUTH_FIX_SUMMARY.md`, `OAUTH_TROUBLESHOOTING.md`, `QUICK_FIX.md`, `SIMPLE_AUTH_SETUP.md`, etc.). This is worth discussing with Claude: whether to delete the orphaned variants now (they're not deployed anywhere, so it's a low-risk cleanup) or keep them as reference until the OAuth flow is fully confirmed stable.

Similarly, `WelcomeScreen.js` and `CountrySelectionScreen.js` exist (and mirror web components — `WelcomeScreen.js` explicitly says "Mirrors: client/src/components/WelcomePage.jsx") but aren't in `App.js`'s navigator at all. Right now the app boots straight to a bare login screen, skipping the country-selection landing experience the web app has.

---

## 5. Authentication — two flows, one used

### 5a. Password login (username/phone + password)
Standard flow: `LoginScreenNew.js` → `POST /auth` (shared with web, handled by `server/routes/authRoutes.js`) → JWT access token → stored via `storage.js` (`expo-secure-store`, key `accessToken`) → decoded client-side with `jwt-decode` for user info → navigate to `PostsListScreen`.

### 5b. Google OAuth — deep-link bridge flow (the one actually wired up)
This is the flow `googleAuthNew.js` + `AuthContextNew.js` + `App.js` implement together, and it's the one that generated most of the troubleshooting docs:

1. App opens an in-app browser (`expo-web-browser`) to `{API_BASE_URL}/auth/google?mobile=true`.
2. Server (`googleAuthRoutes.js`, shared with the web OAuth flow) detects mobile via the `?mobile=true` query param (or User-Agent sniffing as fallback), runs the normal Passport Google OAuth dance, and encodes `{mobile: true, redirectUri}` into the OAuth `state` param.
3. On Google's callback, the server decides where to send the browser:
   - **Web**: redirects to `{FRONTEND_URL}/auth/callback?token=...`
   - **Mobile**: redirects to its own route, `/auth/mobile-callback?token=...` (or `?pendingToken=...` for new users needing country selection), served by `mobile-callback.html`.
4. `mobile-callback.html` is a static bridge page (not React Native) that extracts the token from the URL and tries **four different methods** in sequence to fire the custom URL scheme `mafqoudat://auth/callback?token=...` (`location.href`, `location.replace`, a synthetic `<a>` click, and a hidden `<iframe>`) — plus a manual "Copy Token" fallback button, because automatic deep-linking wasn't reliably reopening the app.
5. Back in the RN app, `App.js` listens for the `mafqoudat://` URL via `Linking.addEventListener('url', ...)` and `Linking.getInitialURL()`, and hands it to `AuthContextNew.handleDeepLinkCallback()`, which parses `token`/`pendingToken`/`error` from the query string.
6. New users (no existing account) get a `pendingToken` and are expected to be routed to country selection → `completeGoogleRegistration()` → `POST /auth/google/complete` — but note **`CountrySelectionScreen.js` isn't in the navigator** (§4), so this leg of the flow currently has no UI to land on.

**Deep link config**: scheme `mafqoudat://`, Android intent filter for `mafqoudat://auth/callback` is only present in `app.config.js` (not `app.json` — the two config files have drifted; Expo uses `app.config.js` when both exist, so this isn't currently broken, but it's a trap if `app.config.js` is ever deleted).

### 5c. The unused parallel backend flow
`server/routes/mobileAuthRoutes.js` is mounted at `/auth` alongside `googleAuthRoutes.js` and implements a **completely different, more "native-typical" OAuth pattern**: `POST /auth/exchange-code` (authorization-code exchange), `POST /auth/google/mobile` (verify a Google ID token sent directly from the client, e.g. via `@react-native-google-signin/google-signin` or `expo-auth-session`'s native flow), and `POST /auth/google/mobile/complete`. Nothing in the current mobile app code calls any of these three endpoints — they appear to be an earlier or alternate design that was superseded by the browser-redirect + deep-link approach in §5b, but never removed. Worth a decision: keep both (native-token flow is generally more reliable on real devices than the HTML bridge page), consolidate to one, or delete the unused one.

---

## 6. Storage inconsistency

Two different token storage mechanisms are in play for what should be the same JWT:

- `AuthContextNew.js` (Google OAuth path) stores the token in **`AsyncStorage`** (unencrypted) under the key **`authToken`**, and the user object under **`authUser`**.
- `storage.js` (used by the password-login path in `LoginScreenNew.js`, and by `apiService.js`'s request interceptor) uses **`expo-secure-store`** (encrypted, OS keychain-backed) under the key **`accessToken`**, and user data under **`userData`**.

Practical effect: if a user logs in with Google, `apiService.js`'s axios interceptor (which reads from `SecureStore` under `accessToken`) won't find the token that `AuthContextNew` wrote to `AsyncStorage` under `authToken` — API calls made after a Google login likely go out **without an Authorization header** unless something else is bridging the two. Also, `handleDeepLinkCallback()` in `AuthContextNew.js` currently fabricates a placeholder user object (`{ email: 'user@example.com' }`) instead of fetching real user data after receiving a token — flagged in that file's own comments as a TODO.

This is probably the single most concrete bug to raise with Claude for review/fix.

---

## 7. Screens inventory

| Screen | Wired into `App.js`? | Purpose |
|---|---|---|
| `LoginScreenNew.js` | ✅ | Password login + "Sign in with Google" button, language dropdown |
| `PostsListScreen.js` | ✅ | Paginated list of posts, pull-to-refresh, infinite scroll, logout |
| `WelcomeScreen.js` | ❌ | Country picker landing page, mirrors web's `WelcomePage.jsx` |
| `CountrySelectionScreen.js` | ❌ | Meant to complete Google-signup for new users (needs a country) |
| `OAuthCallbackScreen.js` | ❌ | Presumably meant to render while the deep link resolves; currently the callback is handled headlessly in `App.js` instead |
| `LoginScreen.js`, `SimpleLoginScreen.js` | ❌ | Superseded duplicates, see §4 |

No screens yet for: creating a post, viewing a single post's detail, user profile, editing/deleting own posts, categories/filters, or any messaging — all of which exist on the web client.

---

## 8. Environment / config

`mobile/.env.example`:
```
EXPO_PUBLIC_API_URL=https://mafqoudat-production.up.railway.app
EXPO_PUBLIC_FRONTEND_URL=https://mafqoudat.com
```
`src/config/api.js` also hardcodes the same Railway URL as a fallback default, plus a hardcoded Google OAuth web client ID as a fallback default — both would be worth moving fully into env vars before any public build, since they're currently committed as literal strings in source.

---

## 9. Build / deployment status

- No `eas.json` exists yet, even though `package.json` has `build:android`/`build:ios`/`submit:android`/`submit:ios` scripts that assume EAS is configured (`eas build:configure` hasn't been run).
- `app.json` bundle identifiers/package names are placeholders (`com.mafqoudat.app`) — fine to keep if that's the intended final ID, otherwise needs deciding before a first build.
- Required store assets (`adaptive-icon.png`, `favicon.png`) referenced in the "next steps" doc aren't in `assets/` yet — only `icon.png` and `splash.png` exist.
- Nothing has been built or submitted to TestFlight/Play Console; this is pre-first-build.

---

## 10. Suggested discussion points for Claude.ai chat

1. **Google OAuth strategy** — commit to one flow: the browser-redirect + deep-link HTML bridge (§5b, currently wired, but relies on a flaky multi-method deep-link trick) vs. the native token-exchange endpoints already sitting unused on the backend (§5c, `mobileAuthRoutes.js`), which would let the client use `expo-auth-session`'s native Google flow (already installed) or `@react-native-google-signin/google-signin` (already installed but unused) without needing a bridge page at all.
2. **Fix the token storage split** (§6) — pick one of `SecureStore`/`AsyncStorage` and one key naming scheme, and make sure the Google-login path actually fetches real user data instead of a hardcoded placeholder.
3. **Clean up duplicate files** (§4) — decide whether `AppNew.js`, `AppSimple.js`, `SimpleAuthContext.js`, `LoginScreen.js`, `SimpleLoginScreen.js`, `googleAuth.js` (old) should be deleted now that `App.js`/`AuthContextNew.js`/`LoginScreenNew.js`/`googleAuthNew.js` are the working set.
4. **Decide on `WelcomeScreen`/`CountrySelectionScreen`** — wire them into the navigator (they exist and mirror the web onboarding) or confirm the mobile app intentionally skips country selection for now.
5. **Roadmap for missing screens** — post creation, post detail, profile, and how much of the web `client/src/features/*` structure to mirror vs. simplify for mobile.
6. **i18n approach** — keep the custom hand-rolled `translations.js`, or adopt `react-i18next`'s React Native counterpart to stay consistent with the web client's `i18next` setup.
7. **First EAS build** — when to run `eas build:configure`, whether to target internal/preview distribution first before any store submission.
