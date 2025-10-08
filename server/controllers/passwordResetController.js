const PasswordResetRequest = require("../models/PasswordResetRequest");
const User = require("../models/User");

// @desc Submit a password reset request
// @route POST /api/password-reset/request
// @access Public
const submitPasswordResetRequest = async (req, res) => {
  console.log('\n=== PASSWORD RESET REQUEST ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Full URL:', req.protocol + '://' + req.get('host') + req.originalUrl);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { contactInfo } = req.body;

    console.log('Extracted contactInfo:', contactInfo);

    // Validate contact info
    if (!contactInfo || !contactInfo.trim()) {
      console.log('❌ Validation failed: No contact info provided');
      return res.status(400).json({
        success: false,
        message: "Contact information (phone number or email) is required",
      });
    }

    console.log('✅ Validation passed');

    // Check if user exists with this email or phone
    console.log('Checking if user exists with:', contactInfo.trim());
    const trimmedContact = contactInfo.trim();
    
    // Check if it's an email or phone
    const isEmail = trimmedContact.includes('@');
    const user = await User.findOne({
      $or: [
        { email: trimmedContact },
        { phone: trimmedContact }
      ]
    }).lean();

    if (!user) {
      console.log('❌ User not found with contact info:', trimmedContact);
      return res.status(404).json({
        success: false,
        message: "User not found with this email or phone number",
      });
    }

    console.log('✅ User found:', user.username);

    // Get IP address from request
    const ipAddress = req.ip || req.connection.remoteAddress;
    console.log('Client IP:', ipAddress);

    // Create password reset request
    console.log('Creating password reset request in database...');
    const resetRequest = await PasswordResetRequest.create({
      contactInfo: trimmedContact,
      ipAddress,
    });

    console.log('✅ Password reset request created:', resetRequest._id);
    console.log('=== REQUEST SUCCESSFUL ===\n');

    res.status(201).json({
      success: true,
      message: "Password reset request submitted successfully",
      data: {
        requestId: resetRequest._id,
        createdAt: resetRequest.createdAt,
      },
    });
  } catch (error) {
    console.error('❌ Error submitting password reset request:', error);
    console.error('Error stack:', error.stack);
    console.log('=== REQUEST FAILED ===\n');
    
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

