const express = require("express");
const router = express.Router();
const postsController = require("../controllers/postsController");
const verifyJWT = require("../middleware/verifyJWT");

const { upload, uploadToCloudinaryMiddleware } = require("../middleware/multer");

router.use(verifyJWT);

router
  .route("/")
  .get(postsController.getAllPosts)
  .post(upload.single("image"), uploadToCloudinaryMiddleware, postsController.createNewPost)
  .patch(postsController.updatePost)
  .delete(postsController.deletePost);

router.route("/:id").get(postsController.getPost);

router.route("/filtered").get(postsController.getFilteredPosts);

module.exports = router;
