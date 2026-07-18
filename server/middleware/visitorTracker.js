const Visitor = require('../models/Visitor');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

// Cache for IP to country lookups (to avoid repeated API calls)
const ipCountryCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Cache for visitor sessions to avoid repeated database calls
const sessionCache = new Map();
const SESSION_CACHE_TTL = 5 * 60 * 1000; // 5 minutes - cache session lookups

/**
 * Get country code from IP address using free IP geolocation API
 * @param {string} ip - IP address
 * @returns {Promise<string>} Country code or 'Unknown'
 */
const getCountryFromIP = async (ip) => {
  // Skip localhost and private IPs
  if (!ip || ip === 'unknown' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
    return 'Unknown';
  }

  // Check cache first
  const cached = ipCountryCache.get(ip);
  if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
    return cached.country;
  }

  try {
    // Use ip-api.com (free, no API key required, 45 requests/minute)
    // Using JSON endpoint: http://ip-api.com/json/{ip}?fields=countryCode
    const response = await axios.get(`http://ip-api.com/json/${ip}?fields=countryCode`, {
      timeout: 3000 // 3 second timeout
    });

    if (response.data && response.data.countryCode) {
      const countryCode = response.data.countryCode;
      // Cache the result
      ipCountryCache.set(ip, {
        country: countryCode,
        timestamp: Date.now()
      });
      return countryCode;
    }
  } catch (error) {
    // Silently fail - don't log to avoid spam
    console.debug(`IP geolocation failed for ${ip}:`, error.message);
  }

  return 'Unknown';
};

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

    // Track visits ONLY on the /visitor-session endpoint
    // This is the single point of entry that's called first on app initialization
    // We don't track HTML requests because in a SPA, the frontend is served separately
    // and the backend only receives API calls
    if (req.path !== '/visitor-session') {
      return next();
    }

    let isNewSession = false;

    // If no session ID exists (neither header nor cookie), create a new one
    if (!sessionId) {
      sessionId = uuidv4();
      isNewSession = true;
      
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
    } else {
      // OPTIMIZED: Check session cache first to avoid database query
      if (sessionCache.has(sessionId)) {
        const cached = sessionCache.get(sessionId);
        // Check if cache is still valid
        if (Date.now() - cached.timestamp < SESSION_CACHE_TTL) {
          // Session exists in cache, skip database query
          res.setHeader('X-Visitor-Session', sessionId);
          res.cookie('visitorSession', sessionId, {
            maxAge: COOKIE_MAX_AGE,
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            path: '/'
          });
          return next();
        } else {
          // Cache expired, remove it
          sessionCache.delete(sessionId);
        }
      }
      
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

    // Use findOneAndUpdate with upsert to atomically check and create
    // This prevents race conditions when multiple requests arrive simultaneously
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
               req.headers['x-real-ip'] ||
               req.ip ||
               req.connection?.remoteAddress ||
               req.socket?.remoteAddress ||
               'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    
    // Try multiple header variations for country detection
    // Cloudflare, Vercel, Render, and other platforms use different headers
    // Note: Render doesn't provide country headers by default, so we use IP geolocation as fallback
    let country = req.headers['cf-ipcountry'] || 
                  req.headers['x-vercel-ip-country'] ||
                  req.headers['x-country-code'] ||
                  req.headers['cloudflare-ipcountry'] ||
                  req.headers['cf-ip-country'] ||
                  req.headers['x-geoip-country'] ||
                  req.headers['cf-ip-country-code'] ||
                  req.headers['x-country'] ||
                  null;
    
    // If no country from headers, try IP geolocation (async, but we'll await it)
    if (!country || country === 'Unknown') {
      country = await getCountryFromIP(ip);
    }
    
    const city = req.headers['cf-ipcity'] || 
                req.headers['x-vercel-ip-city'] ||
                req.headers['x-city'] ||
                req.headers['cf-ip-city'] ||
                req.headers['x-geoip-city'] ||
                'Unknown';
    const firstPage = req.path || '/';

    try {
      // Use findOneAndUpdate with upsert: true
      // This atomically checks if session exists, and only creates if it doesn't
      // The $setOnInsert ensures we only set these fields on creation, not on update
      const result = await Visitor.findOneAndUpdate(
        { sessionId }, // Find by sessionId
        {
          $setOnInsert: {
            sessionId,
            ip,
            userAgent,
            country,
            city,
            firstPage,
            visitedAt: new Date()
          }
        },
        {
          upsert: true, // Create if doesn't exist
          new: true, // Return the document after update
          setDefaultsOnInsert: true // Apply schema defaults on insert
        }
      );

      // OPTIMIZED: Cache the session to avoid future database queries
      if (result) {
        sessionCache.set(sessionId, {
          timestamp: Date.now(),
          sessionId: result.sessionId
        });
      }

    } catch (err) {
      // If it's a duplicate key error (E11000), another request already created it - that's fine
      // Silently handle duplicate sessions (race condition)
      if (err.code !== 11000 && err.name !== 'MongoServerError') {
        console.error('❌ Visitor Tracker: Error saving visitor data:', err);
      } else {
        // Even on duplicate key error, cache the session since it exists
        sessionCache.set(sessionId, {
          timestamp: Date.now(),
          sessionId: sessionId
        });
      }
    }

  } catch (error) {
    // Don't let visitor tracking errors affect the main request
    console.error('❌ Visitor Tracker: Error in visitor tracking:', error);
  }
  
  next();
};

module.exports = visitorTracker;


