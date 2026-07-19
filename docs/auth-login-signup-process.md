# Login & SignUp Process — Technical Deep Dive

> Written 2026-07-19 as a discussion document for reviewing/improving authentication in Mafqoudat.
> Scope: `client/` (React web), `mobile/` (Expo/React Native), `server/` (Express API).

---

## 0. TL;DR — what you're running today

- Custom auth, **not** a managed provider (no Firebase Auth, no Auth0, no Clerk, no NextAuth).
- Local accounts: **JWT + bcrypt**, no refresh tokens, no email verification.
- Google accounts: **Passport.js** (`passport-google-oauth20`) full-page-redirect flow on web, reused via in-app browser + deep link on mobile. A second, mostly-unused, direct-token-verification implementation also exists (`google-auth-library` + `mobileAuthRoutes.js`).
- Tokens: 30-day JWT, stored in **`localStorage`** (web) / **`AsyncStorage`** (mobile) — not httpOnly cookies.
- The console warnings you saw when testing Google sign-in (`Self-XSS`, `TrustedScript` blocked, `Grammarly.js` permissions violation) are **not from your app's code** — see §6.

---

## 1. Tech Stack

### Backend (`server/package.json`)
| Concern | Library |
|---|---|
| HTTP framework | Express 4.18 (+ `express-async-errors`) |
| Database | MongoDB via Mongoose 6.5 |
| Password hashing | `bcrypt` 5.0.1 |
| JWT | `jsonwebtoken` 8.5.1 |
| Google OAuth (web redirect) | `passport` + `passport-google-oauth20` |
| Google token verification (mobile alt-path) | `google-auth-library` (`OAuth2Client`) |
| OAuth handshake state only | `express-session` |
| Validation | `express-validator` |
| Rate limiting | `express-rate-limit` |
| Security headers | `helmet` |
| CORS | `cors` |

### Web frontend (`client/package.json`)
- React 18, React Router 6, Redux Toolkit (RTK Query), MUI 5.
- `jwt-decode` is installed but **not actually used** — the app manually decodes JWTs with `atob(token.split('.')[1])` in several files instead.
- **No** `@react-oauth/google`, no Firebase SDK. "Sign in with Google" is a plain button that does `window.location.href = "<api>/auth/google"` — a full browser redirect, not a popup/SDK flow.

### Mobile (`mobile/package.json`)
- Expo / React Native, `expo-auth-session`, `expo-web-browser`, `expo-secure-store`, `@react-native-async-storage/async-storage`.
- `@react-native-google-signin/google-signin` is installed but **not used** by the active auth code — the current implementation opens an in-app browser to the same backend redirect endpoint used by web, and completes via a deep link (see §4B). This was a deliberate rework after repeated failures with the native SDK approach (see §8, git history).

---

## 2. Email/Password Sign-Up Flow

**Frontend:** [client/src/features/auth/SingUp/NewUserForm.js](../client/src/features/auth/SingUp/NewUserForm.js)
- Form fields: `emailOrPhone`, `password`, `country`, `acceptTerms`.
- Client-side password regex (line ~387): `/^[A-z0-9!@#$%]{4,12}$/`
  - **Bug:** `[A-z]` is a common regex typo — the ASCII range `A`–`z` includes `[ \ ] ^ _ \`` in addition to letters, so those punctuation characters are silently accepted as "letters."
  - Also only requires 4–12 characters, no complexity requirement.
- `handleSubmit` → `useAddNewUserMutation()` → **`POST /users`** with `{ username: emailOrPhone, password, country }`.
- On success: stores `accessToken` via Redux (`setCredentials`), redirects to `/dash` (or a saved deep-link target).
- On error, translates known server error codes (`OAUTH_EMAIL_EXISTS`, `OAUTH_LOGIN_ATTEMPT`) into user-facing copy.

**Backend route actually hit:** `POST /users` → `usersController.createNewUser`
(Note: there is *also* a `POST /auth/register` route wired up with stronger validation — see §8, "route duplication" — but the frontend does not call it.)

