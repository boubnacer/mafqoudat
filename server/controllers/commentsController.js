const mongoose = require("mongoose");
const Comment = require("../models/Comment");
const Post = require("../models/Post");
const Report = require("../models/Report");
const socialStatsService = require("../services/socialStatsService");
const { getBlockedUserIds } = require("../utils/blockedUsers");
const { getRequestUserId } = require("../utils/requestUser");

/**
 * The comment thread on a post, merging two sources that are not equivalent
 * and are never allowed to look equivalent:
 *
 *  - Comments written here, by an account we can moderate. Deletable by their
 *    author, by the post's owner, and by an admin; reportable by anyone.
 *  - Comments left on the auto-posted Facebook/Instagram copies, read back
 *    into Post.socialComments by services/socialStatsService.js. Read-only
 *    mirrors of someone else's platform - we can show them and nothing more.
 *    No delete, no report-to-us, no reply: a reply sent through the Page
 *    token would appear as the Page itself speaking, not as the user.
 *
 * Every entry carries its `source`, and the UI keeps that visible, because
 * "a stranger on Facebook said this" and "a registered user here said this"
 * are different claims for a reader deciding whether to trust a lead about
 * their lost property.
 */

// The merged thread is assembled and paginated in memory, so both sources can
// be interleaved by time rather than one being stapled after the other. That
// is only sane because it is bounded: lost-and-found listings draw tens of
// comments, not thousands. The site's own comments are capped here and the
// social ones are already capped at fetch time (SOCIAL_COMMENTS_LIMIT).
const MAX_SITE_COMMENTS = 200;
const DEFAULT_PAGE_SIZE = 20;
// Generous because the clients "load more" by asking for a larger first page
// rather than by walking page numbers - the thread is one merged, re-sorted
// list, so a later page is not stable enough to append to blindly (a new
// comment arriving between requests shifts everything down by one).
const MAX_PAGE_SIZE = 100;

/** Shapes a stored site comment for the API, from the aggregation output. */
const toSiteEntry = (comment, { viewerId, isAdmin, postOwnerId }) => {
  const authorId = comment.user ? String(comment.user) : null;
  return {
    id: String(comment._id),
    source: 'site',
    text: comment.text,
    createdAt: comment.createdAt,
    author: {
      id: authorId,
      username: comment.username || null,
    },
    isAuthor: !!viewerId && authorId === viewerId,
    // The post's owner can clear their own thread, an author can retract
    // their own words, an admin can moderate anything.
    canDelete: !!viewerId && (authorId === viewerId || viewerId === postOwnerId || isAdmin),
    // Reporting your own comment is not a thing, and neither is reporting a
    // Facebook comment to us - we have no authority over that platform.
    canReport: !!viewerId && authorId !== viewerId,
  };
};

/** Shapes a cached Facebook/Instagram comment for the API. */
const toSocialEntry = (comment, platform) => ({
  id: `${platform}:${comment.commentId}`,
  source: platform,
  text: comment.text,
  createdAt: comment.createdAt,
  author: {
    id: null,
    // Absent when the commenter's privacy settings or our permissions hide
    // it. The comment still has something to say; it is just unattributed.
    username: comment.authorName || null,
  },
  isAuthor: false,
  canDelete: false,
  canReport: false,
});

/**
 * Interleaves the site's own comments with the cached Facebook/Instagram ones
 * into a single newest-first thread.
 *
 * Sorting by time across sources (rather than grouping by platform) is the
 * whole point: someone reading a lost-property thread wants the conversation
 * in the order it happened, not the site's half followed by Facebook's half.
 * A social comment with no usable timestamp sorts to the end rather than
 * jumping to the top, which is what `new Date(null)` would otherwise do.
 */
const mergeCommentSources = ({ siteEntries, facebook = [], instagram = [] }) => [
  ...siteEntries,
  ...facebook.map((comment) => toSocialEntry(comment, 'facebook')),
  ...instagram.map((comment) => toSocialEntry(comment, 'instagram')),
].sort((a, b) => {
  const left = a.createdAt ? new Date(a.createdAt).getTime() : -Infinity;
  const right = b.createdAt ? new Date(b.createdAt).getTime() : -Infinity;
  return right - left;
});

