const User = require("../models/User");

const verifyAdmin = async (req, res, next) => {
  try {
    // Get user ID from JWT token (set by verifyJWT middleware)
    const userId = req.user;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID not found in token",
      });
    }

    // Find user and check role
    const user = await User.findById(userId).select('role username').lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    // Add user info to request for use in controllers
    req.adminUser = {
      id: user._id,
      username: user.username,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error('Admin verification error:', error);
    res.status(500).json({
      success: false,
      message: "Error verifying admin privileges",
      error: error.message,
    });
  }
};

module.exports = verifyAdmin;
