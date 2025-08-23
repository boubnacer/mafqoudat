const axios = require('axios');

// Simple translation mapping for common city name patterns
const translationMappings = {
  // Common city suffixes and their translations
  suffixes: {
    'city': { ar: 'مدينة', fr: 'ville' },
    'town': { ar: 'بلدة', fr: 'ville' },
    'village': { ar: 'قرية', fr: 'village' },
    'port': { ar: 'ميناء', fr: 'port' },
    'beach': { ar: 'شاطئ', fr: 'plage' },
    'mountain': { ar: 'جبل', fr: 'montagne' },
    'valley': { ar: 'وادي', fr: 'vallée' },
    'spring': { ar: 'عين', fr: 'source' },
    'well': { ar: 'بئر', fr: 'puits' },
    'bridge': { ar: 'جسر', fr: 'pont' },
    'fort': { ar: 'قلعة', fr: 'fort' },
    'palace': { ar: 'قصر', fr: 'palais' },
    'tower': { ar: 'برج', fr: 'tour' },
    'garden': { ar: 'حديقة', fr: 'jardin' },
    'market': { ar: 'سوق', fr: 'marché' },
    'square': { ar: 'ميدان', fr: 'place' },
    'street': { ar: 'شارع', fr: 'rue' },
    'road': { ar: 'طريق', fr: 'route' },
    'district': { ar: 'حي', fr: 'quartier' },
    'neighborhood': { ar: 'حي', fr: 'quartier' }
  },
  
  // Common prefixes
  prefixes: {
    'new': { ar: 'جديد', fr: 'nouveau' },
    'old': { ar: 'قديم', fr: 'vieux' },
    'big': { ar: 'كبير', fr: 'grand' },
    'small': { ar: 'صغير', fr: 'petit' },
    'upper': { ar: 'علوي', fr: 'supérieur' },
    'lower': { ar: 'سفلي', fr: 'inférieur' },
    'east': { ar: 'شرق', fr: 'est' },
    'west': { ar: 'غرب', fr: 'ouest' },
    'north': { ar: 'شمال', fr: 'nord' },
    'south': { ar: 'جنوب', fr: 'sud' },
    'central': { ar: 'وسط', fr: 'central' },
    'royal': { ar: 'ملكي', fr: 'royal' },
    'industrial': { ar: 'صناعي', fr: 'industriel' },
    'commercial': { ar: 'تجاري', fr: 'commercial' },
    'residential': { ar: 'سكني', fr: 'résidentiel' }
  }
};

