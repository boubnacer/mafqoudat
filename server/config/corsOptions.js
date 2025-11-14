const allowedOrigins = require('./allowedOrigins');

const normalizeOrigin = (origin) => {
    if (!origin || origin instanceof RegExp) {
        return origin;
    }

    try {
        return new URL(origin).origin.toLowerCase();
    } catch (error) {
        // If origin isn't a valid URL, fall back to trimmed lower-case string
        return origin.toLowerCase();
    }
};

const corsOptions = {
    origin: (origin, callback) => {
        const normalizedOrigin = normalizeOrigin(origin);

        console.log('CORS: Checking origin:', normalizedOrigin || origin);
        console.log('CORS: Allowed origins:', allowedOrigins);
        
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) {
            console.log('CORS: No origin provided, allowing');
            return callback(null, true);
        }
        
        // Check if origin is in allowed list (support both strings and regex)
        const isAllowed = allowedOrigins.some(allowedOrigin => {
            if (typeof allowedOrigin === 'string') {
                return allowedOrigin === normalizedOrigin;
            } else if (allowedOrigin instanceof RegExp && typeof origin === 'string') {
                return allowedOrigin.test(origin);
            }
            return false;
        });
        
        if (isAllowed) {
            console.log('CORS: Origin allowed:', origin);
            callback(null, true);
        } else {
            // Log unauthorized CORS attempts
            console.warn(`CORS: Unauthorized origin attempt: ${origin}`);
            console.warn(`CORS: Allowed origins: ${allowedOrigins.map(o => typeof o === 'string' ? o : o.toString()).join(', ')}`);
            callback(new Error('Not allowed by CORS policy'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
           allowedHeaders: [
               'Origin',
               'X-Requested-With',
               'Content-Type',
               'Accept',
               'Authorization',
               'Cache-Control',
               'X-CSRF-Token',
               'Cookie', // Add Cookie header for cross-domain requests
               'X-Visitor-Session' // Add visitor session header for cross-origin tracking
           ],
    exposedHeaders: [
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset',
        'X-Cache',
        'X-Cache-Key',
        'Set-Cookie', // Expose Set-Cookie header for cross-domain cookies
        'X-Visitor-Session' // Expose visitor session header for cross-origin tracking
    ],
    maxAge: 86400, // 24 hours
    // Additional CORS options for cross-domain cookie support
    preflightContinue: false,
    // Ensure credentials are properly handled for cross-domain requests
    optionsSuccessStatus: 200
}

module.exports = corsOptions 