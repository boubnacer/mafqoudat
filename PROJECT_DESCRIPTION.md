# Mafqoudat — Project Description (Web Only)

> **Mafqoudat** (Arabic: "lost items/persons") is a multi-country, multilingual (English / French / Arabic, with full RTL support) **community lost-and-found classifieds platform**. Users post items/persons they've lost or found, other users browse and search those posts, and contact happens off-platform (phone, email, or WhatsApp) using the details the poster provides. This document covers the **website only** — the `client/` (React frontend) and `server/` (Node/Express backend). The `mobile/` (Expo/React Native) app is intentionally excluded.

---

## 1. High-Level Architecture

```
┌─────────────────┐        REST API (JWT bearer)        ┌──────────────────────┐
│  client/ (SPA)   │ ───────────────────────────────────▶│  server/ (Express)   │
│  React 18 + CRA  │◀─────────────────────────────────── │  Node.js ≥18         │
│  Redux Toolkit    │                                      │  MongoDB (Mongoose)  │
│  + RTK Query      │                                      │  Redis (optional)    │
└─────────────────┘                                       └──────────────────────┘
     Vercel                                                       Railway
  (mafqoudat.com)                                        (mafqoudat-production
                                                             .up.railway.app)
```

- **Frontend**: deployed on **Vercel** as a static SPA. `client/vercel.json` proxies API-shaped paths (`/api/*`, `/auth/*`, `/users/*`, `/posts/*`, `/countries/*`, `/cities*`, `/floptions/*`, `/categories/*`, `/promotion/*`, `/admin/*`, `/uploads/*`) straight through to the Railway backend — a same-domain reverse-proxy pattern used to avoid CORS/cookie friction.
- **Backend**: deployed on **Railway** (Nixpacks builder; `nixpacks.toml` installs Node 18, Python3, make, gcc for native deps like `sharp`/`bcrypt`). **Render** (`render.yaml`) is configured as a backup/alternate deployment target with the same env vars. No Docker is actually used despite ignore-files existing for it.
- **Database**: MongoDB (via Mongoose), most likely MongoDB Atlas free tier — the codebase shows heavy evidence of engineering around free-tier memory/connection constraints (`NODE_OPTIONS=--max-old-space-size=512 --expose-gc`, memory-optimized controllers, DB cost-monitoring routes).
- **Caching**: Redis as a primary distributed cache with automatic fallback to an in-memory cache (`node-cache`) if Redis is unavailable — non-fatal if Redis fails to connect.
- **Images**: Cloudinary for storage/CDN/transformation, fed by Multer (memory storage) on the backend.

---

## 2. Backend (`server/`)

### 2.1 Stack
- **Express 4.18** with `express-async-errors`, `express-validator`, `express-session`, `express-rate-limit`
- **Mongoose 6.5** (MongoDB ODM)
- **Auth**: `jsonwebtoken`, `bcrypt`, `passport` + `passport-google-oauth20`, `google-auth-library`
- **Uploads/Images**: `multer`, `cloudinary`, `sharp` (optional, with fallback if unavailable)
- **Caching**: `redis`, `node-cache`
- **Email**: `nodemailer`
- **Security**: `helmet`, `cors`, `cookie-parser`
- **Misc**: `axios`, `date-fns`, `uuid`, `compression`, `body-parser`, `country-iso-2-to-3`, `dotenv`

### 2.2 Bootstrap (`server/server.js`)
Startup sequence:
1. Load env vars, register async-error handling.
2. `connectDB()` — resilient MongoDB connection with retry logic; process exits if it can't connect.
3. `initRedis()` — non-fatal if Redis is unavailable (falls back to in-memory cache).
4. `scheduleCacheWarming()` — pre-warms frequently accessed caches.
5. Large middleware stack (in order): security headers → request size limiter → request logger → input sanitizer → DB query validator → compression → custom logger → memory monitoring → 30s request timeout → CORS → general rate limiting → JSON/urlencoded body parsing (10mb limit) → cookie parser → visitor tracker (session/analytics) → `express-session` (for OAuth handshake only) → Passport init/session → static file serving (`public/`) → maintenance-mode gate.
6. Routes mounted (see table below).
7. Ad-hoc ops endpoints defined directly in `server.js`: `/cache/stats`, `/cache/clear`, `/cache/warm`, `/cache/health`, `/memory/stats`, `/memory/optimize`, `/memory/report`, `/health`.
8. Catch-all 404 for unmatched routes (explains this is an API-only server).
9. Server only starts `listen()` once the Mongo connection is confirmed open; graceful shutdown handlers for `SIGTERM`/`SIGINT`/uncaught exceptions.

