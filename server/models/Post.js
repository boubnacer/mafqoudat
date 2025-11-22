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
    // Multiple categories support - array of category IDs
    categories: [{
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Category",
    }],
    // Legacy single category field - kept for backward compatibility during migration
    category: {
      type: mongoose.Schema.Types.ObjectId,
      required: false, // Made optional to support migration
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
      required: false, // Made optional
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
    promotionPhoneNumber: {
      type: String,
      trim: true,
    },
    // Additional useful fields
    city: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
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

// 2. Category filtering: Country + Categories + Status + CreatedAt (for array queries)
postSchema.index({ country: 1, categories: 1, status: 1, createdAt: -1 });
// Legacy category index (kept for backward compatibility)
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

// Virtual for backward compatibility - get first category from categories array
postSchema.virtual('firstCategory').get(function() {
  if (this.categories && this.categories.length > 0) {
    return this.categories[0];
  }
  return this.category; // Return stored category if categories array is empty
});

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
// Also handle backward compatibility: if category is set but categories is not, populate categories
postSchema.pre('save', function(next) {
  if (this.isNew && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  }
  
  // Backward compatibility: if categories array is empty but category field exists, populate categories
  if ((!this.categories || this.categories.length === 0) && this.category) {
    this.categories = [this.category];
  }
  
  // Ensure at least one category exists
  if (!this.categories || this.categories.length === 0) {
    return next(new Error('At least one category is required'));
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
