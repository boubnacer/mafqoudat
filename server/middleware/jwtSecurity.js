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
    const maxAge = 15 * 60; // 15 minutes in seconds
    
    if (tokenAge > maxAge) {
      logEvents(
        `JWT Token Too Old: ${tokenAge}s\t${req.method}\t${req.url}\t${req.ip}`,
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

// Rate limiting for authentication endpoints
const authRateLimit = (req, res, next) => {
  // This would integrate with your existing rate limiting middleware
  // For now, we'll just pass through
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
  JWT_CONFIG,
  // New middleware exports
  requireRole,
  requireAdmin,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  optionalAuth,
  authRateLimit
};
