/**
 * Reference Data Context
 * Fetches lost/found options, categories and countries ONCE per app session and
 * caches them in memory. Each item carries a full `labels: {en, fr, ar}` object,
 * so language switches never need a refetch - callers just pick by currentLanguage.
 * Cities are country-scoped and fetched on demand (GET /cities-public?countryId=...),
 * cached per country so re-opening the filter sheet for the same country is instant.
 *
 * The backend (Render free tier) cold-starts after idling, and can take 30-50s to
 * wake up - a single request landing right in that window can time out even though
 * the server is fine a few seconds later. Every request here retries with backoff
 * before giving up, and a failure in one of the three lists no longer blanks out
 * the other two (Promise.allSettled, not Promise.all).
 */

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import apiClient from '../api/apiService';

const ReferenceDataContext = createContext();

const RETRY_ATTEMPTS = 4;
const RETRY_DELAYS_MS = [2000, 4000, 8000, 16000];

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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchWithRetry = async (requestFn) => {
  let lastError;
  for (let attempt = 0; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      if (attempt < RETRY_ATTEMPTS) {
        await sleep(RETRY_DELAYS_MS[attempt]);
      }
    }
  }
  throw lastError;
};

export const ReferenceDataProvider = ({ children }) => {
  const [floptions, setFloptions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const citiesCacheRef = useRef({});
  const isMountedRef = useRef(true);

  const loadReferenceData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const [flResult, catResult, countryResult] = await Promise.allSettled([
      fetchWithRetry(() => apiClient.get('/floptions', { params: { active: true } })),
      fetchWithRetry(() => apiClient.get('/categories', { params: { active: true } })),
      fetchWithRetry(() => apiClient.get('/countries', { params: { active: true } })),
    ]);

    if (!isMountedRef.current) return;

    if (flResult.status === 'fulfilled') setFloptions(flResult.value.data?.data || []);
    if (catResult.status === 'fulfilled') setCategories(catResult.value.data?.data || []);
    if (countryResult.status === 'fulfilled') setCountries(countryResult.value.data?.data || []);

    const failures = [flResult, catResult, countryResult].filter((r) => r.status === 'rejected');
    if (failures.length > 0) {
      console.error('Error loading reference data:', failures.map((r) => r.reason?.message || r.reason));
      setError(true);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    loadReferenceData();
    return () => {
      isMountedRef.current = false;
    };
  }, [loadReferenceData]);

  const getCities = async (countryId) => {
    if (!countryId) return [];
    if (citiesCacheRef.current[countryId]) {
      return citiesCacheRef.current[countryId];
    }
    try {
      const response = await fetchWithRetry(() => apiClient.get('/cities-public', { params: { countryId } }));
      const cities = response.data?.data || [];
      citiesCacheRef.current[countryId] = cities;
      return cities;
    } catch (error) {
      console.error('Error loading cities:', error);
      return [];
    }
  };

  return (
    <ReferenceDataContext.Provider
      value={{ floptions, categories, countries, isLoading, error, retry: loadReferenceData, getCities }}
    >
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
