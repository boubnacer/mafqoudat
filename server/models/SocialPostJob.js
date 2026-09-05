const mongoose = require("mongoose");

/**
 * One queued publish of one listing to one platform.
 *
 * Auto-posting used to happen inline in controllers/postsController.js: the
 * moment a listing was created, a Facebook publish and an Instagram publish
 * were fired concurrently, fire-and-forget. That is fine for one post at a
 * time and wrong for a burst - Meta limits both platforms, and the two limits
 * are different shapes:
 *
 *  - Instagram's Content Publishing API allows a fixed number of published
 *    posts per rolling 24 hours per account (25 at the time of writing). The
 *    26th is simply refused.
 *  - Facebook has no such published-post count. It rate-limits per app/Page
 *    on a rolling budget that every Graph call spends, so a burst can be
 *    throttled well before any daily total is reached.
 *
 * Neither was handled: a refused publish was caught, logged to the console and
 * dropped, leaving a listing permanently without its Page copy and nothing
 * anywhere to say so. This collection is the fix - the publish becomes a
 * durable record that a paced worker (services/socialPublishQueue.js) works
 * through one at a time, so a burst is spread out instead of lost, and a
 * refusal is retried or deferred instead of forgotten.
 *
 * Creating the listing on the site never waits on any of this; only the social
 * copy is queued.
 */
const socialPostJobSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    platform: {
      type: String,
      enum: ['facebook', 'instagram'],
      required: true,
    },
    status: {
      type: String,
      // pending    - waiting for its turn (nextAttemptAt says when it is due)
      // processing - claimed by a worker right now
      // done       - published; publishedId/permalink hold what came back
      // failed     - gave up after MAX_ATTEMPTS, or refused for a reason
      //              retrying cannot fix (a missing permission)
      // cancelled  - the listing was deleted or deactivated before its turn
      enum: ['pending', 'processing', 'done', 'failed', 'cancelled'],
      default: 'pending',
      required: true,
    },
    // Failed publishes only. Being deferred for a rate limit or a daily quota
    // is not an attempt - the request was never made, or was refused for a
    // reason that resolves by itself, so it must not count towards giving up.
    attempts: {
      type: Number,
      default: 0,
    },
    // When this job is next allowed to run. The worker claims the due job with
    // the oldest nextAttemptAt, so this one field carries retry backoff,
    // rate-limit cooldown and daily-quota deferral alike.
    nextAttemptAt: {
      type: Date,
      default: Date.now,
    },
    // Set while a worker holds this job. A job still processing long past the
    // lock timeout was interrupted (a deploy, a crash) and is returned to the
    // queue - see socialPublishQueue.reclaimStalled.
    lockedAt: {
      type: Date,
      default: null,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    // What the platform answered with: the Facebook post id or the Instagram
    // media id, and the public URL of the copy. Also stored on the post itself
    // (Post.social) which is where the rest of the app reads them from; kept
    // here too because the job is marked done *before* the post is updated, so
    // if that second write fails the ids are still recoverable rather than
    // lost with no way to ask Meta which object was ours.
    publishedId: {
      type: String,
      default: null,
    },
    permalink: {
      type: String,
      default: null,
    },
    // Why this job is waiting, or why it gave up. Operational breadcrumb -
    // the thing that was missing entirely when failures only reached the
    // console.
    lastError: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// One publish per listing per platform, enforced by the database rather than
// by whoever calls enqueuePost. This is what makes enqueueing idempotent: a
// retried request, a double-submit or a re-run of a backfill can never put a
// second copy of the same listing on the same Page.
socialPostJobSchema.index({ post: 1, platform: 1 }, { unique: true });

// The claim query: the oldest due job for one platform.
socialPostJobSchema.index({ platform: 1, status: 1, nextAttemptAt: 1, createdAt: 1 });

// Pacing (when did this platform last publish?) and the rolling 24h window
// Instagram's daily limit is measured over.
socialPostJobSchema.index({ platform: 1, publishedAt: -1 });

// Recovering jobs whose worker died mid-publish.
socialPostJobSchema.index({ status: 1, lockedAt: 1 });

module.exports = mongoose.model("SocialPostJob", socialPostJobSchema);
