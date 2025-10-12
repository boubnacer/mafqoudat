const jwt = require("jsonwebtoken");
const User = require("../models/User");
const SystemSettings = require("../models/SystemSettings");
const { logEvents } = require("./logger");

/**
 * Maintenance Mode Middleware
 * Priority: Database setting > Environment variable
 * Checks database first with 10-second caching, falls back to environment variable
 * Allows admin users to bypass maintenance mode for system management
 */

// Cache for database maintenance mode check (10 second TTL)
let maintenanceCache = {
  data: null,
  timestamp: 0,
  ttl: 10000 // 10 seconds in milliseconds
};

/**
 * Check if maintenance mode is active
 * Priority: Database > Environment Variable
 */
const checkMaintenanceMode = async () => {
  const now = Date.now();
  
  // Return cached result if still valid
  if (maintenanceCache.data !== null && (now - maintenanceCache.timestamp) < maintenanceCache.ttl) {
    return maintenanceCache.data;
  }

  try {
    // Try to get maintenance mode from database
    const settings = await SystemSettings.getInstance();
    
    const result = {
      isActive: settings.maintenanceMode.isActive,
      message: settings.maintenanceMode.message,
      estimatedReturn: settings.maintenanceMode.estimatedReturn,
      source: 'database'
    };

    // Cache the result
    maintenanceCache.data = result;
    maintenanceCache.timestamp = now;
    
    return result;
  } catch (dbError) {
    // Database query failed, fall back to environment variable
    const envMaintenanceMode = process.env.MAINTENANCE_MODE === 'true';
    
    const result = {
      isActive: envMaintenanceMode,
      message: "We're currently performing scheduled maintenance. We'll be back soon! Thank you for your patience.",
      estimatedReturn: "soon",
      source: 'environment'
    };

    // Cache the fallback result for a shorter time (5 seconds)
    maintenanceCache.data = result;
    maintenanceCache.timestamp = now;
    maintenanceCache.ttl = 5000; // Shorter TTL for fallback

    return result;
  }
};

const maintenanceMode = async (req, res, next) => {
  try {
    // Check maintenance mode (database first, then environment variable)
    const maintenanceStatus = await checkMaintenanceMode();

    // If maintenance mode is not active, continue normally
    if (!maintenanceStatus.isActive) {
      return next();
    }

    // PRIORITY 1: Check if user is authenticated and is an admin FIRST
    // Admins should be able to access ALL routes during maintenance
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];

      try {
        // Verify JWT token
        const decoded = await new Promise((resolve, reject) => {
          jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) reject(err);
            else resolve(decoded);
          });
        });

        // Get user ID from decoded token
        const userId = decoded.UserInfo?.usernameId;

        if (userId) {
          // Fetch user from database to check role
          const user = await User.findById(userId).select('role username').lean();

          if (user && user.role === 'admin') {
            // Admin user can bypass maintenance mode for ALL routes
            logEvents(
              `MAINTENANCE_ADMIN_BYPASS\t${user.username}\t${req.method}\t${req.path}`,
              "reqLog.log"
            );
            return next();
          }
        }
      } catch (tokenError) {
        // Token verification failed, continue to check excluded routes
      }
    }

    // PRIORITY 2: Check excluded routes (for non-admin users)
    const excludedRoutes = [
      '/health',
      '/auth',
      '/api/password-reset'
    ];

    // Check if current route should be excluded
    const isExcluded = excludedRoutes.some(route => {
      if (route.endsWith('*')) {
        // Handle wildcard routes
        const baseRoute = route.slice(0, -1);
        return req.path.startsWith(baseRoute);
      }
      return req.path.startsWith(route);
    });

    // Allow excluded routes to bypass maintenance mode
    if (isExcluded) {
      return next();
    }

    // PRIORITY 3: Block non-admin or unauthenticated users
    const origin = req.headers.origin || req.headers.referer || "Unknown";
    
    logEvents(
      `MAINTENANCE_BLOCKED\t${req.method}\t${req.path}\t${origin}\tSource: ${maintenanceStatus.source}`,
      "reqLog.log"
    );

    return res.status(503).json({
      maintenanceMode: true,
      message: maintenanceStatus.message,
      estimatedReturn: maintenanceStatus.estimatedReturn
    });

  } catch (error) {
    // Log error but don't expose internal details
    logEvents(
      `MAINTENANCE_ERROR\t${error.message}\t${req.method}\t${req.path}`,
      "errLog.log"
    );

    // In case of error, check environment variable as last resort
    const envMaintenanceMode = process.env.MAINTENANCE_MODE === 'true';
    
    if (envMaintenanceMode) {
      return res.status(503).json({
        maintenanceMode: true,
        message: "We're currently performing scheduled maintenance. We'll be back soon! Thank you for your patience.",
        estimatedReturn: "soon"
      });
    }
    
    // If no maintenance mode detected, allow access (fail open)
    return next();
  }
};

module.exports = maintenanceMode;

