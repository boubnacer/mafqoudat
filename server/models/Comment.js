const mongoose = require("mongoose");
const { FIELD_LIMITS } = require("../config/fieldLimits");

/**
 * One comment written on the site itself.
 *
 * Comments made on the auto-posted Facebook/Instagram copies of a listing are
 * NOT stored here - those live on Meta's side and are read back on demand
 * into Post.socialComments (see services/socialStatsService.js). The two
 * sources are merged into one thread at read time by
 * controllers/commentsController.js, and kept distinguishable all the way to
 * the UI: a site comment is written by a known account we can moderate, a
 * Facebook comment is written by a stranger we have no authority over.
 *
 * Deleting is soft. A hard delete would let someone post something abusive,
 * have it removed, and leave no trace for a later report to be judged
 * against; keeping the row (with the text intact but hidden from listings)
 * means the moderation history survives while the reader stops seeing it.
 */
const commentSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      // Shared with the express-validator rule on the create route, so a long
      // comment is refused with a 400 naming the field rather than reaching
      // this backstop as a 500.
      maxlength: [
        FIELD_LIMITS.comment.text,
        `Comment cannot exceed ${FIELD_LIMITS.comment.text} characters`,
      ],
    },
    status: {
      type: String,
      enum: ['active', 'removed'],
      default: 'active',
    },
    // Who removed it, so an author deleting their own comment and a moderator
    // taking one down are distinguishable after the fact.
    removedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    removedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// The one query this collection exists to serve: a post's thread, newest
// first, active only.
commentSchema.index({ post: 1, status: 1, createdAt: -1 });

// "Has this user been flooding the site" - used by the per-user rate check on
// create, and by any future moderation view.
commentSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Comment", commentSchema);
