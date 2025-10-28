const Visitor = require('../models/Visitor');
const { v4: uuidv4 } = require('uuid');

/**
 * Visitor tracking middleware
 * Tracks unique visitors and page views
 */
const visitorTracker = async (req, res, next) => {
  try {
    console.log('🔍 Visitor Tracker: Processing request to', req.path, 'Method:', req.method, 'Headers:', req.headers.host);
    console.log('🔍 Visitor Tracker: User-Agent:', req.get('User-Agent'));
    console.log('🔍 Visitor Tracker: Referer:', req.get('Referer'));
    
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
      console.log('⏭️ Visitor Tracker: Skipping API/system route:', req.path);
      return next();
    }

    // Skip tracking for static assets
    if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
      console.log('⏭️ Visitor Tracker: Skipping static asset:', req.path);
      return next();
    }

    // Only track the root path and main entry points
    // This will track when someone first visits the site
    const isMainPageVisit = req.path === '/' || 
                           req.path === '/dash' || 
                           req.path === '/login' ||
                           req.path === '/register' ||
                           req.path === '/blog' ||
                           req.path === '/help';

    console.log('🔍 Visitor Tracker: isMainPageVisit:', isMainPageVisit, 'for path:', req.path);
    console.log('🔍 Visitor Tracker: Full URL:', req.protocol + '://' + req.get('host') + req.originalUrl);

    if (!isMainPageVisit) {
      console.log('⏭️ Visitor Tracker: Not a main page visit, skipping:', req.path);
      return next();
    }

    console.log('🔍 Visitor Tracker: Tracking main page visit:', req.path);

    const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    const country = req.headers['cf-ipcountry'] || 'Unknown';
    const city = req.headers['cf-ipcity'] || 'Unknown';
    
    // Generate or get session ID from cookies
    let sessionId = req.cookies?.visitorSession;
    console.log('🔍 Visitor Tracker: Existing cookies:', req.cookies);
    console.log('🔍 Visitor Tracker: Session ID from cookies:', sessionId);
    
    if (!sessionId) {
      sessionId = uuidv4();
      // Set cookie for 24 hours
      res.cookie('visitorSession', sessionId, { 
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      console.log('🔍 Visitor Tracker: Created new session:', sessionId.substring(0, 8) + '...');
    } else {
      console.log('🔍 Visitor Tracker: Using existing session:', sessionId.substring(0, 8) + '...');
    }

    // Check if this session has already been counted today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    console.log('🔍 Visitor Tracker: Checking existing visit for session:', sessionId.substring(0, 8) + '...');
    console.log('🔍 Visitor Tracker: Today date:', today.toISOString());
    
    const existingVisit = await Visitor.findOne({
      sessionId,
      visitedAt: { $gte: today }
    });

    console.log('🔍 Visitor Tracker: Existing visit found:', !!existingVisit);
    if (existingVisit) {
      console.log('🔍 Visitor Tracker: Existing visit details:', {
        path: existingVisit.path,
        visitedAt: existingVisit.visitedAt,
        country: existingVisit.country
      });
    }

    // Only track if this is a new session today
    if (!existingVisit) {
      console.log('🔍 Visitor Tracker: New visit today, creating visitor record');
      
      const visitorData = {
        ip,
        userAgent,
        country,
        city,
        referer: req.get('Referer') || 'Direct',
        path: '/', // Always record as main site visit
        sessionId,
        isUnique: true
      };

      console.log('🔍 Visitor Tracker: Visitor data:', { 
        country: visitorData.country, 
        path: visitorData.path,
        sessionId: visitorData.sessionId.substring(0, 8) + '...',
        ip: visitorData.ip
      });

      // Save visitor data asynchronously (don't wait for it)
      Visitor.create(visitorData).then(() => {
        console.log('✅ Visitor Tracker: Successfully saved visitor data');
      }).catch(err => {
        console.error('❌ Visitor Tracker: Error saving visitor data:', err);
      });
    } else {
      console.log('🔍 Visitor Tracker: Session already counted today, skipping');
    }
  } catch (error) {
    // Don't let visitor tracking errors affect the main request
    console.error('❌ Visitor Tracker: Error in visitor tracking:', error);
  }
  
  next();
};

module.exports = visitorTracker;
