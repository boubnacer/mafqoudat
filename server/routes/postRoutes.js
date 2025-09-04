const express = require("express");
const router = express.Router();
const postsController = require("../controllers/postsController");
const verifyJWT = require("../middleware/verifyJWT");
const { dynamicDataCache, paginatedCache, invalidateCache } = require("../middleware/cacheMiddleware");

const { upload, uploadToCloudinaryMiddleware } = require("../middleware/multer");

// Public routes - no authentication required
router.route("/")
  .get(paginatedCache('posts'), postsController.getAllPosts);

router.route("/filtered").get(dynamicDataCache('posts-filtered'), postsController.getFilteredPosts);

router.route("/:id").get(dynamicDataCache('post-detail'), postsController.getPost);

// Protected routes - require authentication
router.use(verifyJWT);

// Report route - requires authentication
router.route("/report").post(postsController.submitPostReport);

router
  .route("/")
  .post(upload.single("image"), uploadToCloudinaryMiddleware, invalidateCache(['posts:*', 'dashboard:*']), postsController.createNewPost)
  .patch(invalidateCache(['posts:*', 'dashboard:*']), postsController.updatePost)
  .delete(invalidateCache(['posts:*', 'dashboard:*']), postsController.deletePost);


module.exports = router;
