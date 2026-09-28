/**
 * Post Description Generator
 *
 * Automatically generates natural, SEO-optimized descriptions in Arabic, French,
 * and English for lost and found posts when the author does not provide a custom one.
 *
 * Implements template rotation (3 distinct stylistic variations per language and direction)
 * to avoid duplicate or thin content penalties from search engine algorithms (e.g. Google Helpful Content).
 */

const formatCategories = (categories, language) => {
  if (!categories) return '';
  if (Array.isArray(categories)) {
    const list = categories
      .map((c) => (typeof c === 'string' ? c.trim() : ''))
      .filter(Boolean);
    if (!list.length) return '';
    return language === 'ar' ? list.join('، ') : list.join(', ');
  }
  return String(categories).trim();
};

export const DESCRIPTION_TEMPLATES = {
  ar: {
    fallbackCategory: 'غرض',
    LOST: [
      // النمط 1: إعلان فقدان رسمي ومباشر
      ({ category, locationZone, locationPart, datePart }) =>
        `إعلان عن فقدان ${category} ${locationZone}${locationPart}${datePart}. المرجو ممن عثر عليه أو لديه أي معلومات تفيد في إيجاده التواصل مع صاحب البلاغ عبر منصة مفقودات.`,
      // النمط 2: أسلوب وسوم البحث والتوثيق (مثالي لمحركات البحث Google)
      ({ category, countryWithCity, locationPart, datePart }) =>
        `مفقودات ${countryWithCity}: تسجيل بلاغ بخصوص ${category} فُقد${datePart}${locationPart}. نرجو من أي شخص لديه معلومات المساعدة في إعادته لصاحبه عبر وسائل التواصل المرفقة.`,
      // النمط 3: أسلوب نداء وتعاون مجتمعي
      ({ category, locationZone, locationPart, datePart }) =>
        `بلاغ عن فقدان غرض: ${category} ضاع ${locationZone}${locationPart}${datePart}. يُرجى مشاركة هذا الإعلان للمساعدة في إيصال المفقود إلى صاحبه في أقرب وقت.`,
    ],
    FOUND: [
      // النمط 1: أسلوب أمانة وإثبات الملكية
      ({ category, locationZone, locationPart, datePart }) =>
        `تم العثور على ${category} ${locationZone}${locationPart}${datePart}. الغرض محفوظ في مكان آمن، ويرجى من صاحبه الشرعي أو من يتعرف عليه التواصل لإثبات الملكية واستلامه.`,
      // النمط 2: معثورات المدينة والدولة
      ({ category, countryWithCity, locationPart, datePart }) =>
        `معثورات ${countryWithCity}: عُثر على ${category}${datePart}${locationPart}. نأمل من الجميع المساعدة في مشاركة المنشور حتى يصل إلى صاحبه الأصلي وتسهيل إرجاعه.`,
      // النمط 3: بلاغ غرض معثور عليه
      ({ category, locationZone, locationPart, datePart }) =>
        `بلاغ عن غرض تم العثور عليه: ${category} ${locationZone}${locationPart}${datePart}. لمن فقد هذا الغرض أو يعرف صاحبه، نرجو التواصل عبر بيانات الاتصال المتاحة في المنشور.`,
    ],
  },
  fr: {
    fallbackCategory: 'objet',
    LOST: [
      // Style 1: Avis direct et officiel
      ({ category, locationZone, locationPart, datePart }) =>
        `Avis de perte : ${category} perdu ${locationZone}${locationPart}${datePart}. Merci à toute personne ayant des informations de contacter l'auteur du signalement via la plateforme Mafqoudat.`,
      // Style 2: Référencement par région/ville
      ({ category, countryWithCity, locationPart, datePart }) =>
        `Objets perdus - ${countryWithCity} : Déclaration concernant un(e) ${category} égaré(e)${datePart}${locationPart}. Merci de partager cette annonce pour aider à retrouver son propriétaire.`,
      // Style 3: Appel à la communauté
      ({ category, locationZone, locationPart, datePart }) =>
        `Signalement d'objet perdu : ${category} égaré ${locationZone}${locationPart}${datePart}. N'hésitez pas à joindre le propriétaire si vous l'avez retrouvé ou aperçu.`,
    ],
    FOUND: [
      // Style 1: Restitution sécurisée
      ({ category, locationZone, locationPart, datePart }) =>
        `Objet trouvé : ${category} trouvé ${locationZone}${locationPart}${datePart}. L'objet est conservé en lieu sûr. Merci au propriétaire légitime de se manifester avec une preuve d'appartenance pour le récupérer.`,
      // Style 2: Objets trouvés par pays et ville
      ({ category, countryWithCity, locationPart, datePart }) =>
        `Objets trouvés - ${countryWithCity} : Un(e) ${category} a été retrouvé(e)${datePart}${locationPart}. Merci de partager cette publication afin de le restituer rapidement à son propriétaire.`,
      // Style 3: Avis de trouvaille
      ({ category, locationZone, locationPart, datePart }) =>
        `Avis de trouvaille : ${category} recueilli ${locationZone}${locationPart}${datePart}. Toute personne reconnaissant cet objet est invitée à contacter l'auteur de l'annonce via Mafqoudat.`,
    ],
  },
  en: {
    fallbackCategory: 'item',
    LOST: [
      // Style 1: Direct lost notice
      ({ category, locationZone, locationPart, datePart }) =>
        `Lost item notice: ${category} lost ${locationZone}${locationPart}${datePart}. If you found it or have any helpful information, please contact the owner via the Mafqoudat platform.`,
      // Style 2: Search-optimized country & city
      ({ category, countryWithCity, locationPart, datePart }) =>
        `Lost & Found ${countryWithCity}: Report filed for a missing ${category}${datePart}${locationPart}. Please share this post to help return it to its rightful owner.`,
      // Style 3: Community appeal
      ({ category, locationZone, locationPart, datePart }) =>
        `Missing item appeal: ${category} lost ${locationZone}${locationPart}${datePart}. Anyone with relevant details is kindly asked to reach out through the contact options provided.`,
    ],
    FOUND: [
      // Style 1: Safe keeping & proof of ownership
      ({ category, locationZone, locationPart, datePart }) =>
        `Found item notice: ${category} found ${locationZone}${locationPart}${datePart}. The item is safely kept; please contact the finder with proof of ownership to claim it.`,
      // Style 2: Search-optimized found notice
      ({ category, countryWithCity, locationPart, datePart }) =>
        `Lost & Found ${countryWithCity}: A ${category} was found${datePart}${locationPart}. Please help share this notice so it can be returned to its owner as soon as possible.`,
      // Style 3: Found property report
      ({ category, locationZone, locationPart, datePart }) =>
        `Found property report: ${category} located ${locationZone}${locationPart}${datePart}. If this belongs to you or someone you know, please get in touch via Mafqoudat.`,
    ],
  },
};

