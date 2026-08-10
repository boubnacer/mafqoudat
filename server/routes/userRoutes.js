const express = require("express");
const router = express.Router();
const usersController = require("../controllers/usersController");
const verifyJWT = require("../middleware/verifyJWT");
const verifyAdmin = require("../middleware/verifyAdmin");

// Self-service account deletion (Google Play User Data policy). Declared before
// the "/:id" routes so "me" is never swallowed as an id, and deliberately the
// only delete path a normal user can reach - it targets req.user and ignores
// any id in the body.
router
  .route("/me")
  .delete(verifyJWT, usersController.deleteMyAccount);

// User blocking (Google Play UGC policy: reporting content is not enough on its
// own, a user must also be able to block another user). Scoped to the caller
// the same way /me is - the blocker is always req.user.
router
  .route("/me/blocks")
  .get(verifyJWT, usersController.getBlockedUsers)
  .post(verifyJWT, usersController.blockUser);

router
  .route("/me/blocks/:userId")
  .delete(verifyJWT, usersController.unblockUser);

router
  .route("/")
  // Returns every user's email and role, so it is an admin tool, not a
  // signed-in-user tool.
  .get(verifyJWT, verifyAdmin, usersController.getAllUsers)
  .post(usersController.createNewUser)
  // Ownership is enforced inside updateUser (id must equal req.user).
  .patch(verifyJWT, usersController.updateUser)
  // Deleting an arbitrary user by body id is a moderation action.
  .delete(verifyJWT, verifyAdmin, usersController.deleteUser);

router
  .route("/:id")
  // Ownership is enforced inside getUserById (self, or admin).
  .get(verifyJWT, usersController.getUserById);

module.exports = router;
