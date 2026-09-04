const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
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

// @desc Initiate Google OAuth
// @route GET /auth/google
// @access Public
router.get('/google', (req, res, next) => {
  // Check if this is a request from the native mobile app. The app always
  // passes ?mobile=true explicitly (see mobile/src/utils/googleAuth.js) — we
  // must NOT sniff the User-Agent for "Mobile", since that substring is present
  // on every phone's browser too and would misroute the website's mobile-web
  // login (real UA, no ?mobile=true) into the native app's deep-link callback.
  const isMobile = req.query.mobile === 'true' ||
                   req.headers['x-requested-with'] === 'mobile';

  // Store mobile flag and redirect_uri in session/state for callback
  req.session = req.session || {};
  req.session.isMobile = isMobile;
  req.session.redirectUri = req.query.redirect_uri;
  
  // Create state with mobile flag and redirect_uri
  const state = {
    mobile: isMobile,
    redirectUri: req.query.redirect_uri
  };
  
  passport.authenticate('google', { 
    session: false,
    scope: ['profile', 'email'],
    state: Buffer.from(JSON.stringify(state)).toString('base64')
  })(req, res, next);
});

// @desc Google OAuth callback
// @route GET /auth/google/callback
// @access Public
router.get('/google/callback',
  passport.authenticate('google', { 
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=oauth_failed`
  }),
  async (req, res) => {
    try {
      const user = req.user;
      const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3000';
      
      // Parse state to get mobile flag and redirect_uri
      let isMobile = false;
      let redirectUri = null;
      
      console.log('🔍 Google OAuth callback analysis:');
      console.log('   Query params:', req.query);
      console.log('   User-Agent:', req.headers['user-agent']);
      console.log('   State:', req.query.state);
      
      try {
        if (req.query.state) {
          const stateData = JSON.parse(Buffer.from(req.query.state, 'base64').toString());
          isMobile = stateData.mobile || false;
          redirectUri = stateData.redirectUri;
          console.log('   Parsed state:', { isMobile, redirectUri });
        }
      } catch (e) {
        console.log('   State parsing failed:', e.message);
        // Fallback to old detection methods. Deliberately excludes a generic
        // "Mobile" UA substring check — that matches every phone's browser,
        // not just the native app, and would misroute mobile-web logins into
        // the native app's deep-link callback (see the /google handler above).
        isMobile = req.query.state === 'mobile' ||
                   req.query.mobile === 'true' ||
                   req.headers['user-agent']?.includes('Expo') ||
                   req.headers['user-agent']?.includes('ReactNative');
        console.log('   Fallback detection - isMobile:', isMobile);
      }
      
      console.log('   Final mobile detection result:', isMobile);
      

      // Check if this is a pending user (new registration)
      if (user && user.isPending) {
        // Generate a secure pending token
        const pendingToken = crypto.randomBytes(32).toString('hex');
        
        // Store user data temporarily
        pendingRegistrations.set(pendingToken, {
          userData: user,
          timestamp: Date.now()
        });

        // Log pending registration
        logEvents(
          `Pending Google OAuth registration: ${user.email}\t${req.method}\t${req.url}\t${req.ip}`,
          'reqLog.log'
        );

        // Redirect based on platform
        if (isMobile) {
          // For mobile, redirect to HTML page that will trigger deep link
          // Browser can't handle deep links directly, so we use an HTML page
          const protocol = req.protocol || 'https';
          const host = req.get('host') || 'localhost:3500';
          const serverUrl = `${protocol}://${host}`;
          const mobileRedirectUrl = `${serverUrl}/auth/mobile-callback?pendingToken=${encodeURIComponent(pendingToken)}`;
          return res.redirect(mobileRedirectUrl);
        } else {
          // Redirect to frontend to select country
          const webUrl = `${frontendUrl}/auth/select-country?pendingToken=${pendingToken}&provider=google`;
          return res.redirect(webUrl);
        }
      }

      // Existing user - generate JWT and redirect
      if (user && user._id) {
        try {
          const tokens = await issueSession({
            username: user.username,
            id: user._id,
            country: user.country,
            role: user.role
          });

          // Log successful login
          logEvents(
            `Successful Google OAuth login: ${user.username}\t${req.method}\t${req.url}\t${req.ip}`,
            'reqLog.log'
          );

          // Redirect based on platform
          if (isMobile) {
            // For mobile, redirect to HTML page that will trigger deep link -
            // browsers can't handle deep links directly. Only a one-time
            // opaque code travels in the URL: a cookie set here would never
            // reach the app (the auth-session browser's jar is not the app's),
            // and the tokens themselves must not be in a query string, which
            // middleware/logger.js writes to disk verbatim on every request.
            // The app trades the code at POST /auth/mobile-exchange.
            const protocol = req.protocol || 'https';
            const host = req.get('host') || 'localhost:3500';
            const serverUrl = `${protocol}://${host}`;
            const exchangeCode = createExchangeCode(tokens);
            const mobileRedirectUrl = `${serverUrl}/auth/mobile-callback?code=${encodeURIComponent(exchangeCode)}`;
            return res.redirect(mobileRedirectUrl);
          } else {
            // Web: the refresh token travels only as an httpOnly cookie set on
            // this redirect (same API origin the client later refreshes
            // against) - never in the URL, which lands in browser history.
            setRefreshCookie(res, tokens.refreshToken);
            const webUrl = `${frontendUrl}/auth/callback?token=${tokens.accessToken}`;
            return res.redirect(webUrl);
          }
        } catch (tokenError) {
          console.error('Token generation error during Google OAuth:', tokenError);
          logEvents(
            `Token generation error for Google OAuth: ${user.username}\t${tokenError.message}`,
            'errLog.log'
          );
          return res.redirect(
            `${frontendUrl}/login?error=token_generation_failed`
          );
        }
      }

      // Unexpected state - redirect to login with error
      logEvents(
        `Google OAuth unexpected state\t${req.method}\t${req.url}\t${req.ip}`,
        'errLog.log'
      );
      return res.redirect(
        `${frontendUrl}/login?error=unexpected_state`
      );
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      logEvents(
        `Google OAuth callback error\t${error.message}\t${req.method}\t${req.url}\t${req.ip}`,
        'errLog.log'
      );
      return res.redirect(
        `${frontendUrl}/login?error=oauth_error`
      );
    }
  }
);

