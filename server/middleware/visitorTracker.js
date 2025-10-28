const Visitor = require('../models/Visitor');
const { v4: uuidv4 } = require('uuid');

/**
 * Visitor tracking middleware
 * Tracks unique visitors and page views
 */
const visitorTracker = async (req, res, next) => {
  try {
    // Only track actual page visits - be very strict about what we track
    const allowedPaths = [
      '/dash',
      '/dash/posts',
      '/dash/posts/new',
      '/dash/posts/edit',
      '/dash/admin',
      '/dash/myposts',
      '/dash/profile',
      '/dash/users',
      '/dash/dependencies',
      '/blog',
      '/help',
      '/login',
      '/register',
      '/forgot-password',
      '/reset-password'
    ];

    // Check if this is an allowed path
    const isAllowedPath = allowedPaths.some(path => {
      if (path === '/dash') {
        return req.path === '/dash' || req.path === '/';
      }
      return req.path.startsWith(path);
    });

    // Skip if not an allowed path
    if (!isAllowedPath) {
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
