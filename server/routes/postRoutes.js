const express = require("express");
const router = express.Router();
const postsController = require("../controllers/postsController");
const verifyJWT = require("../middleware/verifyJWT");
const { dynamicDataCache, paginatedCache, invalidateCache } = require("../middleware/cacheMiddleware");
const { 
  postsCache, 
  paginatedCache: optimizedPaginatedCache, 
  searchResultsCache,
  invalidateCache: optimizedInvalidateCache 
} = require("../middleware/optimizedCacheMiddleware");

const { upload, uploadToCloudinaryMiddleware } = require("../middleware/multer");

// Public routes - no authentication required (using optimized caching)
router.route("/")
  .get(optimizedPaginatedCache('posts'), postsController.getAllPosts);

router.route("/filtered").get(searchResultsCache('posts-filtered'), postsController.getFilteredPosts);

router.route("/:id").get(postsCache('post-detail'), postsController.getPost);

// Protected routes - require authentication
router.use(verifyJWT);

// Report route - requires authentication
router.route("/report").post(postsController.submitPostReport);

router
  .route("/")
  .post(upload.single("image"), uploadToCloudinaryMiddleware, optimizedInvalidateCache([], 'posts'), postsController.createNewPost)
  .patch(optimizedInvalidateCache([], 'posts'), postsController.updatePost)
  .delete(optimizedInvalidateCache([], 'posts'), postsController.deletePost);


module.exports = router;
