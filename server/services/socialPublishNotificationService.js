const User = require('../models/User');
const Notification = require('../models/Notification');
const pushNotificationService = require('./pushNotificationService');

/**
 * Tells a listing's author that its copy reached the Facebook Page or the
 * Instagram account - or that the queue gave up trying.
 *
 * Every listing is mirrored to both on creation, and until now that happened
 * entirely out of sight: publishing is queued and paced (see
 * services/socialPublishQueue.js), so the copy goes up somewhere between a
 * minute and - after a quota deferral or a spam-block cooldown - many hours
 * later, with nothing to tell the author it ever happened.
 *
 * One alert per platform, sent the moment that platform's job reaches a
 * terminal state. Not one combined "shared to both" alert, because the two
 * jobs are independent: Facebook's pacing floor is 60-105s and Instagram's is
 * 180-300s, either can be deferred on its own, and either can fail while the
 * other succeeds. Holding the first until the second resolves would delay an
 * alert whose entire value is immediacy, and would need cross-job state the
 * queue does not otherwise keep.
 *
 * Never throws - called fire-and-forget from the queue, same contract as
 * commentNotificationService and matchEmailService: a failed alert must never
 * be able to fail, retry or delay a publish.
 */

const PLATFORMS = ['facebook', 'instagram'];
const STATUSES = ['published', 'failed'];

const notifyAuthor = async ({ post, platform, status }) => {
  try {
    if (!post?._id || !post?.user) return false;
    if (!PLATFORMS.includes(platform) || !STATUSES.includes(status)) return false;

    const author = await User.findById(post.user)
      .select('pushTokens webPushSubscriptions notificationPreferences isActive')
      .lean();
    if (!author || author.isActive === false) return false;

    const preferences = author.notificationPreferences || {};
    if (preferences.socialAlerts === false) return false;

    let notification;
    try {
      notification = await Notification.create({
        user: post.user,
        type: 'social_published',
        post: post._id,
        platform,
        socialStatus: status,
      });
    } catch (error) {
      // Duplicate key means this listing already reached this platform once as
      // far as the author is concerned - a reclaimed job, a --retry-failed, or
      // the queue recovering a publish whose answer never came back. Nothing to
      // add, and nothing worth logging.
      if (error?.code === 11000) return false;
      throw error;
    }

    if (
      preferences.pushAlerts !== false
      && ((author.pushTokens || []).length > 0 || (author.webPushSubscriptions || []).length > 0)
    ) {
      await pushNotificationService.sendSocialPublishAlert({
        user: author,
        postId: post._id,
        notificationId: notification._id,
        platform,
        status,
      });
    }

    return true;
  } catch (error) {
    console.error('Social publish notification failed:', error?.message || error);
    return false;
  }
};

module.exports = { notifyAuthor };
