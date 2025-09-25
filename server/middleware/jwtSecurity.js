const jwt = require("jsonwebtoken");
const { logEvents } = require("./logger");

// JWT security configuration with environment-based settings
const JWT_CONFIG = {
  // Access token expiry - configurable via environment variable
  // Default: 4 hours (good balance of security and user experience)
  // Can be overridden with JWT_ACCESS_EXPIRES_IN environment variable
  accessTokenExpiry: process.env.JWT_ACCESS_EXPIRES_IN || '4h',
  
  // Refresh token expiry - configurable via environment variable  
  // Default: 7 days (standard for refresh tokens)
  // Can be overridden with JWT_REFRESH_EXPIRES_IN environment variable
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  
  // Legacy support - if JWT_EXPIRES_IN is set, use it for access token
  // This maintains backward compatibility
  ...(process.env.JWT_EXPIRES_IN && !process.env.JWT_ACCESS_EXPIRES_IN && {
    accessTokenExpiry: process.env.JWT_EXPIRES_IN
  }),
  
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

  return { 
    accessToken, 
    refreshToken, 
    refreshTokenId: refreshPayload.jti 
  };
};

// Enhanced JWT verification with comprehensive security checks
const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ 
      message: "Unauthorized - No token provided",
      isError: true,
      code: 'NO_TOKEN'
    });
  }

  const token = authHeader.split(" ")[1];

  // Check if token is blacklisted
  if (isTokenBlacklisted(token)) {
    logEvents(
      `JWT Blacklisted Token Attempt: ${req.method}\t${req.url}\t${req.ip}`,
      "errLog.log"
    );
    return res.status(403).json({ 
      message: "Token has been revoked",
      isError: true,
      code: 'TOKEN_REVOKED'
    });
  }

  // Verify token with enhanced options
  jwt.verify(token, process.env.JWT_SECRET, {
    issuer: JWT_CONFIG.issuer,
    audience: JWT_CONFIG.audience,
    algorithms: ['HS256']
  }, (err, decoded) => {
    if (err) {
      let errorMessage = "Forbidden - Invalid token";
      let errorCode = 'INVALID_TOKEN';
      
      if (err.name === 'TokenExpiredError') {
        errorMessage = "Token expired";
        errorCode = 'TOKEN_EXPIRED';
      } else if (err.name === 'JsonWebTokenError') {
        errorMessage = "Invalid token format";
        errorCode = 'MALFORMED_TOKEN';
      } else if (err.name === 'NotBeforeError') {
        errorMessage = "Token not active";
        errorCode = 'TOKEN_NOT_ACTIVE';
      } else if (err.name === 'TokenUsedTooEarly') {
        errorMessage = "Token used too early";
        errorCode = 'TOKEN_EARLY';
      }

      // Log JWT verification failures with more context
      logEvents(
        `JWT Verification Failed: ${err.name} - ${err.message}\t${req.method}\t${req.url}\t${req.ip}\t${req.get('User-Agent')}`,
        "errLog.log"
      );

      return res.status(403).json({ 
        message: errorMessage,
        isError: true,
        code: errorCode,
        timestamp: new Date().toISOString()
      });
    }

    // Comprehensive payload validation
    if (!decoded.UserInfo || !decoded.UserInfo.usernameId) {
      logEvents(
        `JWT Invalid Payload: Missing UserInfo\t${req.method}\t${req.url}\t${req.ip}`,
        "errLog.log"
      );
      return res.status(403).json({ 
        message: "Invalid token payload",
        isError: true,
        code: 'INVALID_PAYLOAD'
      });
    }

    // Validate required fields in UserInfo
    const { username, usernameId, country, role } = decoded.UserInfo;
    if (!username || !usernameId || !country) {
      logEvents(
        `JWT Incomplete UserInfo: ${JSON.stringify(decoded.UserInfo)}\t${req.method}\t${req.url}\t${req.ip}`,
        "errLog.log"
      );
      return res.status(403).json({ 
        message: "Incomplete user information in token",
        isError: true,
        code: 'INCOMPLETE_USER_INFO'
      });
    }

    // Check token age (additional security layer)
    const tokenAge = Date.now() / 1000 - decoded.iat;
    
    // Parse the access token expiry to get max age in seconds
    const parseExpiryToSeconds = (expiry) => {
      if (!expiry) return 3600; // Default 1 hour
      
      const unit = expiry.slice(-1);
      const value = parseInt(expiry.slice(0, -1));
      
      switch (unit) {
        case 's': return value;
        case 'm': return value * 60;
        case 'h': return value * 3600;
        case 'd': return value * 86400;
        default: return 3600; // Default 1 hour
      }
    };
    
    const maxAge = parseExpiryToSeconds(JWT_CONFIG.accessTokenExpiry);
    
    if (tokenAge > maxAge) {
      logEvents(
        `JWT Token Too Old: ${tokenAge}s (max: ${maxAge}s)\t${req.method}\t${req.url}\t${req.ip}`,
        "errLog.log"
      );
      return res.status(403).json({ 
        message: "Token too old",
        isError: true,
        code: 'TOKEN_TOO_OLD'
      });
    }

    // Check token freshness (prevent replay attacks)
    const tokenFreshness = Date.now() / 1000 - decoded.iat;
    if (tokenFreshness < 0) {
      logEvents(
        `JWT Future Token: ${tokenFreshness}s\t${req.method}\t${req.url}\t${req.ip}`,
        "errLog.log"
      );
      return res.status(403).json({ 
        message: "Token from future",
        isError: true,
        code: 'FUTURE_TOKEN'
      });
    }

    // Validate JWT ID for tracking
    if (!decoded.jti) {
      logEvents(
        `JWT Missing JTI: ${req.method}\t${req.url}\t${req.ip}`,
        "errLog.log"
      );
      return res.status(403).json({ 
        message: "Token missing ID",
        isError: true,
        code: 'MISSING_JTI'
      });
    }

    // Attach comprehensive user info to request
    req.user = usernameId;
    req.username = username;
    req.country = country;
    req.role = role || 'user';
    req.tokenId = decoded.jti;
    req.tokenIssuedAt = decoded.iat;
    req.tokenExpiresAt = decoded.exp;
    req.tokenAge = tokenAge;

    // Log successful authentication
    logEvents(
      `JWT Verification Success: ${username} (${usernameId})\t${req.method}\t${req.url}\t${req.ip}`,
      "reqLog.log"
    );

    next();
  });
};

