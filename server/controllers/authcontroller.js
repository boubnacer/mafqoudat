const User = require("../models/User");
const bcrypt = require("bcrypt");
const Country = require("../models/Country");
const {
  blacklistToken,
  isTokenBlacklisted,
  parseExpiryToSeconds,
  verifyAccessToken,
  JWT_CONFIG,
} = require("../middleware/jwtSecurity");
const {
  issueSession,
  setRefreshCookie,
  clearRefreshCookie,
  readRefreshToken,
} = require("../utils/authSession");
const { consumeRefreshSession, revokeRefreshSession } = require("../services/tokenStore");
const { logEvents } = require("../middleware/logger");
const { createAuthError, asyncAuthHandler } = require("../middleware/simpleAuthErrorHandler");

// @desc Login
// @route POST /auth
// @access Public
const login = async (req, res) => {
  const { emailOrPhone, password } = req.body;

  if (!emailOrPhone || !password) {
    throw createAuthError('VALIDATION_ERROR', 'All fields are required', {
      emailOrPhone: !!emailOrPhone,
      password: !!password,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  }

  // Find user by email, phone, or username - optimized with selective fields for authentication
  const searchQuery = {
    $or: [
      { email: emailOrPhone.toLowerCase() },
      { phone: emailOrPhone },
      { username: emailOrPhone }
    ]
  };
  
  
  let foundUser;
  try {
    foundUser = await User.findOne(searchQuery)
      .collation({ locale: "en", strength: 2 })
      .select('_id username password country role email phone authProvider').exec();
  } catch (dbError) {
    console.error('Database error during login:', dbError);
    throw createAuthError('DATABASE_ERROR', 'Database connection error', {
      emailOrPhone,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      dbError: dbError.message
    });
  }

  if (!foundUser) {
    throw createAuthError('INVALID_CREDENTIALS', 'Invalid credentials', {
      emailOrPhone,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  }

  // Check if user is an OAuth user (Google or Facebook Sign-In)
  if (foundUser.authProvider === 'google' || foundUser.authProvider === 'facebook') {
    throw createAuthError('OAUTH_USER', "OAUTH_LOGIN_ATTEMPT", {
      username: foundUser.username,
      authProvider: foundUser.authProvider,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  }

  let match;
  try {
    match = await bcrypt.compare(password, foundUser.password);
  } catch (bcryptError) {
    console.error('Bcrypt error during login:', bcryptError);
    throw createAuthError('SERVER_ERROR', 'Password verification error', {
      username: foundUser.username,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      bcryptError: bcryptError.message
    });
  }

  if (!match) {
    throw createAuthError('INVALID_CREDENTIALS', 'Invalid credentials', {
      username: foundUser.username,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  }

  // Short-lived access token + refresh session (cookie for web, body for mobile)
  let accessToken;
  let refreshToken;
  try {
    const session = await issueSession({
      username: foundUser.username,
      id: foundUser.id,
      country: foundUser.country,
      role: foundUser.role
    });
    accessToken = session.accessToken;
    refreshToken = session.refreshToken;
  } catch (tokenError) {
    console.error('Token generation error during login:', tokenError);
    throw createAuthError('SERVER_ERROR', 'Token generation error', {
      username: foundUser.username,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      tokenError: tokenError.message
    });
  }

  // Log successful login
  logEvents(
    `Successful login: ${foundUser.username}\t${req.method}\t${req.url}\t${req.ip}`,
    "reqLog.log"
  );

  // Web reads the httpOnly cookie; mobile stores the body copy in SecureStore.
  setRefreshCookie(res, refreshToken);
  res.json({ accessToken, refreshToken });
};

// A refresh answered with 401 must never be mistaken for a permissions problem
// - same 401-vs-403 contract as middleware/jwtSecurity.js.
//
// `clearCookie` is opt-in, and deliberately NOT the default: cookies are shared
// per-origin across a browser's tabs, so clearing on every failure loses a
// perfectly good session. Two tabs booting at once both refresh with the same
// cookie; rotation (consumeRefreshSession) is atomic, so exactly one wins and
// the other is told REFRESH_INVALID. If the loser's Set-Cookie (a clear) lands
// after the winner's (the new token), it wipes a live session and forces a
// real re-login. So the cookie is only cleared when the session is genuinely
// gone no matter which tab asked - no token presented at all, or an account
// that is no longer active - never for "this particular token was already
// consumed", which is the expected outcome of losing a race.
const refreshUnauthorized = (res, message, code, { clearCookie = false } = {}) => {
  if (clearCookie) clearRefreshCookie(res);
  return res.status(401).json({
    message,
    isError: true,
    code,
    timestamp: new Date().toISOString(),
  });
};

// Legacy-session bootstrap: tokens minted before the refresh-token deploy are
// 30-day JWTs with no refresh session. A still-valid one of those may trade
// itself for a real session, so nobody mid-session is forced to re-login. The
// gate is the token's own issued lifetime (exp - iat): a post-deploy 30-minute
// token can never bootstrap, so a stolen short-lived token gains nothing here.
const LEGACY_BOOTSTRAP_MIN_LIFETIME_SECONDS =
  4 * parseExpiryToSeconds(JWT_CONFIG.accessTokenExpiry);

const readLegacyBootstrapUser = async (req) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;

  let decoded;
  try {
    decoded = await verifyAccessToken(authHeader.split(" ")[1]);
  } catch (error) {
    return null;
  }

  if (!decoded?.UserInfo?.usernameId || !decoded.jti) return null;
  if ((decoded.exp - decoded.iat) < LEGACY_BOOTSTRAP_MIN_LIFETIME_SECONDS) return null;
  if (await isTokenBlacklisted(decoded.jti)) return null;

  // jti/exp come back so the caller can denylist this token the moment it has
  // been traded in - see `refresh` below.
  return { userId: decoded.UserInfo.usernameId, jti: decoded.jti, exp: decoded.exp };
};

// @desc Exchange a refresh token (or a legacy long-lived access token) for a
//       fresh access token; rotates the refresh token on every use.
// @route POST /auth/refresh
// @access Public (authenticates via the refresh token itself)
const refresh = async (req, res) => {
  const providedRefreshToken = readRefreshToken(req);

  let userId = null;
  let legacyBootstrap = null;
  if (providedRefreshToken) {
    // consumeRefreshSession deletes the session atomically - a stolen-and-replayed
    // refresh token fails here once the legitimate client has rotated.
    const session = await consumeRefreshSession(providedRefreshToken);
    if (!session) {
      logEvents(
        `Refresh rejected - unknown or already-rotated token\t${req.method}\t${req.url}\t${req.ip}`,
        "errLog.log"
      );
      // No clearCookie: the browser may already be holding a newer, valid
      // cookie written by whichever tab won the rotation race.
      return refreshUnauthorized(res, "Refresh token is invalid or expired", "REFRESH_INVALID");
    }
    userId = session.userId;
  } else {
    legacyBootstrap = await readLegacyBootstrapUser(req);
    if (!legacyBootstrap) {
      return refreshUnauthorized(res, "No refresh token provided", "NO_REFRESH_TOKEN", {
        clearCookie: true,
      });
    }
    userId = legacyBootstrap.userId;
  }

  // Reload the user so the new access token carries their *current* role,
  // username and country - this is what makes an admin demotion effective
  // within one access-token lifetime instead of 30 days.
  const user = await User.findById(userId)
    .select("_id username country role isActive")
    .lean()
    .exec();

  if (!user || user.isActive === false) {
    // The account itself is gone or deactivated - no cookie any tab holds can
    // ever be good again, so clearing is correct here.
    return refreshUnauthorized(res, "Account is no longer active", "ACCOUNT_INACTIVE", {
      clearCookie: true,
    });
  }

  const { accessToken, refreshToken } = await issueSession({
    username: user.username,
    id: user._id,
    country: user.country,
    role: user.role,
  });

  // A legacy token is single-use here, exactly like a refresh token: it has
  // just been traded for a rotating session, so denylist its jti now. Without
  // this, one leaked pre-migration 30-day token could mint an unlimited number
  // of independent sessions for the rest of its lifetime, with nothing to
  // revoke and no way to notice - the one property refresh-token rotation
  // (consumeRefreshSession's atomic delete) exists to provide.
  if (legacyBootstrap) {
    await blacklistToken(
      legacyBootstrap.jti,
      legacyBootstrap.exp ? legacyBootstrap.exp * 1000 : null
    );
    logEvents(
      `Legacy token bootstrapped and revoked: ${legacyBootstrap.jti}\t${req.method}\t${req.url}\t${req.ip}`,
      "reqLog.log"
    );
  }

  setRefreshCookie(res, refreshToken);
  res.json({ accessToken, refreshToken });
};

// @desc Logout
// @route POST /auth/logout
// @access Public-ish: works even when the access token has already expired -
//         requiring verifyJWT here (as before) meant an expired session could
//         never revoke its refresh token server-side.
const logoutHandler = async (req, res) => {
  // Denylist the presented access token if it decodes at all (expired ones
  // don't need denylisting - `exp` already refuses them).
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const decoded = await verifyAccessToken(authHeader.split(" ")[1]);
      if (decoded?.jti) {
        await blacklistToken(decoded.jti, decoded.exp ? decoded.exp * 1000 : null);
      }
    } catch (error) {
      // Invalid/expired token - nothing to denylist.
    }
  }

  // Revoke the refresh session (cookie on web, body on mobile).
  const providedRefreshToken = readRefreshToken(req);
  if (providedRefreshToken) {
    await revokeRefreshSession(providedRefreshToken);
  }
  clearRefreshCookie(res);

  logEvents(
    `Successful logout\t${req.method}\t${req.url}\t${req.ip}`,
    "reqLog.log"
  );

  res.json({
    message: "Logged out successfully",
    isError: false,
  });
};

module.exports = {
  login,
  refresh,
  logout: logoutHandler,
};
