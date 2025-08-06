const allowedOrigins = [
    'http://localhost:3000',
    'https://www.mafkoudat.com',
    'https://mafkoudat.com',
    process.env.FRONTEND_URL,
    process.env.CLIENT_URL
].filter(Boolean); // Remove undefined values

module.exports = allowedOrigins