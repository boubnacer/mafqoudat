const mongoose = require("mongoose");
const Notification = require("../models/Notification");
const PostMatch = require("../models/PostMatch");
const Post = require("../models/Post");
const User = require("../models/User");
const matchingService = require("../services/matchingService");

/**
 * Read/write API for in-app notifications and the lost/found match pairs they
 * point at. Every handler is authenticated and scoped to `req.user` - there is
 * no route here that can read another account's notifications.
 */

const SUPPORTED_LANGUAGES = ['en', 'fr', 'ar'];
const DEFAULT_PREFERENCES = { matchAlerts: true, emailAlerts: false, minScore: 50 };

const resolveLanguage = (value) => (SUPPORTED_LANGUAGES.includes(value) ? value : 'en');

const pickLabel = (labels, language) => {
  if (!labels) return '';
  if (typeof labels === 'string') return labels;
  return labels[language] || labels.en || labels.fr || labels.ar || '';
};

/**
 * Confidence bands. The raw score is still sent, but the band is what the UI
 * leads with - "strong match" is far more actionable to a reader than "78".
 *
 * The boundaries come from the engine rather than being restated here: it
 * floors same-category-same-city pairs onto the strong boundary exactly, so a
 * copy of that number drifting by one would silently relabel every such match.
 */
const scoreTier = (score) => {
  if (score >= matchingService.STRONG_MATCH_SCORE) return 'strong';
  if (score >= matchingService.GOOD_MATCH_SCORE) return 'good';
  return 'possible';
};

// ---------------------------------------------------------------------------
// Shared aggregation pieces
// ---------------------------------------------------------------------------

/**
 * Joins a post reference onto the pipeline and flattens the bits the client
 * renders. `field` is the local field holding the post id, `as` the output key.
 *
 * Post.city is a Mixed field that can hold a raw place name instead of an
 * ObjectId. A localField join is safe there: unlike findById it does not cast,
 * a string simply matches nothing and the city is left blank.
 */
const postLookupStages = (field, as) => ([
  {
    $lookup: {
      from: 'posts',
      localField: field,
      foreignField: '_id',
      as,
    },
  },
  { $unwind: `$${as}` },
  {
    $lookup: {
      from: 'categories',
      localField: `${as}.categories`,
      foreignField: '_id',
      as: `${as}Categories`,
    },
  },
  {
    $lookup: {
      from: 'foundlosts',
      localField: `${as}.foundLost`,
      foreignField: '_id',
      as: `${as}FoundLost`,
    },
  },
  { $unwind: { path: `$${as}FoundLost`, preserveNullAndEmptyArrays: true } },
  {
    $lookup: {
      from: 'cities',
      localField: `${as}.city`,
      foreignField: '_id',
      as: `${as}City`,
    },
  },
  { $unwind: { path: `$${as}City`, preserveNullAndEmptyArrays: true } },
]);

/** Projection expression producing the compact post shape the client consumes. */
const postProjection = (as) => ({
  id: `$${as}._id`,
  foundLostCode: { $toUpper: { $ifNull: [`$${as}FoundLost.code`, ''] } },
  categoryLabels: {
    $map: {
      input: { $ifNull: [`$${as}Categories`, []] },
      as: 'category',
      in: '$$category.labels',
    },
  },
  cityLabels: `$${as}City.labels`,
  exactLocation: `$${as}.exactLocation`,
  mainDate: `$${as}.mainDate`,
  image: { $ifNull: [`$${as}.cloudinaryUrl`, { $ifNull: [`$${as}.image`, ''] }] },
  createdAt: `$${as}.createdAt`,
  returned: `$${as}.returned`,
  status: `$${as}.status`,
  ownerId: `$${as}.user`,
});

/**
 * Both sides of a notification must still be live for it to be worth showing:
 * a notification about an item that was already returned is a wild goose chase.
 * The list and the unread badge share this stage so the badge can never claim
 * a count the list won't render.
 */
