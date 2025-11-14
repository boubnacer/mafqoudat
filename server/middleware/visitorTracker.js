const Visitor = require('../models/Visitor');
const { v4: uuidv4 } = require('uuid');

// Cookie lifetime: 24 hours (user needs to close browser and wait 24h for new visit)
const COOKIE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Visitor tracking middleware
 * Tracks one visit per browser session.
 * 
 * A session is defined by a cookie that lasts 24 hours.
 * Each session counts as exactly 1 visit, regardless of how many pages are viewed.
 * When the user refreshes the page, it's still the same session (same cookie).
 * A new visit is counted when the cookie expires (24h) or browser is closed and reopened.
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

    // Only track HTML page requests (initial page loads, not API calls)
    const acceptHeader = req.get('Accept') || '';
    const isHtmlRequest = acceptHeader.includes('text/html');
    
    // Also check if this is a navigation request (not an XHR/fetch)
    const isNavigation = !req.get('X-Requested-With') && 
                         req.get('Sec-Fetch-Dest') !== 'empty' &&
                         req.get('Sec-Fetch-Mode') !== 'cors';
    
    if (!isHtmlRequest && !isNavigation) {
      return next();
    }

    // Get session ID from cookie
    let sessionId = req.cookies?.visitorSession;

    // If no cookie exists, this might be a new session
    if (!sessionId) {
      sessionId = uuidv4();
      
      // Set cookie with 24 hour expiration
      res.cookie('visitorSession', sessionId, {
        maxAge: COOKIE_MAX_AGE,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      });
    } else {
      // Cookie exists - refresh it to extend the session
      res.cookie('visitorSession', sessionId, {
        maxAge: COOKIE_MAX_AGE,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      });
    }

    // Check if this session has already been counted in the database
    // Use findOneAndUpdate with upsert to prevent race conditions
    const existingVisit = await Visitor.findOne({ sessionId });
    
    if (!existingVisit) {
      // This is a new session that hasn't been counted yet
      // Use findOneAndUpdate with upsert to prevent duplicate inserts from race conditions
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

      // Use findOneAndUpdate with upsert to atomically create or skip
      // This prevents race conditions where multiple requests try to create the same session
      await Visitor.findOneAndUpdate(
        { sessionId },
        visitorData,
        { 
          upsert: true,
          setDefaultsOnInsert: true,
          new: true
        }
      ).catch(err => {
        // If it's a duplicate key error, that's okay - another request already created it
        if (err.code !== 11000) {
          console.error('❌ Visitor Tracker: Error saving visitor data:', err);
        }
      });
    }
    // If existingVisit exists, do nothing - session already counted

  } catch (error) {
    // Don't let visitor tracking errors affect the main request
    console.error('❌ Visitor Tracker: Error in visitor tracking:', error);
  }
  
  next();
};

module.exports = visitorTracker;