**Controller:** [server/controllers/usersController.js](../server/controllers/usersController.js) — `createNewUser`
1. Requires `username`, `password`, `country`.
2. Classifies `username` as an email or a phone number via regex.
3. Duplicate-email check → `409`. If the *existing* account is a Google account, responds with `{ message: "OAUTH_EMAIL_EXISTS", code: "OAUTH_USER" }` so the frontend can say "this email already has a Google account, log in with Google instead."
4. Duplicate-phone check → `409`. Duplicate-username check → `409`.
5. **Password hashing:** `bcrypt.hash(password, 10)` (cost factor 10).
6. Captures `ipAddress` from `x-forwarded-for` / `x-real-ip` / socket.
7. `User.create(userObject)`.
8. `generateTokens(...)` signs a JWT.
9. Responds `{ accessToken }` — no refresh token, no cookie.

---

## 3. Email/Password Login Flow

**Frontend:** [client/src/features/auth/Login/Login.js](../client/src/features/auth/Login/Login.js)
- `handleSubmit` → `useLoginMutation()` → `POST /auth` with `{ emailOrPhone, password }`.
- On success: `setCredentials({ accessToken })`, redirect to `/dash`.

**Route:** `POST /auth` (`server/routes/authRoutes.js`)
```js
router.route("/").post(
  authRateLimit,             // 5 attempts / 15 min, doesn't count successful attempts
  validationSets.userLogin,
  validateRequest,
  asyncAuthHandler(authController.login)
);
```

**Controller:** [server/controllers/authcontroller.js](../server/controllers/authcontroller.js) — `login`
1. Requires `emailOrPhone` + `password`.
2. Looks up user by `$or: [email, phone, username]` with **case-insensitive collation**.
3. Not found → `INVALID_CREDENTIALS` (401).
4. **If the matched account has `authProvider === 'google'`**, rejects with `OAUTH_LOGIN_ATTEMPT` (400) — you can't log in with a password on a Google-only account.
5. `bcrypt.compare(password, foundUser.password)` — wrong password → the *same* `INVALID_CREDENTIALS` message as "user not found" (this is intentional and good practice — it avoids leaking whether an email is registered).
6. `generateTokens({ username, id, country, role })`.
7. Responds `{ accessToken }`.

---

## 4. Google OAuth — three implementations in one codebase

### A. Web — Passport.js redirect flow (the one you tested)

1. **Button:** [client/src/features/auth/Login/Login.js](../client/src/features/auth/Login/Login.js) / `NewUserForm.js` render a plain MUI button with a static Google icon (`gstatic.com`). `onClick` does:
   ```js
   window.location.href = `${apiUrl}/auth/google`;
   ```
   This is a **full-page redirect**, not `@react-oauth/google` or a popup — the browser navigates away from your React app entirely.

2. **Initiate:** `GET /auth/google` ([server/routes/googleAuthRoutes.js](../server/routes/googleAuthRoutes.js))
   - Detects mobile via query param/header.
   - Packs `{ mobile, redirectUri }` into a base64 `state` param.
   - Calls `passport.authenticate('google', { session: false, scope: ['profile','email'], state })`, which redirects the browser to Google's consent screen.

3. **Passport strategy config:** [server/config/passport.js](../server/config/passport.js)
   - `clientID`/`clientSecret`/`callbackURL` from env.
   - Verify callback: looks up user by `email` or `googleId`.
     - **Found** → updates `lastLogin`, backfills `googleId`/`authProvider`/avatar if missing, calls `done(null, existingUser)`.
     - **Not found** → returns a **pending user object** (`isPending: true`) — nothing is written to the DB yet, because the app still needs the user to pick a `country` (a required field on your `User` schema) before it can create the account.

4. **Callback:** `GET /auth/google/callback`
   - Runs `passport.authenticate('google', { session: false, failureRedirect: '<frontend>/login?error=oauth_failed' })`.
   - If `user.isPending`:
     - Generates a random `pendingToken` (`crypto.randomBytes(32).toString('hex')`).
     - Stores `{ userData, timestamp }` in an **in-memory `Map`** (`pendingRegistrations`), swept every minute, 5-minute TTL.
     - Redirects to `.../auth/select-country?pendingToken=...`.
   - If existing user: signs a JWT, redirects to `<frontend>/auth/callback?token=<jwt>`.

5. **Frontend receiver:** [client/src/features/auth/OAuthCallback.jsx](../client/src/features/auth/OAuthCallback.jsx) reads `?token=` or `?error=` from the URL, stores the token, navigates to `/dash`.

6. **New-user country step:** [client/src/features/auth/CountrySelection.jsx](../client/src/features/auth/CountrySelection.jsx) posts `{ pendingToken, countryId }` to `POST /auth/complete`.

