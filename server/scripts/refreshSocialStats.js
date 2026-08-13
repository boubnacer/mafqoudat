/**
 * Refreshes the stored Facebook/Instagram numbers for mirrored listings.
 *
 *   node scripts/refreshSocialStats.js [--limit=200] [--all]
 *
 * The site refreshes stats opportunistically as pages are viewed, which covers
 * everything anybody is actually looking at. This script exists for the rest:
 * a listing nobody has opened in a week still has its Page copy collecting
 * reactions, and the owner should see that when they eventually come back.
 * Point a scheduler at it (hourly is plenty) or run it by hand.
 *
 * --all ignores the freshness TTL and refetches everything mirrored.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Post = require('../models/Post');
const socialStatsService = require('../services/socialStatsService');
const { SocialStatsService } = require('../services/socialStatsService');

const readFlag = (name) => process.argv.includes(`--${name}`);
const readOption = (name, fallback) => {
  const match = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  const value = match ? Number.parseInt(match.split('=')[1], 10) : NaN;
  return Number.isFinite(value) ? value : fallback;
};

const run = async () => {
  if (!socialStatsService.isConfigured()) {
    console.error('FACEBOOK_PAGE_ACCESS_TOKEN is not set - nothing to refresh.');
    process.exit(1);
  }

  const limit = readOption('limit', 200);
  const refreshAll = readFlag('all');

  await mongoose.connect(process.env.MONGODB_URI);

  const query = {
    $or: [
      { 'social.facebook.postId': { $ne: null } },
      { 'social.instagram.mediaId': { $ne: null } },
    ],
  };

  const posts = await Post.find(query)
    .select('social socialStats')
    // Oldest stats first, so a run that hits the limit still makes progress on
    // the ones that have been waiting longest.
    .sort({ 'socialStats.fetchedAt': 1 })
    .limit(limit)
    .lean();

  const due = refreshAll ? posts : posts.filter((post) => SocialStatsService.isStale(post));

  console.log(`${posts.length} mirrored post(s) examined, ${due.length} due for a refresh.`);

  const updated = refreshAll
    ? await socialStatsService.refreshPosts(due)
    : await socialStatsService.refreshStale(due);

  console.log(`Updated stored stats on ${updated} post(s).`);

  await mongoose.connection.close();
};

run().catch(async (error) => {
  console.error('Social stats refresh failed:', error.message);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
