/**
 * Reference Data Context
 * Fetches lost/found options, categories and countries ONCE per app session and
 * caches them in memory. Each item carries a full `labels: {en, fr, ar}` object,
 * so language switches never need a refetch - callers just pick by currentLanguage.
 * Cities are country-scoped and fetched on demand (GET /cities-public?countryId=...),
 * cached per country so re-opening the filter sheet for the same country is instant.
 */

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import apiClient from '../app/api/apiService';

const ReferenceDataContext = createContext();

export const getLocalizedLabel = (item, language) => {
  if (!item) return '';
  return (
    item.names?.[language] ||
    item.labels?.[language] ||
    item.names?.en ||
    item.labels?.en ||
    item.label ||
    item.code ||
    ''
  );
};

export const ReferenceDataProvider = ({ children }) => {
  const [floptions, setFloptions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const citiesCacheRef = useRef({});

  useEffect(() => {
    let isMounted = true;

    const loadReferenceData = async () => {
      try {
        const [flRes, catRes, countryRes] = await Promise.all([
          apiClient.get('/floptions', { params: { active: true } }),
          apiClient.get('/categories', { params: { active: true } }),
          apiClient.get('/countries', { params: { active: true } }),
        ]);

        if (!isMounted) return;
        setFloptions(flRes.data?.data || []);
        setCategories(catRes.data?.data || []);
        setCountries(countryRes.data?.data || []);
      } catch (error) {
        console.error('Error loading reference data:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadReferenceData();
    return () => {
      isMounted = false;
    };
  }, []);

  const getCities = async (countryId) => {
    if (!countryId) return [];
    if (citiesCacheRef.current[countryId]) {
      return citiesCacheRef.current[countryId];
    }
    try {
      const response = await apiClient.get('/cities-public', { params: { countryId } });
      const cities = response.data?.data || [];
      citiesCacheRef.current[countryId] = cities;
      return cities;
    } catch (error) {
      console.error('Error loading cities:', error);
      return [];
    }
  };

  return (
    <ReferenceDataContext.Provider value={{ floptions, categories, countries, isLoading, getCities }}>
      {children}
    </ReferenceDataContext.Provider>
  );
};

export const useReferenceData = () => {
  const context = useContext(ReferenceDataContext);
  if (!context) {
    throw new Error('useReferenceData must be used within a ReferenceDataProvider');
  }
  return context;
};
