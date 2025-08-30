const mongoose = require('mongoose');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoUri = "mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0";
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

const debugFlOptions = async () => {
  try {
    await connectDB();
    
    console.log('🔍 Debugging found/lost options...');
    
    // Get all options without any filter
    const allOptions = await FoundLost.find({}).lean();
    console.log(`\n📊 Found ${allOptions.length} total options:`);
    allOptions.forEach(option => {
      console.log(`\n- Code: ${option.code}`);
      console.log(`  ID: ${option._id}`);
      console.log(`  Labels:`, option.labels);
      console.log(`  isActive: ${option.isActive}`);
      console.log(`  Color: ${option.color}`);
      console.log(`  Icon: ${option.icon}`);
      console.log(`  Description: ${option.description}`);
    });
    
    // Test the exact query from the server
    console.log('\n🧪 Testing server query: FoundLost.find({ isActive: true })');
    const activeOptions = await FoundLost.find({ isActive: true }).lean();
    console.log(`Found ${activeOptions.length} active options:`);
    activeOptions.forEach(option => {
      console.log(`- ${option.code}: ${option._id} (isActive: ${option.isActive})`);
    });
    
    // Test the query with $or condition like in the server
    console.log('\n🧪 Testing server query with $or condition:');
    const orQuery = {
      $or: [
        { isActive: true },
        { isActive: null }
      ]
    };
    const orOptions = await FoundLost.find(orQuery).lean();
    console.log(`Found ${orOptions.length} options with $or query:`);
    orOptions.forEach(option => {
      console.log(`- ${option.code}: ${option._id} (isActive: ${option.isActive})`);
    });
    
    // Test without any isActive filter
    console.log('\n🧪 Testing query without isActive filter:');
    const noFilterOptions = await FoundLost.find({}).lean();
    console.log(`Found ${noFilterOptions.length} options without filter:`);
    noFilterOptions.forEach(option => {
      console.log(`- ${option.code}: ${option._id} (isActive: ${option.isActive})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

debugFlOptions();
