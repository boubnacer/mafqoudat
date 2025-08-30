const express = require("express");
const router = express.Router();
const { getCitiesByCountry } = require("../controllers/dependenciesController");
const { staticDataCache } = require("../middleware/cacheMiddleware");

// Public route - no authentication required
router.route("/").get(staticDataCache('cities-simple'), getCitiesByCountry);

module.exports = router;
