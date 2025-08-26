const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';

async function fixFoundLostActiveStatus() {
    console.log('🔧 Fixing FoundLost Active Status...\n');
    
    try {
        const conn = await mongoose.createConnection(MONGODB_URI, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            retryWrites: true,
            w: 'majority',
        });
        
        console.log('✅ Connected to database\n');
        
        // Import FoundLost model
        const FoundLost = require('./server/models/FoundLost');
        const FoundLostModel = conn.model('FoundLost', FoundLost.schema);
        
        // Check current FoundLost options
        const currentOptions = await FoundLostModel.find({});
        console.log(`📊 Found ${currentOptions.length} FoundLost options`);
        
        currentOptions.forEach(option => {
            console.log(`   - ${option.code}: isActive = ${option.isActive}`);
        });
        
        // Fix the isActive status for all FoundLost options
        console.log('\n🔧 Updating isActive status to true...');
        const updateResult = await FoundLostModel.updateMany(
            { isActive: { $ne: true } }, // Update where isActive is not true (includes null)
            { $set: { isActive: true } }
        );
        
        console.log(`✅ Updated ${updateResult.modifiedCount} FoundLost options`);
        
        // Verify the fix
        console.log('\n🔍 Verifying updated FoundLost options...');
        const updatedOptions = await FoundLostModel.find({});
        
        updatedOptions.forEach(option => {
            console.log(`   - ${option.code}: isActive = ${option.isActive}`);
        });
        
        await conn.close();
        console.log('\n✅ FoundLost active status fix completed!');
        console.log('🎯 Your Railway deployment should now work correctly!');
        
    } catch (error) {
        console.error('❌ Error fixing FoundLost active status:', error);
    }
}

fixFoundLostActiveStatus().then(() => {
    process.exit(0);
}).catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
});
