/**
 * Inspect and operate the Facebook/Instagram publishing queue.
 *
 *   node scripts/socialQueue.js --status
 *   node scripts/socialQueue.js --doctor
 *   node scripts/socialQueue.js --drain [--max=50]
 *   node scripts/socialQueue.js --retry-failed [--limit=100]
 *   node scripts/socialQueue.js --repair [--limit=500]
 *
 * The queue is drained by the running server (services/socialPublishQueue.js
 * starts a worker at boot), so none of this is needed in normal operation.
 * It exists for the three moments when someone has to look:
 *
 *   --status        what is queued, waiting, or gave up, and why. This is the
 *                   answer to "did my listing reach the Page?", which before
 *                   the queue existed could only be answered by grepping logs.
 *   --doctor        everything the queue needs in order to work, checked
 *                   against the live platforms without publishing anything:
 *                   is the token valid, when does it expire, does it carry
 *                   the scopes each publish needs, are the Page and the
 *                   Instagram account reachable, how much publishing quota
 *                   is left, and can Meta fetch the images it will be
 *                   pointed at. Every one of those fails silently at
 *                   3am otherwise - run it before launch, and whenever a
 *                   listing has not reached a platform.
 *   --drain         run the worker here instead of in the server - for a
 *                   scheduler-only deployment, or to push a backlog through
 *                   after fixing whatever was refusing it.
 *   --retry-failed  put failed jobs back in the queue, e.g. after correcting a
 *                   token's permissions.
 *   --repair        reattach ids to listings whose publish succeeded but whose
 *                   post update did not (see socialPublishQueue.processJob).
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Post = require('../models/Post');
const SocialPostJob = require('../models/SocialPostJob');
const socialPublishQueue = require('../services/socialPublishQueue');
const {
  PLATFORMS, PUBLISHERS, TICK_MS, HOURLY_WINDOW_MS, REQUEUED_BY_HAND,
} = require('../services/socialPublishQueue');
const { invalidateSocialImage } = require('../services/socialImageService');
const { GRAPH_BASE_URL, describeGraphError } = require('../services/graphApi');
const { CATEGORY_SOCIAL_IMAGE_CODES, categorySocialImagePath } = require('../config/categorySocialImages');
const axios = require('axios');

const readFlag = (name) => process.argv.includes(`--${name}`);
const readOption = (name, fallback) => {
  const match = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  const value = match ? Number.parseInt(match.split('=')[1], 10) : NaN;
  return Number.isFinite(value) ? value : fallback;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const formatTime = (date) => (date ? new Date(date).toISOString().replace('T', ' ').slice(0, 19) : '-');

const showStatus = async () => {
  const counts = await SocialPostJob.aggregate([
    { $group: { _id: { platform: '$platform', status: '$status' }, count: { $sum: 1 } } },
  ]);

  console.log('\nQueued social publishes');
  for (const platform of PLATFORMS) {
    const rows = counts.filter((row) => row._id.platform === platform);
    const summary = rows.length
      ? rows.map((row) => `${row._id.status} ${row.count}`).join(', ')
      : 'nothing queued';
    const configured = PUBLISHERS[platform].service.isConfigured() ? '' : '  (not configured)';
    console.log(`  ${platform.padEnd(10)} ${summary}${configured}`);

    const next = await SocialPostJob.findOne({ platform, status: 'pending' })
      .sort({ nextAttemptAt: 1, createdAt: 1 })
      .select('nextAttemptAt lastError')
      .lean();
    if (next) {
      const due = new Date(next.nextAttemptAt).getTime() <= Date.now() ? 'now' : formatTime(next.nextAttemptAt);
      console.log(`  ${''.padEnd(10)} next due ${due}${next.lastError ? ` (${next.lastError})` : ''}`);
    }

    const publishedToday = await SocialPostJob.countDocuments({
      platform,
      publishedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });
    const publishedThisHour = await SocialPostJob.countDocuments({
      platform,
      publishedAt: { $gte: new Date(Date.now() - HOURLY_WINDOW_MS) },
    });
    const { dailyLimit, hourlyLimit } = PUBLISHERS[platform];
    console.log(
      `  ${''.padEnd(10)} published: ${publishedThisHour}${hourlyLimit ? `/${hourlyLimit}` : ''} this hour, `
      + `${publishedToday}${dailyLimit ? `/${dailyLimit}` : ''} in the last 24h`
    );

    // A platform standing down shows up on the jobs themselves (that is the
    // durable copy), so this reads what the running worker would read rather
    // than this process's own empty in-memory map.
    const paused = await SocialPostJob.findOne({
      platform,
      status: 'pending',
      nextAttemptAt: { $gt: new Date() },
    })
      .sort({ nextAttemptAt: -1 })
      .select('nextAttemptAt lastError')
      .lean();
    if (paused) {
      console.log(`  ${''.padEnd(10)} holding until ${formatTime(paused.nextAttemptAt)}: ${paused.lastError || 'no reason recorded'}`);
    }
  }

  const failed = await SocialPostJob.find({ status: 'failed' })
    .sort({ updatedAt: -1 })
    .limit(10)
    .select('post platform attempts lastError updatedAt')
    .lean();

  if (failed.length > 0) {
    console.log('\nMost recent failures (retry with --retry-failed)');
    for (const job of failed) {
      console.log(`  ${formatTime(job.updatedAt)}  ${job.platform.padEnd(10)} post ${job.post}  after ${job.attempts} attempt(s)`);
      console.log(`      ${job.lastError || 'no reason recorded'}`);
    }
  }
  console.log('');
};

// Everything a publish needs from the outside world, in the order a publish
// needs it. Each line is one thing that can be wrong on its own, and every one
// of them is silent until a listing does not turn up on the Page.
//
// The scopes are the ones the two publish paths and the stats reader actually
// call for. A Page token that has lost one of the first four cannot publish at
// all; the rest degrade a feature rather than breaking it, so they are
// reported as advisory.
const REQUIRED_SCOPES = [
  'pages_manage_posts',
  'pages_read_engagement',
  'instagram_basic',
  'instagram_content_publish',
];
const OPTIONAL_SCOPES = [
  'read_insights',
  'instagram_manage_insights',
  'pages_read_user_content',
];

const PASS = '  ok  ';
const WARN = ' warn ';
const FAIL = ' FAIL ';

let doctorProblems = 0;

const report = (level, line) => {
  if (level === FAIL) doctorProblems += 1;
  console.log(`${level} ${line}`);
};

const graphGet = async (path, params) => {
  const response = await axios.get(`${GRAPH_BASE_URL}${path}`, {
    params: { ...params, access_token: process.env.FACEBOOK_PAGE_ACCESS_TOKEN },
    timeout: 15000,
  });
  return response.data;
};

/**
 * What the token is, how long it lasts and what it may do.
 *
 * A Page token derived from a user token expires; a System User token does
 * not, which is what this deployment is meant to be using. Knowing which one
 * is installed - and, if it expires, when - is the single most useful thing
 * to learn before launch rather than from a queue full of paused jobs.
 */
