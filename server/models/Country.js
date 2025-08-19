const mongoose = require("mongoose");

const countrySchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: 3
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
  names: {
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
  isActive: {
    type: Boolean,
    default: true
  },
  searchTerms: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

// Index for efficient multilingual search
countrySchema.index({ 
  "labels.en": "text", 
  "labels.fr": "text", 
  "labels.ar": "text",
  "names.en": "text",
  "names.fr": "text", 
  "names.ar": "text",
  "searchTerms": "text"
});

// Virtual for backward compatibility
countrySchema.virtual('label').get(function() {
  return this.labels.en; // Default to English
});

// Method to get label by language
countrySchema.methods.getLabel = function(language = 'en') {
  return this.labels[language] || this.labels.en;
};

// Method to get all searchable terms
countrySchema.methods.getSearchTerms = function() {
  return [
    this.code,
    this.labels.en,
    this.labels.fr,
    this.labels.ar,
    this.names?.en,
    this.names?.fr,
    this.names?.ar,
    ...this.searchTerms
  ].filter(Boolean); // Remove undefined values
};

// Pre-save middleware to update search terms
countrySchema.pre('save', function(next) {
  this.searchTerms = this.getSearchTerms();
  next();
});

// Static method to get all active countries
countrySchema.statics.getActive = function() {
  return this.find({ isActive: true }).sort({ 'labels.en': 1 });
};

module.exports = mongoose.model("Country", countrySchema);