7. **`POST /auth/complete`** (`googleAuthRoutes.js`):
   - Validates `pendingToken` + `countryId`; rejects if expired (>5 min) or country doesn't exist.
   - Auto-generates a `username` from the email local-part, sanitized to `[a-zA-Z0-9_]`, deduplicated with a numeric suffix if taken.
   - Re-checks for a race (another request created the same account in the meantime) → `USER_EXISTS`.
   - `User.create({ username, email, googleId, authProvider: 'google', country, profile, ipAddress, lastLogin, isActive: true, role: 'user' })` — **no password** is set (schema makes `password` optional when `authProvider !== 'local'`).
   - Signs a JWT, responds `201 { accessToken, message, username }`.

### B. Mobile — same Passport flow, browser + deep link

- [mobile/src/utils/googleAuthNew.js](../mobile/src/utils/googleAuthNew.js): `authenticate()` opens `WebBrowser.openBrowserAsync("${API_BASE_URL}/auth/google?mobile=true")`.
- Server detects `mobile=true`, and on completion serves `GET /auth/mobile-callback`, which injects `window.serverToken` / `window.serverPendingToken` into `server/views/mobile-callback.html`; that HTML page fires the app's custom URL scheme (deep link) to hand the token back to the RN app.
- [mobile/src/context/AuthContextNew.js](../mobile/src/context/AuthContextNew.js) (`signInWithGoogle`) drives this and stores the resulting token in `AsyncStorage`.
- Per `mobile/FINAL_OAUTH_SOLUTION.md`, this replaced an earlier native-SDK approach after repeated `400` errors on Google's account picker — the fix was to make mobile reuse the *exact* web browser-redirect flow rather than a native SDK flow.

### C. Mobile — direct ID-token verification (legacy / likely dead code)

[server/routes/mobileAuthRoutes.js](../server/routes/mobileAuthRoutes.js) implements a **second, independent** mechanism using `google-auth-library` directly instead of Passport:

```js
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
const verifyGoogleToken = async (idToken) => {
  const ticket = await googleClient.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
  return ticket.getPayload();
};
```
- `POST /auth/exchange-code` — exchanges an authorization code for tokens, then verifies the `id_token`.
- `POST /auth/google/mobile` — accepts a client-supplied `idToken` + `user` object, verifies server-side, **cross-checks `tokenPayload.email === user.email`** to prevent a forged payload, requires `email_verified`, then runs the same find-or-pending-register logic as path A.
- `POST /auth/google/mobile/complete` — same idea as `/auth/complete`.

No current mobile screen calls these endpoints — `AuthContextNew.js` only uses path B. This looks like an abandoned earlier attempt that was never deleted.

### Environment variables involved (names only)
`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `JWT_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `SESSION_SECRET`, `FRONTEND_URL`, `CLIENT_URL`, `COOKIE_DOMAIN` (server); `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_FRONTEND_URL` (mobile).

---

## 5. Session / Token Management

- **JWT only — no refresh tokens.** `jwtSecurity.js` literally comments: "Simplified JWT token generation - only access tokens."
- `generateTokens` ([server/middleware/jwtSecurity.js](../server/middleware/jwtSecurity.js)):
  - `HS256`, payload `{ UserInfo: { username, usernameId, country, role }, iat, iss: 'mafqoudat-api', aud: 'mafqoudat-client', jti: crypto.randomUUID() }`.
  - Expiry from `JWT_ACCESS_EXPIRES_IN`, **defaults to 30 days**.
- `verifyJWT` middleware validates issuer/audience/algorithm, checks a blacklist, validates payload shape, re-derives max age and rejects tokens older than that window.
- **Logout** blacklists the token's `jti` in an **in-memory `Map`** for only **~15 minutes** — even though the token itself is valid for 30 days. If the token isn't blacklisted-forever, "logging out" doesn't actually revoke access beyond a short window, and the blacklist is per-process (doesn't survive a restart or work across multiple server instances).
- `express-session` + Passport session exist **only** to support the OAuth handshake — actual API calls are stateless Bearer-JWT, not session cookies.
- **Client-side storage:**
  - Web: `localStorage` ([client/src/utils/authStorage.js](../client/src/utils/authStorage.js)) — not an httpOnly cookie, so any JS running on the page (including an XSS payload) can read the token.
  - Mobile: `AsyncStorage` (not `expo-secure-store`, despite that being a dependency) — also unencrypted-at-rest by default.
  - The app manually decodes JWTs with `atob(token.split('.')[1])` in multiple places rather than the installed `jwt-decode` package — functionally fine for reading your own unverified claims client-side, just inconsistent library usage.