const checkToken = async () => {
  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  if (!appId || !appSecret) {
    report(WARN, 'FACEBOOK_APP_ID / FACEBOOK_APP_SECRET are not set, so the token cannot be inspected');
    return;
  }

  let data;
  try {
    const response = await axios.get(`${GRAPH_BASE_URL}/debug_token`, {
      params: {
        input_token: process.env.FACEBOOK_PAGE_ACCESS_TOKEN,
        access_token: `${appId}|${appSecret}`,
      },
      timeout: 15000,
    });
    data = response.data?.data;
  } catch (error) {
    report(FAIL, `the access token could not be inspected: ${describeGraphError(error)}`);
    return;
  }

  if (!data?.is_valid) {
    report(FAIL, `the access token is not valid${data?.error?.message ? ` - ${data.error.message}` : ''}`);
    return;
  }

  report(PASS, `the access token is valid (type ${data.type || 'unknown'})`);

  // Graph reports a non-expiring token as 0.
  if (data.expires_at) {
    const expiresAt = new Date(data.expires_at * 1000);
    const daysLeft = Math.round((expiresAt - Date.now()) / (24 * 60 * 60 * 1000));
    report(
      daysLeft <= 14 ? FAIL : WARN,
      `the access token expires on ${formatTime(expiresAt)} (${daysLeft} day(s) away). `
      + 'Auto-posting stops dead when it does - use a System User token, which does not expire.'
    );
  } else {
    report(PASS, 'the access token does not expire');
  }

  const scopes = data.scopes || [];
  const missing = REQUIRED_SCOPES.filter((scope) => !scopes.includes(scope));
  if (missing.length > 0) {
    report(FAIL, `the token is missing scope(s) publishing needs: ${missing.join(', ')}`);
  } else {
    report(PASS, 'the token carries every scope publishing needs');
  }

  const missingOptional = OPTIONAL_SCOPES.filter((scope) => !scopes.includes(scope));
  if (missingOptional.length > 0) {
    report(WARN, `without ${missingOptional.join(', ')}, engagement stats and social comments stay empty`);
  }
};

