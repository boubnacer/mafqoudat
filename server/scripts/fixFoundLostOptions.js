const mongoose = require('mongoose');
const FoundLost = require('../models/FoundLost');
require('dotenv').config();

// FoundLost options data
const foundLostOptionsData = [
  {
    code: 'FOUND',
    labels: {
      en: 'Found',
      fr: 'Trouvé',
      ar: 'تم العثور عليه'
    },
    flag: '✅',
    icon: '✅',
    color: '#4CAF50',
    description: 'Items that have been found'
  },
  {
    code: 'LOST',
    labels: {
      en: 'Lost',
      fr: 'Perdu',
      ar: 'مفقود'
    },
    flag: '❌',
    icon: '❌',
    color: '#F44336',
    description: 'Items that have been lost'
  }
];

const fixFoundLostOptions = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URI, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    console.log('Connected to MongoDB');

    // Check if options already exist
    const existingFound = await FoundLost.findOne({ code: 'FOUND' });
    const existingLost = await FoundLost.findOne({ code: 'LOST' });

    if (existingFound && existingLost) {
      console.log('✅ FoundLost options already exist');
      
      // Update existing options with proper labels
      await FoundLost.updateOne(
        { code: 'FOUND' },
        { 
          $set: { 
            labels: foundLostOptionsData[0].labels,
            flag: foundLostOptionsData[0].flag,
            icon: foundLostOptionsData[0].icon,
            color: foundLostOptionsData[0].color,
            description: foundLostOptionsData[0].description
          }
        }
      );
      
      await FoundLost.updateOne(
        { code: 'LOST' },
        { 
          $set: { 
            labels: foundLostOptionsData[1].labels,
            flag: foundLostOptionsData[1].flag,
            icon: foundLostOptionsData[1].icon,
            color: foundLostOptionsData[1].color,
            description: foundLostOptionsData[1].description
          }
        }
      );
      
      console.log('✅ Updated existing FoundLost options with proper labels');
    } else {
      // Create missing options
      const optionsToCreate = [];
      
      if (!existingFound) {
        optionsToCreate.push(foundLostOptionsData[0]);
      }
      
      if (!existingLost) {
        optionsToCreate.push(foundLostOptionsData[1]);
      }
      
      if (optionsToCreate.length > 0) {
        const createdOptions = await FoundLost.insertMany(optionsToCreate);
        console.log(`✅ Created ${createdOptions.length} FoundLost options`);
      }
    }

    // Verify the options exist
    const foundOption = await FoundLost.findOne({ code: 'FOUND' });
    const lostOption = await FoundLost.findOne({ code: 'LOST' });
    
    console.log('\n📋 Verification:');
    console.log('FOUND option:', foundOption ? '✅ Exists' : '❌ Missing');
    console.log('LOST option:', lostOption ? '✅ Exists' : '❌ Missing');
    
    if (foundOption) {
      console.log('FOUND labels:', foundOption.labels);
    }
    
    if (lostOption) {
      console.log('LOST labels:', lostOption.labels);
    }

    console.log('\n🎉 FoundLost options fixed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing FoundLost options:', error);
    process.exit(1);
  }
};

fixFoundLostOptions(); 