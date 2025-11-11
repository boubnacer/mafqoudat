const Visitor = require('../models/Visitor');
const { v4: uuidv4 } = require('uuid');

const SESSION_TIMEOUT_MINUTES = parseInt(process.env.VISITOR_SESSION_TIMEOUT || '30', 10);
const SESSION_COOKIE_MAX_AGE = SESSION_TIMEOUT_MINUTES * 60 * 1000;

/**
 * Visitor tracking middleware
 * Tracks a unique visit per browsing session.
 *
 * A session is considered active while the visitor keeps interacting with the site.
 * Once the session is inactive for SESSION_TIMEOUT_MINUTES, a new visit will be counted.
 */
const visitorTracker = async (req, res, next) => {
  try {
    // Skip non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const acceptHeader = req.get('Accept') || '';
    const isHtmlRequest = acceptHeader.includes('text/html') || acceptHeader.includes('*/*');

    // Only track page requests that are expected to render HTML
    if (!isHtmlRequest) {
      return next();
    }

    // Skip tracking for API routes, system endpoints, and static assets
    const skipPrefixes = [
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

    if (skipPrefixes.some((path) => req.path.startsWith(path))) {
      return next();
    }

    if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|map)$/)) {
      return next();
    }

    const now = new Date();
    const sessionTimeoutThreshold = new Date(now.getTime() - SESSION_COOKIE_MAX_AGE);

    const ip =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.ip ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    const country = req.headers['cf-ipcountry'] || req.headers['x-vercel-ip-country'] || 'Unknown';
    const city = req.headers['cf-ipcity'] || req.headers['x-vercel-ip-city'] || 'Unknown';
    const referer = req.get('Referer') || 'Direct';
    const visitedPath = req.path || '/';

    let sessionId = req.cookies?.visitorSession;
    let activeVisit = null;

    if (sessionId) {
      activeVisit = await Visitor.findOne({
        sessionId,
        lastSeenAt: { $gte: sessionTimeoutThreshold },
      }).select('_id');
    }

    if (activeVisit) {
      // Extend the current session activity window
      await Visitor.updateOne(
        { _id: activeVisit._id },
        { $set: { lastSeenAt: now } },
        { timestamps: false }
      );
      return next();
    }

    // Start a brand-new session
    sessionId = uuidv4();

    res.cookie('visitorSession', sessionId, {
      maxAge: SESSION_COOKIE_MAX_AGE,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    const visitorData = {
      ip,
      userAgent,
      country,
      city,
      referer,
      path: visitedPath,
      sessionId,
      isUnique: true,
      visitedAt: now,
      lastSeenAt: now,
    };

    Visitor.create(visitorData).catch((err) => {
      console.error('❌ Visitor Tracker: Error saving visitor data:', err);
    });
  } catch (error) {
    // Don't let visitor tracking errors affect the main request
    console.error('❌ Visitor Tracker: Error in visitor tracking:', error);
  }

  next();
};

module.exports = visitorTracker;
