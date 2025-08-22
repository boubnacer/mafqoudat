const express = require("express");
const router = express.Router();
const { getCitiesByCountry } = require("../controllers/dependenciesController");

// Public route - no authentication required
router.route("/").get(getCitiesByCountry);

module.exports = router;
