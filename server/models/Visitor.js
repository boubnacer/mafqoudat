const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  ip: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  country: {
    type: String,
    default: 'Unknown'
  },
  city: {
    type: String,
    default: 'Unknown'
  },
  firstPage: {
    type: String,
    required: true
  },
  visitedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
visitorSchema.index({ visitedAt: -1 });
visitorSchema.index({ sessionId: 1 });

// Static method to get visitor statistics
visitorSchema.statics.getStats = async function(startDate = null, endDate = null) {
  const now = new Date();
  
  // Get start of today (00:00:00)
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Get start of this month (1st day at 00:00:00)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // If date range is provided, use it for the month visitors count
  let monthVisitorsQuery = { visitedAt: { $gte: startOfMonth } };
  if (startDate && endDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    monthVisitorsQuery = { visitedAt: { $gte: start, $lte: end } };
    
    // Log for debugging
    console.log('📊 [VISITOR-MODEL] Using date range query:', {
      startDate: startDate,
      endDate: endDate,
      start: start.toISOString(),
      end: end.toISOString(),
      query: monthVisitorsQuery
    });
  } else {
    console.log('📊 [VISITOR-MODEL] Using default month query (no date range provided)');
  }
  
  // Get first visit date (earliest visitedAt)
  const firstVisit = await this.findOne().sort({ visitedAt: 1 }).select('visitedAt').lean();
  const firstVisitDate = firstVisit ? firstVisit.visitedAt : null;
  
  const [totalVisitors, todayVisitors, monthVisitors] = await Promise.all([
    this.countDocuments(),
    this.countDocuments({ visitedAt: { $gte: startOfDay } }),
    this.countDocuments(monthVisitorsQuery)
  ]);

  return {
    total: totalVisitors,
    today: todayVisitors,
    thisMonth: monthVisitors,
    startDate: startDate ? new Date(startDate) : startOfMonth,
    endDate: endDate ? new Date(endDate) : now,
    firstVisitDate: firstVisitDate
  };
};

// Static method to clean old visitor data (older than 90 days)
visitorSchema.statics.cleanupOldData = async function() {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90);
  
  const result = await this.deleteMany({
    visitedAt: { $lt: cutoffDate }
  });
  
  return result.deletedCount;
};

module.exports = mongoose.model('Visitor', visitorSchema);

