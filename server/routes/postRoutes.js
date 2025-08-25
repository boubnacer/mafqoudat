const express = require("express");
const router = express.Router();
const postsController = require("../controllers/postsController");
const verifyJWT = require("../middleware/verifyJWT");

const { upload, uploadToCloudinaryMiddleware } = require("../middleware/multer");

// Public routes - no authentication required
router.route("/")
  .get(postsController.getAllPosts);

router.route("/filtered").get(postsController.getFilteredPosts);

router.route("/:id").get(postsController.getPost);

// Protected routes - require authentication
router.use(verifyJWT);

// Report route - requires authentication
router.route("/report").post(postsController.submitPostReport);

router
  .route("/")
  .post(upload.single("image"), uploadToCloudinaryMiddleware, postsController.createNewPost)
  .patch(postsController.updatePost)
  .delete(postsController.deletePost);

module.exports = router;
