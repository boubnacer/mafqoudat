const Post = require('../models/Post');
const SocialPostJob = require('../models/SocialPostJob');
const facebookService = require('./facebookService');
const instagramService = require('./instagramService');
const {
  describeGraphError,
  isRateLimitError,
  isPublishLimitError,
  isPermissionError,
} = require('./graphApi');

/**
 * Paces the auto-posting of new listings to the Facebook Page and the
 * Instagram account, and never loses one.
 *
 * Before this, controllers/postsController.js published both copies inline the
 * moment a listing was created - two concurrent Graph calls per post, with no
 * pacing, no awareness of either platform's limits, and no retry. One post at
 * a time that works; a burst does not:
 *
 *  - Instagram refuses everything past a fixed number of published posts per
 *    rolling 24 hours (25 by default here). Post 26 onwards simply never
 *    reached Instagram, and the failure went to the console.
 *  - Facebook has no daily post count, but every Graph call spends a rolling
 *    per-app/per-Page budget, and concurrency spends it fastest. Ten calls in
 *    one second is far more likely to be throttled than the same ten spread
 *    over a few minutes, even though the daily total is identical.
 *  - Simultaneous, near-identical automated posting is also the shape Meta's
 *    spam and quality systems look for, independent of any numeric limit.
 *
 * So publishing is now a queue (models/SocialPostJob.js) drained by this
 * worker, and the two defences are deliberately separate:
 *
 *  1. Pacing is unconditional. There is always at least MIN_PUBLISH_INTERVAL
 *     between two publishes on the same platform, whether or not any limit is
 *     anywhere near. Bursting until something breaks and only then slowing
 *     down is what this is meant to avoid.
 *  2. The daily quota is a second, independent gate on top of it, and one
 *     that defers rather than drops: once Instagram's window is full, the
 *     remaining jobs wait for the oldest publish to age out of it and go up
 *     the next day. Nothing is skipped.
 *
 * Creating a listing on the site is untouched by all of this - it never waited
 * on social publishing before and does not now. Only the social copy is queued.
 */

const readIntEnv = (name, fallback, { min, max }) => {
  const raw = Number.parseInt(process.env[name], 10);
  if (!Number.isFinite(raw)) return fallback;
  return Math.min(Math.max(raw, min), max);
};

// Minimum gap between two publishes on the same platform. The single most
// important number here: it is what turns any burst, of any size, into a
// steady trickle Meta has no reason to throttle.
const MIN_PUBLISH_INTERVAL_MS = readIntEnv('SOCIAL_QUEUE_MIN_INTERVAL_SECONDS', 30, { min: 5, max: 3600 }) * 1000;

// How often the worker looks for something to do. Shorter than the publish
// interval on purpose - the tick is just a check, the interval above is what
// actually decides when a publish happens.
const TICK_MS = readIntEnv('SOCIAL_QUEUE_TICK_SECONDS', 10, { min: 1, max: 300 }) * 1000;

// Instagram's Content Publishing API limit, per account, over the rolling
// window below. Meta's documented value is 25; it is configurable only so a
// change on their side is a deploy setting rather than a code change.
const INSTAGRAM_DAILY_LIMIT = readIntEnv('SOCIAL_QUEUE_IG_DAILY_LIMIT', 25, { min: 1, max: 100 });
const DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;

// Extra wait past the moment a quota slot theoretically frees up. The window
// is Meta's to measure, not ours, and being a minute late costs nothing while
// being a second early costs a refused publish.
const QUOTA_BUFFER_MS = 60 * 1000;

// How long a platform stands down after Meta throttles it. Also the circuit
// breaker: the whole platform waits, not just the job that hit the limit, so
// a throttled endpoint is not immediately hammered by the next queued job -
// which is what extends a block rather than clearing it.
const RATE_LIMIT_COOLDOWN_MS = readIntEnv('SOCIAL_QUEUE_RATE_LIMIT_COOLDOWN_MINUTES', 15, { min: 1, max: 720 }) * 60 * 1000;

