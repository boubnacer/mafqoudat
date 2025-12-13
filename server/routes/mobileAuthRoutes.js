const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/User');
const Country = require('../models/Country');
const { generateTokens } = require('../middleware/jwtSecurity');
const { logEvents } = require('../middleware/logger');
const { OAuth2Client } = require('google-auth-library');


// Initialize Google OAuth2 client
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

// Map to store pending OAuth registrations with timestamps
const pendingRegistrations = new Map();
const PENDING_TOKEN_EXPIRY = 5 * 60 * 1000; // 5 minutes

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
}, 60 * 1000);

/**
 * Verify Google ID token
 * @param {string} idToken - Google ID token
 * @returns {Promise<Object>} Verified token payload
 */
const verifyGoogleToken = async (idToken) => {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    return ticket.getPayload();
  } catch (error) {
    console.error('Google token verification error:', error);
    throw new Error('Invalid Google token');
  }
};

/**
 * @desc Exchange authorization code for tokens (mobile)
 * @route POST /auth/mobile/exchange-code
 * @access Public
 */
router.post('/exchange-code', async (req, res) => {
  try {
    const { code, redirectUri } = req.body;

    // Validate required fields
    if (!code || !redirectUri) {
      return res.status(400).json({
        message: 'Authorization code and redirect URI are required',
        isError: true,
        code: 'VALIDATION_ERROR'
      });
    }

    console.log('🔄 Exchanging authorization code for tokens...');

    // Exchange authorization code for tokens
    const tokenResponse = await googleClient.getToken({
      code,
      redirect_uri: redirectUri,
    });

    const { tokens } = tokenResponse;
    console.log('✅ Token exchange successful');

    // Get user info with access token
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const tokenPayload = ticket.getPayload();
    
    // Extract user information
    const googleId = tokenPayload.sub;
    const email = tokenPayload.email;
    const emailVerified = tokenPayload.email_verified;
    const firstName = tokenPayload.given_name || '';
    const lastName = tokenPayload.family_name || '';
    const avatar = tokenPayload.picture;

    // Check if email is verified
    if (!emailVerified) {
      return res.status(400).json({
        message: 'Email is not verified with Google',
        isError: true,
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email },
        { googleId: googleId }
      ]
    }).select('-password');

    if (existingUser) {
      console.log('👤 Existing user found:', existingUser.username);
      
      // Update last login and ensure Google ID is set
      existingUser.lastLogin = new Date();
      
      if (!existingUser.googleId) {
        existingUser.googleId = googleId;
        existingUser.authProvider = 'google';
      }

      // Update profile picture if not set
      if (!existingUser.profile.avatar && avatar) {
        existingUser.profile.avatar = avatar;
      }

      await existingUser.save();

      // Generate JWT tokens
      const jwtTokens = generateTokens({
        username: existingUser.username,
        id: existingUser._id,
        country: existingUser.country,
        role: existingUser.role
      });

      logEvents(
        `Successful mobile Google OAuth login: ${existingUser.username}\t${req.method}\t${req.url}\t${req.ip}`,
        'reqLog.log'
      );

      return res.status(200).json({
        user: {
          id: existingUser._id,
          username: existingUser.username,
          email: existingUser.email,
          profile: existingUser.profile,
          country: existingUser.country,
          role: existingUser.role
        },
        token: jwtTokens.accessToken,
        isNewUser: false
      });
    }

    // New user - create pending registration
    console.log('🆕 New user, creating pending registration');
    
    const pendingToken = crypto.randomBytes(32).toString('hex');
    
    // Store user data temporarily
    pendingRegistrations.set(pendingToken, {
      userData: {
        googleId,
        email,
        profile: {
          firstName,
          lastName,
          avatar,
          firstNameLabels: {
            en: firstName,
            fr: firstName,
            ar: firstName
          },
          lastNameLabels: {
            en: lastName,
            fr: lastName,
            ar: lastName
          }
        },
        authProvider: 'google'
      },
      timestamp: Date.now()
    });

    logEvents(
      `Pending mobile Google OAuth registration: ${email}\t${req.method}\t${req.url}\t${req.ip}`,
      'reqLog.log'
    );

    return res.status(200).json({
      pendingToken,
      user: {
        email,
        profile: {
          firstName,
          lastName,
          avatar
        }
      },
      isNewUser: true
    });

  } catch (error) {
    console.error('Token exchange error:', error);
    logEvents(
      `Mobile Google OAuth token exchange error\t${error.message}\t${req.method}\t${req.url}\t${req.ip}`,
      'errLog.log'
    );
    
    return res.status(500).json({
      message: 'Failed to exchange authorization code',
      isError: true,
      code: 'TOKEN_EXCHANGE_ERROR'
    });
  }
});

