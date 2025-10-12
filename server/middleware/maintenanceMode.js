const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { logEvents } = require("./logger");

/**
 * Maintenance Mode Middleware
 * Blocks non-admin users when MAINTENANCE_MODE is set to 'true'
 * Allows admin users to bypass maintenance mode for system management
 */
const maintenanceMode = async (req, res, next) => {
  try {
    // Check if maintenance mode is enabled
    const isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true';

    // If maintenance mode is not active, continue normally
    if (!isMaintenanceMode) {
      return next();
    }

    // Define routes that should be excluded from maintenance checks
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

    // Log maintenance mode access attempt
    const origin = req.headers.origin || req.headers.referer || "Unknown";
    logEvents(
      `MAINTENANCE_ACCESS_ATTEMPT\t${req.method}\t${req.path}\t${origin}`,
      "reqLog.log"
    );

    // Check if user is authenticated and is an admin
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
            // Admin user can bypass maintenance mode
            logEvents(
              `MAINTENANCE_ADMIN_BYPASS\t${user.username}\t${req.method}\t${req.path}`,
              "reqLog.log"
            );
            console.log(`🔧 Maintenance Mode: Admin user '${user.username}' bypassed maintenance mode`);
            return next();
          }
        }
      } catch (tokenError) {
        // Token verification failed, treat as non-authenticated user
        console.log('Maintenance Mode: Invalid token during maintenance mode check');
      }
    }

    // Non-admin or unauthenticated user - return maintenance mode message
    console.log(`🚧 Maintenance Mode: Blocking access to ${req.method} ${req.path}`);
    
    logEvents(
      `MAINTENANCE_BLOCKED\t${req.method}\t${req.path}\t${origin}`,
      "reqLog.log"
    );

    return res.status(503).json({
      maintenanceMode: true,
      message: "We're currently performing scheduled maintenance. We'll be back soon! Thank you for your patience.",
      estimatedReturn: "soon"
    });

  } catch (error) {
    // Log error but don't expose internal details
    console.error('Maintenance Mode Middleware Error:', error);
    logEvents(
      `MAINTENANCE_ERROR\t${error.message}\t${req.method}\t${req.path}`,
      "errLog.log"
    );

    // In case of error, fail safely by showing maintenance page
    return res.status(503).json({
      maintenanceMode: true,
      message: "We're currently performing scheduled maintenance. We'll be back soon! Thank you for your patience.",
      estimatedReturn: "soon"
    });
  }
};

module.exports = maintenanceMode;

