/**
 * useDashboardData
 * Fetches GET /dashboard (server/routes/dashRoutes.js), scoped to the current
 * browsing country. Mirrors client/src/hooks/useDashboard.js's country
 * resolution and data shape closely enough that mapping the response in
 * HomeScreen.js is obvious - server/controllers/dependenciesController.js's
 * getDashboard returns { trendingPost, recentFounds, recentLosts, totalFounds,
 * totalLosts, totalPosts, totalReturned, createdToday, formattedLocations }.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import apiClient from '../api/apiService';
import { API_ENDPOINTS } from '../config/api';
import { storage } from '../utils/storage';
import { useLanguage } from '../context/LanguageContext';

// Resolves the same "current browsing country" PostsListScreen.js uses: the
// onboarding-selected country takes priority, falling back to the account's
// registered country.
const resolveBrowsingCountry = async () => {
  const onboardingCountry = await storage.getCurrentCountry();
  if (onboardingCountry) return onboardingCountry;
  const userData = await storage.getUserData();
  return userData?.country || null;
};

export const useDashboardData = () => {
  const { currentLanguage } = useLanguage();
  const [countryId, setCountryId] = useState(null);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState(null);

  const requestIdRef = useRef(0);
  const isFirstFocusRef = useRef(true);

  useEffect(() => {
    let isMounted = true;
    resolveBrowsingCountry().then((id) => {
      if (isMounted) setCountryId(id);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const fetchDashboard = useCallback(async () => {
    if (!countryId) return;
    setIsLoading(true);
    setIsError(false);
    setError(null);

    const requestId = ++requestIdRef.current;
    try {
      const response = await apiClient.get(API_ENDPOINTS.DASHBOARD.GET, {
        params: { currentCountry: countryId, language: currentLanguage || 'en' },
      });
      if (requestId !== requestIdRef.current) return;
      setData(response.data);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      console.error('Error loading dashboard:', err);
      setIsError(true);
      setError(err);
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  }, [countryId, currentLanguage]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Re-syncs the browsing country on focus (e.g. returning from creating a
  // post, or from changing the account country in EditProfileScreen) the
  // same way PostsListScreen.js does - skips the very first focus since the
  // mount effect above already covers it.
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocusRef.current) {
        isFirstFocusRef.current = false;
        return undefined;
      }
      let isActive = true;
      resolveBrowsingCountry().then((id) => {
        if (isActive && id && id !== countryId) {
          setCountryId(id);
        }
      });
      return () => {
        isActive = false;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [countryId])
  );

  // Exposed so HomeScreen.js can drive AppHeader's controlled country-picker
  // mode (same as PostsListScreen.js) instead of AppHeader's self-managed
  // mode - self-managed wouldn't refresh dashboard data until the next
  // navigation focus, since picking a country there is a same-screen state
  // change, not a focus transition.
  const handleSelectCountry = useCallback((id) => {
    if (!id || id === countryId) return;
    setCountryId(id);
    storage.setCurrentCountry(id);
  }, [countryId]);

  return { data, isLoading, isError, error, refetch: fetchDashboard, countryId, handleSelectCountry };
};
