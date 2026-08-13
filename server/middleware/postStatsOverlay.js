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

const mergeLiveStats = async (data) => {
  if (!data) return;

  // getPost: a single flat post object.
  if (data._id && mongoose.Types.ObjectId.isValid(data._id)) {
    const live = await Post.findById(data._id).select('views social socialStats').lean();
    if (!live) return;
    applyLiveStats(data, live);
    socialStatsService.scheduleRefresh([live]);
    return;
  }

  // getAllPosts / getFilteredPosts / getUserPosts: { postsWithUser: [...] }.
  const posts = Array.isArray(data.postsWithUser) ? data.postsWithUser : null;
  if (!posts || posts.length === 0) return;

  const ids = posts.map((post) => post._id).filter((id) => mongoose.Types.ObjectId.isValid(id));
  if (ids.length === 0) return;

  const liveDocs = await Post.find({ _id: { $in: ids } }).select('views social socialStats').lean();
  if (liveDocs.length === 0) return;

  const liveById = new Map(liveDocs.map((doc) => [String(doc._id), doc]));
  for (const post of posts) {
    const live = liveById.get(String(post._id));
    if (live) applyLiveStats(post, live);
  }
  socialStatsService.scheduleRefresh(liveDocs);
};

module.exports = attachLivePostStats;