// Common Arabic city names that might be entered
const arabicCityNames = {
  // Common Arabic city patterns
  'الرياض': { en: 'Riyadh', fr: 'Riyad' },
  'جدة': { en: 'Jeddah', fr: 'Djeddah' },
  'مكة': { en: 'Mecca', fr: 'La Mecque' },
  'المدينة': { en: 'Medina', fr: 'Médine' },
  'الدمام': { en: 'Dammam', fr: 'Dammam' },
  'الطائف': { en: 'Taif', fr: 'Taïf' },
  'تبوك': { en: 'Tabuk', fr: 'Tabuk' },
  'أبها': { en: 'Abha', fr: 'Abha' },
  'جيزان': { en: 'Jizan', fr: 'Jizan' },
  'حائل': { en: 'Hail', fr: 'Haïl' },
  'نجران': { en: 'Najran', fr: 'Najran' },
  'الباحة': { en: 'Al Baha', fr: 'Al Baha' },
  'القاهرة': { en: 'Cairo', fr: 'Le Caire' },
  'الإسكندرية': { en: 'Alexandria', fr: 'Alexandrie' },
  'الجيزة': { en: 'Giza', fr: 'Gizeh' },
  'الأقصر': { en: 'Luxor', fr: 'Louxor' },
  'أسوان': { en: 'Aswan', fr: 'Assouan' },
  'الدار البيضاء': { en: 'Casablanca', fr: 'Casablanca' },
  'الرباط': { en: 'Rabat', fr: 'Rabat' },
  'فاس': { en: 'Fez', fr: 'Fès' },
  'مراكش': { en: 'Marrakech', fr: 'Marrakech' },
  'طنجة': { en: 'Tangier', fr: 'Tanger' },
  'أكادير': { en: 'Agadir', fr: 'Agadir' },
  'مكناس': { en: 'Meknes', fr: 'Meknès' },
  'الجزائر': { en: 'Algiers', fr: 'Alger' },
  'وهران': { en: 'Oran', fr: 'Oran' },
  'قسنطينة': { en: 'Constantine', fr: 'Constantine' },
  'عنابة': { en: 'Annaba', fr: 'Annaba' },
  'تونس': { en: 'Tunis', fr: 'Tunis' },
  'صفاقس': { en: 'Sfax', fr: 'Sfax' },
  'سوسة': { en: 'Sousse', fr: 'Sousse' },
  'قابس': { en: 'Gabès', fr: 'Gabès' },
  'أريانة': { en: 'Ariana', fr: 'Ariana' },
  'الرياض': { en: 'Riyadh', fr: 'Riyad' },
  'دبي': { en: 'Dubai', fr: 'Dubaï' },
  'أبو ظبي': { en: 'Abu Dhabi', fr: 'Abou Dabi' },
  'الشارقة': { en: 'Sharjah', fr: 'Charjah' },
  'عجمان': { en: 'Ajman', fr: 'Ajmân' },
  'رأس الخيمة': { en: 'Ras Al Khaimah', fr: 'Ras el Khaïmah' },
  'الدوحة': { en: 'Doha', fr: 'Doha' },
  'الوكرة': { en: 'Al Wakrah', fr: 'Al Wakrah' },
  'الخور': { en: 'Al Khor', fr: 'Al Khor' },
  'الريان': { en: 'Al Rayyan', fr: 'Al Rayyan' },
  'مدينة الكويت': { en: 'Kuwait City', fr: 'Koweït' },
  'الجهراء': { en: 'Al Jahra', fr: 'Al Jahra' },
  'حولي': { en: 'Hawalli', fr: 'Hawalli' },
  'الفروانية': { en: 'Farwaniya', fr: 'Farwaniya' },
  'المنامة': { en: 'Manama', fr: 'Manama' },
  'المحرق': { en: 'Muharraq', fr: 'Muharraq' },
  'الرفاع': { en: 'Riffa', fr: 'Riffa' },
  'مدينة حمد': { en: 'Hamad Town', fr: 'Hamad Town' },
  'مسقط': { en: 'Muscat', fr: 'Mascate' },
  'صلالة': { en: 'Salalah', fr: 'Salalah' },
  'صحار': { en: 'Sohar', fr: 'Sohar' },
  'نزوى': { en: 'Nizwa', fr: 'Nizwa' },
  'عمان': { en: 'Amman', fr: 'Amman' },
  'الزرقاء': { en: 'Zarqa', fr: 'Zarqa' },
  'إربد': { en: 'Irbid', fr: 'Irbid' },
  'السلط': { en: 'Al Salt', fr: 'Al Salt' },
  'بيروت': { en: 'Beirut', fr: 'Beyrouth' },
  'طرابلس': { en: 'Tripoli', fr: 'Tripoli' },
  'صيدا': { en: 'Sidon', fr: 'Saïda' },
  'صور': { en: 'Tyre', fr: 'Tyr' },
  'دمشق': { en: 'Damascus', fr: 'Damas' },
  'حلب': { en: 'Aleppo', fr: 'Alep' },
  'حمص': { en: 'Homs', fr: 'Homs' },
  'اللاذقية': { en: 'Lattakia', fr: 'Lattaquié' },
  'بغداد': { en: 'Baghdad', fr: 'Bagdad' },
  'البصرة': { en: 'Basra', fr: 'Bassora' },
  'الموصل': { en: 'Mosul', fr: 'Mossoul' },
  'أربيل': { en: 'Erbil', fr: 'Erbil' },
  'القدس': { en: 'Jerusalem', fr: 'Jérusalem' },
  'غزة': { en: 'Gaza', fr: 'Gaza' },
  'رام الله': { en: 'Ramallah', fr: 'Ramallah' },
  'الخليل': { en: 'Hebron', fr: 'Hébron' },
  'بنغازي': { en: 'Benghazi', fr: 'Benghazi' },
  'مصراتة': { en: 'Misrata', fr: 'Misrata' },
  'طبرق': { en: 'Tobruk', fr: 'Tobrouk' },
  'الخرطوم': { en: 'Khartoum', fr: 'Khartoum' },
  'أم درمان': { en: 'Omdurman', fr: 'Omdurman' },
  'بورتسودان': { en: 'Port Sudan', fr: 'Port-Soudan' },
  'كسلا': { en: 'Kassala', fr: 'Kassala' },
  'مقديشو': { en: 'Mogadishu', fr: 'Mogadiscio' },
  'هرجيسا': { en: 'Hargeisa', fr: 'Hargeisa' },
  'كيسمايو': { en: 'Kismayo', fr: 'Kismaayo' },
  'بربرة': { en: 'Berbera', fr: 'Berbera' },
  'مدينة جيبوتي': { en: 'Djibouti City', fr: 'Ville de Djibouti' },
  'علي صبيح': { en: 'Ali Sabieh', fr: 'Ali Sabieh' },
  'تجورة': { en: 'Tadjoura', fr: 'Tadjourah' },
  'أوبوك': { en: 'Obock', fr: 'Obock' },
  'موروني': { en: 'Moroni', fr: 'Moroni' },
  'متسامودو': { en: 'Mutsamudu', fr: 'Mutsamudu' },
  'دوموني': { en: 'Domoni', fr: 'Domoni' },
  'فومبوني': { en: 'Fomboni', fr: 'Fomboni' },
  'نواكشوط': { en: 'Nouakchott', fr: 'Nouakchott' },
  'نواذيبو': { en: 'Nouadhibou', fr: 'Nouadhibou' },
  'كيفة': { en: 'Kaedi', fr: 'Kaédi' },
  'باماكو': { en: 'Bamako', fr: 'Bamako' },
  'سيكاسو': { en: 'Sikasso', fr: 'Sikasso' },
  'موبتي': { en: 'Mopti', fr: 'Mopti' },
  'سيغو': { en: 'Segou', fr: 'Ségou' },
  'نيامي': { en: 'Niamey', fr: 'Niamey' },
  'زندر': { en: 'Zinder', fr: 'Zinder' },
  'مرادي': { en: 'Maradi', fr: 'Maradi' },
  'أغاديز': { en: 'Agadez', fr: 'Agadez' },
  'انجمينا': { en: 'N\'Djamena', fr: 'N\'Djamena' },
  'موسورو': { en: 'Mousoro', fr: 'Moussoro' },
  'ساره': { en: 'Sarh', fr: 'Sarh' },
  'أبشي': { en: 'Abéché', fr: 'Abéché' },
  'بانغي': { en: 'Bangui', fr: 'Bangui' },
  'بربراتي': { en: 'Berberati', fr: 'Berbérati' },
  'بوار': { en: 'Bouar', fr: 'Bouar' },
  'بامباري': { en: 'Bambari', fr: 'Bambari' }
};

