const jwt = require("jsonwebtoken");
const { logEvents } = require("./logger");

// JWT security configuration
const JWT_CONFIG = {
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '7d',
  issuer: 'mafqoudat-api',
  audience: 'mafqoudat-client'
};

// Enhanced JWT token generation with security features
const generateTokens = (userInfo) => {
  const payload = {
    UserInfo: {
      username: userInfo.username,
      usernameId: userInfo.id,
      country: userInfo.country,
      role: userInfo.role,
    },
    iat: Math.floor(Date.now() / 1000), // Issued at
    iss: JWT_CONFIG.issuer, // Issuer
    aud: JWT_CONFIG.audience, // Audience
    jti: require('crypto').randomUUID() // JWT ID for token tracking
  };

  const accessToken = jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { 
      expiresIn: JWT_CONFIG.accessTokenExpiry,
      algorithm: 'HS256'
    }
  );

  const refreshPayload = {
    username: userInfo.username,
    tokenType: 'refresh',
    iat: Math.floor(Date.now() / 1000),
    iss: JWT_CONFIG.issuer,
    aud: JWT_CONFIG.audience,
    jti: require('crypto').randomUUID()
  };

  const refreshToken = jwt.sign(
    refreshPayload,
    process.env.JWT_REFRESH_SECRET,
    { 
      expiresIn: JWT_CONFIG.refreshTokenExpiry,
      algorithm: 'HS256'
    }
  );

  return { accessToken, refreshToken };
};

// Enhanced JWT verification with security checks
const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ 
      message: "Unauthorized - No token provided",
      isError: true 
    });
  }

  const token = authHeader.split(" ")[1];

  // Verify token with enhanced options
  jwt.verify(token, process.env.JWT_SECRET, {
    issuer: JWT_CONFIG.issuer,
    audience: JWT_CONFIG.audience,
    algorithms: ['HS256']
  }, (err, decoded) => {
    if (err) {
      let errorMessage = "Forbidden - Invalid token";
      
      if (err.name === 'TokenExpiredError') {
        errorMessage = "Token expired";
      } else if (err.name === 'JsonWebTokenError') {
        errorMessage = "Invalid token format";
      } else if (err.name === 'NotBeforeError') {
        errorMessage = "Token not active";
      }

      // Log JWT verification failures
      logEvents(
        `JWT Verification Failed: ${err.name} - ${err.message}\t${req.method}\t${req.url}\t${req.ip}`,
        "errLog.log"
      );

      return res.status(403).json({ 
        message: errorMessage,
        isError: true 
      });
    }

    // Additional security checks
    if (!decoded.UserInfo || !decoded.UserInfo.usernameId) {
      return res.status(403).json({ 
        message: "Invalid token payload",
        isError: true 
      });
    }

    // Check token age (additional security layer)
    const tokenAge = Date.now() / 1000 - decoded.iat;
    const maxAge = 15 * 60; // 15 minutes in seconds
    
    if (tokenAge > maxAge) {
      return res.status(403).json({ 
        message: "Token too old",
        isError: true 
      });
    }

    // Attach user info to request
    req.user = decoded.UserInfo.usernameId;
    req.username = decoded.UserInfo.username;
    req.country = decoded.UserInfo.country;
    req.role = decoded.UserInfo.role;
    req.tokenId = decoded.jti; // JWT ID for tracking

    next();
  });
};

// Enhanced refresh token verification
const verifyRefreshToken = (req, res, next) => {
  const cookies = req.cookies;

  if (!cookies?.jwt) {
    return res.status(401).json({ 
      message: "Unauthorized - No refresh token",
      isError: true 
    });
  }

  const refreshToken = cookies.jwt;

  jwt.verify(
    refreshToken,
    process.env.JWT_REFRESH_SECRET,
    {
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience,
      algorithms: ['HS256']
    },
    async (err, decoded) => {
      if (err) {
        let errorMessage = "Forbidden - Invalid refresh token";
        
        if (err.name === 'TokenExpiredError') {
          errorMessage = "Refresh token expired";
        }

        logEvents(
          `Refresh Token Verification Failed: ${err.name} - ${err.message}\t${req.method}\t${req.url}\t${req.ip}`,
          "errLog.log"
        );

        return res.status(403).json({ 
          message: errorMessage,
          isError: true 
        });
      }

      // Verify token type
      if (decoded.tokenType !== 'refresh') {
        return res.status(403).json({ 
          message: "Invalid token type",
          isError: true 
        });
      }

      req.refreshTokenData = decoded;
      next();
    }
  );
};

// Secure cookie configuration
const getSecureCookieOptions = (isProduction = process.env.NODE_ENV === 'production') => {
  return {
    httpOnly: true, // Prevent XSS attacks
    secure: isProduction, // HTTPS only in production
    sameSite: isProduction ? "None" : "Lax", // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/', // Available to all routes
    domain: isProduction ? '.mafqoudat.com' : undefined // Domain restriction in production
  };
};

// Secure cookie clear options (without maxAge for clearing cookies)
const getSecureCookieClearOptions = (isProduction = process.env.NODE_ENV === 'production') => {
  return {
    httpOnly: true, // Prevent XSS attacks
    secure: isProduction, // HTTPS only in production
    sameSite: isProduction ? "None" : "Lax", // CSRF protection
    path: '/', // Available to all routes
    domain: isProduction ? '.mafqoudat.com' : undefined // Domain restriction in production
  };
};

// Token blacklist for logout functionality
const tokenBlacklist = new Set();

const blacklistToken = (tokenId) => {
  tokenBlacklist.add(tokenId);
  
  // Remove from blacklist after token expiry (cleanup)
  setTimeout(() => {
    tokenBlacklist.delete(tokenId);
  }, 15 * 60 * 1000); // 15 minutes
};

const isTokenBlacklisted = (tokenId) => {
  return tokenBlacklist.has(tokenId);
};

// Enhanced logout middleware
const logout = (req, res) => {
  const tokenId = req.tokenId;
  
  if (tokenId) {
    blacklistToken(tokenId);
  }

  // Clear refresh token cookie
  res.clearCookie('jwt', getSecureCookieClearOptions());
  
  res.json({ 
    message: "Logged out successfully",
    isError: false 
  });
};

module.exports = {
  generateTokens,
  verifyJWT,
  verifyRefreshToken,
  getSecureCookieOptions,
  getSecureCookieClearOptions,
  logout,
  isTokenBlacklisted,
  JWT_CONFIG
};