// Stand-down after the platform itself says the daily publishing cap is
// reached. Longer than a throttle, because nothing frees up until a publish
// ages out of the 24h window, and shorter than 24h so a cap spent by posts we
// did not make is picked up again the moment it clears.
const PUBLISH_LIMIT_COOLDOWN_MS = readIntEnv('SOCIAL_QUEUE_PUBLISH_LIMIT_COOLDOWN_MINUTES', 60, { min: 5, max: 1440 }) * 60 * 1000;

// Retry backoff for a genuine failure (not a limit): 1min, 2, 4, 8... capped.
const RETRY_BASE_MS = readIntEnv('SOCIAL_QUEUE_RETRY_BASE_SECONDS', 60, { min: 5, max: 3600 }) * 1000;
const RETRY_MAX_MS = 6 * 60 * 60 * 1000;
const MAX_ATTEMPTS = readIntEnv('SOCIAL_QUEUE_MAX_ATTEMPTS', 5, { min: 1, max: 20 });

// A job still marked processing this long after it was claimed belongs to a
// worker that is gone. Generous on purpose: an Instagram publish legitimately
// takes tens of seconds (container creation, readiness polling, publish
// retries), and reclaiming a job that is still running risks a second copy.
const LOCK_TIMEOUT_MS = readIntEnv('SOCIAL_QUEUE_LOCK_TIMEOUT_MINUTES', 10, { min: 2, max: 120 }) * 60 * 1000;

const MAX_ERROR_LENGTH = 500;

// Order matters only in that Facebook, having no daily cap, is the platform
// most likely to have work to do; both are independent of each other.
const PLATFORMS = ['facebook', 'instagram'];

const DEFAULT_PUBLISHERS = {
  facebook: {
    service: facebookService,
    // What postNewListing resolves the platform's own id under, and where it
    // is stored on the post.
    idKey: 'postId',
    postIdPath: 'social.facebook.postId',
    postPermalinkPath: 'social.facebook.permalink',
    postPostedAtPath: 'social.facebook.postedAt',
    // Facebook does not cap published posts per day - its limit is a rolling
    // call budget, which pacing plus the rate-limit cooldown is what handles.
    dailyLimit: null,
  },
  instagram: {
    service: instagramService,
    idKey: 'mediaId',
    postIdPath: 'social.instagram.mediaId',
    postPermalinkPath: 'social.instagram.permalink',
    postPostedAtPath: 'social.instagram.postedAt',
    dailyLimit: INSTAGRAM_DAILY_LIMIT,
  },
};

const readPath = (source, path) => path.split('.').reduce((value, key) => (value == null ? value : value[key]), source);

class SocialPublishQueue {
  /**
   * Dependencies are injected so scripts/testSocialPublishQueue.js can drive
   * the whole thing with no database and no network, including its own clock -
   * pacing, quota windows and backoff are all time, and a test that has to
   * wait real minutes to check a 24h window is a test nobody runs.
   */
  constructor({
    jobs = SocialPostJob,
    posts = Post,
    publishers = DEFAULT_PUBLISHERS,
    now = () => Date.now(),
  } = {}) {
    this.jobs = jobs;
    this.posts = posts;
    this.publishers = publishers;
    this.now = now;
    this.timer = null;
    // One tick at a time. A publish can outlast the tick interval (Instagram's
    // readiness polling alone can), and overlapping ticks would defeat pacing.
    this.ticking = false;
    // platform -> epoch ms it may publish again. A fast path only: the durable
    // copy is on the jobs themselves (nextAttemptAt), which is what a restart
    // or a second instance reads.
    this.pausedUntil = new Map();
  }

  /** Platforms this deployment is actually set up to post to. */
  configuredPlatforms() {
    return PLATFORMS.filter((platform) => this.publishers[platform]?.service.isConfigured());
  }

