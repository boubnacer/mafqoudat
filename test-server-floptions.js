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

// Import the server-side FoundLost model
const FoundLost = require('./server/models/FoundLost');

const testServerModel = async () => {
  try {
    await connectDB();
    
    console.log('🔍 Testing server-side FoundLost model...');
    
    // Test the exact query from the server controller
    console.log('\n🧪 Testing server query: FoundLost.find({})');
    const allOptions = await FoundLost.find({}).lean();
    console.log(`Found ${allOptions.length} total options:`);
    allOptions.forEach(option => {
      console.log(`- ${option.code}: ${option._id} (isActive: ${option.isActive})`);
    });
    
    // Test with isActive filter
    console.log('\n🧪 Testing server query: FoundLost.find({ isActive: true })');
    const activeOptions = await FoundLost.find({ isActive: true }).lean();
    console.log(`Found ${activeOptions.length} active options:`);
    activeOptions.forEach(option => {
      console.log(`- ${option.code}: ${option._id} (isActive: ${option.isActive})`);
    });
    
    // Test with $or condition like in the server
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
    
    // Test the exact query from the server controller with select
    console.log('\n🧪 Testing server query with select:');
    const selectedOptions = await FoundLost.find({})
      .select('code labels color icon isActive description')
      .sort({ code: 1 })
      .lean()
      .exec();
    console.log(`Found ${selectedOptions.length} options with select:`);
    selectedOptions.forEach(option => {
      console.log(`- ${option.code}: ${option._id} (isActive: ${option.isActive})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

testServerModel();
