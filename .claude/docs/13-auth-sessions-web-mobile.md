## Auth sessions (web + mobile)

Short-lived JWT access token (default 30 min, `JWT_ACCESS_EXPIRES_IN` - do NOT
set this to `30d` anymore; that was the pre-refresh-token era) + long-lived
opaque refresh token (30 days, `REFRESH_TOKEN_EXPIRES_IN`), rotated on every
use. One issuance path for all six entry points (password login, register, the
three OAuth routes, `/auth/refresh`): `issueSession` in
[authSession.js](server/utils/authSession.js).

- **Storage/revocation**: [tokenStore.js](server/services/tokenStore.js) -
  Redis (shared client via `getRedisClient()` from `unifiedCache.js`, so logout
  survives restarts and works across instances) with an in-memory fallback when
  `REDIS_URL` is absent. Refresh tokens stored as SHA-256 hashes only; consumed
  via `GETDEL` so a replayed (stolen-and-rotated-away) token fails atomically.
  Logout denylists the access token's `jti` AND revokes the refresh session,
  and deliberately does **not** require a valid access token - an expired
  session must still be able to revoke its refresh token
  ([authcontroller.js](server/controllers/authcontroller.js) `logoutHandler`).
- **`/auth/refresh` reloads the user from the DB** before minting, so role
  demotion/deactivation takes effect within one access-token lifetime.
  Refresh-token transport is the platform split: web = httpOnly cookie scoped
  to `/auth` (`SameSite=None; Secure` in prod - Vercel→Render is cross-site;
  `Lax` in dev), mobile = JSON body stored in SecureStore. JSON auth responses
  carry `refreshToken` in the body for mobile; web ignores it.
- **Legacy bootstrap**: a pre-deploy 30-day token with no refresh session can
  call `/auth/refresh` with only its Bearer and get upgraded to a real session
  - gated on the token's own issued lifetime (`exp - iat` ≥ 4× the access
  lifetime), so a stolen short-lived token gains nothing. This plus the removal
  of verifyJWT's wall-clock "token too old" check (each token is judged on its
  own `exp`) is what makes the deploy not force anyone to re-login. Web calls
  it once at boot ([useSessionBootstrap.js](client/src/hooks/useSessionBootstrap.js)),
  mobile in `AuthContext.loadStoredAuth` when a token exists without a stored
  refresh token.
- **Silent refresh, both clients**: single-flight refresh + one retry on a 401
  session failure - web in [apiSlice.js](client/src/app/api/apiSlice.js)
  (plain-fetch twin: [refreshClient.js](client/src/utils/refreshClient.js)),
  mobile in [apiService.js](mobile/src/api/apiService.js)
  (`refreshSessionTokens`, `_retriedAfterRefresh` guard). Only when refresh
  fails too does the existing logout-with-sessionExpired path run. The 401
  `code` values in jwtSecurity.js remain a contract with both clients; refresh
  adds `NO_REFRESH_TOKEN`/`REFRESH_INVALID`. `/auth/refresh` has its own rate
  limiter (`refresh` in rateLimiting.js, counts failures only) - never put it
  behind the strict `auth` one.
- **Mobile OAuth browser flows never put tokens in a URL.** They used to
  (`?token=...&refreshToken=...` on `/auth/mobile-callback` and on the deep
  link), and `middleware/logger.js` writes every request's full query string
  to `reqLog.log` unredacted - so each mobile OAuth sign-in wrote a live
  30-day refresh credential to disk in plaintext, and left it in the auth
  browser's history. Now the callback parks the pair under a one-time opaque
  code ([oauthExchange.js](server/utils/oauthExchange.js) - 5-minute expiry,
  deleted on read, same shape as the `pendingRegistrations` handoff beside it)
  and only `?code=` travels; the app trades it at `POST /auth/mobile-exchange`
  ([mobile/src/utils/oauthExchange.js](mobile/src/utils/oauthExchange.js),
  shared by Google and Facebook). A cookie still cannot be used here - the
  auth-session browser's jar is not the app's. Native mobile endpoints
  (`mobileAuthRoutes.js`) were never affected: they answer a POST with a JSON
  body. Facebook's *web* callback still returns
  `{ redirectUrl, webRefreshToken }` from `processFacebookCallback` so the
  in-flight-dedupe duplicate request also sets the web cookie on its own
  response.
