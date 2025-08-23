const mongoose = require("mongoose");
const City = require("../models/City");
const Country = require("../models/Country");
require('dotenv').config();

// Comprehensive cities data for ALL 25 Arabic countries with multilingual support (population field removed)
const citiesData = [
  // Morocco (MA) - Major cities
  {
    countryCode: 'MA',
    cities: [
      { code: 'CASABLANCA', labels: { en: 'Casablanca', fr: 'Casablanca', ar: 'الدار البيضاء' }, names: { en: 'Casablanca', fr: 'Casablanca', ar: 'الدار البيضاء' }, isCapital: false },
      { code: 'RABAT', labels: { en: 'Rabat', fr: 'Rabat', ar: 'الرباط' }, names: { en: 'Rabat', fr: 'Rabat', ar: 'الرباط' }, isCapital: true },
      { code: 'FES', labels: { en: 'Fez', fr: 'Fès', ar: 'فاس' }, names: { en: 'Fez', fr: 'Fès', ar: 'فاس' }, isCapital: false },
      { code: 'MARRAKECH', labels: { en: 'Marrakech', fr: 'Marrakech', ar: 'مراكش' }, names: { en: 'Marrakech', fr: 'Marrakech', ar: 'مراكش' }, isCapital: false },
      { code: 'TANGIER', labels: { en: 'Tangier', fr: 'Tanger', ar: 'طنجة' }, names: { en: 'Tangier', fr: 'Tanger', ar: 'طنجة' }, isCapital: false },
      { code: 'AGADIR', labels: { en: 'Agadir', fr: 'Agadir', ar: 'أكادير' }, names: { en: 'Agadir', fr: 'Agadir', ar: 'أكادير' }, isCapital: false },
      { code: 'MEKNES', labels: { en: 'Meknes', fr: 'Meknès', ar: 'مكناس' }, names: { en: 'Meknes', fr: 'Meknès', ar: 'مكناس' }, isCapital: false }
    ]
  },
  // Algeria (DZ) - Major cities
  {
    countryCode: 'DZ',
    cities: [
      { code: 'ALGIERS', labels: { en: 'Algiers', fr: 'Alger', ar: 'الجزائر' }, names: { en: 'Algiers', fr: 'Alger', ar: 'الجزائر' }, isCapital: true },
      { code: 'ORAN', labels: { en: 'Oran', fr: 'Oran', ar: 'وهران' }, names: { en: 'Oran', fr: 'Oran', ar: 'وهران' }, isCapital: false },
      { code: 'CONSTANTINE', labels: { en: 'Constantine', fr: 'Constantine', ar: 'قسنطينة' }, names: { en: 'Constantine', fr: 'Constantine', ar: 'قسنطينة' }, isCapital: false },
      { code: 'ANNABA', labels: { en: 'Annaba', fr: 'Annaba', ar: 'عنابة' }, names: { en: 'Annaba', fr: 'Annaba', ar: 'عنابة' }, isCapital: false },
      { code: 'BATNA', labels: { en: 'Batna', fr: 'Batna', ar: 'باتنة' }, names: { en: 'Batna', fr: 'Batna', ar: 'باتنة' }, isCapital: false },
      { code: 'BLIDA', labels: { en: 'Blida', fr: 'Blida', ar: 'البليدة' }, names: { en: 'Blida', fr: 'Blida', ar: 'البليدة' }, isCapital: false }
    ]
  },
  // Tunisia (TN) - Major cities
  {
    countryCode: 'TN',
    cities: [
      { code: 'TUNIS', labels: { en: 'Tunis', fr: 'Tunis', ar: 'تونس' }, names: { en: 'Tunis', fr: 'Tunis', ar: 'تونس' }, isCapital: true },
      { code: 'SFAX', labels: { en: 'Sfax', fr: 'Sfax', ar: 'صفاقس' }, names: { en: 'Sfax', fr: 'Sfax', ar: 'صفاقس' }, isCapital: false },
      { code: 'SOUSSE', labels: { en: 'Sousse', fr: 'Sousse', ar: 'سوسة' }, names: { en: 'Sousse', fr: 'Sousse', ar: 'سوسة' }, isCapital: false },
      { code: 'GABES', labels: { en: 'Gabès', fr: 'Gabès', ar: 'قابس' }, names: { en: 'Gabès', fr: 'Gabès', ar: 'قابس' }, isCapital: false },
      { code: 'ARIANA', labels: { en: 'Ariana', fr: 'Ariana', ar: 'أريانة' }, names: { en: 'Ariana', fr: 'Ariana', ar: 'أريانة' }, isCapital: false }
    ]
  },
  // Egypt (EG) - Major cities
  {
    countryCode: 'EG',
    cities: [
      { code: 'CAIRO', labels: { en: 'Cairo', fr: 'Le Caire', ar: 'القاهرة' }, names: { en: 'Cairo', fr: 'Le Caire', ar: 'القاهرة' }, isCapital: true },
      { code: 'ALEXANDRIA', labels: { en: 'Alexandria', fr: 'Alexandrie', ar: 'الإسكندرية' }, names: { en: 'Alexandria', fr: 'Alexandrie', ar: 'الإسكندرية' }, isCapital: false },
      { code: 'GIZA', labels: { en: 'Giza', fr: 'Gizeh', ar: 'الجيزة' }, names: { en: 'Giza', fr: 'Gizeh', ar: 'الجيزة' }, isCapital: false },
      { code: 'SHARM_EL_SHEIKH', labels: { en: 'Sharm El Sheikh', fr: 'Charm el-Cheikh', ar: 'شرم الشيخ' }, names: { en: 'Sharm El Sheikh', fr: 'Charm el-Cheikh', ar: 'شرم الشيخ' }, isCapital: false },
      { code: 'LUXOR', labels: { en: 'Luxor', fr: 'Louxor', ar: 'الأقصر' }, names: { en: 'Luxor', fr: 'Louxor', ar: 'الأقصر' }, isCapital: false },
      { code: 'ASWAN', labels: { en: 'Aswan', fr: 'Assouan', ar: 'أسوان' }, names: { en: 'Aswan', fr: 'Assouan', ar: 'أسوان' }, isCapital: false }
    ]
  },
  // Saudi Arabia (SA) - Major cities
  {
    countryCode: 'SA',
    cities: [
      { code: 'RIYADH', labels: { en: 'Riyadh', fr: 'Riyad', ar: 'الرياض' }, names: { en: 'Riyadh', fr: 'Riyad', ar: 'الرياض' }, isCapital: true },
      { code: 'JEDDAH', labels: { en: 'Jeddah', fr: 'Djeddah', ar: 'جدة' }, names: { en: 'Jeddah', fr: 'Djeddah', ar: 'جدة' }, isCapital: false },
      { code: 'MECCA', labels: { en: 'Mecca', fr: 'La Mecque', ar: 'مكة المكرمة' }, names: { en: 'Mecca', fr: 'La Mecque', ar: 'مكة المكرمة' }, isCapital: false },
      { code: 'MEDINA', labels: { en: 'Medina', fr: 'Médine', ar: 'المدينة المنورة' }, names: { en: 'Medina', fr: 'Médine', ar: 'المدينة المنورة' }, isCapital: false },
      { code: 'DAMMAM', labels: { en: 'Dammam', fr: 'Dammam', ar: 'الدمام' }, names: { en: 'Dammam', fr: 'Dammam', ar: 'الدمام' }, isCapital: false },
      { code: 'TAIF', labels: { en: 'Taif', fr: 'Taïf', ar: 'الطائف' }, names: { en: 'Taif', fr: 'Taïf', ar: 'الطائف' }, isCapital: false }
    ]
  },
  // UAE (AE) - Major cities
  {
    countryCode: 'AE',
    cities: [
      { code: 'DUBAI', labels: { en: 'Dubai', fr: 'Dubaï', ar: 'دبي' }, names: { en: 'Dubai', fr: 'Dubaï', ar: 'دبي' }, isCapital: false },
      { code: 'ABU_DHABI', labels: { en: 'Abu Dhabi', fr: 'Abou Dabi', ar: 'أبو ظبي' }, names: { en: 'Abu Dhabi', fr: 'Abou Dabi', ar: 'أبو ظبي' }, isCapital: true },
      { code: 'SHARJAH', labels: { en: 'Sharjah', fr: 'Charjah', ar: 'الشارقة' }, names: { en: 'Sharjah', fr: 'Charjah', ar: 'الشارقة' }, isCapital: false },
      { code: 'AJMAN', labels: { en: 'Ajman', fr: 'Ajmân', ar: 'عجمان' }, names: { en: 'Ajman', fr: 'Ajmân', ar: 'عجمان' }, isCapital: false },
      { code: 'RAS_AL_KHAIMAH', labels: { en: 'Ras Al Khaimah', fr: 'Ras el Khaïmah', ar: 'رأس الخيمة' }, names: { en: 'Ras Al Khaimah', fr: 'Ras el Khaïmah', ar: 'رأس الخيمة' }, isCapital: false }
    ]
  },
  // Qatar (QA) - Major cities
  {
    countryCode: 'QA',
    cities: [
      { code: 'DOHA', labels: { en: 'Doha', fr: 'Doha', ar: 'الدوحة' }, names: { en: 'Doha', fr: 'Doha', ar: 'الدوحة' }, isCapital: true },
      { code: 'AL_WAKRAH', labels: { en: 'Al Wakrah', fr: 'Al Wakrah', ar: 'الوكرة' }, names: { en: 'Al Wakrah', fr: 'Al Wakrah', ar: 'الوكرة' }, isCapital: false },
      { code: 'AL_KHOR', labels: { en: 'Al Khor', fr: 'Al Khor', ar: 'الخور' }, names: { en: 'Al Khor', fr: 'Al Khor', ar: 'الخور' }, isCapital: false },
      { code: 'AL_RAYYAN', labels: { en: 'Al Rayyan', fr: 'Al Rayyan', ar: 'الريان' }, names: { en: 'Al Rayyan', fr: 'Al Rayyan', ar: 'الريان' }, isCapital: false }
    ]
  },
  // Kuwait (KW) - Major cities
  {
    countryCode: 'KW',
    cities: [
      { code: 'KUWAIT_CITY', labels: { en: 'Kuwait City', fr: 'Koweït', ar: 'مدينة الكويت' }, names: { en: 'Kuwait City', fr: 'Koweït', ar: 'مدينة الكويت' }, isCapital: true },
      { code: 'JAHRA', labels: { en: 'Al Jahra', fr: 'Al Jahra', ar: 'الجهراء' }, names: { en: 'Al Jahra', fr: 'Al Jahra', ar: 'الجهراء' }, isCapital: false },
      { code: 'HAWALLI', labels: { en: 'Hawalli', fr: 'Hawalli', ar: 'حولي' }, names: { en: 'Hawalli', fr: 'Hawalli', ar: 'حولي' }, isCapital: false },
      { code: 'FARWANIYA', labels: { en: 'Farwaniya', fr: 'Farwaniya', ar: 'الفروانية' }, names: { en: 'Farwaniya', fr: 'Farwaniya', ar: 'الفروانية' }, isCapital: false }
    ]
  },
  // Bahrain (BH) - Major cities
  {
    countryCode: 'BH',
    cities: [
      { code: 'MANAMA', labels: { en: 'Manama', fr: 'Manama', ar: 'المنامة' }, names: { en: 'Manama', fr: 'Manama', ar: 'المنامة' }, isCapital: true },
      { code: 'MUHARRAQ', labels: { en: 'Muharraq', fr: 'Muharraq', ar: 'المحرق' }, names: { en: 'Muharraq', fr: 'Muharraq', ar: 'المحرق' }, isCapital: false },
      { code: 'RIFA', labels: { en: 'Riffa', fr: 'Riffa', ar: 'الرفاع' }, names: { en: 'Riffa', fr: 'Riffa', ar: 'الرفاع' }, isCapital: false },
      { code: 'HAMAD_TOWN', labels: { en: 'Hamad Town', fr: 'Hamad Town', ar: 'مدينة حمد' }, names: { en: 'Hamad Town', fr: 'Hamad Town', ar: 'مدينة حمد' }, isCapital: false }
    ]
  },
  // Oman (OM) - Major cities
  {
    countryCode: 'OM',
    cities: [
      { code: 'MUSCAT', labels: { en: 'Muscat', fr: 'Mascate', ar: 'مسقط' }, names: { en: 'Muscat', fr: 'Mascate', ar: 'مسقط' }, isCapital: true },
      { code: 'SALALAH', labels: { en: 'Salalah', fr: 'Salalah', ar: 'صلالة' }, names: { en: 'Salalah', fr: 'Salalah', ar: 'صلالة' }, isCapital: false },
      { code: 'SOHAR', labels: { en: 'Sohar', fr: 'Sohar', ar: 'صحار' }, names: { en: 'Sohar', fr: 'Sohar', ar: 'صحار' }, isCapital: false },
      { code: 'NIZWA', labels: { en: 'Nizwa', fr: 'Nizwa', ar: 'نزوى' }, names: { en: 'Nizwa', fr: 'Nizwa', ar: 'نزوى' }, isCapital: false }
    ]
  },
  // Jordan (JO) - Major cities
  {
    countryCode: 'JO',
    cities: [
      { code: 'AMMAN', labels: { en: 'Amman', fr: 'Amman', ar: 'عمان' }, names: { en: 'Amman', fr: 'Amman', ar: 'عمان' }, isCapital: true },
      { code: 'ZARQA', labels: { en: 'Zarqa', fr: 'Zarqa', ar: 'الزرقاء' }, names: { en: 'Zarqa', fr: 'Zarqa', ar: 'الزرقاء' }, isCapital: false },
      { code: 'IRBID', labels: { en: 'Irbid', fr: 'Irbid', ar: 'إربد' }, names: { en: 'Irbid', fr: 'Irbid', ar: 'إربد' }, isCapital: false },
      { code: 'AL_SALT', labels: { en: 'Al Salt', fr: 'Al Salt', ar: 'السلط' }, names: { en: 'Al Salt', fr: 'Al Salt', ar: 'السلط' }, isCapital: false }
    ]
  },
  // Lebanon (LB) - Major cities
  {
    countryCode: 'LB',
    cities: [
      { code: 'BEIRUT', labels: { en: 'Beirut', fr: 'Beyrouth', ar: 'بيروت' }, names: { en: 'Beirut', fr: 'Beyrouth', ar: 'بيروت' }, isCapital: true },
      { code: 'TRIPOLI', labels: { en: 'Tripoli', fr: 'Tripoli', ar: 'طرابلس' }, names: { en: 'Tripoli', fr: 'Tripoli', ar: 'طرابلس' }, isCapital: false },
      { code: 'SIDON', labels: { en: 'Sidon', fr: 'Saïda', ar: 'صيدا' }, names: { en: 'Sidon', fr: 'Saïda', ar: 'صيدا' }, isCapital: false },
      { code: 'TYRE', labels: { en: 'Tyre', fr: 'Tyr', ar: 'صور' }, names: { en: 'Tyre', fr: 'Tyr', ar: 'صور' }, isCapital: false }
    ]
  },
  // Syria (SY) - Major cities
  {
    countryCode: 'SY',
    cities: [
      { code: 'DAMASCUS', labels: { en: 'Damascus', fr: 'Damas', ar: 'دمشق' }, names: { en: 'Damascus', fr: 'Damas', ar: 'دمشق' }, isCapital: true },
      { code: 'ALEPPO', labels: { en: 'Aleppo', fr: 'Alep', ar: 'حلب' }, names: { en: 'Aleppo', fr: 'Alep', ar: 'حلب' }, isCapital: false },
      { code: 'HOMS', labels: { en: 'Homs', fr: 'Homs', ar: 'حمص' }, names: { en: 'Homs', fr: 'Homs', ar: 'حمص' }, isCapital: false },
      { code: 'LATTAKIA', labels: { en: 'Lattakia', fr: 'Lattaquié', ar: 'اللاذقية' }, names: { en: 'Lattakia', fr: 'Lattaquié', ar: 'اللاذقية' }, isCapital: false }
    ]
  },
  // Iraq (IQ) - Major cities
  {
    countryCode: 'IQ',
    cities: [
      { code: 'BAGHDAD', labels: { en: 'Baghdad', fr: 'Bagdad', ar: 'بغداد' }, names: { en: 'Baghdad', fr: 'Bagdad', ar: 'بغداد' }, isCapital: true },
      { code: 'BASRA', labels: { en: 'Basra', fr: 'Bassora', ar: 'البصرة' }, names: { en: 'Basra', fr: 'Bassora', ar: 'البصرة' }, isCapital: false },
      { code: 'MOSUL', labels: { en: 'Mosul', fr: 'Mossoul', ar: 'الموصل' }, names: { en: 'Mosul', fr: 'Mossoul', ar: 'الموصل' }, isCapital: false },
      { code: 'ERBIL', labels: { en: 'Erbil', fr: 'Erbil', ar: 'أربيل' }, names: { en: 'Erbil', fr: 'Erbil', ar: 'أربيل' }, isCapital: false }
    ]
  },
  // Palestine (PS) - Major cities
  {
    countryCode: 'PS',
    cities: [
      { code: 'JERUSALEM', labels: { en: 'Jerusalem', fr: 'Jérusalem', ar: 'القدس' }, names: { en: 'Jerusalem', fr: 'Jérusalem', ar: 'القدس' }, isCapital: true },
      { code: 'GAZA', labels: { en: 'Gaza', fr: 'Gaza', ar: 'غزة' }, names: { en: 'Gaza', fr: 'Gaza', ar: 'غزة' }, isCapital: false },
      { code: 'RAMALLAH', labels: { en: 'Ramallah', fr: 'Ramallah', ar: 'رام الله' }, names: { en: 'Ramallah', fr: 'Ramallah', ar: 'رام الله' }, isCapital: false },
      { code: 'HEBRON', labels: { en: 'Hebron', fr: 'Hébron', ar: 'الخليل' }, names: { en: 'Hebron', fr: 'Hébron', ar: 'الخليل' }, isCapital: false }
    ]
  },
  // Libya (LY) - Major cities
  {
    countryCode: 'LY',
    cities: [
      { code: 'TRIPOLI', labels: { en: 'Tripoli', fr: 'Tripoli', ar: 'طرابلس' }, names: { en: 'Tripoli', fr: 'Tripoli', ar: 'طرابلس' }, isCapital: true },
      { code: 'BENGHAZI', labels: { en: 'Benghazi', fr: 'Benghazi', ar: 'بنغازي' }, names: { en: 'Benghazi', fr: 'Benghazi', ar: 'بنغازي' }, isCapital: false },
      { code: 'MISRATA', labels: { en: 'Misrata', fr: 'Misrata', ar: 'مصراتة' }, names: { en: 'Misrata', fr: 'Misrata', ar: 'مصراتة' }, isCapital: false },
      { code: 'TOBRUK', labels: { en: 'Tobruk', fr: 'Tobrouk', ar: 'طبرق' }, names: { en: 'Tobruk', fr: 'Tobrouk', ar: 'طبرق' }, isCapital: false }
    ]
  },
  // Sudan (SD) - Major cities
  {
    countryCode: 'SD',
    cities: [
      { code: 'KHARTOUM', labels: { en: 'Khartoum', fr: 'Khartoum', ar: 'الخرطوم' }, names: { en: 'Khartoum', fr: 'Khartoum', ar: 'الخرطوم' }, isCapital: true },
      { code: 'OMDURMAN', labels: { en: 'Omdurman', fr: 'Omdurman', ar: 'أم درمان' }, names: { en: 'Omdurman', fr: 'Omdurman', ar: 'أم درمان' }, isCapital: false },
      { code: 'PORT_SUDAN', labels: { en: 'Port Sudan', fr: 'Port-Soudan', ar: 'بورتسودان' }, names: { en: 'Port Sudan', fr: 'Port-Soudan', ar: 'بورتسودان' }, isCapital: false },
      { code: 'KASSALA', labels: { en: 'Kassala', fr: 'Kassala', ar: 'كسلا' }, names: { en: 'Kassala', fr: 'Kassala', ar: 'كسلا' }, isCapital: false }
    ]
  },
  // Somalia (SO) - Major cities
  {
    countryCode: 'SO',
    cities: [
      { code: 'MOGADISHU', labels: { en: 'Mogadishu', fr: 'Mogadiscio', ar: 'مقديشو' }, names: { en: 'Mogadishu', fr: 'Mogadiscio', ar: 'مقديشو' }, isCapital: true },
      { code: 'HARGEISA', labels: { en: 'Hargeisa', fr: 'Hargeisa', ar: 'هرجيسا' }, names: { en: 'Hargeisa', fr: 'Hargeisa', ar: 'هرجيسا' }, isCapital: false },
      { code: 'KISMAYO', labels: { en: 'Kismayo', fr: 'Kismaayo', ar: 'كيسمايو' }, names: { en: 'Kismayo', fr: 'Kismaayo', ar: 'كيسمايو' }, isCapital: false },
      { code: 'BERBERA', labels: { en: 'Berbera', fr: 'Berbera', ar: 'بربرة' }, names: { en: 'Berbera', fr: 'Berbera', ar: 'بربرة' }, isCapital: false }
    ]
  },
  // Djibouti (DJ) - Major cities
  {
    countryCode: 'DJ',
    cities: [
      { code: 'DJIBOUTI_CITY', labels: { en: 'Djibouti City', fr: 'Ville de Djibouti', ar: 'مدينة جيبوتي' }, names: { en: 'Djibouti City', fr: 'Ville de Djibouti', ar: 'مدينة جيبوتي' }, isCapital: true },
      { code: 'ALI_SABIEH', labels: { en: 'Ali Sabieh', fr: 'Ali Sabieh', ar: 'علي صبيح' }, names: { en: 'Ali Sabieh', fr: 'Ali Sabieh', ar: 'علي صبيح' }, isCapital: false },
      { code: 'TADJOURA', labels: { en: 'Tadjoura', fr: 'Tadjourah', ar: 'تجورة' }, names: { en: 'Tadjoura', fr: 'Tadjourah', ar: 'تجورة' }, isCapital: false },
      { code: 'OBOCK', labels: { en: 'Obock', fr: 'Obock', ar: 'أوبوك' }, names: { en: 'Obock', fr: 'Obock', ar: 'أوبوك' }, isCapital: false }
    ]
  },
  // Comoros (KM) - Major cities
  {
    countryCode: 'KM',
    cities: [
      { code: 'MORONI', labels: { en: 'Moroni', fr: 'Moroni', ar: 'موروني' }, names: { en: 'Moroni', fr: 'Moroni', ar: 'موروني' }, isCapital: true },
      { code: 'MUTSAMUDU', labels: { en: 'Mutsamudu', fr: 'Mutsamudu', ar: 'متسامودو' }, names: { en: 'Mutsamudu', fr: 'Mutsamudu', ar: 'متسامودو' }, isCapital: false },
      { code: 'DOMONI', labels: { en: 'Domoni', fr: 'Domoni', ar: 'دوموني' }, names: { en: 'Domoni', fr: 'Domoni', ar: 'دوموني' }, isCapital: false },
      { code: 'FOMBONI', labels: { en: 'Fomboni', fr: 'Fomboni', ar: 'فومبوني' }, names: { en: 'Fomboni', fr: 'Fomboni', ar: 'فومبوني' }, isCapital: false }
    ]
  },
  // Mauritania (MR) - Major cities
  {
    countryCode: 'MR',
    cities: [
      { code: 'NOUAKCHOTT', labels: { en: 'Nouakchott', fr: 'Nouakchott', ar: 'نواكشوط' }, names: { en: 'Nouakchott', fr: 'Nouakchott', ar: 'نواكشوط' }, isCapital: true },
      { code: 'NOUADHIBOU', labels: { en: 'Nouadhibou', fr: 'Nouadhibou', ar: 'نواذيبو' }, names: { en: 'Nouadhibou', fr: 'Nouadhibou', ar: 'نواذيبو' }, isCapital: false },
      { code: 'KAEDI', labels: { en: 'Kaedi', fr: 'Kaédi', ar: 'كيفة' }, names: { en: 'Kaedi', fr: 'Kaédi', ar: 'كيفة' }, isCapital: false },
      { code: 'KIFA', labels: { en: 'Kifa', fr: 'Kifa', ar: 'كيفة' }, names: { en: 'Kifa', fr: 'Kifa', ar: 'كيفة' }, isCapital: false }
    ]
  },
  // Mali (ML) - Major cities
  {
    countryCode: 'ML',
    cities: [
      { code: 'BAMAKO', labels: { en: 'Bamako', fr: 'Bamako', ar: 'باماكو' }, names: { en: 'Bamako', fr: 'Bamako', ar: 'باماكو' }, isCapital: true },
      { code: 'SIKASSO', labels: { en: 'Sikasso', fr: 'Sikasso', ar: 'سيكاسو' }, names: { en: 'Sikasso', fr: 'Sikasso', ar: 'سيكاسو' }, isCapital: false },
      { code: 'MOPTI', labels: { en: 'Mopti', fr: 'Mopti', ar: 'موبتي' }, names: { en: 'Mopti', fr: 'Mopti', ar: 'موبتي' }, isCapital: false },
      { code: 'SEGOU', labels: { en: 'Segou', fr: 'Ségou', ar: 'سيغو' }, names: { en: 'Segou', fr: 'Ségou', ar: 'سيغو' }, isCapital: false }
    ]
  },
  // Niger (NE) - Major cities
  {
    countryCode: 'NE',
    cities: [
      { code: 'NIAMEY', labels: { en: 'Niamey', fr: 'Niamey', ar: 'نيامي' }, names: { en: 'Niamey', fr: 'Niamey', ar: 'نيامي' }, isCapital: true },
      { code: 'ZINDER', labels: { en: 'Zinder', fr: 'Zinder', ar: 'زندر' }, names: { en: 'Zinder', fr: 'Zinder', ar: 'زندر' }, isCapital: false },
      { code: 'MARADI', labels: { en: 'Maradi', fr: 'Maradi', ar: 'مرادي' }, names: { en: 'Maradi', fr: 'Maradi', ar: 'مرادي' }, isCapital: false },
      { code: 'AGADEZ', labels: { en: 'Agadez', fr: 'Agadez', ar: 'أغاديز' }, names: { en: 'Agadez', fr: 'Agadez', ar: 'أغاديز' }, isCapital: false }
    ]
  },
  // Chad (TD) - Major cities
  {
    countryCode: 'TD',
    cities: [
      { code: 'N_DJAMENA', labels: { en: 'N\'Djamena', fr: 'N\'Djamena', ar: 'انجمينا' }, names: { en: 'N\'Djamena', fr: 'N\'Djamena', ar: 'انجمينا' }, isCapital: true },
      { code: 'MOUSORO', labels: { en: 'Mousoro', fr: 'Moussoro', ar: 'موسورو' }, names: { en: 'Mousoro', fr: 'Moussoro', ar: 'موسورو' }, isCapital: false },
      { code: 'SARH', labels: { en: 'Sarh', fr: 'Sarh', ar: 'ساره' }, names: { en: 'Sarh', fr: 'Sarh', ar: 'ساره' }, isCapital: false },
      { code: 'ABECHE', labels: { en: 'Abéché', fr: 'Abéché', ar: 'أبشي' }, names: { en: 'Abéché', fr: 'Abéché', ar: 'أبشي' }, isCapital: false }
    ]
  },
  // Central African Republic (CF) - Major cities
  {
    countryCode: 'CF',
    cities: [
      { code: 'BANGUI', labels: { en: 'Bangui', fr: 'Bangui', ar: 'بانغي' }, names: { en: 'Bangui', fr: 'Bangui', ar: 'بانغي' }, isCapital: true },
      { code: 'BERBERATI', labels: { en: 'Berberati', fr: 'Berbérati', ar: 'بربراتي' }, names: { en: 'Berberati', fr: 'Berbérati', ar: 'بربراتي' }, isCapital: false },
      { code: 'BOUAR', labels: { en: 'Bouar', fr: 'Bouar', ar: 'بوار' }, names: { en: 'Bouar', fr: 'Bouar', ar: 'بوار' }, isCapital: false },
      { code: 'BAMBARI', labels: { en: 'Bambari', fr: 'Bambari', ar: 'بامباري' }, names: { en: 'Bambari', fr: 'Bambari', ar: 'بامباري' }, isCapital: false }
    ]
  }
];

