const mongoose = require('mongoose');

// Base connection string
const BASE_URI = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function checkDatabases() {
    console.log('🔍 Checking available databases in your MongoDB cluster...\n');
    
    try {
        // Connect to MongoDB without specifying a database
        console.log('📊 Connecting to MongoDB cluster...');
        const conn = await mongoose.connect(BASE_URI, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            retryWrites: true,
            w: 'majority',
        });
        console.log('✅ Connected to MongoDB cluster');
        
        // List all databases
        const adminDb = conn.connection.db.admin();
        const dbList = await adminDb.listDatabases();
        
        console.log('\n📋 Available databases:');
        dbList.databases.forEach(db => {
            console.log(`   - ${db.name} (${db.sizeOnDisk} bytes)`);
        });
        
        // Check if test and mafqoudat databases exist
        const testDb = dbList.databases.find(db => db.name === 'test');
        const mafqoudatDb = dbList.databases.find(db => db.name === 'mafqoudat');
        
        console.log('\n🎯 Target databases:');
        console.log(`   Test database: ${testDb ? '✅ EXISTS' : '❌ NOT FOUND'}`);
        console.log(`   Mafqoudat database: ${mafqoudatDb ? '✅ EXISTS' : '❌ NOT FOUND'}`);
        
        if (testDb && mafqoudatDb) {
            console.log('\n📊 Database sizes:');
            console.log(`   Test: ${(testDb.sizeOnDisk / 1024 / 1024).toFixed(2)} MB`);
            console.log(`   Mafqoudat: ${(mafqoudatDb.sizeOnDisk / 1024 / 1024).toFixed(2)} MB`);
        }
        
        await conn.disconnect();
        console.log('\n✅ Database check completed!');
        
    } catch (error) {
        console.error('❌ Error checking databases:', error);
    }
}

// Run the check
checkDatabases().then(() => {
    console.log('\n🎯 Database check finished');
    process.exit(0);
}).catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
});
