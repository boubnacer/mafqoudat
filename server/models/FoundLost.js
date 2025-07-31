const mongoose = require("mongoose");

const foundlostSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    enum: ['FOUND', 'LOST'],
    uppercase: true,
    trim: true
  },
  labels: {
    en: {
      type: String,
      required: true,
      trim: true
    },
    fr: {
      type: String,
      required: true,
      trim: true
    },
    ar: {
      type: String,
      required: true,
      trim: true
    }
  },
  color: {
    type: String,
    required: true,
    default: '#4CAF50' // Default green for found
  },
  icon: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient lookup
foundlostSchema.index({ code: 1 });

// Virtual for backward compatibility
foundlostSchema.virtual('name').get(function() {
  return this.labels.en;
});

// Method to get label by language
foundlostSchema.methods.getLabel = function(language = 'en') {
  return this.labels[language] || this.labels.en;
};

// Static method to get post type by code
foundlostSchema.statics.getByCode = function(code) {
  return this.findOne({ code: code.toUpperCase() });
};

// Static method to get all active post types
foundlostSchema.statics.getActive = function() {
  return this.find({ isActive: true });
};

module.exports = mongoose.model("FoundLost", foundlostSchema);
