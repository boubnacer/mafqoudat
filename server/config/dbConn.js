const mongoose = require('mongoose')

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            retryWrites: true,
            w: 'majority',
        })
        
        console.log(`MongoDB Connected: ${conn.connection.host}`)
    } catch (err) {
        console.error('Database connection error:', err)
        process.exit(1)
    }
}

module.exports = connectDB