const mongoose = require('mongoose');

// MongoDB connection string for deployment
const MONGODB_URI = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';

// Connect to MongoDB
mongoose.connect(MONGODB_URI);

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB deployment database');
  
  try {
    // Get FoundLost model
    const FoundLost = mongoose.model('FoundLost', new mongoose.Schema({
      code: String,
      label: String,
      labels: {
        en: String,
        fr: String,
        ar: String
      },
      color: String,
      icon: String,
      isActive: Boolean,
      description: String
    }));
    
    // Test the exact query that the dashboard uses
    console.log('\nTesting FoundLost queries...');
    
    const foundOption = await FoundLost.findOne({ code: "FOUND" });
    console.log('FOUND option:', foundOption);
    
    const lostOption = await FoundLost.findOne({ code: "LOST" });
    console.log('LOST option:', lostOption);
    
    if (foundOption && lostOption) {
      console.log('✅ Both FoundLost options found successfully!');
      console.log('FOUND ID:', foundOption._id);
      console.log('LOST ID:', lostOption._id);
      
      // Test if we can access the code property
      console.log('FOUND code:', foundOption.code);
      console.log('LOST code:', lostOption.code);
    } else {
      console.log('❌ One or both FoundLost options not found');
    }
    
    // Test with ObjectId
    console.log('\nTesting with ObjectId...');
    const foundById = await FoundLost.findById('68a4b54ab46524c54c553cc3');
    const lostById = await FoundLost.findById('68a4b54ab46524c54c553cc4');
    
    console.log('FOUND by ID:', foundById);
    console.log('LOST by ID:', lostById);
    
  } catch (error) {
    console.error('Error testing FoundLost queries:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed');
  }
});
