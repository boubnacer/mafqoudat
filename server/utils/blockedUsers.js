/**
 * Shared read-side helpers for User.blockedUsers.
 *
 * Blocking is applied when content is read, not when it is written: nothing is
 * deleted or rewritten at block time, so unblocking restores the previous view
 * exactly and a block never affects what the *blocked* user sees. Every surface
 * that lists other people's content is expected to go through here, so "what a
 * block hides" has one definition instead of one per controller.
 */
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');
const { getRequestUserId } = require('./requestUser');

/**
 * The ids a given viewer has blocked, as ObjectIds. Returns [] for guests and
 * for anyone who has never blocked anybody, which is the overwhelming majority
 * - callers can treat a empty array as "no filtering needed" and skip the work.
 */
const getBlockedUserIds = async (viewerId) => {
  if (!viewerId || !mongoose.Types.ObjectId.isValid(viewerId)) return [];

  const viewer = await User.findById(viewerId).select('blockedUsers').lean().exec();
  return viewer?.blockedUsers?.length ? viewer.blockedUsers : [];
};

/** Same, resolved straight from a request. */
const getBlockedUserIdsForRequest = (req) => getBlockedUserIds(getRequestUserId(req));

/**
 * A stable, order-independent fingerprint of a block list, for cache keys.
 *
 * Responses become viewer-specific once blocking is applied, so any cache in
 * front of them has to key on the block list as well. Returning a fixed marker
 * for the empty case is what keeps the cache shared and warm for the vast
 * majority of viewers: everyone with no blocks keeps hitting the same entry as
 * guests do, and only users who have actually blocked someone get their own.
 */
const blockedCacheTag = (blockedIds) => {
  if (!blockedIds || blockedIds.length === 0) return 'none';
  // Hashed rather than joined: cacheService.generateKey concatenates its
  // params verbatim, so a user who has blocked a few dozen people would
  // otherwise push a kilobyte of ObjectIds into every posts cache key.
  const joined = blockedIds
    .map((id) => id.toString())
    .sort()
    .join(',');
  return crypto.createHash('sha1').update(joined).digest('hex').slice(0, 16);
};

/**
 * Adds `user: { $nin: [...] }` to a Mongo match object, preserving anything
 * already constrained on that field.
 */
const applyBlockedFilter = (match, blockedIds) => {
  if (!blockedIds || blockedIds.length === 0) return match;

  const existing = match.user;
  if (existing && typeof existing === 'object' && !mongoose.Types.ObjectId.isValid(existing)) {
    match.user = { ...existing, $nin: [...(existing.$nin || []), ...blockedIds] };
  } else if (existing) {
    // Already pinned to one specific author. Keep it, but let the $nin drop it
    // if that author happens to be blocked.
    match.user = { $eq: existing, $nin: blockedIds };
  } else {
    match.user = { $nin: blockedIds };
  }
  return match;
};

module.exports = {
  getBlockedUserIds,
  getBlockedUserIdsForRequest,
  blockedCacheTag,
  applyBlockedFilter,
};
