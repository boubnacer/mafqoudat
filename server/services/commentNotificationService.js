const User = require('../models/User');
const Notification = require('../models/Notification');
const pushNotificationService = require('./pushNotificationService');

/**
 * Notifies a post's owner that someone commented on it - one in-app
 * Notification row and, device and preference permitting, one push. The
 * counterpart of matchingService's alert path, but for a single event rather
 * than a scored batch: no scoring, no confidence floor, just "did someone else
 * write this."
 *
 * Never throws - called fire-and-forget from commentsController, same
 * contract as matchEmailService/pushNotificationService: a failed alert is
 * never a failed comment.
 */
const notifyPostOwner = async ({ post, comment, commenterId, commenterUsername }) => {
  try {
    if (!post?.user) return;

    const ownerId = String(post.user);
    if (ownerId === String(commenterId)) return; // commenting on your own post notifies no one

    const owner = await User.findById(ownerId)
      .select('pushTokens notificationPreferences isActive')
      .lean();
    if (!owner || owner.isActive === false) return;

    const preferences = owner.notificationPreferences || {};
    if (preferences.commentAlerts === false) return;

    let notification;
    try {
      notification = await Notification.create({
        user: ownerId,
        type: 'new_comment',
        post: post._id,
        comment: comment._id,
      });
    } catch (error) {
      // Duplicate key means this exact comment was already notified (retry,
      // double submit) - nothing more to do, and nothing worth logging.
      if (error?.code === 11000) return;
      throw error;
    }

    if (preferences.pushAlerts !== false && (owner.pushTokens || []).length > 0) {
      await pushNotificationService.sendCommentAlert({
        user: owner,
        postId: post._id,
        commentId: comment._id,
        notificationId: notification._id,
        text: comment.text,
        commenterName: commenterUsername || null,
      });
    }
  } catch (error) {
    console.error('Comment notification failed:', error?.message || error);
  }
};

module.exports = { notifyPostOwner };
