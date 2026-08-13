/**
 * Offline check of the social stats reader.
 *
 *   node scripts/testSocialStats.js
 *
 * Needs no database and no network: axios is stubbed with a small fake Graph
 * API, and Post.bulkWrite is captured instead of executed. What it covers is
 * the part that fails silently - a listing quietly showing the wrong numbers,
 * or showing none at all because one deleted Page post took a whole batch down
 * with it, or one renamed/permission-less metric quietly taking an unrelated
 * one down with it.
 *
 * Exits non-zero if any assertion failed.
 */

const axios = require('axios');
const Post = require('../models/Post');
const { SocialStatsService, YOUNG_TTL_MS, YOUNG_POST_HOURS } = require('../services/socialStatsService');

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

process.env.FACEBOOK_PAGE_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN || 'test-token';

// ---------------------------------------------------------------------------
// A fake Graph API. `world` describes what the Pages currently hold; requests
// are answered from it, and failures are shaped exactly like Meta's error
// envelope - every decision the service makes (retry one id at a time, probe
// the next metric name, give up on a post for good) is made by reading codes
// out of that envelope.
//
// Facebook and Instagram each expose more than one insight *concept* (views,
// and now engaged users/clicks for FB, saved for IG). Each concept has its
// own set of candidate metric names, resolved independently - the fake needs
// to know which metric name maps to which concept so a probe or a batched
// read can answer with the right number.
// ---------------------------------------------------------------------------

const FB_METRIC_CONCEPTS = {
  post_impressions_unique: 'views',
  post_impressions: 'views',
  post_views: 'views',
  post_views_unique: 'views',
  post_engaged_users: 'engagedUsers',
  post_clicks: 'clicks',
};
const IG_METRIC_CONCEPTS = {
  views: 'views',
  reach: 'views',
  impressions: 'views',
  saved: 'saved',
};

const world = {
  facebook: {},
  instagram: {},
  // Metric names this fake account currently serves. Empty = insights
  // unavailable entirely, which is what a token without read_insights looks
  // like from the outside. Defaults cover the service's own first-choice
  // candidate for every concept, so a fresh scenario resolves on the first try.
  facebookMetrics: ['post_impressions_unique', 'post_engaged_users', 'post_clicks'],
  instagramMetrics: ['views', 'saved'],
};

const requests = [];
const writes = [];

const graphFailure = (code, subcode, message) => {
  const error = new Error(message);
  error.response = { data: { error: { code, error_subcode: subcode, message, type: 'GraphMethodException' } } };
  return error;
};

const missingObject = () => graphFailure(100, 33, 'Unsupported get request. Object does not exist');
const invalidMetric = (metric) => graphFailure(100, undefined, `(#100) metric[0] must be one of the following values (got ${metric})`);

const isFacebookId = (id) => !!world.facebook[id];
const objectFor = (id) => world.facebook[id] || world.instagram[id] || null;
const metricsFor = (id) => (isFacebookId(id) ? world.facebookMetrics : world.instagramMetrics);
const conceptsFor = (id) => (isFacebookId(id) ? FB_METRIC_CONCEPTS : IG_METRIC_CONCEPTS);

