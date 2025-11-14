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
      '/posts', // Skip posts API endpoint
      '/contact',
      '/cities',
      '/cities-public',
      '/cities-api',
      '/promotion',
      '/dependencies',
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
    const isHtmlRequest = acceptHeader.includes('text/html') || acceptHeader.includes('*/*');
    
    // Skip if this is clearly an API/XHR request
    const isXhrRequest = req.get('X-Requested-With') === 'XMLHttpRequest' ||
                         req.get('Content-Type')?.includes('application/json') ||
                         (req.get('Sec-Fetch-Mode') === 'cors' && !isHtmlRequest);
    
    // Skip API/XHR requests
    if (isXhrRequest && !isHtmlRequest) {
      return next();
    }
    
    // Track if it's an HTML request or a navigation request
    if (!isHtmlRequest) {
      return next();
    }

    // Get session ID from cookie - check multiple ways cookies might be stored
    let sessionId = req.cookies?.visitorSession || 
                    req.signedCookies?.visitorSession ||
                    (req.headers.cookie && req.headers.cookie.match(/visitorSession=([^;]+)/)?.[1]);

    let isNewSession = false;

    // Debug: Log cookie status
    console.log('🔍 Visitor Tracker - Request:', {
      path: req.path,
      method: req.method,
      hasCookie: !!sessionId,
      cookieValue: sessionId?.substring(0, 8) + '...' || 'none',
      allCookies: Object.keys(req.cookies || {}),
      cookieHeader: req.headers.cookie ? 'present' : 'missing',
      host: req.get('host'),
      origin: req.get('origin')
    });

    // If no cookie exists, create a new session
    if (!sessionId) {
      sessionId = uuidv4();
      isNewSession = true;
      
      console.log('✅ Creating NEW session:', sessionId.substring(0, 8) + '...');
      
      // Set cookie with 24 hour expiration
      const cookieOptions = {
        maxAge: COOKIE_MAX_AGE,
        httpOnly: true,
        secure: true, // Always secure in production (HTTPS required)
        sameSite: 'none', // Changed to 'none' for cross-origin requests
        path: '/'
      };
      
      // For cross-origin cookies, we need sameSite: 'none' and secure: true
      // Don't set domain - let browser handle it based on the request origin
      
      res.cookie('visitorSession', sessionId, cookieOptions);
      console.log('🍪 Cookie SET:', {
        sessionId: sessionId.substring(0, 8) + '...',
        options: cookieOptions,
        responseHeaders: Object.keys(res.getHeaders())
      });
    } else {
      console.log('🔄 Existing session found:', sessionId.substring(0, 8) + '...');
      
      // Cookie exists - refresh it to extend the session
      const cookieOptions = {
        maxAge: COOKIE_MAX_AGE,
        httpOnly: true,
        secure: true, // Always secure in production (HTTPS required)
        sameSite: 'none', // Changed to 'none' for cross-origin requests
        path: '/'
      };
      
      res.cookie('visitorSession', sessionId, cookieOptions);
      console.log('🔄 Cookie REFRESHED:', {
        sessionId: sessionId.substring(0, 8) + '...'
      });
    }

    // Always check database first to see if this session was already counted
    const existingVisit = await Visitor.findOne({ sessionId });
    
    console.log('🔍 Database check:', {
      sessionId: sessionId?.substring(0, 8) + '...',
      existingVisit: !!existingVisit,
      existingVisitId: existingVisit?._id || 'none'
    });
    
    // Only create a new visit if this session doesn't exist in the database
    if (!existingVisit) {
      console.log('📝 Creating NEW visit record for session:', sessionId.substring(0, 8) + '...');
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

      // Create the visit record
      // Use create with error handling for duplicate key errors (race condition protection)
      try {
        const created = await Visitor.create(visitorData);
        console.log('✅ Visit record created successfully:', created._id);
      } catch (err) {
        // If it's a duplicate key error (E11000), another request already created it - that's fine
        if (err.code === 11000 || err.name === 'MongoServerError') {
          console.log('⚠️ Duplicate session detected (race condition) - already counted');
        } else {
          console.error('❌ Visitor Tracker: Error saving visitor data:', err);
        }
      }
    } else {
      console.log('⏭️ Session already counted - skipping visit creation');
    }

  } catch (error) {
    // Don't let visitor tracking errors affect the main request
    console.error('❌ Visitor Tracker: Error in visitor tracking:', error);
  }
  
  next();
};

module.exports = visitorTracker;


