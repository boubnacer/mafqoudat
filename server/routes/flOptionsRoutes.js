const express = require("express");
const router = express.Router();
const { getflOptions } = require("../controllers/dependenciesController");
const { staticDataCache } = require("../middleware/cacheMiddleware");

router.route("/").get(staticDataCache('fl-options'), getflOptions);

module.exports = router;
