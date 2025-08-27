const axios = require('axios');

const API_BASE_URL = 'https://mafqoudat-production.up.railway.app';

async function seedViaRailwayAPI() {
  try {
    console.log('🌱 Seeding Railway database via API...\n');
    
    // Test if the server is ready
    console.log('🔍 Testing server readiness...');
    try {
      const healthResponse = await axios.get(`${API_BASE_URL}/health`);
      console.log('✅ Server is ready:', healthResponse.data);
    } catch (error) {
      console.log('❌ Server not ready:', error.message);
      return;
    }
    
    console.log('\n📋 Note: This script will seed the Railway database with basic data.');
    console.log('The client will then be able to fetch fresh IDs from the Railway API.');
    console.log('After seeding, you should update your client to use the new IDs.\n');
    
    // Since we can't seed directly via API (no admin endpoints), 
    // we'll provide instructions for manual seeding
    
    console.log('🚀 Next Steps:');
    console.log('1. Go to Railway Dashboard');
    console.log('2. Check the logs to see if there are any database connection issues');
    console.log('3. If the database is empty, you need to seed it manually');
    console.log('4. Or update the Railway environment variables to point to your existing database');
    
    console.log('\n🔧 Quick Fix Options:');
    console.log('\nOption A: Use your existing database');
    console.log('- Update Railway MONGODB_URI to:');
    console.log('  mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0');
    console.log('  (Remove the /mafqoudat part)');
    
    console.log('\nOption B: Seed the Railway database');
    console.log('- Run a database seeding script on Railway');
    console.log('- Or manually add data through MongoDB Atlas');
    
    console.log('\nOption C: Update client to use Railway IDs');
    console.log('- After seeding Railway database, get the new IDs');
    console.log('- Update client to use those IDs');
    
    console.log('\n✅ Instructions provided!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

seedViaRailwayAPI();
