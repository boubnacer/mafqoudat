const mongoose = require("mongoose");
const Post = require("../models/Post");
const { cacheService } = require("../config/cache");
const { readBearerUserInfo } = require("./optionalAuth");

/**
 * Counts a view of a post detail page.
 *
 * Post.views and Post.lastViewedAt have been on the schema (and rendered on
 * both front ends) since long before this middleware - nothing ever
 * incremented them, so every listing reported zero views forever.
 *
 * It runs as middleware rather than inside getPost because the detail route is
 * cached: on a cache hit the controller never runs, and a counter that only
 * moves on cache misses would undercount by whatever the cache TTL happens to
 * be. The stored number is always current; the number a visitor *sees* can lag
 * by the detail cache TTL, which is the correct trade for not bypassing the
 * cache on every page view.
 */

const readIntEnv = (name, fallback, { min, max }) => {
  const raw = Number.parseInt(process.env[name], 10);
  if (!Number.isFinite(raw)) return fallback;
  return Math.min(Math.max(raw, min), max);
};

// One viewer counts once per window. Long enough that reloading or coming back
// from the contact links does not inflate the number, short enough that a
// genuine return visit the next hour still counts.
const DEDUPE_TTL_SECONDS = readIntEnv('POST_VIEW_DEDUPE_MINUTES', 30, { min: 1, max: 1440 }) * 60;

// Deliberately not under the `posts:` prefix - creating a post invalidates
// `posts:*`, which would reset everyone's dedupe window and let a refresh
// loop count repeatedly.
const CACHE_PREFIX = 'postview';

const recordView = async (req) => {
  const postId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(postId)) return;

  // Read straight off the token instead of req.user: this middleware sits in
  // front of the response cache, and the cache key includes req.user.
  const viewerId = (await readBearerUserInfo(req))?.usernameId || null;

  // Signed-in viewers are counted per account so the window follows them
  // across devices; guests fall back to their address.
  const viewer = viewerId || `ip:${req.ip || 'unknown'}`;
  const key = cacheService.generateKey(CACHE_PREFIX, { post: postId, viewer });

  if (await cacheService.get(key)) return;
  await cacheService.set(key, 1, DEDUPE_TTL_SECONDS);

  const filter = { _id: postId };
  // An author refreshing their own listing is not reach. Guests are never
  // excluded - we cannot tell whether they are the author.
  if (viewerId && mongoose.Types.ObjectId.isValid(viewerId)) {
    filter.user = { $ne: new mongoose.Types.ObjectId(viewerId) };
  }

  await Post.updateOne(filter, {
    $inc: { views: 1 },
    $set: { lastViewedAt: new Date() },
  });
};

const trackPostView = (req, res, next) => {
  // Hand the request on first: counting a view must never add latency to, or
  // be able to fail, the page it is counting.
  next();

  recordView(req).catch((error) => {
    console.error('Post view tracking failed:', error.message);
  });
};

module.exports = trackPostView;
