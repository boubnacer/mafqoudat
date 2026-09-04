const express = require("express");
const router = express.Router();
const authController = require("../controllers/authcontroller");
const usersController = require("../controllers/usersController");
const { auth: authRateLimit, refresh: refreshRateLimit, registration: registrationRateLimit, logout: logoutRateLimit } = require("../middleware/rateLimiting");
const { validateRequest, validationSets } = require("../middleware/validation");
const { authErrorMiddleware, asyncAuthHandler, checkAuthRateLimit } = require("../middleware/simpleAuthErrorHandler");
const { requireClientHeader } = require("../middleware/csrfGuard");
const { consumeExchangeCode } = require("../utils/oauthExchange");

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
// requireClientHeader: these two are the only routes that authenticate from
// the SameSite=None refresh cookie alone, so they are the only ones a
// cross-site form post could drive - see middleware/csrfGuard.js.
router.route("/refresh").post(requireClientHeader, refreshRateLimit, asyncAuthHandler(authController.refresh));

// /auth/logout - No verifyJWT: logout must succeed with an expired access
// token too, or the refresh session it should revoke outlives it. The handler
// verifies whatever Bearer token is presented itself.
router.route("/logout").post(requireClientHeader, logoutRateLimit, asyncAuthHandler(authController.logout));

// /auth/mobile-exchange - Redeem the one-time code an OAuth browser flow
// hands back through its redirect, for the actual tokens. The tokens never
// travel in a URL - the mobile deep link for the reason in the name (every
// request's full query string is written to disk unredacted, see
// middleware/logger.js), the web `/auth/callback?code=` redirect for
// consistency with it (the access token there is short-lived, but still
// landed in browser history). Provider- and platform-agnostic despite the
// name: Google and Facebook both mint codes from the same store for both
// their mobile and web success paths (see utils/oauthExchange.js).
// Rate-limited with the refresh limiter rather than the strict `auth` one: a
// legitimate client only ever calls this once per sign-in, but a failure here
// must not lock the same IP out of the login form.
router.route("/mobile-exchange").post(refreshRateLimit, (req, res) => {
  const tokens = consumeExchangeCode(req.body?.code);

  if (!tokens) {
    return res.status(400).json({
      message: "Invalid or expired exchange code",
      isError: true,
      code: "INVALID_EXCHANGE_CODE",
      timestamp: new Date().toISOString(),
    });
  }

  return res.json({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  });
});

// /auth/register - User registration with enhanced security
router.route("/register").post(
  registrationRateLimit,
  validationSets.userRegistration,
  validateRequest,
  asyncAuthHandler(usersController.createNewUser)
);

// Auth error handling is now done at server level

module.exports = router;
