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

// Protected routes - authentication required
router.use(verifyJWT);

router
  .route("/")
  .post(cityController.createCity);

router
  .route("/dynamic")
  .post(cityController.createDynamicCity);

router
  .route("/:id")
  .put(cityController.updateCity)
  .delete(cityController.deleteCity);

module.exports = router;
