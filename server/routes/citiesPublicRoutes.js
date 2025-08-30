const express = require("express");
const router = express.Router();
const { getCitiesByCountry } = require("../controllers/dependenciesController");
const { staticDataCache } = require("../middleware/cacheMiddleware");

// Public route - no authentication required
router.get("/", staticDataCache('cities-public'), getCitiesByCountry);

module.exports = router;
