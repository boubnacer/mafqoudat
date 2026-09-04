const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const passport = require('../config/passport');
const User = require('../models/User');
const Country = require('../models/Country');
const { issueSession, setRefreshCookie } = require('../utils/authSession');
const { createExchangeCode } = require('../utils/oauthExchange');
const { logEvents } = require('../middleware/logger');

// Map to store pending OAuth registrations with timestamps
// Structure: { pendingToken: { userData, timestamp } }
const pendingRegistrations = new Map();

// Cleanup interval for expired pending tokens (5 minutes expiry)
const PENDING_TOKEN_EXPIRY = 5 * 60 * 1000; // 5 minutes in milliseconds

// Cleanup expired tokens every minute
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of pendingRegistrations.entries()) {
    if (now - data.timestamp > PENDING_TOKEN_EXPIRY) {
      pendingRegistrations.delete(token);
      logEvents(
        `Expired pending token cleaned up: ${token}`,
        'reqLog.log'
      );
    }
  }
}, 60 * 1000); // Run every minute

// @desc Initiate Facebook OAuth
// @route GET /auth/facebook
// @access Public
router.get('/facebook', (req, res, next) => {
  // Mirrors the Google flow: the app always passes ?mobile=true explicitly,
  // never sniffed from User-Agent (see googleAuthRoutes.js for why).
  const isMobile = req.query.mobile === 'true' ||
                   req.headers['x-requested-with'] === 'mobile';

  const state = {
    mobile: isMobile,
    redirectUri: req.query.redirect_uri
  };

  passport.authenticate('facebook', {
    session: false,
    scope: ['email', 'public_profile'],
    state: Buffer.from(JSON.stringify(state)).toString('base64')
  })(req, res, next);
});

// Facebook authorization codes are single-use. Mobile browsers that preload/
// prefetch links (observed with Samsung Internet) can fire a second, silent
// request at this callback URL before or alongside the real navigation —
// both requests then try to redeem the same code, and whichever loses the
// race gets "This authorization code has been used" from Facebook.
// inFlightCallbacks memoizes in-progress callback handling by `code` so a
// duplicate request reuses the first request's outcome instead of making its
// own (doomed) token exchange.
const inFlightCallbacks = new Map(); // code -> Promise<string redirectUrl>
const INFLIGHT_ENTRY_TTL = 15 * 1000; // keep entries around briefly to catch near-simultaneous duplicates

const authenticateFacebook = (req, res) => new Promise((resolve, reject) => {
  // Custom callback instead of the array-style passport.authenticate(...) —
  // that form hands any strategy error (e.g. a failed token exchange or
  // profile fetch inside passport-facebook itself) straight to Express's
  // generic error handler, which in production logs nothing and returns a
  // bare "Internal Server Error". This lets us log the real error unconditionally.
  passport.authenticate('facebook', { session: false }, (err, user) => {
    if (err) return reject(err);
    if (!user) return reject(new Error('NO_USER'));
    resolve(user);
  })(req, res, () => {});
});

