# Play Console — Data Safety form

Worksheet for the Data Safety section of the Play Console listing, derived
from what the Android app (`mobile/`) and the backend it talks to actually
do — not a generic template. Re-derive this if a data-collecting feature is
added or removed; it will drift otherwise, the same way the privacy policy's
location bullet drifted from the code (see the commit that added this file).

## ipwho.is — does it need naming in the privacy policy?

No. Checked: neither `PrivacyPolicy.jsx`/`TermsOfUse.jsx` nor their
`translations.js` strings name any vendor anywhere, including ones far more
central to the product (Google Sign-In, Facebook Login, the Facebook/
Instagram auto-posting, Expo's push service). The house style is generic
categories ("with trusted service providers"), not a named third-party list.
Singling out `ipwho.is` would be inconsistent with that and isn't required —
the `serviceProviders` bullet already covers it. The location *bullet itself*
needed fixing because it made a specific, wrong factual claim (implying GPS);
that's now corrected. Naming the vendor is a nice-to-have, not a gap.

## Data types to declare

Each row is what the **Play Console form** calls that category. "Shared"
means sent to a party other than Mafqoudat's own backend.

| Data type | Collected | Shared | Purpose | Optional | Notes |
| --- | --- | --- | --- | --- | --- |
| Name | Yes | No | Account functionality | No | Set at signup |
| Email address | Yes | No | Account functionality, communications | No | Login identity; also via Google/Facebook OAuth |
| Phone number | Yes | No | App functionality | Yes | Only if entered as a post's contact field — not required for the account itself |
| Photos | Yes | Yes (see note) | App functionality | Yes (per post) | Post images; **also auto-published to the Mafqoudat Facebook Page/Instagram account on creation** — declare as shared with those platforms |
| Approximate location | Yes | Yes | App functionality | N/A (automatic, not user-entered) | IP → country lookup via `ipwho.is` on first launch, to pre-select onboarding country. Not GPS/precise location. Not persisted server-side. Shared = the device's IP goes directly to ipwho.is, not through your backend |
| App activity (in-app actions, search history) | Yes | No | App functionality, analytics | N/A | Posts created, comments, searches |
| App info and performance (crash logs, diagnostics) | No | — | — | — | No crash-reporting or performance SDK in `mobile/` (no Sentry/Crashlytics/Bugsnag found) |
| Device or other IDs | Yes | Yes | App functionality | No (if push enabled) | Expo push token, stored on `User.pushTokens`; Expo's push service (and FCM behind it) sees the token |
| User-generated content (comments) | Yes | No | App functionality | Yes | Site comments; separately, social comments are *read from* Facebook/Instagram, not collected from your users |

Categories deliberately **not** declared (checked, not assumed):

- **Financial info** — no payment SDK anywhere in `mobile/` or `server/`. The
  admin "promotions" feature (`server/routes/adminRoutes.js`) is
  request/approval based with no in-app payment collection found. If that
  changes (a card form gets added), this needs revisiting.
- **Health and fitness** — not applicable to this app.
- **Messages** — there is no user-to-user messaging feature. Comments are
  public, attached to a post, not private messages — they're "User-generated
  content," not "Messages," in Play's taxonomy.
- **Web browsing history** — not collected by the app itself.

## Data collection & security practices tab

- **Is all user data encrypted in transit?** Yes — API is HTTPS-only.
- **Do you provide a way for users to request data deletion?** Yes —
  in-app (`DeleteAccountScreen.js`) and web
  (`https://www.mafqoudat.com/delete-account`). Fill this URL into the
  "Account deletion" field in Play Console's App content section (separate
  from the Data Safety form itself, but same underlying fact).
- **Independent security review?** Only answer yes if one has actually been
  commissioned — no evidence of that in this repo, so default to No.

## One thing worth a deliberate decision, not an assumption

`postViewTracker.js` keys anonymous (non-logged-in) view dedupe on
`` `ip:${req.ip}` `` — the visitor's IP is used as a short-lived dedupe key
for view counting, server-side, never returned to the client or exposed to
a third party. This is arguably a second "Device or other IDs" / "App
activity" touchpoint distinct from the ipwho.is lookup above (it's IP used
as an identifier, not resolved to a location). Play's form doesn't have a
clean bucket for "used momentarily server-side, not stored long-term, not a
location lookup" — decide whether to fold it into the existing "App
activity" declaration (it's arguably covered already) or add a separate
"Device or other IDs" line for it. Recommendation: fold it in — it's not a
new user-facing data type, just an implementation detail of one that's
already declared.
