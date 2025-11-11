const Visitor = require('../models/Visitor');
const { v4: uuidv4 } = require('uuid');

const COOKIE_LIFETIME_DAYS = parseInt(process.env.VISITOR_COOKIE_LIFETIME_DAYS || '30', 10);
const COOKIE_MAX_AGE = COOKIE_LIFETIME_DAYS * 24 * 60 * 60 * 1000;

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
    const secFetchDest = req.get('Sec-Fetch-Dest') || '';
    const secFetchMode = req.get('Sec-Fetch-Mode') || '';
    const xRequestedWith = req.get('X-Requested-With') || '';

    const isDocumentNavigation =
      acceptHeader.includes('text/html') ||
      secFetchDest === 'document' ||
      secFetchMode === 'navigate';

    const isAjaxLikeRequest = xRequestedWith.toLowerCase() === 'xmlhttprequest';

    // Only track top-level navigations (skip API/fetch requests)
    if (!isDocumentNavigation || isAjaxLikeRequest) {
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
    const isFirstVisit = !sessionId;

    if (!sessionId) {
      sessionId = uuidv4();
    }

    res.cookie('visitorSession', sessionId, {
      maxAge: COOKIE_MAX_AGE,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    const now = new Date();

    const visitorData = {
      ip,
      userAgent,
      country,
      city,
      referer,
      path: visitedPath,
      sessionId,
      isUnique: isFirstVisit,
      visitedAt: now,
      lastSeenAt: now,
    };

    await Visitor.create(visitorData);
  } catch (error) {
    // Don't let visitor tracking errors affect the main request
    console.error('❌ Visitor Tracker: Error in visitor tracking:', error);
  }

  next();
};

module.exports = visitorTracker;
