const express = require("express");
const router = express.Router();
const { getCategories } = require("../controllers/dependenciesController");

router.route("/").get(getCategories);

module.exports = router;
