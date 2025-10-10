const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const passport = require('../config/passport');
const User = require('../models/User');
const Country = require('../models/Country');
const { generateTokens } = require('../middleware/jwtSecurity');
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
router.get('/google', 
  passport.authenticate('google', { 
    session: false,
    scope: ['profile', 'email']
  })
);

// @desc Google OAuth callback
// @route GET /auth/google/callback
// @access Public
router.get('/google/callback',
  passport.authenticate('google', { 
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed`
  }),
  async (req, res) => {
    try {
      const user = req.user;

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

        // Redirect to frontend to select country
        return res.redirect(
          `${process.env.FRONTEND_URL}/auth/select-country?pendingToken=${pendingToken}`
        );
      }

      // Existing user - generate JWT and redirect
      if (user && user._id) {
        try {
          const tokens = generateTokens({
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

          // Redirect to frontend with token
          return res.redirect(
            `${process.env.FRONTEND_URL}/auth/callback?token=${tokens.accessToken}`
          );
        } catch (tokenError) {
          console.error('Token generation error during Google OAuth:', tokenError);
          logEvents(
            `Token generation error for Google OAuth: ${user.username}\t${tokenError.message}`,
            'errLog.log'
          );
          return res.redirect(
            `${process.env.FRONTEND_URL}/login?error=token_generation_failed`
          );
        }
      }

      // Unexpected state - redirect to login with error
      logEvents(
        `Google OAuth unexpected state\t${req.method}\t${req.url}\t${req.ip}`,
        'errLog.log'
      );
      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=unexpected_state`
      );
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      logEvents(
        `Google OAuth callback error\t${error.message}\t${req.method}\t${req.url}\t${req.ip}`,
        'errLog.log'
      );
      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=oauth_error`
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
      lastLogin: new Date(),
      isActive: true,
      role: 'user'
    });

    // Clean up pending token
    pendingRegistrations.delete(pendingToken);

    // Generate JWT token
    const tokens = generateTokens({
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

    // Return access token
    res.status(201).json({ 
      accessToken: tokens.accessToken,
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

module.exports = router;

