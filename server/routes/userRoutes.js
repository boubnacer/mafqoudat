const express = require("express");
const router = express.Router();
const usersController = require("../controllers/usersController");
const verifyJWT = require("../middleware/verifyJWT");

router
  .route("/")
  .get(verifyJWT, usersController.getAllUsers)
  .post(usersController.createNewUser)
  .patch(verifyJWT, usersController.updateUser)
  .delete(verifyJWT, usersController.deleteUser);

router
  .route("/:id")
  .get(verifyJWT, usersController.getUserById);

module.exports = router;
