const express = require("express");
const router = express.Router();
const verifyJWT = require("../middleware/verifyJWT");
const verifyAdmin = require("../middleware/verifyAdmin");
const {
  getAllReports,
  getAllPromotions,
  updateReportStatus,
  updatePromotionStatus,
  deletePost,
  getAllPasswordResetRequests,
  updatePasswordResetRequestStatus,
  getAllUsersAdmin,
  getUserPosts,
  adminResetUserPassword,
  deleteUserAdmin,
  getAllPostsAdmin,
  getVisitorStats,
  updatePostStatusAdmin,
  updateUserAdmin,
  getAdminComments,
  updateCommentAdmin,
} = require("../controllers/adminController");
const {
  getAdminOverview,
  getAdminAnalytics,
  getAuditLog,
} = require("../controllers/adminInsightsController");

// All admin routes require authentication and admin role
router.use(verifyJWT);
router.use(verifyAdmin);

/* ---------------------------------------------------------------- insights */

// @route GET /admin/overview
// @desc Everything the panel's Overview page renders, in one request
// @access Private (Admin only)
router.get("/overview", getAdminOverview);

// @route GET /admin/analytics
// @desc Visitor + content analytics over a 7/30/90 day window
// @access Private (Admin only)
router.get("/analytics", getAdminAnalytics);

// @route GET /admin/audit
// @desc The admin audit trail
// @access Private (Admin only)
router.get("/audit", getAuditLog);

// @route GET /admin/visitor-stats
// @desc Visitor statistics
// @access Private (Admin only)
router.get("/visitor-stats", getVisitorStats);

/* ------------------------------------------------------------- moderation */

// @route GET /admin/reports
// @desc Get all reports with pagination and filtering
// @access Private (Admin only)
router.get("/reports", getAllReports);

// @route PATCH /admin/reports/:id
// @desc Update report status
// @access Private (Admin only)
router.patch("/reports/:id", updateReportStatus);

// @route GET /admin/comments
// @desc List site comments for moderation
// @access Private (Admin only)
router.get("/comments", getAdminComments);

// @route PATCH /admin/comments/:id
// @desc Take a comment down, or put it back (soft)
// @access Private (Admin only)
router.patch("/comments/:id", updateCommentAdmin);

/* ------------------------------------------------------------------ posts */

// @route GET /admin/posts
// @desc Get all posts with pagination, search, and filtering
// @access Private (Admin only)
router.get("/posts", getAllPostsAdmin);

// @route PATCH /admin/posts/:id/status
// @desc Change a listing's status without deleting it
// @access Private (Admin only)
router.patch("/posts/:id/status", updatePostStatusAdmin);

// @route DELETE /admin/posts/:id
// @desc Delete a post
// @access Private (Admin only)
router.delete("/posts/:id", deletePost);

// @route GET /admin/promotions
// @desc Get all promotion requests with pagination and filtering
// @access Private (Admin only)
router.get("/promotions", getAllPromotions);

// @route PATCH /admin/promotions/:id
// @desc Update promotion status
// @access Private (Admin only)
router.patch("/promotions/:id", updatePromotionStatus);

/* ------------------------------------------------------------------ users */

// @route GET /admin/users
// @desc Get all users with pagination, search, and sorting
// @access Private (Admin only)
router.get("/users", getAllUsersAdmin);

// @route GET /admin/users/:userId/posts
// @desc Get all posts for a specific user with pagination
// @access Private (Admin only)
router.get("/users/:userId/posts", getUserPosts);

// @route PATCH /admin/users/:userId
// @desc Suspend/restore an account, or change its role
// @access Private (Admin only)
router.patch("/users/:userId", updateUserAdmin);

// @route PATCH /admin/users/:userId/reset-password
// @desc Admin reset user password
// @access Private (Admin only)
router.patch("/users/:userId/reset-password", adminResetUserPassword);

// @route DELETE /admin/users/:userId
// @desc Delete a user and all their posts
// @access Private (Admin only)
router.delete("/users/:userId", deleteUserAdmin);

/* -------------------------------------------------------- support requests */

// @route GET /admin/password-reset-requests
// @desc Get all password reset requests with pagination and filtering
// @access Private (Admin only)
router.get("/password-reset-requests", getAllPasswordResetRequests);

// @route PATCH /admin/password-reset-requests/:id
// @desc Update password reset request status
// @access Private (Admin only)
router.patch("/password-reset-requests/:id", updatePasswordResetRequestStatus);

/* ------------------------------------------------------------ places (cities) */

const cityController = require("../controllers/cityController");

// @route GET /admin/cities/country/:countryId
// @desc Get cities by country (admin only)
// @access Private (Admin only)
router.get("/cities/country/:countryId", cityController.getCitiesByCountry);

// @route PUT /admin/cities/:id
// @desc Update a city (admin only)
// @access Private (Admin only)
router.put("/cities/:id", cityController.updateCity);

// @route DELETE /admin/cities/:id
// @desc Delete a city (admin only)
// @access Private (Admin only)
router.delete("/cities/:id", cityController.deleteCity);

module.exports = router;
