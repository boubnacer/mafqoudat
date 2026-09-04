const express = require("express");
const router = express.Router();
const authController = require("../controllers/authcontroller");
const usersController = require("../controllers/usersController");
const { auth: authRateLimit, refresh: refreshRateLimit, registration: registrationRateLimit, logout: logoutRateLimit } = require("../middleware/rateLimiting");
const { validateRequest, validationSets } = require("../middleware/validation");
const { authErrorMiddleware, asyncAuthHandler, checkAuthRateLimit } = require("../middleware/simpleAuthErrorHandler");

// /auth - Login with enhanced validation and rate limiting
router.route("/").post(
  authRateLimit,
  validationSets.userLogin,
  validateRequest,
  asyncAuthHandler(authController.login)
);

// /auth/refresh - Exchange a refresh token (httpOnly cookie on web, body on
// mobile) for a fresh access token. Authenticates via the refresh token
// itself, so no verifyJWT - the whole point is that the access token may
// already be expired.
router.route("/refresh").post(refreshRateLimit, asyncAuthHandler(authController.refresh));

// /auth/logout - No verifyJWT: logout must succeed with an expired access
// token too, or the refresh session it should revoke outlives it. The handler
// verifies whatever Bearer token is presented itself.
router.route("/logout").post(logoutRateLimit, asyncAuthHandler(authController.logout));

// /auth/register - User registration with enhanced security
router.route("/register").post(
  registrationRateLimit,
  validationSets.userRegistration,
  validateRequest,
  asyncAuthHandler(usersController.createNewUser)
);

// Auth error handling is now done at server level

module.exports = router;
