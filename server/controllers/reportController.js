const Report = require("../models/Report");
const Post = require("../models/Post");

// @desc Create a new report
// @route POST /reports
// @access Private
const createReport = async (req, res) => {
  try {
    const { postLink, message, contact } = req.body;

    // Validate required fields
    if (!postLink) {
      return res.status(400).json({ 
        success: false,
        message: "Post link is required" 
      });
    }

    // Verify the post exists
    const post = await Post.findById(postLink);
    if (!post) {
      return res.status(404).json({ 
        success: false,
        message: "Post not found" 
      });
    }

    // Create the report
    const report = await Report.create({
      postLink,
      message: message || "",
      contact: contact || ""
    });

    // Update the post to mark it as reported
    post.reported = true;
    post.reportedTxt = message || "";
    await post.save();

    res.status(201).json({
      success: true,
      message: "Report submitted successfully",
      data: {
        _id: report._id,
        postLink: report.postLink,
        message: report.message,
        contact: report.contact,
        createdAt: report.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to create report",
      error: error.message 
    });
  }
};

// @desc Get all reports
// @route GET /reports
// @access Private (Admin only)
const getAllReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('postLink', 'region contact createdAt')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    if (!reports.length) {
      return res.status(200).json({
        success: true,
        data: [],
        total: 0
      });
    }

    res.json({
      success: true,
      data: reports,
      total: reports.length
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch reports",
      error: error.message 
    });
  }
};

// @desc Get report by ID
// @route GET /reports/:id
// @access Private (Admin only)
const getReportById = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await Report.findById(id)
      .populate('postLink', 'region contact createdAt user category foundLost')
      .lean()
      .exec();

    if (!report) {
      return res.status(404).json({ 
        success: false,
        message: "Report not found" 
      });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch report",
      error: error.message 
    });
  }
};

// @desc Delete a report
// @route DELETE /reports/:id
// @access Private (Admin only)
const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ 
        success: false,
        message: "Report not found" 
      });
    }

    await report.deleteOne();

    res.json({
      success: true,
      message: "Report deleted successfully"
    });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to delete report",
      error: error.message 
    });
  }
};

module.exports = {
  createReport,
  getAllReports,
  getReportById,
  deleteReport
}; 