const jwt = require("jsonwebtoken");
const { logEvents } = require("./logger");
const {
  revokeAccessToken,
  isAccessTokenRevoked,
} = require("../services/tokenStore");

// JWT security configuration with environment-based settings
const JWT_CONFIG = {
  // Access token expiry - configurable via environment variable
  // Default: 30 minutes. Sessions outlive this through the refresh flow
  // (POST /auth/refresh + utils/authSession.js), which is also what makes a
  // role change or logout effective within minutes instead of 30 days.
  // NOTE: if a deployment still sets JWT_ACCESS_EXPIRES_IN=30d from the
  // pre-refresh-token era, that env var wins - unset it or set it short.
  accessTokenExpiry: process.env.JWT_ACCESS_EXPIRES_IN || '30m',

  issuer: 'mafqoudat-api',
  audience: 'mafqoudat-client'
};

// Convert a jsonwebtoken-style expiry string ("30d", "15m") to seconds.
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

// Every response below that means "the token you sent cannot be used" answers 401,
// never 403. The two are not interchangeable to a client: 401 is "re-authenticate",
// 403 is "you are authenticated but may not do this". Answering 403 for an expired
// token is what let a dead session masquerade as a permissions problem - the browser
// kept the token, kept showing the user as signed in, and every write failed. 403 is
// left to the controllers, which use it for genuine ownership/role refusals.
// The `code` values are part of the contract with both clients (client/src/app/api/
// apiSlice.js and mobile/src/api/apiService.js key off them) - do not rename them.
const unauthorized = (res, message, code) =>
  res.status(401).json({
    message,
    isError: true,
    code,
    timestamp: new Date().toISOString()
  });

// Simplified JWT token generation - only access tokens
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

  return { accessToken };
};

// Enhanced JWT verification with comprehensive security checks
const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return unauthorized(res, "Unauthorized - No token provided", 'NO_TOKEN');
  }

  const token = authHeader.split(" ")[1];

  // Verify token with enhanced options
  jwt.verify(token, process.env.JWT_SECRET, {
    issuer: JWT_CONFIG.issuer,
    audience: JWT_CONFIG.audience,
    algorithms: ['HS256']
  }, (err, decoded) => {
    if (err) {
      let errorMessage = "Unauthorized - Invalid token";
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

      return unauthorized(res, errorMessage, errorCode);
    }

    // Comprehensive payload validation
    if (!decoded.UserInfo || !decoded.UserInfo.usernameId) {
      logEvents(
        `JWT Invalid Payload: Missing UserInfo\t${req.method}\t${req.url}\t${req.ip}`,
        "errLog.log"
      );
      return unauthorized(res, "Invalid token payload", 'INVALID_PAYLOAD');
    }

    // Validate required fields in UserInfo
    const { username, usernameId, country, role } = decoded.UserInfo;
    if (!username || !usernameId || !country) {
      logEvents(
        `JWT Incomplete UserInfo: ${JSON.stringify(decoded.UserInfo)}\t${req.method}\t${req.url}\t${req.ip}`,
        "errLog.log"
      );
      return unauthorized(res, "Incomplete user information in token", 'INCOMPLETE_USER_INFO');
    }

    // No wall-clock "token too old" check against the *current* configured
    // expiry: jwt.verify already enforces each token's own `exp`. The old
    // check re-derived a max age from JWT_CONFIG at request time, which would
    // have killed every legacy 30-day token the moment the configured expiry
    // was shortened to 30 minutes - the deploy that introduced refresh tokens
    // must not force every signed-in user to re-login.
    const tokenAge = Date.now() / 1000 - decoded.iat;

    // Check token freshness (prevent replay attacks)
    const tokenFreshness = Date.now() / 1000 - decoded.iat;
    if (tokenFreshness < 0) {
      logEvents(
        `JWT Future Token: ${tokenFreshness}s\t${req.method}\t${req.url}\t${req.ip}`,
        "errLog.log"
      );
      return unauthorized(res, "Token from future", 'FUTURE_TOKEN');
    }

    // Validate JWT ID for tracking
    if (!decoded.jti) {
      logEvents(
        `JWT Missing JTI: ${req.method}\t${req.url}\t${req.ip}`,
        "errLog.log"
      );
      return unauthorized(res, "Token missing ID", 'MISSING_JTI');
    }

    // The denylist is keyed by `jti` (that is what logout stores), so the lookup can
    // only happen here, once the token is decoded - checking it against the raw token
    // string before verification, as this used to, never matched a single entry and
    // left logout unable to revoke anything. The lookup is async now that it lives in
    // Redis (services/tokenStore.js) rather than a per-process Map.
    (async () => {
      if (await isTokenBlacklisted(decoded.jti)) {
        logEvents(
          `JWT Blacklisted Token Attempt: ${req.method}\t${req.url}\t${req.ip}`,
          "errLog.log"
        );
        return unauthorized(res, "Token has been revoked", 'TOKEN_REVOKED');
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
    })().catch(next);
  });
};

// Token revocation, delegated to services/tokenStore.js (Redis with in-memory
// fallback) so a restart or a second instance can no longer un-revoke a
// logged-out session. Same exported names as the old in-memory Map, but both
// are async now.
//
// An entry has to outlive the token it revokes. Dropping it any earlier hands
// the token back its validity - which the old 15-minute default did to 30-day
// tokens. tokenStore derives each entry's TTL from the token's own expiry.
const blacklistToken = async (tokenId, expiresAt = null) => {
  const expirationTime = expiresAt || Date.now() + parseExpiryToSeconds(JWT_CONFIG.accessTokenExpiry) * 1000;
  await revokeAccessToken(tokenId, expirationTime);
};

const isTokenBlacklisted = (tokenId) => isAccessTokenRevoked(tokenId);

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

    // Blacklisted (logged-out) token: treat the caller as a guest rather than
    // rejecting them, since this middleware is optional by design. Keyed by `jti`
    // after decoding, for the same reason as in verifyJWT above.
    (async () => {
      if (await isTokenBlacklisted(decoded.jti)) {
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
    })().catch(() => next());
  });
};

// Enhanced rate limiting for authentication endpoints
const authRateLimit = (req, res, next) => {
  // This integrates with the existing rate limiting middleware
  // The actual rate limiting is handled by the rateLimiting.js middleware
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
  isTokenBlacklisted,
  blacklistToken,
  parseExpiryToSeconds,
  JWT_CONFIG,
  // New middleware exports
  requireRole,
  requireAdmin,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  optionalAuth,
  authRateLimit,
  logoutRateLimit
};
