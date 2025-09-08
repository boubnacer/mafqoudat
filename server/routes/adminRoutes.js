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

// @route DELETE /admin/posts/:id
// @desc Delete a post
// @access Private (Admin only)
router.delete("/posts/:id", deletePost);

module.exports = router;
