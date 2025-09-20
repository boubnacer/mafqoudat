const mongoose = require('mongoose')

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            // Memory-optimized connection pool settings
            maxPoolSize: 5, // Reduced from 10 to 5
            minPoolSize: 1, // Minimum connections
            maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
            serverSelectionTimeoutMS: 10000, // Reduced from 30s to 10s
            socketTimeoutMS: 30000, // Reduced from 45s to 30s
            connectTimeoutMS: 10000, // 10 second connection timeout
            retryWrites: true,
            w: 'majority',
            // Memory optimization options
            bufferMaxEntries: 0, // Disable mongoose buffering
            bufferCommands: false, // Disable mongoose buffering
        })
        
        console.log(`MongoDB Connected: ${conn.connection.host}`)
        
        // Set up connection monitoring for memory optimization
        mongoose.connection.on('connected', () => {
            console.log('✅ MongoDB connection established');
        });
        
        mongoose.connection.on('disconnected', () => {
            console.log('⚠️ MongoDB connection disconnected');
        });
        
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
        });
        
        // Monitor connection pool usage
        setInterval(() => {
            const poolSize = mongoose.connection.readyState;
            const connections = mongoose.connections.length;
            console.log(`📊 MongoDB Pool Status: Ready=${poolSize}, Connections=${connections}`);
        }, 60000); // Every minute
        
    } catch (err) {
        console.error('Database connection error:', err)
        process.exit(1)
    }
}

// Graceful shutdown function
const disconnectDB = async () => {
    try {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed gracefully');
    } catch (err) {
        console.error('❌ Error closing MongoDB connection:', err);
    }
}

module.exports = { connectDB, disconnectDB }