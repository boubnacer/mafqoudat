# Mobile Authentication

This document describes the mobile app's two login paths, the env vars they need, and the
one-time Google Cloud Console setup required for Google sign-in.

**Google sign-in requires a development build — it cannot complete in Expo Go.** See
"Expo Go limitation" below.

## Password login

`LoginScreenNew.js` → `POST {API_BASE_URL}/auth` (`server/routes/authRoutes.js`, unchanged).
On success the response's `accessToken` is stored via `storage.setToken`, the user is decoded
from the JWT (`decodeToken` in `src/utils/tokenUtils.js`) and stored via `storage.setUserData`.

## Google login (native ID-token flow)

The mobile app no longer opens a browser and waits for a deep link back into the app. Instead
it uses `expo-auth-session`'s native Google provider to get an ID token directly, then hands
that token to the server for verification.

1. `AuthContextNew.js` calls `useGoogleIdTokenAuth()` (`src/utils/googleAuthNew.js`), which wraps
   `Google.useIdTokenAuthRequest` from `expo-auth-session/providers/google`.
2. `signInWithGoogle()` calls `promptAsync()`, which opens the native/Expo Go Google account
   picker and resolves with an `id_token` — no server redirect, no deep link.
3. The ID token is decoded client-side (`jwt-decode`) just to read `email`/`name` for the
   request body, then POSTed to `POST /auth/google/mobile` (`server/routes/mobileAuthRoutes.js`),
   which independently verifies the token with Google and cross-checks the email.
   - Existing user → server returns `{ accessToken }`. It's stored via `storage.setToken`, the
     user is decoded from it, and `AuthContextNew`'s `isSignedIn` flips true — `RootNavigator`
     (`App.js`) automatically swaps from `AuthNavigator` to `AppNavigator`, landing on
     `PostsListScreen`.
   - New user → server returns `{ pendingToken }`. `AuthContextNew` stashes it in state and
     `LoginScreenNew` navigates to `CountrySelectionScreen`.
4. `CountrySelectionScreen` loads `GET /countries`, and on submit calls
   `completeGoogleRegistration(countryId)`, which POSTs `{ pendingToken, countryId }` to
   `POST /auth/google/mobile/complete`. On success the returned `accessToken` is stored the same
   way as above, and the `isSignedIn` flip again drives navigation to `PostsListScreen`.

Sign-out (`signOut()` in `AuthContextNew.js`) blacklists the token server-side
(`POST /auth/logout`) and clears everything via `storage.clearAll()`.

### Token storage

Single source of truth: `expo-secure-store`, via `src/utils/storage.js` (`accessToken` /
`userData` keys). The axios interceptor in `src/app/api/apiService.js` reads the same keys.
On app start, `AuthContextNew.js` runs a one-time migration that moves any token found under
the old AsyncStorage `authToken` key into SecureStore and deletes the legacy keys, so users who
logged in before this change aren't logged out.

## Env vars

### Mobile (`mobile/.env` or EAS secrets, `EXPO_PUBLIC_` prefix required to reach the client bundle)

| Var | Purpose |
|---|---|
| `EXPO_PUBLIC_API_URL` | API base URL (defaults to the Railway production URL) |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Web OAuth client ID — only actually used when running via `expo start --web` in a browser |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | iOS OAuth client ID — required for Google sign-in on iOS (dev/production builds) |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | Android OAuth client ID — required for Google sign-in on Android (dev/production builds) |

`expo-auth-session`'s Google provider selects the client ID strictly by `Platform.OS`
(`androidClientId` on Android, `iosClientId` on iOS, `webClientId` only on actual web) with no
runtime fallback, and throws **during render** if the one it needs is `undefined` — so
`googleAuthNew.js` falls back to the web client ID for the unset ones just to keep the app from
crashing on launch before you've configured the native clients. That fallback does not make
sign-in work on device; it only avoids the crash.

### Server (Railway)

| Var | Purpose |
|---|---|
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Web OAuth client (existing, also used by the website) |
| `GOOGLE_IOS_CLIENT_ID` | iOS native OAuth client ID — accepted as an additional token audience |
| `GOOGLE_ANDROID_CLIENT_ID` | Android native OAuth client ID — accepted as an additional token audience |

ID tokens issued to a native (iOS/Android) OAuth client carry *that* client's ID as their
`aud` claim, not the web client's — `server/routes/mobileAuthRoutes.js` verifies against all
three IDs for this reason.

## Google Cloud Console checklist (manual, one-time)

1. In the same GCP project as the existing web OAuth client, create:
   - An **iOS** OAuth client with bundle ID `com.mafqoudat.app` (from `app.config.js`).
   - An **Android** OAuth client with package name `com.mafqoudat.app` and the app's SHA-1
     certificate fingerprint.
     - For an EAS-managed keystore: `eas credentials` → Android → select the keystore →
       it prints the SHA-1.
     - Or locally: `keytool -list -v -keystore <path-to-keystore> -alias <alias>`.
     - **Debug builds and Expo Go use a different signing key than production** — the debug
       keystore's SHA-1 (`keytool -list -v -keystore ~/.android/debug.keystore -alias
       androiddebugkey -storepass android`) also needs an Android OAuth client if you want to
       test native Google sign-in from a locally-run debug build.
2. Set the resulting client IDs:
   - Mobile: `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`.
   - Server (Railway): `GOOGLE_IOS_CLIENT_ID`, `GOOGLE_ANDROID_CLIENT_ID`.
3. Build and install a **development build** (`eas build --profile development`, or
   `npx expo run:android` / `npx expo run:ios` locally) and test Google sign-in there.

### Expo Go limitation

Google sign-in **will not complete inside Expo Go**, even after the client IDs above are set.
`expo-auth-session` computes the OAuth `redirect_uri` from the running environment
(`AuthSession.makeRedirectUri`): in Expo Go it's a dynamic `exp://<host>:<port>/--/...` URL,
because Expo Go's own bundle identity is used, not `com.mafqoudat.app`. Google's Android/iOS
OAuth client types validate the redirect against the package name / bundle ID the client was
registered for, so an `exp://` redirect from inside Expo Go gets rejected
(`redirect_uri_mismatch`) — there is no client type or console setting that can make this pass.
Only a development or production build, which owns the `com.mafqoudat.app` bundle ID/scheme
directly, produces a redirect URI Google will accept. Use Expo Go for everything else (password
login, posts, etc.); switch to a dev build specifically to test Google sign-in.