**Notable characteristic**: this backend is heavily engineered for **performance/resilience on constrained hosting**. There are multiple, overlapping caching implementations (`cache.js`, `enhancedCache.js`, `optimizedCache.js`, `unifiedCache.js` [the one actually wired in], `staticDataCache.js`, `smartRefreshStrategy.js`, `atlasFlexOptimization.js`) and duplicate "optimized"/"memory-optimized" controller variants alongside the main ones — evidence of iterative tuning against MongoDB Atlas free-tier and Railway memory limits. A `scripts/` folder (~35 files) supports DB index management, data seeding, cache warming/monitoring, and migrations.

### 2.3 Data Models (MongoDB / Mongoose, `server/models/`)

| Model | Purpose | Key fields |
|---|---|---|
| **User** | Platform accounts | `username` (unique), `password` (only if local auth), `email`/`phone`/`googleId` (sparse-unique), `authProvider` (`local`\|`google`), `country` (ref), `isActive`, `role` (`user`\|`admin`\|`moderator`), `profile` (`firstName`/`lastName` + multilingual label variants, `avatar`). Multilingual text index; helper methods `getFullName(lang)`, `isAdmin()`, `isModerator()` |
| **Post** | Core "lost/found item" entity | `user` (ref), `country` (ref), `categories[]` (refs, + legacy singular `category`), `foundLost` (ref → type LOST/FOUND), `contact`, `contactPreferences` {phone,email,whatsapp}, `image`/`cloudinaryUrl`/`cloudinaryPublicId`, `mainDate`, `description`, `exactLocation`, `city` (Mixed — ref or free-text), `returned`, `status` (`active`\|`resolved`\|`expired`\|`suspended`), `expiresAt` (auto +30 days), promotion fields (`promotionRequested`, `promotionPhoneNumber`, etc.), `views`, `tags[]`. Compound + text indexes for country/category/status/date queries |
| **Category** | Item taxonomy | `code`, `labels` {en,fr,ar}, `color`, `iconName`, `priority`, `searchTerms[]` |
| **City** | Location taxonomy | `code`, `country` (ref), `labels` {en,fr,ar}, `isCapital`, `isDynamic` (added at runtime via API), `apiSource` (`geonames`\|`google`), `placeId` |
| **Country** | Top-level scoping dimension | `code` (ISO), `labels`/`names` {en,fr,ar}, `flag`, `isActive` |
| **FoundLost** | Post-type taxonomy (LOST vs FOUND) | `code`, `labels` {en,fr,ar}, `color`, `icon` |
| **Report** | Abuse/moderation reports on posts | `postId` (ref), `reportedBy` (ref, nullable = anonymous), `reasonType` (`inappropriate_content`, `spam_fake`, `duplicate`, `wrong_category`, `suspicious_activity`, `personal_info`, `other`), `status` (`pending`\|`reviewed`\|`resolved`\|`dismissed`), `reviewedBy`, `adminNotes`, denormalized `postData` snapshot |
| **Contact** | Public "contact us" submissions | `name`, `email`, `subject`, `message`, `status`, `priority` (auto-derived from keyword matching, e.g. "urgent"), `response`/`respondedBy` |
| **PasswordResetRequest** | Manual/admin-mediated reset queue (no self-service email link flow) | `contactInfo`, `status` (`pending`\|`processed`\|`rejected`), `processedBy`, `adminNotes` |
| **SystemSettings** | Singleton config doc | `maintenanceMode` {isActive, message, estimatedReturn}, `lastUpdatedBy` |
| **Visitor** | Anonymous analytics/visit tracking | `sessionId` (unique), `ip`, `userAgent`, `country`, `city`, `firstPage`, `visitedAt`; 90-day retention cleanup |

**Relationships**: `User —1:N→ Post`; `Country —1:N→ User/Post/City`; `Category —M:N→ Post`; `FoundLost —1:N→ Post` (type discriminator); `Post —1:N→ Report`. Promotion is just a set of fields on `Post` — no separate model.

### 2.4 API Routes (mounted in `server.js`)

