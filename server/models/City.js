const mongoose = require("mongoose");

const citySchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  country: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Country",
    required: true
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
  isActive: {
    type: Boolean,
    default: true
  },
  isCapital: {
    type: Boolean,
    default: false
  },
  isDynamic: {
    type: Boolean,
    default: false
  },
  searchTerms: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

// Compound index for country and code uniqueness
citySchema.index({ country: 1, code: 1 }, { unique: true });

// Index for efficient multilingual search
citySchema.index({ 
  "labels.en": "text", 
  "labels.fr": "text", 
  "labels.ar": "text",
  "searchTerms": "text"
});

// Index for country-based queries
citySchema.index({ country: 1, isActive: 1 });

// Virtual for backward compatibility
citySchema.virtual('label').get(function() {
  return this.labels.en; // Default to English
});

// Method to get label by language
citySchema.methods.getLabel = function(language = 'en') {
  return this.labels[language] || this.labels.en;
};

// Static method to get cities by country
citySchema.statics.getByCountry = function(countryId, language = 'en') {
  return this.find({ country: countryId, isActive: true })
    .select('code labels isCapital')
    .sort({ 'labels.en': 1 })
    .lean();
};

// Static method to search cities
citySchema.statics.search = function(query, language = 'en', limit = 10) {
  return this.find({
    $text: { $search: query },
    isActive: true
  })
  .select('code labels country isCapital')
  .populate('country', 'code labels flag')
  .limit(limit)
  .lean();
};

module.exports = mongoose.model("City", citySchema);
