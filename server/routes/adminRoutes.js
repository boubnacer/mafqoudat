const express = require("express");
const router = express.Router();
const verifyJWT = require("../middleware/verifyJWT");
const verifyAdmin = require("../middleware/verifyAdmin");
const {
  getAllReports,
  getAllPromotions,
  updateReportStatus,
  updatePromotionStatus,
  getAdminDashboard,
  deletePost,
  getAllPasswordResetRequests,
  updatePasswordResetRequestStatus,
  getAllUsersAdmin,
  getUserPosts,
  adminResetUserPassword,
  deleteUserAdmin,
  getAllPostsAdmin,
  getVisitorStats,
} = require("../controllers/adminController");

// All admin routes require authentication and admin role
router.use(verifyJWT);
router.use(verifyAdmin);

// @route GET /admin/dashboard
// @desc Get admin dashboard statistics
// @access Private (Admin only)
router.get("/dashboard", getAdminDashboard);

// @route GET /admin/reports
// @desc Get all reports with pagination and filtering
// @access Private (Admin only)
router.get("/reports", getAllReports);

// @route PATCH /admin/reports/:id
// @desc Update report status
// @access Private (Admin only)
router.patch("/reports/:id", updateReportStatus);

// @route GET /admin/promotions
// @desc Get all promotion requests with pagination and filtering
// @access Private (Admin only)
router.get("/promotions", getAllPromotions);

// @route PATCH /admin/promotions/:id
// @desc Update promotion status
// @access Private (Admin only)
router.patch("/promotions/:id", updatePromotionStatus);

// @route GET /admin/posts
// @desc Get all posts with pagination, search, and filtering
// @access Private (Admin only)
router.get("/posts", getAllPostsAdmin);

// @route DELETE /admin/posts/:id
// @desc Delete a post
// @access Private (Admin only)
router.delete("/posts/:id", deletePost);

// @route GET /admin/password-reset-requests
// @desc Get all password reset requests with pagination and filtering
// @access Private (Admin only)
router.get("/password-reset-requests", getAllPasswordResetRequests);

// @route PATCH /admin/password-reset-requests/:id
// @desc Update password reset request status
// @access Private (Admin only)
router.patch("/password-reset-requests/:id", updatePasswordResetRequestStatus);

// @route GET /admin/users
// @desc Get all users with pagination, search, and sorting
// @access Private (Admin only)
router.get("/users", getAllUsersAdmin);

// @route GET /admin/users/:userId/posts
// @desc Get all posts for a specific user with pagination
// @access Private (Admin only)
router.get("/users/:userId/posts", getUserPosts);

// @route PATCH /admin/users/:userId/reset-password
// @desc Admin reset user password
// @access Private (Admin only)
router.patch("/users/:userId/reset-password", adminResetUserPassword);

// @route DELETE /admin/users/:userId
// @desc Delete a user and all their posts
// @access Private (Admin only)
router.delete("/users/:userId", deleteUserAdmin);

// @route GET /admin/visitor-stats
// @desc Get visitor statistics
// @access Private (Admin only)
router.get("/visitor-stats", getVisitorStats);

module.exports = router;