class TranslationService {
  /**
   * Translate a city name to multiple languages
   * @param {string} cityName - The city name to translate
   * @param {string} sourceLanguage - The source language (en, ar, fr)
   * @returns {Object} - Object with translations for en, ar, fr
   */
  static async translateCityName(cityName, sourceLanguage = 'en') {
    try {
      const normalizedName = cityName.trim().toLowerCase();
      
      // If the input is Arabic, try to find it in our mapping
      if (sourceLanguage === 'ar' || this.isArabicText(cityName)) {
        const arabicTranslation = arabicCityNames[cityName];
        if (arabicTranslation) {
          return {
            en: arabicTranslation.en,
            fr: arabicTranslation.fr,
            ar: cityName
          };
        }
      }
      
      // If it's English, try to translate to Arabic and French
      if (sourceLanguage === 'en' || !this.isArabicText(cityName)) {
        // Check if we have a direct mapping
        const directMapping = arabicCityNames[cityName];
        if (directMapping) {
          return {
            en: cityName,
            fr: directMapping.fr,
            ar: directMapping.ar
          };
        }
        
        // Try to use a translation API (Google Translate or similar)
        const translations = await this.translateWithAPI(cityName, sourceLanguage);
        if (translations) {
          return translations;
        }
      }
      
      // Fallback: return the same name for all languages
      return {
        en: cityName,
        fr: cityName,
        ar: cityName
      };
      
    } catch (error) {
      console.error('Translation error:', error);
      // Fallback: return the same name for all languages
      return {
        en: cityName,
        fr: cityName,
        ar: cityName
      };
    }
  }
  
  /**
   * Check if text contains Arabic characters
   */
  static isArabicText(text) {
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    return arabicRegex.test(text);
  }
  
  /**
   * Try to translate using an external API
   */
  static async translateWithAPI(text, sourceLanguage) {
    try {
      // For now, we'll use a simple approach
      // In production, you could integrate with Google Translate API or similar
      
      // Simple word-by-word translation for common words
      let translatedText = text;
      
      // Translate common words
      for (const [english, translations] of Object.entries(translationMappings.suffixes)) {
        const regex = new RegExp(`\\b${english}\\b`, 'gi');
        if (regex.test(translatedText)) {
          translatedText = translatedText.replace(regex, translations.ar);
        }
      }
      
      for (const [english, translations] of Object.entries(translationMappings.prefixes)) {
        const regex = new RegExp(`\\b${english}\\b`, 'gi');
        if (regex.test(translatedText)) {
          translatedText = translatedText.replace(regex, translations.ar);
        }
      }
      
      // For French, we'll keep it simple for now
      const frenchText = text; // Could be enhanced with French translation logic
      
      return {
        en: text,
        fr: frenchText,
        ar: translatedText
      };
      
    } catch (error) {
      console.error('API translation error:', error);
      return null;
    }
  }
  
  /**
   * Generate a unique code for a city
   */
  static generateCityCode(cityName, countryCode) {
    const normalizedName = cityName
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .toUpperCase();
    
    return `${countryCode}_${normalizedName}`;
  }
}

module.exports = TranslationService;