const seedAllCities = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // First, delete all existing cities
    console.log('🗑️  Deleting all existing cities...');
    await City.deleteMany({});
    console.log('✅ All cities deleted');

    let totalCities = 0;
    let createdCities = 0;
    let countriesProcessed = 0;

    for (const countryData of citiesData) {
      // Find the country by code
      const country = await Country.findOne({ code: countryData.countryCode });
      
      if (!country) {
        console.log(`❌ Country ${countryData.countryCode} not found, skipping cities`);
        continue;
      }

      console.log(`\n🌍 Processing cities for ${country.labels.en} (${country.code})...`);
      countriesProcessed++;

      for (const cityData of countryData.cities) {
        totalCities++;
        
        // Create new city (without population field)
        const newCity = {
          code: cityData.code,
          country: country._id,
          labels: cityData.labels,
          names: cityData.names,
          isCapital: cityData.isCapital,
          isActive: true
        };

        await City.create(newCity);
        console.log(`✅ Created city: ${cityData.labels.en} (${cityData.isCapital ? 'Capital' : 'City'})`);
        createdCities++;
      }
    }

    console.log(`\n🎉 Seeding completed!`);
    console.log(`📊 Summary:`);
    console.log(`   • Countries processed: ${countriesProcessed}/25`);
    console.log(`   • Total cities processed: ${totalCities}`);
    console.log(`   • Cities created: ${createdCities}`);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error seeding cities:', error);
    process.exit(1);
  }
};

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedAllCities();
}

module.exports = seedAllCities;
