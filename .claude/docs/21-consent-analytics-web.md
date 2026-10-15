## Consent + analytics (web)

Google's Funding Choices ("Privacy & messaging" in AdSense) is the site's
consent management platform, and the only consent UI on it. Required before
AdSense will serve ads to EEA/UK visitors, which the Moroccan/Arab-world
diaspora traffic makes a real share of.

- **Nothing Google-owned loads before an answer.** `public/index.html` used to
  carry the gtag.js snippet, unconditionally, so the GA cookie was written on
  first byte for every visitor. The document now carries only Consent Mode v2
  defaults (`ad_storage`/`ad_user_data`/`ad_personalization`/`analytics_storage`
  all `denied`, `wait_for_update: 2000`, `ads_data_redaction` on) and the
  Funding Choices loader. gtag.js is requested from
  [analytics.js](client/src/utils/analytics.js), after
  [consent.js](client/src/utils/consent.js) reports analytics consent, and never
  otherwise. The defaults stay inline in the head rather than moving into the
  bundle: any Google tag reads the dataLayer as it loads, so the standing answer
  has to already be in it.
- **No signal is not consent.** A build with no publisher ID, a CMP request an
  extension blocked, a `__tcfapi` that never appears within 8s — all resolve to
  denied, and GA stays off. The consequence is worth stating plainly: deploying
  without `REACT_APP_FC_PUBLISHER_ID` set turns analytics off, rather than
  leaving it running unasked. `scripts/postbuild.js` says so at build time.
- **Publisher ID is injected, like the GA one.** `REACT_APP_FC_PUBLISHER_ID`
  (the AdSense publisher ID, `ca-` prefix optional) replaces
  `FC_PUBLISHER_ID_PLACEHOLDER` in `injectFundingChoices`, beside the existing
  `injectGoogleAnalytics`. Both run before `prerenderSeo`, which copies
  `build/index.html` as the shell for every route it writes — an injection that
  ran after it would reach the home page only. The loader in the HTML checks its
  own placeholder and requests nothing while it is unreplaced.
- **Consent is read from TCF, and republished as Consent Mode v2 signals.**
  `consent.js` attaches a `__tcfapi('addEventListener', 2, …)` and maps the TC
  string: `analytics_storage` from purpose 1 alone (a first-party measurement
  cookie is what it needs permission for), the three ad signals additionally
  requiring Google's GVL vendor id 755, and purposes 7 / 3+4 for
  `ad_user_data` / `ad_personalization`. Where the mapping is ambiguous it
  requires more rather than less. `gdprApplies: false` — the CMP saying it will
  never show this visitor a message — grants; `cmpuishown` (asked, unanswered)
  leaves the denied default standing. A later `useractioncomplete` moves signals
  in both directions, so a withdrawal is honoured without a reload.
- **`CookieNotice.jsx` explains cookies and does not ask about them.** It never
  did — it is a policy page, not a banner — so the CMP replaces nothing there.
  What it gained is the way back in: a "Manage cookie preferences" panel calling
  `openConsentManager()` (`googlefc.showRevocationMessage()` via the callback
  queue), rendered only when a publisher ID is configured. Withdrawing has to
  stay as easy as consenting, and the CMP is unreachable once answered.
- **Dark mode is corrected, not restyled.** The message is Google's markup in
  our document, its palette configured in AdSense, and one palette has to sit on
  both themes.
  [consentMessage.css](client/src/styles/consentMessage.css) overrides surface,
  text and border color only, under `:root[data-color-scheme="dark"]`, from CSS
  custom properties [documentTheme.js](client/src/utils/documentTheme.js)
  publishes off `resolveDesignTokens` — nothing moves, hides, resizes or
  reorders any part of it, which TCF policy does not allow. Light mode is left
  entirely alone. `data-color-scheme` is set inline in `index.html` from the same
  `globalState.mode` localStorage key the Redux slice persists, because the
  message can be drawn before React mounts; `App.js` keeps it in sync after. No
  directional properties are touched, so RTL stays Google's business.
- **The Facebook Pixel in `index.html` is still ungated.** It fires on page load
  the way GA used to. Out of scope for the pass that added the CMP, but it is
  the remaining hole in "no tracking before consent" — the mechanism to close it
  is the same `onConsentChange` subscription.
