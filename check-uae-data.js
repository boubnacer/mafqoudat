const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';

async function checkUAEData() {
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
    
    // Check if there are any issues with the country codes
    console.log('\n🔍 Checking for country code issues...');
    const allCountries = await db.collection('countries').find({}).toArray();
    
    console.log('\n🌍 All countries with their codes:');
    allCountries.forEach(country => {
      console.log(`  ${country.code}: ${country.labels?.en || country.name || 'No name'} (${country._id})`);
    });
    
    // Check if there are any duplicate codes
    const codes = allCountries.map(c => c.code);
    const duplicates = codes.filter((code, index) => codes.indexOf(code) !== index);
    
    if (duplicates.length > 0) {
      console.log('\n⚠️ Duplicate country codes found:', duplicates);
    } else {
      console.log('\n✅ No duplicate country codes found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkUAEData();
