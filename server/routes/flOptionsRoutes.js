const express = require("express");
const router = express.Router();
const { getflOptions } = require("../controllers/dependenciesController");
const { staticDataCache } = require("../middleware/cacheMiddleware");
const { staticDataCache: optimizedStaticDataCache } = require("../middleware/optimizedCacheMiddleware");

router.route("/").get(optimizedStaticDataCache('foundlost'), getflOptions);

module.exports = router;
