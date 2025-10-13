import { useMemo } from 'react';
import { useLanguage } from '../utils/languageContext';
import { useGetCountriesQuery } from '../features/countries/countriesApiSlice';

/**
 * Custom hook to resolve country ID to country name
 * @param {string} countryId - The country ObjectId or country code
 * @returns {object} - { countryName, isLoading, error }
 */
const useCountryName = (countryId) => {
  const { currentLanguage } = useLanguage();
  
  // Fetch countries data
  const { 
    data: countriesData, 
    isLoading, 
    error 
  } = useGetCountriesQuery({ 
    language: currentLanguage,
    active: true 
  });

  const countryName = useMemo(() => {
    if (!countryId || !countriesData?.entities) {
      return null;
    }

    // Find country by ID (both _id and transformed id)
    const country = countriesData.entities[countryId] || 
                   Object.values(countriesData.entities).find(c => c._id === countryId || c.id === countryId);

    if (!country) {
      return null;
    }

    // Return the localized name/label
    return country.names?.[currentLanguage] || 
           country.names?.en || 
           country.labels?.[currentLanguage] || 
           country.labels?.en || 
           country.code;
  }, [countryId, countriesData, currentLanguage]);

  return {
    countryName,
    isLoading,
    error
  };
};

export default useCountryName;