// Runs the full callback flow once and resolves to the redirect URL the
// browser should end up at. Never rejects — all failure paths resolve to an
// error redirect URL, so duplicate requests sharing this promise all land
// on the same, consistent outcome.
const processFacebookCallback = async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3000';

  let user;
  try {
    user = await authenticateFacebook(req, res);
  } catch (err) {
    console.error('Facebook OAuth authenticate error:', err);
    logEvents(
      `Facebook OAuth authenticate error: ${err.message}\t${req.method}\t${req.url}\t${req.ip}`,
      'errLog.log'
    );
    return `${frontendUrl}/login?error=oauth_failed`;
  }

  try {
    // Parse state to get mobile flag and redirect_uri
    let isMobile = false;

    try {
      if (req.query.state) {
        const stateData = JSON.parse(Buffer.from(req.query.state, 'base64').toString());
        isMobile = stateData.mobile || false;
      }
    } catch (e) {
      // Fallback to old detection methods, same rationale as googleAuthRoutes.js
      isMobile = req.query.state === 'mobile' ||
                 req.query.mobile === 'true' ||
                 req.headers['user-agent']?.includes('Expo') ||
                 req.headers['user-agent']?.includes('ReactNative');
    }

    // Check if this is a pending user (new registration)
    if (user && user.isPending) {
      const pendingToken = crypto.randomBytes(32).toString('hex');

      pendingRegistrations.set(pendingToken, {
        userData: user,
        timestamp: Date.now()
      });

      logEvents(
        `Pending Facebook OAuth registration: ${user.email || user.facebookId}\t${req.method}\t${req.url}\t${req.ip}`,
        'reqLog.log'
      );

      if (isMobile) {
        const protocol = req.protocol || 'https';
        const host = req.get('host') || 'localhost:3500';
        const serverUrl = `${protocol}://${host}`;
        // No provider param here, unlike the web redirect below: the app already
        // knows which provider it started (AuthContext sets pendingProvider when
        // signInWithFacebook runs), and the deep link never forwarded it anyway.
        return `${serverUrl}/auth/mobile-callback?pendingToken=${encodeURIComponent(pendingToken)}`;
      }
      // Distinct pendingToken namespace from Google's, so /auth/select-country
      // needs to know which provider's /complete endpoint to call.
      return `${frontendUrl}/auth/select-country?pendingToken=${pendingToken}&provider=facebook`;
    }

    // Existing user - generate session and redirect
    if (user && user._id) {
      try {
        const tokens = await issueSession({
          username: user.username,
          id: user._id,
          country: user.country,
          role: user.role
        });

        logEvents(
          `Successful Facebook OAuth login: ${user.username}\t${req.method}\t${req.url}\t${req.ip}`,
          'reqLog.log'
        );

        if (isMobile) {
          const protocol = req.protocol || 'https';
          const host = req.get('host') || 'localhost:3500';
          const serverUrl = `${protocol}://${host}`;
          // Deep link carries only a one-time opaque exchange code - never the
          // tokens, which middleware/logger.js would write to reqLog.log along
          // with the rest of the query string (see googleAuthRoutes.js and
          // utils/oauthExchange.js). The app redeems it at
          // POST /auth/mobile-exchange.
          return `${serverUrl}/auth/mobile-callback?code=${encodeURIComponent(createExchangeCode(tokens))}`;
        }
        // Web: refresh token as an httpOnly cookie only, never in the URL.
        // Returned as an object so the route sets the cookie on its own
        // response - with the in-flight dedupe below, the response that runs
        // this flow and the response the real browser ends up on can be
        // different requests, and both must get the cookie. The access token
        // is likewise kept out of the URL - only a one-time opaque code
        // travels, same as the mobile browser flow (utils/oauthExchange.js);
        // the client trades it at POST /auth/mobile-exchange.
        return {
          redirectUrl: `${frontendUrl}/auth/callback?code=${encodeURIComponent(createExchangeCode(tokens))}`,
          webRefreshToken: tokens.refreshToken,
        };
      } catch (tokenError) {
        console.error('Token generation error during Facebook OAuth:', tokenError);
        logEvents(
          `Token generation error for Facebook OAuth: ${user.username}\t${tokenError.message}`,
          'errLog.log'
        );
        return `${frontendUrl}/login?error=token_generation_failed`;
      }
    }

    logEvents(
      `Facebook OAuth unexpected state\t${req.method}\t${req.url}\t${req.ip}`,
      'errLog.log'
    );
    return `${frontendUrl}/login?error=unexpected_state`;
  } catch (error) {
    console.error('Facebook OAuth callback error:', error);
    logEvents(
      `Facebook OAuth callback error\t${error.message}\t${req.method}\t${req.url}\t${req.ip}`,
      'errLog.log'
    );
    return `${frontendUrl}/login?error=oauth_error`;
  }
};

