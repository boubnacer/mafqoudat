const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';

async function fixPostCountry() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully!');
    
    const db = mongoose.connection.db;
    
    // Update the post to use UAE as the country
    const updateResult = await db.collection('posts').updateOne(
      { _id: new mongoose.Types.ObjectId('68b081dac6f7e650bca6dac5') },
      { $set: { country: new mongoose.Types.ObjectId('68a4b54ab46524c54c553cae') } }
    );
    
    console.log('✅ Updated post country to UAE:', updateResult.modifiedCount, 'documents modified');
    
    // Verify the fix
    console.log('\n🔍 Verifying the fix...');
    const updatedPost = await db.collection('posts').findOne({ 
      _id: new mongoose.Types.ObjectId('68b081dac6f7e650bca6dac5') 
    });
    
    if (updatedPost) {
      console.log('📄 Updated post:');
      console.log('  Country ID:', updatedPost.country);
      console.log('  City ID:', updatedPost.city);
      
      // Check the country
      const country = await db.collection('countries').findOne({ _id: updatedPost.country });
      if (country) {
        console.log('  Country Name:', country.labels?.en || country.name);
        console.log('  Country Code:', country.code);
      }
      
      // Check the city
      const city = await db.collection('cities').findOne({ _id: updatedPost.city });
      if (city) {
        console.log('  City Name:', city.labels?.en || city.name);
        console.log('  City Code:', city.code);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

fixPostCountry();
