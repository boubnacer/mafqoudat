const express = require("express");
const router = express.Router();
const countrycontroller = require("../controllers/countryController");
const verifyJWT = require("../middleware/verifyJWT");
const verifyAdmin = require("../middleware/verifyAdmin");
const { staticDataCache } = require("../middleware/cacheMiddleware");
const { staticDataCache: optimizedStaticDataCache } = require("../middleware/optimizedCacheMiddleware");

// Public routes - no authentication required (using optimized caching)
router
  .route("/")
  .get(optimizedStaticDataCache('countries'), countrycontroller.getCountries);

router
  .route("/search")
  .get(staticDataCache('countries-search'), countrycontroller.searchCountries);

// Admin-only routes - require authentication and admin privileges
router.use(verifyJWT);

router
  .route("/")
  .post(verifyAdmin, countrycontroller.createCountry);

router
  .route("/:id")
  .put(verifyAdmin, countrycontroller.updateCountry)
  .delete(verifyAdmin, countrycontroller.deleteCountry);

module.exports = router;
