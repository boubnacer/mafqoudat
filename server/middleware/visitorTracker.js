const Visitor = require('../models/Visitor');
const { v4: uuidv4 } = require('uuid');

/**
 * Visitor tracking middleware
 * Tracks one visit per browser session.
 * 
 * A session is defined as a browser session (cookie expires when browser closes).
 * Each session counts as exactly 1 visit, regardless of how many pages are viewed.
 * When the user refreshes or returns later, a new session starts = new visit.
 */
const visitorTracker = async (req, res, next) => {
  try {
    // Skip non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip API routes, admin routes, and static assets
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

    if (skipPaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    // Skip static assets
    if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|map)$/)) {
      return next();
    }

    // Only track HTML page requests
    const acceptHeader = req.get('Accept') || '';
    if (!acceptHeader.includes('text/html') && !acceptHeader.includes('*/*')) {
      return next();
    }

    // Get session ID from cookie, or create a new one
    let sessionId = req.cookies?.visitorSession;
    let isNewSession = false;

    if (!sessionId) {
      // No cookie = new session
      sessionId = uuidv4();
      isNewSession = true;
      
      // Set session cookie (no maxAge = session cookie, expires when browser closes)
      res.cookie('visitorSession', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    }

    // Always check database to see if this session has already been counted
    // This prevents double-counting if cookie wasn't sent or was cleared
    const existingVisit = await Visitor.findOne({ sessionId });
    
    if (existingVisit) {
      // This session was already counted - don't count again
      // If cookie is missing, restore it to maintain the session
      if (!req.cookies?.visitorSession) {
        res.cookie('visitorSession', sessionId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        });
      }
    } else {
      // This is a new session that hasn't been counted yet
      // Record this new visit
      const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                 req.ip ||
                 req.connection?.remoteAddress ||
                 req.socket?.remoteAddress ||
                 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';
      const country = req.headers['cf-ipcountry'] || 
                     req.headers['x-vercel-ip-country'] || 
                     'Unknown';
      const city = req.headers['cf-ipcity'] || 
                  req.headers['x-vercel-ip-city'] || 
                  'Unknown';
      const firstPage = req.path || '/';

      const visitorData = {
        sessionId,
        ip,
        userAgent,
        country,
        city,
        firstPage,
        visitedAt: new Date()
      };

      // Save visitor data asynchronously (don't block the request)
      Visitor.create(visitorData).catch(err => {
        console.error('❌ Visitor Tracker: Error saving visitor data:', err);
      });
    }

  } catch (error) {
    // Don't let visitor tracking errors affect the main request
    console.error('❌ Visitor Tracker: Error in visitor tracking:', error);
  }
  
  next();
};

module.exports = visitorTracker;

