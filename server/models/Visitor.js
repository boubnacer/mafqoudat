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
visitorSchema.statics.getStats = async function() {
  const now = new Date();
  
  // Get start of today (00:00:00)
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Get start of this month (1st day at 00:00:00)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const [totalVisitors, todayVisitors, monthVisitors] = await Promise.all([
    this.countDocuments(),
    this.countDocuments({ visitedAt: { $gte: startOfDay } }),
    this.countDocuments({ visitedAt: { $gte: startOfMonth } })
  ]);

  return {
    total: totalVisitors,
    today: todayVisitors,
    thisMonth: monthVisitors
  };
};

// Static method to get visitor trends
visitorSchema.statics.getTrends = async function(days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const trends = await this.aggregate([
    {
      $match: {
        visitedAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$visitedAt" }
        },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        date: "$_id",
        count: 1,
        _id: 0
      }
    },
    {
      $sort: { date: 1 }
    }
  ]);

  return trends;
};

// Static method to get visitor countries
visitorSchema.statics.getVisitorCountries = async function() {
  const countries = await this.aggregate([
    {
      $group: {
        _id: '$country',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: 10
    }
  ]);

  return countries;
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

