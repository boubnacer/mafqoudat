const express = require("express");
const router = express.Router();
const { createCategory, createFoundLost, getCitiesByCountry } = require("../controllers/dependenciesController");
const verifyJWT = require("../middleware/verifyJWT");
const { staticDataCache } = require("../middleware/cacheMiddleware");

// Public routes - no authentication required
router.get("/cities", staticDataCache('dependencies-cities'), getCitiesByCountry);

// Apply JWT verification to protected routes
router.use(verifyJWT);

// POST /dependencies/category
router.route("/category").post(createCategory);

// POST /dependencies/foundlost
router.route("/foundlost").post(createFoundLost);

module.exports = router; 