const LIVE_POSTS_MATCH = {
  $match: {
    'ownPost.status': 'active',
    'ownPost.returned': false,
    'otherPost.status': 'active',
    'otherPost.returned': false,
  },
};

const notificationPipeline = (userId, { unreadOnly = false } = {}) => ([
  {
    $match: {
      user: userId,
      isDismissed: false,
      ...(unreadOnly ? { isRead: false } : {}),
    },
  },
  // Groups are re-sorted by their newest activity further down, so this sort
  // survives only as the tiebreak *inside* a group: the matches array is later
  // sorted by score with a stable sort, which leaves equal-scoring counterparts
  // in newest-first order.
  { $sort: { createdAt: -1 } },
  ...postLookupStages('post', 'ownPost'),
  ...postLookupStages('matchedPost', 'otherPost'),
  LIVE_POSTS_MATCH,
]);

/** Localized, client-ready shape for one side of a match. */
const serializePost = (post, language) => {
  if (!post) return null;
  return {
    id: String(post.id),
    foundLostCode: post.foundLostCode || '',
    categoryLabel: (post.categoryLabels || [])
      .map((labels) => pickLabel(labels, language))
      .filter(Boolean)
      .join(' · '),
    cityLabel: pickLabel(post.cityLabels, language),
    exactLocation: post.exactLocation || '',
    mainDate: post.mainDate || '',
    image: post.image || '',
    createdAt: post.createdAt,
  };
};

/** One match inside a group: the counterpart listing plus why it was paired. */
const serializeMatchEntry = (entry, language) => ({
  notificationId: String(entry.notificationId),
  score: entry.score,
  tier: scoreTier(entry.score),
  reasons: entry.reasons || [],
  isRead: !!entry.isRead,
  createdAt: entry.createdAt,
  matchId: entry.match ? String(entry.match) : null,
  daysApart: entry.daysApart ?? null,
  matchedPost: serializePost(entry.matchedPost, language),
});

// Cap on how many counterpart listings travel inside one group. A listing that
// accumulates more than this is a browsing problem, not an inbox one - the
// group still reports its true `matchCount`, and the post's own matches panel
// shows the full set.
const MAX_MATCHES_PER_GROUP = 20;

/**
 * A group is "every alert about one of my listings", collapsed into a single
 * inbox entry.
 *
 * Posting a lost cat in a city that already holds six found-cat listings
 * produces six notifications at once, and six near-identical rows is not an
 * inbox - it's a wall. Grouping them by the reader's own post turns that into
 * one entry that says "possible matches for your lost cat" and lists them.
 *
 * Grouping happens here, on read, rather than by writing a different kind of
 * notification: the per-pair rows stay the unit of read/dismiss state (each
 * counterpart is accepted or rejected on its own), and existing notifications
 * group retroactively with no migration.
 */
const serializeGroup = (group, language) => {
  const matches = (group.matches || [])
    // Highest confidence first - the reader should meet the best lead before
    // scrolling. $push preserves the pipeline's createdAt order, which is the
    // wrong axis for this, so the sort happens here where the array is small.
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, MAX_MATCHES_PER_GROUP)
    .map((entry) => serializeMatchEntry(entry, language));

  return {
    // The reader's own post identifies the group: stable across pages and
    // across new matches arriving later.
    id: String(group._id),
    post: serializePost(group.post, language),
    matches,
    matchCount: group.matchCount || matches.length,
    unreadCount: group.unreadCount || 0,
    topScore: group.topScore || 0,
    topTier: scoreTier(group.topScore || 0),
    latestAt: group.latestAt,
  };
};

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

