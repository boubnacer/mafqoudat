/**
 * Offline check of the Facebook/Instagram publishing queue.
 *
 *   node scripts/testSocialPublishQueue.js
 *
 * Needs no database, no network and no waiting: the two collections are
 * replaced with an in-memory fake, the publishers with stubs that answer
 * however a scenario needs them to, and the clock is injected, so a 24-hour
 * quota window is exercised in a few microseconds.
 *
 * What it covers is the behaviour that motivated the queue - a burst of
 * listings used to fire every Graph call at once, and anything Meta refused
 * (its rolling call budget on Facebook, its 25-posts-per-24h publishing limit
 * on Instagram) was logged to the console and lost, leaving a listing
 * permanently without its Page copy. So: publishes are paced apart whether or
 * not a limit is near, a full daily window defers the rest to the next day
 * instead of dropping them, a throttle stands the whole platform down, and
 * nothing is ever published twice.
 *
 * Exits non-zero if any assertion failed.
 */

// Read at require time by the service, so they have to be set first. Small
// numbers keep the scenarios legible; the production defaults are in
// services/socialPublishQueue.js.
process.env.SOCIAL_QUEUE_MIN_INTERVAL_SECONDS = '30';
process.env.SOCIAL_QUEUE_IG_DAILY_LIMIT = '3';
process.env.SOCIAL_QUEUE_MAX_ATTEMPTS = '3';
process.env.SOCIAL_QUEUE_RETRY_BASE_SECONDS = '60';
process.env.SOCIAL_QUEUE_RATE_LIMIT_COOLDOWN_MINUTES = '15';
process.env.SOCIAL_QUEUE_PUBLISH_LIMIT_COOLDOWN_MINUTES = '60';
process.env.SOCIAL_QUEUE_LOCK_TIMEOUT_MINUTES = '10';

const {
  SocialPublishQueue,
  MIN_PUBLISH_INTERVAL_MS,
  INSTAGRAM_DAILY_LIMIT,
  MAX_ATTEMPTS,
  RETRY_BASE_MS,
  RATE_LIMIT_COOLDOWN_MS,
  PUBLISH_LIMIT_COOLDOWN_MS,
  LOCK_TIMEOUT_MS,
  DAILY_WINDOW_MS,
  HOURLY_WINDOW_MS,
  QUOTA_BUFFER_MS,
  SPAM_BLOCK_COOLDOWN_MS,
  AUTH_COOLDOWN_MS,
  USAGE_PAUSE_PERCENT,
  PUBLISH_JITTER_MS,
  REQUEUED_BY_HAND,
} = require('../services/socialPublishQueue');

let failures = 0;
let checks = 0;

const check = (label, actual, expected) => {
  checks += 1;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) {
    failures += 1;
    console.error(`FAIL  ${label}\n        expected ${JSON.stringify(expected)}\n        actual   ${JSON.stringify(actual)}`);
  } else {
    console.log(`ok    ${label}`);
  }
};

const checkThat = (label, condition, detail = '') => {
  checks += 1;
  if (!condition) {
    failures += 1;
    console.error(`FAIL  ${label}${detail ? `\n        ${detail}` : ''}`);
  } else {
    console.log(`ok    ${label}${detail ? `  (${detail})` : ''}`);
  }
};

// ---------------------------------------------------------------------------
// A minimal in-memory stand-in for a Mongoose model: just the query surface
// socialPublishQueue actually uses, with the comparison semantics that matter
// here (a Date compares by time; null never satisfies an inequality, the way
// a missing publishedAt must not count towards a quota window).
// ---------------------------------------------------------------------------

const getPath = (doc, path) => path.split('.').reduce((value, key) => (value == null ? value : value[key]), doc);

const setPath = (doc, path, value) => {
  const keys = path.split('.');
  let target = doc;
  for (const key of keys.slice(0, -1)) {
    if (typeof target[key] !== 'object' || target[key] === null) target[key] = {};
    target = target[key];
  }
  target[keys[keys.length - 1]] = value;
};

const equals = (a, b) => {
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  if (a == null || b == null) return (a == null) && (b == null);
  return String(a) === String(b);
};

/** Negative/zero/positive, or null when the value cannot be compared at all. */
const compare = (value, operand) => {
  if (value == null || operand == null) return null;
  const left = value instanceof Date ? value.getTime() : value;
  const right = operand instanceof Date ? operand.getTime() : operand;
  return left < right ? -1 : (left > right ? 1 : 0);
};

const matchesCondition = (value, condition) => {
  const isOperatorObject = condition !== null
    && typeof condition === 'object'
    && !(condition instanceof Date)
    && !Array.isArray(condition)
    && Object.keys(condition).every((key) => key.startsWith('$'));

  if (!isOperatorObject) return equals(value, condition);

  return Object.entries(condition).every(([operator, operand]) => {
    const order = compare(value, operand);
    switch (operator) {
      case '$eq': return equals(value, operand);
      case '$ne': return !equals(value, operand);
      case '$in': return operand.some((item) => equals(value, item));
      case '$lt': return order !== null && order < 0;
      case '$lte': return order !== null && order <= 0;
      case '$gt': return order !== null && order > 0;
      case '$gte': return order !== null && order >= 0;
      default: throw new Error(`Test fake: unsupported query operator ${operator}`);
    }
  });
};

