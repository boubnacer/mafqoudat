const Report = require("../models/Report");
const Post = require("../models/Post");
const User = require("../models/User");
const Category = require("../models/Category");
const Country = require("../models/Country");
const FoundLost = require("../models/FoundLost");
const City = require("../models/City");
const PasswordResetRequest = require("../models/PasswordResetRequest");
const Visitor = require("../models/Visitor");
const Comment = require("../models/Comment");
const bcrypt = require("bcrypt");
const { purgeUserData } = require("./usersController");
const { scheduleAdminAction } = require("../services/adminAudit");

// A listing has no title - the card and the detail page both lead with its
// description - so anywhere the panel needs to name one, it names it this way.
// The tables used to read `post.title`, a field that has never existed on the
// schema, and so rendered "No title" on every row of the reports and
// promotions queues.
const POST_LABEL_LENGTH = 90;
const postLabel = (post) => {
  const text = (post?.description || post?.exactLocation || "").trim();
  if (!text) return "";
  return text.length > POST_LABEL_LENGTH
    ? `${text.slice(0, POST_LABEL_LENGTH - 1)}\u2026`
    : text;
};


// @desc Get all reports with pagination and filtering
// @route GET /admin/reports
// @access Private (Admin only)
const getAllReports = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const status = req.query.status;
    const reasonType = req.query.reasonType;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (reasonType) filter.reasonType = reasonType;

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // A report filed against a comment carries `commentId`; one filed against
    // the listing itself does not (which is every report predating comments
    // existing at all). Both land in this one queue - the panel used to have no
    // notion of the comment kind and rendered such a report as if the listing
    // were what someone objected to, with the comment's text nowhere on screen.
    if (req.query.target === 'comment') filter.commentId = { $ne: null };
    if (req.query.target === 'post') filter.commentId = null;

    // Get reports with populated data
    const reports = await Report.find(filter)
      .populate('postId', '_id description exactLocation contact createdAt status returned cloudinaryUrl')
      .populate('reportedBy', 'username')
      .populate('reviewedBy', 'username')
      .populate({ path: 'commentId', select: 'text status user createdAt', populate: { path: 'user', select: 'username' } })
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    const decorated = reports.map((report) => ({
      ...report,
      // Resolved here rather than in each client, so web and any later consumer
      // cannot disagree about what a report is "about".
      target: report.commentId ? 'comment' : 'post',
      postLabel: postLabel(report.postId),
      commentText: report.commentId?.text || null,
      commentAuthor: report.commentId?.user?.username || null,
      commentRemoved: report.commentId ? report.commentId.status === 'removed' : null,
    }));

    // Get total count for pagination
    const totalReports = await Report.countDocuments(filter);
    const totalPages = Math.ceil(totalReports / limit);

    res.status(200).json({
      success: true,
      data: {
        reports: decorated,
        pagination: {
          currentPage: page,
          totalPages,
          totalReports,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching reports",
    });
  }
};

// @desc Get all promotion requests with pagination and filtering
// @route GET /admin/promotions
// @access Private (Admin only)
const getAllPromotions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const status = req.query.status; // 'requested', 'processed'
    const sortBy = req.query.sortBy || 'promotionRequestedAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Build filter object
    const filter = { promotionRequested: true };
    if (status === 'processed') {
      filter.promotionProcessed = true;
    } else if (status === 'requested') {
      filter.promotionProcessed = false;
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get posts with promotion requests
    const promotions = await Post.find(filter)
      .populate('user', 'username email')
      .populate('category', 'labels.en code')
      .populate('country', 'labels.en code names.en')
      .populate('foundLost', 'code')
      .populate('city', 'labels.en')
      .select('_id description exactLocation contact createdAt promotionRequested promotionRequestedAt promotionProcessed promotionProcessedAt promotionPhoneNumber')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalPromotions = await Post.countDocuments(filter);
    const totalPages = Math.ceil(totalPromotions / limit);

    res.status(200).json({
      success: true,
      data: {
        // Same reason as the reports queue: there is no `title` on a listing,
        // so the row is named from its description.
        promotions: promotions.map((promotion) => ({
          ...promotion,
          postLabel: postLabel(promotion),
        })),
        pagination: {
          currentPage: page,
          totalPages,
          totalPromotions,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching promotions:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching promotions",
    });
  }
};

// @desc Update report status
// @route PATCH /admin/reports/:id
// @access Private (Admin only)
const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    const adminId = req.user;

    // Validate status
    const validStatuses = ['pending', 'reviewed', 'resolved', 'dismissed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be one of: " + validStatuses.join(', '),
      });
    }

    // Update report
    const report = await Report.findByIdAndUpdate(
      id,
      {
        status,
        reviewedBy: adminId,
        reviewedAt: new Date(),
        adminNotes: adminNotes || '',
      },
      { new: true }
    )
      .populate('postId', 'description exactLocation contact createdAt status')
      .populate('reportedBy', 'username')
      .populate('reviewedBy', 'username');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    scheduleAdminAction({
      actorId: adminId,
      action: `report.${status}`,
      targetType: 'report',
      targetId: report._id,
      targetLabel: postLabel(report.postId),
      meta: { status, reasonType: report.reasonType, hasNotes: Boolean(adminNotes) },
    });

    res.status(200).json({
      success: true,
      message: "Report status updated successfully",
      data: report,
    });
  } catch (error) {
    console.error('Error updating report status:', error);
    res.status(500).json({
      success: false,
      message: "Error updating report status",
    });
  }
};

