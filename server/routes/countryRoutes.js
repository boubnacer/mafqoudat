const express = require("express");
const router = express.Router();
const countrycontroller = require("../controllers/countryController");

router
  .route("/")
  .get(countrycontroller.getCountries)
  .post(countrycontroller.createCountry);

module.exports = router;