// Enhanced refresh token verification with rotation support
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

      // Check if refresh token is blacklisted
      if (isTokenBlacklisted(decoded.jti)) {
        logEvents(
          `Blacklisted Refresh Token Attempt: ${decoded.username}\t${req.method}\t${req.url}\t${req.ip}`,
          "errLog.log"
        );
        return res.status(403).json({ 
          message: "Refresh token has been revoked",
          isError: true 
        });
      }

      req.refreshTokenData = decoded;
      next();
    }
  );
};

// Token rotation function - generates new access and refresh tokens
const rotateTokens = (userInfo, oldRefreshTokenId = null) => {
  // Blacklist the old refresh token if provided
  if (oldRefreshTokenId) {
    blacklistToken(oldRefreshTokenId);
  }

  // Generate new tokens
  const newTokens = generateTokens(userInfo);
  
  return {
    accessToken: newTokens.accessToken,
    refreshToken: newTokens.refreshToken,
    refreshTokenId: newTokens.refreshTokenId // We'll need to extract this from the token
  };
};

// Enhanced secure cookie configuration for production
const getSecureCookieOptions = (isProduction = process.env.NODE_ENV === 'production') => {
  const baseOptions = {
    httpOnly: true, // Prevent XSS attacks
    secure: isProduction, // HTTPS only in production
    sameSite: isProduction ? "None" : "Lax", // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/', // Available to all routes
  };

  // Production-specific security enhancements
  if (isProduction) {
    return {
      ...baseOptions,
      domain: process.env.COOKIE_DOMAIN || '.mafqoudat.com', // Domain restriction
      // Additional security headers for production
      priority: 'high', // Cookie priority
      // Partitioned cookies for better security (if supported)
      partitioned: true,
    };
  }

  return baseOptions;
};

