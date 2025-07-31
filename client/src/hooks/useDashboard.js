import { useState, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useGetDashboardQuery, useGetPostsQuery } from '../features/posts/postsApiSlice';
import { selectCurrentCountry, setCurrentCountry } from '../app/state';
import { useGetCountriesQuery } from '../features/countries/countriesApiSlice';
import debounce from 'lodash/debounce';
import useAuth from './useAuth';
import { getCurrentLanguage } from '../utils/languageUtils';

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

  // Get countries list
  const { data: countriesData } = useGetCountriesQuery({
    language: getCurrentLanguage()
  });

  // Set user's country from JWT token if not already set in Redux
  useEffect(() => {
    if (userCountry && !currentCountry) {
      dispatch(setCurrentCountry({ currentCountry: userCountry }));
    } else if (!currentCountry && countriesData?.ids?.length > 0) {
      // Set default country if none is set
      const defaultCountryId = countriesData.ids[0];
      dispatch(setCurrentCountry({ currentCountry: defaultCountryId }));
    }
  }, [userCountry, currentCountry, dispatch, countriesData]);

  // Dashboard data query - skip if no currentCountry
  const { 
    data, 
    isError, 
    error, 
    isLoading 
  } = useGetDashboardQuery({
    currentCountry,
  }, {
    skip: !currentCountry
  });

  // Search query
  const { 
    data: searchData, 
    isLoading: isSearchLoading 
  } = useGetPostsQuery({
    page: 1,
    pageSize: 10,
    currentCountry,
    search: searchQuery
  }, {
    skip: !searchQuery
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
    
    // Data
    data,
    isError,
    error,
    isLoading,
    trend,
    createdtoday,
    searchData,
    isSearchLoading,
    
    // Actions
    setShareStoryOpen,
    setShowCommunityDialog,
    setShowHelpDialog,
    setHelpTab,
    handleSearchChange,
  };
}; 