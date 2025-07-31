const express = require("express");
const router = express.Router();
const countrycontroller = require("../controllers/countryController");

router
  .route("/")
  .get(countrycontroller.getCountries)
  .post(countrycontroller.createCountry);

router
  .route("/search")
  .get(countrycontroller.searchCountries);

router
  .route("/:id")
  .put(countrycontroller.updateCountry)
  .delete(countrycontroller.deleteCountry);

module.exports = router;
