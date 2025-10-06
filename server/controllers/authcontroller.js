const User = require("../models/User");
const bcrypt = require("bcrypt");
const Country = require("../models/Country");
const { generateTokens, getSecureCookieOptions, logout, rotateTokens, verifyRefreshToken } = require("../middleware/jwtSecurity");
const { logEvents } = require("../middleware/logger");
const { createAuthError, asyncAuthHandler } = require("../middleware/authErrorHandler");

// @desc Login
// @route POST /auth
// @access Public
const login = async (req, res) => {
  const { emailOrPhone, password } = req.body;

  console.log('Login attempt received:', { emailOrPhone, hasPassword: !!password });

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
    console.log('Login attempt - User not found for:', emailOrPhone);
    throw createAuthError('INVALID_CREDENTIALS', 'Invalid credentials', {
      emailOrPhone,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  }

  console.log('Login attempt - User found:', foundUser.username, 'Email:', foundUser.email, 'Phone:', foundUser.phone);

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
    console.log('Login attempt - Password mismatch for user:', foundUser.username);
    throw createAuthError('INVALID_CREDENTIALS', 'Invalid credentials', {
      username: foundUser.username,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  }

  // const code = await Country.findById(foundUser.country).lean().exec()

  // Generate secure tokens
  let accessToken, refreshToken;
  try {
    const tokens = generateTokens({
      username: foundUser.username,
      id: foundUser.id,
      country: foundUser.country,
      role: foundUser.role
    });
    accessToken = tokens.accessToken;
    refreshToken = tokens.refreshToken;
  } catch (tokenError) {
    console.error('Token generation error during login:', tokenError);
    throw createAuthError('SERVER_ERROR', 'Token generation error', {
      username: foundUser.username,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      tokenError: tokenError.message
    });
  }

  // Create secure cookie with refresh token
  const cookieOptions = getSecureCookieOptions();
  console.log('🍪 LOGIN: Setting refresh token cookie with options:', cookieOptions);
  console.log('🍪 LOGIN: Refresh token length:', refreshToken.length);
  
  res.cookie("jwt", refreshToken, cookieOptions);

  // Log successful login
  logEvents(
    `Successful login: ${foundUser.username}\t${req.method}\t${req.url}\t${req.ip}`,
    "reqLog.log"
  );

  console.log('✅ LOGIN: Login successful, sending access token');
  // Send accessToken containing username and country
  res.json({ accessToken });
};

// @desc Refresh with token rotation
// @route GET /auth/refresh
// @access Public - because access token has expired
const refresh = async (req, res) => {
  console.log('🔄 REFRESH TOKEN: Starting refresh token process');
  console.log('🔄 REFRESH TOKEN: Request IP:', req.ip);
  console.log('🔄 REFRESH TOKEN: Request headers:', req.headers);
  
  const cookies = req.cookies;
  console.log('🔄 REFRESH TOKEN: Cookies received:', cookies ? 'Present' : 'Missing');

  if (!cookies?.jwt) {
    console.log('❌ REFRESH TOKEN: No refresh token cookie found');
    return res.status(401).json({ 
      message: "Unauthorized - No refresh token",
      isError: true 
    });
  }

  const refreshToken = cookies.jwt;
  console.log('🔄 REFRESH TOKEN: Refresh token found, length:', refreshToken.length);

  try {
    console.log('🔄 REFRESH TOKEN: Verifying refresh token...');
    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET,
      {
        issuer: 'mafqoudat-api',
        audience: 'mafqoudat-client',
        algorithms: ['HS256']
      }
    );
    console.log('✅ REFRESH TOKEN: Token verified successfully');
    console.log('🔄 REFRESH TOKEN: Decoded token data:', {
      username: decoded.username,
      tokenType: decoded.tokenType,
      jti: decoded.jti,
      iat: new Date(decoded.iat * 1000).toISOString(),
      exp: new Date(decoded.exp * 1000).toISOString()
    });

    if (decoded.tokenType !== 'refresh') {
      console.log('❌ REFRESH TOKEN: Invalid token type:', decoded.tokenType);
      return res.status(403).json({ 
        message: "Invalid token type",
        isError: true 
      });
    }

    console.log('🔄 REFRESH TOKEN: Looking up user:', decoded.username);
    const foundUser = await User.findOne({
      username: decoded.username,
    }).select('_id username country role').exec();

    if (!foundUser) {
      console.log('❌ REFRESH TOKEN: User not found:', decoded.username);
      return res.status(401).json({ 
        message: "Unauthorized - User not found",
        isError: true 
      });
    }
    console.log('✅ REFRESH TOKEN: User found:', foundUser.username);

    // Token rotation: Generate new access and refresh tokens
    console.log('🔄 REFRESH TOKEN: Generating new tokens...');
    const userInfo = {
      username: foundUser.username,
      id: foundUser.id,
      country: foundUser.country,
      role: foundUser.role
    };

    const { accessToken, refreshToken: newRefreshToken } = rotateTokens(userInfo, decoded.jti);
    console.log('✅ REFRESH TOKEN: New tokens generated successfully');
    console.log('🔄 REFRESH TOKEN: New access token length:', accessToken.length);
    console.log('🔄 REFRESH TOKEN: New refresh token length:', newRefreshToken.length);

    // Set new refresh token cookie
    console.log('🔄 REFRESH TOKEN: Setting new refresh token cookie...');
    res.cookie("jwt", newRefreshToken, getSecureCookieOptions());

    // Log successful token rotation
    logEvents(
      `Token rotation successful: ${foundUser.username}\t${req.method}\t${req.url}\t${req.ip}`,
      "reqLog.log"
    );

    console.log('✅ REFRESH TOKEN: Refresh successful, sending new access token');
    res.json({ accessToken });
  } catch (err) {
    console.log('❌ REFRESH TOKEN: Error during refresh:', err.name, err.message);
    let errorMessage = "Forbidden - Invalid refresh token";
    
    if (err.name === 'TokenExpiredError') {
      errorMessage = "Refresh token expired";
      console.log('❌ REFRESH TOKEN: Refresh token has expired');
    } else if (err.name === 'JsonWebTokenError') {
      console.log('❌ REFRESH TOKEN: Invalid refresh token format');
    } else if (err.name === 'NotBeforeError') {
      console.log('❌ REFRESH TOKEN: Token not active yet');
    }

    logEvents(
      `Refresh token verification failed: ${err.name} - ${err.message}\t${req.method}\t${req.url}\t${req.ip}`,
      "errLog.log"
    );

    console.log('❌ REFRESH TOKEN: Returning error response:', errorMessage);
    return res.status(403).json({ 
      message: errorMessage,
      isError: true 
    });
  }
};

// @desc Logout
// @route POST /auth/logout
// @access Private
const logoutHandler = (req, res) => {
  // Try to get refresh token data from cookies for blacklisting
  const cookies = req.cookies;
  if (cookies?.jwt) {
    try {
      const jwt = require("jsonwebtoken");
      const decoded = jwt.verify(
        cookies.jwt,
        process.env.JWT_REFRESH_SECRET,
        {
          issuer: 'mafqoudat-api',
          audience: 'mafqoudat-client',
          algorithms: ['HS256']
        }
      );
      
      if (decoded.tokenType === 'refresh' && decoded.jti) {
        req.refreshTokenData = decoded;
      }
    } catch (err) {
      // Refresh token is invalid/expired, but we'll still proceed with logout
      console.log('Refresh token invalid during logout, proceeding with access token blacklisting only');
    }
  }
  
  return logout(req, res);
};

// @desc Logout (fallback for expired/invalid tokens)
// @route POST /auth/logout-fallback
// @access Public
const logoutFallback = (req, res) => {
  // Always clear refresh token cookie regardless of token validity
  res.clearCookie('jwt', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? "None" : "Lax",
    path: '/',
    domain: process.env.NODE_ENV === 'production' ? '.mafqoudat.com' : undefined
  });
  
  res.json({ 
    message: "Logged out successfully (fallback)",
    isError: false 
  });
};

module.exports = {
  login,
  refresh,
  logout: logoutHandler,
  logoutFallback,
};
