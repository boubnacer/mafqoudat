const allowedOrigins = [
    'http://localhost:3000',
    'https://www.mafqoudat.com',
    'https://mafqoudat.com',
    'https://mafqoudat.vercel.app',
    process.env.FRONTEND_URL,
    process.env.CLIENT_URL
].filter(Boolean); // Remove undefined values

module.exports = allowedOrigins