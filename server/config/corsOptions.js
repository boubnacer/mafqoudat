const allowedOrigins = require('./allowedOrigins')

const corsOptions = {
    origin: (origin, callback) => {
        console.log('CORS: Checking origin:', origin);
        console.log('CORS: Allowed origins:', allowedOrigins);
        
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) {
            console.log('CORS: No origin provided, allowing');
            return callback(null, true);
        }
        
        // Check if origin is in allowed list (support both strings and regex)
        const isAllowed = allowedOrigins.some(allowedOrigin => {
            if (typeof allowedOrigin === 'string') {
                return allowedOrigin === origin;
            } else if (allowedOrigin instanceof RegExp) {
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
        'Cookie' // Add Cookie header for cross-domain requests
    ],
    exposedHeaders: [
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset',
        'X-Cache',
        'X-Cache-Key',
        'Set-Cookie' // Expose Set-Cookie header for cross-domain cookies
    ],
    maxAge: 86400, // 24 hours
    // Additional CORS options for cross-domain cookie support
    preflightContinue: false,
    // Ensure credentials are properly handled for cross-domain requests
    optionsSuccessStatus: 200
}

module.exports = corsOptions 