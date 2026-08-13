/**
 * Offline check of the live post-stats overlay.
 *
 *   node scripts/testPostStatsOverlay.js
 *
 * Needs no database and no network: Post.findById/Post.find are replaced with
 * a tiny thenable query stub, and socialStatsService.scheduleRefresh is
 * captured instead of run.
 *
 * This covers the bug that motivated the middleware: views, social and
 * socialStats used to be projected straight into the same aggregate that
 * postsCache/optimizedPaginatedCache/searchResultsCache (and getUserPosts'
 * own inline cache) hold onto for 10-30 minutes, so a fresh view, a just-
 * stored Facebook/Instagram id, or a newly-fetched engagement count all sat
 * invisible until that cache entry expired - and a cache hit skips the
 * controller entirely, so the refresh that was supposed to keep those numbers
 * current never even fired. The overlay wraps res.json ahead of every cache
 * layer so the three volatile fields are always read fresh, on a hit or a
 * miss alike, and is the sole place that now triggers a refresh.
 *
 * Exits non-zero if any assertion failed.
 */

const mongoose = require('mongoose');
const Post = require('../models/Post');
const socialStatsService = require('../services/socialStatsService');
const attachLivePostStats = require('../middleware/postStatsOverlay');

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
// A thenable query stub - just enough of Mongoose's chainable query surface
// (.select().lean()) for code that only ever awaits the whole expression.
// ---------------------------------------------------------------------------
const queryStub = (result) => {
  const query = {
    select: () => query,
    lean: () => query,
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  };
  return query;
};

const world = new Map(); // id string -> live doc

const findCalls = [];
const findByIdCalls = [];

Post.findById = (id) => {
  findByIdCalls.push(String(id));
  return queryStub(world.get(String(id)) || null);
};

Post.find = (filter) => {
  const ids = (filter?._id?.$in || []).map(String);
  findCalls.push(ids);
  return queryStub(ids.map((id) => world.get(id)).filter(Boolean));
};

const refreshCalls = [];
socialStatsService.scheduleRefresh = (posts) => { refreshCalls.push(posts); };

const reset = () => {
  world.clear();
  findCalls.length = 0;
  findByIdCalls.length = 0;
  refreshCalls.length = 0;
};

const liveDoc = (id, overrides = {}) => ({
  _id: id,
  views: 0,
  social: { facebook: { postId: null }, instagram: { mediaId: null } },
  socialStats: { fetchedAt: null },
  ...overrides,
});

/** Runs the middleware against a fake req/res and returns what res.json ultimately received. */
const runOverlay = async (data) => {
  let delivered;
  const res = { json: (payload) => { delivered = payload; } };
  let nextCalled = false;
  await new Promise((resolve) => {
    attachLivePostStats({}, res, () => { nextCalled = true; resolve(); });
  });
  await res.json(data);
  return { delivered, nextCalled };
};

const run = async () => {
  console.log('\n--- next() runs synchronously, before res.json is ever called ---');

  reset();
  let nextRan = false;
  const res = { json: () => {} };
  attachLivePostStats({}, res, () => { nextRan = true; });
  checkThat('next() is called immediately, not deferred behind a stats fetch', nextRan);

  // -------------------------------------------------------------------------
  console.log('\n--- getPost shape: a single flat post object ---');

  reset();
  const id = new mongoose.Types.ObjectId().toString();
  world.set(id, liveDoc(id, {
    views: 42,
    social: { facebook: { postId: 'fb1' }, instagram: { mediaId: null } },
    socialStats: { facebook: { reactions: 5 }, fetchedAt: new Date() },
  }));

  const { delivered } = await runOverlay({ _id: id, exactLocation: 'Somewhere' });
  check('views merged in', delivered.views, 42);
  check('social merged in', delivered.social.facebook.postId, 'fb1');
  check('socialStats merged in', delivered.socialStats.facebook.reactions, 5);
  check('fields untouched by the overlay survive', delivered.exactLocation, 'Somewhere');
  check('scheduleRefresh is called with the live doc', refreshCalls, [[world.get(id)]]);

  // -------------------------------------------------------------------------
  console.log('\n--- a post missing from the DB (deleted between aggregate and response) ---');

  reset();
  const missingId = new mongoose.Types.ObjectId().toString();
  const original = { _id: missingId, exactLocation: 'Ghost' };
  const { delivered: untouched } = await runOverlay(original);
  check('the response passes through unchanged', untouched, original);
  check('no refresh is scheduled for a post that no longer exists', refreshCalls, []);

  // -------------------------------------------------------------------------
  console.log('\n--- listing shape: { postsWithUser: [...] } ---');

  reset();
  const idA = new mongoose.Types.ObjectId().toString();
  const idB = new mongoose.Types.ObjectId().toString();
  world.set(idA, liveDoc(idA, { views: 10 }));
  world.set(idB, liveDoc(idB, { views: 20 }));

  const listing = { delivered: null };
  listing.delivered = (await runOverlay({
    postsWithUser: [{ _id: idA, exactLocation: 'A' }, { _id: idB, exactLocation: 'B' }],
    page: 1,
    total: 2,
  })).delivered;

  check('every item gets its own live views', listing.delivered.postsWithUser.map((p) => p.views), [10, 20]);
  check('non-post fields on the envelope survive', listing.delivered.total, 2);
  check('one batched Post.find call instead of one per post', findCalls.length, 1);
  check('scheduleRefresh receives both live docs in one call', refreshCalls.length, 1);
  check('and the right ones', refreshCalls[0].map((doc) => String(doc._id)).sort(), [idA, idB].sort());

  // -------------------------------------------------------------------------
  console.log('\n--- a listing with no posts at all ---');

  reset();
  const { delivered: empty } = await runOverlay({ postsWithUser: [], total: 0 });
  check('the empty envelope passes through unchanged', empty, { postsWithUser: [], total: 0 });
  check('no DB calls are made for an empty page', findCalls.length + findByIdCalls.length, 0);

  // -------------------------------------------------------------------------
  console.log('\n--- error responses have neither shape ---');

  reset();
  const errorBody = { message: 'Post not found' };
  const { delivered: passedThrough } = await runOverlay(errorBody);
  check('an error body is untouched', passedThrough, errorBody);
  check('no DB calls are made for it', findCalls.length + findByIdCalls.length, 0);
  check('no refresh is scheduled for it', refreshCalls.length, 0);

  // -------------------------------------------------------------------------
  console.log('\n--- a DB failure must not break the response ---');

  reset();
  const brokenId = new mongoose.Types.ObjectId().toString();
  const workingFindById = Post.findById;
  Post.findById = () => { throw new Error('connection reset'); };
  const original2 = { _id: brokenId, exactLocation: 'Still here' };
  const { delivered: survived } = await runOverlay(original2);
  Post.findById = workingFindById;
  check('the original response is still delivered', survived, original2);
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
