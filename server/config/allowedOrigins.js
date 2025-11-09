const baseOrigins = [
    'http://localhost:3000',
    'https://www.mafqoudat.com',
    'https://mafqoudat.com',
    'https://mafqoudat.vercel.app',
    // Allow all Vercel preview URLs
    /^https:\/\/mafqoudat-.*\.vercel\.app$/,
    process.env.FRONTEND_URL,
    process.env.CLIENT_URL,
    process.env.CORS_ALLOWED_ORIGINS
].filter(Boolean); // Remove undefined values

const expandOrigin = (origin) => {
    if (origin instanceof RegExp) {
        return [origin];
    }

    if (typeof origin === 'string') {
        return origin
            .split(',')
            .map(entry => entry.trim())
            .filter(entry => entry.length > 0)
            .map(entry => entry.toLowerCase());
    }

    return [];
};

const allowedOrigins = baseOrigins
    .flatMap(expandOrigin)
    .filter((origin, index, self) => {
        if (origin instanceof RegExp) {
            // Keep regex entries in the order they were declared
            return self.indexOf(origin) === index;
        }
        return self.indexOf(origin) === index;
    });

module.exports = allowedOrigins