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
      enum: ['match_found', 'new_comment'],
      default: 'match_found',
      required: true,
    },
    // The recipient's own post - the one they are being alerted about. Always
    // set, whichever type this is: a match's counterpart or a comment both
    // hang off the post the recipient owns.
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    // match_found only, below. Conditionally required rather than split into a
    // second collection: the read side (list, unread count, mark-read, dismiss)
    // is genuinely shared, and a second model would duplicate all of it.
    //
    // The other side of the pair: someone else's post that may be the same item.
    matchedPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: function () { return this.type === 'match_found'; },
    },
    match: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PostMatch",
      required: function () { return this.type === 'match_found'; },
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      required: function () { return this.type === 'match_found'; },
    },
    reasons: [{
      type: String,
    }],
    // new_comment only: the comment that was posted. Its text/author are read
    // live at query time (see notificationsController), same reasoning as not
    // snapshotting a post's photo/city above - an edited or removed comment
    // must not leave a stale copy behind.
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      required: function () { return this.type === 'new_comment'; },
    },
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
// Scoped to match_found via partialFilterExpression - matchedPost is absent on
// every new_comment row, and an unscoped unique index would treat that missing
// field as an equal null across all of them, rejecting every comment on a post
// after its first.
notificationSchema.index(
  { user: 1, type: 1, post: 1, matchedPost: 1 },
  { unique: true, partialFilterExpression: { type: 'match_found' } }
);

// One notification per comment per recipient - guards the same double-submit
// case the index above guards for matches, scoped the same way.
notificationSchema.index(
  { user: 1, type: 1, comment: 1 },
  { unique: true, partialFilterExpression: { type: 'new_comment' } }
);

// Inbox listing.
notificationSchema.index({ user: 1, isDismissed: 1, createdAt: -1 });

// Unread badge count.
notificationSchema.index({ user: 1, isRead: 1, isDismissed: 1 });

// Cleanup when a post, match or comment goes away.
notificationSchema.index({ match: 1 });
notificationSchema.index({ matchedPost: 1 });
notificationSchema.index({ post: 1 });
notificationSchema.index({ comment: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
