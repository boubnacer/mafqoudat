const PasswordResetRequest = require("../models/PasswordResetRequest");
const User = require("../models/User");

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

    const trimmedContact = contactInfo.trim();

    const user = await User.findOne({
      $or: [
        { email: trimmedContact },
        { phone: trimmedContact }
      ]
    }).lean();

    const genericResponse = {
      success: true,
      message: "If an account exists with this contact information, a reset request has been submitted.",
    };

    if (!user) {
      return res.status(200).json(genericResponse);
    }

    // Get IP address from request
    const ipAddress = req.ip || req.connection.remoteAddress;

    // Create password reset request
    await PasswordResetRequest.create({
      contactInfo: trimmedContact,
      ipAddress,
    });

    res.status(200).json(genericResponse);
  } catch (error) {
    console.error('Error submitting password reset request:', error);

    res.status(500).json({
      success: false,
      message: "Error submitting password reset request",
    });
  }
};

module.exports = {
  submitPasswordResetRequest,
};
