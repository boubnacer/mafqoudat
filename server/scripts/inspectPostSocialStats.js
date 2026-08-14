/**
 * Read-only diagnostic for "why does this post show no social reach at all".
 *
 *   node scripts/inspectPostSocialStats.js <postId>
 *
 * Prints exactly what's stored for one post's social/socialStats fields and
 * says which of the three places the pipeline could be stuck, rather than
 * requiring a manual read of the raw document. Complete absence of the
 * SocialReach section on a post (not stale zeros - nothing at all) means
 * hasStats is false, which means no Graph read has EVER landed for it, which
 * narrows to exactly one of:
 *
 *   1. social.facebook.postId is null - the auto-post to the Page never
 *      completed on our side (even if the post is visibly on the Page - the
 *      publish call and the write-back that stores its id are separate
 *      steps, and only the second one failing still leaves the post visible
 *      on Facebook with nothing here pointing back to it).
 *   2. postId is set but socialStats.fetchedAt is null - a fetch has never
 *      actually been attempted or has never succeeded. Check server logs
 *      around this post's creation/view times for lines starting
 *      "Social stats:".
 *   3. fetchedAt is set but the counts are still null - the fetch ran and
 *      Graph answered, but rejected reading engagement specifically (a
 *      permission issue, not a views/insights-only issue - this would mean
 *      even the always-available reactions/comments/shares edges are being
 *      refused, which points at the token's pages_read_engagement scope
 *      rather than at read_insights).
 *
 * Makes no writes.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Post = require('../models/Post');
const { SocialStatsService } = require('../services/socialStatsService');

const postId = process.argv[2];

if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
  console.error('Usage: node scripts/inspectPostSocialStats.js <postId>');
  console.error('Find the id in the post detail page URL: /dash/posts/<postId>');
  process.exit(1);
}

const describe = (post) => {
  const ageMinutes = post.createdAt ? Math.round((Date.now() - new Date(post.createdAt).getTime()) / 60000) : null;

  console.log(`\nPost ${post._id}`);
  console.log(`  created: ${post.createdAt || 'unknown'}${ageMinutes !== null ? ` (${ageMinutes}m ago)` : ''}`);
  console.log(`  applicable TTL right now: ${Math.round(SocialStatsService.ttlFor(post) / 60000)}m`);

  console.log('\n  Facebook:');
  console.log(`    social.facebook.postId:    ${post.social?.facebook?.postId ?? '(not set)'}`);
  console.log(`    social.facebook.permalink: ${post.social?.facebook?.permalink ?? '(not set)'}`);
  console.log(`    socialStats.facebook:      ${JSON.stringify(post.socialStats?.facebook ?? {})}`);

  console.log('\n  Instagram:');
  console.log(`    social.instagram.mediaId:    ${post.social?.instagram?.mediaId ?? '(not set)'}`);
  console.log(`    social.instagram.permalink:  ${post.social?.instagram?.permalink ?? '(not set)'}`);
  console.log(`    socialStats.instagram:       ${JSON.stringify(post.socialStats?.instagram ?? {})}`);

  console.log(`\n  socialStats.fetchedAt: ${post.socialStats?.fetchedAt ?? '(never)'}`);
  console.log(`  currently stale: ${SocialStatsService.isStale(post)}`);

  console.log('\n  Diagnosis:');
  const fbId = post.social?.facebook?.postId;
  const igId = post.social?.instagram?.mediaId;

  if (!fbId && !igId) {
    console.log('    Neither platform has a stored id. This post is not mirrored as far as');
    console.log('    the site knows - no refresh, scheduled or webhook-triggered, will ever');
    console.log('    do anything for it, regardless of TTL. Even if the post is visible on');
    console.log('    the Facebook Page itself, the write that stores its id back onto this');
    console.log('    document either never ran or failed. Check server logs for');
    console.log(`    "Facebook auto-post failed for post ${post._id}" / "Instagram auto-post`);
    console.log(`    failed for post ${post._id}" around ${post.createdAt || 'its creation time'}.`);
  } else {
    if (fbId && !post.socialStats?.fetchedAt) {
      console.log('    Facebook id is stored but socialStats.fetchedAt is still empty - a');
      console.log('    fetch has never landed. Check server logs for "Social stats: Facebook');
      console.log('    batch failed" or a permission warning around this post\'s view times.');
    }
    if (fbId && post.socialStats?.fetchedAt && post.socialStats?.facebook?.reactions == null) {
      console.log('    Facebook id is stored and a fetch has run, but reactions/comments/shares');
      console.log('    - the always-available edges, not the insights-gated ones - are still');
      console.log('    null. This points at the token itself lacking pages_read_engagement,');
      console.log('    not at a views/insights permission gap.');
    }
    if (fbId && post.socialStats?.facebook?.reactions != null) {
      console.log('    Facebook counts are present and readable - reach should be showing on');
      console.log('    the site. If it still is not, this is a display issue, not a fetch one.');
    }
  }
};

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const post = await Post.findById(postId).lean();
  await mongoose.connection.close();

  if (!post) {
    console.error(`No post found with id ${postId}`);
    process.exit(1);
  }

  describe(post);
})().catch(async (error) => {
  console.error('Inspection failed:', error.message);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
