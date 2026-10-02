const express = require("express");
const router = express.Router();
const { getCategories, getCategoriesWithPosts } = require("../controllers/dependenciesController");
const { staticDataCache } = require("../middleware/cacheMiddleware");
const { staticDataCache: optimizedStaticDataCache } = require("../middleware/optimizedCacheMiddleware");

router.route("/with-posts").get(getCategoriesWithPosts);
router.route("/categories-with-posts").get(getCategoriesWithPosts);
router.route("/").get(optimizedStaticDataCache('categories'), getCategories);

module.exports = router;
