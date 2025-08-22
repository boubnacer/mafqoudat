const mongoose = require("mongoose");
const City = require("../models/City");
const Country = require("../models/Country");
require('dotenv').config();

// Comprehensive cities data for Arabic countries with multilingual support
const citiesData = [
  // Morocco (MA) - 15 major cities
  {
    countryCode: 'MA',
    cities: [
      {
        code: 'CASABLANCA',
        labels: { en: 'Casablanca', fr: 'Casablanca', ar: 'الدار البيضاء' },
        names: { en: 'Casablanca', fr: 'Casablanca', ar: 'الدار البيضاء' },
        isCapital: false,
        population: 3400000
      },
      {
        code: 'RABAT',
        labels: { en: 'Rabat', fr: 'Rabat', ar: 'الرباط' },
        names: { en: 'Rabat', fr: 'Rabat', ar: 'الرباط' },
        isCapital: true,
        population: 577000
      },
      {
        code: 'FES',
        labels: { en: 'Fez', fr: 'Fès', ar: 'فاس' },
        names: { en: 'Fez', fr: 'Fès', ar: 'فاس' },
        isCapital: false,
        population: 1150000
      },
      {
        code: 'MARRAKECH',
        labels: { en: 'Marrakech', fr: 'Marrakech', ar: 'مراكش' },
        names: { en: 'Marrakech', fr: 'Marrakech', ar: 'مراكش' },
        isCapital: false,
        population: 928000
      },
      {
        code: 'TANGIER',
        labels: { en: 'Tangier', fr: 'Tanger', ar: 'طنجة' },
        names: { en: 'Tangier', fr: 'Tanger', ar: 'طنجة' },
        isCapital: false,
        population: 947000
      },
      {
        code: 'AGADIR',
        labels: { en: 'Agadir', fr: 'Agadir', ar: 'أكادير' },
        names: { en: 'Agadir', fr: 'Agadir', ar: 'أكادير' },
        isCapital: false,
        population: 421000
      },
      {
        code: 'MEKNES',
        labels: { en: 'Meknes', fr: 'Meknès', ar: 'مكناس' },
        names: { en: 'Meknes', fr: 'Meknès', ar: 'مكناس' },
        isCapital: false,
        population: 632000
      },
      {
        code: 'OUJDA',
        labels: { en: 'Oujda', fr: 'Oujda', ar: 'وجدة' },
        names: { en: 'Oujda', fr: 'Oujda', ar: 'وجدة' },
        isCapital: false,
        population: 494000
      },
      {
        code: 'KENITRA',
        labels: { en: 'Kenitra', fr: 'Kénitra', ar: 'القنيطرة' },
        names: { en: 'Kenitra', fr: 'Kénitra', ar: 'القنيطرة' },
        isCapital: false,
        population: 431000
      },
      {
        code: 'TETOUAN',
        labels: { en: 'Tetouan', fr: 'Tétouan', ar: 'تطوان' },
        names: { en: 'Tetouan', fr: 'Tétouan', ar: 'تطوان' },
        isCapital: false,
        population: 380000
      },
      {
        code: 'SAFI',
        labels: { en: 'Safi', fr: 'Safi', ar: 'آسفي' },
        names: { en: 'Safi', fr: 'Safi', ar: 'آسفي' },
        isCapital: false,
        population: 308000
      },
      {
        code: 'EL_JADIDA',
        labels: { en: 'El Jadida', fr: 'El Jadida', ar: 'الجديدة' },
        names: { en: 'El Jadida', fr: 'El Jadida', ar: 'الجديدة' },
        isCapital: false,
        population: 194000
      },
      {
        code: 'BENI_MELLAL',
        labels: { en: 'Beni Mellal', fr: 'Béni Mellal', ar: 'بني ملال' },
        names: { en: 'Beni Mellal', fr: 'Béni Mellal', ar: 'بني ملال' },
        isCapital: false,
        population: 192000
      },
      {
        code: 'NADOR',
        labels: { en: 'Nador', fr: 'Nador', ar: 'الناظور' },
        names: { en: 'Nador', fr: 'Nador', ar: 'الناظور' },
        isCapital: false,
        population: 161000
      },
      {
        code: 'TAZA',
        labels: { en: 'Taza', fr: 'Taza', ar: 'تازة' },
        names: { en: 'Taza', fr: 'Taza', ar: 'تازة' },
        isCapital: false,
        population: 148000
      }
    ]
  },
  // Algeria (DZ) - 12 major cities
  {
    countryCode: 'DZ',
    cities: [
      {
        code: 'ALGIERS',
        labels: { en: 'Algiers', fr: 'Alger', ar: 'الجزائر' },
        names: { en: 'Algiers', fr: 'Alger', ar: 'الجزائر' },
        isCapital: true,
        population: 3416000
      },
      {
        code: 'ORAN',
        labels: { en: 'Oran', fr: 'Oran', ar: 'وهران' },
        names: { en: 'Oran', fr: 'Oran', ar: 'وهران' },
        isCapital: false,
        population: 803000
      },
      {
        code: 'CONSTANTINE',
        labels: { en: 'Constantine', fr: 'Constantine', ar: 'قسنطينة' },
        names: { en: 'Constantine', fr: 'Constantine', ar: 'قسنطينة' },
        isCapital: false,
        population: 448000
      },
      {
        code: 'ANNABA',
        labels: { en: 'Annaba', fr: 'Annaba', ar: 'عنابة' },
        names: { en: 'Annaba', fr: 'Annaba', ar: 'عنابة' },
        isCapital: false,
        population: 257000
      },
      {
        code: 'BATNA',
        labels: { en: 'Batna', fr: 'Batna', ar: 'باتنة' },
        names: { en: 'Batna', fr: 'Batna', ar: 'باتنة' },
        isCapital: false,
        population: 290000
      },
      {
        code: 'BLIDA',
        labels: { en: 'Blida', fr: 'Blida', ar: 'البليدة' },
        names: { en: 'Blida', fr: 'Blida', ar: 'البليدة' },
        isCapital: false,
        population: 331000
      },
      {
        code: 'SETIF',
        labels: { en: 'Setif', fr: 'Sétif', ar: 'سطيف' },
        names: { en: 'Setif', fr: 'Sétif', ar: 'سطيف' },
        isCapital: false,
        population: 288000
      },
      {
        code: 'DJELFA',
        labels: { en: 'Djelfa', fr: 'Djelfa', ar: 'الجلفة' },
        names: { en: 'Djelfa', fr: 'Djelfa', ar: 'الجلفة' },
        isCapital: false,
        population: 265000
      },
      {
        code: 'SIDI_BEL_ABBES',
        labels: { en: 'Sidi Bel Abbes', fr: 'Sidi Bel Abbès', ar: 'سيدي بلعباس' },
        names: { en: 'Sidi Bel Abbes', fr: 'Sidi Bel Abbès', ar: 'سيدي بلعباس' },
        isCapital: false,
        population: 212000
      },
      {
        code: 'BISKRA',
        labels: { en: 'Biskra', fr: 'Biskra', ar: 'بسكرة' },
        names: { en: 'Biskra', fr: 'Biskra', ar: 'بسكرة' },
        isCapital: false,
        population: 205000
      },
      {
        code: 'TEBESSA',
        labels: { en: 'Tebessa', fr: 'Tébessa', ar: 'تبسة' },
        names: { en: 'Tebessa', fr: 'Tébessa', ar: 'تبسة' },
        isCapital: false,
        population: 196000
      },
      {
        code: 'EL_OUED',
        labels: { en: 'El Oued', fr: 'El Oued', ar: 'الوادي' },
        names: { en: 'El Oued', fr: 'El Oued', ar: 'الوادي' },
        isCapital: false,
        population: 186000
      }
    ]
  },
  // Tunisia (TN) - 10 major cities
  {
    countryCode: 'TN',
    cities: [
      {
        code: 'TUNIS',
        labels: { en: 'Tunis', fr: 'Tunis', ar: 'تونس' },
        names: { en: 'Tunis', fr: 'Tunis', ar: 'تونس' },
        isCapital: true,
        population: 693000
      },
      {
        code: 'SFAX',
        labels: { en: 'Sfax', fr: 'Sfax', ar: 'صفاقس' },
        names: { en: 'Sfax', fr: 'Sfax', ar: 'صفاقس' },
        isCapital: false,
        population: 330000
      },
      {
        code: 'SOUSSE',
        labels: { en: 'Sousse', fr: 'Sousse', ar: 'سوسة' },
        names: { en: 'Sousse', fr: 'Sousse', ar: 'سوسة' },
        isCapital: false,
        population: 221000
      },
      {
        code: 'GABES',
        labels: { en: 'Gabès', fr: 'Gabès', ar: 'قابس' },
        names: { en: 'Gabès', fr: 'Gabès', ar: 'قابس' },
        isCapital: false,
        population: 116000
      },
      {
        code: 'ARIANA',
        labels: { en: 'Ariana', fr: 'Ariana', ar: 'أريانة' },
        names: { en: 'Ariana', fr: 'Ariana', ar: 'أريانة' },
        isCapital: false,
        population: 114000
      },
      {
        code: 'GAFSA',
        labels: { en: 'Gafsa', fr: 'Gafsa', ar: 'قفصة' },
        names: { en: 'Gafsa', fr: 'Gafsa', ar: 'قفصة' },
        isCapital: false,
        population: 95000
      },
      {
        code: 'MONASTIR',
        labels: { en: 'Monastir', fr: 'Monastir', ar: 'المنستير' },
        names: { en: 'Monastir', fr: 'Monastir', ar: 'المنستير' },
        isCapital: false,
        population: 93000
      },
      {
        code: 'BEN_AROUS',
        labels: { en: 'Ben Arous', fr: 'Ben Arous', ar: 'بن عروس' },
        names: { en: 'Ben Arous', fr: 'Ben Arous', ar: 'بن عروس' },
        isCapital: false,
        population: 88000
      },
      {
        code: 'KAIROUAN',
        labels: { en: 'Kairouan', fr: 'Kairouan', ar: 'القيروان' },
        names: { en: 'Kairouan', fr: 'Kairouan', ar: 'القيروان' },
        isCapital: false,
        population: 72000
      },
      {
        code: 'BENZART',
        labels: { en: 'Benzart', fr: 'Benzart', ar: 'بنزرت' },
        names: { en: 'Benzart', fr: 'Benzart', ar: 'بنزرت' },
        isCapital: false,
        population: 68000
      }
    ]
  },
  // Egypt (EG) - 15 major cities
  {
    countryCode: 'EG',
    cities: [
      {
        code: 'CAIRO',
        labels: { en: 'Cairo', fr: 'Le Caire', ar: 'القاهرة' },
        names: { en: 'Cairo', fr: 'Le Caire', ar: 'القاهرة' },
        isCapital: true,
        population: 9500000
      },
      {
        code: 'ALEXANDRIA',
        labels: { en: 'Alexandria', fr: 'Alexandrie', ar: 'الإسكندرية' },
        names: { en: 'Alexandria', fr: 'Alexandrie', ar: 'الإسكندرية' },
        isCapital: false,
        population: 5200000
      },
      {
        code: 'GIZA',
        labels: { en: 'Giza', fr: 'Gizeh', ar: 'الجيزة' },
        names: { en: 'Giza', fr: 'Gizeh', ar: 'الجيزة' },
        isCapital: false,
        population: 4200000
      },
      {
        code: 'SHARM_EL_SHEIKH',
        labels: { en: 'Sharm El Sheikh', fr: 'Charm el-Cheikh', ar: 'شرم الشيخ' },
        names: { en: 'Sharm El Sheikh', fr: 'Charm el-Cheikh', ar: 'شرم الشيخ' },
        isCapital: false,
        population: 73000
      },
      {
        code: 'LUXOR',
        labels: { en: 'Luxor', fr: 'Louxor', ar: 'الأقصر' },
        names: { en: 'Luxor', fr: 'Louxor', ar: 'الأقصر' },
        isCapital: false,
        population: 506000
      },
      {
        code: 'ASWAN',
        labels: { en: 'Aswan', fr: 'Assouan', ar: 'أسوان' },
        names: { en: 'Aswan', fr: 'Assouan', ar: 'أسوان' },
        isCapital: false,
        population: 266000
      },
      {
        code: 'ASSUIT',
        labels: { en: 'Assuit', fr: 'Assiout', ar: 'أسيوط' },
        names: { en: 'Assuit', fr: 'Assiout', ar: 'أسيوط' },
        isCapital: false,
        population: 420000
      },
      {
        code: 'MANSOURA',
        labels: { en: 'Mansoura', fr: 'Mansourah', ar: 'المنصورة' },
        names: { en: 'Mansoura', fr: 'Mansourah', ar: 'المنصورة' },
        isCapital: false,
        population: 960000
      },
      {
        code: 'TANTA',
        labels: { en: 'Tanta', fr: 'Tanta', ar: 'طنطا' },
        names: { en: 'Tanta', fr: 'Tanta', ar: 'طنطا' },
        isCapital: false,
        population: 421000
      },
      {
        code: 'ZAGAZIG',
        labels: { en: 'Zagazig', fr: 'Zagazig', ar: 'الزقازيق' },
        names: { en: 'Zagazig', fr: 'Zagazig', ar: 'الزقازيق' },
        isCapital: false,
        population: 319000
      },
      {
        code: 'ISMAILIA',
        labels: { en: 'Ismailia', fr: 'Ismaïlia', ar: 'الإسماعيلية' },
        names: { en: 'Ismailia', fr: 'Ismaïlia', ar: 'الإسماعيلية' },
        isCapital: false,
        population: 293000
      },
      {
        code: 'FAYOUM',
        labels: { en: 'Fayoum', fr: 'Fayoum', ar: 'الفيوم' },
        names: { en: 'Fayoum', fr: 'Fayoum', ar: 'الفيوم' },
        isCapital: false,
        population: 315000
      },
      {
        code: 'BENI_SUEF',
        labels: { en: 'Beni Suef', fr: 'Beni Souef', ar: 'بني سويف' },
        names: { en: 'Beni Suef', fr: 'Beni Souef', ar: 'بني سويف' },
        isCapital: false,
        population: 193000
      },
      {
        code: 'MINYA',
        labels: { en: 'Minya', fr: 'Minya', ar: 'المنيا' },
        names: { en: 'Minya', fr: 'Minya', ar: 'المنيا' },
        isCapital: false,
        population: 236000
      },
      {
        code: 'QENA',
        labels: { en: 'Qena', fr: 'Qena', ar: 'قنا' },
        names: { en: 'Qena', fr: 'Qena', ar: 'قنا' },
        isCapital: false,
        population: 201000
      }
    ]
  },
  // Saudi Arabia (SA) - 12 major cities
  {
    countryCode: 'SA',
    cities: [
      {
        code: 'RIYADH',
        labels: { en: 'Riyadh', fr: 'Riyad', ar: 'الرياض' },
        names: { en: 'Riyadh', fr: 'Riyad', ar: 'الرياض' },
        isCapital: true,
        population: 7670000
      },
      {
        code: 'JEDDAH',
        labels: { en: 'Jeddah', fr: 'Djeddah', ar: 'جدة' },
        names: { en: 'Jeddah', fr: 'Djeddah', ar: 'جدة' },
        isCapital: false,
        population: 3976000
      },
      {
        code: 'MECCA',
        labels: { en: 'Mecca', fr: 'La Mecque', ar: 'مكة المكرمة' },
        names: { en: 'Mecca', fr: 'La Mecque', ar: 'مكة المكرمة' },
        isCapital: false,
        population: 2040000
      },
      {
        code: 'MEDINA',
        labels: { en: 'Medina', fr: 'Médine', ar: 'المدينة المنورة' },
        names: { en: 'Medina', fr: 'Médine', ar: 'المدينة المنورة' },
        isCapital: false,
        population: 1180000
      },
      {
        code: 'DAMMAM',
        labels: { en: 'Dammam', fr: 'Dammam', ar: 'الدمام' },
        names: { en: 'Dammam', fr: 'Dammam', ar: 'الدمام' },
        isCapital: false,
        population: 1150000
      },
      {
        code: 'TAIF',
        labels: { en: 'Taif', fr: 'Taïf', ar: 'الطائف' },
        names: { en: 'Taif', fr: 'Taïf', ar: 'الطائف' },
        isCapital: false,
        population: 688000
      },
      {
        code: 'TABUK',
        labels: { en: 'Tabuk', fr: 'Tabuk', ar: 'تبوك' },
        names: { en: 'Tabuk', fr: 'Tabuk', ar: 'تبوك' },
        isCapital: false,
        population: 512000
      },
      {
        code: 'ABHA',
        labels: { en: 'Abha', fr: 'Abha', ar: 'أبها' },
        names: { en: 'Abha', fr: 'Abha', ar: 'أبها' },
        isCapital: false,
        population: 236000
      },
      {
        code: 'JIZAN',
        labels: { en: 'Jizan', fr: 'Jizan', ar: 'جيزان' },
        names: { en: 'Jizan', fr: 'Jizan', ar: 'جيزان' },
        isCapital: false,
        population: 157000
      },
      {
        code: 'HAIL',
        labels: { en: 'Hail', fr: 'Haïl', ar: 'حائل' },
        names: { en: 'Hail', fr: 'Haïl', ar: 'حائل' },
        isCapital: false,
        population: 412000
      },
      {
        code: 'NAJRAN',
        labels: { en: 'Najran', fr: 'Najran', ar: 'نجران' },
        names: { en: 'Najran', fr: 'Najran', ar: 'نجران' },
        isCapital: false,
        population: 329000
      },
      {
        code: 'AL_BAHA',
        labels: { en: 'Al Baha', fr: 'Al Baha', ar: 'الباحة' },
        names: { en: 'Al Baha', fr: 'Al Baha', ar: 'الباحة' },
        isCapital: false,
        population: 103000
      }
    ]
  },
  // UAE (AE) - 8 major cities
  {
    countryCode: 'AE',
    cities: [
      {
        code: 'DUBAI',
        labels: { en: 'Dubai', fr: 'Dubaï', ar: 'دبي' },
        names: { en: 'Dubai', fr: 'Dubaï', ar: 'دبي' },
        isCapital: false,
        population: 3331000
      },
      {
        code: 'ABU_DHABI',
        labels: { en: 'Abu Dhabi', fr: 'Abou Dabi', ar: 'أبو ظبي' },
        names: { en: 'Abu Dhabi', fr: 'Abou Dabi', ar: 'أبو ظبي' },
        isCapital: true,
        population: 1483000
      },
      {
        code: 'SHARJAH',
        labels: { en: 'Sharjah', fr: 'Charjah', ar: 'الشارقة' },
        names: { en: 'Sharjah', fr: 'Charjah', ar: 'الشارقة' },
        isCapital: false,
        population: 1409000
      },
      {
        code: 'AJMAN',
        labels: { en: 'Ajman', fr: 'Ajmân', ar: 'عجمان' },
        names: { en: 'Ajman', fr: 'Ajmân', ar: 'عجمان' },
        isCapital: false,
        population: 504000
      },
      {
        code: 'RAS_AL_KHAIMAH',
        labels: { en: 'Ras Al Khaimah', fr: 'Ras el Khaïmah', ar: 'رأس الخيمة' },
        names: { en: 'Ras Al Khaimah', fr: 'Ras el Khaïmah', ar: 'رأس الخيمة' },
        isCapital: false,
        population: 345000
      },
      {
        code: 'FUJAIRAH',
        labels: { en: 'Fujairah', fr: 'Fujaïrah', ar: 'الفجيرة' },
        names: { en: 'Fujairah', fr: 'Fujaïrah', ar: 'الفجيرة' },
        isCapital: false,
        population: 153000
      },
      {
        code: 'UMM_AL_QUWAIN',
        labels: { en: 'Umm Al Quwain', fr: 'Oumm al Qaïwaïn', ar: 'أم القيوين' },
        names: { en: 'Umm Al Quwain', fr: 'Oumm al Qaïwaïn', ar: 'أم القيوين' },
        isCapital: false,
        population: 72000
      },
      {
        code: 'AL_AIN',
        labels: { en: 'Al Ain', fr: 'Al Aïn', ar: 'العين' },
        names: { en: 'Al Ain', fr: 'Al Aïn', ar: 'العين' },
        isCapital: false,
        population: 766000
      }
    ]
  },
  // Qatar (QA) - 6 major cities
  {
    countryCode: 'QA',
    cities: [
      {
        code: 'DOHA',
        labels: { en: 'Doha', fr: 'Doha', ar: 'الدوحة' },
        names: { en: 'Doha', fr: 'Doha', ar: 'الدوحة' },
        isCapital: true,
        population: 2382000
      },
      {
        code: 'AL_WAKRAH',
        labels: { en: 'Al Wakrah', fr: 'Al Wakrah', ar: 'الوكرة' },
        names: { en: 'Al Wakrah', fr: 'Al Wakrah', ar: 'الوكرة' },
        isCapital: false,
        population: 87000
      },
      {
        code: 'AL_KHOR',
        labels: { en: 'Al Khor', fr: 'Al Khor', ar: 'الخور' },
        names: { en: 'Al Khor', fr: 'Al Khor', ar: 'الخور' },
        isCapital: false,
        population: 31000
      },
      {
        code: 'AL_DAYYEN',
        labels: { en: 'Al Dayyen', fr: 'Al Dayyen', ar: 'الظعاين' },
        names: { en: 'Al Dayyen', fr: 'Al Dayyen', ar: 'الظعاين' },
        isCapital: false,
        population: 43000
      },
      {
        code: 'AL_RAYYAN',
        labels: { en: 'Al Rayyan', fr: 'Al Rayyan', ar: 'الريان' },
        names: { en: 'Al Rayyan', fr: 'Al Rayyan', ar: 'الريان' },
        isCapital: false,
        population: 605000
      },
      {
        code: 'UMM_SALAL',
        labels: { en: 'Umm Salal', fr: 'Umm Salal', ar: 'أم صلال' },
        names: { en: 'Umm Salal', fr: 'Umm Salal', ar: 'أم صلال' },
        isCapital: false,
        population: 90000
      }
    ]
  },
  // Kuwait (KW) - 6 major cities
  {
    countryCode: 'KW',
    cities: [
      {
        code: 'KUWAIT_CITY',
        labels: { en: 'Kuwait City', fr: 'Koweït', ar: 'مدينة الكويت' },
        names: { en: 'Kuwait City', fr: 'Koweït', ar: 'مدينة الكويت' },
        isCapital: true,
        population: 2989000
      },
      {
        code: 'JAHRA',
        labels: { en: 'Al Jahra', fr: 'Al Jahra', ar: 'الجهراء' },
        names: { en: 'Al Jahra', fr: 'Al Jahra', ar: 'الجهراء' },
        isCapital: false,
        population: 400000
      },
      {
        code: 'HAWALLI',
        labels: { en: 'Hawalli', fr: 'Hawalli', ar: 'حولي' },
        names: { en: 'Hawalli', fr: 'Hawalli', ar: 'حولي' },
        isCapital: false,
        population: 164000
      },
      {
        code: 'FARWANIYA',
        labels: { en: 'Farwaniya', fr: 'Farwaniya', ar: 'الفروانية' },
        names: { en: 'Farwaniya', fr: 'Farwaniya', ar: 'الفروانية' },
        isCapital: false,
        population: 818000
      },
      {
        code: 'MUBARAK_AL_KABEER',
        labels: { en: 'Mubarak Al Kabeer', fr: 'Mubarak Al Kabeer', ar: 'مبارك الكبير' },
        names: { en: 'Mubarak Al Kabeer', fr: 'Mubarak Al Kabeer', ar: 'مبارك الكبير' },
        isCapital: false,
        population: 258000
      },
      {
        code: 'AHMADI',
        labels: { en: 'Ahmadi', fr: 'Ahmadi', ar: 'الأحمدي' },
        names: { en: 'Ahmadi', fr: 'Ahmadi', ar: 'الأحمدي' },
        isCapital: false,
        population: 637000
      }
    ]
  },
  // Bahrain (BH) - 5 major cities
  {
    countryCode: 'BH',
    cities: [
      {
        code: 'MANAMA',
        labels: { en: 'Manama', fr: 'Manama', ar: 'المنامة' },
        names: { en: 'Manama', fr: 'Manama', ar: 'المنامة' },
        isCapital: true,
        population: 157000
      },
      {
        code: 'MUHARRAQ',
        labels: { en: 'Muharraq', fr: 'Muharraq', ar: 'المحرق' },
        names: { en: 'Muharraq', fr: 'Muharraq', ar: 'المحرق' },
        isCapital: false,
        population: 75000
      },
      {
        code: 'RIFA',
        labels: { en: 'Riffa', fr: 'Riffa', ar: 'الرفاع' },
        names: { en: 'Riffa', fr: 'Riffa', ar: 'الرفاع' },
        isCapital: false,
        population: 120000
      },
      {
        code: 'HAMAD_TOWN',
        labels: { en: 'Hamad Town', fr: 'Hamad Town', ar: 'مدينة حمد' },
        names: { en: 'Hamad Town', fr: 'Hamad Town', ar: 'مدينة حمد' },
        isCapital: false,
        population: 57000
      },
      {
        code: 'ALI',
        labels: { en: 'Ali', fr: 'Ali', ar: 'علي' },
        names: { en: 'Ali', fr: 'Ali', ar: 'علي' },
        isCapital: false,
        population: 51000
      }
    ]
  }
];