---

## 6. About the console warnings you saw

None of these come from your app's authentication code:

- **"Using this console may allow attackers to impersonate you..." (Self-XSS warning)** — this is a **standard Chrome/Edge DevTools banner** shown to every user who opens DevTools on any website, to discourage pasting attacker-supplied code into the console. It is not app-specific and not a bug.
- **`prepare.js:1 ... requires 'TrustedScript' assignment. The action has been blocked.`** — `prepare.js` is not a file in your codebase. This is almost always injected by a **browser extension** (several ad blockers / privacy extensions inject a script with this name) that itself is trying to assign a raw string to a DOM sink and is being blocked by a Trusted Types policy — likely **Google's own accounts.google.com page** enforcing Trusted Types, not your app (confirmed: your `helmet` CSP config has no `require-trusted-types-for` directive, so your own pages aren't the source).
- **`Grammarly.js:2 [Violation] Permissions policy violation: unload is not allowed`** — this is literally the **Grammarly browser extension** trying to attach an `unload` event listener, blocked by the page's Permissions-Policy. Also not your code.

**Takeaway:** these three lines are console noise from DevTools itself and from browser extensions (Grammarly, likely an ad/privacy blocker) running on Google's own OAuth consent page, not evidence of a bug in the Mafqoudat Google sign-up flow. If you want to double check, try the same flow in an Incognito/Guest window with extensions disabled — those lines should disappear.

---

## 7. Database Schema (`server/models/User.js`)

Auth-relevant fields:
- `username` — required, unique, 3–50 chars.
- `password` — required **only if** `!authProvider || authProvider === 'local'`, `minlength: 6`.
- `email` — optional, unique+sparse, lowercased.
- `phone` — optional, unique+sparse.
- `googleId` — unique+sparse.
- `authProvider` — enum `['local', 'google']`, default `'local'`.
- `country` — required, ref `Country`.
- `isActive` (default `true`), `role` — enum `['user','admin','moderator']`.
- `lastLogin`, `ipAddress`.
- `profile.{firstName, lastName, firstNameLabels{en,fr,ar}, lastNameLabels{en,fr,ar}, avatar}`.
- Indexes on `username`, `email` (sparse), `phone` (sparse), `googleId` (sparse unique), plus compound indexes on `country/role/isActive` and a text index over multilingual name fields.
- **No `emailVerified` flag persisted** — even for Google accounts, where Google already tells you the email is verified, that fact isn't stored on the user document.

---

## 8. Known Issues Worth Discussing

Ranked roughly by how much they matter:

1. **Global rate limiting is disabled.** `server.js` has `app.use(generalRateLimit)` commented out with a note: *"TEMPORARILY DISABLED for feature testing - re-enable before shipping to prod."* Only the per-route auth/registration limiters are still active.

2. **Password rules disagree across three layers:**
   - Frontend regex: 4–12 chars, `[A-z0-9!@#$%]` (buggy range, includes stray punctuation).
   - Mongoose schema: `minlength: 6`.
   - `express-validator`'s rule set: 8–128 chars, requires upper+lower+digit — but this rule set is attached to `POST /auth/register`, **which the frontend doesn't call**. The route the frontend actually hits (`POST /users`) doesn't enforce it.
   - Net effect: your real password policy is "6+ characters, whatever the client felt like sending," not the 8-char/mixed-case policy that exists in the code but is unreachable.

3. **Two parallel Google OAuth backends** (`googleAuthRoutes.js` via Passport, `mobileAuthRoutes.js` via raw `google-auth-library`) with duplicated pending-registration and username-generation logic. Only the first is wired into any current UI. This roughly doubles the surface area to keep secure and consistent, for no current benefit.

4. **In-memory-only state** for both pending OAuth registrations and the JWT blacklist. On Render/Railway-style deployments (restarts, multiple instances, redeploys):
   - A user who starts a Google sign-up right as the server restarts/redeploys loses their pending registration and has to start over.
   - A blacklisted (logged-out) token becomes valid again after a restart, or is simply never blacklisted on other instances in a multi-instance deployment.

5. **Logout doesn't really log you out.** The blacklist entry expires after ~15 minutes, but the JWT itself is valid for 30 days. After 15 minutes, a captured/leaked token from before logout works again.