axios.get = async (url, config = {}) => {
  const params = config.params || {};
  requests.push({ url, params });

  // .../{id}/insights - the metric probe, one metric name at a time.
  const insightsMatch = url.match(/\/([^/]+)\/insights$/);
  if (insightsMatch) {
    const id = insightsMatch[1];
    const object = objectFor(id);
    if (!object) throw missingObject();
    if (!metricsFor(id).includes(params.metric)) throw invalidMetric(params.metric);
    const concept = conceptsFor(id)[params.metric];
    return { data: { data: [{ name: params.metric, values: [{ value: object[concept] }] }] } };
  }

  // Batched ?ids= read. `fields` carries the resolved metric names to request
  // together, e.g. insights.metric(post_impressions_unique,post_clicks).
  const ids = String(params.ids || '').split(',').filter(Boolean);
  const insightsFieldMatch = (params.fields || '').match(/insights\.metric\(([^)]*)\)/);
  const requestedMetrics = insightsFieldMatch ? insightsFieldMatch[1].split(',').filter(Boolean) : [];

  const values = {};
  for (const id of ids) {
    const object = objectFor(id);
    // Graph fails the whole batch when a single id is unreadable.
    if (!object) throw missingObject();

    const entry = { id };
    if (isFacebookId(id)) {
      entry.reactions = { summary: { total_count: object.reactions } };
      entry.comments = { summary: { total_count: object.comments } };
      if (object.shares !== undefined) entry.shares = { count: object.shares };
    } else {
      entry.like_count = object.likes;
      entry.comments_count = object.comments;
    }
    if (requestedMetrics.length > 0) {
      const concepts = conceptsFor(id);
      entry.insights = {
        data: requestedMetrics.map((name) => ({ name, values: [{ value: object[concepts[name]] }] })),
      };
    }
    values[id] = entry;
  }

  return { data: values };
};

Post.bulkWrite = async (operations) => {
  writes.push(...operations);
  return { modifiedCount: operations.length };
};

const reset = () => {
  requests.length = 0;
  writes.length = 0;
  world.facebook = {};
  world.instagram = {};
  world.facebookMetrics = ['post_impressions_unique', 'post_engaged_users', 'post_clicks'];
  world.instagramMetrics = ['views', 'saved'];
};

// A fresh service per scenario: the resolved-metric memo is process-lifetime
// state by design, and most scenarios need to start from an unprobed one.
const newService = () => new SocialStatsService();

const post = (id, { fb = null, ig = null, fetchedAt = null, fbGone = false, igGone = false, createdAt = null } = {}) => ({
  _id: id,
  createdAt,
  social: {
    facebook: { postId: fb },
    instagram: { mediaId: ig },
  },
  socialStats: {
    fetchedAt,
    facebook: { unavailable: fbGone },
    instagram: { unavailable: igGone },
  },
});

const updateFor = (postId) => writes.find((op) => op.updateOne.filter._id === postId)?.updateOne.update.$set;

const HOUR = 60 * 60 * 1000;

