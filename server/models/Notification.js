const mongoose = require("mongoose");

/**
 * One in-app notification addressed to one user.
 *
 * Everything the list needs beyond ids is resolved at read time from the
 * referenced posts (see controllers/notificationsController.js) rather than
 * snapshotted here: a post's photo, city or category can change after the
 * notification is created, and a stale snapshot would send the reader to a
 * listing that no longer looks like what they were shown.
 */
const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ['match_found'],
      default: 'match_found',
      required: true,
    },
    // The recipient's own post - the one they are being alerted about.
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    // The other side of the pair: someone else's post that may be the same item.
    matchedPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    match: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PostMatch",
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    reasons: [{
      type: String,
    }],
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    // Set when the user deletes the notification, or dismisses the underlying
    // match. Kept as a flag rather than a hard delete so re-scoring the same
    // pair cannot resurrect something the user has already rejected.
    isDismissed: {
      type: Boolean,
      default: false,
    },
    emailSentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// The pair is the identity of a match notification: re-scoring an existing
// pair must update it in place, never stack a second copy in the user's list.
notificationSchema.index(
  { user: 1, type: 1, post: 1, matchedPost: 1 },
  { unique: true }
);

// Inbox listing.
notificationSchema.index({ user: 1, isDismissed: 1, createdAt: -1 });

// Unread badge count.
notificationSchema.index({ user: 1, isRead: 1, isDismissed: 1 });

// Cleanup when a post or match goes away.
notificationSchema.index({ match: 1 });
notificationSchema.index({ matchedPost: 1 });
notificationSchema.index({ post: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