// @desc Update promotion status
// @route PATCH /admin/promotions/:id
// @access Private (Admin only)
const updatePromotionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { processed } = req.body;
    const adminId = req.user;

    // Update post promotion status
    const post = await Post.findByIdAndUpdate(
      id,
      {
        promotionProcessed: processed,
        promotionProcessedAt: processed ? new Date() : null,
      },
      { new: true }
    )
      .populate('user', 'username email')
      .populate('category', 'labels.en code')
      .populate('country', 'labels.en code names.en')
      .populate('foundLost', 'code')
      .populate('city', 'labels.en');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    scheduleAdminAction({
      actorId: adminId,
      action: processed ? 'promotion.process' : 'promotion.reopen',
      targetType: 'promotion',
      targetId: post._id,
      targetLabel: postLabel(post),
      meta: { processed: Boolean(processed), owner: post.user?.username || null },
    });

    res.status(200).json({
      success: true,
      message: `Promotion ${processed ? 'marked as processed' : 'marked as unprocessed'}`,
      data: post,
    });
  } catch (error) {
    console.error('Error updating promotion status:', error);
    res.status(500).json({
      success: false,
      message: "Error updating promotion status",
    });
  }
};

// @desc Delete a post (admin only)
// @route DELETE /admin/posts/:id
// @access Private (Admin only)
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user;

    // Validate post ID
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Post ID required",
      });
    }

    // Find the post
    const post = await Post.findById(id)
      .populate('user', 'username')
      .populate('category', 'labels.en code')
      .populate('country', 'labels.en code names.en')
      .populate('foundLost', 'code')
      .populate('city', 'labels.en');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Delete the post
    await Post.findByIdAndDelete(id);

    // Also delete any reports related to this post, and the comment thread that
    // hung off it - comments are per-post rows with no owner left to read them
    // once the listing is gone, and leaving them behind kept orphaned text in
    // the moderation counts forever.
    const [{ deletedCount: reportCount = 0 } = {}, { deletedCount: commentCount = 0 } = {}] =
      await Promise.all([
        Report.deleteMany({ postId: id }),
        Comment.deleteMany({ post: id }),
      ]);

    scheduleAdminAction({
      actorId: adminId,
      action: 'post.delete',
      targetType: 'post',
      targetId: post._id,
      targetLabel: postLabel(post),
      meta: {
        owner: post.user?.username || null,
        reportsRemoved: reportCount,
        commentsRemoved: commentCount,
      },
    });

    res.status(200).json({
      success: true,
      message: "Post deleted successfully",
      data: {
        deletedPost: {
          id: post._id,
          user: post.user?.username,
          category: post.category?.labels?.en || post.category?.code,
          country: post.country?.labels?.en || post.country?.names?.en,
        }
      }
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({
      success: false,
      message: "Error deleting post",
    });
  }
};

// @desc Get all password reset requests with pagination and filtering
// @route GET /admin/password-reset-requests
// @access Private (Admin only)
const getAllPasswordResetRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const status = req.query.status;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get password reset requests with populated data
    const resetRequests = await PasswordResetRequest.find(filter)
      .populate('processedBy', 'username')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalRequests = await PasswordResetRequest.countDocuments(filter);
    const totalPages = Math.ceil(totalRequests / limit);

    res.status(200).json({
      success: true,
      data: {
        resetRequests,
        pagination: {
          currentPage: page,
          totalPages,
          totalRequests,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching password reset requests:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching password reset requests",
    });
  }
};

