const express = require("express");
const router = express.Router();
const cityController = require("../controllers/cityController");
const verifyJWT = require("../middleware/verifyJWT");

// Public routes - no authentication required
router
  .route("/")
  .get(cityController.getCities);

router
  .route("/search")
  .get(cityController.searchCities);

router
  .route("/search-name")
  .get(cityController.searchCitiesByName);

router
  .route("/country/:countryId")
  .get(cityController.getCitiesByCountry);

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
