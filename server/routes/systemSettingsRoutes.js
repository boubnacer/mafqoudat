const express = require("express");
const router = express.Router();
const verifyJWT = require("../middleware/verifyJWT");
const verifyAdmin = require("../middleware/verifyAdmin");
const SystemSettings = require("../models/SystemSettings");
const { logEvents } = require("../middleware/logger");

/**
 * System Settings Routes
 * All routes require admin authentication
 */

// Apply authentication middleware to all routes
router.use(verifyJWT);
router.use(verifyAdmin);

/**
 * @desc Get current system settings
 * @route GET /system-settings
 * @access Private (Admin only)
 */
router.get("/", async (req, res) => {
  try {
    console.log("🔍 [SYSTEM-SETTINGS] Admin fetching system settings...");

    // Get or create the singleton instance
    const settings = await SystemSettings.getInstance();

    if (!settings) {
      console.error("❌ [SYSTEM-SETTINGS] Failed to retrieve system settings");
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve system settings"
      });
    }

    // Populate lastUpdatedBy user information
    await settings.populate("maintenanceMode.lastUpdatedBy", "username");

    console.log("✅ [SYSTEM-SETTINGS] System settings retrieved successfully");

    // Log the access
    logEvents(
      `SYSTEM_SETTINGS_VIEWED\tBy: ${req.adminUser?.username || req.username || "Unknown"}`,
      "reqLog.log"
    );

    res.status(200).json({
      success: true,
      data: {
        maintenanceMode: {
          isActive: settings.maintenanceMode.isActive,
          message: settings.maintenanceMode.message,
          estimatedReturn: settings.maintenanceMode.estimatedReturn,
          lastUpdatedBy: settings.maintenanceMode.lastUpdatedBy?.username || null,
          lastUpdatedAt: settings.maintenanceMode.lastUpdatedAt
        },
        createdAt: settings.createdAt,
        updatedAt: settings.updatedAt
      }
    });
  } catch (error) {
    console.error("❌ [SYSTEM-SETTINGS] Error fetching system settings:", error);
    logEvents(
      `SYSTEM_SETTINGS_ERROR\tGET\t${error.message}`,
      "errLog.log"
    );

    res.status(500).json({
      success: false,
      message: "Error retrieving system settings",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error"
    });
  }
});

/**
 * @desc Toggle maintenance mode
 * @route PATCH /system-settings/maintenance
 * @access Private (Admin only)
 */
router.patch("/maintenance", async (req, res) => {
  try {
    const { isActive, message, estimatedReturn } = req.body;

    // Get admin user ID from the request (set by verifyJWT and verifyAdmin middleware)
    const adminUserId = req.user || req.adminUser?.id;
    const adminUsername = req.adminUser?.username || req.username || "Unknown";

    if (!adminUserId) {
      console.error("❌ [SYSTEM-SETTINGS] No admin user ID found in request");
      return res.status(401).json({
        success: false,
        message: "User authentication required"
      });
    }

    // Validate input if provided
    if (isActive !== undefined && typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean value"
      });
    }

    if (message !== undefined && typeof message !== "string") {
      return res.status(400).json({
        success: false,
        message: "message must be a string"
      });
    }

    if (message && message.length > 500) {
      return res.status(400).json({
        success: false,
        message: "message cannot exceed 500 characters"
      });
    }

    if (estimatedReturn !== undefined && typeof estimatedReturn !== "string") {
      return res.status(400).json({
        success: false,
        message: "estimatedReturn must be a string"
      });
    }

    if (estimatedReturn && estimatedReturn.length > 100) {
      return res.status(400).json({
        success: false,
        message: "estimatedReturn cannot exceed 100 characters"
      });
    }

    console.log(
      `🔧 [SYSTEM-SETTINGS] Admin '${adminUsername}' updating maintenance mode...`
    );

    // Get current settings
    const settings = await SystemSettings.getInstance();

    // If isActive is provided, use it; otherwise toggle current state
    const newActiveState = isActive !== undefined ? isActive : !settings.maintenanceMode.isActive;

    // Update maintenance mode
    settings.maintenanceMode.isActive = newActiveState;
    
    if (message !== undefined) {
      settings.maintenanceMode.message = message;
    }
    
    if (estimatedReturn !== undefined) {
      settings.maintenanceMode.estimatedReturn = estimatedReturn;
    }
    
    settings.maintenanceMode.lastUpdatedBy = adminUserId;
    settings.maintenanceMode.lastUpdatedAt = new Date();

    await settings.save();

    // Populate the lastUpdatedBy user info
    await settings.populate("maintenanceMode.lastUpdatedBy", "username");

    // Log the change
    logEvents(
      `MAINTENANCE_MODE_${newActiveState ? "ENABLED" : "DISABLED"}\tBy: ${adminUsername}\tMessage: ${settings.maintenanceMode.message.substring(0, 50)}...`,
      "reqLog.log"
    );

    console.log(
      `✅ [SYSTEM-SETTINGS] Maintenance mode ${newActiveState ? "ENABLED" : "DISABLED"} by ${adminUsername}`
    );

    res.status(200).json({
      success: true,
      message: `Maintenance mode ${newActiveState ? "enabled" : "disabled"} successfully`,
      data: {
        maintenanceMode: {
          isActive: settings.maintenanceMode.isActive,
          message: settings.maintenanceMode.message,
          estimatedReturn: settings.maintenanceMode.estimatedReturn,
          lastUpdatedBy: settings.maintenanceMode.lastUpdatedBy?.username || null,
          lastUpdatedAt: settings.maintenanceMode.lastUpdatedAt
        }
      }
    });
  } catch (error) {
    console.error("❌ [SYSTEM-SETTINGS] Error updating maintenance mode:", error);
    logEvents(
      `MAINTENANCE_UPDATE_ERROR\t${error.message}`,
      "errLog.log"
    );

    res.status(500).json({
      success: false,
      message: "Error updating maintenance mode",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error"
    });
  }
});

module.exports = router;