/**
 * @desc Mobile Google OAuth authentication
 * @route POST /auth/google/mobile
 * @access Public
 */
router.post('/google/mobile', async (req, res) => {
  try {
    const { idToken, accessToken, user, mobile } = req.body;

    // Validate required fields
    if (!idToken || !user || !user.email) {
      logEvents(
        `Mobile Google OAuth - Missing required fields\t${req.method}\t${req.url}\t${req.ip}`,
        'errLog.log'
      );
      return res.status(400).json({
        message: 'Missing required authentication data',
        isError: true,
        code: 'VALIDATION_ERROR'
      });
    }

    console.log('🔍 Mobile Google OAuth request:', {
      hasIdToken: !!idToken,
      hasAccessToken: !!accessToken,
      userEmail: user.email,
      userId: user.id
    });

    // Verify Google ID token
    let tokenPayload;
    try {
      tokenPayload = await verifyGoogleToken(idToken);
      console.log('✅ Google token verified successfully');
    } catch (verificationError) {
      console.error('❌ Google token verification failed:', verificationError);
      logEvents(
        `Mobile Google OAuth - Invalid token: ${user.email}\t${req.method}\t${req.url}\t${req.ip}`,
        'errLog.log'
      );
      return res.status(401).json({
        message: 'Invalid Google authentication token',
        isError: true,
        code: 'INVALID_TOKEN'
      });
    }

    // Extract user information from verified token
    const googleId = tokenPayload.sub;
    const email = tokenPayload.email;
    const emailVerified = tokenPayload.email_verified;
    const firstName = tokenPayload.given_name || '';
    const lastName = tokenPayload.family_name || '';
    const avatar = tokenPayload.picture;

    // Verify email matches
    if (email !== user.email) {
      console.error('❌ Email mismatch:', { tokenEmail: email, userEmail: user.email });
      return res.status(400).json({
        message: 'Email mismatch between token and request',
        isError: true,
        code: 'EMAIL_MISMATCH'
      });
    }

    // Check if email is verified
    if (!emailVerified) {
      return res.status(400).json({
        message: 'Email is not verified with Google',
        isError: true,
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email },
        { googleId: googleId }
      ]
    }).select('-password');

    if (existingUser) {
      console.log('👤 Existing user found:', existingUser.username);
      
      // Update last login and ensure Google ID is set
      existingUser.lastLogin = new Date();
      
      if (!existingUser.googleId) {
        existingUser.googleId = googleId;
        existingUser.authProvider = 'google';
      }

      // Update profile picture if not set
      if (!existingUser.profile.avatar && avatar) {
        existingUser.profile.avatar = avatar;
      }

      await existingUser.save();

      // Generate JWT tokens
      const tokens = generateTokens({
        username: existingUser.username,
        id: existingUser._id,
        country: existingUser.country,
        role: existingUser.role
      });

      logEvents(
        `Successful mobile Google OAuth login: ${existingUser.username}\t${req.method}\t${req.url}\t${req.ip}`,
        'reqLog.log'
      );

      return res.status(200).json({
        accessToken: tokens.accessToken,
        user: {
          id: existingUser._id,
          username: existingUser.username,
          email: existingUser.email,
          profile: existingUser.profile,
          country: existingUser.country,
          role: existingUser.role
        },
        isNewUser: false
      });
    }

    // New user - create pending registration
    console.log('🆕 New user, creating pending registration');
    
    const pendingToken = crypto.randomBytes(32).toString('hex');
    
    // Store user data temporarily
    pendingRegistrations.set(pendingToken, {
      userData: {
        googleId,
        email,
        profile: {
          firstName,
          lastName,
          avatar,
          firstNameLabels: {
            en: firstName,
            fr: firstName,
            ar: firstName
          },
          lastNameLabels: {
            en: lastName,
            fr: lastName,
            ar: lastName
          }
        },
        authProvider: 'google'
      },
      timestamp: Date.now()
    });

    logEvents(
      `Pending mobile Google OAuth registration: ${email}\t${req.method}\t${req.url}\t${req.ip}`,
      'reqLog.log'
    );

    return res.status(200).json({
      pendingToken,
      user: {
        email,
        profile: {
          firstName,
          lastName,
          avatar
        }
      },
      isNewUser: true
    });

  } catch (error) {
    console.error('Mobile Google OAuth error:', error);
    logEvents(
      `Mobile Google OAuth error\t${error.message}\t${req.method}\t${req.url}\t${req.ip}`,
      'errLog.log'
    );
    
    return res.status(500).json({
      message: 'Internal server error during Google authentication',
      isError: true,
      code: 'SERVER_ERROR'
    });
  }
});

