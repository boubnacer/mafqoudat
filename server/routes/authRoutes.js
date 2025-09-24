const express = require("express");
const router = express.Router();
const authController = require("../controllers/authcontroller");
const usersController = require("../controllers/usersController");
const { auth: authRateLimit, registration: registrationRateLimit } = require("../middleware/rateLimiting");
const { validateRequest, validationSets } = require("../middleware/validation");
const { verifyJWT } = require("../middleware/jwtSecurity");

// /auth - Login with enhanced validation and rate limiting
router.route("/").post(
  authRateLimit,
  validationSets.userLogin,
  validateRequest,
  authController.login
);

// /auth/refresh - Token refresh
router.route("/refresh").get(authController.refresh);

// /auth/logout - Logout with JWT verification
router.route("/logout").post(verifyJWT, authController.logout);

// /auth/logout-fallback - Logout fallback for expired/invalid tokens
router.route("/logout-fallback").post(authController.logoutFallback);

// /auth/register - User registration with enhanced security
router.route("/register").post(
  registrationRateLimit,
  validationSets.userRegistration,
  validateRequest,
  usersController.createNewUser
);

module.exports = router;
