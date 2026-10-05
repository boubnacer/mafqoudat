const Post = require("../models/Post");
const User = require("../models/User");
const socialPublishQueue = require("../services/socialPublishQueue");
const { scheduleAdminAction } = require("../services/adminAudit");
const { cacheService } = require("../config/cache");

/**
 * Admin Social Media Review Controller
 *
 * Allows administrators to:
 * 1. View all listings waiting for social media publishing review (or approved/skipped)
 * 2. Edit listing details (description, contact, location) before sharing
 * 3. Approve and enqueue to Facebook and Instagram (handled by socialPublishQueue with paced delays)
 * 4. Skip social media publishing for listings that shouldn't be shared
 */

// @desc    Get listings waiting for social review or previously reviewed
// @route   GET /admin/social-review/posts
// @access  Private (Admin only)
const getSocialReviewPosts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    const status = req.query.status || 'pending'; // 'pending' | 'approved' | 'skipped' | 'all'
    const search = (req.query.search || '').trim();

    // Base filter: exclude suspended posts from social review
    const baseCondition = { status: { $ne: 'suspended' } };

    const pendingCondition = {
      ...baseCondition,
      $or: [
        { 'social.approvalStatus': 'pending' },
        { 'social.approvalStatus': { $exists: false } },
        { 'social.approvalStatus': null },
        { social: { $exists: false } },
      ],
      'social.facebook.postId': null,
      'social.instagram.mediaId': null,
    };

    const approvedCondition = {
      ...baseCondition,
      $or: [
        { 'social.approvalStatus': 'approved' },
        { 'social.facebook.postId': { $ne: null } },
        { 'social.instagram.mediaId': { $ne: null } },
      ],
    };

    const skippedCondition = {
      ...baseCondition,
      'social.approvalStatus': 'skipped',
    };

    let statusCondition;
    if (status === 'pending') {
      statusCondition = pendingCondition;
    } else if (status === 'approved') {
      statusCondition = approvedCondition;
    } else if (status === 'skipped') {
      statusCondition = skippedCondition;
    } else {
      statusCondition = baseCondition;
    }

    let filter = statusCondition;
    if (search) {
      const searchCondition = {
        $or: [
          { description: { $regex: search, $options: 'i' } },
          { contact: { $regex: search, $options: 'i' } },
          { exactLocation: { $regex: search, $options: 'i' } },
        ],
      };
      filter = { $and: [statusCondition, searchCondition] };
    }

    const [posts, total, pendingCount, approvedCount, skippedCount] = await Promise.all([
      Post.find(filter)
        .populate('user', 'username email phone')
        .populate('category', 'labels code')
        .populate('categories', 'labels code')
        .populate({ path: 'city', model: 'City', select: 'labels' })
        .populate('country', 'labels names code')
        .populate('foundLost', 'code labels')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Post.countDocuments(filter),
      Post.countDocuments(pendingCondition),
      Post.countDocuments(approvedCondition),
      Post.countDocuments(skippedCondition),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    res.status(200).json({
      success: true,
      data: {
        posts,
        total,
        page,
        totalPages,
        counts: {
          pending: pendingCount,
          approved: approvedCount,
          skipped: skippedCount,
        },
      },
    });
  } catch (error) {
    console.error('[AdminSocial] Error fetching social review posts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve social review listings',
      error: error.message,
    });
  }
};

// @desc    Approve listing and enqueue for Facebook/Instagram publishing
// @route   POST /admin/social-review/:postId/approve
// @access  Private (Admin only)
const approveSocialPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { customDescription, customContact } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    if (customDescription && typeof customDescription === 'string') {
      post.description = customDescription.trim();
    }
    if (customContact && typeof customContact === 'string') {
      post.contact = customContact.trim();
    }

    if (!post.social) {
      post.social = {};
    }
    post.social.approvalStatus = 'approved';
    post.social.approvedAt = new Date();
    post.social.approvedBy = req.user;

    await post.save();

    // Enqueue to the existing resilient socialPublishQueue.
    // The worker paces out publishes with reasonable delays (jitter, 60-105s FB, 180-300s IG)
    // to strictly prevent platform bans or spam triggers.
    let queued = false;
    let queueMessage = '';
    try {
      await socialPublishQueue.enqueuePost(post);
      queued = true;
      queueMessage = 'Listing approved and successfully enqueued for social publishing with safety pacing.';
    } catch (queueErr) {
      console.error(`[AdminSocial] Failed to enqueue post ${post._id}:`, queueErr);
      queueMessage = 'Listing approved, but social media queueing experienced an issue: ' + queueErr.message;
    }

    // Invalidate caches
    try {
      await cacheService.invalidatePattern('posts:*');
      await cacheService.invalidatePattern('dashboard:*');
    } catch (_) {}

    // Audit log
    scheduleAdminAction({
      actorId: req.user,
      targetType: 'post',
      targetId: post._id,
      action: 'social_approve',
      label: (post.description || 'Listing').slice(0, 50),
      details: { postId: post._id, queued },
      req,
    });

    res.status(200).json({
      success: true,
      message: queueMessage,
      data: post,
    });
  } catch (error) {
    console.error('[AdminSocial] Error approving post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve listing for social media',
      error: error.message,
    });
  }
};

// @desc    Skip social media publishing for a listing
// @route   POST /admin/social-review/:postId/skip
// @access  Private (Admin only)
const skipSocialPost = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    if (!post.social) {
      post.social = {};
    }
    post.social.approvalStatus = 'skipped';
    post.social.skippedAt = new Date();

    await post.save();

    // Invalidate caches
    try {
      await cacheService.invalidatePattern('posts:*');
    } catch (_) {}

    // Audit log
    scheduleAdminAction({
      actorId: req.user,
      targetType: 'post',
      targetId: post._id,
      action: 'social_skip',
      label: (post.description || 'Listing').slice(0, 50),
      details: { postId: post._id },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Listing marked as skipped for social publishing.',
      data: post,
    });
  } catch (error) {
    console.error('[AdminSocial] Error skipping post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to skip listing',
      error: error.message,
    });
  }
};

// @desc    Update listing details directly from the social review panel
// @route   PATCH /admin/social-review/:postId/update
// @access  Private (Admin only)
const updateSocialPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { description, contact, exactLocation, returned, cloudinaryUrl } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    if (description !== undefined) post.description = description;
    if (contact !== undefined) post.contact = contact;
    if (exactLocation !== undefined) post.exactLocation = exactLocation;
    if (returned !== undefined) post.returned = returned;
    if (cloudinaryUrl !== undefined) post.cloudinaryUrl = cloudinaryUrl;

    await post.save();

    try {
      await cacheService.invalidatePattern('posts:*');
      await cacheService.invalidatePattern('dashboard:*');
    } catch (_) {}

    scheduleAdminAction({
      actorId: req.user,
      targetType: 'post',
      targetId: post._id,
      action: 'social_update',
      label: (post.description || 'Listing').slice(0, 50),
      details: { postId: post._id },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Listing updated successfully.',
      data: post,
    });
  } catch (error) {
    console.error('[AdminSocial] Error updating post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update listing',
      error: error.message,
    });
  }
};

module.exports = {
  getSocialReviewPosts,
  approveSocialPost,
  skipSocialPost,
  updateSocialPost,
};
