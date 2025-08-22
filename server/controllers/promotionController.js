const User = require("../models/User");
const Post = require("../models/Post");
const FoundLost = require("../models/FoundLost");
const Category = require("../models/Category");
const Country = require("../models/Country");
const emailNotification = require("../utils/emailNotification");

// @desc Request promotion for a lost item
// @route POST /promotion/request
// @access Private
const requestPromotion = async (req, res) => {
  try {
    const { postId, userContact, itemDescription } = req.body;
    const userId = req.user;

    // Validate required fields
    if (!postId) {
      return res.status(400).json({ message: "Post ID is required" });
    }

    // Find the post with populated category and country data
    const post = await Post.findById(postId)
      .populate('category', 'labels.en code')
      .populate('country', 'labels.en code names.en')
      .populate('foundLost', 'code')
      .lean();
      
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.user.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to promote this post" });
    }

    // Check if this is a lost item
    if (!post.foundLost || post.foundLost.code.toLowerCase() !== 'lost') {
      return res.status(400).json({ message: "Promotion is only available for lost items" });
    }

    // Get user data
    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prepare notification data with resolved names
    const notificationData = {
      postId: post._id,
      contact: userContact || post.contact,
      category: post.category?.labels?.en || post.category?.code || 'Unknown Category',
      region: post.region || 'Unknown',
      city: post.city || 'Unknown',
      country: post.country?.labels?.en || post.country?.names?.en || post.country?.code || 'Unknown Country',
      foundLost: post.foundLost.code,
      itemDescription: itemDescription || 'No additional description provided',
      postLink: `${process.env.CLIENT_URL || 'http://localhost:3000'}/dash/posts/${post._id}`
    };

    // Send email notification
    console.log('Sending email notification with data:', notificationData);
    const notificationResult = await emailNotification.sendNotification(notificationData, user);
    console.log('Email notification result:', notificationResult);

    // Update post to mark promotion requested
    await Post.findByIdAndUpdate(postId, {
      promotionRequested: true,
      promotionRequestedAt: new Date()
    });

    res.status(200).json({
      message: "Promotion request submitted successfully",
      notificationSent: notificationResult.success,
      message: "We'll contact you soon to process your promotion request"
    });

  } catch (error) {
    console.error('Error requesting promotion:', error);
    res.status(500).json({ 
      message: "Error processing promotion request",
      error: error.message 
    });
  }
};

module.exports = {
  requestPromotion
};
