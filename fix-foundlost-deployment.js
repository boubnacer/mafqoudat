const mongoose = require('mongoose');

// MongoDB connection string for deployment
const MONGODB_URI = 'mongodb+srv://boubkraouinacer:NB%40mafBase2025@cluster0.mwwk6a.mongodb.net/mafqoudat?retryWrites=true&w=majority&appName=Cluster0';

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB deployment database');
  
  try {
    // Check if FoundLost collection exists
    const collections = await mongoose.connection.db.listCollections().toArray();
    const foundLostExists = collections.some(col => col.name === 'foundlosts');
    
    if (!foundLostExists) {
      console.log('FoundLost collection does not exist. Creating it...');
      await mongoose.connection.db.createCollection('foundlosts');
    }
    
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
    
    // Check existing FoundLost options
    const existingOptions = await FoundLost.find({});
    console.log('Existing FoundLost options:', existingOptions);
    
    // Define the correct FoundLost options
    const correctOptions = [
      {
        code: "FOUND",
        label: "Found",
        labels: {
          en: "Found",
          fr: "Trouvé",
          ar: "تم العثور عليه"
        },
        color: "#4CAF50",
        icon: "🔍",
        isActive: true,
        description: "Items that have been found and are being returned to their owners"
      },
      {
        code: "LOST",
        label: "Lost",
        labels: {
          en: "Lost",
          fr: "Perdu",
          ar: "مفقود"
        },
        color: "#F44336",
        icon: "❓",
        isActive: true,
        description: "Items that have been lost and are being searched for"
      }
    ];
    
    // Clear existing options and insert correct ones
    await FoundLost.deleteMany({});
    console.log('Cleared existing FoundLost options');
    
    const insertedOptions = await FoundLost.insertMany(correctOptions);
    console.log('Inserted FoundLost options:', insertedOptions);
    
    // Verify the options are correctly inserted
    const verifiedOptions = await FoundLost.find({});
    console.log('Verified FoundLost options:', verifiedOptions);
    
    // Test dashboard query
    console.log('\nTesting dashboard query...');
    const foundOption = await FoundLost.findOne({ code: "FOUND" });
    const lostOption = await FoundLost.findOne({ code: "LOST" });
    
    console.log('Found option:', foundOption);
    console.log('Lost option:', lostOption);
    
    if (foundOption && lostOption) {
      console.log('✅ FoundLost options are correctly set up!');
      console.log('FOUND ID:', foundOption._id);
      console.log('LOST ID:', lostOption._id);
    } else {
      console.log('❌ FoundLost options are not correctly set up');
    }
    
  } catch (error) {
    console.error('Error fixing FoundLost options:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed');
  }
});
