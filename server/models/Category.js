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
  },
  priority: {
    type: Number,
    default: 0,
    min: 0
  },
  searchTerms: {
    type: [String],
    default: []
  },
  // Client-side icon mapping (for reference, not stored in DB)
  iconName: {
    type: String,
    default: null,
    // This field is for documentation purposes only
    // The actual icon rendering is handled on the client side
  }
}, {
  timestamps: true
});

// Index for efficient multilingual search
categorySchema.index({ 
  "labels.en": "text", 
  "labels.fr": "text", 
  "labels.ar": "text",
  "code": "text",
  "searchTerms": "text"
});

// Virtual for backward compatibility
categorySchema.virtual('name').get(function() {
  return this.labels.en; // Default to English
});

// Method to get label by language
categorySchema.methods.getLabel = function(language = 'en') {
  return this.labels[language] || this.labels.en;
};

// Method to get all searchable terms
categorySchema.methods.getSearchTerms = function() {
  return [
    this.code,
    this.labels.en,
    this.labels.fr,
    this.labels.ar,
    ...this.searchTerms
  ].filter(Boolean); // Remove undefined values
};

// Pre-save middleware to update search terms
categorySchema.pre('save', function(next) {
  this.searchTerms = this.getSearchTerms();
  next();
});

// Static method to get all active categories
categorySchema.statics.getActive = function() {
  return this.find({ isActive: true }).sort({ priority: -1, 'labels.en': 1 });
};

module.exports = mongoose.model("Category", categorySchema);