const matches = (doc, filter) =>
  Object.entries(filter).every(([field, condition]) => matchesCondition(getPath(doc, field), condition));

const sortDocs = (docs, spec) => {
  if (!spec) return docs;
  // Stable, so equal keys keep insertion order - which is what makes the
  // queue first-in-first-out once a deferral has levelled nextAttemptAt.
  return [...docs].sort((a, b) => {
    for (const [field, direction] of Object.entries(spec)) {
      const order = compare(getPath(a, field), getPath(b, field));
      if (order !== null && order !== 0) return order * direction;
    }
    return 0;
  });
};

const applyUpdate = (doc, update) => {
  for (const [field, value] of Object.entries(update.$set || {})) setPath(doc, field, value);
  for (const [field, value] of Object.entries(update.$inc || {})) setPath(doc, field, (getPath(doc, field) || 0) + value);
  doc.updatedAt = new Date();
};

class FakeCollection {
  constructor({ defaults = () => ({}), clock } = {}) {
    this.docs = [];
    this.defaults = defaults;
    this.clock = clock;
    this.nextId = 1;
  }

  insert(fields) {
    const doc = {
      _id: `doc${this.nextId++}`,
      ...this.defaults(),
      ...fields,
      createdAt: new Date(this.clock()),
      updatedAt: new Date(this.clock()),
    };
    this.docs.push(doc);
    return doc;
  }

  /** A chainable, thenable query - .sort().select().limit().lean(). */
  query(resolve) {
    const state = { sort: null, limit: null };
    const chain = {
      sort: (spec) => { state.sort = spec; return chain; },
      select: () => chain,
      lean: () => chain,
      limit: (count) => { state.limit = count; return chain; },
      then: (onFulfilled, onRejected) => Promise.resolve()
        .then(() => resolve(state))
        .then(onFulfilled, onRejected),
    };
    return chain;
  }

  find(filter = {}) {
    return this.query((state) => {
      const found = sortDocs(this.docs.filter((doc) => matches(doc, filter)), state.sort);
      return (state.limit ? found.slice(0, state.limit) : found).map((doc) => ({ ...doc }));
    });
  }

  findOne(filter = {}) {
    return this.query((state) => {
      const found = sortDocs(this.docs.filter((doc) => matches(doc, filter)), state.sort)[0];
      return found ? { ...found } : null;
    });
  }

  findById(id) {
    return this.findOne({ _id: id });
  }

  async findOneAndUpdate(filter, update, options = {}) {
    const found = sortDocs(this.docs.filter((doc) => matches(doc, filter)), options.sort)[0];
    if (!found) return null;
    applyUpdate(found, update);
    return { ...found };
  }

  async updateOne(filter, update, options = {}) {
    const found = this.docs.find((doc) => matches(doc, filter));
    if (found) {
      applyUpdate(found, update);
      return { modifiedCount: 1, upsertedCount: 0 };
    }
    if (!options.upsert) return { modifiedCount: 0, upsertedCount: 0 };

    // Mongo seeds an upsert from the filter's equality terms plus $setOnInsert.
    const seed = {};
    for (const [field, condition] of Object.entries(filter)) {
      if (condition === null || typeof condition !== 'object' || condition instanceof Date) seed[field] = condition;
    }
    this.insert({ ...seed, ...(update.$setOnInsert || {}), ...(update.$set || {}) });
    return { modifiedCount: 0, upsertedCount: 1 };
  }

  async updateMany(filter, update) {
    const found = this.docs.filter((doc) => matches(doc, filter));
    found.forEach((doc) => applyUpdate(doc, update));
    return { modifiedCount: found.length };
  }

  async countDocuments(filter = {}) {
    return this.docs.filter((doc) => matches(doc, filter)).length;
  }
}

// ---------------------------------------------------------------------------
// Scenario scaffolding
// ---------------------------------------------------------------------------

const jobDefaults = () => ({
  status: 'pending',
  attempts: 0,
  nextAttemptAt: null,
  lockedAt: null,
  publishedAt: null,
  publishedId: null,
  permalink: null,
  lastError: null,
});

/** A Graph API failure, shaped exactly as axios surfaces one. */
const graphFailure = (code, message, extra = {}) => {
  const { status, headers, ...graph } = extra;
  const error = new Error(message);
  error.response = {
    status: status || 400,
    headers: headers || {},
    data: { error: { code, message, type: 'OAuthException', ...graph } },
  };
  return error;
};

/** The usage headers Meta puts on every Graph response, success or not. */
const usageHeaders = ({ percent = 0, regainMinutes = 0 } = {}) => ({
  'x-app-usage': JSON.stringify({ call_count: percent, total_cputime: 0, total_time: 0 }),
  'x-business-use-case-usage': JSON.stringify({
    '1234': [{ type: 'pages', call_count: 0, total_cputime: 0, total_time: 0, estimated_time_to_regain_access: regainMinutes }],
  }),
});

