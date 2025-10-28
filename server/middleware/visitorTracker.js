const Visitor = require('../models/Visitor');
const { v4: uuidv4 } = require('uuid');

/**
 * Visitor tracking middleware
 * Tracks unique visitors and page views
 */
const visitorTracker = async (req, res, next) => {
  try {
    // Skip tracking for certain paths
    const skipPaths = [
      '/api/visitor-stats',
      '/api/admin/visitor-stats',
      '/favicon.ico',
      '/robots.txt',
      '/sitemap.xml',
      '/_headers',
      '/_redirects'
    ];
    
    if (skipPaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    // Skip tracking for API routes that don't need visitor tracking
    if (req.path.startsWith('/api/') && !req.path.startsWith('/api/posts') && !req.path.startsWith('/api/countries')) {
      return next();
    }

    // Skip tracking for static assets
    if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
      return next();
    }

    const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    const referer = req.get('Referer') || 'Direct';
    const path = req.originalUrl || req.url;
    
    // Generate or get session ID from cookies
    let sessionId = req.cookies?.visitorSession;
    if (!sessionId) {
      sessionId = uuidv4();
      // Set cookie for 24 hours
      res.cookie('visitorSession', sessionId, { 
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    }

    // Check if this is a unique visit for this session today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingVisit = await Visitor.findOne({
      sessionId,
      path,
      visitedAt: { $gte: today }
    });

    // Only track if it's a new visit for this session today
    if (!existingVisit) {
      const visitorData = {
        ip,
        userAgent,
        country: req.headers['cf-ipcountry'] || 'Unknown',
        city: req.headers['cf-ipcity'] || 'Unknown',
        referer,
        path,
        sessionId,
        isUnique: true
      };

      // Save visitor data asynchronously (don't wait for it)
      Visitor.create(visitorData).catch(err => {
        console.error('Error saving visitor data:', err);
      });
    }
  } catch (error) {
    // Don't let visitor tracking errors affect the main request
    console.error('Visitor tracking error:', error);
  }
  
  next();
};

module.exports = visitorTracker;
