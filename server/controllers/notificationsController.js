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
 */
const scoreTier = (score) => {
  if (score >= 75) return 'strong';
  if (score >= 55) return 'good';
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

/** Turns the aggregation output into the localized payload the client renders. */
const serializeNotification = (row, language) => ({
  id: String(row._id),
  type: row.type,
  score: row.score,
  tier: scoreTier(row.score),
  reasons: row.reasons || [],
  isRead: !!row.isRead,
  createdAt: row.createdAt,
  matchId: row.match ? String(row.match) : null,
  daysApart: row.daysApart ?? null,
  post: serializePost(row.post, language),
  matchedPost: serializePost(row.matchedPost, language),
});

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

// @desc   List the signed-in user's notifications
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

    // Rows and counts are two aggregations over the same prefix rather than one
    // $facet: the row branch needs a $lookup, and $lookup inside $facet has a
    // patchy history across server versions. Both branches are cheap - the
    // prefix is bounded by one user's notifications.
    const [rows, [counts]] = await Promise.all([
      Notification.aggregate([
        ...basePipeline,
        { $skip: (page - 1) * pageSize },
        { $limit: pageSize },
        {
          $lookup: {
            from: 'postmatches',
            localField: 'match',
            foreignField: '_id',
            as: 'matchDoc',
          },
        },
        { $unwind: { path: '$matchDoc', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            type: 1,
            score: 1,
            reasons: 1,
            isRead: 1,
            createdAt: 1,
            match: 1,
            daysApart: '$matchDoc.daysApart',
            post: postProjection('ownPost'),
            matchedPost: postProjection('otherPost'),
          },
        },
      ]),
      Notification.aggregate([
        ...basePipeline,
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            unread: { $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] } },
          },
        },
      ]),
    ]);

    const total = counts?.total || 0;
    const unreadCount = counts?.unread || 0;

    return res.json({
      success: true,
      notifications: rows.map((row) => serializeNotification(row, language)),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
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
      updates['notificationPreferences.minScore'] = Math.round(minScore);
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
