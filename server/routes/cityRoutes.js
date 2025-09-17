const express = require("express");
const router = express.Router();
const cityController = require("../controllers/cityController");
const verifyJWT = require("../middleware/verifyJWT");
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

router
  .route("/")
  .post(cityController.createCity);

router
  .route("/dynamic")
  .post(cityController.createDynamicCity);

router
  .route("/cache-api")
  .post(cityController.cacheApiCity);

router
  .route("/:id")
  .put(cityController.updateCity)
  .delete(cityController.deleteCity);

module.exports = router;