// Enhanced secure cookie clear options (without maxAge for clearing cookies)
const getSecureCookieClearOptions = (isProduction = process.env.NODE_ENV === 'production') => {
  const baseOptions = {
    httpOnly: true, // Prevent XSS attacks
    secure: isProduction, // HTTPS only in production
    sameSite: isProduction ? "None" : "Lax", // CSRF protection
    path: '/', // Available to all routes
  };

  // Production-specific security enhancements
  if (isProduction) {
    return {
      ...baseOptions,
      domain: process.env.COOKIE_DOMAIN || '.mafqoudat.com', // Domain restriction
      // Additional security headers for production
      priority: 'high', // Cookie priority
      // Partitioned cookies for better security (if supported)
      partitioned: true,
    };
  }

  return baseOptions;
};

// Enhanced token blacklist with expiration tracking
const tokenBlacklist = new Map(); // Changed to Map to store expiration times

const blacklistToken = (tokenId, expiresAt = null) => {
  const expirationTime = expiresAt || Date.now() + (15 * 60 * 1000); // Default 15 minutes
  tokenBlacklist.set(tokenId, expirationTime);
  
  // Remove from blacklist after token expiry (cleanup)
  setTimeout(() => {
    tokenBlacklist.delete(tokenId);
  }, expirationTime - Date.now());
};

const isTokenBlacklisted = (tokenId) => {
  if (!tokenBlacklist.has(tokenId)) {
    return false;
  }
  
  const expirationTime = tokenBlacklist.get(tokenId);
  if (Date.now() > expirationTime) {
    tokenBlacklist.delete(tokenId);
    return false;
  }
  
  return true;
};

// Cleanup expired tokens from blacklist (run periodically)
const cleanupBlacklist = () => {
  const now = Date.now();
  for (const [tokenId, expirationTime] of tokenBlacklist.entries()) {
    if (now > expirationTime) {
      tokenBlacklist.delete(tokenId);
    }
  }
};

// Run cleanup every 5 minutes
setInterval(cleanupBlacklist, 5 * 60 * 1000);

// Enhanced logout middleware with comprehensive token blacklisting
const logout = (req, res) => {
  const tokenId = req.tokenId;
  const refreshTokenData = req.refreshTokenData;
  
  // Blacklist the current access token
  if (tokenId) {
    blacklistToken(tokenId);
    logEvents(
      `Access token blacklisted on logout: ${req.username || 'unknown'}\t${req.method}\t${req.url}\t${req.ip}`,
      "reqLog.log"
    );
  }

  // Blacklist the refresh token if available
  if (refreshTokenData && refreshTokenData.jti) {
    blacklistToken(refreshTokenData.jti);
    logEvents(
      `Refresh token blacklisted on logout: ${refreshTokenData.username || 'unknown'}\t${req.method}\t${req.url}\t${req.ip}`,
      "reqLog.log"
    );
  }

  // Clear refresh token cookie
  res.clearCookie('jwt', getSecureCookieClearOptions());
  
  // Log successful logout
  logEvents(
    `Successful logout: ${req.username || 'unknown'}\t${req.method}\t${req.url}\t${req.ip}`,
    "reqLog.log"
  );
  
  res.json({ 
    message: "Logged out successfully",
    isError: false 
  });
};

// Role-based access control middleware
const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.role) {
      return res.status(403).json({
        message: "Role information not available",
        isError: true,
        code: 'NO_ROLE_INFO'
      });
    }

    if (req.role !== requiredRole) {
      logEvents(
        `Role Access Denied: Required ${requiredRole}, User has ${req.role}\t${req.method}\t${req.url}\t${req.ip}`,
        "errLog.log"
      );
      return res.status(403).json({
        message: `Access denied. Required role: ${requiredRole}`,
        isError: true,
        code: 'INSUFFICIENT_ROLE'
      });
    }

    next();
  };
};

// Admin-only middleware
const requireAdmin = requireRole('admin');

