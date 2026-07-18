// Helper function to get city display name with fallback logic
export const getCityDisplayName = (city, currentLanguage) => {
  if (!city) return 'Unknown City';

  // For Arabic language, prioritize Arabic script
  if (currentLanguage === 'ar') {
    // Priority: Arabic -> English -> French -> any available
    const priorityOrder = ['ar', 'en', 'fr'];
    for (const lang of priorityOrder) {
      if (city.labels?.[lang]) {
        return city.labels[lang];
      }
    }
  } else {
    // For English and French, prioritize Latin script (English/French)
    // Priority: Current language -> English -> French -> Arabic (as last resort)
    const priorityOrder = [currentLanguage, 'en', 'fr', 'ar'];
    for (const lang of priorityOrder) {
      if (city.labels?.[lang]) {
        // For English and French, avoid Arabic script if possible
        if ((currentLanguage === 'en' || currentLanguage === 'fr') && lang === 'ar') {
          // Only use Arabic if no Latin script is available
          continue;
        }
        return city.labels[lang];
      }
    }
  }

  // Fallback to any available label
  if (city.label) return city.label;
  if (city.name) return city.name;
  if (city.code) return city.code;

  return 'Unknown City';
};