/**
 * Generate a complete, polished post description.
 *
 * @param {Object} params
 * @param {string} params.direction 'LOST' | 'FOUND'
 * @param {string|string[]} params.categoryNames Name(s) of category
 * @param {string} [params.countryName] Name of country
 * @param {string} [params.cityName] Name of city
 * @param {string} [params.exactLocation] Specific location/address
 * @param {string} [params.date] Formatted date
 * @param {string} [params.language='ar'] 'ar' | 'fr' | 'en'
 * @param {number} [params.variationIndex] Explicit index (0, 1, 2) or random
 * @returns {string}
 */
export const generatePostDescription = ({
  direction = 'LOST',
  categoryNames = '',
  countryName = '',
  cityName = '',
  exactLocation = '',
  date = '',
  language = 'ar',
  variationIndex,
} = {}) => {
  const lang = (language === 'ar' || language === 'fr' || language === 'en') ? language : 'ar';
  const dir = String(direction).toUpperCase() === 'FOUND' ? 'FOUND' : 'LOST';
  const langConfig = DESCRIPTION_TEMPLATES[lang] || DESCRIPTION_TEMPLATES.ar;
  const templates = langConfig[dir];

  const category = formatCategories(categoryNames, lang) || langConfig.fallbackCategory;
  const cleanCountry = typeof countryName === 'string' ? countryName.trim() : '';
  const cleanCity = typeof cityName === 'string' ? cityName.trim() : '';
  const cleanLocation = typeof exactLocation === 'string' ? exactLocation.trim() : '';
  const cleanDate = typeof date === 'string' ? date.trim() : '';

  // Construct location zone with proper prepositions
  let locationZone = '';
  if (lang === 'ar') {
    if (cleanCity && cleanCountry) {
      locationZone = `بمدينة ${cleanCity} (${cleanCountry})`;
    } else if (cleanCity) {
      locationZone = `بمدينة ${cleanCity}`;
    } else if (cleanCountry) {
      locationZone = `في ${cleanCountry}`;
    } else {
      locationZone = `في المنطقة`;
    }
  } else if (lang === 'fr') {
    if (cleanCity && cleanCountry) {
      locationZone = `à ${cleanCity} (${cleanCountry})`;
    } else if (cleanCity) {
      locationZone = `à ${cleanCity}`;
    } else if (cleanCountry) {
      locationZone = `en ${cleanCountry}`;
    } else {
      locationZone = `dans la région`;
    }
  } else {
    // English
    if (cleanCity && cleanCountry) {
      locationZone = `in ${cleanCity}, ${cleanCountry}`;
    } else if (cleanCity) {
      locationZone = `in ${cleanCity}`;
    } else if (cleanCountry) {
      locationZone = `in ${cleanCountry}`;
    } else {
      locationZone = `in the area`;
    }
  }

  // Construct country with city for headlines / tags
  let countryWithCity = '';
  if (cleanCountry && cleanCity) {
    countryWithCity = `${cleanCountry} (${cleanCity})`;
  } else if (cleanCountry) {
    countryWithCity = cleanCountry;
  } else if (cleanCity) {
    countryWithCity = cleanCity;
  } else {
    countryWithCity = lang === 'ar' ? 'العالم العربي' : (lang === 'fr' ? 'Région' : 'Regional');
  }

  // Construct location part
  let locationPart = '';
  if (cleanLocation) {
    if (lang === 'ar') {
      locationPart = `، تحديداً في ${cleanLocation}`;
    } else if (lang === 'fr') {
      locationPart = `, précisément à ${cleanLocation}`;
    } else {
      locationPart = `, specifically at ${cleanLocation}`;
    }
  }

  // Construct date part
  let datePart = '';
  if (cleanDate) {
    if (lang === 'ar') {
      datePart = ` بتاريخ ${cleanDate}`;
    } else if (lang === 'fr') {
      datePart = ` le ${cleanDate}`;
    } else {
      datePart = ` on ${cleanDate}`;
    }
  }

  const selectedIndex = typeof variationIndex === 'number' && variationIndex >= 0 && variationIndex < templates.length
    ? variationIndex
    : Math.floor(Math.random() * templates.length);

  const templateFn = templates[selectedIndex] || templates[0];
  return templateFn({
    category,
    locationZone,
    countryWithCity,
    locationPart,
    datePart,
  });
};

