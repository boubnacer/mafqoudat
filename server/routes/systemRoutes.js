const express = require("express");
const router = express.Router();
const systemController = require("../controllers/systemController");
const verifyJWT = require("../middleware/verifyJWT");
const verifyAdmin = require("../middleware/verifyAdmin");

/**
 * System Settings Routes
 * Handles application-wide system configuration
 */

// Public routes (no authentication required)
router
  .route("/settings")
  .get(systemController.getSystemSettings);

router
  .route("/maintenance-status")
  .get(systemController.getMaintenanceStatus);

// Protected routes (Admin only)
// Initialize system settings
router
  .route("/initialize")
  .post(verifyJWT, verifyAdmin, systemController.initializeSystemSettings);

// Update maintenance mode
router
  .route("/maintenance-mode")
  .put(verifyJWT, verifyAdmin, systemController.updateMaintenanceMode);

// Toggle maintenance mode (quick switch)
router
  .route("/maintenance-mode/toggle")
  .post(verifyJWT, verifyAdmin, systemController.toggleMaintenanceMode);

// Verify singleton integrity
router
  .route("/verify-singleton")
  .get(verifyJWT, verifyAdmin, systemController.verifySingleton);

module.exports = router;