  isEnabled() {
    if (process.env.SOCIAL_QUEUE_ENABLED === 'false') return false;
    return this.configuredPlatforms().length > 0;
  }

  // ---------------------------------------------------------------- enqueueing

  /**
   * Queues the social copies of a freshly created listing. Returns the
   * platforms queued.
   *
   * Idempotent twice over: the upsert cannot create a second job for the same
   * post and platform (the unique index would refuse it anyway), and a post
   * that already carries a platform's id is not queued for it at all.
   *
   * An unconfigured platform is skipped rather than queued, matching what the
   * inline publishing did - a job nobody can ever run is not a record worth
   * keeping.
   */
  async enqueuePost(post) {
    const postId = post?._id;
    if (!postId) return [];

    const queued = [];
    for (const platform of this.configuredPlatforms()) {
      const publisher = this.publishers[platform];
      if (readPath(post, publisher.postIdPath)) continue;

      try {
        await this.jobs.updateOne(
          { post: postId, platform },
          {
            // `post` and `platform` are deliberately not repeated here: an
            // upsert builds the new document from the filter's equality terms
            // as well as the update operators, and naming the same field twice
            // is how a write conflict is invited.
            $setOnInsert: {
              status: 'pending',
              attempts: 0,
              nextAttemptAt: new Date(this.now()),
            },
          },
          { upsert: true }
        );
        queued.push(platform);
      } catch (error) {
        // Two concurrent enqueues for the same post race to insert; the unique
        // index lets exactly one win, and the loser's job already exists.
        if (error?.code !== 11000) throw error;
      }
    }

    return queued;
  }

  // ------------------------------------------------------------------ claiming

  /**
   * Returns jobs whose worker disappeared mid-publish to the queue.
   *
   * The attempt counter goes up even though nothing was refused: an
   * interruption that repeats is a job that breaks its worker, and it has to
   * run out of attempts like any other failure rather than loop forever. It is
   * also the one place a duplicate post is conceivable - a process killed in
   * the window between Meta accepting a publish and this recording it would
   * republish on the retry - which is why the lock timeout is minutes rather
   * than seconds, and why the publish path re-checks the post first.
   */
  async reclaimStalled() {
    const cutoff = new Date(this.now() - LOCK_TIMEOUT_MS);
    const result = await this.jobs.updateMany(
      { status: 'processing', lockedAt: { $lt: cutoff } },
      {
        $set: {
          status: 'pending',
          lockedAt: null,
          lastError: 'Interrupted mid-publish and returned to the queue',
        },
        $inc: { attempts: 1 },
      }
    );

    const reclaimed = result?.modifiedCount || 0;
    if (reclaimed > 0) {
      console.warn(`Social publish queue: returned ${reclaimed} interrupted job(s) to the queue`);
    }
    return reclaimed;
  }

  /**
   * Takes the oldest due job for one platform, atomically. Two workers (two
   * instances, or a tick overlapping a drain script) can never take the same
   * one: the status change is the claim.
   */
  async claimNext(platform) {
    const now = new Date(this.now());
    return this.jobs.findOneAndUpdate(
      { platform, status: 'pending', nextAttemptAt: { $lte: now } },
      { $set: { status: 'processing', lockedAt: now } },
      // createdAt breaks the tie after a deferral has levelled a batch of
      // nextAttemptAt values, so the queue stays first-in-first-out.
      { sort: { nextAttemptAt: 1, createdAt: 1 }, new: true }
    );
  }

  // ----------------------------------------------------------------- schedules

  /** When this platform last published, or null if it never has. */
  async lastPublishAt(platform) {
    const latest = await this.jobs
      .findOne({ platform, publishedAt: { $ne: null } })
      .sort({ publishedAt: -1 })
      .select('publishedAt')
      .lean();

    return latest?.publishedAt ? new Date(latest.publishedAt).getTime() : null;
  }

