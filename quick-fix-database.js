const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';

async function quickFix() {
    try {
        console.log('🔧 Quick Database Fix...\n');
        
        // Use mongoose.connect instead of createConnection
        const conn = await mongoose.connect(MONGODB_URI, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 10000,
        });
        
        console.log('✅ Connected to database\n');
        
        // Get the database instance
        const db = conn.connection.db;
        
        // Fix countries
        console.log('🌍 Fixing countries...');
        const countriesResult = await db.collection('countries').updateMany(
            { isActive: { $ne: true } },
            { $set: { isActive: true } }
        );
        console.log(`   Updated ${countriesResult.modifiedCount} countries`);
        
        // Fix FoundLost
        console.log('🏷️  Fixing FoundLost options...');
        const foundLostResult = await db.collection('foundlosts').updateMany(
            { isActive: { $ne: true } },
            { $set: { isActive: true } }
        );
        console.log(`   Updated ${foundLostResult.modifiedCount} FoundLost options`);
        
        // Verify the fix
        console.log('\n🔍 Verifying the fix...');
        const activeCountries = await db.collection('countries').find({ isActive: true }).toArray();
        console.log(`   Active countries: ${activeCountries.length}`);
        
        const activeFoundLost = await db.collection('foundlosts').find({ isActive: true }).toArray();
        console.log(`   Active FoundLost options: ${activeFoundLost.length}`);
        
        await mongoose.disconnect();
        console.log('\n✅ Database fix completed!');
        console.log('🎯 Your signup page should now work!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Full error:', error);
    }
}

quickFix();
