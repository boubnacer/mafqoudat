const mongoose = require('mongoose')

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.DATABASE_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        })
        
        console.log(`MongoDB Connected: ${conn.connection.host}`)
    } catch (err) {
        console.error('Database connection error:', err)
        process.exit(1)
    }
}

module.exports = connectDB