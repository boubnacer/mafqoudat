const mongoose = require("mongoose");

/**
 * One entry in the admin audit trail.
 *
 * The panel could already delete a user, wipe their posts and reset anyone's
 * password, and the only record of it was a line appended to `adminActions.log`
 * - a file on a filesystem that Render throws away on every deploy, readable by
 * nobody who was not SSH'd into the box. Two of the eight admin mutations wrote
 * even that; the rest left no trace at all.
 *
 * This is the readable half: a row per action, queryable by the panel itself,
 * so "who suspended this listing, and when" has an answer. `logEvents` still
 * runs beside it - the file is the copy that survives a database problem, this
 * is the copy an admin can actually look at.
 *
 * Capped by a TTL rather than a cleanup script: the deployment target is a
 * free-tier cluster whose storage headroom the panel itself monitors, and an
 * audit row is worth keeping for a quarter, not forever.
 */
const RETENTION_DAYS = 90;

const adminActionSchema = new mongoose.Schema(
  {
    // Who did it. Kept as a ref for the panel's populate, with the username
    // copied alongside so a row still names its actor after that admin's own
    // account is gone - which is exactly when an audit trail matters.
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    actorName: {
      type: String,
      default: "",
      trim: true,
    },
    // What they did, as a stable code. Wording lives in the client's
    // translations, the same contract the notification reason codes use.
    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    // What it was done to. `targetId` is deliberately not a ref: half of these
    // point at documents the action itself deleted, so a populate would answer
    // null and a row about a deletion would lose its subject.
    targetType: {
      type: String,
      enum: ['post', 'user', 'report', 'comment', 'contact', 'city', 'promotion', 'resetRequest', 'system'],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    // A human-readable stand-in for the target, captured at action time for
    // the same reason as `actorName`.
    targetLabel: {
      type: String,
      default: "",
      trim: true,
    },
    // Free-form detail (old/new status, deleted post count...). Small by
    // construction - the service truncates strings before writing.
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

adminActionSchema.index({ createdAt: -1 });
adminActionSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: RETENTION_DAYS * 24 * 60 * 60 }
);

module.exports = mongoose.model("AdminAction", adminActionSchema);
module.exports.RETENTION_DAYS = RETENTION_DAYS;