// @desc Update password reset request status
// @route PATCH /admin/password-reset-requests/:id
// @access Private (Admin only)
const updatePasswordResetRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    const adminId = req.user;

    // Validate status
    const validStatuses = ['pending', 'processed', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be one of: " + validStatuses.join(', '),
      });
    }

    // Update request
    const resetRequest = await PasswordResetRequest.findByIdAndUpdate(
      id,
      {
        status,
        processedBy: adminId,
        processedAt: new Date(),
        adminNotes: adminNotes || '',
      },
      { new: true }
    )
      .populate('processedBy', 'username');

    if (!resetRequest) {
      return res.status(404).json({
        success: false,
        message: "Password reset request not found",
      });
    }

    scheduleAdminAction({
      actorId: adminId,
      action: `resetRequest.${status}`,
      targetType: 'resetRequest',
      targetId: resetRequest._id,
      targetLabel: resetRequest.contactInfo || '',
      meta: { status },
    });

    res.status(200).json({
      success: true,
      message: "Password reset request status updated successfully",
      data: resetRequest,
    });
  } catch (error) {
    console.error('Error updating password reset request status:', error);
    res.status(500).json({
      success: false,
      message: "Error updating password reset request status",
    });
  }
};

// @desc Get all users with pagination, search, and sorting
// @route GET /admin/users
// @access Private (Admin only)
const getAllUsersAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Build filter object
    const filter = {};
    
    // Add search filter for username, email, or phone
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get users with populated data
    const users = await User.find(filter)
      .populate('country', 'labels.en code names.en')
      .select('username email phone role isActive createdAt lastLogin profile.firstName profile.lastName')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalUsers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / limit);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching users",
    });
  }
};

// @desc Get all posts for a specific user with pagination
// @route GET /admin/users/:userId/posts
// @access Private (Admin only)
const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Validate user exists
    const user = await User.findById(userId).select('username email');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get user's posts with populated data
    const posts = await Post.find({ user: userId })
      .populate('category', 'labels.en code')
      .populate('country', 'labels.en code names.en')
      .populate('foundLost', 'code')
      .populate('city', 'labels.en')
      .select('_id description exactLocation contact createdAt status returned image cloudinaryUrl')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalPosts = await Post.countDocuments({ user: userId });
    const totalPages = Math.ceil(totalPosts / limit);

    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
        },
        posts,
        pagination: {
          currentPage: page,
          totalPages,
          totalPosts,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching user posts",
    });
  }
};

// @desc Admin reset user password
// @route PATCH /admin/users/:userId/reset-password
// @access Private (Admin only)
const adminResetUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;
    const adminId = req.user;

    // Validate inputs
    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password is required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // Find the user
    const user = await User.findById(userId).select('username email role');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password
    user.password = hashedPassword;
    await user.save();

    scheduleAdminAction({
      actorId: adminId,
      action: 'user.resetPassword',
      targetType: 'user',
      targetId: user._id,
      targetLabel: user.username,
      meta: { role: user.role },
    });

    res.status(200).json({
      success: true,
      message: "User password reset successfully",
      data: {
        userId: user._id,
        username: user.username,
      },
    });
  } catch (error) {
    console.error('Error resetting user password:', error);
    res.status(500).json({
      success: false,
      message: "Error resetting user password",
    });
  }
};

// @desc Delete a user and all their posts
// @route DELETE /admin/users/:userId
// @access Private (Admin only)
const deleteUserAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user;

    // Validate user exists - phone is included because purgeUserData matches
    // support messages and password-reset requests on every contact string.
    const user = await User.findById(userId).select('username email phone role');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent deleting admin users
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: "Cannot delete admin users",
      });
    }

    // Delegated so an admin deletion erases exactly what a self-service
    // deletion erases - including the Cloudinary images, match rows and
    // notifications that this route used to leave behind pointing at posts
    // that no longer existed.
    const { deletedPosts: postCount } = await purgeUserData(user);

    scheduleAdminAction({
      actorId: adminId,
      action: 'user.delete',
      targetType: 'user',
      targetId: user._id,
      targetLabel: user.username,
      meta: { email: user.email || null, deletedPosts: postCount },
    });

    res.status(200).json({
      success: true,
      message: "User and all their posts deleted successfully",
      data: {
        deletedUser: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        deletedPostsCount: postCount,
      },
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: "Error deleting user",
    });
  }
};

