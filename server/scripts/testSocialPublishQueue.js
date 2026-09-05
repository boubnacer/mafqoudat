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
  QUOTA_BUFFER_MS,
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
  const error = new Error(message);
  error.response = { status: extra.status || 400, data: { error: { code, message, type: 'OAuthException', ...extra } } };
  return error;
};

let clock;
let jobs;
let posts;
let publishCalls;
let publishBehaviour;
let queue;

const advance = (ms) => { clock += ms; };

const setup = ({ instagramConfigured = true } = {}) => {
  clock = Date.parse('2026-01-01T00:00:00.000Z');
  const now = () => clock;

  jobs = new FakeCollection({ defaults: jobDefaults, clock: now });
  posts = new FakeCollection({ clock: now });
  publishCalls = [];
  publishBehaviour = {
    facebook: async (post) => ({ postId: `fb_${post._id}`, permalink: `https://facebook.com/${post._id}` }),
    instagram: async (post) => ({ mediaId: `ig_${post._id}`, permalink: `https://instagram.com/${post._id}` }),
  };

  const publisher = (platform, idKey, configured) => ({
    service: {
      isConfigured: () => configured,
      postNewListing: async (post) => {
        publishCalls.push({ platform, post: post._id });
        return publishBehaviour[platform](post);
      },
    },
    idKey,
    postIdPath: `social.${platform}.${idKey}`,
    postPermalinkPath: `social.${platform}.permalink`,
    postPostedAtPath: `social.${platform}.postedAt`,
    dailyLimit: platform === 'instagram' ? INSTAGRAM_DAILY_LIMIT : null,
  });

  queue = new SocialPublishQueue({
    jobs,
    posts,
    now,
    publishers: {
      facebook: publisher('facebook', 'postId', true),
      instagram: publisher('instagram', 'mediaId', instagramConfigured),
    },
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
  console.log('\n--- a missing permission stops, a transient error retries ---');

  setup();
  const denied = addPost();
  await queue.enqueuePost(denied);
  publishBehaviour.facebook = async () => { throw graphFailure(200, 'Permissions error'); };

  check('a permission error gives up immediately', (await queue.runOnce()).facebook, 'failed');
  check('rather than spending the rate-limit budget on retries', jobFor(denied._id, 'facebook').status, 'failed');

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
