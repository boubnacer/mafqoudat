const express = require("express");
const router = express.Router();
const authController = require("../controllers/authcontroller");
const { auth: authRateLimit, registration: registrationRateLimit } = require("../middleware/rateLimiting");
const { validateRequest, validationSets } = require("../middleware/validation");
const { verifyJWT } = require("../middleware/jwtSecurity");

// /auth - Login with enhanced validation and rate limiting
router.route("/").post(
  authRateLimit,
  validationSets.userAuth,
  validateRequest,
  authController.login
);

// /auth/refresh - Token refresh
router.route("/refresh").get(authController.refresh);

// /auth/logout - Logout with JWT verification
router.route("/logout").post(verifyJWT, authController.logout);

// /auth/register - User registration with enhanced security
router.route("/register").post(
  registrationRateLimit,
  validationSets.userAuth,
  validateRequest,
  authController.register
);

module.exports = router;
