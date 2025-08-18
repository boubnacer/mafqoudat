import { useState, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useGetDashboardQuery, useGetPostsQuery } from '../features/posts/postsApiSlice';
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

  // Set user's country from JWT token if not already set in Redux
  useEffect(() => {
    if (userCountry && !currentCountry) {
      dispatch(setCurrentCountry({ currentCountry: userCountry }));
    } else if (!currentCountry && countriesData?.ids?.length > 0) {
      // Set default country if none is set
      const defaultCountryId = countriesData.ids[0];
      dispatch(setCurrentCountry({ currentCountry: defaultCountryId }));
    } else if (!currentCountry) {
      // Set a fallback country if no countries data is available or if query fails
      // Use Morocco as fallback instead of US
      dispatch(setCurrentCountry({ currentCountry: '507f1f77bcf86cd799439011' }));
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
    
    // Data
    data,
    isError,
    error,
    isLoading,
    trend,
    createdtoday,
    searchData,
    isSearchLoading,
    countriesError,
    
    // Actions
    setShareStoryOpen,
    setShowCommunityDialog,
    setShowHelpDialog,
    setHelpTab,
    handleSearchChange,
  };
}; 