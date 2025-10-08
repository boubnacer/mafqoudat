const User = require("../models/User");
const bcrypt = require("bcrypt");
const Country = require("../models/Country");
const { generateTokens, logout } = require("../middleware/jwtSecurity");
const { logEvents } = require("../middleware/logger");
const { createAuthError, asyncAuthHandler } = require("../middleware/authErrorHandler");

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
  
  console.log('Searching with query:', JSON.stringify(searchQuery, null, 2));
  
  let foundUser;
  try {
    foundUser = await User.findOne(searchQuery)
      .collation({ locale: "en", strength: 2 })
      .select('_id username password country role email phone').exec();
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

  // Generate access token (long-lived, no refresh token needed)
  let accessToken;
  try {
    const tokens = generateTokens({
      username: foundUser.username,
      id: foundUser.id,
      country: foundUser.country,
      role: foundUser.role
    });
    accessToken = tokens.accessToken;
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

  // Send accessToken containing username and country
  res.json({ accessToken });
};

// @desc Logout
// @route POST /auth/logout
// @access Private
const logoutHandler = (req, res) => {
  return logout(req, res);
};

module.exports = {
  login,
  logout: logoutHandler,
};
