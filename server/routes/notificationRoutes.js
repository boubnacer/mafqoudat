const express = require("express");
const router = express.Router();
const notificationsController = require("../controllers/notificationsController");
const { verifyJWT } = require("../middleware/jwtSecurity");
const { commonValidations, validateRequest } = require("../middleware/validation");
const { createRateLimiter } = require("../middleware/rateLimiting");

// Keyed by the authenticated user rather than by IP - on this platform's
// CGNAT-heavy networks, IP keying throttles unrelated people together.
// Everything below runs after verifyJWT, so `req.user` is always set.
//
// This used to be the only limiter that keyed correctly: the shared
// userActionRateLimiter read `req.user?.id`, which is undefined on the id
// string verifyJWT actually assigns, so it silently degraded to IP keying.
// That is fixed at the source now (utils/requestUser.js), and this local
// limiter is kept for its own window and message rather than as a workaround.
const notificationActionLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: (req) => (req.user ? `user:${req.user}` : `ip:${req.ip}`),
  message: "Too many notification actions, please slow down",
});

// Nothing in this router is public: notifications and match leads are personal
// data, and every handler scopes its query to req.user.
router.use(verifyJWT);

// Polled by the navbar bell, so it is deliberately the cheapest route here.
router.get("/unread-count", notificationsController.getUnreadCount);

// Match pairs. Declared before the "/:id" routes below so their literal
// "matches" segment is never swallowed by the id parameter.
router.get("/matches", notificationsController.getMyMatches);

router.get(
  "/matches/post/:postId",
  commonValidations.objectId('postId'),
  validateRequest,
  notificationsController.getMatchesForPost
);

router.patch(
  "/matches/:matchId/dismiss",
  notificationActionLimiter,
  commonValidations.objectId('matchId'),
  validateRequest,
  notificationsController.dismissMatch
);

// Preferences.
router.get("/preferences", notificationsController.getPreferences);
router.patch("/preferences", notificationActionLimiter, notificationsController.updatePreferences);

// Inbox.
router.get("/", notificationsController.listNotifications);
router.patch("/read-all", notificationActionLimiter, notificationsController.markAllAsRead);

router.patch(
  "/:id/read",
  commonValidations.objectId('id'),
  validateRequest,
  notificationsController.markAsRead
);

router.delete(
  "/:id",
  commonValidations.objectId('id'),
  validateRequest,
  notificationsController.dismissNotification
);

module.exports = router;
