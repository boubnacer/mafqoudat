/**
 * CSRF guard for the two cookie-authenticated endpoints: POST /auth/refresh
 * and POST /auth/logout.
 *
 * Those are the only routes that authenticate from the refresh cookie alone,
 * and in production that cookie is `SameSite=None` by necessity (the frontend
 * on Vercel and the API on Render are cross-site), so the browser attaches it
 * to a cross-site request regardless of which page made it. A third-party page
 * can therefore submit
 *
 *   <form method="POST" action="https://api.example/auth/logout">
 *
 * with the victim's cookie attached and no CORS preflight involved - a plain
 * form post is a "simple request", so the browser sends it first and only
 * withholds the *response*. That silently ends the victim's session (or
 * nuisance-rotates their refresh token) from any page they visit while signed
 * in.
 *
 * The fix is to require a header a simple request cannot carry. Setting
 * `X-Requested-With` from script turns the call into a preflighted request, and
 * the preflight is answered by config/corsOptions.js's origin allowlist - so an
 * attacker page can neither send it as a form nor get past the preflight with
 * fetch/XHR. Deliberately not a double-submit token scheme: that adds a token
 * to mint, store, rotate and verify for the same protection here, since the
 * attacker can never read a cross-origin response to steal the token anyway.
 *
 * Non-browser callers (the mobile app, curl, server-side jobs) are unaffected
 * - they set the header explicitly, and they were never subject to CSRF in the
 * first place since they carry no ambient cookie.
 */

const { logEvents } = require('./logger');

const CSRF_HEADER = 'x-requested-with';

// Accepted values. 'XMLHttpRequest' is the conventional one every HTTP client
// can set; 'mobile' is already used by the OAuth initiators in
// routes/googleAuthRoutes.js / routes/facebookAuthRoutes.js, so the app's
// existing convention keeps working.
const ACCEPTED_VALUES = new Set(['xmlhttprequest', 'mobile']);

const requireClientHeader = (req, res, next) => {
  const value = req.headers[CSRF_HEADER];

  if (typeof value === 'string' && ACCEPTED_VALUES.has(value.trim().toLowerCase())) {
    return next();
  }

  logEvents(
    `CSRF guard rejected request without ${CSRF_HEADER}\t${req.method}\t${req.url}\t${req.headers.origin || 'no-origin'}\t${req.ip}`,
    'errLog.log'
  );

  return res.status(403).json({
    message: 'Missing required client header',
    isError: true,
    code: 'CSRF_HEADER_REQUIRED',
    timestamp: new Date().toISOString(),
  });
};

module.exports = { requireClientHeader, CSRF_HEADER };