// @desc   List the signed-in user's match alerts, grouped by their own listing
// @route  GET /notifications
// @access Private
const listNotifications = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user);
    const language = resolveLanguage(req.query.language);
    const unreadOnly = req.query.filter === 'unread';
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 10, 1), 50);

    const basePipeline = notificationPipeline(userId, { unreadOnly });

    // Collapses the per-pair rows into one entry per listing the reader owns.
    // Runs after LIVE_POSTS_MATCH, so a counterpart that has since been
    // returned is already gone and never inflates a group's count.
    const groupStage = {
      $group: {
        _id: '$post',
        post: { $first: postProjection('ownPost') },
        matchCount: { $sum: 1 },
        unreadCount: { $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] } },
        topScore: { $max: '$score' },
        latestAt: { $max: '$createdAt' },
        matches: {
          $push: {
            notificationId: '$_id',
            score: '$score',
            reasons: '$reasons',
            isRead: '$isRead',
            createdAt: '$createdAt',
            match: '$match',
            daysApart: '$matchDoc.daysApart',
            matchedPost: postProjection('otherPost'),
          },
        },
      },
    };

    // Groups and totals are two aggregations over the same prefix rather than
    // one $facet: the group branch needs a $lookup, and $lookup inside $facet
    // has a patchy history across server versions. Both are cheap - the prefix
    // is bounded by one user's notifications.
    const [groups, [counts]] = await Promise.all([
      Notification.aggregate([
        ...basePipeline,
        // daysApart lives on the pair, and it is joined before the grouping so
        // each match inside a group can carry its own value.
        {
          $lookup: {
            from: 'postmatches',
            localField: 'match',
            foreignField: '_id',
            as: 'matchDoc',
          },
        },
        { $unwind: { path: '$matchDoc', preserveNullAndEmptyArrays: true } },
        groupStage,
        // Newest activity first, so a listing that just picked up a lead rises
        // to the top even if the listing itself is old.
        { $sort: { latestAt: -1 } },
        { $skip: (page - 1) * pageSize },
        { $limit: pageSize },
      ]),
      Notification.aggregate([
        ...basePipeline,
        {
          $group: {
            _id: '$post',
            unread: { $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] } },
          },
        },
        {
          $group: {
            _id: null,
            // Paging is over groups, so `total` counts groups; `unread` stays a
            // count of individual alerts, matching the bell badge exactly.
            totalGroups: { $sum: 1 },
            unread: { $sum: '$unread' },
          },
        },
      ]),
    ]);

    const totalGroups = counts?.totalGroups || 0;
    const unreadCount = counts?.unread || 0;

    return res.json({
      success: true,
      groups: groups.map((group) => serializeGroup(group, language)),
      page,
      pageSize,
      total: totalGroups,
      totalPages: Math.max(1, Math.ceil(totalGroups / pageSize)),
      unreadCount,
    });
  } catch (error) {
    console.error('Error listing notifications:', error);
    return res.status(500).json({ success: false, message: 'Failed to load notifications' });
  }
};

// @desc   Unread badge count
// @route  GET /notifications/unread-count
// @access Private
const getUnreadCount = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user);
    const [result] = await Notification.aggregate([
      ...notificationPipeline(userId, { unreadOnly: true }),
      { $count: 'value' },
    ]);

    return res.json({ success: true, unreadCount: result?.value || 0 });
  } catch (error) {
    console.error('Error counting unread notifications:', error);
    return res.status(500).json({ success: false, message: 'Failed to load unread count' });
  }
};

// @desc   Mark one notification as read
// @route  PATCH /notifications/:id/read
// @access Private
const markAsRead = async (req, res) => {
  try {
    const result = await Notification.updateOne(
      { _id: req.params.id, user: req.user, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      // Either already read or not this user's notification - both are a no-op
      // from the caller's point of view, and distinguishing them would leak
      // whether an id exists on another account.
      const exists = await Notification.exists({ _id: req.params.id, user: req.user });
      if (!exists) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({ success: false, message: 'Failed to update notification' });
  }
};

// @desc   Mark every unread notification as read
// @route  PATCH /notifications/read-all
// @access Private
const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { user: req.user, isRead: false, isDismissed: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    return res.json({ success: true, updated: result.modifiedCount || 0 });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return res.status(500).json({ success: false, message: 'Failed to update notifications' });
  }
};

// @desc   Remove a notification from the user's list
// @route  DELETE /notifications/:id
// @access Private
const dismissNotification = async (req, res) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, user: req.user })
      .select('_id')
      .lean();

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    // Flagged rather than deleted so a later rescan of the same pair cannot
    // re-insert what the user just cleared.
    await Notification.updateOne(
      { _id: notification._id },
      { $set: { isDismissed: true, isRead: true, readAt: new Date() } }
    );

    return res.json({ success: true });
  } catch (error) {
    console.error('Error dismissing notification:', error);
    return res.status(500).json({ success: false, message: 'Failed to dismiss notification' });
  }
};

