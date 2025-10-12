const SystemSettings = require("../models/SystemSettings");
const User = require("../models/User");
const { logEvents } = require("../middleware/logger");

/**
 * @desc Get system settings
 * @route GET /api/system/settings
 * @access Public (but some fields may be restricted)
 */
const getSystemSettings = async (req, res) => {
  try {
    console.log("🔍 [SYSTEM-CONTROLLER] Fetching system settings...");

    // Get or create the singleton instance
    const settings = await SystemSettings.getInstance();

    if (!settings) {
      console.error("❌ [SYSTEM-CONTROLLER] Failed to get system settings");
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve system settings"
      });
    }

    // Populate lastUpdatedBy user information
    await settings.populate("maintenanceMode.lastUpdatedBy", "username");

    console.log("✅ [SYSTEM-CONTROLLER] System settings retrieved successfully");

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
        lastUpdated: settings.updatedAt
      }
    });
  } catch (error) {
    console.error("❌ [SYSTEM-CONTROLLER] Error fetching system settings:", error);
    logEvents(
      `SYSTEM_SETTINGS_ERROR\tGET\t${error.message}`,
      "errLog.log"
    );

    res.status(500).json({
      success: false,
      message: "Error retrieving system settings",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc Get maintenance mode status (lightweight endpoint)
 * @route GET /api/system/maintenance-status
 * @access Public
 */
const getMaintenanceStatus = async (req, res) => {
  try {
    const isActive = await SystemSettings.isMaintenanceModeActive();
    const settings = await SystemSettings.getInstance();

    res.status(200).json({
      success: true,
      data: {
        isActive,
        message: settings.maintenanceMode.message,
        estimatedReturn: settings.maintenanceMode.estimatedReturn
      }
    });
  } catch (error) {
    console.error("❌ [SYSTEM-CONTROLLER] Error checking maintenance status:", error);

    // Fail safely - assume maintenance is not active
    res.status(200).json({
      success: true,
      data: {
        isActive: false,
        message: "System operational",
        estimatedReturn: null
      }
    });
  }
};

/**
 * @desc Update maintenance mode settings
 * @route PUT /api/system/maintenance-mode
 * @access Private (Admin only)
 */
const updateMaintenanceMode = async (req, res) => {
  try {
    const { isActive, message, estimatedReturn } = req.body;

    // Get admin user ID from the request (set by verifyJWT and verifyAdmin middleware)
    const adminUserId = req.user || req.adminUser?.id;

    if (!adminUserId) {
      console.error("❌ [SYSTEM-CONTROLLER] No admin user ID found in request");
      return res.status(401).json({
        success: false,
        message: "User authentication required"
      });
    }

    // Validate input
    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean value"
      });
    }

    if (message && typeof message !== "string") {
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

    console.log(
      `🔧 [SYSTEM-CONTROLLER] Admin user ${adminUserId} updating maintenance mode to: ${isActive}`
    );

    // Update maintenance mode using the static method
    const settings = await SystemSettings.updateMaintenanceMode(
      isActive,
      message,
      estimatedReturn,
      adminUserId
    );

    // Populate the lastUpdatedBy user info
    await settings.populate("maintenanceMode.lastUpdatedBy", "username");

    // Log the change
    logEvents(
      `MAINTENANCE_MODE_UPDATED\t${isActive ? "ENABLED" : "DISABLED"}\tBy: ${
        settings.maintenanceMode.lastUpdatedBy?.username || adminUserId
      }\tMessage: ${settings.maintenanceMode.message.substring(0, 50)}...`,
      "reqLog.log"
    );

    console.log(
      `✅ [SYSTEM-CONTROLLER] Maintenance mode successfully updated to: ${isActive}`
    );

    res.status(200).json({
      success: true,
      message: `Maintenance mode ${isActive ? "enabled" : "disabled"} successfully`,
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
    console.error("❌ [SYSTEM-CONTROLLER] Error updating maintenance mode:", error);
    logEvents(
      `MAINTENANCE_UPDATE_ERROR\t${error.message}`,
      "errLog.log"
    );

    res.status(500).json({
      success: false,
      message: "Error updating maintenance mode",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc Toggle maintenance mode (quick on/off switch)
 * @route POST /api/system/maintenance-mode/toggle
 * @access Private (Admin only)
 */
const toggleMaintenanceMode = async (req, res) => {
  try {
    const adminUserId = req.user || req.adminUser?.id;

    if (!adminUserId) {
      console.error("❌ [SYSTEM-CONTROLLER] No admin user ID found in request");
      return res.status(401).json({
        success: false,
        message: "User authentication required"
      });
    }

    console.log(`🔄 [SYSTEM-CONTROLLER] Admin user ${adminUserId} toggling maintenance mode`);

    // Get current settings
    const settings = await SystemSettings.getInstance();

    // Toggle maintenance mode
    await settings.toggleMaintenanceMode(adminUserId);

    // Populate user info
    await settings.populate("maintenanceMode.lastUpdatedBy", "username");

    // Log the change
    logEvents(
      `MAINTENANCE_MODE_TOGGLED\t${settings.maintenanceMode.isActive ? "ENABLED" : "DISABLED"}\tBy: ${
        settings.maintenanceMode.lastUpdatedBy?.username || adminUserId
      }`,
      "reqLog.log"
    );

    console.log(
      `✅ [SYSTEM-CONTROLLER] Maintenance mode toggled to: ${settings.maintenanceMode.isActive}`
    );

    res.status(200).json({
      success: true,
      message: `Maintenance mode ${settings.maintenanceMode.isActive ? "enabled" : "disabled"} successfully`,
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
    console.error("❌ [SYSTEM-CONTROLLER] Error toggling maintenance mode:", error);
    logEvents(
      `MAINTENANCE_TOGGLE_ERROR\t${error.message}`,
      "errLog.log"
    );

    res.status(500).json({
      success: false,
      message: "Error toggling maintenance mode",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc Verify singleton integrity
 * @route GET /api/system/verify-singleton
 * @access Private (Admin only)
 */
const verifySingleton = async (req, res) => {
  try {
    console.log("🔍 [SYSTEM-CONTROLLER] Verifying singleton integrity...");

    const result = await SystemSettings.verifySingleton();

    console.log(`✅ [SYSTEM-CONTROLLER] Singleton verification result: ${result.status}`);

    res.status(200).json({
      success: true,
      message: "Singleton verification completed",
      data: result
    });
  } catch (error) {
    console.error("❌ [SYSTEM-CONTROLLER] Error verifying singleton:", error);

    res.status(500).json({
      success: false,
      message: "Error verifying singleton integrity",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc Initialize system settings (creates default if doesn't exist)
 * @route POST /api/system/initialize
 * @access Private (Admin only)
 */
const initializeSystemSettings = async (req, res) => {
  try {
    console.log("🚀 [SYSTEM-CONTROLLER] Initializing system settings...");

    const settings = await SystemSettings.getInstance();

    console.log("✅ [SYSTEM-CONTROLLER] System settings initialized successfully");

    res.status(200).json({
      success: true,
      message: "System settings initialized successfully",
      data: {
        maintenanceMode: {
          isActive: settings.maintenanceMode.isActive,
          message: settings.maintenanceMode.message,
          estimatedReturn: settings.maintenanceMode.estimatedReturn
        }
      }
    });
  } catch (error) {
    console.error("❌ [SYSTEM-CONTROLLER] Error initializing system settings:", error);

    res.status(500).json({
      success: false,
      message: "Error initializing system settings",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

module.exports = {
  getSystemSettings,
  getMaintenanceStatus,
  updateMaintenanceMode,
  toggleMaintenanceMode,
  verifySingleton,
  initializeSystemSettings
};

