const express = require("express");
const router = express.Router();
const { getCategories } = require("../controllers/dependenciesController");
const { staticDataCache } = require("../middleware/cacheMiddleware");

router.route("/").get(staticDataCache('categories'), getCategories);

module.exports = router;
