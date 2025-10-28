const Visitor = require('../models/Visitor');
const { v4: uuidv4 } = require('uuid');

/**
 * Visitor tracking middleware
 * Tracks unique visitors and page views
 */
const visitorTracker = async (req, res, next) => {
  try {
    // Skip tracking for API routes and system endpoints
    const skipPaths = [
      '/api/',
      '/admin/',
      '/system-settings',
      '/countries',
      '/floptions',
      '/categories',
      '/users',
      '/health',
      '/favicon.ico',
      '/robots.txt',
      '/sitemap.xml',
      '/_headers',
      '/_redirects'
    ];

    // Skip if it's an API route or system endpoint
    if (skipPaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    // Skip tracking for static assets
    if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
      return next();
    }

    // Only track main page visits (not individual page navigations)
    // This will track when someone first visits the site
    const isMainPageVisit = req.path === '/' || 
                           req.path === '/dash' || 
                           req.path.startsWith('/dash/') ||
                           req.path === '/login' ||
                           req.path === '/register' ||
                           req.path === '/blog' ||
                           req.path === '/help';

    if (!isMainPageVisit) {
      return next();
    }

    console.log('🔍 Visitor Tracker: Tracking visit to', req.path);

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
      Visitor.create(visitorData).then(() => {
        console.log('✅ Visitor saved:', { country: visitorData.country, path: visitorData.path });
      }).catch(err => {
        console.error('❌ Error saving visitor data:', err);
      });
    }
  } catch (error) {
    // Don't let visitor tracking errors affect the main request
    console.error('Visitor tracking error:', error);
  }
  
  next();
};

module.exports = visitorTracker;
