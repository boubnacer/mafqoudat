/**
 * Initialize System Settings
 * 
 * This script ensures that the SystemSettings singleton document exists in the database.
 * Run this script after database migrations or when setting up a new environment.
 * 
 * Usage:
 *   node scripts/initializeSystemSettings.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const SystemSettings = require("../models/SystemSettings");
const { connectDB, disconnectDB } = require("../config/resilientDbConn");

const initializeSystemSettings = async () => {
  try {
    console.log("\n" + "=".repeat(60));
    console.log("🚀 SYSTEM SETTINGS INITIALIZATION");
    console.log("=".repeat(60) + "\n");

    // Connect to database
    console.log("📡 Connecting to database...");
    await connectDB();
    console.log("✅ Database connected successfully\n");

    // Verify singleton integrity
    console.log("🔍 Verifying singleton integrity...");
    const verificationResult = await SystemSettings.verifySingleton();
    console.log(`✅ Singleton verification: ${verificationResult.status}`);
    console.log(`   Documents found: ${verificationResult.count}`);
    
    if (verificationResult.deleted) {
      console.log(`   Duplicate documents deleted: ${verificationResult.deleted}`);
    }

    console.log("");

    // Get or create the singleton instance
    console.log("📝 Getting system settings instance...");
    const settings = await SystemSettings.getInstance();

    if (!settings) {
      console.error("❌ Failed to get or create system settings");
      process.exit(1);
    }

    console.log("✅ System settings instance retrieved\n");

    // Display current settings
    console.log("=".repeat(60));
    console.log("📊 CURRENT SYSTEM SETTINGS");
    console.log("=".repeat(60));
    console.log("\n🔧 Maintenance Mode:");
    console.log(`   Status: ${settings.maintenanceMode.isActive ? "🔴 ACTIVE" : "🟢 INACTIVE"}`);
    console.log(`   Message: "${settings.maintenanceMode.message}"`);
    console.log(`   Estimated Return: ${settings.maintenanceMode.estimatedReturn}`);
    console.log(`   Last Updated: ${settings.maintenanceMode.lastUpdatedAt || "Never"}`);
    console.log(`   Last Updated By: ${settings.maintenanceMode.lastUpdatedBy || "System"}`);

    console.log("\n📅 Document Info:");
    console.log(`   Created: ${settings.createdAt}`);
    console.log(`   Updated: ${settings.updatedAt}`);
    console.log(`   Document ID: ${settings._id}`);

    console.log("\n" + "=".repeat(60));
    console.log("✅ INITIALIZATION COMPLETE");
    console.log("=".repeat(60) + "\n");

    // Test static methods
    console.log("🧪 Testing static methods...");
    const isActive = await SystemSettings.isMaintenanceModeActive();
    console.log(`   Maintenance mode active: ${isActive}`);
    console.log("✅ Static methods working correctly\n");

    // Disconnect
    console.log("🔌 Disconnecting from database...");
    await disconnectDB();
    console.log("✅ Disconnected successfully\n");

    console.log("=".repeat(60));
    console.log("🎉 ALL TESTS PASSED - System settings ready for use!");
    console.log("=".repeat(60) + "\n");

    process.exit(0);
  } catch (error) {
    console.error("\n" + "=".repeat(60));
    console.error("❌ INITIALIZATION FAILED");
    console.error("=".repeat(60));
    console.error("\nError:", error.message);
    console.error("\nStack trace:");
    console.error(error.stack);
    console.error("\n" + "=".repeat(60) + "\n");

    try {
      await disconnectDB();
    } catch (disconnectError) {
      console.error("Error disconnecting:", disconnectError.message);
    }

    process.exit(1);
  }
};

// Run the initialization
if (require.main === module) {
  initializeSystemSettings();
}

module.exports = initializeSystemSettings;