// ---------------------------------------------------------------------------
// Match pairs
// ---------------------------------------------------------------------------

const serializeMatch = (match, viewerId, language) => {
  const ownIsA = String(match.postAData?.ownerId || '') === viewerId;
  const own = ownIsA ? match.postAData : match.postBData;
  const other = ownIsA ? match.postBData : match.postAData;

  return {
    id: String(match._id),
    score: match.score,
    tier: scoreTier(match.score),
    reasons: match.reasons || [],
    breakdown: match.breakdown || {},
    daysApart: match.daysApart ?? null,
    exactDates: !!match.exactDates,
    status: match.status,
    createdAt: match.createdAt,
    post: serializePost(own, language),
    matchedPost: serializePost(other, language),
  };
};

const matchPipelineTail = () => ([
  ...postLookupStages('postA', 'postADoc'),
  ...postLookupStages('postB', 'postBDoc'),
  {
    $match: {
      'postADoc.status': 'active',
      'postADoc.returned': false,
      'postBDoc.status': 'active',
      'postBDoc.returned': false,
    },
  },
  {
    $project: {
      score: 1,
      reasons: 1,
      breakdown: 1,
      daysApart: 1,
      exactDates: 1,
      status: 1,
      createdAt: 1,
      postAData: postProjection('postADoc'),
      postBData: postProjection('postBDoc'),
    },
  },
  { $sort: { score: -1, createdAt: -1 } },
]);

// @desc   Scored counterparts for one of the caller's own posts
// @route  GET /notifications/matches/post/:postId
// @access Private
const getMatchesForPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const language = resolveLanguage(req.query.language);
    const viewerId = String(req.user);

    const post = await Post.findById(postId).select('_id user status returned').lean();
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    if (String(post.user) !== viewerId) {
      // Match leads expose another user's listing alongside yours; only the
      // owner of a post gets to see what it was paired with.
      return res.status(403).json({ success: false, message: 'Not authorized to view matches for this post' });
    }

    if (post.status === 'active' && !post.returned) {
      // Posts predating the matching engine (and posts edited since their last
      // scan) get scored on first view. Throttled inside the service, and it
      // never notifies from a read path.
      await matchingService.ensureFreshMatches(post._id);
    }

    const postObjectId = new mongoose.Types.ObjectId(postId);
    const viewerObjectId = new mongoose.Types.ObjectId(viewerId);

    const matches = await PostMatch.aggregate([
      {
        $match: {
          $or: [{ postA: postObjectId }, { postB: postObjectId }],
          status: { $in: ['active', 'confirmed'] },
          dismissedBy: { $ne: viewerObjectId },
        },
      },
      ...matchPipelineTail(),
      { $limit: 20 },
    ]);

    return res.json({
      success: true,
      matches: matches.map((match) => serializeMatch(match, viewerId, language)),
    });
  } catch (error) {
    console.error('Error loading matches for post:', error);
    return res.status(500).json({ success: false, message: 'Failed to load matches' });
  }
};

// @desc   Every live match touching any of the caller's posts
// @route  GET /notifications/matches
// @access Private
const getMyMatches = async (req, res) => {
  try {
    const language = resolveLanguage(req.query.language);
    const viewerId = String(req.user);
    const viewerObjectId = new mongoose.Types.ObjectId(viewerId);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);

    const matches = await PostMatch.aggregate([
      {
        $match: {
          owners: viewerObjectId,
          status: { $in: ['active', 'confirmed'] },
          dismissedBy: { $ne: viewerObjectId },
        },
      },
      ...matchPipelineTail(),
      { $limit: limit },
    ]);

    return res.json({
      success: true,
      matches: matches.map((match) => serializeMatch(match, viewerId, language)),
    });
  } catch (error) {
    console.error('Error loading matches:', error);
    return res.status(500).json({ success: false, message: 'Failed to load matches' });
  }
};

