const Report = require("../models/Report");
const Post = require("../models/Post");
const User = require("../models/User");
const Category = require("../models/Category");
const Country = require("../models/Country");
const FoundLost = require("../models/FoundLost");
const City = require("../models/City");
const PasswordResetRequest = require("../models/PasswordResetRequest");
const Visitor = require("../models/Visitor");
const bcrypt = require("bcrypt");
const { logEvents } = require("../middleware/logger");

// @desc Get all reports with pagination and filtering
// @route GET /admin/reports
// @access Private (Admin only)
const getAllReports = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
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

    // Get reports with populated data
    const reports = await Report.find(filter)
      .populate('postId', '_id description exactLocation contact createdAt status')
      .populate('reportedBy', 'username')
      .populate('reviewedBy', 'username')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalReports = await Report.countDocuments(filter);
    const totalPages = Math.ceil(totalReports / limit);

    res.status(200).json({
      success: true,
      data: {
        reports,
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
      error: error.message,
    });
  }
};

// @desc Get all promotion requests with pagination and filtering
// @route GET /admin/promotions
// @access Private (Admin only)
const getAllPromotions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
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
        promotions,
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
      error: error.message,
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
      error: error.message,
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
      error: error.message,
    });
  }
};

// @desc Get admin dashboard statistics
// @route GET /admin/dashboard
// @access Private (Admin only)
const getAdminDashboard = async (req, res) => {
  try {
    // Get various statistics
    const [
      totalReports,
      pendingReports,
      totalPromotions,
      pendingPromotions,
      totalPosts,
      totalUsers,
      totalResetRequests,
      pendingResetRequests,
      recentReports,
      recentPromotions,
      recentResetRequests,
    ] = await Promise.all([
      Report.countDocuments(),
      Report.countDocuments({ status: 'pending' }),
      Post.countDocuments({ promotionRequested: true }),
      Post.countDocuments({ promotionRequested: true, promotionProcessed: false }),
      Post.countDocuments(),
      User.countDocuments(),
      PasswordResetRequest.countDocuments(),
      PasswordResetRequest.countDocuments({ status: 'pending' }),
      Report.find({ status: 'pending' })
        .populate('postId', 'description')
        .populate('reportedBy', 'username')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Post.find({ promotionRequested: true, promotionProcessed: false })
        .populate('user', 'username')
        .populate('category', 'labels.en')
        .sort({ promotionRequestedAt: -1 })
        .limit(5)
        .lean(),
      PasswordResetRequest.find({ status: 'pending' })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        statistics: {
          totalReports,
          pendingReports,
          totalPromotions,
          pendingPromotions,
          totalPosts,
          totalUsers,
          totalResetRequests,
          pendingResetRequests,
        },
        recentReports,
        recentPromotions,
        recentResetRequests,
      },
    });
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching admin dashboard",
      error: error.message,
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

    // Also delete any reports related to this post
    await Report.deleteMany({ postId: id });

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
      error: error.message,
    });
  }
};

// @desc Get all password reset requests with pagination and filtering
// @route GET /admin/password-reset-requests
// @access Private (Admin only)
const getAllPasswordResetRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
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
      error: error.message,
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
      error: error.message,
    });
  }
};

// @desc Get all users with pagination, search, and sorting
// @route GET /admin/users
// @access Private (Admin only)
const getAllUsersAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
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
      error: error.message,
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
    const limit = parseInt(req.query.limit) || 10;
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
      error: error.message,
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
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    user.password = hashedPassword;
    await user.save();

    // Get admin info for logging
    const admin = await User.findById(adminId).select('username');

    // Log the password reset action
    await logEvents(
      `Admin ${admin?.username || adminId} reset password for user ${user.username} (ID: ${userId})`,
      'adminActions.log'
    );

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
      error: error.message,
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

    // Validate user exists
    const user = await User.findById(userId).select('username email role');
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

    // Count user's posts before deletion
    const postCount = await Post.countDocuments({ user: userId });

    // Delete all user's posts
    await Post.deleteMany({ user: userId });

    // Delete any reports created by the user
    await Report.deleteMany({ reportedBy: userId });

    // Delete the user
    await User.findByIdAndDelete(userId);

    // Get admin info for logging
    const admin = await User.findById(adminId).select('username');

    // Log the deletion action
    await logEvents(
      `Admin ${admin?.username || adminId} deleted user ${user.username} (ID: ${userId}) and ${postCount} posts`,
      'adminActions.log'
    );

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
      error: error.message,
    });
  }
};

// @desc Get all posts with pagination, search, and filtering
// @route GET /admin/posts
// @access Private (Admin only)
const getAllPostsAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
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
      error: error.message,
    });
  }
};

// @desc Get visitor statistics (Admin only)
// @route GET /admin/visitor-stats
// @access Private (Admin only)
const getVisitorStats = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    // Get basic statistics
    const stats = await Visitor.getStats();
    
    // Get trends for the specified number of days
    const trends = await Visitor.getTrends(parseInt(days));
    
    // Get top pages
    const topPages = await Visitor.aggregate([
      {
        $group: {
          _id: '$path',
          count: { $sum: 1 },
          uniqueVisitors: { $addToSet: '$sessionId' }
        }
      },
      {
        $project: {
          path: '$_id',
          count: 1,
          uniqueVisitors: { $size: '$uniqueVisitors' },
          _id: 0
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Get visitor countries
    const visitorCountries = await Visitor.aggregate([
      {
        $group: {
          _id: '$country',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        statistics: stats,
        trends,
        topPages,
        visitorCountries
      }
    });
  } catch (error) {
    console.error('Error fetching visitor stats:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching visitor statistics",
      error: error.message,
    });
  }
};

module.exports = {
  getAllReports,
  getAllPromotions,
  updateReportStatus,
  updatePromotionStatus,
  getAdminDashboard,
  deletePost,
  getAllPasswordResetRequests,
  updatePasswordResetRequestStatus,
  getAllUsersAdmin,
  getUserPosts,
  adminResetUserPassword,
  deleteUserAdmin,
  getAllPostsAdmin,
  getVisitorStats,
};