export const AUTO_GENERATED_PREFIXES = [
  'إعلان عن فقدان',
  'مفقودات',
  'بلاغ عن فقدان',
  'تم العثور على',
  'معثورات',
  'بلاغ عن غرض تم العثور عليه',
  'Avis de perte',
  'Objets perdus',
  "Signalement d'objet perdu",
  'Objet trouvé',
  'Objets trouvés',
  'Avis de trouvaille',
  'Lost item notice',
  'Lost & Found',
  'Missing item appeal',
  'Found item notice',
  'Found property report',
];

export const isAutoGeneratedDescription = (postOrDescription) => {
  if (!postOrDescription) return true;
  if (typeof postOrDescription === 'object') {
    if (postOrDescription.isAutoGeneratedDescription === true) return true;
    if (!postOrDescription.description || !String(postOrDescription.description).trim()) return true;
    return isAutoGeneratedDescription(postOrDescription.description);
  }
  const text = String(postOrDescription).trim();
  if (!text) return true;
  return AUTO_GENERATED_PREFIXES.some((prefix) => text.startsWith(prefix));
};

export const buildDynamicDescriptionLabels = (postDoc) => {
  if (!postDoc) return null;
  const isAuto = isAutoGeneratedDescription(postDoc);
  if (!isAuto) {
    return null;
  }

  const countryNameAr = postDoc.Country?.names?.ar || postDoc.Country?.labels?.ar || postDoc.countryLabels?.ar || postDoc.countryname || '';
  const countryNameFr = postDoc.Country?.names?.fr || postDoc.Country?.labels?.fr || postDoc.countryLabels?.fr || postDoc.countryname || '';
  const countryNameEn = postDoc.Country?.names?.en || postDoc.Country?.labels?.en || postDoc.countryLabels?.en || postDoc.countryname || '';

  const categoryNamesAr = (postDoc.Categories || []).map((c) => c.labels?.ar || c.code).filter(Boolean);
  const categoryNamesFr = (postDoc.Categories || []).map((c) => c.labels?.fr || c.code).filter(Boolean);
  const categoryNamesEn = (postDoc.Categories || []).map((c) => c.labels?.en || c.code).filter(Boolean);

  const fallbackCatAr = postDoc.Category?.labels?.ar || postDoc.categoryname || '';
  const fallbackCatFr = postDoc.Category?.labels?.fr || postDoc.categoryname || '';
  const fallbackCatEn = postDoc.Category?.labels?.en || postDoc.categoryname || '';

  const cityNameAr = postDoc.cityLabels?.ar || postDoc.cityName || (typeof postDoc.city === 'string' && !postDoc.city.startsWith('api_') ? postDoc.city : '');
  const cityNameFr = postDoc.cityLabels?.fr || postDoc.cityName || (typeof postDoc.city === 'string' && !postDoc.city.startsWith('api_') ? postDoc.city : '');
  const cityNameEn = postDoc.cityLabels?.en || postDoc.cityName || (typeof postDoc.city === 'string' && !postDoc.city.startsWith('api_') ? postDoc.city : '');

  const direction = (postDoc.Floptions && postDoc.Floptions[0]?.code === 'FOUND') || postDoc.foundLost === 'FOUND' ? 'FOUND' : 'LOST';

  return {
    ar: generatePostDescription({
      direction,
      categoryNames: categoryNamesAr.length ? categoryNamesAr : fallbackCatAr,
      countryName: countryNameAr,
      cityName: cityNameAr,
      exactLocation: postDoc.exactLocation || '',
      date: postDoc.mainDate || '',
      language: 'ar',
      variationIndex: 0,
    }),
    fr: generatePostDescription({
      direction,
      categoryNames: categoryNamesFr.length ? categoryNamesFr : fallbackCatFr,
      countryName: countryNameFr,
      cityName: cityNameFr,
      exactLocation: postDoc.exactLocation || '',
      date: postDoc.mainDate || '',
      language: 'fr',
      variationIndex: 0,
    }),
    en: generatePostDescription({
      direction,
      categoryNames: categoryNamesEn.length ? categoryNamesEn : fallbackCatEn,
      countryName: countryNameEn,
      cityName: cityNameEn,
      exactLocation: postDoc.exactLocation || '',
      date: postDoc.mainDate || '',
      language: 'en',
      variationIndex: 0,
    }),
  };
};

export default generatePostDescription;