  /**
   * Holds a whole platform back until `until`, pending jobs and all.
   *
   * Deferring only the job that hit a limit would just hand the next job the
   * same refusal a second later; the limit belongs to the platform, so the
   * wait does too. Ordering survives: the jobs are levelled to one time and
   * the claim's secondary sort on createdAt restores the original order.
   */
  async deferPlatform(platform, until, reason) {
    this.pausedUntil.set(platform, until.getTime());

    const result = await this.jobs.updateMany(
      { platform, status: 'pending', nextAttemptAt: { $lt: until } },
      { $set: { nextAttemptAt: until, lastError: reason } }
    );

    const deferred = result?.modifiedCount || 0;
    if (deferred > 0) {
      console.warn(
        `Social publish queue: ${platform} paused until ${until.toISOString()} `
        + `(${reason}); ${deferred} queued post(s) will go out after that.`
      );
    }
    return deferred;
  }

  /**
   * Holds the platform back when its rolling 24h publishing window is full.
   * Returns the resume time, or null when there is room.
   *
   * Counted from what this app published, which is exactly what it is allowed
   * to pace; anything posted to the account by hand is invisible here and is
   * caught by the platform's own refusal instead (see handleFailure).
   */
  async enforceDailyLimit(platform, limit) {
    const since = new Date(this.now() - DAILY_WINDOW_MS);
    const published = await this.jobs
      .find({ platform, publishedAt: { $gte: since } })
      .sort({ publishedAt: 1 })
      .select('publishedAt')
      .limit(limit)
      .lean();

    if (published.length < limit) return null;

    // The oldest publish still inside the window is the first slot to free up.
    const oldest = new Date(published[0].publishedAt).getTime();
    const resumeAt = new Date(oldest + DAILY_WINDOW_MS + QUOTA_BUFFER_MS);
    await this.deferPlatform(platform, resumeAt, `${limit}-post 24h publishing limit reached`);
    return resumeAt;
  }

  // ---------------------------------------------------------------- publishing

  /** Writes one job's outcome. */
  async finishJob(jobId, fields) {
    const update = { lockedAt: null, ...fields };
    if (typeof update.lastError === 'string') {
      update.lastError = update.lastError.slice(0, MAX_ERROR_LENGTH);
    }
    await this.jobs.updateOne({ _id: jobId }, { $set: update });
  }

  /** Puts a claimed job back in the queue, due at `nextAttemptAt`. */
  async requeueJob(job, nextAttemptAt, lastError, { countAttempt = false } = {}) {
    const update = {
      $set: {
        status: 'pending',
        lockedAt: null,
        nextAttemptAt,
        lastError: String(lastError).slice(0, MAX_ERROR_LENGTH),
      },
    };
    if (countAttempt) update.$inc = { attempts: 1 };
    await this.jobs.updateOne({ _id: job._id }, update);
  }

