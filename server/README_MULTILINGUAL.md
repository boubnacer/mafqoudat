# Multilingual Countries & Post Type System

This document outlines the backend improvements for multilingual support and enhanced post type system.

## 🚀 New Features

### 1. **Multilingual Country Support**
- **Languages**: English, French, Arabic
- **Search**: Multi-language search capability
- **Labels**: Native names in all supported languages
- **Flags**: Country flag emojis
- **Active/Inactive**: Soft delete support

### 2. **Enhanced Post Type System**
- **Enum-based**: FOUND/LOST with proper validation
- **Multilingual**: Labels in English, French, Arabic
- **Visual**: Colors and icons for better UX
- **Descriptions**: Detailed descriptions for each type

## 📊 Database Schema Changes

### Country Model
```javascript
{
  code: String,           // ISO country code (e.g., "MA")
  labels: {
    en: String,          // English name
    fr: String,          // French name
    ar: String           // Arabic name
  },
  flag: String,          // Flag emoji
  isActive: Boolean,     // Soft delete
  searchTerms: [String]  // Auto-generated search terms
}
```

### FoundLost Model (Post Types)
```javascript
{
  code: String,          // "FOUND" or "LOST"
  labels: {
    en: String,          // English label
    fr: String,          // French label
    ar: String           // Arabic label
  },
  color: String,         // Hex color code
  icon: String,          // Icon emoji
  isActive: Boolean,     // Active status
  description: String    // Description
}
```

## 🔧 API Endpoints

### Countries
- `GET /countries` - Get all countries (with language filter)
- `GET /countries/search?q=query` - Search countries
- `POST /countries` - Create new country
- `PUT /countries/:id` - Update country
- `DELETE /countries/:id` - Soft delete country

### Post Types
- `GET /floptions` - Get all post types (with language filter)
- `POST /dependencies/foundlost` - Create new post type

## 🌍 Language Support

### Query Parameters
- `language=en|fr|ar` - Specify preferred language
- `search=text` - Search in all languages
- `active=true|false` - Filter by active status

### Example Usage
```bash
# Get countries in French
GET /countries?language=fr

# Search for "Morocco" in any language
GET /countries/search?q=Morocco&language=en

# Get post types in Arabic
GET /floptions?language=ar
```

## 🗄️ Database Migration

### For New Installations
```bash
npm run seed
```

### For Existing Data
```bash
npm run migrate
```

## 📝 Sample Data

### Countries
```javascript
{
  code: "MA",
  labels: {
    en: "Morocco",
    fr: "Maroc", 
    ar: "المغرب"
  },
  flag: "🇲🇦"
}
```

### Post Types
```javascript
{
  code: "FOUND",
  labels: {
    en: "Found",
    fr: "Trouvé",
    ar: "تم العثور عليه"
  },
  color: "#4CAF50",
  icon: "🔍"
}
```

## 🔍 Search Features

### Text Search
- Searches across all language labels
- Case-insensitive matching
- Partial word matching
- Arabic text support

### Language Detection
- Automatic language detection for search queries
- Fallback to English for unknown languages
- Support for mixed-language content

## 🛠️ Utility Functions

### Language Detection
```javascript
const { detectLanguage } = require('./utils/languageUtils');
const lang = detectLanguage("المغرب"); // Returns "ar"
```

### Best Label Selection
```javascript
const { getBestLabel } = require('./utils/languageUtils');
const label = getBestLabel(labels, 'fr', 'en'); // French with English fallback
```

## 🔄 Backward Compatibility

### Virtual Properties
- `country.label` → Returns `country.labels.en`
- `foundlost.name` → Returns `foundlost.labels.en`

### API Responses
- Maintains existing response structure
- Adds new fields without breaking changes
- Graceful fallbacks for missing data

## 🚦 Migration Strategy

### Phase 1: Database Schema
1. Update models with new fields
2. Add indexes for performance
3. Create migration scripts

### Phase 2: API Enhancement
1. Update controllers with multilingual support
2. Add search functionality
3. Implement language detection

### Phase 3: Data Migration
1. Run migration script for existing data
2. Seed new data if needed
3. Verify data integrity

### Phase 4: Frontend Integration
1. Update API calls to use new endpoints
2. Implement language selection
3. Add search functionality

## 📋 Checklist

### Backend Setup
- [ ] Update database models
- [ ] Create migration scripts
- [ ] Update API controllers
- [ ] Add utility functions
- [ ] Test API endpoints
- [ ] Run data migration

### Frontend Integration
- [ ] Update API slices
- [ ] Add language selection
- [ ] Implement search
- [ ] Update UI components
- [ ] Test multilingual features

## 🐛 Troubleshooting

### Common Issues

1. **Search not working**
   - Check if text indexes are created
   - Verify search terms are populated

2. **Language not detected**
   - Ensure text contains language-specific characters
   - Check language detection patterns

3. **Migration fails**
   - Backup database before migration
   - Check for data conflicts
   - Verify model compatibility

### Debug Commands
```bash
# Check database indexes
db.countries.getIndexes()

# Verify search terms
db.countries.findOne({}, {searchTerms: 1})

# Test language detection
node -e "console.log(require('./utils/languageUtils').detectLanguage('المغرب'))"
```

## 📚 Additional Resources

- [MongoDB Text Search](https://docs.mongodb.com/manual/text-search/)
- [ISO Country Codes](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)
- [Unicode Arabic](https://unicode.org/charts/PDF/U0600.pdf)
- [RESTCountries API](https://restcountries.com/) (Alternative data source) 