const Visitor = require('../models/Visitor');
const { v4: uuidv4 } = require('uuid');

/**
 * Visitor tracking middleware
 * Tracks unique visitors and page views
 */
const visitorTracker = async (req, res, next) => {
  try {
    // Only track main site entry points - not individual pages
    const allowedPaths = [
      '/dash',
      '/'
    ];

    // Check if this is a main entry point
    const isMainEntry = allowedPaths.some(path => {
      if (path === '/dash') {
        return req.path === '/dash';
      }
      if (path === '/') {
        return req.path === '/' || req.path === '';
      }
      return false;
    });

    // Skip if not a main entry point
    if (!isMainEntry) {
      return next();
    }

    // Skip tracking for static assets
    if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
      return next();
    }

    const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    const country = req.headers['cf-ipcountry'] || 'Unknown';
    const city = req.headers['cf-ipcity'] || 'Unknown';
    
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

    // Check if this session has already been counted today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingVisit = await Visitor.findOne({
      sessionId,
      visitedAt: { $gte: today }
    });

    // Only track if this is a new session today
    if (!existingVisit) {
      const visitorData = {
        ip,
        userAgent,
        country,
        city,
        referer: req.get('Referer') || 'Direct',
        path: '/dash', // Always record as main site visit
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