  /**
   * Publishes one claimed job. Returns a short outcome string for the caller's
   * logs and for the tests.
   */
  async processJob(job, platform) {
    const publisher = this.publishers[platform];

    // The whole document, not a projection: buildListingCaption reads a dozen
    // fields off it and resolves its own references, and a select() here would
    // have to be kept in step with a file it does not otherwise touch. One
    // document read per publish, at most one publish every MIN_PUBLISH_INTERVAL.
    const post = await this.posts.findById(job.post).lean();

    if (!post) {
      await this.finishJob(job._id, { status: 'cancelled', lastError: 'The listing no longer exists' });
      return 'cancelled';
    }

    // Queued while active, deleted or resolved before its turn. Publishing it
    // now would put a listing on the Page that the site itself no longer
    // shows - worse than not publishing it at all.
    if (post.status && post.status !== 'active') {
      await this.finishJob(job._id, {
        status: 'cancelled',
        lastError: `The listing is no longer active (status: ${post.status})`,
      });
      return 'cancelled';
    }

    // Already published - by the inline path this replaced, or by a previous
    // run of this job whose bookkeeping did not survive. The point of the
    // check is that it is the last line of defence against a second copy.
    const existingId = readPath(post, publisher.postIdPath);
    if (existingId) {
      await this.finishJob(job._id, {
        status: 'done',
        publishedId: existingId,
        permalink: readPath(post, publisher.postPermalinkPath) || null,
        publishedAt: readPath(post, publisher.postPostedAtPath) || new Date(this.now()),
        lastError: null,
      });
      return 'already-published';
    }

    let result;
    try {
      result = await publisher.service.postNewListing(post);
    } catch (error) {
      return this.handleFailure(job, platform, error);
    }

    const publishedId = result?.[publisher.idKey];
    if (!publishedId) {
      // postNewListing resolves null when the platform is not configured,
      // which cannot normally happen here (the platform was configured when
      // the job was claimed) but would otherwise silently mark a job done.
      await this.requeueJob(
        job,
        new Date(this.now() + RETRY_BASE_MS),
        'The platform returned no id for the published post',
        { countAttempt: true }
      );
      return 'error';
    }

    const publishedAt = new Date(this.now());

    // The job is written before the post, deliberately. If this process dies
    // between the two, the ids are still on record and scripts/socialQueue.js
    // --repair puts them back on the post; the other order would leave a
    // published copy nobody can ever ask Meta about, and a retry that posts it
    // a second time.
    await this.finishJob(job._id, {
      status: 'done',
      publishedAt,
      publishedId,
      permalink: result.permalink || null,
      lastError: null,
    });

    try {
      await this.posts.updateOne({ _id: post._id }, {
        $set: {
          [publisher.postIdPath]: publishedId,
          [publisher.postPermalinkPath]: result.permalink || null,
          [publisher.postPostedAtPath]: publishedAt,
        },
      });
    } catch (error) {
      console.error(
        `Social publish queue: ${platform} published post ${post._id} but storing the id failed `
        + `(${error.message}); run "npm run social-queue -- --repair" to reattach it.`
      );
    }

    return 'published';
  }

  /**
   * Decides what a failed publish means.
   *
   * The order of these checks is load-bearing: Meta returns its throttling
   * codes as OAuthException, so a permission check placed first would read
   * every rate limit as a permanent authorisation problem and give up on work
   * that only needed to wait.
   */
  async handleFailure(job, platform, error) {
    const description = describeGraphError(error);

    if (isPublishLimitError(error)) {
      const until = new Date(this.now() + PUBLISH_LIMIT_COOLDOWN_MS);
      await this.requeueJob(job, until, `Daily publishing limit reached: ${description}`);
      await this.deferPlatform(platform, until, 'the platform reported its daily publishing limit');
      return 'quota';
    }

    if (isRateLimitError(error)) {
      const until = new Date(this.now() + RATE_LIMIT_COOLDOWN_MS);
      await this.requeueJob(job, until, `Rate limited: ${description}`);
      await this.deferPlatform(platform, until, 'the platform is rate limiting this app');
      return 'rate-limited';
    }

    if (isPermissionError(error)) {
      // A token without the scope it needs answers the same way however many
      // times it is asked. Retrying spends the rate-limit budget the rest of
      // the queue needs, so this one stops and says so instead.
      await this.finishJob(job._id, {
        status: 'failed',
        lastError: `Not permitted: ${description}`,
      });
      console.error(
        `Social publish queue: ${platform} refused post ${job.post} for a permission reason `
        + `(${description}). Check FACEBOOK_PAGE_ACCESS_TOKEN's scopes; re-queue with `
        + '"npm run social-queue -- --retry-failed" once fixed.'
      );
      return 'failed';
    }

    const attempts = (job.attempts || 0) + 1;
    if (attempts >= MAX_ATTEMPTS) {
      await this.finishJob(job._id, {
        status: 'failed',
        attempts,
        lastError: description,
      });
      console.error(
        `Social publish queue: giving up on ${platform} for post ${job.post} after `
        + `${attempts} attempt(s) - ${description}`
      );
      return 'failed';
    }

    const backoff = Math.min(RETRY_BASE_MS * 2 ** (attempts - 1), RETRY_MAX_MS);
    await this.requeueJob(job, new Date(this.now() + backoff), description, { countAttempt: true });
    return 'retry';
  }

