import { useState, useCallback, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useGetDashboardQuery, useGetPostsQuery, useGetUserPostsQuery } from '../features/posts/postsApiSlice';
import { selectCurrentCountry, setCurrentCountry } from '../app/state';
import { useGetCountriesQuery } from '../features/dependencies/dependenciesApiSlice';
import debounce from 'lodash/debounce';
import useAuth from './useAuth';
import { useLanguage } from '../utils/languageContext';
import { selectCurrentToken } from '../features/auth/authSlice';

export const useDashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [shareStoryOpen, setShareStoryOpen] = useState(false);
  const [showCommunityDialog, setShowCommunityDialog] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [helpTab, setHelpTab] = useState(0);

  const dispatch = useDispatch();
  const { country: userCountry } = useAuth();
  const currentCountry = useSelector(selectCurrentCountry);
  const { currentLanguage } = useLanguage();
  const token = useSelector(selectCurrentToken);

  // Get countries list
  const { data: countriesData, error: countriesError } = useGetCountriesQuery({
    language: currentLanguage
  });

  const [geoCountryCode, setGeoCountryCode] = useState(null);
  const geoAttemptedRef = useRef(false);
  const geoAppliedRef = useRef(false);

  // First-visit IP geolocation lookup to pre-detect visitor's country
  useEffect(() => {
    const savedState = localStorage.getItem('globalState');
    let savedCountry = null;
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        savedCountry = parsed.currentCountry;
      } catch (e) {}
    }

    // Skip IP lookup if a country is already selected, saved, or already attempted
    if (currentCountry || savedCountry || geoAttemptedRef.current) return;
    geoAttemptedRef.current = true;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    fetch("https://ipwho.is/", { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.success !== false && data.country_code) {
          setGeoCountryCode(data.country_code);
        }
      })
      .catch(() => {
        // Silent fail by design: network error or timeout falls back to Morocco ('MA')
      })
      .finally(() => clearTimeout(timeoutId));

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [currentCountry]);

  // Set country when available: prioritize JWT country -> saved country -> IP geo match -> Morocco ('MA') default
  useEffect(() => {
    const savedState = localStorage.getItem('globalState');
    let savedCountry = null;
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        savedCountry = parsedState.currentCountry;
      } catch (error) {
        console.error('useDashboard: Error parsing saved state:', error);
      }
    }

    // If country is already in Redux:
    if (currentCountry && currentCountry !== "") {
      // If user had auto-defaulted to Morocco on initial cold render while geo lookup was in flight,
      // and geo arrives later with a different valid country match, upgrade to visitor's detected country once.
      if (
        !savedCountry &&
        !userCountry &&
        geoCountryCode &&
        !geoAppliedRef.current &&
        countriesData?.entities
      ) {
        const match = Object.values(countriesData.entities).find(
          (c) => c?.code && c.code.toUpperCase() === geoCountryCode.toUpperCase()
        );
        geoAppliedRef.current = true;
        if (match) {
          const matchId = match._id || match.id;
          if (matchId && matchId !== currentCountry) {
            dispatch(setCurrentCountry({ currentCountry: matchId }));
          }
        }
      }
      return;
    }

    // For logged-in users, use their country from JWT token
    if (userCountry) {
      dispatch(setCurrentCountry({ currentCountry: userCountry }));
      return;
    }

    // For non-logged-in users, restore the saved country from localStorage
    if (savedCountry && savedCountry !== "") {
      dispatch(setCurrentCountry({ currentCountry: savedCountry }));
      return;
    }

    // If no country has been set yet, resolve from loaded countriesData
    if (countriesData?.entities && countriesData?.ids?.length > 0) {
      let targetCountry = null;

      // 1. Try IP geolocation match
      if (geoCountryCode) {
        targetCountry = Object.values(countriesData.entities).find(
          (c) => c?.code && c.code.toUpperCase() === geoCountryCode.toUpperCase()
        );
        if (targetCountry) {
          geoAppliedRef.current = true;
        }
      }

      // 2. Default to Morocco ('MA') if geo didn't match or is still in flight
      if (!targetCountry) {
        targetCountry = Object.values(countriesData.entities).find(
          (c) => c?.code && c.code.toUpperCase() === 'MA'
        );
      }

      // 3. Fallback to first available country if Morocco is not found
      if (!targetCountry) {
        targetCountry = countriesData.entities[countriesData.ids[0]];
      }

      if (targetCountry) {
        const selectedId = targetCountry._id || targetCountry.id;
        if (selectedId) {
          dispatch(setCurrentCountry({ currentCountry: selectedId }));
        }
      }
    }
  }, [userCountry, currentCountry, dispatch, countriesData, geoCountryCode]);

  // Dashboard data query - skip if no currentCountry (allow public access)
  const { 
    data, 
    isError, 
    error, 
    isLoading,
    isFetching
  } = useGetDashboardQuery({
    currentCountry,
    language: currentLanguage
  }, {
    skip: !currentCountry
  });



  // Search query - allow public access
  const { 
    data: searchData, 
    isLoading: isSearchLoading,
    isFetching: isSearchFetching
  } = useGetPostsQuery({
    page: 1,
    pageSize: 10,
    currentCountry: currentCountry || "",
    search: searchQuery || "",
    language: currentLanguage
  }, {
    skip: !currentCountry
  });

  // User posts query - only for authenticated users
  const { 
    data: userPostsData, 
    isLoading: isUserPostsLoading,
    isFetching: isUserPostsFetching,
    error: userPostsError
  } = useGetUserPostsQuery({
    page: 1,
    pageSize: 4,
    language: currentLanguage
  }, {
    skip: !token // Skip if user is not authenticated
  });


  // Create a debounced search function
  const debouncedSearch = useCallback(
    debounce((query) => {
      if (query.trim()) {
        setIsSearching(true);
      } else {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  // Update search query and trigger debounced search
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  // Derived data
  const trend = data?.trendingPost;
  const createdtoday = data?.createdToday;

  return {
    // State
    searchQuery,
    isSearching,
    shareStoryOpen,
    showCommunityDialog,
    showHelpDialog,
    helpTab,
    currentCountry,
    currentLanguage,
    // Loading states
    isLoading: isLoading || isFetching,
    isSearchLoading: isSearchLoading || isSearchFetching,
    isUserPostsLoading: isUserPostsLoading || isUserPostsFetching,
    
    // Data
    data,
    isError,
    error,
    isLoading,
    trend,
    createdtoday,
    searchData,
    isSearchLoading,
    userPostsData,
    isUserPostsLoading,
    countriesData,
    countriesError,
    
    // Actions
    setShareStoryOpen,
    setShowCommunityDialog,
    setShowHelpDialog,
    setHelpTab,
    handleSearchChange,
  };
}; 