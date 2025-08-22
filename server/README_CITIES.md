# Cities Management System

This document outlines the cities management system for the Mafqoudat application, providing multilingual support for major cities in Arabic countries.

## 🚀 Features

### 1. **Multilingual City Support**
- **Languages**: English, French, Arabic
- **Search**: Multi-language search capability
- **Labels**: Native names in all supported languages
- **Capital Cities**: Special designation for capital cities
- **Population Data**: Optional population information
- **Active/Inactive**: Soft delete support

### 2. **Country Relationship**
- Each city belongs to a specific country
- Proper foreign key relationships
- Country information included in responses

## 📊 Database Schema

### City Model
```javascript
{
  code: String,           // City code (e.g., "CASABLANCA")
  country: ObjectId,      // Reference to Country model
  labels: {
    en: String,          // English name
    fr: String,          // French name
    ar: String           // Arabic name
  },
  names: {
    en: String,          // English full name
    fr: String,          // French full name
    ar: String           // Arabic full name
  },
  isCapital: Boolean,    // Whether it's a capital city
  isActive: Boolean,     // Soft delete
  population: Number,    // Optional population data
  searchTerms: [String]  // Auto-generated search terms
}
```

## 🔧 API Endpoints

### Public Routes (No Authentication Required)

#### Get All Cities
```
GET /cities
```
**Query Parameters:**
- `language` (optional): Language code (en, fr, ar) - defaults to 'en'
- `search` (optional): Search term for city names
- `active` (optional): Filter by active status - defaults to 'true'
- `countryId` (optional): Filter by country ID
- `countryCode` (optional): Filter by country code (e.g., 'MA', 'EG')

**Example:**
```bash
GET /cities?language=ar&countryCode=MA
```

#### Search Cities
```
GET /cities/search
```
**Query Parameters:**
- `q` (required): Search query (minimum 2 characters)
- `language` (optional): Language code - defaults to 'en'
- `limit` (optional): Maximum results - defaults to 10
- `countryCode` (optional): Filter by country code

**Example:**
```bash
GET /cities/search?q=casablanca&language=fr
```

#### Get Cities by Country
```
GET /cities/country/:countryId
```
**Path Parameters:**
- `countryId`: MongoDB ObjectId of the country

**Query Parameters:**
- `language` (optional): Language code - defaults to 'en'
- `active` (optional): Filter by active status - defaults to 'true'

### Protected Routes (Authentication Required)

#### Create City
```
POST /cities
```
**Request Body:**
```json
{
  "code": "NEW_CITY",
  "countryId": "country_object_id",
  "labels": {
    "en": "New City",
    "fr": "Nouvelle Ville",
    "ar": "مدينة جديدة"
  },
  "names": {
    "en": "New City",
    "fr": "Nouvelle Ville",
    "ar": "مدينة جديدة"
  },
  "isCapital": false,
  "population": 100000
}
```

#### Update City
```
PUT /cities/:id
```
**Request Body:** (all fields optional)
```json
{
  "labels": {
    "en": "Updated City Name",
    "fr": "Nom de Ville Mis à Jour",
    "ar": "اسم المدينة المحدث"
  },
  "isCapital": true,
  "population": 150000,
  "isActive": true
}
```

#### Delete City (Soft Delete)
```
DELETE /cities/:id
```
Sets `isActive` to `false` instead of removing the record.

## 🌍 Supported Countries and Cities

The system includes major cities from the following Arabic countries:

### Morocco (MA)
- Casablanca (الدار البيضاء)
- Rabat (الرباط) - Capital
- Fez (فاس)
- Marrakech (مراكش)
- Tangier (طنجة)
- Agadir (أكادير)

### Algeria (DZ)
- Algiers (الجزائر) - Capital
- Oran (وهران)
- Constantine (قسنطينة)
- Annaba (عنابة)

### Tunisia (TN)
- Tunis (تونس) - Capital
- Sfax (صفاقس)
- Sousse (سوسة)
- Gabès (قابس)

### Egypt (EG)
- Cairo (القاهرة) - Capital
- Alexandria (الإسكندرية)
- Giza (الجيزة)
- Sharm El Sheikh (شرم الشيخ)
- Luxor (الأقصر)

### Saudi Arabia (SA)
- Riyadh (الرياض) - Capital
- Jeddah (جدة)
- Mecca (مكة المكرمة)
- Medina (المدينة المنورة)
- Dammam (الدمام)

### UAE (AE)
- Dubai (دبي)
- Abu Dhabi (أبو ظبي) - Capital
- Sharjah (الشارقة)
- Ajman (عجمان)

### Qatar (QA)
- Doha (الدوحة) - Capital
- Al Wakrah (الوكرة)
- Al Khor (الخور)

### Kuwait (KW)
- Kuwait City (مدينة الكويت) - Capital
- Al Jahra (الجهراء)
- Hawalli (حولي)

### Bahrain (BH)
- Manama (المنامة) - Capital
- Muharraq (المحرق)
- Riffa (الرفاع)

## 🚀 Getting Started

### 1. Run the Seeding Script
```bash
cd server
node scripts/seedCities.js
```

### 2. Test the API
```bash
# Get all cities
curl http://localhost:3500/cities

# Get cities by country
curl http://localhost:3500/cities?countryCode=MA

# Search cities
curl http://localhost:3500/cities/search?q=cairo
```

## 📈 Performance Considerations

### Indexing Strategy
- **Compound Index**: `{ country: 1, code: 1 }` for uniqueness
- **Text Index**: Multilingual search on labels and names
- **Country Index**: `{ country: 1, isActive: 1 }` for country-based queries

### MongoDB Atlas Impact
- **Minimal Storage**: Cities are small documents (~1KB each)
- **Efficient Queries**: Proper indexing ensures fast lookups
- **Scalable**: Can easily add more cities without performance impact

## 🔄 Integration with Existing System

### Post Model Integration
The existing `Post` model already has a `city` field that can be enhanced to reference the new `City` model:

```javascript
// Current Post model
city: {
  type: String,
  default: null,
}

// Future enhancement (optional)
city: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "City",
  required: false,
}
```

### Backward Compatibility
- Existing posts with string city names continue to work
- Gradual migration to city references possible
- No breaking changes to existing functionality

## 🛡️ Security Features

- **Authentication Required**: Create, update, delete operations require JWT
- **Input Validation**: All inputs are validated and sanitized
- **Soft Delete**: Cities are deactivated rather than deleted
- **Rate Limiting**: Inherits from existing security middleware

## 🔧 Maintenance

### Adding New Cities
1. Update the `citiesData` array in `seedCities.js`
2. Run the seeding script
3. Cities will be automatically added with proper relationships

### Updating City Information
- Use the PUT endpoint for individual updates
- Bulk updates can be done through the seeding script

### Monitoring
- Check city usage in posts
- Monitor search performance
- Review city-country relationships

## 📝 Best Practices

1. **Consistent Naming**: Use consistent city codes across the system
2. **Multilingual Content**: Always provide translations in all three languages
3. **Population Data**: Include population data for major cities
4. **Capital Designation**: Properly mark capital cities
5. **Search Terms**: Consider adding common search terms for better discoverability

## 🎯 Benefits

1. **Improved User Experience**: More granular location data
2. **Better Search**: Users can search by specific cities
3. **Multilingual Support**: Full support for English, French, and Arabic
4. **Scalable Architecture**: Easy to add more cities and countries
5. **Performance Optimized**: Proper indexing for fast queries
6. **MongoDB Atlas Friendly**: Minimal impact on database performance
