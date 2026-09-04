/**
 * Mobile OAuth deep-link bridge.
 *
 * The server's OAuth callbacks (googleAuthRoutes.js / facebookAuthRoutes.js) can't
 * redirect a browser straight to `mafqoudat://` reliably, so they land here instead
 * and this page performs the scheme navigation. The app opened this flow with
 * WebBrowser.openAuthSessionAsync(), which watches for a navigation to
 * `mafqoudat://auth/callback` and resolves as soon as it sees one - the OS never has
 * to hand the URL off to the app, and the auth browser closes itself.
 *
 * Loaded as an external file rather than an inline <script> because the site-wide CSP
 * (server/middleware/securityHeaders.js) sets script-src 'self' with no 'unsafe-inline'.
 */

var DEEP_LINK_BASE = 'mafqoudat://auth/callback';
// How long to wait before assuming the scheme navigation was refused and offering
// the manual link. Long enough that a working redirect is never seen by the user.
var FALLBACK_DELAY_MS = 2500;

function getParams() {
  try {
    var params = new URLSearchParams(window.location.search);
    return {
      code: params.get('code'),
      pendingToken: params.get('pendingToken'),
      error: params.get('error')
    };
  } catch (e) {
    return { code: null, pendingToken: null, error: null };
  }
}

function buildDeepLink(params) {
  if (params.code) {
    // A one-time opaque exchange code, never the tokens themselves: this URL
    // is a request the server logs verbatim (server/middleware/logger.js), and
    // it also lands in the auth browser's history. The app redeems the code at
    // POST /auth/mobile-exchange - see server/utils/oauthExchange.js.
    return DEEP_LINK_BASE + '?code=' + encodeURIComponent(params.code);
  }
  if (params.pendingToken) {
    return DEEP_LINK_BASE + '?pendingToken=' + encodeURIComponent(params.pendingToken);
  }
  // The app parses `error` too (see mobile/src/utils/*Auth.js), so a failed sign-in
  // can be handed back rather than leaving the user stranded in the auth browser.
  return DEEP_LINK_BASE + '?error=' + encodeURIComponent(params.error || 'oauth_failed');
}

function showError(message) {
  var loading = document.getElementById('loading');
  var errorEl = document.getElementById('error');
  if (loading) loading.classList.add('hidden');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }
}

function run() {
  var params = getParams();

  if (!params.code && !params.pendingToken && !params.error) {
    showError('Sign-in could not be completed. Please return to the app and try again.');
    return;
  }

  var deepLink = buildDeepLink(params);

  var fallbackLink = document.getElementById('fallbackLink');
  if (fallbackLink) fallbackLink.href = deepLink;

  // replace() rather than assigning href, so the auth browser doesn't keep this
  // page in its history behind the app handoff.
  window.location.replace(deepLink);

  // Still here a moment later means the browser declined the scheme navigation.
  setTimeout(function () {
    var fallback = document.getElementById('fallback');
    var loading = document.getElementById('loading');
    if (loading) loading.classList.add('hidden');
    if (fallback) fallback.style.display = 'block';
  }, FALLBACK_DELAY_MS);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', run);
} else {
  run();
}
