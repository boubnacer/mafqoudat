const mongoose = require("mongoose");
const { FIELD_LIMITS } = require("../config/fieldLimits");

const reportSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Post",
    },
    // Set when what was reported is a comment on that post rather than the
    // listing itself, so both kinds land in one admin queue instead of two.
    // Absent on a report about the listing - which is every report predating
    // comments existing at all.
    commentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
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
      maxlength: [
        FIELD_LIMITS.report.reason,
        `Reason cannot exceed ${FIELD_LIMITS.report.reason} characters`,
      ],
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
      maxlength: [
        FIELD_LIMITS.report.adminNotes,
        `Admin notes cannot exceed ${FIELD_LIMITS.report.adminNotes} characters`,
      ],
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
