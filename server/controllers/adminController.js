const Report = require("../models/Report");
const Post = require("../models/Post");
const User = require("../models/User");
const Category = require("../models/Category");
const Country = require("../models/Country");
const FoundLost = require("../models/FoundLost");
const City = require("../models/City");

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
      .populate('postId', '_id title description exactLocation contact createdAt status')
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
      .select('_id title description exactLocation contact createdAt promotionRequested promotionRequestedAt promotionProcessed promotionProcessedAt')
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
      .populate('postId', 'title description exactLocation contact createdAt status')
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
      recentReports,
      recentPromotions,
    ] = await Promise.all([
      Report.countDocuments(),
      Report.countDocuments({ status: 'pending' }),
      Post.countDocuments({ promotionRequested: true }),
      Post.countDocuments({ promotionRequested: true, promotionProcessed: false }),
      Post.countDocuments(),
      User.countDocuments(),
      Report.find({ status: 'pending' })
        .populate('postId', 'title description')
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
        },
        recentReports,
        recentPromotions,
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
          title: post.title,
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

module.exports = {
  getAllReports,
  getAllPromotions,
  updateReportStatus,
  updatePromotionStatus,
  getAdminDashboard,
  deletePost,
};
