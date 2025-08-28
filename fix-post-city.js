const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';

async function fixPostCity() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully!');
    
    const db = mongoose.connection.db;
    
    // First, let's see what cities are available for UAE
    const uaeCities = await db.collection('cities').find({ 
      country: new mongoose.Types.ObjectId('68a4b54ab46524c54c553cae') 
    }).toArray();
    
    console.log('\n🏙️ Available cities for UAE:');
    uaeCities.forEach(city => {
      console.log(`  ${city.code}: ${city.labels?.en || city.name || 'No name'} (${city._id})`);
    });
    
    if (uaeCities.length === 0) {
      console.log('\n❌ No cities found for UAE. Creating a default city...');
      
      // Create a default city for UAE
      const defaultCity = {
        code: 'DUBAI',
        country: new mongoose.Types.ObjectId('68a4b54ab46524c54c553cae'),
        labels: {
          en: 'Dubai',
          fr: 'Dubaï',
          ar: 'دبي'
        },
        names: {
          en: 'Dubai',
          fr: 'Dubaï',
          ar: 'دبي'
        },
        isActive: true,
        isCapital: false,
        isDynamic: false,
        searchTerms: ['dubai', 'dubaï', 'دبي']
      };
      
      const result = await db.collection('cities').insertOne(defaultCity);
      console.log('✅ Created default city for UAE:', result.insertedId);
      
      // Use this new city ID
      const newCityId = result.insertedId;
      
      // Update the post to use the new city
      const updateResult = await db.collection('posts').updateOne(
        { _id: new mongoose.Types.ObjectId('68b081dac6f7e650bca6dac5') },
        { $set: { city: newCityId } }
      );
      
      console.log('✅ Updated post with new city ID:', updateResult.modifiedCount, 'documents modified');
      
    } else {
      // Use the first available city
      const firstCity = uaeCities[0];
      console.log(`\n✅ Using existing city: ${firstCity.code} (${firstCity._id})`);
      
      // Update the post to use this city
      const updateResult = await db.collection('posts').updateOne(
        { _id: new mongoose.Types.ObjectId('68b081dac6f7e650bca6dac5') },
        { $set: { city: firstCity._id } }
      );
      
      console.log('✅ Updated post with existing city ID:', updateResult.modifiedCount, 'documents modified');
    }
    
    // Verify the fix
    console.log('\n🔍 Verifying the fix...');
    const updatedPost = await db.collection('posts').findOne({ 
      _id: new mongoose.Types.ObjectId('68b081dac6f7e650bca6dac5') 
    });
    
    if (updatedPost) {
      console.log('📄 Updated post:');
      console.log('  City ID:', updatedPost.city);
      
      // Check if the city exists now
      const city = await db.collection('cities').findOne({ _id: updatedPost.city });
      if (city) {
        console.log('  City Name:', city.labels?.en || city.name);
        console.log('  City Labels:', JSON.stringify(city.labels, null, 2));
      } else {
        console.log('  ❌ City still not found!');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

fixPostCity();
