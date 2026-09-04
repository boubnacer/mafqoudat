/**
 * Session issuance shared by every place that hands out credentials: password
 * login, registration, the three OAuth flows and /auth/refresh.
 *
 * A session is a short-lived JWT access token (middleware/jwtSecurity.js)
 * plus a long-lived opaque refresh token (services/tokenStore.js). Delivery
 * differs per platform:
 *   - Web gets the refresh token in an httpOnly cookie scoped to /auth (the
 *     only paths that ever need it: /auth/refresh and /auth/logout), so
 *     script can never read it. SameSite=None in production because the
 *     frontend (Vercel) and API (Render) are cross-site; Lax in dev where
 *     both live on localhost.
 *   - Mobile cannot use the cookie jar (native fetch/axios, and OAuth runs in
 *     a throwaway auth-session browser), so JSON responses also carry the
 *     refresh token in the body and the app keeps it in SecureStore.
 */

const { generateTokens } = require('../middleware/jwtSecurity');
const { createRefreshSession } = require('../services/tokenStore');

const REFRESH_COOKIE_NAME = 'refreshToken';

// jsonwebtoken-style expiry string to seconds; mirrors jwtSecurity's parser.
const parseExpiryToSeconds = (expiry, fallbackSeconds) => {
  if (!expiry) return fallbackSeconds;
  const unit = expiry.slice(-1);
  const value = parseInt(expiry.slice(0, -1), 10);
  if (Number.isNaN(value)) return fallbackSeconds;
  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 3600;
    case 'd': return value * 86400;
    default: return fallbackSeconds;
  }
};

const REFRESH_TOKEN_TTL_SECONDS = parseExpiryToSeconds(
  process.env.REFRESH_TOKEN_EXPIRES_IN,
  30 * 86400 // 30 days - the session length users had before short access tokens
);

const isProduction = process.env.NODE_ENV === 'production';

const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  path: '/auth',
  maxAge: REFRESH_TOKEN_TTL_SECONDS * 1000,
});

/**
 * Mint an access token + refresh session for a user.
 * userInfo: { username, id, country, role } - same contract as generateTokens.
 */
const issueSession = async (userInfo) => {
  const { accessToken } = generateTokens(userInfo);
  const refreshToken = await createRefreshSession(userInfo.id, REFRESH_TOKEN_TTL_SECONDS);
  return { accessToken, refreshToken };
};

const setRefreshCookie = (res, refreshToken) => {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
};

const clearRefreshCookie = (res) => {
  const { maxAge, ...options } = refreshCookieOptions();
  res.clearCookie(REFRESH_COOKIE_NAME, options);
};

/** Refresh token from wherever the client put it: cookie (web) or body (mobile). */
const readRefreshToken = (req) => {
  const fromCookie = req.cookies?.[REFRESH_COOKIE_NAME];
  if (typeof fromCookie === 'string' && fromCookie) return fromCookie;
  const fromBody = req.body?.refreshToken;
  if (typeof fromBody === 'string' && fromBody) return fromBody;
  return null;
};

module.exports = {
  REFRESH_COOKIE_NAME,
  REFRESH_TOKEN_TTL_SECONDS,
  issueSession,
  setRefreshCookie,
  clearRefreshCookie,
  readRefreshToken,
};
