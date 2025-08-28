const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';

async function checkUAEDetails() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully!');
    
    const db = mongoose.connection.db;
    
    // Check UAE country data by code
    const uaeByCode = await db.collection('countries').findOne({ code: 'AE' });
    
    if (uaeByCode) {
      console.log('\n🇦🇪 UAE found by code:');
      console.log('  ID:', uaeByCode._id);
      console.log('  Code:', uaeByCode.code);
      console.log('  Labels:', JSON.stringify(uaeByCode.labels, null, 2));
      console.log('  Names:', JSON.stringify(uaeByCode.names, null, 2));
      console.log('  Full document:', JSON.stringify(uaeByCode, null, 2));
    } else {
      console.log('\n❌ UAE not found by code AE');
    }
    
    // Check UAE country data by ID
    const uaeById = await db.collection('countries').findOne({ 
      _id: new mongoose.Types.ObjectId('68a4b54ab46524c54c553cae') 
    });
    
    if (uaeById) {
      console.log('\n🇦🇪 UAE found by ID:');
      console.log('  ID:', uaeById._id);
      console.log('  Code:', uaeById.code);
      console.log('  Labels:', JSON.stringify(uaeById.labels, null, 2));
      console.log('  Names:', JSON.stringify(uaeById.names, null, 2));
    } else {
      console.log('\n❌ UAE not found by ID');
    }
    
    // Check if UAE needs proper labels
    if (uaeByCode && (!uaeByCode.labels || !uaeByCode.labels.en)) {
      console.log('\n⚠️ UAE needs proper labels. Updating...');
      
      const updateResult = await db.collection('countries').updateOne(
        { code: 'AE' },
        { 
          $set: { 
            labels: {
              en: 'United Arab Emirates',
              fr: 'Émirats arabes unis',
              ar: 'الإمارات العربية المتحدة'
            },
            names: {
              en: 'United Arab Emirates',
              fr: 'Émirats arabes unis',
              ar: 'الإمارات العربية المتحدة'
            }
          }
        }
      );
      
      console.log('✅ Updated UAE labels:', updateResult.modifiedCount, 'documents modified');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkUAEDetails();