const run = async () => {
  console.log('\n--- staleness ---');

  checkThat('never-fetched stats are stale', SocialStatsService.isStale(post('a', { fb: 'f1' })));
  checkThat('stats fetched a minute ago are fresh',
    !SocialStatsService.isStale(post('a', { fb: 'f1', fetchedAt: new Date(Date.now() - 60 * 1000) })));
  checkThat('stats fetched a day ago are stale',
    SocialStatsService.isStale(post('a', { fb: 'f1', fetchedAt: new Date(Date.now() - 24 * HOUR) })));
  checkThat('a post that was never mirrored has no targets',
    !SocialStatsService.hasSocialTargets(post('a')));
  checkThat('an Instagram-only post still has a target',
    SocialStatsService.hasSocialTargets(post('a', { ig: 'i1' })));

  // -------------------------------------------------------------------------
  console.log('\n--- young posts get a much shorter freshness window ---');

  const MINUTE = 60 * 1000;
  const postJustCreated = new Date(Date.now() - MINUTE);
  const postCreatedLongAgo = new Date(Date.now() - (YOUNG_POST_HOURS * 60 + 10) * MINUTE);
  // Past the short young-post window, but nowhere near the long settled-post
  // one - the exact zone the old flat TTL got wrong.
  const fetchedJustPastYoungWindow = new Date(Date.now() - (YOUNG_TTL_MS + 2 * MINUTE));
  const fetchedWellWithinYoungWindow = new Date(Date.now() - MINUTE);

  checkThat("this is exactly what the reported bug looked like: a post checked once right \
after creation stays 'fresh' under a flat settled-post TTL even though real engagement \
happened on the Page minutes later",
    SocialStatsService.isStale(post('a', { fb: 'f1', createdAt: postJustCreated, fetchedAt: fetchedJustPastYoungWindow })),
    `fetched ${Math.round((Date.now() - fetchedJustPastYoungWindow.getTime()) / MINUTE)}m ago - stale for a post this young, would have read as fresh under a flat 180m TTL`);

  checkThat('a young post fetched moments ago is still fresh under its own short window',
    !SocialStatsService.isStale(post('a', { fb: 'f1', createdAt: postJustCreated, fetchedAt: fetchedWellWithinYoungWindow })));

  checkThat('a settled post is judged by the long TTL, not the short one',
    !SocialStatsService.isStale(post('a', { fb: 'f1', createdAt: postCreatedLongAgo, fetchedAt: fetchedJustPastYoungWindow })),
    `${Math.round((Date.now() - fetchedJustPastYoungWindow.getTime()) / MINUTE)}m old - stale for a young post, fine for a settled one`);

  checkThat('a post with no createdAt selected falls back to the long TTL, not "always young"',
    !SocialStatsService.isStale(post('a', { fb: 'f1', fetchedAt: fetchedJustPastYoungWindow })));

  reset();
  world.facebook.recent = { reactions: 3, comments: 1, shares: 0, views: 10, engagedUsers: 2, clicks: 1 };
  world.facebook.checkedInLastMinute = { reactions: 5, comments: 0, shares: 0, views: 20, engagedUsers: 3, clicks: 1 };
  const refreshed = await newService().refreshStale([
    // Young, last checked before its own short window - due for a recheck,
    // exactly the case that used to sit stuck for up to three hours.
    post('young-and-due', { fb: 'recent', createdAt: postJustCreated, fetchedAt: fetchedJustPastYoungWindow }),
    // Young, but checked moments ago - still within its own short window.
    post('young-not-due-yet', { fb: 'checkedInLastMinute', createdAt: postJustCreated, fetchedAt: fetchedWellWithinYoungWindow }),
  ]);
  check('only the one past its own window is refreshed', refreshed, 1);
  checkThat('and it is the young-but-overdue one', !!updateFor('young-and-due') && !updateFor('young-not-due-yet'));

  // -------------------------------------------------------------------------
  console.log('\n--- reading both platforms, every metric ---');

  reset();
  world.facebook.f1 = { reactions: 12, comments: 3, shares: 2, views: 340, engagedUsers: 18, clicks: 7 };
  world.instagram.i1 = { likes: 20, comments: 4, views: 512, saved: 9 };
  await newService().refreshPosts([post('p1', { fb: 'f1', ig: 'i1' })]);

  check('facebook counts and insights stored', [
    updateFor('p1')['socialStats.facebook.reactions'],
    updateFor('p1')['socialStats.facebook.comments'],
    updateFor('p1')['socialStats.facebook.shares'],
    updateFor('p1')['socialStats.facebook.views'],
    updateFor('p1')['socialStats.facebook.engagedUsers'],
    updateFor('p1')['socialStats.facebook.clicks'],
  ], [12, 3, 2, 340, 18, 7]);
  check('instagram counts and insights stored', [
    updateFor('p1')['socialStats.instagram.likes'],
    updateFor('p1')['socialStats.instagram.comments'],
    updateFor('p1')['socialStats.instagram.views'],
    updateFor('p1')['socialStats.instagram.saved'],
  ], [20, 4, 512, 9]);
  checkThat('fetchedAt is stamped', !!updateFor('p1')['socialStats.fetchedAt']);

  const insightsRequest = requests.find((request) => request.params.ids);
  checkThat('facebook insight metrics are requested together, in one field',
    /insights\.metric\(post_impressions_unique,post_engaged_users,post_clicks\)/.test(insightsRequest.params.fields),
    insightsRequest.params.fields);

  // -------------------------------------------------------------------------
  console.log('\n--- a post nobody shared ---');

  reset();
  // `shares` is simply absent from the payload rather than reported as zero.
  world.facebook.f1 = { reactions: 1, comments: 0, views: 9, engagedUsers: 2, clicks: 0 };
  await newService().refreshPosts([post('p1', { fb: 'f1' })]);
  check('an absent shares field reads as zero, not unknown', updateFor('p1')['socialStats.facebook.shares'], 0);

  // -------------------------------------------------------------------------
  console.log('\n--- batching ---');

  reset();
  for (let i = 1; i <= 4; i += 1) {
    world.facebook[`f${i}`] = { reactions: i, comments: 0, shares: 0, views: i * 10, engagedUsers: i, clicks: i };
  }
  await newService().refreshPosts([1, 2, 3, 4].map((i) => post(`p${i}`, { fb: `f${i}` })));

  check('four posts are read in one batched request', requests.filter((request) => request.params.ids).length, 1);
  check('every post got its own stored numbers',
    [1, 2, 3, 4].map((i) => updateFor(`p${i}`)['socialStats.facebook.reactions']), [1, 2, 3, 4]);
  check('including its own engaged-users number',
    [1, 2, 3, 4].map((i) => updateFor(`p${i}`)['socialStats.facebook.engagedUsers']), [1, 2, 3, 4]);

  // -------------------------------------------------------------------------
  console.log('\n--- one deleted Page post must not cost the whole page ---');

  reset();
  world.facebook.f1 = { reactions: 5, comments: 1, shares: 0, views: 50, engagedUsers: 3, clicks: 1 };
  world.facebook.f3 = { reactions: 7, comments: 2, shares: 1, views: 70, engagedUsers: 4, clicks: 2 };
  // f2 is absent from `world` - it was deleted off the Page.
  await newService().refreshPosts([
    post('p1', { fb: 'f1' }),
    post('p2', { fb: 'f2' }),
    post('p3', { fb: 'f3' }),
  ]);

  check('the surviving posts still get their numbers', [
    updateFor('p1')['socialStats.facebook.reactions'],
    updateFor('p3')['socialStats.facebook.reactions'],
  ], [5, 7]);
  check('the deleted post is marked unavailable', updateFor('p2')['socialStats.facebook.unavailable'], true);
  checkThat('and it is not given invented counts', updateFor('p2')['socialStats.facebook.reactions'] === undefined);

  reset();
  world.facebook.f1 = { reactions: 5, comments: 1, shares: 0, views: 50, engagedUsers: 3, clicks: 1 };
  await newService().refreshPosts([post('p1', { fb: 'f1' }), post('p2', { fb: 'f2', fbGone: true })]);
  checkThat('a post already known to be gone is never asked about again',
    !requests.some((request) => String(request.params.ids || '').includes('f2')),
    requests.map((request) => request.params.ids).filter(Boolean).join(' | '));

  // -------------------------------------------------------------------------
  console.log('\n--- insight metric probing ---');

  reset();
  world.facebook.f1 = { reactions: 2, comments: 0, shares: 0, views: 88, engagedUsers: 5, clicks: 1 };
  // Meta renamed the views metric: only the newer name answers. Engagement
  // and clicks are untouched by the rename.
  world.facebookMetrics = ['post_views', 'post_engaged_users', 'post_clicks'];
  await newService().refreshPosts([post('p1', { fb: 'f1' })]);
  check('the working views metric is found by probing past the retired one',
    updateFor('p1')['socialStats.facebook.views'], 88);
  check('an unrelated metric renaming does not affect engagement/clicks', [
    updateFor('p1')['socialStats.facebook.engagedUsers'],
    updateFor('p1')['socialStats.facebook.clicks'],
  ], [5, 1]);

  reset();
  world.facebook.f1 = { reactions: 4, comments: 1, shares: 0, views: 88, engagedUsers: 5, clicks: 1 };
  // No metric answers at all - this is a token without read_insights.
  world.facebookMetrics = [];
  await newService().refreshPosts([post('p1', { fb: 'f1' })]);
  check('counts still land when insights are unavailable', updateFor('p1')['socialStats.facebook.reactions'], 4);
  checkThat('and none of views/engagedUsers/clicks are invented', [
    updateFor('p1')['socialStats.facebook.views'],
    updateFor('p1')['socialStats.facebook.engagedUsers'],
    updateFor('p1')['socialStats.facebook.clicks'],
  ].every((value) => value === undefined));

  reset();
  // Only engagement is being served - views and clicks stay unresolved. One
  // concept succeeding must not make the service assume the others do too.
  world.facebook.f1 = { reactions: 6, comments: 2, shares: 0, views: 88, engagedUsers: 12, clicks: 3 };
  world.facebookMetrics = ['post_engaged_users'];
  await newService().refreshPosts([post('p1', { fb: 'f1' })]);
  check('the one available concept is still read', updateFor('p1')['socialStats.facebook.engagedUsers'], 12);
  checkThat('the unavailable ones are left alone rather than zeroed', [
    updateFor('p1')['socialStats.facebook.views'],
    updateFor('p1')['socialStats.facebook.clicks'],
  ].every((value) => value === undefined));

  reset();
  world.instagram.i1 = { likes: 10, comments: 1, views: 200, saved: 15 };
  // Instagram serves saved but not views.
  world.instagramMetrics = ['saved'];
  await newService().refreshPosts([post('p1', { ig: 'i1' })]);
  check('saved is read independently of a missing views permission',
    updateFor('p1')['socialStats.instagram.saved'], 15);
  checkThat('views stays unresolved rather than invented',
    updateFor('p1')['socialStats.instagram.views'] === undefined);

  reset();
  world.facebook.f1 = { reactions: 1, comments: 0, shares: 0, views: 5, engagedUsers: 2, clicks: 1 };
  world.facebook.f2 = { reactions: 2, comments: 0, shares: 0, views: 6, engagedUsers: 3, clicks: 2 };
  // First-choice candidate for all three concepts, so each resolves in one probe.
  world.facebookMetrics = ['post_impressions_unique', 'post_engaged_users', 'post_clicks'];
  const probingService = newService();
  const countProbes = () => requests.filter((request) => request.url.endsWith('/insights')).length;
  await probingService.refreshPosts([post('p1', { fb: 'f1' })]);
  const probesForFirstPost = countProbes();
  check('all three facebook concepts are probed once each for the first post', probesForFirstPost, 3);
  await probingService.refreshPosts([post('p2', { fb: 'f2' })]);
  check('none of the three are re-probed for the next post', countProbes(), probesForFirstPost);

  // -------------------------------------------------------------------------
  console.log('\n--- refreshStale ---');

  reset();
  world.facebook.f1 = { reactions: 3, comments: 0, shares: 0, views: 30, engagedUsers: 1, clicks: 0 };
  world.facebook.f2 = { reactions: 9, comments: 0, shares: 0, views: 90, engagedUsers: 2, clicks: 1 };
  const updated = await newService().refreshStale([
    post('fresh', { fb: 'f1', fetchedAt: new Date() }),
    post('stale', { fb: 'f2', fetchedAt: new Date(Date.now() - 24 * HOUR) }),
    post('never-mirrored'),
  ]);
  check('only the stale mirrored post is refreshed', updated, 1);
  checkThat('and it is the right one', !!updateFor('stale') && !updateFor('fresh'));

  // -------------------------------------------------------------------------
  console.log('\n--- a Graph outage ---');

  reset();
  world.facebook.f1 = { reactions: 3, comments: 0, shares: 0, views: 30, engagedUsers: 1, clicks: 0 };
  const workingGet = axios.get;
  axios.get = async () => { throw new Error('socket hang up'); };
  let threw = false;
  try {
    await newService().refreshPosts([post('p1', { fb: 'f1' })]);
  } catch (error) {
    threw = true;
  }
  axios.get = workingGet;
  checkThat('a network failure is swallowed, not thrown at the caller', !threw);
  check('and nothing is written', writes.length, 0);
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
