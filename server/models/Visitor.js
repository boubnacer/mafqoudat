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
    // Parse the ISO date strings directly - they're already in UTC
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Ensure we're using the exact dates provided (they should already be at correct times)
    // Don't modify hours since the frontend sends UTC dates with correct times
    monthVisitorsQuery = { visitedAt: { $gte: start, $lte: end } };
    
    // Log for debugging
    console.log('📊 [VISITOR-MODEL] Using date range query:', {
      startDateInput: startDate,
      endDateInput: endDate,
      startParsed: start.toISOString(),
      endParsed: end.toISOString(),
      startLocal: start.toLocaleString(),
      endLocal: end.toLocaleString(),
      query: monthVisitorsQuery,
      countResult: 'will be calculated'
    });
  } else {
    console.log('📊 [VISITOR-MODEL] Using default month query (no date range provided)');
  }
  
  // Get first visit date (earliest visitedAt)
  const firstVisit = await this.findOne().sort({ visitedAt: 1 }).select('visitedAt').lean();
  const firstVisitDate = firstVisit ? firstVisit.visitedAt : null;
  
  // First, let's verify the query is correct by checking a sample
  if (startDate && endDate) {
    const sampleDocs = await this.find(monthVisitorsQuery).limit(5).select('visitedAt').lean();
    console.log('📊 [VISITOR-MODEL] Sample documents in range:', {
      count: sampleDocs.length,
      dates: sampleDocs.map(d => d.visitedAt.toISOString()),
      query: monthVisitorsQuery
    });
  }

  const [totalVisitors, todayVisitors, monthVisitors] = await Promise.all([
    this.countDocuments(),
    this.countDocuments({ visitedAt: { $gte: startOfDay } }),
    this.countDocuments(monthVisitorsQuery)
  ]);
  
  // Log the actual count result for debugging
  if (startDate && endDate) {
    console.log('📊 [VISITOR-MODEL] Query result:', {
      monthVisitors,
      query: monthVisitorsQuery,
      dateRange: {
        start: new Date(startDate).toISOString(),
        end: new Date(endDate).toISOString()
      },
      startDateParsed: new Date(startDate).toISOString(),
      endDateParsed: new Date(endDate).toISOString()
    });
  }

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

