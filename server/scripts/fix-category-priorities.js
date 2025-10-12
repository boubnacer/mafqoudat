/**
 * Script to fix the priority values of existing categories to match frontend config
 * This ensures categories display in the correct order
 * 
 * Usage: node scripts/fix-category-priorities.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Correct priorities from frontend config
const correctPriorities = {
  ELECTRONICS: 1,
  DOCUMENTS: 2,
  JEWELRY: 3,
  CLOTHING: 4,
  PETS: 5,
  VEHICLES: 6
};

// Function to fix priorities
const fixPriorities = async () => {
  try {
    console.log('\n🔄 Checking and fixing category priorities...\n');

    let fixedCount = 0;
    let alreadyCorrect = 0;

    for (const [code, correctPriority] of Object.entries(correctPriorities)) {
      const category = await Category.findOne({ code });
      
      if (!category) {
        console.log(`⚠️  Category ${code} not found in database - will be added later`);
        continue;
      }

      if (category.priority !== correctPriority) {
        const oldPriority = category.priority;
        category.priority = correctPriority;
        await category.save();
        console.log(`✅ Fixed: ${code.padEnd(20)} - Priority ${oldPriority} → ${correctPriority}`);
        fixedCount++;
      } else {
        console.log(`✓  OK:    ${code.padEnd(20)} - Priority ${correctPriority} (already correct)`);
        alreadyCorrect++;
      }
    }

    console.log('\n✨ Priority fix completed!\n');
    console.log(`📊 Summary:`);
    console.log(`   ✅ Fixed: ${fixedCount}`);
    console.log(`   ✓  Already correct: ${alreadyCorrect}`);

    // Display current categories sorted by priority
    console.log('\n📋 Current categories (sorted by priority):\n');
    const allCategories = await Category.find({ isActive: true })
      .sort({ priority: 1 })
      .select('code labels.en priority');
    
    allCategories.forEach((cat, index) => {
      console.log(`${String(index + 1).padStart(2)}. ${cat.code.padEnd(20)} - ${cat.labels.en.padEnd(35)} (Priority: ${cat.priority})`);
    });

  } catch (error) {
    console.error('❌ Error fixing priorities:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
};

// Main execution
const main = async () => {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║    Fixing Category Priorities                          ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  await connectDB();
  await fixPriorities();
};

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