// @desc Complete Google OAuth registration
// @route POST /auth/google/complete
// @access Public
router.post('/complete', async (req, res) => {
  try {
    const { pendingToken, countryId } = req.body;

    // Validate required fields
    if (!pendingToken || !countryId) {
      logEvents(
        `Google OAuth completion - Missing fields\t${req.method}\t${req.url}\t${req.ip}`,
        'errLog.log'
      );
      return res.status(400).json({ 
        message: 'Pending token and country are required',
        isError: true,
        code: 'VALIDATION_ERROR'
      });
    }

    // Check if pending token exists
    const pendingData = pendingRegistrations.get(pendingToken);
    if (!pendingData) {
      logEvents(
        `Google OAuth completion - Invalid or expired token\t${req.method}\t${req.url}\t${req.ip}`,
        'errLog.log'
      );
      return res.status(400).json({ 
        message: 'Invalid or expired pending token',
        isError: true,
        code: 'INVALID_TOKEN'
      });
    }

    // Check if token has expired (5 minutes)
    const now = Date.now();
    if (now - pendingData.timestamp > PENDING_TOKEN_EXPIRY) {
      pendingRegistrations.delete(pendingToken);
      logEvents(
        `Google OAuth completion - Expired token\t${req.method}\t${req.url}\t${req.ip}`,
        'errLog.log'
      );
      return res.status(400).json({ 
        message: 'Pending token has expired',
        isError: true,
        code: 'TOKEN_EXPIRED'
      });
    }

    // Verify country exists
    const country = await Country.findById(countryId);
    if (!country) {
      logEvents(
        `Google OAuth completion - Invalid country: ${countryId}\t${req.method}\t${req.url}\t${req.ip}`,
        'errLog.log'
      );
      return res.status(400).json({ 
        message: 'Invalid country selected',
        isError: true,
        code: 'INVALID_COUNTRY'
      });
    }

    const { userData } = pendingData;

    // Generate unique username from email
    let baseUsername = userData.email.split('@')[0];
    // Sanitize username - remove special characters and ensure valid format
    baseUsername = baseUsername.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    // Ensure minimum length
    if (baseUsername.length < 3) {
      baseUsername = `user${baseUsername}`;
    }
    // Limit to 50 characters
    if (baseUsername.length > 50) {
      baseUsername = baseUsername.substring(0, 50);
    }

    let username = baseUsername;
    let counter = 1;

    // Check for username duplicates and append counter if needed
    while (await User.findOne({ username })) {
      username = `${baseUsername}${counter}`;
      counter++;
      // Ensure we don't exceed maxlength
      if (username.length > 50) {
        username = `${baseUsername.substring(0, 45)}${counter}`;
      }
    }

    // Check if user with this email or googleId already exists
    const existingUser = await User.findOne({
      $or: [
        { email: userData.email },
        { googleId: userData.googleId }
      ]
    });

    if (existingUser) {
      // Clean up pending token
      pendingRegistrations.delete(pendingToken);
      
      logEvents(
        `Google OAuth completion - User already exists: ${userData.email}\t${req.method}\t${req.url}\t${req.ip}`,
        'errLog.log'
      );
      return res.status(400).json({ 
        message: 'User already exists with this email or Google account',
        isError: true,
        code: 'USER_EXISTS'
      });
    }

    // Capture user's IP address
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0].trim() || 
                      req.headers['x-real-ip'] || 
                      req.connection?.remoteAddress || 
                      req.socket?.remoteAddress || 
                      req.ip || 
                      'unknown';

    // Create new user
    const newUser = await User.create({
      username,
      email: userData.email,
      googleId: userData.googleId,
      authProvider: 'google',
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

    // Clean up pending token
    pendingRegistrations.delete(pendingToken);

    // Generate session (this endpoint serves both web CountrySelection and the
    // mobile browser-flow completion, so cookie AND body carry the refresh token)
    const tokens = await issueSession({
      username: newUser.username,
      id: newUser._id,
      country: newUser.country,
      role: newUser.role
    });

    // Log successful registration
    logEvents(
      `Successful Google OAuth registration: ${newUser.username} (${newUser.email})\t${req.method}\t${req.url}\t${req.ip}`,
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
    console.error('Google OAuth completion error:', error);
    logEvents(
      `Google OAuth completion error\t${error.message}\t${req.method}\t${req.url}\t${req.ip}`,
      'errLog.log'
    );
    
    // Handle duplicate key errors
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

// @desc Mobile OAuth callback page (serves HTML that redirects to deep link)
// @route GET /auth/mobile-callback
// @access Public
router.get('/mobile-callback', (req, res) => {
  try {
    // Served as-is: /js/mobile-callback.js (server/public/js/) reads token/
    // pendingToken/error straight from window.location.search client-side, so
    // no server-side templating/injection into the HTML is needed. There used
    // to be one (an inline <script> injecting window.serverToken etc. before
    // </head>) but the site-wide CSP (server/middleware/securityHeaders.js,
    // script-src 'self' with no 'unsafe-inline') silently blocks inline
    // scripts - that injected block, and the page's own inline script that
    // read it, never actually ran. Moving the logic to this same-origin file
    // fixed both at once, and made the injection moot as well as broken.
    //
    // Deliberately does not log the query string: it carries the access token.
    const htmlPath = path.join(__dirname, '../views/mobile-callback.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Content-Type': 'text/html; charset=utf-8'
    });

    res.send(html);
  } catch (err) {
    console.error('❌ Error serving mobile callback page:', err);
    res.status(500).send('Error loading callback page');
  }
});

module.exports = router;
