const mongoose = require("mongoose");
const { FIELD_LIMITS } = require("../config/fieldLimits");

// Free-text length limits live in config/fieldLimits.js so the schema and the
// express-validator rules that produce the 400 read the same numbers. These
// are the backstop: no write path - controller, script or migration - gets
// past them, which is what makes it safe for the request pipeline to stop
// silently truncating every string it sees.
const POST_LIMITS = FIELD_LIMITS.post;
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
      trim: true,
      maxlength: [POST_LIMITS.contact, `Contact cannot exceed ${POST_LIMITS.contact} characters`],
    },
    returned: {
      type: Boolean,
      default: false,
    },
    // Make image optional
    image: {
      type: String,
      required: false, // Changed from required to optional
      maxlength: [POST_LIMITS.imageUrl, `Image URL cannot exceed ${POST_LIMITS.imageUrl} characters`],
    },
    // Cloudinary fields for proper image management
    cloudinaryUrl: {
      type: String,
      required: false, // Changed from required to optional
      maxlength: [POST_LIMITS.imageUrl, `Image URL cannot exceed ${POST_LIMITS.imageUrl} characters`],
    },
    cloudinaryPublicId: {
      type: String,
      required: false, // Changed from required to optional
      maxlength: [POST_LIMITS.imageUrl, `Image id cannot exceed ${POST_LIMITS.imageUrl} characters`],
    },
    mainDate: {
      type: String,
      required: false, // Made optional
      trim: true,
      maxlength: [POST_LIMITS.mainDate, `Date cannot exceed ${POST_LIMITS.mainDate} characters`],
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: [POST_LIMITS.description, `Description cannot exceed ${POST_LIMITS.description} characters`],
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
      maxlength: [
        POST_LIMITS.promotionPhoneNumber,
        `Phone number cannot exceed ${POST_LIMITS.promotionPhoneNumber} characters`,
      ],
    },
    // Additional useful fields
    city: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
    },
    exactLocation: {
      type: String,
      required: true,
      trim: true,
      maxlength: [POST_LIMITS.exactLocation, `Location cannot exceed ${POST_LIMITS.exactLocation} characters`],
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
      trim: true,
      maxlength: [POST_LIMITS.tag, `Tag cannot exceed ${POST_LIMITS.tag} characters`]
    }],
    // Where this listing was mirrored to, set by services/facebookService.js
    // and services/instagramService.js once the auto-post succeeds. The
    // publish responses used to be logged and discarded; without the ids
    // there is nothing to ask the Graph API about afterwards, so the reach a
    // listing gets on the Pages was invisible to the site.
    social: {
      facebook: {
        postId: { type: String, default: null },
        permalink: { type: String, default: null },
        postedAt: { type: Date, default: null },
      },
      instagram: {
        mediaId: { type: String, default: null },
        permalink: { type: String, default: null },
        postedAt: { type: Date, default: null },
      },
    },
    // Counters mirrored back from the Pages by services/socialStatsService.js.
    // Every number defaults to null rather than 0 so the UI can tell "never
    // fetched" (hide the row) from "genuinely zero" (show it) - a listing that
    // truly has no reactions yet is a different statement from one whose
    // numbers we simply do not have.
    socialStats: {
      facebook: {
        views: { type: Number, default: null },
        reactions: { type: Number, default: null },
        comments: { type: Number, default: null },
        shares: { type: Number, default: null },
        // Unique people who did something with the post, not just saw it -
        // a stronger reach signal than views.
        engagedUsers: { type: Number, default: null },
        // Link/photo clicks specifically.
        clicks: { type: Number, default: null },
        // Post deleted from the Page (or hidden from our token). Retrying
        // never recovers it, so the refresh sweep skips these permanently.
        unavailable: { type: Boolean, default: false },
      },
      instagram: {
        views: { type: Number, default: null },
        likes: { type: Number, default: null },
        comments: { type: Number, default: null },
        // Bookmark count - often a better "genuine interest" signal than a
        // like, since saving takes more intent than a tap while scrolling.
        saved: { type: Number, default: null },
        unavailable: { type: Boolean, default: false },
      },
      fetchedAt: { type: Date, default: null },
    },
    // The actual comment text left on the Facebook/Instagram copies, cached
    // here so the post's comment thread can show them next to the site's own
    // comments without a Graph call on every page load. Read-only mirrors of
    // someone else's platform: we can display them, never edit or delete
    // them, and never reply on a user's behalf (a reply through the Page
    // token would appear as the Page itself speaking, not the user).
    //
    // Capped at SOCIAL_COMMENTS_LIMIT newest per platform - this is context
    // alongside the site's own thread, not a full mirror of Facebook.
    //
    // Deliberately without a maxlength, unlike every other free-text field on
    // this schema: these are not submissions to validate, they are a mirror of
    // what Facebook already published, and a length rule here would only turn
    // someone else's long comment into a failed stats refresh.
    socialComments: {
      facebook: [{
        _id: false,
        commentId: { type: String },
        authorName: { type: String, default: null },
        text: { type: String, default: '' },
        createdAt: { type: Date, default: null },
      }],
      instagram: [{
        _id: false,
        commentId: { type: String },
        authorName: { type: String, default: null },
        text: { type: String, default: '' },
        createdAt: { type: Date, default: null },
      }],
      fetchedAt: { type: Date, default: null },
    },
    // Last time services/matchingService.js scored this post against the
    // opposite side. Read by the on-demand path so opening a post's "possible
    // matches" panel cannot re-run a full scan on every page view - including
    // for posts that legitimately have no matches at all, which is exactly the
    // case a "do we have stored pairs?" check would fail to throttle.
    lastMatchScanAt: {
      type: Date,
      default: null
    },
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

// 9. Social stats refresh sweep: scripts/refreshSocialStats.js walks mirrored
// posts oldest-stats-first, so the sort has to be served by an index.
postSchema.index({ "socialStats.fetchedAt": 1 }, { name: "social_stats_refresh" });

// 10. Facebook webhook receiver (routes/facebookWebhookRoutes.js): a reaction/
// comment event names the Facebook post id, and this is the lookup back to
// our post. Sparse - most posts have no Facebook mirror at all.
postSchema.index(
  { "social.facebook.postId": 1 },
  { name: "social_facebook_postid", sparse: true }
);

// 11. Search optimization: Country + Status + Text search
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
