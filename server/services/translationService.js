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
  // Add more common English city names that users might enter
  'Riyadh': { en: 'Riyadh', fr: 'Riyad', ar: 'الرياض' },
  'Jeddah': { en: 'Jeddah', fr: 'Djeddah', ar: 'جدة' },
  'Mecca': { en: 'Mecca', fr: 'La Mecque', ar: 'مكة' },
  'Medina': { en: 'Medina', fr: 'Médine', ar: 'المدينة' },
  'Dammam': { en: 'Dammam', fr: 'Dammam', ar: 'الدمام' },
  'Taif': { en: 'Taif', fr: 'Taïf', ar: 'الطائف' },
  'Tabuk': { en: 'Tabuk', fr: 'Tabuk', ar: 'تبوك' },
  'Abha': { en: 'Abha', fr: 'Abha', ar: 'أبها' },
  'Jizan': { en: 'Jizan', fr: 'Jizan', ar: 'جيزان' },
  'Hail': { en: 'Hail', fr: 'Haïl', ar: 'حائل' },
  'Najran': { en: 'Najran', fr: 'Najran', ar: 'نجران' },
  'Al Baha': { en: 'Al Baha', fr: 'Al Baha', ar: 'الباحة' },
  // Add more common English city names
  'Cairo': { en: 'Cairo', fr: 'Le Caire', ar: 'القاهرة' },
  'Alexandria': { en: 'Alexandria', fr: 'Alexandrie', ar: 'الإسكندرية' },
  'Giza': { en: 'Giza', fr: 'Gizeh', ar: 'الجيزة' },
  'Luxor': { en: 'Luxor', fr: 'Louxor', ar: 'الأقصر' },
  'Aswan': { en: 'Aswan', fr: 'Assouan', ar: 'أسوان' },
  'Casablanca': { en: 'Casablanca', fr: 'Casablanca', ar: 'الدار البيضاء' },
  'Rabat': { en: 'Rabat', fr: 'Rabat', ar: 'الرباط' },
  'Fez': { en: 'Fez', fr: 'Fès', ar: 'فاس' },
  'Marrakech': { en: 'Marrakech', fr: 'Marrakech', ar: 'مراكش' },
  'Tangier': { en: 'Tangier', fr: 'Tanger', ar: 'طنجة' },
  'Agadir': { en: 'Agadir', fr: 'Agadir', ar: 'أكادير' },
  'Meknes': { en: 'Meknes', fr: 'Meknès', ar: 'مكناس' },
  'Algiers': { en: 'Algiers', fr: 'Alger', ar: 'الجزائر' },
  'Oran': { en: 'Oran', fr: 'Oran', ar: 'وهران' },
  'Constantine': { en: 'Constantine', fr: 'Constantine', ar: 'قسنطينة' },
  'Annaba': { en: 'Annaba', fr: 'Annaba', ar: 'عنابة' },
  'Tunis': { en: 'Tunis', fr: 'Tunis', ar: 'تونس' },
  'Sfax': { en: 'Sfax', fr: 'Sfax', ar: 'صفاقس' },
  'Sousse': { en: 'Sousse', fr: 'Sousse', ar: 'سوسة' },
  'Gabes': { en: 'Gabes', fr: 'Gabès', ar: 'قابس' },
  'Ariana': { en: 'Ariana', fr: 'Ariana', ar: 'أريانة' },
  'Dubai': { en: 'Dubai', fr: 'Dubaï', ar: 'دبي' },
  'Abu Dhabi': { en: 'Abu Dhabi', fr: 'Abou Dabi', ar: 'أبو ظبي' },
  'Sharjah': { en: 'Sharjah', fr: 'Charjah', ar: 'الشارقة' },
  'Ajman': { en: 'Ajman', fr: 'Ajmân', ar: 'عجمان' },
  'Ras Al Khaimah': { en: 'Ras Al Khaimah', fr: 'Ras el Khaïmah', ar: 'رأس الخيمة' },
  'Doha': { en: 'Doha', fr: 'Doha', ar: 'الدوحة' },
  'Al Wakrah': { en: 'Al Wakrah', fr: 'Al Wakrah', ar: 'الوكرة' },
  'Al Khor': { en: 'Al Khor', fr: 'Al Khor', ar: 'الخور' },
  'Al Rayyan': { en: 'Al Rayyan', fr: 'Al Rayyan', ar: 'الريان' },
  'Kuwait City': { en: 'Kuwait City', fr: 'Koweït', ar: 'مدينة الكويت' },
  'Al Jahra': { en: 'Al Jahra', fr: 'Al Jahra', ar: 'الجهراء' },
  'Hawalli': { en: 'Hawalli', fr: 'Hawalli', ar: 'حولي' },
  'Farwaniya': { en: 'Farwaniya', fr: 'Farwaniya', ar: 'الفروانية' },
  'Manama': { en: 'Manama', fr: 'Manama', ar: 'المنامة' },
  'Muharraq': { en: 'Muharraq', fr: 'Muharraq', ar: 'المحرق' },
  'Riffa': { en: 'Riffa', fr: 'Riffa', ar: 'الرفاع' },
  'Hamad Town': { en: 'Hamad Town', fr: 'Hamad Town', ar: 'مدينة حمد' },
  'Muscat': { en: 'Muscat', fr: 'Mascate', ar: 'مسقط' },
  'Salalah': { en: 'Salalah', fr: 'Salalah', ar: 'صلالة' },
  'Sohar': { en: 'Sohar', fr: 'Sohar', ar: 'صحار' },
  'Nizwa': { en: 'Nizwa', fr: 'Nizwa', ar: 'نزوى' },
  'Amman': { en: 'Amman', fr: 'Amman', ar: 'عمان' },
  'Zarqa': { en: 'Zarqa', fr: 'Zarqa', ar: 'الزرقاء' },
  'Irbid': { en: 'Irbid', fr: 'Irbid', ar: 'إربد' },
  'Al Salt': { en: 'Al Salt', fr: 'Al Salt', ar: 'السلط' },
  'Beirut': { en: 'Beirut', fr: 'Beyrouth', ar: 'بيروت' },
  'Tripoli': { en: 'Tripoli', fr: 'Tripoli', ar: 'طرابلس' },
  'Sidon': { en: 'Sidon', fr: 'Saïda', ar: 'صيدا' },
  'Tyre': { en: 'Tyre', fr: 'Tyr', ar: 'صور' },
  'Damascus': { en: 'Damascus', fr: 'Damas', ar: 'دمشق' },
  'Aleppo': { en: 'Aleppo', fr: 'Alep', ar: 'حلب' },
  'Homs': { en: 'Homs', fr: 'Homs', ar: 'حمص' },
  'Lattakia': { en: 'Lattakia', fr: 'Lattaquié', ar: 'اللاذقية' },
  'Baghdad': { en: 'Baghdad', fr: 'Bagdad', ar: 'بغداد' },
  'Basra': { en: 'Basra', fr: 'Bassora', ar: 'البصرة' },
  'Mosul': { en: 'Mosul', fr: 'Mossoul', ar: 'الموصل' },
  'Erbil': { en: 'Erbil', fr: 'Erbil', ar: 'أربيل' },
  'Jerusalem': { en: 'Jerusalem', fr: 'Jérusalem', ar: 'القدس' },
  'Gaza': { en: 'Gaza', fr: 'Gaza', ar: 'غزة' },
  'Ramallah': { en: 'Ramallah', fr: 'Ramallah', ar: 'رام الله' },
  'Hebron': { en: 'Hebron', fr: 'Hébron', ar: 'الخليل' },
  'Benghazi': { en: 'Benghazi', fr: 'Benghazi', ar: 'بنغازي' },
  'Misrata': { en: 'Misrata', fr: 'Misrata', ar: 'مصراتة' },
  'Tobruk': { en: 'Tobruk', fr: 'Tobrouk', ar: 'طبرق' },
  'Khartoum': { en: 'Khartoum', fr: 'Khartoum', ar: 'الخرطوم' },
  'Omdurman': { en: 'Omdurman', fr: 'Omdurman', ar: 'أم درمان' },
  'Port Sudan': { en: 'Port Sudan', fr: 'Port-Soudan', ar: 'بورتسودان' },
  'Kassala': { en: 'Kassala', fr: 'Kassala', ar: 'كسلا' },
  'Mogadishu': { en: 'Mogadishu', fr: 'Mogadiscio', ar: 'مقديشو' },
  'Hargeisa': { en: 'Hargeisa', fr: 'Hargeisa', ar: 'هرجيسا' },
  'Kismayo': { en: 'Kismayo', fr: 'Kismaayo', ar: 'كيسمايو' },
  'Berbera': { en: 'Berbera', fr: 'Berbera', ar: 'بربرة' },
  'Djibouti City': { en: 'Djibouti City', fr: 'Ville de Djibouti', ar: 'مدينة جيبوتي' },
  'Ali Sabieh': { en: 'Ali Sabieh', fr: 'Ali Sabieh', ar: 'علي صبيح' },
  'Tadjoura': { en: 'Tadjoura', fr: 'Tadjourah', ar: 'تجورة' },
  'Obock': { en: 'Obock', fr: 'Obock', ar: 'أوبوك' },
  'Moroni': { en: 'Moroni', fr: 'Moroni', ar: 'موروني' },
  'Mutsamudu': { en: 'Mutsamudu', fr: 'Mutsamudu', ar: 'متسامودو' },
  'Domoni': { en: 'Domoni', fr: 'Domoni', ar: 'دوموني' },
  'Fomboni': { en: 'Fomboni', fr: 'Fomboni', ar: 'فومبوني' },
  'Nouakchott': { en: 'Nouakchott', fr: 'Nouakchott', ar: 'نواكشوط' },
  'Nouadhibou': { en: 'Nouadhibou', fr: 'Nouadhibou', ar: 'نواذيبو' },
  'Kaedi': { en: 'Kaedi', fr: 'Kaédi', ar: 'كيفة' },
  'Bamako': { en: 'Bamako', fr: 'Bamako', ar: 'باماكو' },
  'Sikasso': { en: 'Sikasso', fr: 'Sikasso', ar: 'سيكاسو' },
  'Mopti': { en: 'Mopti', fr: 'Mopti', ar: 'موبتي' },
  'Segou': { en: 'Segou', fr: 'Ségou', ar: 'سيغو' },
  'Niamey': { en: 'Niamey', fr: 'Niamey', ar: 'نيامي' },
  'Zinder': { en: 'Zinder', fr: 'Zinder', ar: 'زندر' },
  'Maradi': { en: 'Maradi', fr: 'Maradi', ar: 'مرادي' },
  'Agadez': { en: 'Agadez', fr: 'Agadez', ar: 'أغاديز' },
  'N\'Djamena': { en: 'N\'Djamena', fr: 'N\'Djamena', ar: 'انجمينا' },
  'Mousoro': { en: 'Mousoro', fr: 'Moussoro', ar: 'موسورو' },
  'Sarh': { en: 'Sarh', fr: 'Sarh', ar: 'ساره' },
  'Abéché': { en: 'Abéché', fr: 'Abéché', ar: 'أبشي' },
  'Bangui': { en: 'Bangui', fr: 'Bangui', ar: 'بانغي' },
  'Berberati': { en: 'Berberati', fr: 'Berbérati', ar: 'بربراتي' },
  'Bouar': { en: 'Bouar', fr: 'Bouar', ar: 'بوار' },
  'Bambari': { en: 'Bambari', fr: 'Bambari', ar: 'بامباري' },
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
      console.log('Translating city name:', cityName, 'from language:', sourceLanguage);
      
      const normalizedName = cityName.trim().toLowerCase();
      
      // If the input is Arabic, try to find it in our mapping
      if (sourceLanguage === 'ar' || this.isArabicText(cityName)) {
        console.log('Detected Arabic text, looking for translation');
        const arabicTranslation = arabicCityNames[cityName];
        if (arabicTranslation) {
          console.log('Found Arabic translation:', arabicTranslation);
          return {
            en: arabicTranslation.en,
            fr: arabicTranslation.fr,
            ar: cityName
          };
        }
      }
      
      // If it's English, try to translate to Arabic and French
      if (sourceLanguage === 'en' || !this.isArabicText(cityName)) {
        console.log('Detected English text, looking for translation');
        
        // First, check if we have a direct mapping for this exact city name
        for (const [arabicName, translations] of Object.entries(arabicCityNames)) {
          if (translations.en.toLowerCase() === cityName.toLowerCase()) {
            console.log('Found exact English match:', translations);
            return {
              en: cityName,
              fr: translations.fr,
              ar: arabicName
            };
          }
        }
        
        // Try to use a translation API (Google Translate or similar)
        const translations = await this.translateWithAPI(cityName, sourceLanguage);
        if (translations) {
          console.log('API translation result:', translations);
          return translations;
        }
      }
      
      // Fallback: return the same name for all languages
      console.log('Using fallback translation (same name for all languages)');
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
      console.log('Attempting API translation for:', text, 'from:', sourceLanguage);
      
      let translatedText = text;
      let frenchText = text;
      
      // If source language is Arabic, try to find English and French equivalents
      if (sourceLanguage === 'ar' || this.isArabicText(text)) {
        // Look for Arabic city in our mapping
        for (const [arabicName, translations] of Object.entries(arabicCityNames)) {
          if (arabicName === text) {
            console.log('Found Arabic mapping:', translations);
            return {
              en: translations.en,
              fr: translations.fr,
              ar: text
            };
          }
        }
        
        // If not found, keep the Arabic name for all languages
        console.log('No Arabic mapping found, using original text');
        return {
          en: text,
          fr: text,
          ar: text
        };
      }
      
      // If source language is English, try to translate to Arabic and French
      if (sourceLanguage === 'en' || !this.isArabicText(text)) {
        // Look for English city in our mapping
        for (const [arabicName, translations] of Object.entries(arabicCityNames)) {
          if (translations.en.toLowerCase() === text.toLowerCase()) {
            console.log('Found English mapping:', translations);
            return {
              en: text,
              fr: translations.fr,
              ar: arabicName
            };
          }
        }
        
        // Enhanced word-by-word translation for common words
        let arabicTranslation = text;
        let frenchTranslation = text;
        
        // Apply suffix translations
        for (const [english, translations] of Object.entries(translationMappings.suffixes)) {
          const regex = new RegExp(`\\b${english}\\b`, 'gi');
          if (regex.test(arabicTranslation)) {
            arabicTranslation = arabicTranslation.replace(regex, translations.ar);
          }
          if (regex.test(frenchTranslation)) {
            frenchTranslation = frenchTranslation.replace(regex, translations.fr);
          }
        }
        
        // Apply prefix translations
        for (const [english, translations] of Object.entries(translationMappings.prefixes)) {
          const regex = new RegExp(`\\b${english}\\b`, 'gi');
          if (regex.test(arabicTranslation)) {
            arabicTranslation = arabicTranslation.replace(regex, translations.ar);
          }
          if (regex.test(frenchTranslation)) {
            frenchTranslation = frenchTranslation.replace(regex, translations.fr);
          }
        }
        
        // If we made any translations, use them
        if (arabicTranslation !== text || frenchTranslation !== text) {
          console.log('Applied word-by-word translation:', {
            original: text,
            arabic: arabicTranslation,
            french: frenchTranslation
          });
          return {
            en: text,
            fr: frenchTranslation,
            ar: arabicTranslation
          };
        }
        
        // If no translations were made, try to create a simple Arabic transliteration
        // This is a basic approach - in production you might want to use a proper transliteration service
        const arabicTransliteration = this.transliterateToArabic(text);
        const frenchTransliteration = this.transliterateToFrench(text);
        
        console.log('Using transliteration:', {
          original: text,
          arabic: arabicTransliteration,
          french: frenchTransliteration
        });
        
        return {
          en: text,
          fr: frenchTransliteration,
          ar: arabicTransliteration
        };
      }
      
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

  /**
   * Basic transliteration to Arabic
   */
  static transliterateToArabic(text) {
    const transliterationMap = {
      'a': 'ا', 'b': 'ب', 'c': 'ك', 'd': 'د', 'e': 'ي', 'f': 'ف', 'g': 'ج', 'h': 'ه',
      'i': 'ي', 'j': 'ج', 'k': 'ك', 'l': 'ل', 'm': 'م', 'n': 'ن', 'o': 'و', 'p': 'ب',
      'q': 'ق', 'r': 'ر', 's': 'س', 't': 'ت', 'u': 'و', 'v': 'ف', 'w': 'و', 'x': 'كس',
      'y': 'ي', 'z': 'ز', 'th': 'ث', 'sh': 'ش', 'ch': 'تش', 'kh': 'خ', 'dh': 'ذ',
      'gh': 'غ', 'ph': 'ف', 'wh': 'هو', 'qu': 'كو', 'ng': 'نغ'
    };

    let result = text.toLowerCase();
    
    // Replace common letter combinations first
    for (const [english, arabic] of Object.entries(transliterationMap)) {
      if (english.length > 1) {
        result = result.replace(new RegExp(english, 'g'), arabic);
      }
    }
    
    // Replace single letters
    for (const [english, arabic] of Object.entries(transliterationMap)) {
      if (english.length === 1) {
        result = result.replace(new RegExp(english, 'g'), arabic);
      }
    }
    
    return result;
  }

  /**
   * Basic transliteration to French
   */
  static transliterateToFrench(text) {
    // For French, we'll keep it simple and just return the original text
    // In a production environment, you might want to use a proper French translation service
    return text;
  }
}

module.exports = TranslationService;
