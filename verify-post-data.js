const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';

async function verifyPostData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully!');
    
    const db = mongoose.connection.db;
    
    // Check the post data
    const post = await db.collection('posts').findOne({ 
      _id: new mongoose.Types.ObjectId('68b081dac6f7e650bca6dac5') 
    });
    
    if (post) {
      console.log('\n📄 Current post data:');
      console.log('  ID:', post._id);
      console.log('  Country ID:', post.country);
      console.log('  City ID:', post.city);
      console.log('  Category ID:', post.category);
      console.log('  Found/Lost ID:', post.foundLost);
      console.log('  Created:', post.createdAt);
      
      // Check the country
      const country = await db.collection('countries').findOne({ _id: post.country });
      if (country) {
        console.log('\n🌍 Country data:');
        console.log('  ID:', country._id);
        console.log('  Code:', country.code);
        console.log('  Labels:', JSON.stringify(country.labels, null, 2));
      }
      
      // Check the city
      const city = await db.collection('cities').findOne({ _id: post.city });
      if (city) {
        console.log('\n🏙️ City data:');
        console.log('  ID:', city._id);
        console.log('  Code:', city.code);
        console.log('  Labels:', JSON.stringify(city.labels, null, 2));
        console.log('  Country:', city.country);
      }
      
      // Check if the post country matches UAE
      const uaeId = '68a4b54ab46524c54c553cae';
      if (post.country.toString() === uaeId) {
        console.log('\n✅ Post is correctly associated with UAE');
      } else {
        console.log('\n❌ Post is NOT associated with UAE');
        console.log('Expected UAE ID:', uaeId);
        console.log('Actual country ID:', post.country.toString());
      }
    } else {
      console.log('\n❌ Post not found!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

verifyPostData();