let clock;
let jobs;
let posts;
let publishCalls;
let publishBehaviour;
let queue;
let invalidateSocialImageCalls;
// What the platforms answer when asked whether a listing is already up, and
// how much of their publishing quota is spent. Both are the real services'
// way of telling the queue something it cannot know on its own.
let alreadyPublished;
let quotaBehaviour;
let lookupCalls;
let randomValue;

const advance = (ms) => { clock += ms; };

/**
 * The hourly ceiling is off unless a scenario asks for it. It is a real part
 * of the production configuration, but every scenario below is about one
 * thing, and a second window silently firing first would make several of them
 * assert the wrong mechanism.
 */
const setup = ({ instagramConfigured = true, hourlyLimits = {} } = {}) => {
  clock = Date.parse('2026-01-01T00:00:00.000Z');
  const now = () => clock;

  jobs = new FakeCollection({ defaults: jobDefaults, clock: now });
  posts = new FakeCollection({ clock: now });
  publishCalls = [];
  lookupCalls = [];
  randomValue = 0;
  publishBehaviour = {
    facebook: async (post) => ({ postId: `fb_${post._id}`, permalink: `https://facebook.com/${post._id}` }),
    instagram: async (post) => ({ mediaId: `ig_${post._id}`, permalink: `https://instagram.com/${post._id}` }),
  };
  alreadyPublished = { facebook: null, instagram: null };
  quotaBehaviour = { instagram: null };

  const publisher = (platform, idKey, configured) => ({
    service: {
      isConfigured: () => configured,
      postNewListing: async (post) => {
        publishCalls.push({ platform, post: post._id });
        return publishBehaviour[platform](post);
      },
      findPublishedListing: async (post) => {
        lookupCalls.push({ platform, post: post._id });
        const found = alreadyPublished[platform];
        return typeof found === 'function' ? found(post) : found;
      },
      // Only Instagram exposes a quota endpoint, so only Instagram's stub
      // carries one - the queue has to cope with a platform that cannot
      // answer the question at all.
      ...(platform === 'instagram' ? { publishingQuota: async () => quotaBehaviour.instagram } : {}),
    },
    idKey,
    postIdPath: `social.${platform}.${idKey}`,
    postPermalinkPath: `social.${platform}.permalink`,
    postPostedAtPath: `social.${platform}.postedAt`,
    dailyLimit: platform === 'instagram' ? INSTAGRAM_DAILY_LIMIT : null,
    hourlyLimit: hourlyLimits[platform] || null,
  });

  invalidateSocialImageCalls = [];

  queue = new SocialPublishQueue({
    jobs,
    posts,
    now,
    // Pacing jitter is the one deliberately random thing in the queue;
    // pinned here so every interval assertion below is exact.
    random: () => randomValue,
    publishers: {
      facebook: publisher('facebook', 'postId', true),
      instagram: publisher('instagram', 'mediaId', instagramConfigured),
    },
    // The real implementation writes through models/Post directly (see
    // socialPublishQueue.js's constructor comment), which this fake `posts`
    // collection cannot observe - injected the same way `jobs`/`posts` are.
    invalidateSocialImage: async (postId) => { invalidateSocialImageCalls.push(postId); },
  });
};

const addPost = (overrides = {}) => posts.insert({
  status: 'active',
  social: { facebook: { postId: null }, instagram: { mediaId: null } },
  ...overrides,
});

const jobFor = (postId, platform) => jobs.docs.find((doc) => String(doc.post) === String(postId) && doc.platform === platform);
const postById = (id) => posts.docs.find((doc) => doc._id === id);

// ---------------------------------------------------------------------------