/** That Meta can actually fetch what it will be pointed at. */
const checkImageIsFetchable = async (label, url) => {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 15000,
      maxContentLength: 8 * 1024 * 1024,
    });
    const type = String(response.headers?.['content-type'] || '');
    if (!type.startsWith('image/jpeg')) {
      report(FAIL, `${label} is served as "${type || 'an unknown type'}" - Instagram accepts JPEG only`);
      return;
    }
    report(PASS, `${label} is reachable (${Math.round(response.data.length / 1024)} KB JPEG)`);
  } catch (error) {
    report(FAIL, `${label} could not be fetched at ${url}: ${error.message}`);
  }
};

const doctor = async () => {
  doctorProblems = 0;
  console.log('\nChecking what auto-posting needs\n');

  if (process.env.SOCIAL_QUEUE_ENABLED === 'false') {
    report(WARN, 'SOCIAL_QUEUE_ENABLED is "false" - nothing will be published until that is changed');
  }

  const facebookConfigured = PUBLISHERS.facebook.service.isConfigured();
  const instagramConfigured = PUBLISHERS.instagram.service.isConfigured();

  report(
    facebookConfigured ? PASS : FAIL,
    facebookConfigured
      ? `Facebook is configured (Page ${process.env.FACEBOOK_PAGE_ID})`
      : 'FACEBOOK_PAGE_ID / FACEBOOK_PAGE_ACCESS_TOKEN are not both set'
  );
  report(
    instagramConfigured ? PASS : FAIL,
    instagramConfigured
      ? `Instagram is configured (account ${process.env.INSTAGRAM_ACCOUNT_ID})`
      : 'INSTAGRAM_ACCOUNT_ID / FACEBOOK_PAGE_ACCESS_TOKEN are not both set'
  );

  if (!facebookConfigured && !instagramConfigured) {
    console.log('\nNothing else can be checked without credentials.\n');
    return;
  }

  await checkToken();

  if (facebookConfigured) {
    try {
      const page = await graphGet(`/${process.env.FACEBOOK_PAGE_ID}`, { fields: 'id,name' });
      report(PASS, `the Page answers as "${page.name}"`);
    } catch (error) {
      report(FAIL, `the Page could not be read: ${describeGraphError(error)}`);
    }
  }

  if (instagramConfigured) {
    try {
      const account = await graphGet(`/${process.env.INSTAGRAM_ACCOUNT_ID}`, { fields: 'id,username' });
      report(PASS, `the Instagram account answers as @${account.username}`);
    } catch (error) {
      report(FAIL, `the Instagram account could not be read: ${describeGraphError(error)}`);
    }

    const quota = await PUBLISHERS.instagram.service.publishingQuota();
    if (quota?.total) {
      const left = quota.total - quota.used;
      report(
        left > 0 ? PASS : WARN,
        `Instagram has used ${quota.used} of ${quota.total} publishing slots `
        + `in its rolling ${Math.round((quota.windowSeconds || 86400) / 3600)}h window`
      );
    } else {
      report(WARN, 'the Instagram publishing quota could not be read - the queue will pace on its own count alone');
    }
  }

  // Meta fetches these itself and fails the whole publish on a 404, and the
  // server cannot see client/public to check they exist. One category graphic
  // and the placeholder are enough to prove the path, the host and the
  // content type; the full code-to-file check is offline, in
  // `npm run test-social-images`.
  const siteUrl = process.env.CLIENT_URL || 'https://mafqoudat.com';
  const sampleCode = [...CATEGORY_SOCIAL_IMAGE_CODES][0];
  await checkImageIsFetchable(
    `the ${sampleCode} category graphic`,
    `${siteUrl}/${categorySocialImagePath(sampleCode)}`
  );
  await checkImageIsFetchable(
    'the no-photo placeholder',
    `${siteUrl}/${categorySocialImagePath('NOT_A_REAL_CATEGORY')}`
  );

  const stuck = await SocialPostJob.countDocuments({ status: 'failed' });
  if (stuck > 0) {
    report(WARN, `${stuck} job(s) gave up and are waiting for "--retry-failed"`);
  }

  console.log(
    doctorProblems === 0
      ? '\nNothing is blocking auto-posting.\n'
      : `\n${doctorProblems} blocking problem(s) - auto-posting will not work until they are fixed.\n`
  );
};

const drain = async (maxPublishes) => {
  if (!socialPublishQueue.isEnabled()) {
    console.error('No Facebook Page or Instagram account is configured - nothing to drain.');
    return;
  }

  let published = 0;
  // Pacing is the queue's own, not this script's: runOnce answers "paced" when
  // it is too soon to publish again, and this waits exactly as the in-process
  // worker would.
  for (;;) {
    const outcomes = await socialPublishQueue.runOnce();
    const values = Object.values(outcomes);
    published += values.filter((outcome) => outcome === 'published').length;

    console.log(
      `${new Date().toISOString().slice(11, 19)}  `
      + Object.entries(outcomes).map(([platform, outcome]) => `${platform}: ${outcome}`).join('   ')
    );

    if (published >= maxPublishes) {
      console.log(`Stopping: ${published} post(s) published (--max=${maxPublishes}).`);
      return;
    }
    // Nothing left that waiting would help with.
    if (values.every((outcome) => ['idle', 'unconfigured', 'paused', 'quota'].includes(outcome))) {
      console.log('Nothing further is due right now.');
      return;
    }
    await sleep(TICK_MS);
  }
};

