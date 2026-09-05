/**
 * Inspect and operate the Facebook/Instagram publishing queue.
 *
 *   node scripts/socialQueue.js --status
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
const { PLATFORMS, PUBLISHERS, TICK_MS } = require('../services/socialPublishQueue');

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

    const published = await SocialPostJob.countDocuments({
      platform,
      publishedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });
    const limit = PUBLISHERS[platform].dailyLimit;
    console.log(`  ${''.padEnd(10)} published in the last 24h: ${published}${limit ? ` / ${limit}` : ''}`);
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
    .select('_id')
    .lean();

  if (failed.length === 0) {
    console.log('No failed jobs to retry.');
    return;
  }

  // Attempts reset too: this is a deliberate decision that whatever refused
  // them has been dealt with, so the next failure should get the full backoff
  // ladder again rather than giving up immediately.
  const result = await SocialPostJob.updateMany(
    { _id: { $in: failed.map((job) => job._id) } },
    { $set: { status: 'pending', attempts: 0, nextAttemptAt: new Date(), lockedAt: null, lastError: 'Re-queued by hand' } }
  );

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
  const wantsDrain = readFlag('drain');
  const wantsRetry = readFlag('retry-failed');
  const wantsRepair = readFlag('repair');

  if (!wantsStatus && !wantsDrain && !wantsRetry && !wantsRepair) {
    console.log('Usage: node scripts/socialQueue.js --status | --drain [--max=N] | --retry-failed [--limit=N] | --repair [--limit=N]');
    return;
  }

  await mongoose.connect(process.env.MONGODB_URI);

  if (wantsStatus) await showStatus();
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