// @desc Get all posts with pagination, search, and filtering
// @route GET /admin/posts
// @access Private (Admin only)
const getAllPostsAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const search = req.query.search || '';
    const status = req.query.status;
    const category = req.query.category;
    const country = req.query.country;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Build filter object
    const filter = {};
    
    // Add status filter
    if (status) {
      filter.status = status;
    }

    // Add category filter
    if (category) {
      filter.category = category;
    }

    // Add country filter
    if (country) {
      filter.country = country;
    }

    // Add search filter for description and exactLocation
    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        { exactLocation: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get posts with populated data
    const posts = await Post.find(filter)
      .populate('user', 'username email')
      .populate('category', 'labels code')
      .populate('country', 'labels names code')
      .populate('city', 'labels')
      .populate('foundLost', 'code')
      .select('_id description exactLocation contact createdAt updatedAt status returned image cloudinaryUrl mainDate promotionRequested promotionProcessed views')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalPosts = await Post.countDocuments(filter);
    const totalPages = Math.ceil(totalPosts / limit);

    res.status(200).json({
      success: true,
      data: {
        posts,
        pagination: {
          currentPage: page,
          totalPages,
          totalPosts,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching posts",
    });
  }
};

// @desc Change a listing's status without deleting it
// @route PATCH /admin/posts/:id/status
// @access Private (Admin only)
//
// The panel's only lever on a bad listing used to be deletion, which is both
// irreversible and the wrong answer to most reports: a listing that breaks a
// rule should come off the site while the person who wrote it is still reachable
// and the report is still judgeable. `suspended` is already in the schema's
// status enum and already hidden from every public read; nothing surfaced it.
const updatePostStatusAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const adminId = req.user;

    const validStatuses = ['active', 'resolved', 'expired', 'suspended'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be one of: " + validStatuses.join(', '),
      });
    }

    const post = await Post.findById(id).populate('user', 'username');
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const previousStatus = post.status;
    post.status = status;
    // resolvedAt is what the analytics "resolved" series reads, so it has to
    // follow the status rather than being set only by the owner's own flow.
    if (status === 'resolved' && !post.resolvedAt) post.resolvedAt = new Date();
    if (status !== 'resolved') post.resolvedAt = null;
    await post.save();

    scheduleAdminAction({
      actorId: adminId,
      action: `post.status.${status}`,
      targetType: 'post',
      targetId: post._id,
      targetLabel: postLabel(post),
      meta: { from: previousStatus, to: status, owner: post.user?.username || null },
    });

    res.status(200).json({
      success: true,
      message: "Post status updated successfully",
      data: { _id: post._id, status: post.status, resolvedAt: post.resolvedAt },
    });
  } catch (error) {
    console.error('Error updating post status:', error);
    res.status(500).json({ success: false, message: "Error updating post status" });
  }
};

// @desc Suspend/restore an account, or change its role
// @route PATCH /admin/users/:userId
// @access Private (Admin only)
//
// Same gap as listings: deletion was the only action, and deletion here purges
// every post, image, match row and notification the account ever had. Flipping
// `isActive` is the proportionate answer to a spammer, and it is a lever the
// auth layer already respects - /auth/refresh reloads the user from the database
// before minting, so a deactivation takes hold within one access-token lifetime
// rather than at that session's convenience.
const updateUserAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive, role } = req.body;
    const adminId = req.user;

    if (isActive === undefined && role === undefined) {
      return res.status(400).json({
        success: false,
        message: "Nothing to update. Provide isActive and/or role.",
      });
    }

    const validRoles = ['user', 'moderator', 'admin'];
    if (role !== undefined && !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be one of: " + validRoles.join(', '),
      });
    }

    const user = await User.findById(userId).select('username email role isActive');
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // An admin cannot demote or deactivate themselves. Not a policy nicety:
    // this is the route that decides who can reach this route, and the panel is
    // reachable only by an admin, so a self-demotion locks the last admin out of
    // the system with no way back in through the UI.
    if (String(userId) === String(adminId)) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own role or status",
      });
    }

    // Another admin's account is left alone for the same reason deleteUserAdmin
    // refuses one: admins are peers here, and there is no confirmation step
    // between this call and losing access to the panel.
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: "Cannot modify other admin accounts",
      });
    }

    const changes = {};
    if (isActive !== undefined) {
      changes.isActive = { from: user.isActive, to: Boolean(isActive) };
      user.isActive = Boolean(isActive);
    }
    if (role !== undefined) {
      // Promotion to admin is deliberately not available from here - it is the
      // one change that cannot be undone through this same route afterwards.
      if (role === 'admin') {
        return res.status(403).json({
          success: false,
          message: "Promoting an account to admin is not available from the panel",
        });
      }
      changes.role = { from: user.role, to: role };
      user.role = role;
    }
    await user.save();

    scheduleAdminAction({
      actorId: adminId,
      action: changes.role ? 'user.role' : (user.isActive ? 'user.activate' : 'user.deactivate'),
      targetType: 'user',
      targetId: user._id,
      targetLabel: user.username,
      meta: changes,
    });

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: { _id: user._id, username: user.username, role: user.role, isActive: user.isActive },
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: "Error updating user" });
  }
};

