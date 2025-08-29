const express = require("express");
const { getDashboard } = require("../controllers/dependenciesController");
const router = express.Router();
const verifyJWT = require("../middleware/verifyJWT");
const { dashboardCache } = require("../middleware/cacheMiddleware");

// Public route - no authentication required
router.route("/").get(dashboardCache('dashboard'), getDashboard);

// Protected routes - require authentication

// Add any protected dashboard routes here if needed
// If you need protected dashboard routes, add them individually with verifyJWT middleware

module.exports = router;
