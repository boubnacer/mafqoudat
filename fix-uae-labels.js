const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';

async function fixUAELabels() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully!');
    
    const db = mongoose.connection.db;
    
    // Fix UAE labels
    const updateResult = await db.collection('countries').updateOne(
      { code: 'AE' },
      { 
        $set: { 
          labels: {
            en: 'United Arab Emirates',
            fr: 'Émirats arabes unis',
            ar: 'الإمارات العربية المتحدة'
          }
        }
      }
    );
    
    console.log('✅ Updated UAE labels:', updateResult.modifiedCount, 'documents modified');
    
    // Verify the fix
    const uae = await db.collection('countries').findOne({ code: 'AE' });
    if (uae) {
      console.log('\n🇦🇪 UAE after fix:');
      console.log('  ID:', uae._id);
      console.log('  Code:', uae.code);
      console.log('  Labels:', JSON.stringify(uae.labels, null, 2));
      console.log('  Names:', JSON.stringify(uae.names, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

fixUAELabels();
