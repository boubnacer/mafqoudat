console.log('🔍 Verifying Database Connection...\n');

// Simple database connection test
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';

async function verifyConnection() {
    try {
        console.log('📡 Connecting to database...');
        const conn = await mongoose.connect(MONGODB_URI, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 10000,
        });
        
        console.log('✅ Connected successfully!');
        console.log(`   Database: ${conn.connection.name}`);
        console.log(`   Host: ${conn.connection.host}`);
        
        // Test a simple query
        const db = conn.connection.db;
        const collections = await db.listCollections().toArray();
        console.log(`\n📊 Collections in database:`);
        collections.forEach(col => {
            console.log(`   - ${col.name}`);
        });
        
        await mongoose.disconnect();
        console.log('\n✅ Database verification completed!');
        
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
    }
}

verifyConnection();