// @desc Facebook OAuth callback
// @route GET /auth/facebook/callback
// @access Public
router.get('/facebook/callback', async (req, res) => {
  const code = req.query.code;

  if (!code) {
    const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/login?error=oauth_failed`);
  }

  let resultPromise = inFlightCallbacks.get(code);
  if (!resultPromise) {
    resultPromise = processFacebookCallback(req, res);
    inFlightCallbacks.set(code, resultPromise);
    resultPromise.finally(() => {
      setTimeout(() => inFlightCallbacks.delete(code), INFLIGHT_ENTRY_TTL);
    });
  }

  const result = await resultPromise;
  // String result: error/pending/mobile paths. Object: web login carrying the
  // refresh cookie (set per-response - see processFacebookCallback).
  if (typeof result === 'string') {
    return res.redirect(result);
  }
  setRefreshCookie(res, result.webRefreshToken);
  return res.redirect(result.redirectUrl);
});

// @desc Complete Facebook OAuth registration
// @route POST /auth/facebook/complete
// @access Public
router.post('/facebook/complete', async (req, res) => {
  try {
    const { pendingToken, countryId } = req.body;

    if (!pendingToken || !countryId) {
      logEvents(
        `Facebook OAuth completion - Missing fields\t${req.method}\t${req.url}\t${req.ip}`,
        'errLog.log'
      );
      return res.status(400).json({
        message: 'Pending token and country are required',
        isError: true,
        code: 'VALIDATION_ERROR'
      });
    }

    const pendingData = pendingRegistrations.get(pendingToken);
    if (!pendingData) {
      logEvents(
        `Facebook OAuth completion - Invalid or expired token\t${req.method}\t${req.url}\t${req.ip}`,
        'errLog.log'
      );
      return res.status(400).json({
        message: 'Invalid or expired pending token',
        isError: true,
        code: 'INVALID_TOKEN'
      });
    }

    const now = Date.now();
    if (now - pendingData.timestamp > PENDING_TOKEN_EXPIRY) {
      pendingRegistrations.delete(pendingToken);
      logEvents(
        `Facebook OAuth completion - Expired token\t${req.method}\t${req.url}\t${req.ip}`,
        'errLog.log'
      );
      return res.status(400).json({
        message: 'Pending token has expired',
        isError: true,
        code: 'TOKEN_EXPIRED'
      });
    }

    const country = await Country.findById(countryId);
    if (!country) {
      logEvents(
        `Facebook OAuth completion - Invalid country: ${countryId}\t${req.method}\t${req.url}\t${req.ip}`,
        'errLog.log'
      );
      return res.status(400).json({
        message: 'Invalid country selected',
        isError: true,
        code: 'INVALID_COUNTRY'
      });
    }

    const { userData } = pendingData;

    // Facebook may not return an email (user declined the permission or has
    // none on file) — fall back to a facebookId-based username in that case.
    let baseUsername = userData.email
      ? userData.email.split('@')[0]
      : `fb${userData.facebookId}`;
    baseUsername = baseUsername.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    if (baseUsername.length < 3) {
      baseUsername = `user${baseUsername}`;
    }
    if (baseUsername.length > 50) {
      baseUsername = baseUsername.substring(0, 50);
    }

    let username = baseUsername;
    let counter = 1;

    while (await User.findOne({ username })) {
      username = `${baseUsername}${counter}`;
      counter++;
      if (username.length > 50) {
        username = `${baseUsername.substring(0, 45)}${counter}`;
      }
    }

    const existingUser = await User.findOne({
      $or: [
        ...(userData.email ? [{ email: userData.email }] : []),
        { facebookId: userData.facebookId }
      ]
    });

    if (existingUser) {
      pendingRegistrations.delete(pendingToken);

      logEvents(
        `Facebook OAuth completion - User already exists: ${userData.email || userData.facebookId}\t${req.method}\t${req.url}\t${req.ip}`,
        'errLog.log'
      );
      return res.status(400).json({
        message: 'User already exists with this email or Facebook account',
        isError: true,
        code: 'USER_EXISTS'
      });
    }

    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0].trim() ||
                      req.headers['x-real-ip'] ||
                      req.connection?.remoteAddress ||
                      req.socket?.remoteAddress ||
                      req.ip ||
                      'unknown';

    const newUser = await User.create({
      username,
      email: userData.email || undefined,
      facebookId: userData.facebookId,
      authProvider: 'facebook',
      country: countryId,
      profile: {
        firstName: userData.profile.firstName,
        lastName: userData.profile.lastName,
        avatar: userData.profile.avatar,
        firstNameLabels: userData.profile.firstNameLabels,
        lastNameLabels: userData.profile.lastNameLabels
      },
      ipAddress,
      lastLogin: new Date(),
      isActive: true,
      role: 'user'
    });

    pendingRegistrations.delete(pendingToken);

    // Serves both web CountrySelection and the mobile completion flow, so
    // cookie AND body carry the refresh token.
    const tokens = await issueSession({
      username: newUser.username,
      id: newUser._id,
      country: newUser.country,
      role: newUser.role
    });

    logEvents(
      `Successful Facebook OAuth registration: ${newUser.username} (${newUser.email || newUser.facebookId})\t${req.method}\t${req.url}\t${req.ip}`,
      'reqLog.log'
    );

    setRefreshCookie(res, tokens.refreshToken);
    res.status(201).json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      message: 'User registered successfully',
      username: newUser.username
    });
  } catch (error) {
    console.error('Facebook OAuth completion error:', error);
    logEvents(
      `Facebook OAuth completion error\t${error.message}\t${req.method}\t${req.url}\t${req.ip}`,
      'errLog.log'
    );

    if (error.code === 11000) {
      return res.status(400).json({
        message: 'User with this information already exists',
        isError: true,
        code: 'DUPLICATE_USER'
      });
    }

    res.status(500).json({
      message: 'Failed to complete registration',
      isError: true,
      code: 'SERVER_ERROR'
    });
  }
});

module.exports = router;
