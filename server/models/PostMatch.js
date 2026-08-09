const mongoose = require("mongoose");

/**
 * A scored pairing between one LOST post and one FOUND post.
 *
 * Stored (rather than recomputed per request) for three reasons: the pair is
 * the unit a user acts on ("this is mine" / "not a match"), dismissals have to
 * survive re-scoring, and both owners need to see the same score and the same
 * explanation of why the pair was surfaced.
 *
 * `postA`/`postB` hold the pair in a canonical (id-sorted) order purely so a
 * unique index can prevent duplicates regardless of which side was created
 * first; use `lostPost`/`foundPost` when the semantic role matters.
 */
const postMatchSchema = new mongoose.Schema(
  {
    postA: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    postB: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    lostPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    foundPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    // Both post owners, so "every match touching me" is a single indexed query
    // instead of a two-step lookup through posts.
    owners: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    country: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Country",
      required: true,
    },
    // 0-100 confidence, see services/matchingService.js for the weighting.
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    // Per-signal contribution, in the same 0-100 space as `score`. Kept so the
    // UI can explain a match and so a future weighting change can be evaluated
    // against pairs already scored.
    //
    // These do not always add up to `score`: a shared category in the same city
    // is floored onto the strong-match boundary regardless of what the signals
    // earned (see applyCoreMatchFloor in services/matchingService.js). Read the
    // breakdown as the record of each signal, not as the arithmetic behind the
    // total.
    breakdown: {
      category: { type: Number, default: 0 },
      city: { type: Number, default: 0 },
      location: { type: Number, default: 0 },
      date: { type: Number, default: 0 },
      keywords: { type: Number, default: 0 },
    },
    // Stable reason codes translated client-side, never user-facing text.
    reasons: [{
      type: String,
      enum: [
        'same_category',
        'same_city',
        'nearby_location',
        'close_dates',
        'similar_description',
        'shared_reference',
      ],
    }],
    // Days between the two posts' event dates, and whether both sides supplied
    // a real date rather than falling back to their posting time.
    daysApart: {
      type: Number,
      default: null,
    },
    exactDates: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['active', 'confirmed', 'closed'],
      default: 'active',
    },
    // Dismissal is per-user: one owner deciding "not mine" must not hide the
    // pair from the other owner, who may still recognise it.
    dismissedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    confirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    computedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// One record per pair, whichever side triggered the scoring.
postMatchSchema.index({ postA: 1, postB: 1 }, { unique: true });

// "Matches for this post", the post-detail panel's query.
postMatchSchema.index({ postA: 1, status: 1, score: -1 });
postMatchSchema.index({ postB: 1, status: 1, score: -1 });

// "Everything matching anything I own", the notifications page's query.
postMatchSchema.index({ owners: 1, status: 1, score: -1 });

// Staleness sweep for on-demand recomputation.
postMatchSchema.index({ computedAt: 1 });

/**
 * Canonical pair ordering. Returns the two ids sorted by their hex string so
 * the unique index above sees the same pair only once.
 */
postMatchSchema.statics.canonicalPair = function canonicalPair(idA, idB) {
  const a = String(idA);
  const b = String(idB);
  return a <= b ? [idA, idB] : [idB, idA];
};

module.exports = mongoose.model("PostMatch", postMatchSchema);
