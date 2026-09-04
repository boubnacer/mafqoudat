/**
 * One-time exchange codes for the OAuth browser flows (mobile and web).
 *
 * The browser flows (routes/googleAuthRoutes.js, routes/facebookAuthRoutes.js)
 * used to hand tokens back by putting them straight in the redirect URL:
 *
 *   mobile: /auth/mobile-callback?token=<access>&refreshToken=<refresh>
 *   web:    /auth/callback?token=<access>
 *
 * middleware/logger.js writes `req.url` - the full query string, unredacted -
 * to reqLog.log for every request, so the app's own GET of the mobile
 * callback URL wrote a live 30-day refresh credential to disk in plaintext on
 * every mobile OAuth sign-in. Query strings also survive in browser history
 * and in any proxy or CDN log on the path - the web redirect's exposure was
 * already lower (access-token only, and short-lived since the refresh-token
 * rework) but the same fix closes it for consistency.
 *
 * So the tokens never enter a URL. They are parked here under a short opaque
 * code, and only the code travels through the redirect (and, on mobile, the
 * deep link); the client trades it for the real tokens over
 * POST /auth/mobile-exchange - one endpoint, reused by both platforms, since
 * a code from either mints the same shape of entry. The code is single-use
 * (deleted on read) and expires in 5 minutes, exactly like the
 * `pendingRegistrations` handoff the OAuth routes already use for new-user
 * registrations - same pattern, same lifetime.
 *
 * In-memory on purpose, matching pendingRegistrations: the code is redeemed
 * seconds after it is issued, by the same process that just served the
 * redirect (sticky by nature - the client follows the redirect chain it was
 * given). A multi-instance deployment would want this in Redis; so would
 * pendingRegistrations, and that is a separate change.
 */

const crypto = require('crypto');

const EXCHANGE_CODE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

// code -> { accessToken, refreshToken, timestamp }
const pendingExchanges = new Map();

const sweep = () => {
  const now = Date.now();
  for (const [code, entry] of pendingExchanges.entries()) {
    if (now - entry.timestamp > EXCHANGE_CODE_EXPIRY_MS) {
      pendingExchanges.delete(code);
    }
  }
};

// unref() so this never holds the process open.
const sweepInterval = setInterval(sweep, 60 * 1000);
if (typeof sweepInterval.unref === 'function') sweepInterval.unref();

/**
 * Park a freshly issued session under a one-time code.
 * Returns the opaque code to put in the redirect URL.
 */
const createExchangeCode = ({ accessToken, refreshToken }) => {
  const code = crypto.randomBytes(32).toString('hex');
  pendingExchanges.set(code, {
    accessToken,
    refreshToken,
    timestamp: Date.now(),
  });
  return code;
};

/**
 * Redeem a code. Single-use: the entry is deleted whether or not it had
 * expired, so a replayed code can never work twice.
 * Returns { accessToken, refreshToken } or null.
 */
const consumeExchangeCode = (code) => {
  if (!code || typeof code !== 'string') return null;

  const entry = pendingExchanges.get(code);
  if (!entry) return null;
  pendingExchanges.delete(code);

  if (Date.now() - entry.timestamp > EXCHANGE_CODE_EXPIRY_MS) return null;

  return { accessToken: entry.accessToken, refreshToken: entry.refreshToken };
};

module.exports = {
  EXCHANGE_CODE_EXPIRY_MS,
  createExchangeCode,
  consumeExchangeCode,
};
