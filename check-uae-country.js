const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';

async function checkUAECountry() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully!');
    
    const db = mongoose.connection.db;
    
    // Check UAE country data
    const uaeCountry = await db.collection('countries').findOne({ 
      _id: new mongoose.Types.ObjectId('68a4b54ab46524c54c553cae') 
    });
    
    if (uaeCountry) {
      console.log('\n🇦🇪 UAE Country data:');
      console.log('  ID:', uaeCountry._id);
      console.log('  Code:', uaeCountry.code);
      console.log('  Labels:', JSON.stringify(uaeCountry.labels, null, 2));
      console.log('  Names:', JSON.stringify(uaeCountry.names, null, 2));
    } else {
      console.log('\n❌ UAE country not found!');
    }
    
    // Check Morocco country data for comparison
    const moroccoCountry = await db.collection('countries').findOne({ 
      _id: new mongoose.Types.ObjectId('68a4b54ab46524c54c553ca9') 
    });
    
    if (moroccoCountry) {
      console.log('\n🇲🇦 Morocco Country data:');
      console.log('  ID:', moroccoCountry._id);
      console.log('  Code:', moroccoCountry.code);
      console.log('  Labels:', JSON.stringify(moroccoCountry.labels, null, 2));
      console.log('  Names:', JSON.stringify(moroccoCountry.names, null, 2));
    }
    
    // Check the post data again
    const post = await db.collection('posts').findOne({ 
      _id: new mongoose.Types.ObjectId('68b081dac6f7e650bca6dac5') 
    });
    
    if (post) {
      console.log('\n📄 Post data:');
      console.log('  Country ID:', post.country);
      console.log('  City ID:', post.city);
      
      // Check if the country ID matches UAE
      if (post.country.toString() === '68a4b54ab46524c54c553cae') {
        console.log('  ✅ Post country is correctly set to UAE');
      } else {
        console.log('  ❌ Post country is NOT set to UAE');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkUAECountry();
