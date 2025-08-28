const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';

async function checkSpecificCity() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully!');
    
    // Check the specific city ID
    const cityId = '68a9d9bf6bbbb3b407a5be0d';
    const citiesCollection = mongoose.connection.db.collection('cities');
    
    const city = await citiesCollection.findOne({ _id: new mongoose.Types.ObjectId(cityId) });
    
    if (city) {
      console.log('\n🏙️ City found:');
      console.log('  ID:', city._id);
      console.log('  Code:', city.code);
      console.log('  Labels:', JSON.stringify(city.labels, null, 2));
      console.log('  Names:', JSON.stringify(city.names, null, 2));
      console.log('  Country:', city.country);
    } else {
      console.log('\n❌ City not found with ID:', cityId);
      
      // Check if there are any cities for UAE
      const uaeCities = await citiesCollection.find({ 
        country: new mongoose.Types.ObjectId('68a4b54ab46524c54c553cae') 
      }).toArray();
      
      console.log('\n🏙️ Cities for UAE:');
      uaeCities.forEach(city => {
        console.log(`  ${city.code}: ${city.labels?.en || city.name || 'No name'} (${city._id})`);
      });
    }
    
    // Check the post details
    const postsCollection = mongoose.connection.db.collection('posts');
    const post = await postsCollection.findOne({ _id: new mongoose.Types.ObjectId('68b081dac6f7e650bca6dac5') });
    
    if (post) {
      console.log('\n📄 Post details:');
      console.log('  ID:', post._id);
      console.log('  City:', post.city);
      console.log('  Country:', post.country);
      console.log('  Category:', post.category);
      console.log('  Found/Lost:', post.foundLost);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkSpecificCity();