const seedCities = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    let totalCities = 0;
    let createdCities = 0;
    let skippedCities = 0;

    for (const countryData of citiesData) {
      // Find the country by code
      const country = await Country.findOne({ code: countryData.countryCode });
      
      if (!country) {
        console.log(`❌ Country ${countryData.countryCode} not found, skipping cities`);
        continue;
      }

      console.log(`\n🌍 Processing cities for ${country.labels.en} (${country.code})...`);

      for (const cityData of countryData.cities) {
        totalCities++;
        
        // Check if city already exists
        const existingCity = await City.findOne({ 
          country: country._id, 
          code: cityData.code 
        });
        
        if (existingCity) {
          console.log(`⏭️  City already exists: ${cityData.labels.en}`);
          skippedCities++;
          continue;
        }

        // Create new city
        const newCity = {
          code: cityData.code,
          country: country._id,
          labels: cityData.labels,
          names: cityData.names,
          isCapital: cityData.isCapital,
          population: cityData.population,
          isActive: true
        };

        await City.create(newCity);
        console.log(`✅ Created city: ${cityData.labels.en} (${cityData.isCapital ? 'Capital' : 'City'})`);
        createdCities++;
      }
    }

    console.log(`\n🎉 Seeding completed!`);
    console.log(`📊 Summary:`);
    console.log(`   • Total cities processed: ${totalCities}`);
    console.log(`   • New cities created: ${createdCities}`);
    console.log(`   • Cities skipped (already exist): ${skippedCities}`);

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
  seedCities();
}

module.exports = seedCities;
