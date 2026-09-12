const Post = require('../models/Post');
const SocialPostJob = require('../models/SocialPostJob');
const facebookService = require('./facebookService');
const instagramService = require('./instagramService');
const { invalidateSocialImage } = require('./socialImageService');
const socialPublishNotificationService = require('./socialPublishNotificationService');
const {
  describeGraphError,
  isRateLimitError,
  isPublishLimitError,
  isMediaContentError,
  isSpamBlockError,
  isTransientError,
  isAuthError,
  isScopeError,
  readRateLimitUsage,
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
 *    spam and quality systems look for, independent of any numeric limit -
 *    accounts are reported blocked at around a dozen posts in an hour, less
 *    than half the documented daily cap.
 *
 * So publishing is a queue (models/SocialPostJob.js) drained by this worker,
 * and the defences are deliberately separate, in order of how much they know:
 *
 *  1. Pacing is unconditional. There is always at least MIN_PUBLISH_INTERVAL
 *     (plus a little jitter) between two publishes on the same platform,
 *     whether or not any limit is anywhere near. Bursting until something
 *     breaks and only then slowing down is what this is meant to avoid.
 *  2. Two rolling windows on top of that - an hourly ceiling and, for
 *     Instagram, the 24h cap Meta actually enforces. Both defer rather than
 *     drop: the remaining jobs wait for the oldest publish to age out of the
 *     window and go up by themselves. Nothing is skipped.
 *  3. The platform's own figure, where it has one. Instagram will say how
 *     much of its publishing quota the *account* has spent, which is the only
 *     number that also counts posts made by hand.
 *  4. What Meta says on the way past. Every Graph response carries how much
 *     of the call budget is spent, so the queue can stand a platform down
 *     before being throttled rather than after.
 *
 * And when something is refused anyway, whose problem it is decides what
 * happens: a limit, a throttle, a spam block or a dead token belongs to the
 * platform - the whole platform stands down and the job keeps its place and
 * its attempts - while a refused image or an unrecognised error is the job's
 * own and walks the backoff ladder.
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
// steady trickle Meta has no reason to throttle. This is Facebook's floor;
// Instagram has its own, separately below, because the two platforms have
// shown different sensitivity in practice and a single shared number cannot
// be tuned for one without moving the other.
const MIN_PUBLISH_INTERVAL_MS = readIntEnv('SOCIAL_QUEUE_MIN_INTERVAL_SECONDS', 60, { min: 5, max: 3600 }) * 1000;

// Up to this much extra, drawn fresh after every publish. Automated posting
// on a perfect metronome is itself a signal - the interval above says how
// fast, this says "not identically every time". Costs nothing and cannot
// make the queue faster, only slightly slower.
const PUBLISH_JITTER_MS = readIntEnv('SOCIAL_QUEUE_JITTER_SECONDS', 45, { min: 0, max: 600 }) * 1000;

// Instagram's own floor and jitter, intentionally more conservative than
// Facebook's. The observed spam block (error_subcode 2207051) happened on
// Instagram, at a cadence well inside its documented daily cap, and a fresh
// Page/account has no posting history to fall back on - both are reasons to
// give this platform more room than the default, not less. 180-300s (3-5
// minutes) rather than 60-105s: still fast enough that a burst of listings
// clears within the hourly ceiling below, slow enough that five posts land
// spread across several minutes instead of bunched in the first one.
const INSTAGRAM_MIN_INTERVAL_MS = readIntEnv('SOCIAL_QUEUE_IG_MIN_INTERVAL_SECONDS', 180, { min: 5, max: 3600 }) * 1000;
const INSTAGRAM_JITTER_MS = readIntEnv('SOCIAL_QUEUE_IG_JITTER_SECONDS', 120, { min: 0, max: 600 }) * 1000;

// The second pacing window, and the one Meta does not document.
//
// Instagram's published cap is 25 per rolling 24 hours, but accounts are
// reported blocked for suspected spam (error_subcode 2207051) at around a
// dozen posts inside one hour - well under that cap. A daily limit alone
// permits all 25 inside twenty minutes at the interval above, which is
// exactly the shape that earns a block, so there is an hourly ceiling as
// well. Facebook has no published-post cap at all, only a call budget, so
// its ceiling is looser and exists to keep a backlog from arriving as a
// wall of posts on the Page.
const HOURLY_WINDOW_MS = 60 * 60 * 1000;
const INSTAGRAM_HOURLY_LIMIT = readIntEnv('SOCIAL_QUEUE_IG_HOURLY_LIMIT', 5, { min: 1, max: 60 });
const FACEBOOK_HOURLY_LIMIT = readIntEnv('SOCIAL_QUEUE_FB_HOURLY_LIMIT', 10, { min: 1, max: 200 });

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

// Stand-down after Meta says the posting *behaviour* looks like spam
// (Instagram's 2207051, Facebook's code 368). Much longer than a throttle:
// nothing about the listing is wrong, and coming back at the same cadence is
// what turns a temporary block into a longer one.
const SPAM_BLOCK_COOLDOWN_MS = readIntEnv('SOCIAL_QUEUE_SPAM_BLOCK_COOLDOWN_MINUTES', 360, { min: 15, max: 2880 }) * 60 * 1000;

// Stand-down when the token itself is refused - expired, revoked, or no
// longer holding its role on the Page. A human has to replace it, and until
// they do every call costs rate-limit budget for a guaranteed refusal.
const AUTH_COOLDOWN_MS = readIntEnv('SOCIAL_QUEUE_AUTH_COOLDOWN_MINUTES', 60, { min: 5, max: 1440 }) * 60 * 1000;

// Meta reports how much of the app's and the asset's call budget is spent on
// every response. Standing down at this percentage is what makes the
// difference between slowing down before being throttled and finding out
// afterwards. 100 is where throttling actually begins.
const USAGE_PAUSE_PERCENT = readIntEnv('SOCIAL_QUEUE_USAGE_PAUSE_PERCENT', 85, { min: 10, max: 100 });

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

// What scripts/socialQueue.js --retry-failed writes on a job it puts back.
// It resets `attempts` on purpose - the operator is saying whatever refused
// the job has been dealt with, so it should get the full backoff ladder
// again - and that reset is exactly what would hide the fact that the job has
// already been to the platform once. This marker is how processJob still
// knows to ask whether the listing is already up before publishing it again.
const REQUEUED_BY_HAND = 'Re-queued by hand';

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
    hourlyLimit: FACEBOOK_HOURLY_LIMIT,
    minIntervalMs: MIN_PUBLISH_INTERVAL_MS,
    jitterMs: PUBLISH_JITTER_MS,
  },
  instagram: {
    service: instagramService,
    idKey: 'mediaId',
    postIdPath: 'social.instagram.mediaId',
    postPermalinkPath: 'social.instagram.permalink',
    postPostedAtPath: 'social.instagram.postedAt',
    dailyLimit: INSTAGRAM_DAILY_LIMIT,
    hourlyLimit: INSTAGRAM_HOURLY_LIMIT,
    minIntervalMs: INSTAGRAM_MIN_INTERVAL_MS,
    jitterMs: INSTAGRAM_JITTER_MS,
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
    // Jitter is the one deliberately non-deterministic thing in here, and a
    // test that cannot pin it cannot assert on pacing at all.
    random = Math.random,
    invalidateSocialImage: invalidateSocialImageFn = invalidateSocialImage,
    notifyAuthor = socialPublishNotificationService.notifyAuthor,
  } = {}) {
    this.jobs = jobs;
    this.posts = posts;
    this.publishers = publishers;
    this.now = now;
    this.random = random;
    // Same reasoning as `posts`/`jobs` above: the real implementation always
    // writes through models/Post directly (it is a derived-asset cache, not
    // part of a listing's own fields, so it does not belong on the injected
    // `posts` collection's write surface), which the test harness has no way
    // to observe or fake without this seam.
    this.invalidateSocialImage = invalidateSocialImageFn;
    // Tells the listing's author what became of its social copy. Injected for
    // the same reason as the line above: it writes through models/Notification
    // and models/User, neither of which the offline harness has.
    this.notifyAuthor = notifyAuthor;
    this.timer = null;
    // One tick at a time. A publish can outlast the tick interval (Instagram's
    // readiness polling alone can), and overlapping ticks would defeat pacing.
    this.ticking = false;
    // platform -> epoch ms it may publish again. A fast path only: the durable
    // copy is on the jobs themselves (nextAttemptAt), which is what a restart
    // or a second instance reads.
    this.pausedUntil = new Map();
    // platform -> extra milliseconds added to the pacing gap, redrawn after
    // every publish so two consecutive posts are never exactly as far apart
    // as the two before them.
    this.paceJitter = new Map();
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
   * Holds the platform back when it has already published `limit` posts inside
   * the last `windowMs`. Returns the resume time, or null when there is room.
   *
   * One function for both windows - the rolling 24 hours Instagram's Content
   * Publishing API actually caps, and the hourly ceiling that keeps a backlog
   * from arriving fast enough to look like spam (see INSTAGRAM_HOURLY_LIMIT).
   * They differ only in their numbers, and the resume time is derived the same
   * way in both cases: the oldest publish still inside the window is the first
   * slot to free up.
   *
   * Counted from what this app published, which is exactly what it is allowed
   * to pace; anything posted to the account by hand is invisible here and is
   * caught either by the platform's own quota endpoint (see
   * enforcePlatformQuota) or by its refusal (see handleFailure).
   */
  async enforceWindowLimit(platform, limit, windowMs, label) {
    const since = new Date(this.now() - windowMs);
    const published = await this.jobs
      .find({ platform, publishedAt: { $gte: since } })
      .sort({ publishedAt: 1 })
      .select('publishedAt')
      .limit(limit)
      .lean();

    if (published.length < limit) return null;

    const oldest = new Date(published[0].publishedAt).getTime();
    const resumeAt = new Date(oldest + windowMs + QUOTA_BUFFER_MS);
    await this.deferPlatform(platform, resumeAt, `${limit}-post ${label} publishing limit reached`);
    return resumeAt;
  }

  /**
   * Asks the platform itself how much of its publishing quota is left, when
   * it can answer that question (only Instagram can).
   *
   * The window count above is blind to anything published to the account by
   * any other means - a post made by hand from the app, another integration -
   * and every one of those spends a slot. Before this, the first sign of that
   * was a listing refused with error code 9, which cost an attempt and a full
   * cooldown. Meta's own figure costs one cached call and is always right.
   *
   * Unreachable, unsupported, or unanswerable all mean "carry on": the local
   * count and the platform's refusal are both still behind this.
   */
  async enforcePlatformQuota(platform) {
    const service = this.publishers[platform]?.service;
    if (typeof service?.publishingQuota !== 'function') return null;

    const quota = await service.publishingQuota();
    if (!quota || !quota.total || quota.used < quota.total) return null;

    // The window is Meta's to measure and it does not say when the next slot
    // frees up, so this waits out the ordinary publish-limit cooldown and
    // asks again rather than guessing at the edge of a window it cannot see.
    const until = new Date(this.now() + PUBLISH_LIMIT_COOLDOWN_MS);
    await this.deferPlatform(
      platform,
      until,
      `the account has used ${quota.used} of its ${quota.total} publishing slots`,
    );
    return until;
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

    // Every attempt after the first re-asks the platform whether this listing
    // is already there.
    //
    // Graph has no idempotency key, so a publish whose answer never came back
    // - a timeout, a reset, a process killed between the call and the write -
    // is indistinguishable from one that was refused, and the retry that
    // follows is how a listing ends up on the Page twice. The caption carries
    // the listing's own URL and nothing else on the account does, so the
    // account itself can settle it. Skipped on a job that has never run,
    // where there is by definition nothing to have duplicated, so the common
    // case pays nothing for this.
    const hasBeenTried = (job.attempts || 0) > 0 || job.lastError === REQUEUED_BY_HAND;
    if (hasBeenTried && typeof publisher.service.findPublishedListing === 'function') {
      const alreadyThere = await publisher.service.findPublishedListing(post);
      if (alreadyThere?.[publisher.idKey]) {
        console.warn(
          `Social publish queue: ${platform} already carries post ${post._id} `
          + `(${alreadyThere[publisher.idKey]}) - recording it instead of publishing a second copy.`
        );
        return this.recordPublished(job, platform, post, alreadyThere, 'recovered');
      }
    }

    let result;
    try {
      result = await publisher.service.postNewListing(post);
    } catch (error) {
      return this.handleFailure(job, platform, error, post);
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

    await this.applyUsage(platform, result.usage);

    return this.recordPublished(job, platform, post, result, 'published');
  }

  /**
   * Writes one successful publish down, in the order that makes a failed
   * second write recoverable.
   *
   * The job is written before the post, deliberately. If this process dies
   * between the two, the ids are still on record and scripts/socialQueue.js
   * --repair puts them back on the post; the other order would leave a
   * published copy nobody can ever ask Meta about, and a retry that posts it
   * a second time.
   */
  async recordPublished(job, platform, post, result, outcome) {
    const publisher = this.publishers[platform];
    const publishedId = result[publisher.idKey];
    const publishedAt = new Date(this.now());

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

    await this.announce(post, platform, 'published');

    return outcome;
  }

  /**
   * Tells the author what became of their listing's copy on one platform.
   *
   * Sent per platform as each job reaches a terminal state, never held back
   * for the other one - see socialPublishNotificationService for why. Awaited
   * only so a test can observe it; it swallows its own failures, and this
   * catch is the second belt: a notification must never be able to turn a
   * successful publish into a retried one.
   */
  async announce(post, platform, status) {
    try {
      await this.notifyAuthor({ post, platform, status });
    } catch (error) {
      console.error(`Social publish queue: notifying the author failed - ${error.message}`);
    }
  }

  /**
   * Slows a platform down before Meta starts refusing it.
   *
   * Every Graph response carries how much of the app's and the asset's call
   * budget is spent, as a percentage of the ceiling where throttling begins.
   * Acting on it is the difference between backing off ahead of a block and
   * discovering one afterwards - and a block, unlike a pause, also costs the
   * job that ran into it an attempt and a cooldown.
   */
  async applyUsage(platform, usage) {
    if (!usage || !Number.isFinite(usage.percent)) return false;
    if (usage.percent < USAGE_PAUSE_PERCENT) return false;

    const until = new Date(this.now() + RATE_LIMIT_COOLDOWN_MS);
    await this.deferPlatform(
      platform,
      until,
      `${Math.round(usage.percent)}% of the platform's call budget is spent`,
    );
    return true;
  }

  /** 1min, 2, 4, 8... capped, for a failure that is genuinely this job's. */
  backoffFor(attempts) {
    return Math.min(RETRY_BASE_MS * 2 ** (attempts - 1), RETRY_MAX_MS);
  }

  /**
   * Retries a job on the backoff ladder, or gives up once it has had its
   * attempts. Only ever called for failures that are this job's own - a limit,
   * a throttle or a bad token is the platform's and is handled above, without
   * ever costing an attempt.
   */
  async retryOrFail(job, platform, description, { onGiveUp = null, post = null } = {}) {
    const attempts = (job.attempts || 0) + 1;

    if (attempts >= MAX_ATTEMPTS) {
      await this.finishJob(job._id, { status: 'failed', attempts, lastError: description });
      console.error(
        `Social publish queue: giving up on ${platform} for post ${job.post} after `
        + `${attempts} attempt(s) - ${description}`
        + (onGiveUp ? ` ${onGiveUp}` : '')
      );
      // Giving up is the only failure the author hears about. A retry, a
      // cooldown or a stand-down on credentials all still end in the listing
      // going up by itself, and telling someone their post "failed" while the
      // queue is still working on it would be wrong twice over.
      if (post) await this.announce(post, platform, 'failed');
      return 'failed';
    }

    await this.requeueJob(job, new Date(this.now() + this.backoffFor(attempts)), description, { countAttempt: true });
    return 'retry';
  }

  /**
   * Decides what a failed publish means.
   *
   * The order of these checks is load-bearing, and for one reason: Meta
   * returns almost everything under `type: "OAuthException"` - throttles,
   * publishing caps, spam blocks, refused images and genuinely missing
   * permissions alike. So every check here is on a specific code or subcode,
   * and the ones that describe a temporary condition come first; a broad
   * "is this an authorisation problem?" test placed early would read every
   * one of them as permanent and stop work that only needed to wait.
   *
   * The split that matters is whose problem it is. A limit, a throttle, a
   * spam block or a dead token belongs to the *platform*: the job is put back
   * untouched, the whole platform stands down, and no attempt is spent -
   * otherwise one expired token quietly converts a night's worth of listings
   * into dead jobs, one at a time, at the pacing interval. Only a failure
   * that is this job's own - a refused image, a transient error, an
   * unrecognised one - costs an attempt.
   */
  async handleFailure(job, platform, error, post = null) {
    const description = describeGraphError(error);

    // Meta thinks the posting *behaviour* looks like spam, independently of
    // any documented limit. Nothing about this listing is wrong and nothing
    // about it can be fixed; coming back at the same cadence is what turns a
    // temporary block into a longer one, so the platform waits hours.
    if (isSpamBlockError(error)) {
      const until = new Date(this.now() + SPAM_BLOCK_COOLDOWN_MS);
      await this.requeueJob(job, until, `Publishing blocked as suspected spam: ${description}`);
      await this.deferPlatform(platform, until, 'the platform flagged this posting pattern as spam');
      console.error(
        `Social publish queue: ${platform} blocked post ${job.post} as suspected spam (${description}). `
        + `Pausing ${platform} until ${until.toISOString()}; consider raising `
        + 'SOCIAL_QUEUE_MIN_INTERVAL_SECONDS and lowering the hourly limit.'
      );
      return 'spam-blocked';
    }

    if (isPublishLimitError(error)) {
      const until = new Date(this.now() + PUBLISH_LIMIT_COOLDOWN_MS);
      await this.requeueJob(job, until, `Daily publishing limit reached: ${description}`);
      await this.deferPlatform(platform, until, 'the platform reported its daily publishing limit');
      return 'quota';
    }

    if (isRateLimitError(error)) {
      // Meta states how long it will be before access returns, in minutes,
      // on the response that refused the call. When it does, that beats any
      // cooldown guessed from a constant - in both directions.
      const usage = readRateLimitUsage(error);
      const wait = usage?.regainAccessMinutes > 0
        ? usage.regainAccessMinutes * 60 * 1000
        : RATE_LIMIT_COOLDOWN_MS;
      const until = new Date(this.now() + wait);
      await this.requeueJob(job, until, `Rate limited: ${description}`);
      await this.deferPlatform(platform, until, 'the platform is rate limiting this app');
      return 'rate-limited';
    }

    // The token itself is expired, revoked, or no longer holds its role on
    // the Page. Specific codes, unlike the permission catch-all further down,
    // so this is safe to check before the content errors.
    if (isAuthError(error)) {
      return this.standDownOnCredentials(job, platform, `The access token was refused: ${description}`, description);
    }

    // The platform refused the image or the caption itself, not the request's
    // credentials. The cached derivative is invalidated so the next attempt
    // regenerates the image instead of resubmitting the exact file that was
    // just rejected - ensureSocialImage only ever reuses a cache entry, it
    // does not re-validate one, so a bad derivative would otherwise be served
    // to every future attempt on this post, on both platforms, forever.
    if (isMediaContentError(error)) {
      await this.invalidateSocialImage(job.post);
      const outcome = await this.retryOrFail(job, platform, description, {
        onGiveUp: 'The cached derivative was cleared; a fresh one will be generated on the next attempt.',
        post,
      });
      if (outcome === 'retry') {
        console.warn(
          `Social publish queue: ${platform} rejected the media for post ${job.post} - ${description}. `
          + 'Regenerating and retrying.'
        );
      }
      return outcome;
    }

    // Meta could not complete the call this time - a timeout fetching the
    // image, a 5xx, a connection that never answered. This has to be its own
    // branch, ahead of the permission catch-all below, for the same reason
    // the content check is: Instagram's transient publishing errors arrive as
    // OAuthException too, and answering them with a credentials stand-down
    // would pause a platform that is working. Distinguished from a refused
    // image so it does *not* throw away a perfectly good derivative - "please
    // try again" says nothing is wrong with the file.
    if (isTransientError(error)) {
      return this.retryOrFail(job, platform, description, { post });
    }

    // A token that is valid but was never granted the scope this edge needs.
    // Deliberately isScopeError and not graphApi's broader isPermissionError:
    // that one answers true for anything wearing an OAuthException, which on
    // Meta is nearly everything, so using it here would let a code 100
    // "Invalid parameter" on one listing stand the platform down for every
    // listing behind it.
    if (isScopeError(error)) {
      return this.standDownOnCredentials(job, platform, `Not permitted: ${description}`, description);
    }

    return this.retryOrFail(job, platform, description, { post });
  }

  /**
   * Holds the whole platform back until someone fixes its credentials, and
   * keeps every queued listing exactly where it is.
   *
   * A missing scope and a dead token both need a human, and until one acts
   * every further call is a guaranteed refusal that spends the rate-limit
   * budget the rest of the queue needs - so the platform stands down rather
   * than each job discovering it in turn.
   *
   * Deliberately no longer terminal for the job. It used to mark it failed on
   * the spot, which meant a token that went stale overnight turned every
   * listing posted overnight into a dead job needing a manual
   * --retry-failed; the queue is durable and shows its state, so the listings
   * now wait for the credentials to be fixed and go up by themselves.
   */
  async standDownOnCredentials(job, platform, reason, description) {
    const until = new Date(this.now() + AUTH_COOLDOWN_MS);
    await this.requeueJob(job, until, reason);
    await this.deferPlatform(platform, until, "the platform refused this app's credentials");
    console.error(
      `Social publish queue: ${platform} refused post ${job.post} - ${description}. `
      + 'Check FACEBOOK_PAGE_ACCESS_TOKEN (validity and scopes)'
      + `${platform === 'instagram' ? ' and INSTAGRAM_ACCOUNT_ID' : ''}. `
      + `${platform} is paused until ${until.toISOString()}; queued listings are kept and `
      + 'will publish themselves once the credentials work again.'
    );
    return 'auth';
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

    const gap = publisher.minIntervalMs + (this.paceJitter.get(platform) || 0);
    const lastPublishAt = await this.lastPublishAt(platform);
    if (lastPublishAt !== null && this.now() - lastPublishAt < gap) return 'paced';

    // Nothing below here is reached unless there is something to publish, so
    // the three gates cost nothing on an idle queue.
    const job = await this.claimNext(platform);
    if (!job) return 'idle';

    // Both windows, and then the platform's own figure. Checked after the
    // claim and released back if any of them says no: the alternative is
    // three queries on every tick of an empty queue, forever.
    const blocked = (publisher.hourlyLimit
        && await this.enforceWindowLimit(platform, publisher.hourlyLimit, HOURLY_WINDOW_MS, 'hourly'))
      || (publisher.dailyLimit
        && await this.enforceWindowLimit(platform, publisher.dailyLimit, DAILY_WINDOW_MS, '24h'))
      || await this.enforcePlatformQuota(platform);

    if (blocked) {
      // deferPlatform only moves jobs that are still pending; this one was
      // claimed a moment ago, so it is put back explicitly and keeps its
      // place - it is the oldest, and nothing about it failed.
      await this.requeueJob(job, blocked, 'Waiting for a publishing slot');
      return 'quota';
    }

    const outcome = await this.processJob(job, platform);

    // Redraw the pacing jitter after anything that actually reached the
    // platform, so the next publish is not exactly MIN_PUBLISH_INTERVAL after
    // this one the way every publish before it was.
    if (outcome === 'published' || outcome === 'recovered') {
      this.paceJitter.set(platform, Math.floor(this.random() * publisher.jitterMs));
    }

    return outcome;
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
      `Social publish queue started for ${this.configuredPlatforms().join(', ')} - `
      + `Facebook: one post per ${MIN_PUBLISH_INTERVAL_MS / 1000}-`
      + `${(MIN_PUBLISH_INTERVAL_MS + PUBLISH_JITTER_MS) / 1000}s, ${FACEBOOK_HOURLY_LIMIT}/h; `
      + `Instagram: one post per ${INSTAGRAM_MIN_INTERVAL_MS / 1000}-`
      + `${(INSTAGRAM_MIN_INTERVAL_MS + INSTAGRAM_JITTER_MS) / 1000}s, `
      + `${INSTAGRAM_HOURLY_LIMIT}/h and ${INSTAGRAM_DAILY_LIMIT}/24h`
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
module.exports.REQUEUED_BY_HAND = REQUEUED_BY_HAND;
module.exports.PUBLISHERS = DEFAULT_PUBLISHERS;
module.exports.MIN_PUBLISH_INTERVAL_MS = MIN_PUBLISH_INTERVAL_MS;
module.exports.PUBLISH_JITTER_MS = PUBLISH_JITTER_MS;
module.exports.INSTAGRAM_MIN_INTERVAL_MS = INSTAGRAM_MIN_INTERVAL_MS;
module.exports.INSTAGRAM_JITTER_MS = INSTAGRAM_JITTER_MS;
module.exports.HOURLY_WINDOW_MS = HOURLY_WINDOW_MS;
module.exports.INSTAGRAM_HOURLY_LIMIT = INSTAGRAM_HOURLY_LIMIT;
module.exports.FACEBOOK_HOURLY_LIMIT = FACEBOOK_HOURLY_LIMIT;
module.exports.SPAM_BLOCK_COOLDOWN_MS = SPAM_BLOCK_COOLDOWN_MS;
module.exports.AUTH_COOLDOWN_MS = AUTH_COOLDOWN_MS;
module.exports.USAGE_PAUSE_PERCENT = USAGE_PAUSE_PERCENT;
module.exports.TICK_MS = TICK_MS;
module.exports.INSTAGRAM_DAILY_LIMIT = INSTAGRAM_DAILY_LIMIT;
module.exports.MAX_ATTEMPTS = MAX_ATTEMPTS;
module.exports.LOCK_TIMEOUT_MS = LOCK_TIMEOUT_MS;
module.exports.RATE_LIMIT_COOLDOWN_MS = RATE_LIMIT_COOLDOWN_MS;
module.exports.PUBLISH_LIMIT_COOLDOWN_MS = PUBLISH_LIMIT_COOLDOWN_MS;
module.exports.RETRY_BASE_MS = RETRY_BASE_MS;
module.exports.DAILY_WINDOW_MS = DAILY_WINDOW_MS;
module.exports.QUOTA_BUFFER_MS = QUOTA_BUFFER_MS;
