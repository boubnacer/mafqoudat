const User = require("../models/User");
const Post = require("../models/Post");
const FoundLost = require("../models/FoundLost");
const Category = require("../models/Category");
const Country = require("../models/Country");

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
      .populate('city', 'labels.en')
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


    // Update post to mark promotion requested
    await Post.findByIdAndUpdate(postId, {
      promotionRequested: true,
      promotionRequestedAt: new Date()
    });

    // Return success response
    res.status(200).json({
      success: true,
      message: "Promotion request submitted successfully"
    });

  } catch (error) {
    console.error('Error requesting promotion:', error);
    res.status(500).json({ 
      success: false,
      message: "Error processing promotion request",
      error: error.message 
    });
  }
};

module.exports = {
  requestPromotion
};
