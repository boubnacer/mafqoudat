const express = require("express");
const router = express.Router();
const countrycontroller = require("../controllers/countryController");
const verifyJWT = require("../middleware/verifyJWT");

// Public routes - no authentication required
router
  .route("/")
  .get(countrycontroller.getCountries);

router
  .route("/search")
  .get(countrycontroller.searchCountries);

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