  // -------------------------------------------------------------------- worker

  /**
   * At most one publish per platform. Returns why, per platform, which is what
   * the drain script and the tests read.
   */
  async runPlatform(platform) {
    const publisher = this.publishers[platform];
    if (!publisher?.service.isConfigured()) return 'unconfigured';

    const pausedUntil = this.pausedUntil.get(platform);
    if (pausedUntil && this.now() < pausedUntil) return 'paused';

    const lastPublishAt = await this.lastPublishAt(platform);
    if (lastPublishAt !== null && this.now() - lastPublishAt < MIN_PUBLISH_INTERVAL_MS) return 'paced';

    if (publisher.dailyLimit && await this.enforceDailyLimit(platform, publisher.dailyLimit)) {
      return 'quota';
    }

    const job = await this.claimNext(platform);
    if (!job) return 'idle';

    return this.processJob(job, platform);
  }

  /** One pass over every platform. */
  async runOnce() {
    if (!this.isEnabled()) return {};

    await this.reclaimStalled();

    const outcomes = {};
    for (const platform of PLATFORMS) {
      try {
        outcomes[platform] = await this.runPlatform(platform);
      } catch (error) {
        // A failure in the queue's own bookkeeping (a database blip) must not
        // stop the worker; the job stays claimed and is reclaimed on timeout.
        outcomes[platform] = 'error';
        console.error(`Social publish queue: ${platform} pass failed - ${error.message}`);
      }
    }
    return outcomes;
  }

  /** Starts the in-process worker. Returns whether it started. */
  start() {
    if (this.timer) return false;
    if (!this.isEnabled()) {
      console.log('Social publish queue: no platform configured, worker not started');
      return false;
    }

    this.timer = setInterval(() => {
      if (this.ticking) return;
      this.ticking = true;
      this.runOnce()
        .catch((error) => console.error('Social publish queue tick failed:', error.message))
        .finally(() => { this.ticking = false; });
    }, TICK_MS);

    // Never hold the process open - a pending publish is durable in the
    // database and resumes on the next boot.
    if (typeof this.timer.unref === 'function') this.timer.unref();

    console.log(
      `Social publish queue started for ${this.configuredPlatforms().join(', ')} `
      + `(one post per ${MIN_PUBLISH_INTERVAL_MS / 1000}s per platform, `
      + `Instagram capped at ${INSTAGRAM_DAILY_LIMIT}/24h)`
    );
    return true;
  }

  stop() {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  }
}

module.exports = new SocialPublishQueue();
module.exports.SocialPublishQueue = SocialPublishQueue;
module.exports.PLATFORMS = PLATFORMS;
module.exports.PUBLISHERS = DEFAULT_PUBLISHERS;
module.exports.MIN_PUBLISH_INTERVAL_MS = MIN_PUBLISH_INTERVAL_MS;
module.exports.TICK_MS = TICK_MS;
module.exports.INSTAGRAM_DAILY_LIMIT = INSTAGRAM_DAILY_LIMIT;
module.exports.MAX_ATTEMPTS = MAX_ATTEMPTS;
module.exports.LOCK_TIMEOUT_MS = LOCK_TIMEOUT_MS;
module.exports.RATE_LIMIT_COOLDOWN_MS = RATE_LIMIT_COOLDOWN_MS;
module.exports.PUBLISH_LIMIT_COOLDOWN_MS = PUBLISH_LIMIT_COOLDOWN_MS;
module.exports.RETRY_BASE_MS = RETRY_BASE_MS;
module.exports.DAILY_WINDOW_MS = DAILY_WINDOW_MS;
module.exports.QUOTA_BUFFER_MS = QUOTA_BUFFER_MS;
