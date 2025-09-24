const express = require("express");
const router = express.Router();
const authController = require("../controllers/authcontroller");
const usersController = require("../controllers/usersController");
const { auth: authRateLimit, registration: registrationRateLimit } = require("../middleware/rateLimiting");
const { validateRequest, validationSets } = require("../middleware/validation");
const { verifyJWT } = require("../middleware/jwtSecurity");
const { authErrorMiddleware, asyncAuthHandler, checkAuthRateLimit } = require("../middleware/authErrorHandler");

// /auth - Login with enhanced validation and rate limiting
router.route("/").post(
  authRateLimit,
  checkAuthRateLimit,
  validationSets.userLogin,
  validateRequest,
  asyncAuthHandler(authController.login)
);

// /auth/refresh - Token refresh
router.route("/refresh").get(asyncAuthHandler(authController.refresh));

// /auth/logout - Logout with JWT verification
router.route("/logout").post(verifyJWT, asyncAuthHandler(authController.logout));

// /auth/logout-fallback - Logout fallback for expired/invalid tokens
router.route("/logout-fallback").post(asyncAuthHandler(authController.logoutFallback));

// /auth/register - User registration with enhanced security
router.route("/register").post(
  registrationRateLimit,
  validationSets.userRegistration,
  validateRequest,
  asyncAuthHandler(usersController.createNewUser)
);

module.exports = router;
