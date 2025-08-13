const express = require("express");
const { getDashboard } = require("../controllers/dependenciesController");
const router = express.Router();
const verifyJWT = require("../middleware/verifyJWT");

// Public route - no authentication required
router.route("/").get(getDashboard);

// Protected routes - require authentication
router.use(verifyJWT);

// Add any protected dashboard routes here if needed

module.exports = router;
