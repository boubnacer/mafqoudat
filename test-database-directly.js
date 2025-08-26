const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';

async function testDatabase() {
    console.log('🔍 Testing Database Directly...\n');
    
    try {
        const conn = await mongoose.createConnection(MONGODB_URI, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 10000,
        });
        
        console.log('✅ Connected to database\n');
        
        // Test countries collection
        const db = conn.connection.db;
        const countriesCollection = db.collection('countries');
        
        console.log('🌍 Testing Countries Collection...');
        
        // Get all countries
        const allCountries = await countriesCollection.find({}).toArray();
        console.log(`   Total countries: ${allCountries.length}`);
        
        // Get countries with isActive: true
        const activeCountries = await countriesCollection.find({ isActive: true }).toArray();
        console.log(`   Active countries: ${activeCountries.length}`);
        
        // Get countries with isActive: null
        const nullActiveCountries = await countriesCollection.find({ isActive: null }).toArray();
        console.log(`   Countries with isActive: null: ${nullActiveCountries.length}`);
        
        // Get countries with isActive: false
        const falseActiveCountries = await countriesCollection.find({ isActive: false }).toArray();
        console.log(`   Countries with isActive: false: ${falseActiveCountries.length}`);
        
        // Show sample countries
        if (allCountries.length > 0) {
            console.log('\n📋 Sample Countries:');
            allCountries.slice(0, 3).forEach(country => {
                console.log(`   - ${country.code}: isActive = ${country.isActive}`);
            });
        }
        
        // Test FoundLost collection
        console.log('\n🏷️  Testing FoundLost Collection...');
        const foundLostCollection = db.collection('foundlosts');
        
        const allFoundLost = await foundLostCollection.find({}).toArray();
        console.log(`   Total FoundLost options: ${allFoundLost.length}`);
        
        const activeFoundLost = await foundLostCollection.find({ isActive: true }).toArray();
        console.log(`   Active FoundLost options: ${activeFoundLost.length}`);
        
        const nullActiveFoundLost = await foundLostCollection.find({ isActive: null }).toArray();
        console.log(`   FoundLost with isActive: null: ${nullActiveFoundLost.length}`);
        
        if (allFoundLost.length > 0) {
            console.log('\n📋 FoundLost Options:');
            allFoundLost.forEach(option => {
                console.log(`   - ${option.code}: isActive = ${option.isActive}`);
            });
        }
        
        await conn.close();
        console.log('\n✅ Database test completed!');
        
        // Provide fix instructions
        console.log('\n🔧 FIX REQUIRED:');
        if (nullActiveCountries.length > 0 || nullActiveFoundLost.length > 0) {
            console.log('❌ Found records with isActive: null');
            console.log('Please update these records to have isActive: true');
        } else if (activeCountries.length === 0) {
            console.log('❌ No active countries found');
            console.log('Please set isActive: true for all countries');
        } else {
            console.log('✅ Database looks good!');
        }
        
    } catch (error) {
        console.error('❌ Error testing database:', error);
    }
}

testDatabase().then(() => {
    process.exit(0);
}).catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
});
