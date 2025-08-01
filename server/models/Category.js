const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
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
  flag: {
    type: String,
    default: null
  },
  icon: {
    type: String,
    default: null
  },
  color: {
    type: String,
    default: '#2196F3'
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

// Index for efficient multilingual search
categorySchema.index({ 
  "labels.en": "text", 
  "labels.fr": "text", 
  "labels.ar": "text",
  "code": "text"
});

// Virtual for backward compatibility
categorySchema.virtual('name').get(function() {
  return this.labels.en; // Default to English
});

// Method to get label by language
categorySchema.methods.getLabel = function(language = 'en') {
  return this.labels[language] || this.labels.en;
};

// Static method to get all active categories
categorySchema.statics.getActive = function() {
  return this.find({ isActive: true });
};

module.exports = mongoose.model("Category", categorySchema);
