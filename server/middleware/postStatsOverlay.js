const mongoose = require("mongoose");
const Post = require("../models/Post");
const socialStatsService = require("../services/socialStatsService");

/**
 * Merges live views/social/socialStats into a posts response and is the one
 * place that triggers a social stats refresh for whatever ends up in it -
 * whether the response came from a fresh aggregate or a cache hit.
 *
 * views, social and socialStats are the fastest-changing fields on a post.
 * postsCache / optimizedPaginatedCache / searchResultsCache (and getUserPosts'
 * own inline cache) exist to cache everything ELSE about a post - location,
 * category, description - for 10-30 minutes, which is the right trade for
 * fields that rarely change. Projecting these three volatile fields into the
 * same aggregate baked them into that long-lived cache too: a view counted
 * the moment after the cache warmed, or a Facebook/Instagram id stored
 * seconds after the first page load, sat invisible for up to half an hour.
 * Worse, because a cache hit short-circuits before the controller runs,
 * scheduleRefresh() never even fired during that window, so the *stored*
 * numbers went stale as well, not just the displayed ones.
 *
 * Mounted ahead of the cache middleware on every posts-read route, so it can
 * wrap res.json before either a cache hit or the controller responds, and
 * applies identically either way. The aggregates no longer project
 * views/social/socialStats at all - this is the only source for them now.
 */
const attachLivePostStats = (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = async (data) => {
    try {
      await mergeLiveStats(data);
    } catch (error) {
      console.error('Live post stats overlay failed:', error.message);
    }
    return originalJson(data);
  };

  next();
};

const applyLiveStats = (post, live) => {
  post.views = live.views;
  post.social = live.social;
  post.socialStats = live.socialStats;
};

const SocialPostJob = require("../models/SocialPostJob");

const enrichSocialPermalinks = (social) => {
  if (!social) return;
  if (social.facebook?.postId && !social.facebook?.permalink) {
    social.facebook.permalink = `https://www.facebook.com/${social.facebook.postId}`;
  }
};

const mergeLiveStats = async (data) => {
  if (!data) return;

  // getPost: a single flat post object. createdAt is selected but never
  // merged into the response - it exists only so scheduleRefresh can apply
  // the shorter freshness window to a post its owner is still watching.
  if (data._id && mongoose.Types.ObjectId.isValid(data._id)) {
    const live = await Post.findById(data._id).select('views social socialStats createdAt').lean();
    if (!live) return;

    enrichSocialPermalinks(live.social);

    // Overlay freshest permalinks and publishing status from SocialPostJob
    try {
      if (mongoose.connection?.readyState === 1 && typeof SocialPostJob?.find === 'function') {
        const jobs = await SocialPostJob.find({ post: data._id }).lean();
        if (jobs && jobs.length > 0) {
          live.social = live.social || {};
          const isPublishing = jobs.some((j) => j.status === 'pending' || j.status === 'processing');
          if (isPublishing) {
            live.social.isPublishing = true;
          }

          for (const job of jobs) {
            if (job.status === 'done' && job.permalink) {
              const platform = job.platform;
              if (platform === 'facebook' || platform === 'instagram') {
                live.social[platform] = live.social[platform] || {};
                const currentPostedAt = live.social[platform].postedAt ? new Date(live.social[platform].postedAt).getTime() : 0;
                const jobPublishedAt = job.publishedAt ? new Date(job.publishedAt).getTime() : 0;
                if (!live.social[platform].permalink || jobPublishedAt >= currentPostedAt) {
                  live.social[platform].permalink = job.permalink;
                  if (job.publishedId) {
                    if (platform === 'facebook') live.social.facebook.postId = job.publishedId;
                    if (platform === 'instagram') live.social.instagram.mediaId = job.publishedId;
                  }
                  if (job.publishedAt) {
                    live.social[platform].postedAt = job.publishedAt;
                  }
                }
              }
            }
          }
        }
      }
    } catch (_) {}

    applyLiveStats(data, live);
    socialStatsService.scheduleRefresh([live]);
    return;
  }

  // getAllPosts / getFilteredPosts / getUserPosts: { postsWithUser: [...] }.
  const posts = Array.isArray(data.postsWithUser) ? data.postsWithUser : null;
  if (!posts || posts.length === 0) return;

  const ids = posts.map((post) => post._id).filter((id) => mongoose.Types.ObjectId.isValid(id));
  if (ids.length === 0) return;

  const liveDocs = await Post.find({ _id: { $in: ids } }).select('views social socialStats createdAt').lean();
  if (liveDocs.length === 0) return;

  const liveById = new Map(liveDocs.map((doc) => [String(doc._id), doc]));
  for (const post of posts) {
    const live = liveById.get(String(post._id));
    if (live) {
      enrichSocialPermalinks(live.social);
      applyLiveStats(post, live);
    }
  }
  socialStatsService.scheduleRefresh(liveDocs);
};

module.exports = attachLivePostStats;
