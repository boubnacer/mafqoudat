const PasswordResetRequest = require("../models/PasswordResetRequest");

// @desc Submit a password reset request
// @route POST /api/password-reset/request
// @access Public
const submitPasswordResetRequest = async (req, res) => {
  try {
    const { contactInfo } = req.body;

    // Validate contact info
    if (!contactInfo || !contactInfo.trim()) {
      return res.status(400).json({
        success: false,
        message: "Contact information (phone number or email) is required",
      });
    }

    // Get IP address from request
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Create password reset request
    const resetRequest = await PasswordResetRequest.create({
      contactInfo: contactInfo.trim(),
      ipAddress,
    });

    res.status(201).json({
      success: true,
      message: "Password reset request submitted successfully",
      data: {
        requestId: resetRequest._id,
        createdAt: resetRequest.createdAt,
      },
    });
  } catch (error) {
    console.error('Error submitting password reset request:', error);
    res.status(500).json({
      success: false,
      message: "Error submitting password reset request",
      error: error.message,
    });
  }
};

module.exports = {
  submitPasswordResetRequest,
};

