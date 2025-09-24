const express = require("express");
const router = express.Router();
const authController = require("../controllers/authcontroller");
const usersController = require("../controllers/usersController");
const { auth: authRateLimit, registration: registrationRateLimit, refreshToken: refreshTokenRateLimit, logout: logoutRateLimit } = require("../middleware/rateLimiting");
const { validateRequest, validationSets } = require("../middleware/validation");
const { verifyJWT, verifyRefreshToken } = require("../middleware/jwtSecurity");
const { authErrorMiddleware, asyncAuthHandler, checkAuthRateLimit } = require("../middleware/authErrorHandler");

// /auth - Login with enhanced validation and rate limiting
router.route("/").post(
  authRateLimit,
  validationSets.userLogin,
  validateRequest,
  asyncAuthHandler(authController.login)
);

// /auth/refresh - Token refresh with rate limiting
router.route("/refresh").get(refreshTokenRateLimit, asyncAuthHandler(authController.refresh));

// /auth/logout - Logout with JWT verification (refresh token verification is optional)
router.route("/logout").post(logoutRateLimit, verifyJWT, asyncAuthHandler(authController.logout));

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
