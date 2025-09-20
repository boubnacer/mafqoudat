const express = require("express");
const router = express.Router();
const { getCategories } = require("../controllers/dependenciesController");
const { staticDataCache } = require("../middleware/cacheMiddleware");
const { staticDataCache: optimizedStaticDataCache } = require("../middleware/optimizedCacheMiddleware");

router.route("/").get(optimizedStaticDataCache('categories'), getCategories);

module.exports = router;
