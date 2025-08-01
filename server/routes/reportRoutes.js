const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const verifyJWT = require("../middleware/verifyJWT");

// Apply JWT verification to all routes
router.use(verifyJWT);

// POST /reports - Create a new report
router.route("/").post(reportController.createReport);

// GET /reports - Get all reports (Admin only)
router.route("/").get(reportController.getAllReports);

// GET /reports/:id - Get report by ID (Admin only)
router.route("/:id").get(reportController.getReportById);

// DELETE /reports/:id - Delete report (Admin only)
router.route("/:id").delete(reportController.deleteReport);

module.exports = router; 