const retryFailed = async (limit) => {
  const failed = await SocialPostJob.find({ status: 'failed' })
    .sort({ updatedAt: 1 })
    .limit(limit)
    .select('_id post')
    .lean();

  if (failed.length === 0) {
    console.log('No failed jobs to retry.');
    return;
  }

  // Every failed job's cached derivative is cleared before requeueing, not
  // only the ones this build's own classifier would recognise. A job that
  // failed under an older deploy - including the exact incident this flag
  // exists to fix - would otherwise still have the rejected image cached on
  // its post, and ensureSocialImage only ever reuses a cache entry, it never
  // re-validates one: without this, --retry-failed would requeue the job and
  // it would fail again on the identical file. Deduplicated, since Facebook's
  // and Instagram's jobs for the same listing share one derivative.
  const postIds = [...new Set(failed.map((job) => String(job.post)))];
  await Promise.all(postIds.map((postId) => invalidateSocialImage(postId)));

  // Attempts reset too: this is a deliberate decision that whatever refused
  // them has been dealt with, so the next failure should get the full backoff
  // ladder again rather than giving up immediately. REQUEUED_BY_HAND is what
  // carries the other half of that - the queue asks the platform whether a
  // listing is already up before republishing anything that has been to it
  // before, and with `attempts` back at zero this marker is the only thing
  // left saying so.
  const result = await SocialPostJob.updateMany(
    { _id: { $in: failed.map((job) => job._id) } },
    { $set: { status: 'pending', attempts: 0, nextAttemptAt: new Date(), lockedAt: null, lastError: REQUEUED_BY_HAND } }
  );

  console.log(`Cleared the cached social image for ${postIds.length} listing(s).`);
  console.log(`Re-queued ${result.modifiedCount} failed job(s).`);
};

const repair = async (limit) => {
  let repaired = 0;

  for (const platform of PLATFORMS) {
    const publisher = PUBLISHERS[platform];
    const done = await SocialPostJob.find({ platform, status: 'done', publishedId: { $ne: null } })
      .sort({ publishedAt: -1 })
      .limit(limit)
      .select('post publishedId permalink publishedAt')
      .lean();

    if (done.length === 0) continue;

    const posts = await Post.find({ _id: { $in: done.map((job) => job.post) } })
      .select(publisher.postIdPath)
      .lean();

    const withId = new Set(
      posts
        .filter((post) => publisher.postIdPath.split('.').reduce((value, key) => (value == null ? value : value[key]), post))
        .map((post) => String(post._id))
    );
    const known = new Set(posts.map((post) => String(post._id)));

    const operations = done
      .filter((job) => known.has(String(job.post)) && !withId.has(String(job.post)))
      .map((job) => ({
        updateOne: {
          filter: { _id: job.post },
          update: {
            $set: {
              [publisher.postIdPath]: job.publishedId,
              [publisher.postPermalinkPath]: job.permalink || null,
              [publisher.postPostedAtPath]: job.publishedAt,
            },
          },
        },
      }));

    if (operations.length === 0) continue;
    await Post.bulkWrite(operations, { ordered: false });
    repaired += operations.length;
    console.log(`Reattached ${operations.length} ${platform} id(s) to their listings.`);
  }

  console.log(repaired === 0 ? 'Nothing to repair.' : `Repaired ${repaired} listing(s).`);
};

const run = async () => {
  const wantsStatus = readFlag('status');
  const wantsDoctor = readFlag('doctor');
  const wantsDrain = readFlag('drain');
  const wantsRetry = readFlag('retry-failed');
  const wantsRepair = readFlag('repair');

  if (!wantsStatus && !wantsDoctor && !wantsDrain && !wantsRetry && !wantsRepair) {
    console.log('Usage: node scripts/socialQueue.js --status | --doctor | --drain [--max=N] | --retry-failed [--limit=N] | --repair [--limit=N]');
    return;
  }

  await mongoose.connect(process.env.MONGODB_URI);

  if (wantsStatus) await showStatus();
  if (wantsDoctor) await doctor();
  if (wantsRetry) await retryFailed(readOption('limit', 100));
  if (wantsRepair) await repair(readOption('limit', 500));
  if (wantsDrain) await drain(readOption('max', 50));

  await mongoose.connection.close();
};

run().catch(async (error) => {
  console.error('Social queue command failed:', error.message);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
