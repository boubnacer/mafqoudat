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
    // Note: In a React SPA, page routes like /posts, /dash are valid and should be tracked
    // We only skip actual API endpoints, not page routes
    const skipPaths = [
      '/api/',
      '/admin/',
      '/system-settings',
      '/health',
      '/favicon.ico',
      '/robots.txt',
      '/sitemap.xml',
      '/_headers',
      '/_redirects'
    ];

    // Skip API endpoints (but not page routes that happen to have the same path)
    // API endpoints typically have specific patterns or are under /api/
    const isApiEndpoint = skipPaths.some(path => req.path.startsWith(path)) ||
                         // Skip if it's a JSON request to what looks like an API endpoint
                         (req.get('Accept')?.includes('application/json') && 
                          !req.get('Accept')?.includes('text/html') &&
                          (req.path.startsWith('/countries') ||
                           req.path.startsWith('/floptions') ||
                           req.path.startsWith('/categories') ||
                           req.path.startsWith('/users') ||
                           req.path.startsWith('/posts') ||
                           req.path.startsWith('/contact') ||
                           req.path.startsWith('/cities') ||
                           req.path.startsWith('/promotion') ||
                           req.path.startsWith('/dependencies')));

    if (isApiEndpoint) {
      return next();
    }

    // Skip static assets
    if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|map)$/)) {
      return next();
    }

    // Get session ID from header (preferred for cross-origin) or cookie (fallback)
    // Check header first (for cross-origin support via localStorage)
    let sessionId = req.get('X-Visitor-Session') ||
                    req.headers['x-visitor-session'] ||
                    // Fallback to cookie
                    req.cookies?.visitorSession || 
                    req.signedCookies?.visitorSession ||
                    (req.headers.cookie && req.headers.cookie.match(/visitorSession=([^;]+)/)?.[1]);

    // Also track HTML page requests (for same-origin or direct access)
    const acceptHeader = req.get('Accept') || '';
    const isHtmlRequest = acceptHeader.includes('text/html') || acceptHeader.includes('*/*');
    
    // Track visits on:
    // 1. HTML page requests (initial page loads)
    // 2. Visitor session sync endpoint (called on app initialization)
    // 3. Dashboard endpoint (first meaningful API call)
    const isTrackableRequest = isHtmlRequest || 
                               req.path === '/visitor-session' ||
                               req.path === '/dashboard';
    
    // Skip if not a trackable request
    if (!isTrackableRequest) {
      return next();
    }

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

    // If no session ID exists (neither header nor cookie), create a new one
    if (!sessionId) {
      sessionId = uuidv4();
      isNewSession = true;
      
      console.log('✅ Creating NEW session:', sessionId.substring(0, 8) + '...');
      
      // Return session ID in response header so client can store it in localStorage
      res.setHeader('X-Visitor-Session', sessionId);
      
      // Also try to set cookie as fallback (may not work cross-origin)
      const cookieOptions = {
        maxAge: COOKIE_MAX_AGE,
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/'
      };
      
      res.cookie('visitorSession', sessionId, cookieOptions);
      console.log('🍪 Session ID returned in header and cookie:', {
        sessionId: sessionId.substring(0, 8) + '...',
        source: 'new'
      });
    } else {
      const sessionSource = req.get('X-Visitor-Session') ? 'header' : 'cookie';
      console.log('🔄 Existing session found:', {
        sessionId: sessionId.substring(0, 8) + '...',
        source: sessionSource
      });
      
      // Return session ID in response header to keep it in sync
      res.setHeader('X-Visitor-Session', sessionId);
      
      // Also refresh cookie as fallback
      const cookieOptions = {
        maxAge: COOKIE_MAX_AGE,
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/'
      };
      
      res.cookie('visitorSession', sessionId, cookieOptions);
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


