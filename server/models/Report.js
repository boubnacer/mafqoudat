const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Post",
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null for anonymous reports
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    reasonType: {
      type: String,
      enum: [
        'inappropriate_content',
        'spam_fake',
        'duplicate',
        'wrong_category',
        'suspicious_activity',
        'personal_info',
        'other'
      ],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
      default: 'pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    adminNotes: {
      type: String,
      default: "",
      trim: true,
    },
    // Store post data at time of report for reference
    postData: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      category: String,
      country: String,
      city: String,
      exactLocation: String,
      contact: String,
      createdAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
reportSchema.index({ postId: 1, status: 1 });
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ reportedBy: 1, createdAt: -1 });
reportSchema.index({ reviewedBy: 1, reviewedAt: -1 });

// Compound index for admin queries
reportSchema.index({ status: 1, reasonType: 1, createdAt: -1 });

module.exports = mongoose.model("Report", reportSchema);
