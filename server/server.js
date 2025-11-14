require("dotenv").config();
require("express-async-errors");
const express = require("express");
const app = express();
const path = require("path");
const { logger, logEvents } = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");
const { 
  resilientErrorHandler, 
  memoryMonitoring, 
  requestTimeout: resilientRequestTimeout,
  gracefulShutdownHandler 
} = require("./middleware/resilientErrorHandler");
const { authErrorMiddleware } = require("./middleware/authErrorHandler");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const corsOptions = require("./config/corsOptions");
const { connectDB, disconnectDB, getConnectionMetrics } = require("./config/resilientDbConn");
const session = require("express-session");
const passport = require("./config/passport");

// Security middleware imports
const { 
  securityHeaders, 
  requestSizeLimiter, 
  requestTimeout, 
  requestLogger, 
  apiSecurityHeaders 
} = require("./middleware/securityHeaders");
const { sanitizeInput } = require("./middleware/validation");
const { general: generalRateLimit, dynamicRateLimiter } = require("./middleware/rateLimiting");
const dbSecurity = require("./middleware/dbSecurity");
// Use unified cache system only
const { initRedis, scheduleCacheWarming } = require("./config/unifiedCache");

// Initialize database monitoring
const { dbMonitor } = require("./utils/dbMonitor");
const mongoose = require("mongoose");
const helmet = require("helmet");
const compression = require("compression");
const { enhancedCompressionMiddleware } = require("./middleware/enhancedCompression");
const { memoryOptimizer } = require("./utils/memoryOptimizer");
const PORT = process.env.PORT || 3500;

// Environment: process.env.NODE_ENV

// Suppress deprecation warnings in production
if (process.env.NODE_ENV === 'production') {
    process.removeAllListeners('warning');
    process.on('warning', (warning) => {
        // Only log critical warnings, suppress deprecation warnings
        if (warning.name !== 'DeprecationWarning') {
            console.warn(warning.name + ': ' + warning.message);
        }
    });
}