const run = async () => {
  console.log('\n--- enqueueing is idempotent and skips what it should ---');

  setup();
  const first = addPost();
  check('both platforms are queued', await queue.enqueuePost(first), ['facebook', 'instagram']);
  check('one job per platform', jobs.docs.length, 2);

  await queue.enqueuePost(first);
  check('enqueueing the same post again adds nothing', jobs.docs.length, 2);

  const alreadyOnFacebook = addPost({ social: { facebook: { postId: 'fb_existing' }, instagram: { mediaId: null } } });
  check(
    'a platform the listing is already on is not queued for it',
    await queue.enqueuePost(alreadyOnFacebook),
    ['instagram']
  );

  setup({ instagramConfigured: false });
  check('an unconfigured platform is not queued', await queue.enqueuePost(addPost()), ['facebook']);

  // -------------------------------------------------------------------------
  console.log('\n--- a publish stores its ids on the listing ---');

  setup();
  const single = addPost();
  await queue.enqueuePost(single);
  check('both platforms publish on the first pass', await queue.runOnce(), { facebook: 'published', instagram: 'published' });

  const publishedPost = postById(single._id);
  check('the Facebook id is stored', publishedPost.social.facebook.postId, `fb_${single._id}`);
  check('the Instagram id is stored', publishedPost.social.instagram.mediaId, `ig_${single._id}`);
  check('the permalink is stored', publishedPost.social.facebook.permalink, `https://facebook.com/${single._id}`);
  check('the job records what was published', jobFor(single._id, 'facebook').status, 'done');
  check('and keeps its own copy of the id', jobFor(single._id, 'facebook').publishedId, `fb_${single._id}`);

  // -------------------------------------------------------------------------
  console.log('\n--- a burst is paced apart, in the order it arrived ---');

  setup();
  const burst = [addPost(), addPost(), addPost()];
  for (const post of burst) await queue.enqueuePost(post);

  await queue.runOnce();
  check('one post per platform on the first pass', publishCalls.length, 2);
  check('the oldest queued post goes first', publishCalls[0].post, burst[0]._id);

  await queue.runOnce();
  check('nothing publishes again straight away', publishCalls.length, 2);

  advance(MIN_PUBLISH_INTERVAL_MS - 1000);
  check('still paced a second before the interval is up', await queue.runOnce(), { facebook: 'paced', instagram: 'paced' });

  advance(2000);
  await queue.runOnce();
  check('the next pair publishes once the interval has passed', publishCalls.length, 4);
  check('and it is the second listing, not the third', publishCalls[2].post, burst[1]._id);

  advance(MIN_PUBLISH_INTERVAL_MS);
  await queue.runOnce();
  check('the whole burst reaches both platforms', publishCalls.length, 6);
  check('every job is done', jobs.docs.filter((job) => job.status === 'done').length, 6);

  // -------------------------------------------------------------------------
  console.log(`\n--- Instagram's ${INSTAGRAM_DAILY_LIMIT}-per-24h limit defers, never drops ---`);

  setup();
  const overQuota = [addPost(), addPost(), addPost(), addPost()];
  for (const post of overQuota) await queue.enqueuePost(post);

  for (let i = 0; i < INSTAGRAM_DAILY_LIMIT; i += 1) {
    await queue.runOnce();
    advance(MIN_PUBLISH_INTERVAL_MS);
  }
  const instagramPublishes = publishCalls.filter((call) => call.platform === 'instagram');
  check('the window fills up', instagramPublishes.length, INSTAGRAM_DAILY_LIMIT);

  const firstInstagramPublishAt = clock - INSTAGRAM_DAILY_LIMIT * MIN_PUBLISH_INTERVAL_MS;
  const atLimit = await queue.runOnce();
  check('Instagram stops at its limit', atLimit.instagram, 'quota');
  check('Facebook, which has no such limit, keeps going', atLimit.facebook, 'published');

  const deferred = jobFor(overQuota[3]._id, 'instagram');
  check('the fourth listing is still queued, not failed', deferred.status, 'pending');
  check(
    'and is due once the oldest publish leaves the 24h window',
    new Date(deferred.nextAttemptAt).getTime(),
    firstInstagramPublishAt + DAILY_WINDOW_MS + QUOTA_BUFFER_MS
  );

  advance(DAILY_WINDOW_MS - MIN_PUBLISH_INTERVAL_MS - 5000);
  check('still held back five seconds before the window rolls over', (await queue.runOnce()).instagram, 'paused');

  advance(6000);
  check('and publishes by itself once the oldest publish ages out', (await queue.runOnce()).instagram, 'published');
  check('nothing was lost', jobFor(overQuota[3]._id, 'instagram').status, 'done');

  // -------------------------------------------------------------------------
  console.log('\n--- a throttled platform stands down as a whole ---');

  setup();
  const throttled = [addPost(), addPost()];
  for (const post of throttled) await queue.enqueuePost(post);
  publishBehaviour.facebook = async () => { throw graphFailure(4, 'Application request limit reached'); };

  check('the failure is read as a rate limit', (await queue.runOnce()).facebook, 'rate-limited');
  const held = jobFor(throttled[0]._id, 'facebook');
  check('the job goes back to the queue', held.status, 'pending');
  check('being throttled is not a failed attempt', held.attempts, 0);
  check(
    'it waits out the cooldown',
    new Date(held.nextAttemptAt).getTime(),
    clock + RATE_LIMIT_COOLDOWN_MS
  );
  check(
    'and so does every other post queued for that platform',
    new Date(jobFor(throttled[1]._id, 'facebook').nextAttemptAt).getTime(),
    clock + RATE_LIMIT_COOLDOWN_MS
  );

  const facebookCallsBefore = publishCalls.filter((call) => call.platform === 'facebook').length;
  advance(MIN_PUBLISH_INTERVAL_MS);
  const duringCooldown = await queue.runOnce();
  check('nothing is retried on that platform during the cooldown', duringCooldown.facebook, 'paused');
  check(
    'so no further Facebook call is made',
    publishCalls.filter((call) => call.platform === 'facebook').length,
    facebookCallsBefore
  );
  check('while the other platform carries on unaffected', duringCooldown.instagram, 'published');

  publishBehaviour.facebook = async (post) => ({ postId: `fb_${post._id}`, permalink: null });
  advance(RATE_LIMIT_COOLDOWN_MS);
  check('it resumes once the cooldown is over', (await queue.runOnce()).facebook, 'published');

  // -------------------------------------------------------------------------
  console.log("\n--- the platform's own daily-limit refusal is honoured too ---");

  setup();
  const refused = addPost();
  await queue.enqueuePost(refused);
  publishBehaviour.instagram = async () => { throw graphFailure(9, 'The user is above the limit of 25 posts'); };

  check('a publishing-limit refusal is not a failure', (await queue.runOnce()).instagram, 'quota');
  const heldByPlatform = jobFor(refused._id, 'instagram');
  check('the job stays queued', heldByPlatform.status, 'pending');
  check('with no attempt counted against it', heldByPlatform.attempts, 0);
  check(
    'and waits out the publishing-limit cooldown',
    new Date(heldByPlatform.nextAttemptAt).getTime(),
    clock + PUBLISH_LIMIT_COOLDOWN_MS
  );

  // -------------------------------------------------------------------------
  console.log('\n--- credentials that are refused pause the platform and keep the work ---');
  // A missing scope and an expired token both need a human, and until one
  // acts every further call is a guaranteed refusal that spends the
  // rate-limit budget the rest of the queue needs. But neither is the
  // listing's fault: marking the job failed on the spot - which is what this
  // used to do - meant a token that went stale overnight turned every
  // listing posted overnight into a dead job needing a manual --retry-failed.

  setup();
  const denied = [addPost(), addPost()];
  for (const post of denied) await queue.enqueuePost(post);
  publishBehaviour.facebook = async () => { throw graphFailure(200, 'Permissions error'); };

  check('a permission error is read as a credentials problem', (await queue.runOnce()).facebook, 'auth');
  const withheld = jobFor(denied[0]._id, 'facebook');
  check('the listing keeps its place in the queue', withheld.status, 'pending');
  check('and is not charged an attempt for it', withheld.attempts, 0);
  check(
    'it waits out the credentials cooldown',
    new Date(withheld.nextAttemptAt).getTime(),
    clock + AUTH_COOLDOWN_MS
  );

  const facebookCallsAtRefusal = publishCalls.filter((call) => call.platform === 'facebook').length;
  advance(MIN_PUBLISH_INTERVAL_MS);
  check('the whole platform stands down rather than each job finding out in turn', (await queue.runOnce()).facebook, 'paused');
  check(
    'so the second listing never reaches the refusing endpoint',
    publishCalls.filter((call) => call.platform === 'facebook').length,
    facebookCallsAtRefusal
  );

  publishBehaviour.facebook = async (post) => ({ postId: `fb_${post._id}`, permalink: null });
  advance(AUTH_COOLDOWN_MS);
  check('and both listings publish themselves once the token works again', (await queue.runOnce()).facebook, 'published');

  setup();
  const malformed = [addPost(), addPost()];
  for (const post of malformed) await queue.enqueuePost(post);
  publishBehaviour.facebook = async () => { throw graphFailure(100, 'Invalid parameter'); };

  check('a bad request on one listing is that listing\'s problem', (await queue.runOnce()).facebook, 'retry');
  check('it costs an attempt', jobFor(malformed[0]._id, 'facebook').attempts, 1);
  check(
    'and nothing behind it is held back',
    new Date(jobFor(malformed[1]._id, 'facebook').nextAttemptAt).getTime() <= clock,
    true
  );

  publishBehaviour.facebook = async (post) => ({ postId: `fb_${post._id}`, permalink: null });
  advance(MIN_PUBLISH_INTERVAL_MS);
  check('so the platform keeps working', (await queue.runOnce()).facebook, 'published');

  setup();
  const expiredToken = addPost();
  await queue.enqueuePost(expiredToken);
  publishBehaviour.instagram = async () => {
    throw graphFailure(190, 'Error validating access token: Session has expired', { error_subcode: 463 });
  };

  check('an expired token is the same kind of problem', (await queue.runOnce()).instagram, 'auth');
  check('and does not fail the listing either', jobFor(expiredToken._id, 'instagram').status, 'pending');

  // -------------------------------------------------------------------------
  console.log('\n--- a rejected image or caption regenerates instead of giving up like a permission error ---');
  // Instagram nests "wrong media type" and similar content refusals under the
  // exact same `type: "OAuthException"` a real permission problem uses, so
  // this has to be classified and handled before the permission check above
  // reaches it - otherwise it gets logged as a token problem and, worse, the
  // exact same rejected derivative is replayed on every future retry, since
  // ensureSocialImage only ever reuses a cached image, it never re-checks one.

  setup();
  const wrongMediaType = addPost();
  await queue.enqueuePost(wrongMediaType);
  publishBehaviour.instagram = async () => { throw graphFailure(9004, 'Only photo or video can be accepted as media type.', { error_subcode: 2207052 }); };

  check('it is retried rather than failed outright', (await queue.runOnce()).instagram, 'retry');
  const rejectedJob = jobFor(wrongMediaType._id, 'instagram');
  check('the attempt is counted, same as any other retry', rejectedJob.attempts, 1);
  check(
    'and the cached derivative is cleared so the retry regenerates it',
    invalidateSocialImageCalls,
    [wrongMediaType._id],
  );

  advance(RETRY_BASE_MS);
  await queue.runOnce();
  advance(RETRY_BASE_MS * 2);
  check(`it gives up after ${MAX_ATTEMPTS} attempts, same as any other content error`, (await queue.runOnce()).instagram, 'failed');
  check('every attempt cleared the cache, not just the first', invalidateSocialImageCalls.length, MAX_ATTEMPTS);

  setup();
  const flaky = addPost();
  await queue.enqueuePost(flaky);
  publishBehaviour.facebook = async () => { throw new Error('socket hang up'); };

  check('an ordinary failure is retried', (await queue.runOnce()).facebook, 'retry');
  const retried = jobFor(flaky._id, 'facebook');
  check('the attempt is counted', retried.attempts, 1);
  check('and it backs off', new Date(retried.nextAttemptAt).getTime(), clock + RETRY_BASE_MS);

  advance(RETRY_BASE_MS);
  check('the second attempt is also retried', (await queue.runOnce()).facebook, 'retry');
  check('with a longer backoff', new Date(jobFor(flaky._id, 'facebook').nextAttemptAt).getTime(), clock + RETRY_BASE_MS * 2);

  advance(RETRY_BASE_MS * 2);
  check(`it gives up after ${MAX_ATTEMPTS} attempts`, (await queue.runOnce()).facebook, 'failed');
  check('and says why', jobFor(flaky._id, 'facebook').lastError, 'socket hang up');

  // -------------------------------------------------------------------------
  console.log('\n--- a listing that should no longer be published is not ---');

  setup();
  const deleted = addPost();
  await queue.enqueuePost(deleted);
  posts.docs = posts.docs.filter((doc) => doc._id !== deleted._id);

  check('a deleted listing is cancelled', (await queue.runOnce()).facebook, 'cancelled');
  check('and nothing was sent to the platform', publishCalls.length, 0);

  setup();
  const resolved = addPost();
  await queue.enqueuePost(resolved);
  postById(resolved._id).status = 'resolved';

  check('a listing that is no longer active is cancelled', (await queue.runOnce()).facebook, 'cancelled');
  check('and nothing was sent for it either', publishCalls.length, 0);

  // -------------------------------------------------------------------------
  console.log('\n--- nothing is ever published twice ---');

  setup();
  const mirrored = addPost({ social: { facebook: { postId: null }, instagram: { mediaId: null } } });
  await queue.enqueuePost(mirrored);
  // The inline path this queue replaced, or a previous run, got there first.
  setPath(postById(mirrored._id), 'social.facebook.postId', 'fb_already_there');

  check('an already-published listing is not published again', (await queue.runOnce()).facebook, 'already-published');
  check('no Facebook call was made', publishCalls.filter((call) => call.platform === 'facebook').length, 0);
  check('and the job is closed out with the existing id', jobFor(mirrored._id, 'facebook').publishedId, 'fb_already_there');

  // -------------------------------------------------------------------------
  console.log('\n--- an interrupted publish comes back, but not forever ---');

  setup();
  const interrupted = addPost();
  await queue.enqueuePost(interrupted);
  const claimed = await queue.claimNext('facebook');
  check('claiming marks the job as being worked on', claimed.status, 'processing');
  check('a claimed job cannot be claimed again', await queue.claimNext('facebook'), null);

  await queue.reclaimStalled();
  check('a job still inside the lock timeout is left alone', jobFor(interrupted._id, 'facebook').status, 'processing');

  advance(LOCK_TIMEOUT_MS + 1000);
  await queue.reclaimStalled();
  const reclaimed = jobFor(interrupted._id, 'facebook');
  check('an abandoned job returns to the queue', reclaimed.status, 'pending');
  check('and counts as an attempt, so it cannot loop forever', reclaimed.attempts, 1);

  // -------------------------------------------------------------------------
  console.log('\n--- a failed bookkeeping write does not cause a second post ---');

  setup();
  const unstored = addPost();
  await queue.enqueuePost(unstored);
  const workingUpdate = posts.updateOne.bind(posts);
  posts.updateOne = async () => { throw new Error('connection reset'); };

  check('the publish itself still counts as done', (await queue.runOnce()).facebook, 'published');
  posts.updateOne = workingUpdate;

  const orphaned = jobFor(unstored._id, 'facebook');
  check('the job is closed, so the next pass cannot republish it', orphaned.status, 'done');
  check('and it still holds the id the listing failed to record', orphaned.publishedId, `fb_${unstored._id}`);

  advance(MIN_PUBLISH_INTERVAL_MS);
  const callsBeforeRerun = publishCalls.filter((call) => call.platform === 'facebook').length;
  await queue.runOnce();
  check(
    'a later pass publishes nothing more for it',
    publishCalls.filter((call) => call.platform === 'facebook').length,
    callsBeforeRerun
  );

  // -------------------------------------------------------------------------
  console.log('\n--- a retry asks the platform before it posts a second copy ---');
  // Graph has no idempotency key, so a publish whose answer was lost - a
  // timeout, a reset, a process killed between the call and the write - is
  // indistinguishable from one that was refused. Retrying blind is exactly
  // how a listing ends up on the account twice.

  setup();
  const lostAnswer = addPost();
  await queue.enqueuePost(lostAnswer);
  publishBehaviour.instagram = async () => { throw new Error('socket hang up'); };

  check('the first attempt fails the way any transient error does', (await queue.runOnce()).instagram, 'retry');
  check('and nothing was looked up, because nothing could have duplicated yet', lookupCalls.length, 0);

  // It had in fact gone through; only the answer was lost.
  alreadyPublished.instagram = (post) => ({ mediaId: `ig_${post._id}`, permalink: 'https://instagram.com/p/abc' });
  const instagramCallsBeforeRetry = publishCalls.filter((call) => call.platform === 'instagram').length;
  advance(RETRY_BASE_MS);

  check('the retry recovers the existing post', (await queue.runOnce()).instagram, 'recovered');
  check('it asked the account first', lookupCalls.filter((call) => call.platform === 'instagram').length, 1);
  check(
    'and published nothing further',
    publishCalls.filter((call) => call.platform === 'instagram').length,
    instagramCallsBeforeRetry
  );
  const recovered = jobFor(lostAnswer._id, 'instagram');
  check('the job is closed out as done', recovered.status, 'done');
  check('with the id the platform already had', recovered.publishedId, `ig_${lostAnswer._id}`);
  check(
    'and the listing carries it too',
    postById(lostAnswer._id).social.instagram.mediaId,
    `ig_${lostAnswer._id}`
  );

  setup();
  const requeuedByHand = addPost();
  await queue.enqueuePost(requeuedByHand);
  // What scripts/socialQueue.js --retry-failed leaves behind. It resets
  // `attempts`, which is exactly what would otherwise hide the fact that this
  // job has already been to the platform once.
  const handJob = jobFor(requeuedByHand._id, 'facebook');
  handJob.attempts = 0;
  handJob.lastError = REQUEUED_BY_HAND;
  alreadyPublished.facebook = () => ({ postId: 'fb_from_a_lost_answer', permalink: null });

  check('a hand-requeued job asks before republishing', (await queue.runOnce()).facebook, 'recovered');
  check('even though its attempt count was reset', jobFor(requeuedByHand._id, 'facebook').publishedId, 'fb_from_a_lost_answer');
  check('and nothing was sent to the platform', publishCalls.filter((call) => call.platform === 'facebook').length, 0);

  // -------------------------------------------------------------------------
  console.log('\n--- a transient failure keeps the derivative it was going to publish ---');
  // Distinct from a refused image on purpose: Meta answering "please try
  // again" says nothing is wrong with the file, and throwing it away costs a
  // download, a composite and a second Cloudinary upload to rebuild an
  // identical one.

  setup();
  const slowFetch = addPost();
  await queue.enqueuePost(slowFetch);
  publishBehaviour.instagram = async () => {
    throw graphFailure(9004, 'Timeout downloading media, please try again.', { error_subcode: 2207003 });
  };

  check('a download timeout is retried', (await queue.runOnce()).instagram, 'retry');
  check('and the cached image is left alone', invalidateSocialImageCalls, []);

  // -------------------------------------------------------------------------
  console.log('\n--- the hourly ceiling holds a backlog back before any daily cap does ---');
  // The cap Meta documents is 25 per 24 hours, but accounts are reported
  // blocked for suspected spam at around a dozen posts inside one hour. A
  // daily limit alone permits the whole day's allowance inside twenty
  // minutes, which is the shape that earns the block.

  setup({ hourlyLimits: { instagram: 2 } });
  const hourly = [addPost(), addPost(), addPost()];
  for (const post of hourly) await queue.enqueuePost(post);

  await queue.runOnce();
  const firstHourlyPublishAt = clock;
  advance(MIN_PUBLISH_INTERVAL_MS);
  await queue.runOnce();
  check('two publish inside the hour', publishCalls.filter((call) => call.platform === 'instagram').length, 2);

  advance(MIN_PUBLISH_INTERVAL_MS);
  check('the third is held back', (await queue.runOnce()).instagram, 'quota');
  const heldForAnHour = jobFor(hourly[2]._id, 'instagram');
  check('it is still queued, not failed', heldForAnHour.status, 'pending');
  check('with no attempt counted against it', heldForAnHour.attempts, 0);
  check(
    'and is due once the oldest publish leaves the hour',
    new Date(heldForAnHour.nextAttemptAt).getTime(),
    firstHourlyPublishAt + HOURLY_WINDOW_MS + QUOTA_BUFFER_MS
  );
  check('while Facebook, which was given no ceiling here, is unaffected', publishCalls.filter((call) => call.platform === 'facebook').length, 3);

  advance(HOURLY_WINDOW_MS);
  check('it publishes by itself once the window rolls over', (await queue.runOnce()).instagram, 'published');

  // -------------------------------------------------------------------------
  console.log("\n--- the account's own quota is asked for, not just counted ---");
  // The window counts above only know about posts this app published.
  // Anything posted to the account by hand spends a slot nothing here ever
  // saw, and the first sign of it used to be a refused listing.

  setup();
  const beyondAccountQuota = addPost();
  await queue.enqueuePost(beyondAccountQuota);
  quotaBehaviour.instagram = { used: 25, total: 25, windowSeconds: 86400 };

  check('a full account quota defers instead of publishing into a refusal', (await queue.runOnce()).instagram, 'quota');
  check('nothing was sent to the platform', publishCalls.filter((call) => call.platform === 'instagram').length, 0);
  check('the listing is kept', jobFor(beyondAccountQuota._id, 'instagram').status, 'pending');
  check('and no attempt was charged for it', jobFor(beyondAccountQuota._id, 'instagram').attempts, 0);

  quotaBehaviour.instagram = { used: 24, total: 25, windowSeconds: 86400 };
  advance(PUBLISH_LIMIT_COOLDOWN_MS);
  check('and it goes up once a slot is free again', (await queue.runOnce()).instagram, 'published');

  setup();
  const unknowableQuota = addPost();
  await queue.enqueuePost(unknowableQuota);
  quotaBehaviour.instagram = null;
  check('a platform that cannot answer the question is not held up by it', (await queue.runOnce()).instagram, 'published');

  // -------------------------------------------------------------------------
  console.log('\n--- Meta says how much budget is left on the way past, and that is acted on ---');

  setup();
  const nearTheCeiling = [addPost(), addPost()];
  for (const post of nearTheCeiling) await queue.enqueuePost(post);
  publishBehaviour.facebook = async (post) => ({
    postId: `fb_${post._id}`,
    permalink: null,
    usage: { percent: USAGE_PAUSE_PERCENT, regainAccessMinutes: 0 },
  });

  check('the publish itself still succeeds', (await queue.runOnce()).facebook, 'published');
  advance(MIN_PUBLISH_INTERVAL_MS);
  check('but the platform stands down before being throttled', (await queue.runOnce()).facebook, 'paused');
  check(
    'and the queued listing waits it out rather than failing',
    new Date(jobFor(nearTheCeiling[1]._id, 'facebook').nextAttemptAt).getTime(),
    clock - MIN_PUBLISH_INTERVAL_MS + RATE_LIMIT_COOLDOWN_MS
  );

  setup();
  const wellUnder = addPost();
  await queue.enqueuePost(wellUnder);
  publishBehaviour.facebook = async (post) => ({
    postId: `fb_${post._id}`,
    permalink: null,
    usage: { percent: USAGE_PAUSE_PERCENT - 1, regainAccessMinutes: 0 },
  });
  await queue.runOnce();
  advance(MIN_PUBLISH_INTERVAL_MS);
  check('a platform with budget to spare is not paused', (await queue.runOnce()).facebook, 'idle');

  // -------------------------------------------------------------------------
  console.log("\n--- a throttle states its own wait, and that beats the configured one ---");

  setup();
  const throttledWithWait = addPost();
  await queue.enqueuePost(throttledWithWait);
  publishBehaviour.facebook = async () => {
    throw graphFailure(4, 'Application request limit reached', {
      headers: usageHeaders({ percent: 100, regainMinutes: 90 }),
    });
  };

  check('it is still a rate limit', (await queue.runOnce()).facebook, 'rate-limited');
  check(
    'but the wait is the one Meta stated, not the default cooldown',
    new Date(jobFor(throttledWithWait._id, 'facebook').nextAttemptAt).getTime(),
    clock + 90 * 60 * 1000
  );

  // -------------------------------------------------------------------------
  console.log('\n--- a spam block stands the platform down for hours, and keeps the listing ---');
  // Neither a rate limit nor a bad file: nothing about the listing is wrong,
  // and coming back at the same cadence is what turns a temporary block into
  // a longer one.

  setup();
  const flagged = [addPost(), addPost()];
  for (const post of flagged) await queue.enqueuePost(post);
  publishBehaviour.instagram = async () => {
    throw graphFailure(9004, 'The publishing action is suspected to be spam.', { error_subcode: 2207051 });
  };

  check('it is classified as a spam block, not a content error', (await queue.runOnce()).instagram, 'spam-blocked');
  const blocked = jobFor(flagged[0]._id, 'instagram');
  check('the listing is kept', blocked.status, 'pending');
  check('with no attempt charged against it', blocked.attempts, 0);
  check(
    'and waits out the long cooldown',
    new Date(blocked.nextAttemptAt).getTime(),
    clock + SPAM_BLOCK_COOLDOWN_MS
  );
  check('the cached image is not thrown away over it', invalidateSocialImageCalls, []);
  check(
    'every other queued listing waits with it',
    new Date(jobFor(flagged[1]._id, 'instagram').nextAttemptAt).getTime(),
    clock + SPAM_BLOCK_COOLDOWN_MS
  );

  // -------------------------------------------------------------------------
  console.log('\n--- publishes are not spaced on a perfect metronome ---');

  setup();
  const metronome = [addPost(), addPost()];
  for (const post of metronome) await queue.enqueuePost(post);
  randomValue = 0.5;

  await queue.runOnce();
  advance(MIN_PUBLISH_INTERVAL_MS);
  check('the bare interval is no longer enough on its own', (await queue.runOnce()).facebook, 'paced');

  advance(PUBLISH_JITTER_MS / 2);
  check('the jitter drawn after the last publish is', queue.paceJitter.get('facebook'), PUBLISH_JITTER_MS / 2);
  check('and the next one goes out once it has elapsed', (await queue.runOnce()).facebook, 'published');
};

run()
  .then(() => {
    console.log(`\n${checks - failures}/${checks} checks passed`);
    if (failures > 0) {
      console.error(`${failures} check(s) failed`);
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('Test run crashed:', error);
    process.exit(1);
  });
