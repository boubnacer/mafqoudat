const User = require("../models/User");
const bcrypt = require("bcrypt");
const Country = require("../models/Country");
const { generateTokens, getSecureCookieOptions, logout } = require("../middleware/jwtSecurity");
const { logEvents } = require("../middleware/logger");

// @desc Login
// @route POST /auth
// @access Public
const login = async (req, res) => {
  const { emailOrPhone, password } = req.body;

  console.log('Login attempt received:', { emailOrPhone, hasPassword: !!password });

  if (!emailOrPhone || !password) {
    return res.status(400).json({ message: "All fields are required" });
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
  
  const foundUser = await User.findOne(searchQuery)
    .collation({ locale: "en", strength: 2 })
    .select('_id username password country role email phone').exec();

  if (!foundUser) {
    console.log('Login attempt - User not found for:', emailOrPhone);
    return res.status(401).json({ message: "Invalid credentials" });
  }

  console.log('Login attempt - User found:', foundUser.username, 'Email:', foundUser.email, 'Phone:', foundUser.phone);

  const match = await bcrypt.compare(password, foundUser.password);

  if (!match) {
    console.log('Login attempt - Password mismatch for user:', foundUser.username);
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // const code = await Country.findById(foundUser.country).lean().exec()

  // Generate secure tokens
  const { accessToken, refreshToken } = generateTokens({
    username: foundUser.username,
    id: foundUser.id,
    country: foundUser.country,
    role: foundUser.role
  });

  // Create secure cookie with refresh token
  res.cookie("jwt", refreshToken, getSecureCookieOptions());

  // Log successful login
  logEvents(
    `Successful login: ${foundUser.username}\t${req.method}\t${req.url}\t${req.ip}`,
    "reqLog.log"
  );

  // Send accessToken containing username and country
  res.json({ accessToken });
};

// @desc Refresh
// @route GET /auth/refresh
// @access Public - because access token has expired
const refresh = async (req, res) => {
  const cookies = req.cookies;

  if (!cookies?.jwt) {
    return res.status(401).json({ 
      message: "Unauthorized - No refresh token",
      isError: true 
    });
  }

  const refreshToken = cookies.jwt;

  try {
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

    if (decoded.tokenType !== 'refresh') {
      return res.status(403).json({ 
        message: "Invalid token type",
        isError: true 
      });
    }

    const foundUser = await User.findOne({
      username: decoded.username,
    }).select('_id username country role').exec();

    if (!foundUser) {
      return res.status(401).json({ 
        message: "Unauthorized - User not found",
        isError: true 
      });
    }

    // Generate new access token
    const { accessToken } = generateTokens({
      username: foundUser.username,
      id: foundUser.id,
      country: foundUser.country,
      role: foundUser.role
    });

    res.json({ accessToken });
  } catch (err) {
    let errorMessage = "Forbidden - Invalid refresh token";
    
    if (err.name === 'TokenExpiredError') {
      errorMessage = "Refresh token expired";
    }

    logEvents(
      `Refresh token verification failed: ${err.name} - ${err.message}\t${req.method}\t${req.url}\t${req.ip}`,
      "errLog.log"
    );

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
  return logout(req, res);
};

module.exports = {
  login,
  refresh,
  logout: logoutHandler,
};