// Permission-based access control middleware
const requirePermission = (requiredPermission) => {
  return (req, res, next) => {
    // This would need to be implemented based on your permission system
    // For now, we'll assume admin role has all permissions
    if (req.role === 'admin') {
      return next();
    }

    // Add your permission validation logic here
    // Example: Check if user.permissions includes requiredPermission
    if (!req.userPermissions || !req.userPermissions.includes(requiredPermission)) {
      logEvents(
        `Permission Access Denied: Required ${requiredPermission}\t${req.method}\t${req.url}\t${req.ip}`,
        "errLog.log"
      );
      return res.status(403).json({
        message: `Access denied. Required permission: ${requiredPermission}`,
        isError: true,
        code: 'INSUFFICIENT_PERMISSION'
      });
    }

    next();
  };
};

// Multiple permissions middleware
const requireAnyPermission = (permissions) => {
  return (req, res, next) => {
    if (req.role === 'admin') {
      return next();
    }

    const hasPermission = permissions.some(permission => 
      req.userPermissions && req.userPermissions.includes(permission)
    );

    if (!hasPermission) {
      logEvents(
        `Permission Access Denied: Required any of ${permissions.join(', ')}\t${req.method}\t${req.url}\t${req.ip}`,
        "errLog.log"
      );
      return res.status(403).json({
        message: `Access denied. Required any of: ${permissions.join(', ')}`,
        isError: true,
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

// All permissions middleware
const requireAllPermissions = (permissions) => {
  return (req, res, next) => {
    if (req.role === 'admin') {
      return next();
    }

    const hasAllPermissions = permissions.every(permission => 
      req.userPermissions && req.userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      logEvents(
        `Permission Access Denied: Required all of ${permissions.join(', ')}\t${req.method}\t${req.url}\t${req.ip}`,
        "errLog.log"
      );
      return res.status(403).json({
        message: `Access denied. Required all of: ${permissions.join(', ')}`,
        isError: true,
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

// Token validation middleware (for optional authentication)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    // No token provided, continue without authentication
    return next();
  }

  const token = authHeader.split(" ")[1];

  // Check if token is blacklisted
  if (isTokenBlacklisted(token)) {
    return next(); // Continue without authentication
  }

  // Verify token with enhanced options
  jwt.verify(token, process.env.JWT_SECRET, {
    issuer: JWT_CONFIG.issuer,
    audience: JWT_CONFIG.audience,
    algorithms: ['HS256']
  }, (err, decoded) => {
    if (err) {
      // Token invalid, continue without authentication
      return next();
    }

    // Token valid, attach user info
    if (decoded.UserInfo && decoded.UserInfo.usernameId) {
      req.user = decoded.UserInfo.usernameId;
      req.username = decoded.UserInfo.username;
      req.country = decoded.UserInfo.country;
      req.role = decoded.UserInfo.role || 'user';
      req.tokenId = decoded.jti;
      req.tokenIssuedAt = decoded.iat;
      req.tokenExpiresAt = decoded.exp;
    }

    next();
  });
};

// Enhanced rate limiting for authentication endpoints
const authRateLimit = (req, res, next) => {
  // This integrates with the existing rate limiting middleware
  // The actual rate limiting is handled by the rateLimiting.js middleware
  next();
};

// Advanced rate limiting for refresh token endpoint
const refreshTokenRateLimit = (req, res, next) => {
  // This would implement more sophisticated rate limiting for refresh tokens
  // For now, we'll use the existing rate limiting system
  next();
};

// Rate limiting for logout endpoint
const logoutRateLimit = (req, res, next) => {
  // Logout should have moderate rate limiting to prevent abuse
  next();
};

module.exports = {
  generateTokens,
  verifyJWT,
  verifyRefreshToken,
  getSecureCookieOptions,
  getSecureCookieClearOptions,
  logout,
  isTokenBlacklisted,
  blacklistToken,
  rotateTokens,
  cleanupBlacklist,
  JWT_CONFIG,
  // New middleware exports
  requireRole,
  requireAdmin,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  optionalAuth,
  authRateLimit,
  refreshTokenRateLimit,
  logoutRateLimit
};