6. **No email verification for local accounts.** Anyone can register with an email they don't own and start using the account immediately. (Google accounts get transient verification of `email_verified` during OAuth, but that fact isn't persisted either.)

7. **No CSRF middleware**, though `X-CSRF-Token` is listed in the CORS allowed headers as if it's expected somewhere. Risk is lower since API auth is Bearer-JWT rather than cookie-based, but the OAuth handshake's `express-session` cookie has no CSRF protection.

8. **Tokens in `localStorage`/`AsyncStorage` rather than httpOnly cookies** — standard XSS-exfiltration risk for JWTs; combined with the 30-day expiry and weak logout semantics (#5), a single XSS bug would let an attacker hold a working token for a long time.

9. **Heavy historical churn on mobile Google OAuth** — ~40+ commits and a dozen troubleshooting markdown files in `mobile/` (`DEBUG_OAUTH_FLOW.md`, `OAUTH_FIX_README.md`, `FINAL_OAUTH_SOLUTION.md`, etc.) documenting repeated attempts before landing on the current browser-redirect-based approach. Worth a cleanup pass to delete the dead legacy code path (§4C) and the now-obsolete troubleshooting docs, since they no longer reflect what's actually running.

---

## 9. Error Handling / User-Facing Messages (reference)

**Local auth**
| Condition | HTTP | Body |
|---|---|---|
| Duplicate email (local) | 409 | `{ message: "Email already exists" }` |
| Duplicate email (existing account is Google) | 409 | `{ message: "OAUTH_EMAIL_EXISTS", code: "OAUTH_USER" }` |
| Duplicate phone | 409 | `{ message: "Phone number already exists" }` |
| Duplicate username | 409 | `{ message: "Email or phone number already exists" }` |
| Wrong password / unknown identifier | 401 | `INVALID_CREDENTIALS` (same message for both — good, avoids user enumeration) |
| Password login on a Google-only account | 400 | `OAUTH_USER` / `"OAUTH_LOGIN_ATTEMPT"` |

All of these are standardized by `authErrorMiddleware`: `{ success: false, error: { message, code, timestamp } }` (`details` only in `development`).

**Google OAuth**
| Condition | Result |
|---|---|
| Passport auth failure | redirect to `<frontend>/login?error=oauth_failed` |
| Token generation failure post-auth | redirect `?error=token_generation_failed` |
| Unexpected state (no pending user, no `_id`) | redirect `?error=unexpected_state` |
| Uncaught callback exception | redirect `?error=oauth_error` |
| `/auth/complete`: missing fields | `400 VALIDATION_ERROR` |
| `/auth/complete`: bad/unknown pendingToken | `400 INVALID_TOKEN` |
| `/auth/complete`: expired pendingToken (>5 min) | `400 TOKEN_EXPIRED` |
| `/auth/complete`: invalid country | `400 INVALID_COUNTRY` |
| `/auth/complete`: account created mid-flow (race) | `400 USER_EXISTS` |
| `/auth/complete`: Mongo duplicate key | `400 DUPLICATE_USER` |
| Mobile direct-verification: bad ID token | `401 INVALID_TOKEN` |
| Mobile direct-verification: email mismatch | `400 EMAIL_MISMATCH` |
| Mobile direct-verification: email not verified | `400 EMAIL_NOT_VERIFIED` |

`OAuthCallback.jsx` on the frontend redirects any `?error=` param to `/login?error=<code>`, but there's no dedicated user-friendly copy rendered on that intermediate page — the message ends up depending on whatever generic notice state `Login.js` shows for that param.

---

## 10. Suggested talking points for your Claude chat

Things worth prioritizing if you want to discuss concrete improvements:
1. Re-enable global rate limiting before any real traffic (§8.1).
2. Pick one signup route and one password policy; delete the unused stricter path or wire the frontend to it (§8.2).
3. Decide whether the legacy `mobileAuthRoutes.js` direct-token path is still needed — if not, delete it along with the outdated troubleshooting docs (§8.3, §8.9).
4. Move pending-OAuth-registration and token-blacklist state out of in-memory `Map`s into Redis/Mongo so they survive restarts and work across instances (§8.4).
5. Decide on a real logout story — either short-lived access tokens + refresh tokens, or a blacklist that lives as long as the token does (§8.5).
6. Add email verification for local signups, and persist `emailVerified` for Google accounts too (§8.6).
7. Consider httpOnly cookies instead of `localStorage`/`AsyncStorage` for token storage, if you want to meaningfully reduce XSS blast radius (§8.8).
