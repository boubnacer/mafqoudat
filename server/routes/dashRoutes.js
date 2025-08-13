const express = require("express");
const { getDashboard } = require("../controllers/dependenciesController");
const router = express.Router();
const verifyJWT = require("../middleware/verifyJWT");

// Public route - no authentication required
router.route("/").get(getDashboard);

// Protected routes - require authentication
// router.use(verifyJWT); // Commented out to allow public access

// Add any protected dashboard routes here if needed
// If you need protected dashboard routes, add them individually with verifyJWT middleware

module.exports = router;
