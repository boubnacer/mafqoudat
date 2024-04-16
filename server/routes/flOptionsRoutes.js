const express = require("express");
const router = express.Router();
const { getflOptions } = require("../controllers/dependenciesController");

router.route("/").get(getflOptions);

module.exports = router;