| Mount path | File | Notable endpoints |
|---|---|---|
| `/` | `root.js` | `GET /visitor-session`, `GET /` (API status) |
| `/dashboard` | `dashRoutes.js` | `GET /dashboard` (cached aggregate stats) |
| `/auth` | `authRoutes.js` | `POST /auth` (login), `POST /auth/logout`, `POST /auth/register` |
| `/auth` | `googleAuthRoutes.js` | `GET /auth/google`, `GET /auth/google/callback`, `POST /auth/complete` |
| `/users` | `userRoutes.js` | `GET/POST/PATCH/DELETE /users`, `GET /users/:id` |
| `/posts` | `postRoutes.js` | `GET /posts`, `GET /posts/filtered`, `GET /posts/user`, `GET /posts/:id`, `POST /posts/report`, `POST /posts` (multipart create), `PATCH /posts`, `DELETE /posts`, `PATCH /posts/:postId/mark-returned` |
| `/countries` | `countryRoutes.js` | `GET /countries`, `GET /countries/search`, protected CRUD |
| `/cities` | `cityRoutes.js` | `GET /cities`, `/cities/search`, `/cities/search-name`, `/cities/country/:countryId`, `/cities/geonames-stats`, protected create/dynamic/cache-api/update/delete |
| `/floptions` | `flOptionsRoutes.js` | `GET /floptions` (Found/Lost type list) |
| `/categories` | `categoryRoute.js` | `GET /categories` |
| `/contact` | `contactRoutes.js` | `POST /contact` (submit), admin: `GET /contact`, `/contact/stats`, `PATCH/DELETE /contact/:id` |
| `/cities-public` | `citiesPublicRoutes.js` | `GET /cities-public` (no-auth) |
| `/dependencies` | `dependenciesRoutes.js` | `GET /dependencies/cities`, protected create for category/foundlost |
| `/promotion` | `promotionRoutes.js` | `POST /promotion/request` ("boost my post", emails admin) |
| `/admin` | `adminRoutes.js` | Full admin panel API — see §2.7 |
| `/system-settings`, `/api/system` | `systemSettingsRoutes.js`, `systemRoutes.js` | Maintenance-mode read/toggle |
| `/api/password-reset` | `passwordResetRoutes.js` | `POST /api/password-reset/request` |
| `/cost-monitoring`, `/resilience`, `/db-metrics`, `/db-health` | various | Ops/observability endpoints |

### 2.5 Authentication

Two parallel systems coexist:

1. **Local username/password** — `bcrypt` hashing, JWT issued on login.
2. **Google OAuth 2.0** — two implementations sharing the same `User` model and a "pending registration" pattern (new Google sign-ups must additionally submit a `countryId` via `POST /auth/complete` before the account is finalized):
   - **Web flow**: Passport.js (`passport-google-oauth20`) — classic redirect (`/auth/google` → Google → `/auth/google/callback`).
   - **Mobile flow** *(implementation lives in `server/`, invoked by the mobile app)*: direct `google-auth-library` `OAuth2Client` usage for ID-token verification and code exchange, plus an HTML deep-link bridge page.

**JWT design** (`middleware/jwtSecurity.js`):
- Single **access-token-only** model — no refresh tokens, default expiry `30d` (long-lived by design).
- Payload: `{ UserInfo: { username, usernameId, country, role }, iat, iss, aud, jti }`.
- `verifyJWT` middleware does deep checks: in-memory token blacklist (logout), issuer/audience/algorithm validation, token-age checks, JTI presence.
- Role helpers: `requireRole`, `requireAdmin`, `requirePermission`, `optionalAuth`.
- `express-session` is used **only** for the OAuth handshake — regular API auth is stateless, bearer-token based.

### 2.6 File Uploads / Images
- **Multer** — in-memory storage, 2MB limit, MIME/extension allow-list, blocks disguised executable filenames.
- **Cloudinary** — auto-resize (800×600 limit), auto quality/format optimization, progressive JPEG; upload results cached by content hash to avoid re-uploading duplicates; images deleted from Cloudinary when a post is deleted/replaced.
- Layered fallback chain across `config/cloudinary.js`, `optimizedCloudinary.js`, `simpleCloudinary.js`, `cloudinaryFallback.js`.
- Legacy local `/uploads` static folder also exists as a fallback storage path.

