const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    country: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Country",
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Category",
    },
    foundLost: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "FoundLost",
    },
    region: {
      type: String,
      required: true,
    },
    contact: {
      type: String,
      required: true,
    },
    returned: {
      type: Boolean,
      default: false,
    },
    // Make image optional
    image: {
      type: String,
      required: false, // Changed from required to optional
    },
    // Cloudinary fields for proper image management
    cloudinaryUrl: {
      type: String,
      required: false, // Changed from required to optional
    },
    cloudinaryPublicId: {
      type: String,
      required: false, // Changed from required to optional
    },
    mainDate: {
      type: String,
    },
    // Add missing fields that are referenced in controllers
    reported: {
      type: Boolean,
      default: false,
    },
    reportedTxt: {
      type: String,
      default: "",
    },
    // Updated to support multilingual content
    title: {
      type: String,
      default: "",
    },
    // New multilingual title field
    titleLabels: {
      en: {
        type: String,
        default: "",
        trim: true
      },
      fr: {
        type: String,
        default: "",
        trim: true
      },
      ar: {
        type: String,
        default: "",
        trim: true
      }
    },
    description: {
      type: String,
      default: "",
    },
    // New multilingual description field
    descriptionLabels: {
      en: {
        type: String,
        default: "",
        trim: true
      },
      fr: {
        type: String,
        default: "",
        trim: true
      },
      ar: {
        type: String,
        default: "",
        trim: true
      }
    },
    // Promotion fields
    promotionRequested: {
      type: Boolean,
      default: false,
    },
    promotionRequestedAt: {
      type: Date,
    },
    promotionProcessed: {
      type: Boolean,
      default: false,
    },
    promotionProcessedAt: {
      type: Date,
    },
    // Additional useful fields
    city: {
      type: String,
      default: null,
    },
    exactLocation: {
      type: String,
      required: true,
    },
    contactPreferences: {
      phone: {
        type: Boolean,
        default: true
      },
      email: {
        type: Boolean,
        default: false
      },
      whatsapp: {
        type: Boolean,
        default: false
      }
    },
    status: {
      type: String,
      enum: ['active', 'resolved', 'expired', 'suspended'],
      default: 'active'
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    expiresAt: {
      type: Date,
      default: null
    },
    views: {
      type: Number,
      default: 0
    },
    lastViewedAt: {
      type: Date,
      default: null
    },
    tags: [{
      type: String,
      trim: true
    }],
    // Additional contact information
    additionalContact: {
      phone: String,
      email: String,
      whatsapp: String
    }
  },
  {
    timestamps: true,
  }
);

// Index for efficient multilingual search
postSchema.index({ 
  "titleLabels.en": "text", 
  "titleLabels.fr": "text", 
  "titleLabels.ar": "text",
  "descriptionLabels.en": "text", 
  "descriptionLabels.fr": "text", 
  "descriptionLabels.ar": "text",
  "exactLocation": "text",
  "description": "text"
});

// Virtual for backward compatibility
postSchema.virtual('titleText').get(function() {
  return this.title || this.titleLabels?.en || '';
});

postSchema.virtual('descriptionText').get(function() {
  return this.description || this.descriptionLabels?.en || '';
});

// Virtual for image URL (prioritize Cloudinary URL)
postSchema.virtual('imageUrl').get(function() {
  return this.cloudinaryUrl || this.image || '';
});

// Virtual to check if post has image
postSchema.virtual('hasImage').get(function() {
  return !!(this.cloudinaryUrl || this.image);
});

// Method to get title by language
postSchema.methods.getTitle = function(language = 'en') {
  return this.titleLabels?.[language] || this.titleLabels?.en || this.title || '';
};

// Method to get description by language
postSchema.methods.getDescription = function(language = 'en') {
  return this.descriptionLabels?.[language] || this.descriptionLabels?.en || this.description || '';
};

// Method to increment views
postSchema.methods.incrementViews = function() {
  this.views += 1;
  this.lastViewedAt = new Date();
  return this.save();
};

// Method to mark as resolved
postSchema.methods.markAsResolved = function() {
  this.status = 'resolved';
  this.returned = true;
  this.resolvedAt = new Date();
  return this.save();
};

// Pre-save middleware to set expiration date (30 days from creation)
postSchema.pre('save', function(next) {
  if (this.isNew && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  }
  next();
});

postSchema.plugin(AutoIncrement, {
  inc_field: "ticket",
  id: "ticketNums",
  start_seq: 500,
});

module.exports = mongoose.model("Post", postSchema);
