const express = require("express");
const router = express.Router();
const cityController = require("../controllers/cityController");
const verifyJWT = require("../middleware/verifyJWT");
const verifyAdmin = require("../middleware/verifyAdmin");
const { staticDataCache } = require("../middleware/cacheMiddleware");

// Public routes - no authentication required
router
  .route("/")
  .get(staticDataCache('cities'), cityController.getCities);

router
  .route("/search")
  .get(staticDataCache('cities-search'), cityController.searchCities);

router
  .route("/search-name")
  .get(staticDataCache('cities-search-name'), cityController.searchCitiesByName);

router
  .route("/country/:countryId")
  .get(staticDataCache('cities-by-country'), cityController.getCitiesByCountry);

router
  .route("/geonames-stats")
  .get(cityController.getGeonamesStats);

// Protected routes - authentication required
router.use(verifyJWT);

// Called by any signed-in user while creating or editing a post: the city
// picker creates/caches the chosen city when it is not already in the
// database (NewPostForm.js / EditPostForm.js -> createCustomCity).
router
  .route("/dynamic")
  .post(cityController.createDynamicCity);

router
  .route("/cache-api")
  .post(cityController.cacheApiCity);

// Admin-only routes - direct catalogue management, no regular-user caller.
router
  .route("/")
  .post(verifyAdmin, cityController.createCity);

router
  .route("/:id")
  .put(verifyAdmin, cityController.updateCity)
  .delete(verifyAdmin, cityController.deleteCity);

module.exports = router;