// Error handling for uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Enhanced graceful shutdown with metrics
const gracefulShutdown = async (signal) => {
  console.log(`${signal} received, shutting down gracefully`);
  
  try {
    // Stop database monitoring
    dbMonitor.stopMonitoring();
    
    // Final connection metrics logged
    
    // Close database connection gracefully
    await disconnectDB();
    
    // Close server
    if (server) {
      server.close(() => {
        console.log('✅ Server closed successfully');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Connect to database with error handling
connectDB().catch(err => {
  console.error('Failed to connect to database:', err);
  process.exit(1);
});

// Initialize unified Redis cache
initRedis().catch(err => {
  console.error('Failed to initialize unified Redis cache:', err);
  // Don't exit process, continue with in-memory cache only
});

// Schedule cache warming for optimized cache
scheduleCacheWarming();

// Enhanced security middleware
app.use(securityHeaders);
app.use(apiSecurityHeaders);
app.use(requestSizeLimiter);
app.use(requestLogger);

// Input sanitization
app.use(sanitizeInput);

// Database security
app.use(dbSecurity.validateQuery);

// Enhanced compression middleware with smart optimization
app.use(...enhancedCompressionMiddleware({
  logLargeResponses: process.env.NODE_ENV === 'development',
  largeResponseThreshold: 1024 * 1024, // 1MB
  enableMetrics: true
}));

app.use(logger);

// Resilience middleware
app.use(memoryMonitoring);
app.use(requestTimeout(30000)); // 30 second timeout

// CORS
app.use(cors(corsOptions));

// Rate limiting
app.use(generalRateLimit);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(cookieParser());

// Session configuration for OAuth
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport for OAuth
app.use(passport.initialize());
app.use(passport.session());

// Serve static files
app.use("/", express.static(path.join(__dirname, "public")));

// Authentication error handling (must come before routes)
app.use('/auth', authErrorMiddleware);

// Maintenance mode middleware (after auth setup, before routes)
const maintenanceMode = require("./middleware/maintenanceMode");
app.use(maintenanceMode);

// API routes
app.use("/", require("./routes/root"));
app.use("/dashboard", require("./routes/dashRoutes"));
app.use("/auth", require("./routes/authRoutes"));
app.use("/auth", require("./routes/googleAuthRoutes"));
app.use("/users", require("./routes/userRoutes"));
app.use("/posts", require("./routes/postRoutes"));
app.use("/countries", require("./routes/countryRoutes"));
app.use("/cities", require("./routes/cityRoutes"));
app.use("/floptions", require("./routes/flOptionsRoutes"));
app.use("/categories", require("./routes/categoryRoute"));
app.use("/contact", require("./routes/contactRoutes"));
app.use("/cities-public", require("./routes/citiesPublicRoutes"));
app.use("/dependencies", require("./routes/dependenciesRoutes"));
app.use("/cities-api", require("./routes/citiesRoutes"));

app.use("/promotion", require("./routes/promotionRoutes"));
app.use("/admin", require("./routes/adminRoutes"));
app.use("/system-settings", require("./routes/systemSettingsRoutes"));
app.use("/api/system", require("./routes/systemRoutes"));

// Request logger middleware - logs ALL requests
app.use((req, res, next) => {
  // Password reset request logging disabled for production
  next();
});

// Password reset routes - logging to verify it's loaded
// Password reset routes loaded
app.use("/api/password-reset", require("./routes/passwordResetRoutes"));

app.use("/cost-monitoring", require("./routes/costMonitoringRoutes"));
app.use("/resilience", require("./routes/resilienceRoutes"));

// Database health and monitoring routes
app.use("/db-health", require("./routes/dbHealthRoutes"));

// Unified cache management routes
app.get("/cache/stats", async (req, res) => {
  try {
    const { unifiedCacheService } = require("./config/unifiedCache");
    const stats = unifiedCacheService.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete("/cache/clear", async (req, res) => {
  try {
    const { unifiedCacheService } = require("./config/unifiedCache");
    const { confirm } = req.query;
    if (confirm !== 'true') {
      return res.status(400).json({ 
        success: false, 
        message: 'Please add ?confirm=true to clear cache' 
      });
    }
    await unifiedCacheService.clear(true);
    res.json({ success: true, message: 'Cache cleared successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/cache/warm", async (req, res) => {
  try {
    const { warmCache } = require("./config/unifiedCache");
    const result = await warmCache();
    res.json({ 
      success: result, 
      message: result ? 'Cache warming completed' : 'Cache warming failed' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/cache/health", async (req, res) => {
  try {
    const { unifiedCacheService } = require("./config/unifiedCache");
    const health = await unifiedCacheService.healthCheck();
    res.json({ success: true, data: health });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Memory monitoring endpoints
app.get("/memory/stats", async (req, res) => {
  try {
    const stats = memoryOptimizer.getMemoryStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/memory/optimize", async (req, res) => {
  try {
    const stats = await memoryOptimizer.optimizeMemory();
    res.json({ success: true, data: stats, message: 'Memory optimization completed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/memory/report", async (req, res) => {
  try {
    const reportPath = await memoryOptimizer.exportMemoryReport();
    if (reportPath) {
      res.json({ success: true, message: 'Memory report exported', path: reportPath });
    } else {
      res.status(500).json({ success: false, message: 'Failed to export memory report' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin routes removed for security

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check endpoint for deployment monitoring
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    version: process.env.npm_package_version || "1.0.0"
  });
});

// Test endpoint for debugging
app.post("/test-post", (req, res) => {
  res.status(200).json({ 
    message: "Test endpoint working",
    body: req.body,
    timestamp: new Date().toISOString()
  });
});

// Specific test for /api/* routes
app.post("/api/test", (req, res) => {
  res.status(200).json({ 
    message: "API POST route working",
    body: req.body,
    timestamp: new Date().toISOString()
  });
});

// API-only server - frontend will be deployed separately
app.all("*", (req, res) => {
  res.status(404);
  if (req.accepts("json")) {
    res.json({ 
      message: "404 Not Found",
      error: "This is the API server. Frontend should be accessed separately.",
      availableEndpoints: [
        "/health",
        "/auth",
        "/users", 
        "/posts",
        "/countries",
        "/categories",
        "/dependencies",
        "/reports"
      ]
    });
  } else {
    res.type("txt").send("404 Not Found - API Server");
  }
});

// Enhanced error handling with resilience
app.use(resilientErrorHandler);

// Start server after MongoDB connection is established
let server;
mongoose.connection.once("open", () => {
  console.log("Connected to MongoDB");
  server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});

mongoose.connection.on("error", (err) => {
  console.log(err);
  logEvents(
    `${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`,
    "mongoErrLog.log"
  );
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  if (server) {
    server.close(() => {
      console.log('Server closed');
      mongoose.connection.close(() => {
        console.log('MongoDB connection closed');
        process.exit(0);
      });
    });
  } else {
    process.exit(0);
  }
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  if (server) {
    server.close(() => {
      console.log('Server closed');
      mongoose.connection.close(() => {
        console.log('MongoDB connection closed');
        process.exit(0);
      });
    });
  } else {
    process.exit(0);
  }
});
