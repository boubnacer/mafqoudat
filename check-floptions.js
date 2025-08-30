const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0";
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

// FoundLost model
const FoundLostSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    enum: ['FOUND', 'LOST']
  },
  labels: {
    en: String,
    fr: String,
    ar: String
  },
  color: String,
  icon: String,
  isActive: {
    type: Boolean,
    default: true
  },
  description: String
});

const FoundLost = mongoose.model('FoundLost', FoundLostSchema);

const checkAndSeedFlOptions = async () => {
  try {
    await connectDB();
    
    console.log('🔍 Checking for found/lost options in database...');
    
    // Check existing options
    const existingOptions = await FoundLost.find({}).lean();
    console.log(`Found ${existingOptions.length} existing found/lost options:`);
    existingOptions.forEach(option => {
      console.log(`- ${option.code}: ${option._id} (${option.labels?.en || 'No label'})`);
    });
    
    // If no options exist, create them
    if (existingOptions.length === 0) {
      console.log('📝 No found/lost options found. Creating default options...');
      
      const defaultOptions = [
        {
          code: 'FOUND',
          labels: {
            en: 'Found',
            fr: 'Trouvé',
            ar: 'تم العثور عليه'
          },
          color: '#4CAF50',
          icon: 'Found',
          isActive: true,
          description: 'Items that have been found'
        },
        {
          code: 'LOST',
          labels: {
            en: 'Lost',
            fr: 'Perdu',
            ar: 'مفقود'
          },
          color: '#FF9800',
          icon: 'Lost',
          isActive: true,
          description: 'Items that have been lost'
        }
      ];
      
      const createdOptions = await FoundLost.insertMany(defaultOptions);
      console.log('✅ Created found/lost options:');
      createdOptions.forEach(option => {
        console.log(`- ${option.code}: ${option._id} (${option.labels?.en || 'No label'})`);
      });
    } else {
      console.log('✅ Found/lost options already exist in database');
    }
    
    // Test the API endpoint
    console.log('\n🧪 Testing /floptions API endpoint...');
    const testOptions = await FoundLost.find({ isActive: true }).lean();
    console.log(`API would return ${testOptions.length} active options:`);
    testOptions.forEach(option => {
      console.log(`- ${option.code}: ${option._id} (${option.labels?.en || 'No label'})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

checkAndSeedFlOptions();