// @desc   "Not my item" - hide a match pair for the caller only
// @route  PATCH /notifications/matches/:matchId/dismiss
// @access Private
const dismissMatch = async (req, res) => {
  try {
    const { matchId } = req.params;
    const viewerId = String(req.user);

    const match = await PostMatch.findById(matchId).select('owners').lean();
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }
    if (!(match.owners || []).some((owner) => String(owner) === viewerId)) {
      return res.status(403).json({ success: false, message: 'Not authorized to dismiss this match' });
    }

    // Dismissal is one-sided on purpose: the other owner may still recognise
    // the item, and hiding it from them would destroy the only lead they have.
    await PostMatch.updateOne(
      { _id: matchId },
      { $addToSet: { dismissedBy: new mongoose.Types.ObjectId(viewerId) } }
    );
    await Notification.updateMany(
      { match: matchId, user: viewerId },
      { $set: { isDismissed: true, isRead: true, readAt: new Date() } }
    );

    return res.json({ success: true });
  } catch (error) {
    console.error('Error dismissing match:', error);
    return res.status(500).json({ success: false, message: 'Failed to dismiss match' });
  }
};

// ---------------------------------------------------------------------------
// Preferences
// ---------------------------------------------------------------------------

// @desc   Read notification preferences
// @route  GET /notifications/preferences
// @access Private
const getPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user).select('notificationPreferences email').lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({
      success: true,
      preferences: { ...DEFAULT_PREFERENCES, ...(user.notificationPreferences || {}) },
      // The email toggle is meaningless without an address on file; the client
      // uses this to explain why it is disabled rather than silently ignoring it.
      hasEmail: !!user.email,
    });
  } catch (error) {
    console.error('Error loading notification preferences:', error);
    return res.status(500).json({ success: false, message: 'Failed to load preferences' });
  }
};

// @desc   Update notification preferences
// @route  PATCH /notifications/preferences
// @access Private
const updatePreferences = async (req, res) => {
  try {
    const updates = {};

    if (typeof req.body.matchAlerts === 'boolean') {
      updates['notificationPreferences.matchAlerts'] = req.body.matchAlerts;
    }
    if (typeof req.body.emailAlerts === 'boolean') {
      updates['notificationPreferences.emailAlerts'] = req.body.emailAlerts;
    }
    if (req.body.minScore !== undefined) {
      const minScore = Number(req.body.minScore);
      if (!Number.isFinite(minScore) || minScore < 0 || minScore > 100) {
        return res.status(400).json({ success: false, message: 'minScore must be between 0 and 100' });
      }
      // Capped at the strong-match boundary. A same-category, same-city pair is
      // floored onto exactly that score by the engine, and that pair is the one
      // case the product guarantees reaches its owner - a preference above it
      // would silently suppress the strongest lead the platform can produce.
      // The client's slider already stops here; this makes it true for any
      // caller.
      updates['notificationPreferences.minScore'] = Math.min(
        matchingService.STRONG_MATCH_SCORE,
        Math.round(minScore)
      );
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid preference fields provided' });
    }

    const user = await User.findByIdAndUpdate(
      req.user,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('notificationPreferences email').lean();

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({
      success: true,
      preferences: { ...DEFAULT_PREFERENCES, ...(user.notificationPreferences || {}) },
      hasEmail: !!user.email,
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return res.status(500).json({ success: false, message: 'Failed to update preferences' });
  }
};

module.exports = {
  listNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  dismissNotification,
  getMatchesForPost,
  getMyMatches,
  dismissMatch,
  getPreferences,
  updatePreferences,
};