// @desc   Get a post's comment thread (site + Facebook + Instagram, merged)
// @route  GET /posts/:id/comments
// @access Public - reading is as public as the listing itself
const getPostComments = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const viewerId = getRequestUserId(req);
    const isAdmin = req.role === 'admin';

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);

    const post = await Post.findById(postId)
      .select('user social socialComments socialStats createdAt')
      .lean();

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Same rule the listings use: a viewer never sees content from someone
    // they have blocked.
    const blockedIds = viewerId ? await getBlockedUserIds(viewerId) : [];
    const blockedFilter = blockedIds.length > 0
      ? { user: { $nin: blockedIds.map((blockedId) => new mongoose.Types.ObjectId(blockedId)) } }
      : {};

    const siteComments = await Comment.aggregate([
      { $match: { post: new mongoose.Types.ObjectId(postId), status: 'active', ...blockedFilter } },
      { $sort: { createdAt: -1 } },
      { $limit: MAX_SITE_COMMENTS },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'Author',
        },
      },
      { $unwind: { path: '$Author', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          text: 1,
          createdAt: 1,
          user: 1,
          username: '$Author.username',
        },
      },
    ]);

    const postOwnerId = post.user ? String(post.user) : null;
    const entries = mergeCommentSources({
      siteEntries: siteComments.map((comment) => toSiteEntry(comment, { viewerId, isAdmin, postOwnerId })),
      facebook: post.socialComments?.facebook || [],
      instagram: post.socialComments?.instagram || [],
    });

    // Opportunistic, same as the reach numbers: a thread being read is a
    // thread worth re-checking for new Facebook/Instagram comments. Deferred
    // and TTL-throttled inside the service, so this costs the reader nothing.
    socialStatsService.scheduleRefresh([post]);

    const start = (page - 1) * pageSize;
    return res.status(200).json({
      success: true,
      comments: entries.slice(start, start + pageSize),
      page,
      pageSize,
      total: entries.length,
      totalPages: Math.max(Math.ceil(entries.length / pageSize), 1),
      // Per-source totals, so the UI can say where the conversation is
      // happening without recounting a paginated slice.
      counts: {
        site: entries.filter((entry) => entry.source === 'site').length,
        facebook: (post.socialComments?.facebook || []).length,
        instagram: (post.socialComments?.instagram || []).length,
      },
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return res.status(500).json({ success: false, message: 'Error fetching comments' });
  }
};

// @desc   Post a comment on a listing
// @route  POST /posts/:id/comments
// @access Private - signed in only
const createComment = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const viewerId = getRequestUserId(req);
    const text = String(req.body.text || '').trim();

    if (!text) {
      return res.status(400).json({ success: false, message: 'Comment text is required' });
    }

    const post = await Post.findById(postId).select('_id status').lean();
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const comment = await Comment.create({
      post: post._id,
      user: new mongoose.Types.ObjectId(viewerId),
      text,
    });

    // Echo the stored comment back in the same shape the list returns, so the
    // client can append it without refetching the whole thread.
    return res.status(201).json({
      success: true,
      comment: {
        id: String(comment._id),
        source: 'site',
        text: comment.text,
        createdAt: comment.createdAt,
        author: { id: viewerId, username: req.username || null },
        isAuthor: true,
        canDelete: true,
        canReport: false,
      },
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    return res.status(500).json({ success: false, message: 'Error creating comment' });
  }
};

// @desc   Remove a comment
// @route  DELETE /posts/:id/comments/:commentId
// @access Private - the comment's author, the post's owner, or an admin
const deleteComment = async (req, res) => {
  try {
    const { id: postId, commentId } = req.params;
    const viewerId = getRequestUserId(req);
    const isAdmin = req.role === 'admin';

    const comment = await Comment.findOne({ _id: commentId, post: postId });
    if (!comment || comment.status === 'removed') {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    const post = await Post.findById(postId).select('user').lean();
    const isCommentAuthor = String(comment.user) === viewerId;
    const isPostOwner = post && String(post.user) === viewerId;

    if (!isCommentAuthor && !isPostOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to remove this comment' });
    }

    // Soft delete - see the note on the model. The text stays for any report
    // already filed against it to still be judgeable.
    comment.status = 'removed';
    comment.removedBy = new mongoose.Types.ObjectId(viewerId);
    comment.removedAt = new Date();
    await comment.save();

    return res.status(200).json({ success: true, message: 'Comment removed' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return res.status(500).json({ success: false, message: 'Error deleting comment' });
  }
};

// @desc   Report a comment for moderation
// @route  POST /posts/:id/comments/:commentId/report
// @access Private
const reportComment = async (req, res) => {
  try {
    const { id: postId, commentId } = req.params;
    const viewerId = getRequestUserId(req);
    const { reasonType, reason } = req.body;

    const comment = await Comment.findOne({ _id: commentId, post: postId, status: 'active' }).lean();
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    if (String(comment.user) === viewerId) {
      return res.status(400).json({ success: false, message: 'You cannot report your own comment' });
    }

    // Reuses the existing Report collection rather than introducing a second
    // moderation queue - one inbox for admins, whether the thing reported is
    // a listing or a comment on one. commentId is what distinguishes them.
    await Report.create({
      postId: new mongoose.Types.ObjectId(postId),
      commentId: new mongoose.Types.ObjectId(commentId),
      reportedBy: new mongoose.Types.ObjectId(viewerId),
      reasonType: reasonType || 'other',
      reason: String(reason || '').trim() || 'Reported comment',
      postData: { userId: comment.user },
    });

    return res.status(201).json({ success: true, message: 'Comment reported' });
  } catch (error) {
    console.error('Error reporting comment:', error);
    return res.status(500).json({ success: false, message: 'Error reporting comment' });
  }
};

module.exports = {
  getPostComments,
  createComment,
  deleteComment,
  reportComment,
  // Exported for the offline check - the merge/sort and the per-viewer
  // permission flags are the parts worth testing without a database.
  toSiteEntry,
  toSocialEntry,
  mergeCommentSources,
};
