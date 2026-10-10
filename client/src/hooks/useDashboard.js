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

  // First-visit country confirmation modal state:
  // Shows if visitor has not confirmed country and is not authenticated
  const [showCountryWelcomeDialog, setShowCountryWelcomeDialog] = useState(() => {
    if (typeof window === 'undefined') return false;
    const isConfirmed = localStorage.getItem('countryConfirmed') === 'true';
    return !isConfirmed && !token && !userCountry;
  });

  // Get countries list
  const { data: countriesData, error: countriesError } = useGetCountriesQuery({
    language: currentLanguage
  });

  const [geoCountryCode, setGeoCountryCode] = useState(null);
  const geoAttemptedRef = useRef(false);

  // Sync dialog visibility if authentication status updates
  useEffect(() => {
    const isConfirmed = localStorage.getItem('countryConfirmed') === 'true';
    if (token || userCountry || isConfirmed) {
      setShowCountryWelcomeDialog(false);
    }
  }, [token, userCountry]);

  // First-visit IP geolocation lookup to pre-detect visitor's country ONLY for the welcome dialog picker
  useEffect(() => {
    const isConfirmed = localStorage.getItem('countryConfirmed') === 'true';
    // Skip IP lookup if returning confirmed visitor, user is logged in, or already attempted
    if (isConfirmed || token || userCountry || geoAttemptedRef.current) return;
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
  }, [token, userCountry]);

  // Set country when available: prioritize JWT country -> confirmed saved country -> Morocco ('MA') default
  useEffect(() => {
    const isConfirmed = localStorage.getItem('countryConfirmed') === 'true';
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

    // 1. For logged-in users, prioritize country from JWT token
    if (userCountry) {
      if (currentCountry !== userCountry) {
        dispatch(setCurrentCountry({ currentCountry: userCountry }));
      }
      return;
    }

    // 2. For returning confirmed visitors, restore saved country from localStorage
    if (isConfirmed && savedCountry && savedCountry !== "") {
      if (currentCountry !== savedCountry) {
        dispatch(setCurrentCountry({ currentCountry: savedCountry }));
      }
      return;
    }

    // 3. For unconfirmed visitors (first-time visit) or missing saved country:
    // ALWAYS default Redux currentCountry to Morocco ('MA') so the dashboard displays live stats,
    // recent posts, and activity instead of 0-post empty ghost states.
    if (countriesData?.entities && countriesData?.ids?.length > 0) {
      const morocco = Object.values(countriesData.entities).find(
        (c) => c?.code && c.code.toUpperCase() === 'MA'
      );
      const defaultId = (morocco?._id || morocco?.id) || countriesData.ids[0];

      if (!currentCountry || (!isConfirmed && currentCountry !== defaultId)) {
        if (defaultId) {
          dispatch(setCurrentCountry({ currentCountry: defaultId }));
        }
      }
    }
  }, [userCountry, currentCountry, dispatch, countriesData]);

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
    showCountryWelcomeDialog,
    setShowCountryWelcomeDialog,
    detectedCountryCode: geoCountryCode,
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