### 2.7 Admin Panel (API side, `/admin`, JWT + `role: admin` gated)
- Dashboard stats overview
- Reports queue (list/filter/update status)
- Promotion-request queue (list/filter/mark processed)
- Posts management (list/search/delete any post)
- Password-reset request queue (list/update status, admin-initiated resets)
- User management (list/search/sort, view a user's posts, delete user — cascades to their posts)
- Visitor/traffic statistics
- City management (create/update/delete per country)
- Maintenance-mode control

### 2.8 Other Integrations
- **Email**: Nodemailer over Gmail SMTP (app password) — used for promotion-request notifications to admin and a test-email endpoint. No SMS or push notifications.
- **Geolocation/Places**: `geonamesService.js` (GeoNames API, ~1000 req/day) and `googlePlacesService.js` (Google Places API, rate-limited) both feed the dynamic `City` model for autocomplete-style location search (**no interactive map UI** — text/autocomplete inputs only).
- **Translation**: server-side `translationService.js` supporting en/fr/ar labels across models.
- **Real-time / chat / payments**: none. No `socket.io`, no messaging model, no payment gateway — contact between users happens off-platform via the phone/email/WhatsApp values stored on the post.
- **Analytics**: custom server-side visitor tracking (`Visitor` model + `visitorTracker` middleware, session-cookie based) separate from client-side Google Analytics.

### 2.9 Environment Variables (names only)
- **DB**: `MONGODB_URI`, `MONGODB_URI_PROD`
- **Auth/session**: `JWT_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `SESSION_SECRET`, `COOKIE_DOMAIN`
- **Server**: `PORT`, `NODE_ENV`, `NODE_OPTIONS`, `NODE_NO_WARNINGS`
- **CORS/linkage**: `FRONTEND_URL`, `CLIENT_URL`
- **Google OAuth**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
- **Google Places**: `GOOGLE_PLACES_API_KEY`
- **Cloudinary**: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_UPLOAD_PRESET`
- **Email**: `ADMIN_EMAIL`, `SUPPORT_EMAIL`, `EMAIL_SERVICE`, `EMAIL_USER`, `EMAIL_PASS`
- **Redis**: `REDIS_URL`
- **GeoNames**: `GEONAMES_USERNAME`, `GEONAMES_API_URL`
- **Misc**: `MAINTENANCE_MODE`, `JWT_REFRESH_SECRET` (referenced in `render.yaml` but not actually used — refresh-token logic isn't implemented)

> ⚠️ **Security note**: `server/env.production` currently contains real, non-redacted secrets checked into the working copy (Mongo URI with credentials, JWT secret, Cloudinary keys, Gmail app password, Google OAuth client secret, API keys). This should be rotated/removed from version control before sharing this repo externally.

### 2.10 Deployment
- **Backend**: Railway (Nixpacks builder, healthcheck on `/`, restart-on-failure). Render configured as a backup target with the same env vars.
- **Frontend**: Vercel, proxying API-shaped routes to the Railway backend to keep everything same-domain.
- No Dockerfile is actually used despite ignore-files existing for Docker.

---

## 3. Frontend (`client/`)

### 3.1 Stack
- **Create React App** (`react-scripts` 5.0.1) — not Vite/Next.js. React 18.2, React Router DOM 6.3.
- **State management**: Redux Toolkit + **RTK Query** as the primary data-fetching/caching layer (not raw axios/fetch calls scattered around).
- **UI**: Material UI (MUI v5) + Emotion (styling engine), FontAwesome icons, `framer-motion` (animation), `lottie-react`, `swiper` (carousels). Central `theme.js` supports light/dark mode **and RTL layout switching** for Arabic.
- **Forms**: Formik + Yup validation.
- **i18n**: hand-rolled — a large (~4,300 line) translation dictionary (`src/utils/translations.js`) covering en/fr/ar, exposed via a custom `useTranslation()` hook (the `i18next` packages are listed as deps but not actually used).
- **Images**: `browser-image-compression` compresses images client-side before upload.
- **Charts**: Nivo (`@nivo/core`, `geo`, `line`, `pie`) — used in the admin dashboard.
- **SEO**: `react-helmet-async` for meta tags, `react-snap` pre-renders static HTML for marketing/legal routes.
- **Other**: `axios`, `date-fns`, `jwt-decode`, `react-spinners`.

### 3.2 Folder Structure (`client/src/`)
```
App.js              # root component, all routing (code-split via React.lazy + Suspense)
index.js            # ReactDOM root + Redux Provider + BrowserRouter
theme.js             # MUI theme (light/dark, RTL)
app/
  api/apiSlice.js    # RTK Query base API
  state/             # global UI slice + maintenance slice
  store.js           # combines auth/posts/dash/global/maintenance/apiSlice reducers
components/          # shared UI: Navbar, WelcomePage, PublicPostsPage, dialogs, guards, Pages/ (legal content), Layout/, Sidebar/, Footer/, Filter/, Pagination/, dashboard/
features/            # RTK "slice" feature modules
  auth/              # Login, SignUp, CountrySelection, OAuthCallback, authSlice/authApiSlice
  posts/             # NewPost, EditPost, PostPage, PostsList, MyPostsPage, ReportPage, postsApiSlice
  admin/             # AdminDashboard.jsx (~101KB, largest file in the project), adminApiSlice
  dashboard/         # Dash.js (home dashboard), dashSlice
  userSettings/      # UserPage/UsersList, EditUser, UserProfile
  countries/, dependencies/, contact/, MANAGER/ (DependenciesManager), PrefetchData/
config/              # categories.js, foundsOptions.js (client-side metadata)
utils/               # translations.js, authStorage, tokenUtils, analytics.js (GA), visitorSession(Sync).js
hooks/               # useAuth, useTitle, useAuthErrorHandler, useMaintenanceCheck
lang/                # LanguageToggle.js
```

### 3.3 Routing (React Router v6)
- `/` → `WelcomePage` (landing)
- `/posts` → `PublicPostsPage` (public browsing, no login required)
- Static/legal: `/privacy`, `/terms`, `/cookies`, `/guidelines`, `/safety`, `/about`, `/blog`, `/help`, `/contact`
- Auth: `/login`, `/signup`, `/auth/select-country` (post-OAuth country picker), `/auth/callback`
- `/dash` (nested layout, requires country selection via `CountryGuard`):
  - index → `Dash`
  - `posts`, `posts/:id` → `PostsList`, `SinglePost`
  - Protected (auth + country required): `posts/new`, `posts/edit/:id`, `profile`, `myposts`, `users`, `users/:id`, `dependencies`, `admin`
- Guard components: `ProtectedRoute` (auth), `CountryGuard` (forces country selection), `MaintenanceMode` (full-page block for non-admins when maintenance mode is on — detected both by polling and passively from any 503 API response)

### 3.4 State & API Layer
- Redux store slices: `auth`, `posts`, `dash`, `global` (theme, sidebar, `currentCountry`, found/lost filter, category filter — persisted to `localStorage`), `maintenance`, plus the injected RTK Query `apiSlice` reducer.
- `apiSlice.js`: `baseUrl` from `REACT_APP_API_URL`, injects `Authorization: Bearer <token>` and a custom `X-Visitor-Session` header; a wrapper (`baseQueryWithReauth`) detects 503-with-maintenanceMode and dispatches maintenance state, detects 401/403 and logs the user out (no refresh-token retry, matching the backend's single-long-lived-token design).
- Per-feature API slices injected via `injectEndpoints`: posts, auth, dependencies, countries, users, admin, system settings, DB metrics, reports.
- Cache-tag invalidation (`tagTypes`) drives automatic refetching after mutations; cache keys incorporate the active language so switching en/fr/ar doesn't serve stale translated data.

### 3.5 Key Pages/Features
- **WelcomePage** — landing/marketing page.
- **PublicPostsPage** — browse lost/found posts without logging in.
- **NewPost / EditPost / PostsList / SinglePost / MyPostsPage / ReportPage** — full post CRUD lifecycle. `NewPostForm.js` (~106KB) is the largest form, handling category/city/country selection, client-side image compression, and contact-preference toggles.
- **Login / SignUp / CountrySelection / OAuthCallback** — includes the Google OAuth "pending registration" handoff (reads a token from the URL, then either logs in or routes to country selection to finish registration).
- **AdminDashboard.jsx** (101KB, largest component overall) — reports moderation, promotion-request management, password-reset queue, user management, posts management, visitor statistics (via Nivo charts), system settings/maintenance toggle.
- **Dash.js** — aggregated stats/summary home view.
- **DependenciesManager** — admin CRUD for taxonomy data (categories, found/lost types, cities).
- **UserProfile / UsersList / EditUser** — account management.
- **Static content pages**: AboutUs, Blog, Contact, Community Guidelines, Cookie Notice, Help Center, Privacy Policy, Safety Tips, Terms of Use — a fairly complete legal/trust-and-safety set typical of a consumer platform.
- **Key modals**: `ClaimItemDialog` (claim a found item), `ReportDialog` (report abuse), `PromotionDialog` (request a "boost"), `PasswordResetDialog` (submit reset request for admin review).

### 3.6 Styling
- MUI v5 as the primary component/styling system with Emotion underneath; some supplementary plain CSS files (`dash.css`, `newpost.css`, `users.css`).
- Central theme supports light/dark mode and RTL for Arabic.

### 3.7 Search/Filter & Media UI
- No embedded interactive map (no Leaflet/Mapbox/Google Maps component) — location selection is via **autocomplete search inputs** backed by the server's GeoNames/Google Places integration.
- Search/filter: `components/Filter/Filter.js` plus category/city/country dropdowns and a text search box, wired into RTK Query params (`categoryIds`, `cityId`, `search`, `fl`, `currentCountry`).
- `LazyImage`/`LazyCardMedia` components for performance on post-listing grids.
- Client-side Google Analytics page-view tracking on route change.

### 3.8 Client Environment Variables
- `REACT_APP_API_URL` (backend base URL)
- `REACT_APP_DOMAIN`
- `REACT_APP_CLOUDINARY_CLOUD_NAME`, `REACT_APP_CLOUDINARY_UPLOAD_PRESET`, `REACT_APP_CLOUDINARY_API_KEY` (secret intentionally kept server-side only — uploads go through the backend, not a direct unsigned Cloudinary widget)
- `REACT_APP_GA_MEASUREMENT_ID`

---

## 4. Core Domain Flow (End-to-End)

1. **Onboarding** — register via username/password, or Google OAuth. New Google sign-ups must additionally pick a **Country** to finish registration; country is a first-class scoping dimension across the whole app (almost every listing/browse query is filtered by `currentCountry`).
2. **Posting an item** — an authenticated user creates a **Post**: type `FOUND` or `LOST`, one or more **Categories**, a **City**/**Country**, free-text `exactLocation`, optional photo (compressed client-side → Multer → Cloudinary), description, and contact preferences (phone/email/WhatsApp toggles + the actual contact value).
3. **Browsing/discovery** — public, no login required. Filterable by country, found/lost type, category, city, free-text search. Posts auto-expire after 30 days and move through a status lifecycle (`active → resolved/expired/suspended`).
4. **Resolution** — a post can be marked resolved/returned by its owner; the frontend also has a "Claim Item" dialog, though actual claim verification happens off-platform (no in-app messaging).
5. **Promotion/"boost"** — a user can request their post be promoted (e.g. shared by admins on social media); this stores a flag on the post and **emails the admin** — a manual, human-mediated process, not automated/paid advertising.
6. **Moderation/reporting** — any post can be reported with a typed reason (spam, inappropriate, duplicate, wrong category, suspicious activity, exposed personal info, other); reports queue for admin review (reviewed/resolved/dismissed + notes).
7. **Password reset** — not a self-service email-link flow; users submit a request that an **admin manually reviews and processes**.
8. **Contact-us** — general public form with auto-priority detection from keywords (e.g. "urgent"/"emergency"), routed to an admin inbox.
9. **Maintenance mode** — admin-toggleable via a singleton settings document; blocks all non-admin traffic with a full-page notice (detected via API 503 responses and client polling).

---

## 5. Notable Architectural Characteristics

- **Heavy performance/resilience engineering** for constrained free-tier hosting (Railway + likely MongoDB Atlas free tier): layered/duplicated caching systems, memory-optimized controller variants, DB index-management scripts, cost-monitoring endpoints, and graceful degradation everywhere (Redis, Sharp, and Cloudinary all have fallback paths if unavailable).
- **Two independent Google OAuth implementations** (Passport-based for web, direct `google-auth-library` for mobile) sharing the same `User` model and pending-registration pattern — mobile OAuth support is implemented inside `server/`, not isolated to the `mobile/` folder, including a dedicated HTML deep-link bridge page.
- **Full multilingual support end-to-end** — not just UI strings, but data models themselves (`Category`, `Country`, `City`, `User`) store `{en, fr, ar}` label sub-documents, plus full RTL layout switching in the UI.
- **Security posture**: Helmet, per-route-type rate limiting (auth, registration, upload, search, report), input sanitization, strict upload validation (blocks disguised executables), JWT blacklisting on logout, structured logging to files. Undermined by a checked-in `server/env.production` containing live secrets — flagged above, should be rotated/removed before any external sharing of this repo.
- **No automated test suite** found in `server/` or `client/` beyond a stray root-level `test_oauth.js` — this looks like a manually tested, iteratively hardened codebase rather than a test-driven one.
- **No real-time layer** (no Socket.io), **no in-app messaging**, and **no payment gateway** — all "contact" between finders and owners happens off-platform via the phone/email/WhatsApp details attached to a post.
