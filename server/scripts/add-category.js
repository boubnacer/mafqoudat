/**
 * Script to add a new category to the database
 * Usage: node scripts/add-category.js
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

// Sample categories to add
const newCategories = [
  {
    code: "BOOKS",
    labels: {
      en: "Books & Magazines",
      fr: "Livres et Magazines",
      ar: "كتب ومجلات"
    },
    color: "#3F51B5",
    isActive: true,
    priority: 26,
    searchTerms: ["books", "livres", "كتب", "reading", "literature", "magazines"]
  },
  {
    code: "FURNITURE",
    labels: {
      en: "Furniture",
      fr: "Meubles",
      ar: "أثاث"
    },
    color: "#8D6E63",
    isActive: true,
    priority: 27,
    searchTerms: ["furniture", "meubles", "أثاث", "table", "chair", "sofa"]
  },
  {
    code: "ACCESSORIES",
    labels: {
      en: "Accessories",
      fr: "Accessoires",
      ar: "إكسسوارات"
    },
    color: "#EC407A",
    isActive: true,
    priority: 28,
    searchTerms: ["accessories", "accessoires", "إكسسوارات", "bags", "belts", "sunglasses"]
  },
  {
    code: "SHOES",
    labels: {
      en: "Shoes",
      fr: "Chaussures",
      ar: "أحذية"
    },
    color: "#5E35B1",
    isActive: true,
    priority: 29,
    searchTerms: ["shoes", "chaussures", "أحذية", "sneakers", "boots", "sandals"]
  },
  {
    code: "BABY",
    labels: {
      en: "Baby Items",
      fr: "Articles pour bébé",
      ar: "مستلزمات الأطفال"
    },
    color: "#FFA726",
    isActive: true,
    priority: 30,
    searchTerms: ["baby", "bébé", "أطفال", "stroller", "toys", "clothes"]
  },
  {
    code: "OFFICE",
    labels: {
      en: "Office Supplies",
      fr: "Fournitures de bureau",
      ar: "لوازم المكتب"
    },
    color: "#42A5F5",
    isActive: true,
    priority: 31,
    searchTerms: ["office", "bureau", "مكتب", "supplies", "stationery", "desk"]
  },
  {
    code: "OUTDOOR",
    labels: {
      en: "Outdoor & Sports Equipment",
      fr: "Équipement d'extérieur et sport",
      ar: "معدات رياضية وخارجية"
    },
    color: "#66BB6A",
    isActive: true,
    priority: 32,
    searchTerms: ["outdoor", "extérieur", "خارجي", "camping", "hiking", "sports"]
  },
  {
    code: "ART",
    labels: {
      en: "Art & Collectibles",
      fr: "Art et objets de collection",
      ar: "فن ومقتنيات"
    },
    color: "#AB47BC",
    isActive: true,
    priority: 33,
    searchTerms: ["art", "collectibles", "فن", "painting", "sculpture", "antiques"]
  }
];

// Function to add categories
const addCategories = async () => {
  try {
    console.log('\n🔄 Starting category addition process...\n');

    for (const categoryData of newCategories) {
      // Check if category already exists
      const existingCategory = await Category.findOne({ code: categoryData.code });
      
      if (existingCategory) {
        console.log(`⚠️  Category "${categoryData.code}" already exists. Skipping...`);
        continue;
      }

      // Create new category
      const newCategory = await Category.create(categoryData);
      console.log(`✅ Added category: ${categoryData.code} (${categoryData.labels.en})`);
    }

    console.log('\n✨ Category addition process completed!\n');

    // Display all categories
    console.log('📋 Current categories in database:');
    const allCategories = await Category.find({ isActive: true })
      .sort({ priority: 1 })
      .select('code labels.en priority');
    
    allCategories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat.code.padEnd(20)} - ${cat.labels.en.padEnd(30)} (Priority: ${cat.priority})`);
    });

    console.log(`\n📊 Total active categories: ${allCategories.length}`);

  } catch (error) {
    console.error('❌ Error adding categories:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
};

// Function to add a single custom category (interactive)
const addCustomCategory = async (categoryData) => {
  try {
    const existingCategory = await Category.findOne({ code: categoryData.code });
    
    if (existingCategory) {
      console.log(`⚠️  Category "${categoryData.code}" already exists.`);
      return false;
    }

    const newCategory = await Category.create(categoryData);
    console.log(`✅ Added category: ${categoryData.code} (${categoryData.labels.en})`);
    return true;
  } catch (error) {
    console.error('❌ Error adding category:', error);
    return false;
  }
};

// Main execution
const main = async () => {
  await connectDB();
  
  // Check command line arguments
  const args = process.argv.slice(2);
  
  if (args.length > 0 && args[0] === '--custom') {
    console.log('💡 Custom category mode. Edit the script to add your custom category.');
    // Example custom category:
    const customCategory = {
      code: "EXAMPLE",
      labels: {
        en: "Example Category",
        fr: "Catégorie exemple",
        ar: "فئة المثال"
      },
      color: "#FF5722",
      isActive: true,
      priority: 99,
      searchTerms: ["example", "exemple", "مثال"]
    };
    await addCustomCategory(customCategory);
  } else {
    // Add predefined categories
    await addCategories();
  }
};

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

module.exports = { addCustomCategory };

