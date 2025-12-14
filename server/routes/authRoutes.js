const express = require("express");
const router = express.Router();
const authController = require("../controllers/authcontroller");
const usersController = require("../controllers/usersController");
const { auth: authRateLimit, registration: registrationRateLimit, logout: logoutRateLimit } = require("../middleware/rateLimiting");
const { validateRequest, validationSets } = require("../middleware/validation");
const { verifyJWT } = require("../middleware/jwtSecurity");
const { authErrorMiddleware, asyncAuthHandler, checkAuthRateLimit } = require("../middleware/simpleAuthErrorHandler");

// /auth - Login with enhanced validation and rate limiting
router.route("/").post(
  authRateLimit,
  validationSets.userLogin,
  validateRequest,
  asyncAuthHandler(authController.login)
);

// /auth/logout - Logout with JWT verification
router.route("/logout").post(logoutRateLimit, verifyJWT, asyncAuthHandler(authController.logout));

// /auth/register - User registration with enhanced security
router.route("/register").post(
  registrationRateLimit,
  validationSets.userRegistration,
  validateRequest,
  asyncAuthHandler(usersController.createNewUser)
);

// Auth error handling is now done at server level

module.exports = router;