- **`/auth/refresh` and `/auth/logout` require an `X-Requested-With` header**
  ([csrfGuard.js](server/middleware/csrfGuard.js), 403 `CSRF_HEADER_REQUIRED`
  without it). They are the only two routes that authenticate from the refresh
  cookie alone, and that cookie is `SameSite=None` in production by necessity,
  so a third-party page could otherwise drive them with a plain
  `<form method="POST">` - a simple request, no preflight, the browser
  attaching the cookie by itself. A header cannot ride on a form post, and
  setting it from script forces a preflight that `corsOptions.js`'s allowlist
  answers. Deliberately not a double-submit token: same protection here for a
  token to mint, store, rotate and verify. Every client sends it -
  `apiSlice.js`'s `prepareHeaders` (all endpoints), `refreshClient.js`,
  `logoutUtils.js`, mobile's `apiClient` default headers plus the plain-axios
  `refreshSessionTokens` and `googleAuth.signOut`.
- **A failed refresh only clears the cookie when the session is really gone.**
  `refreshUnauthorized`'s `clearCookie` is opt-in: `NO_REFRESH_TOKEN` and
  `ACCOUNT_INACTIVE` clear, `REFRESH_INVALID` does not. Cookies are shared
  across a browser's tabs, so two tabs booting together both refresh with the
  same one; rotation is atomic, exactly one wins, and clearing on the loser's
  401 wiped the winner's fresh cookie whenever that response landed second -
  a forced re-login with a live session on the server. The client half:
  `refreshClient.js` treats `REFRESH_INVALID` as "another tab may have won"
  and looks for a newer, unexpired token in the shared `localStorage` (once,
  then again after `CROSS_TAB_RECHECK_MS`) before reporting failure.
- **Legacy bootstrap tokens are single-use**, like refresh tokens.
  `readLegacyBootstrapUser` returns the decoded `jti`/`exp` and `refresh`
  denylists them (`blacklistToken`) the moment the new session is issued -
  otherwise one leaked pre-migration 30-day token could mint unlimited
  independent sessions for the rest of its lifetime, with nothing to revoke
  and no way to notice.
- **`PATCH /users`** issues a whole session (`issueSession` +
  `setRefreshCookie`) on username/country change, like every other
  credential-minting call site; it used to call `generateTokens` directly and
  hand back an access token with no session behind it. Web reads only
  `accessToken` off the response and takes the refresh token from the cookie;
  mobile stores the body copy (`AuthContext.refreshSession` takes an optional
  second argument) so it does not leave an orphaned session behind.
- **One verification call, not five.** `verifyAccessToken(token)` in
  [jwtSecurity.js](server/middleware/jwtSecurity.js) is the only place
  `jwt.verify` is called on an access token; `JWT_VERIFY_OPTIONS` beside it is
  the only place the issuer/audience/algorithm options are written. It resolves
  with the decoded payload and rejects with jsonwebtoken's own error, so each
  caller keeps its own idea of what a failure means - `verifyJWT` still answers
  its 401 `code` values, both `optionalAuth`s still continue as a guest,
  `maintenanceMode`'s admin bypass still falls through to the excluded-route
  check, `authcontroller`'s legacy bootstrap and logout still return null /
  denylist nothing. What it removed was five hand-maintained copies of the same
  options object, two of which had already drifted to passing **no options at
  all** (`middleware/optionalAuth.js`, and `maintenanceMode.js`'s admin bypass -
  the one that decides who gets through a maintenance window): those two accepted
  a token signed by another issuer, or with `alg: none`. Making
  `readBearerUserInfo` async is the one knock-on - its single caller,
  `postViewTracker`, was already async, and `optionalAuth` is a promise chain
  now, so it ends `.then(() => next()).catch(next)` to hand a downstream
  synchronous throw to Express rather than leaving it an unhandled rejection
  (`server.js` exits the process on those).
- **`server.js` refuses to boot without `JWT_SECRET`, `MONGODB_URI` or
  `FRONTEND_URL`** - checked right after `dotenv.config()`, before anything
  reads them, `process.exit(1)` naming every missing one. Each was survivable at
  boot and only broke later, somewhere that did not point back at the config:
  no `JWT_SECRET` means jsonwebtoken signs and verifies with `undefined` as the
  key, no `MONGODB_URI` surfaces as a connection error rather than a config one,
  and no `FRONTEND_URL` just drops the entry from
  [allowedOrigins.js](server/config/allowedOrigins.js), leaving the deployed
  site CORS-blocked from its own API.
- **Offline check**: `npm run test-auth-session` in `server/` - boots the real
  auth routes/controllers/middleware on an ephemeral port with only
  `models/User` stubbed, and drives real HTTP at each of the five failure
  modes above (legacy replay, tokens in a URL, a cross-site form post, a
  two-tab rotation race, `PATCH /users`).