/**
 * @desc Complete mobile Google OAuth registration
 * @route POST /auth/google/mobile/complete
 * @access Public
 */
router.post('/google/mobile/complete', async (req, res) => {
  try {
    const { pendingToken, countryId } = req.body;

    // Validate required fields
    if (!pendingToken || !countryId) {
      logEvents(
        `Mobile Google OAuth completion - Missing fields\t${req.method}\t${req.url}\t${req.ip}`,
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
        `Mobile Google OAuth completion - Invalid or expired token\t${req.method}\t${req.url}\t${req.ip}`,
        'errLog.log'
      );
      return res.status(400).json({
        message: 'Invalid or expired pending token',
        isError: true,
        code: 'INVALID_TOKEN'
      });
    }

    // Check if token has expired
    const now = Date.now();
    if (now - pendingData.timestamp > PENDING_TOKEN_EXPIRY) {
      pendingRegistrations.delete(pendingToken);
      logEvents(
        `Mobile Google OAuth completion - Expired token\t${req.method}\t${req.url}\t${req.ip}`,
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
        `Mobile Google OAuth completion - Invalid country: ${countryId}\t${req.method}\t${req.url}\t${req.ip}`,
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
    baseUsername = baseUsername.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    
    if (baseUsername.length < 3) {
      baseUsername = `user${baseUsername}`;
    }
    
    if (baseUsername.length > 50) {
      baseUsername = baseUsername.substring(0, 50);
    }

    let username = baseUsername;
    let counter = 1;

    // Check for username duplicates
    while (await User.findOne({ username })) {
      username = `${baseUsername}${counter}`;
      counter++;
      
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
      pendingRegistrations.delete(pendingToken);
      
      logEvents(
        `Mobile Google OAuth completion - User already exists: ${userData.email}\t${req.method}\t${req.url}\t${req.ip}`,
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
      profile: userData.profile,
      ipAddress,
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

    logEvents(
      `Successful mobile Google OAuth registration: ${newUser.username} (${newUser.email})\t${req.method}\t${req.url}\t${req.ip}`,
      'reqLog.log'
    );

    res.status(201).json({
      accessToken: tokens.accessToken,
      username: newUser.username,
      message: 'User registered successfully'
    });

  } catch (error) {
    console.error('Mobile Google OAuth completion error:', error);
    logEvents(
      `Mobile Google OAuth completion error\t${error.message}\t${req.method}\t${req.url}\t${req.ip}`,
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