// @desc List site comments for moderation
// @route GET /admin/comments
// @access Private (Admin only)
//
// Comments have been reportable since the thread feature shipped, and those
// reports land in the same queue as listing reports - but there was no way to
// look at the comments themselves, only at whichever ones somebody had already
// objected to.
const getAdminComments = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const skip = (page - 1) * limit;
    const search = (req.query.search || '').trim();

    const filter = {};
    if (req.query.status === 'active' || req.query.status === 'removed') {
      filter.status = req.query.status;
    }
    if (search) {
      // Escaped, unlike the listing routes' own `?search=` - a moderation
      // filter is not a place to hand a regex engine raw input.
      filter.text = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    }

    const [comments, total] = await Promise.all([
      Comment.find(filter)
        .populate('user', 'username email')
        .populate('post', '_id description')
        .populate('removedBy', 'username')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Comment.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        comments: comments.map((comment) => ({
          ...comment,
          postLabel: postLabel(comment.post),
        })),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit) || 1,
          totalComments: total,
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ success: false, message: "Error fetching comments" });
  }
};

// @desc Take a comment down, or put it back
// @route PATCH /admin/comments/:id
// @access Private (Admin only)
//
// Soft, like every other comment removal in this app: the row survives with its
// text intact so a report filed against it stays judgeable after the fact. A
// hard delete would let someone post something abusive, have it removed, and
// leave nothing for the next moderator to see.
const updateCommentAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const adminId = req.user;

    if (status !== 'active' && status !== 'removed') {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be one of: active, removed",
      });
    }

    const comment = await Comment.findById(id).populate('user', 'username');
    if (!comment) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }

    comment.status = status;
    comment.removedBy = status === 'removed' ? adminId : null;
    comment.removedAt = status === 'removed' ? new Date() : null;
    await comment.save();

    scheduleAdminAction({
      actorId: adminId,
      action: status === 'removed' ? 'comment.remove' : 'comment.restore',
      targetType: 'comment',
      targetId: comment._id,
      targetLabel: comment.text,
      meta: { author: comment.user?.username || null, post: String(comment.post) },
    });

    res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      data: { _id: comment._id, status: comment.status },
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ success: false, message: "Error updating comment" });
  }
};

// @desc Get visitor statistics (Admin only)
// @route GET /admin/visitor-stats
// @access Private (Admin only)
// @query startDate - Start date for statistics (ISO string, optional)
// @query endDate - End date for statistics (ISO string, optional)
const getVisitorStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Get statistics with optional date range
    const stats = await Visitor.getStats(startDate || null, endDate || null);

    res.status(200).json({
      success: true,
      data: {
        statistics: stats
      }
    });
  } catch (error) {
    console.error('Error fetching visitor stats:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching visitor statistics",
    });
  }
};

module.exports = {
  getAllReports,
  getAllPromotions,
  updateReportStatus,
  updatePromotionStatus,
  deletePost,
  getAllPasswordResetRequests,
  updatePasswordResetRequestStatus,
  getAllUsersAdmin,
  getUserPosts,
  adminResetUserPassword,
  deleteUserAdmin,
  getAllPostsAdmin,
  getVisitorStats,
  updatePostStatusAdmin,
  updateUserAdmin,
  getAdminComments,
  updateCommentAdmin,
  postLabel,
};
