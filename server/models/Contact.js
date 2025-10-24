const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    maxlength: [100, "Name cannot exceed 100 characters"]
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    trim: true,
    lowercase: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      "Please provide a valid email address"
    ]
  },
  subject: {
    type: String,
    required: [true, "Subject is required"],
    trim: true,
    maxlength: [200, "Subject cannot exceed 200 characters"]
  },
  message: {
    type: String,
    required: [true, "Message is required"],
    trim: true,
    maxlength: [2000, "Message cannot exceed 2000 characters"]
  },
  status: {
    type: String,
    enum: ["new", "in_progress", "resolved", "closed"],
    default: "new"
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high", "urgent"],
    default: "medium"
  },
  ipAddress: {
    type: String,
    required: false
  },
  userAgent: {
    type: String,
    required: false
  },
  language: {
    type: String,
    default: "en"
  },
  country: {
    type: String,
    required: false
  },
  response: {
    type: String,
    required: false,
    maxlength: [2000, "Response cannot exceed 2000 characters"]
  },
  respondedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false
  },
  respondedAt: {
    type: Date,
    required: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better query performance
contactSchema.index({ email: 1, createdAt: -1 });
contactSchema.index({ status: 1, createdAt: -1 });
contactSchema.index({ priority: 1, createdAt: -1 });

// Virtual for formatted date
contactSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString();
});

// Pre-save middleware to set priority based on subject keywords
contactSchema.pre('save', function(next) {
  if (this.isNew) {
    const urgentKeywords = ['urgent', 'emergency', 'critical', 'asap', 'immediately'];
    const highKeywords = ['important', 'priority', 'help', 'support', 'issue'];
    
    const subjectLower = this.subject.toLowerCase();
    const messageLower = this.message.toLowerCase();
    
    if (urgentKeywords.some(keyword => 
      subjectLower.includes(keyword) || messageLower.includes(keyword)
    )) {
      this.priority = 'urgent';
    } else if (highKeywords.some(keyword => 
      subjectLower.includes(keyword) || messageLower.includes(keyword)
    )) {
      this.priority = 'high';
    }
  }
  next();
});

// Static method to get contact statistics
contactSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        new: { $sum: { $cond: [{ $eq: ["$status", "new"] }, 1, 0] } },
        inProgress: { $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] } },
        resolved: { $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] } },
        closed: { $sum: { $cond: [{ $eq: ["$status", "closed"] }, 1, 0] } },
        urgent: { $sum: { $cond: [{ $eq: ["$priority", "urgent"] }, 1, 0] } },
        high: { $sum: { $cond: [{ $eq: ["$priority", "high"] }, 1, 0] } }
      }
    }
  ]);
  
  return stats[0] || {
    total: 0,
    new: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    urgent: 0,
    high: 0
  };
};

module.exports = mongoose.model("Contact", contactSchema);
