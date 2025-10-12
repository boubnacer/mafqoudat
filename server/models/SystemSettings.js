const mongoose = require("mongoose");

/**
 * SystemSettings Schema
 * Singleton pattern - only one document should exist
 * Stores application-wide configuration settings
 */
const systemSettingsSchema = new mongoose.Schema(
  {
    // Maintenance mode configuration
    maintenanceMode: {
      isActive: {
        type: Boolean,
        default: false,
        required: true
      },
      message: {
        type: String,
        default: "We're currently performing scheduled maintenance. We'll be back soon! Thank you for your patience.",
        required: true,
        maxlength: 500
      },
      estimatedReturn: {
        type: String,
        default: "soon",
        maxlength: 100
      },
      lastUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
      },
      lastUpdatedAt: {
        type: Date,
        default: null
      }
    },

    // Singleton identifier - ensures only one document exists
    singleton: {
      type: String,
      default: "system_settings",
      unique: true,
      immutable: true,
      index: true
    }
  },
  {
    timestamps: true,
    collection: "systemsettings"
  }
);

// Index for efficient singleton lookup
systemSettingsSchema.index({ singleton: 1 }, { unique: true });

// Pre-save middleware to enforce singleton pattern
systemSettingsSchema.pre("save", async function (next) {
  // Ensure singleton value is always set
  this.singleton = "system_settings";
  next();
});

// Static method to get or create the singleton instance
systemSettingsSchema.statics.getInstance = async function () {
  try {
    let settings = await this.findOne({ singleton: "system_settings" });

    // If settings don't exist, create them with defaults
    if (!settings) {
      settings = await this.create({
        singleton: "system_settings",
        maintenanceMode: {
          isActive: false,
          message: "We're currently performing scheduled maintenance. We'll be back soon! Thank you for your patience.",
          estimatedReturn: "soon",
          lastUpdatedBy: null,
          lastUpdatedAt: null
        }
      });
    }

    return settings;
  } catch (error) {
    // If error is duplicate key (shouldn't happen but just in case)
    if (error.code === 11000) {
      return await this.findOne({ singleton: "system_settings" });
    }
    throw error;
  }
};

// Static method to update maintenance mode
systemSettingsSchema.statics.updateMaintenanceMode = async function (
  isActive,
  message,
  estimatedReturn,
  updatedBy
) {
  try {
    const settings = await this.getInstance();

    settings.maintenanceMode.isActive = isActive;
    if (message) settings.maintenanceMode.message = message;
    if (estimatedReturn) settings.maintenanceMode.estimatedReturn = estimatedReturn;
    settings.maintenanceMode.lastUpdatedBy = updatedBy;
    settings.maintenanceMode.lastUpdatedAt = new Date();

    await settings.save();

    return settings;
  } catch (error) {
    throw error;
  }
};

// Instance method to toggle maintenance mode
systemSettingsSchema.methods.toggleMaintenanceMode = async function (updatedBy) {
  this.maintenanceMode.isActive = !this.maintenanceMode.isActive;
  this.maintenanceMode.lastUpdatedBy = updatedBy;
  this.maintenanceMode.lastUpdatedAt = new Date();

  await this.save();

  return this;
};

// Static method to check if maintenance mode is active
systemSettingsSchema.statics.isMaintenanceModeActive = async function () {
  try {
    const settings = await this.getInstance();
    return settings.maintenanceMode.isActive;
  } catch (error) {
    // Default to false on error (fail open)
    return false;
  }
};

// Virtual for checking if maintenance mode is currently active
systemSettingsSchema.virtual("isMaintenanceActive").get(function () {
  return this.maintenanceMode.isActive;
});

// Ensure virtuals are included in JSON
systemSettingsSchema.set("toJSON", { virtuals: true });
systemSettingsSchema.set("toObject", { virtuals: true });

// Pre-remove middleware to prevent deletion of the singleton
systemSettingsSchema.pre("remove", function (next) {
  const error = new Error("Cannot delete system settings. This is a singleton document.");
  next(error);
});

// Static method to verify singleton integrity
systemSettingsSchema.statics.verifySingleton = async function () {
  try {
    const count = await this.countDocuments();

    if (count === 0) {
      await this.getInstance();
      return { status: "created", count: 1 };
    } else if (count === 1) {
      return { status: "ok", count: 1 };
    } else {
      // Keep only the first one, delete others
      const settings = await this.find().sort({ createdAt: 1 });
      for (let i = 1; i < settings.length; i++) {
        await this.findByIdAndDelete(settings[i]._id);
      }
      return { status: "repaired", count: count, kept: 1, deleted: count - 1 };
    }
  } catch (error) {
    throw error;
  }
};

const SystemSettings = mongoose.model("SystemSettings", systemSettingsSchema);

module.exports = SystemSettings;

