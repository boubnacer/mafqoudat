const express = require("express");
const router = express.Router();
const countrycontroller = require("../controllers/countryController");
const verifyJWT = require("../middleware/verifyJWT");
const { staticDataCache } = require("../middleware/cacheMiddleware");
const { staticDataCache: optimizedStaticDataCache } = require("../middleware/optimizedCacheMiddleware");

// Public routes - no authentication required (using optimized caching)
router
  .route("/")
  .get(optimizedStaticDataCache('countries'), countrycontroller.getCountries);

router
  .route("/search")
  .get(staticDataCache('countries-search'), countrycontroller.searchCountries);

// Protected routes - require authentication for admin operations
router.use(verifyJWT);

router
  .route("/")
  .post(countrycontroller.createCountry);

router
  .route("/:id")
  .put(countrycontroller.updateCountry)
  .delete(countrycontroller.deleteCountry);

module.exports = router;
