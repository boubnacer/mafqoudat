const mongoose = require("mongoose");
// Temporarily comment out AutoIncrement to fix post creation issue
// const AutoIncrement = require("mongoose-sequence")(mongoose);

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

    description: {
      type: String,
      default: "",
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
      type: mongoose.Schema.Types.ObjectId,
      ref: "City",
      required: false,
    },
    exactLocation: {
      type: String,
      required: true,
    },
    exactDate: {
      type: Date,
      required: true,
      default: Date.now,
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
  },
  {
    timestamps: true,
  }
);

// Index for efficient text search
postSchema.index({ 
  "exactLocation": "text",
  "description": "text"
});

// Optimized compound indexes for common query patterns
// 1. Primary query pattern: Country + FoundLost + Status + CreatedAt (most common)
postSchema.index({ country: 1, foundLost: 1, status: 1, createdAt: -1 });

// 2. Category filtering: Country + Category + Status + CreatedAt
postSchema.index({ country: 1, category: 1, status: 1, createdAt: -1 });

// 3. User posts: User + Status + CreatedAt
postSchema.index({ user: 1, status: 1, createdAt: -1 });

// 4. Country listing: Country + Status + CreatedAt
postSchema.index({ country: 1, status: 1, createdAt: -1 });

// 5. City-based queries: Country + City + Status + CreatedAt
postSchema.index({ country: 1, city: 1, status: 1, createdAt: -1 });

// 6. Returned items: Returned + Status + CreatedAt
postSchema.index({ returned: 1, status: 1, createdAt: -1 });

// 7. Expiration cleanup: ExpiresAt + Status
postSchema.index({ expiresAt: 1, status: 1 });

// 8. Partial index for active posts only (most common query pattern)
postSchema.index(
  { country: 1, foundLost: 1, createdAt: -1 },
  { 
    name: "active_posts_country_foundlost_createdat",
    partialFilterExpression: { status: "active" }
  }
);

// 9. Search optimization: Country + Status + Text search
postSchema.index(
  { country: 1, status: 1, exactLocation: "text", description: "text" },
  { name: "country_status_text_search_optimized" }
);

// Virtual for backward compatibility
postSchema.virtual('descriptionText').get(function() {
  return this.description || '';
});

// Virtual for image URL (prioritize Cloudinary URL)
postSchema.virtual('imageUrl').get(function() {
  return this.cloudinaryUrl || this.image || '';
});

// Virtual to check if post has image
postSchema.virtual('hasImage').get(function() {
  return !!(this.cloudinaryUrl || this.image);
});

// Method to get description
postSchema.methods.getDescription = function() {
  return this.description || '';
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

// Temporarily comment out AutoIncrement plugin to fix post creation issue
// postSchema.plugin(AutoIncrement, {
//   inc_field: "ticket",
//   id: "ticketNums",
//   start_seq: 500,
// });

module.exports = mongoose.model("Post", postSchema);
