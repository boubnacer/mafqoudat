import { useGetPostsQuery } from "../postsApiSlice";
import { useGetCategoriesQuery, useGetCitiesQuery } from "../../dependencies/dependenciesApiSlice";
import { useTranslation } from "../../../utils/translations";
import Post from "./Post";
import useTitle from "../../../hooks/useTitle";
import { LoadingState, EmptyState, ErrorState } from "../../../components/LoadingStates";
import { useSelector, useDispatch } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { store } from "../../../app/store";
import { 
  Search, 
  Add as AddIcon, 
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  Language,
  LocationOn
} from "@mui/icons-material";
import { 
  Button, 
  Box, 
  Typography, 
  TextField, 
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Paper,
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip,
  Grid,
  Autocomplete,
  CircularProgress,
} from "@mui/material";
import Pagination from "@mui/material/Pagination";
import { useEffect, useState, useMemo, useCallback } from "react";
import useAuth from "../../../hooks/useAuth";
import { selectCurrentCountry, selectFoundOrLost, selectCategoryFilter, selectActiveLink } from "../../../app/state";
import FlexCenter from "../../../components/FlexCenter";
import { authStorage } from "../../../utils/authStorage";



const PostsList = () => {
  useTitle("Mafqoudat | Posts List");

  const theme = useTheme();
  const isMobile = useMediaQuery("(max-width:768px)");

  const user = useAuth();
  const countryId = useSelector(selectCurrentCountry);
  const [currentCountry, setCurrentCountry] = useState(() => {
    // Try to get from Redux first, then localStorage as fallback
    if (countryId) return countryId;
    
    try {
      const savedState = localStorage.getItem('globalState');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        return parsed.currentCountry || user.country;
      }
    } catch (error) {
      console.error('Error parsing localStorage:', error);
    }
    
    return user.country;
  });
  const foundOrlost = useSelector(selectFoundOrLost);
  
  // Debug Redux state changes
  const activeLink = useSelector(selectActiveLink);
  const categoryFilter = useSelector(selectCategoryFilter);
  const dispatch = useDispatch();

  // State management
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [fl, setFl] = useState(foundOrlost);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState("grid");
  const [localCategoryFilter, setLocalCategoryFilter] = useState("all");
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [citySearchTerm, setCitySearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState(null);
  const [debouncedCitySearchTerm, setDebouncedCitySearchTerm] = useState("");
  const [cityAutocompleteOpen, setCityAutocompleteOpen] = useState(false);

  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const location = useLocation();

  // Get URL parameters for filter
  const searchParams = new URLSearchParams(search);
  const urlFilter = searchParams.get('fl'); // Changed from 'filter' to 'fl' to match NavLinks

  // Get current language
  const { t, currentLanguage } = useTranslation();

  // Check if store is ready
  const [storeReady, setStoreReady] = useState(false);

  useEffect(() => {
    // Check if Redux store is properly initialized
    const checkStore = () => {
      const state = store.getState();
      setStoreReady(true);
    };

    // Small delay to ensure store is initialized
    setTimeout(checkStore, 100);
  }, []);

  // Get categories for dynamic filtering (with debouncing to prevent rate limits)
  const { data: categoriesData, isLoading: categoriesLoading, error: categoriesError } = useGetCategoriesQuery({
    language: currentLanguage
  }, {
    selectFromResult: ({ data, isLoading, error }) => ({
      data: data?.ids?.map((id) => data?.entities[id]) || [],
      isLoading,
      error
    }),
    // Add debouncing to prevent multiple API calls during language switch
    refetchOnMountOrArgChange: 500, // 500ms debounce
  });

  // Get cities for city filter (with debouncing)
  // Fetch when user types at least 1 character to show cities immediately
  const { data: citiesData, isLoading: citiesLoading } = useGetCitiesQuery({
    language: currentLanguage,
    search: debouncedCitySearchTerm || undefined,
    countryId: currentCountry,
    active: true
  }, {
    selectFromResult: ({ data, isLoading }) => ({
      data: data?.ids?.map((id) => data?.entities[id]) || [],
      isLoading
    }),
    // Skip if: no country, or no search term at all (allow 1 character minimum)
    skip: !currentCountry || !debouncedCitySearchTerm || debouncedCitySearchTerm.length < 1,
    refetchOnMountOrArgChange: 500,
  });

  // Memoize effectiveFl computation
  const effectiveFl = useMemo(() => {
    return urlFilter || '';
  }, [urlFilter]);

  // Memoize dynamic title based on navigation state
  const pageTitle = useMemo(() => {
    if (foundOrlost === 'FOUND') {
      return t('foundItems');
    } else if (foundOrlost === 'LOST') {
      return t('lostItems');
    } else {
      return t('postsList');
    }
  }, [foundOrlost, t]);

  // Helper function to get city display name - prioritize current language
  // Match the Admin Panel logic: use labels directly, not pre-computed label
  const getCityDisplayName = useCallback((city) => {
    if (!city) return '';
    
    // Priority: current language -> English -> French -> Arabic -> pre-computed label -> code
    // Always prioritize labels object over pre-computed label to ensure correct language
    if (city.labels?.[currentLanguage]) {
      return city.labels[currentLanguage];
    }
    // Fallback to other languages in order
    if (city.labels?.en) return city.labels.en;
    if (city.labels?.fr) return city.labels.fr;
    if (city.labels?.ar) return city.labels.ar;
    // Use pre-computed label only as last resort (might be in wrong language)
    if (city.label) {
      return city.label;
    }
    if (city.code) return city.code;
    return '';
  }, [currentLanguage]);

  // Get cityId from selectedCity
  const cityId = useMemo(() => {
    if (!selectedCity) return undefined;
    const id = selectedCity._id || selectedCity.id;
    // Convert to string if it's an ObjectId-like object
    return id ? String(id) : undefined;
  }, [selectedCity]);

  const { data, isLoading, isSuccess, isError, error } = useGetPostsQuery({
    page,
    pageSize,
    fl: effectiveFl || '', // Always send fl parameter - empty string for "All", ID for "Found"/"Lost"
    currentCountry,
    search: debouncedSearchTerm || undefined,
    categoryId: localCategoryFilter !== "all" ? localCategoryFilter : undefined,
    cityId: cityId,
    language: currentLanguage,
  }, {
    // Add debugging
    refetchOnMountOrArgChange: 500, // 500ms debounce to prevent rate limits
    // Skip the query if dependencies are not ready or store is not ready
    // Remove the categoriesData?.length requirement to prevent infinite loading
    skip: !storeReady || !currentCountry || categoriesLoading,
    // Add retry logic
    retry: 3,
    retryDelay: 1000,
    // Force refetch when fl changes
    refetchOnFocus: false,
    refetchOnReconnect: false
  });

  // Add timeout for loading states - MOVED AFTER query hooks
  useEffect(() => {
    if (isLoading || categoriesLoading) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 10000); // 10 seconds timeout

      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false);
    }
  }, [isLoading, categoriesLoading]);

  // Add fallback for when dependencies fail to load - MOVED AFTER query hooks
  useEffect(() => {
    if (categoriesError && !categoriesLoading) {
      console.error('Categories failed to load:', categoriesError);
      // Try to reload after a delay
      setTimeout(() => {
        window.location.reload();
      }, 5000);
    }
  }, [categoriesError, categoriesLoading]);

  // Initialize category filter from navigation state - MOVED AFTER query hooks
  useEffect(() => {
    if (location.state?.fromCategory && location.state?.categoryFilter) {

      setLocalCategoryFilter(location.state.categoryFilter);
      // Clear the navigation state to prevent it from persisting
      navigate(location.pathname, { replace: true, state: {} });
    } else if (categoryFilter && categoryFilter !== "all") {

      setLocalCategoryFilter(categoryFilter);
    }
  }, [location.state, categoryFilter, navigate, location.pathname]);



  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1); // Reset to first page when search changes
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Debounce city search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCitySearchTerm(citySearchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [citySearchTerm]);

  // Update city search term display when language changes (if a city is selected)
  useEffect(() => {
    if (selectedCity) {
      const cityName = getCityDisplayName(selectedCity);
      setCitySearchTerm(cityName);
    }
  }, [currentLanguage, selectedCity, getCityDisplayName]);

  // Open dropdown when cities data arrives and user has typed at least 1 character
  useEffect(() => {
    if (citySearchTerm.length >= 1) {
      // Always open if user has typed something (will show loading or results)
      setCityAutocompleteOpen(true);
    } else {
      setCityAutocompleteOpen(false);
    }
  }, [citySearchTerm, citiesData, citiesLoading]);

  useEffect(() => {
    // Update currentCountry from Redux state or localStorage
    if (countryId) {
      setCurrentCountry(countryId);
    } else {
      // Fallback to localStorage if Redux state is not available
      try {
        const savedState = localStorage.getItem('globalState');
        if (savedState) {
          const parsed = JSON.parse(savedState);
          if (parsed.currentCountry) {
            setCurrentCountry(parsed.currentCountry);
          }
        }
      } catch (error) {
        console.error('Error reading from localStorage:', error);
      }
    }
    
    // If still no country selected, set a default country (Morocco)
    if (!currentCountry && !countryId) {
      // Don't hardcode country ID - let the user select or use the first available
      console.warn('No country selected, user should select a country first');
      return; // Don't proceed without a valid country
    }
    

    setFl(foundOrlost);
    setPage(1);
  }, [countryId, foundOrlost, currentCountry, dispatch]);

  // Remove the cleanup effect that was clearing the category filter
  // This was interfering with category navigation from Dashboard

  // Memoized event handlers
  const handlePaginate = useCallback((e, p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSearch = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleSortChange = useCallback((e) => {
    setSortBy(e.target.value);
    setPage(1);
  }, []);

  const handleCategoryFilter = useCallback((e) => {
    setLocalCategoryFilter(e.target.value);
    setPage(1);
  }, []);

  const handleCityChange = useCallback((event, newValue) => {
    setSelectedCity(newValue);
    // Update search term to show selected city name in current language
    if (newValue) {
      const cityName = getCityDisplayName(newValue);
      setCitySearchTerm(cityName);
      setCityAutocompleteOpen(false); // Close dropdown when city is selected
    } else {
      setCitySearchTerm('');
      setCityAutocompleteOpen(false);
    }
    setPage(1);
  }, [getCityDisplayName]);

  const handleCityInputChange = useCallback((event, newInputValue, reason) => {
    // Only update search term if user is typing (not when selecting)
    if (reason === 'input') {
      setCitySearchTerm(newInputValue);
      // Always open dropdown if user has typed at least 1 character
      if (newInputValue.length >= 1) {
        setCityAutocompleteOpen(true);
      } else {
        setCityAutocompleteOpen(false);
      }
      // Clear selected city if user starts typing
      if (newInputValue && selectedCity) {
        setSelectedCity(null);
      }
    } else if (reason === 'reset' && selectedCity) {
      // When reset, show the selected city name in current language
      const cityName = getCityDisplayName(selectedCity);
      setCitySearchTerm(cityName);
      setCityAutocompleteOpen(false);
    } else if (reason === 'clear') {
      setCitySearchTerm('');
      setCityAutocompleteOpen(false);
    }
  }, [selectedCity, getCityDisplayName]);

  const handleClearCityFilter = useCallback(() => {
    setSelectedCity(null);
    setCitySearchTerm("");
    setPage(1);
  }, []);

  const handleViewModeChange = useCallback(() => {
    setViewMode(viewMode === "grid" ? "list" : "grid");
  }, [viewMode]);

  const handleMore = useCallback(() => navigate("/dash/posts"), [navigate]);

  const handlePageSizeChange = useCallback((e) => {
    setPageSize(e.target.value);
    setPage(1);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchTerm("");
  }, []);

  const handleClearCategoryFilter = useCallback(() => {
    setLocalCategoryFilter("all");
  }, []);

  const handleClearSort = useCallback(() => {
    setSortBy("newest");
  }, []);

  const handleAddNewPost = useCallback(() => {
    if (!user.username) {
      // Store the intended destination for redirect after login
      const intendedDestination = "/dash/posts/new";
      authStorage.setRedirectAfterLoginWithMessage(intendedDestination, 'loginRequiredCreatePost');
      
      navigate('/login');
    } else {
      navigate("/dash/posts/new");
    }
  }, [user.username, navigate]);

  const handleSelectCountry = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // Check if we have active filters
  const hasActiveFilters = useMemo(() => {
    return searchTerm || localCategoryFilter !== "all" || selectedCity || sortBy !== "newest";
  }, [searchTerm, localCategoryFilter, selectedCity, sortBy]);

  // Get posts from API response (already filtered by country and found/lost)
  const filteredPosts = useMemo(() => {
    if (!data?.postsWithUser) return [];
    return data.postsWithUser;
  }, [data?.postsWithUser]);

  // Memoize category options for the select dropdown
  const categoryOptions = useMemo(() => {
    return categoriesData?.map((category) => ({
      id: category._id,
      label: category.labels?.[currentLanguage] || category.code,
      value: category._id
    })) || [];
  }, [categoriesData, currentLanguage]);

  // Memoize active filter chips data
  const activeFilterChips = useMemo(() => {
    const chips = [];
    
    if (searchTerm) {
      chips.push({
        label: `Search: ${searchTerm}`,
        onDelete: handleClearSearch,
        color: "primary",
        variant: "outlined"
      });
    }
    
    if (selectedCity) {
      chips.push({
        label: `${t('city')}: ${getCityDisplayName(selectedCity)}`,
        onDelete: handleClearCityFilter,
        color: "success",
        variant: "outlined"
      });
    }
    
    if (localCategoryFilter !== "all") {
      const category = categoriesData?.find(cat => cat._id === localCategoryFilter);
      chips.push({
        label: `${t('category')}: ${category?.labels?.[currentLanguage] || category?.code || localCategoryFilter}`,
        onDelete: handleClearCategoryFilter,
        color: "secondary",
        variant: "outlined"
      });
    }
    
    if (sortBy !== "newest") {
      chips.push({
        label: `Sort: ${sortBy}`,
        onDelete: handleClearSort,
        color: "info",
        variant: "outlined"
      });
    }
    
    return chips;
  }, [searchTerm, selectedCity, localCategoryFilter, sortBy, categoriesData, currentLanguage, t, getCityDisplayName, handleClearSearch, handleClearCategoryFilter, handleClearCityFilter, handleClearSort]);

  let content;

  // Check if country is selected
  if (!currentCountry) {
    content = (
      <Box 
        pt={{ xs: "6rem", md: "7rem" }} 
        width="100%"
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="50vh"
      >
        <Box textAlign="center">
          <Typography variant="h6" mb={2}>
            {t('pleaseSelectCountry')}
          </Typography>
          <Typography variant="body2" mb={3} color="text.secondary">
            {t('chooseCountryMessage')}
          </Typography>
          <Button
            variant="contained"
            startIcon={<Language />}
            onClick={handleSelectCountry}
            sx={{
              background: "linear-gradient(45deg, #4A8BFF 30%, #1A6EEE 90%)",
              boxShadow: "0 3px 5px 2px rgba(26, 110, 238, .3)",
              borderRadius: '4px',
              '&:hover': {
                background: 'linear-gradient(45deg, #5A9BFF 30%, #2A7EFF 90%)',
                boxShadow: '0 4px 8px 2px rgba(26, 110, 238, .4)',
              }
            }}
          >
            {t('selectCountry')}
          </Button>
        </Box>
      </Box>
    );
  } else if (isLoading || categoriesLoading) {
    if (loadingTimeout) {
      content = (
        <ErrorState
          title="Loading timeout"
          message="The page is taking longer than expected to load. Please try refreshing the page."
          onRetry={() => window.location.reload()}
        />
      );
    } else {
      content = <LoadingState message={t('loadingPosts')} />;
    }
  } else if (isError) {
    content = (
      <ErrorState
        title="Failed to load posts"
        message={error?.data?.message || "Please try again later"}
        onRetry={() => window.location.reload()}
      />
    );
  } else if (categoriesError) {
    content = (
      <ErrorState
        title="Failed to load categories"
        message={categoriesError?.data?.message || "Please try again later"}
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (isSuccess && currentCountry) {
    const { totalPages } = data;

    return (
      <Box sx={{ 
        p: { xs: 2, md: 4 },
        pt: { xs: "6rem", md: "7rem" },
        minHeight: "100vh"
      }}>
        {/* Header Section */}
        <Box sx={{ mb: 4 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Typography 
                variant="h3" 
                sx={{ 
                  color: theme.palette.textColor.main,
                  fontWeight: 700,
                  mb: 1
                }}
              >
                {pageTitle}
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddNewPost}
              sx={{
                borderRadius: '4px',
                px: 3,
                py: 1,
                textTransform: 'none',
                fontWeight: 600,
                background: 'linear-gradient(45deg, #4A8BFF 30%, #1A6EEE 90%)',
                boxShadow: '0 3px 5px 2px rgba(26, 110, 238, .3)',
                color: '#fff !important',
                '&:hover': {
                  background: 'linear-gradient(45deg, #5A9BFF 30%, #2A7EFF 90%)',
                  boxShadow: '0 4px 8px 2px rgba(26, 110, 238, .4)',
                  color: '#fff !important',
                }
              }}
            >
              {t('addNewPost')}
            </Button>
          </Box>

          {/* Filters and Search - Always visible */}
          <Paper 
            elevation={2} 
            sx={{ 
              p: 3, 
              borderRadius: 3,
              background: theme.palette.background.paper
            }}
          >
            <Grid container spacing={3} alignItems="center">
              {/* Search - Hidden for now */}
              {/* <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder={t('searchPostsPlaceholder')}
                  value={searchTerm}
                  onChange={handleSearch}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ 
                    '& .MuiOutlinedInput-root': { 
                      borderRadius: 2 
                    } 
                  }}
                />
              </Grid> */}

              {/* Sort - Hidden for now */}
              {/* <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>{t('sortBy')}</InputLabel>
                  <Select
                    value={sortBy}
                    label={t('sortBy')}
                    onChange={handleSortChange}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="newest">{t('newestFirst')}</MenuItem>
                    <MenuItem value="oldest">{t('oldestFirst')}</MenuItem>
                    <MenuItem value="region">{t('byRegion')}</MenuItem>
                    <MenuItem value="category">{t('byCategory')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid> */}

              {/* Category Filter */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>{t('category')}</InputLabel>
                  <Select
                    value={localCategoryFilter}
                    label={t('category')}
                    onChange={handleCategoryFilter}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="all">{t('allCategories')}</MenuItem>
                    {categoryOptions.map((category) => (
                      <MenuItem key={category.id} value={category.value}>
                        {category.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* City Filter */}
              <Grid item xs={12} sm={6} md={3}>
                <Autocomplete
                  fullWidth
                  options={citiesData || []}
                  value={selectedCity}
                  onChange={handleCityChange}
                  onInputChange={handleCityInputChange}
                  inputValue={citySearchTerm}
                  open={cityAutocompleteOpen}
                  onOpen={() => {
                    if (citySearchTerm.length >= 1) {
                      setCityAutocompleteOpen(true);
                    }
                  }}
                  onClose={() => setCityAutocompleteOpen(false)}
                  openOnFocus={false}
                  getOptionLabel={(option) => {
                    if (typeof option === 'string') return option;
                    return getCityDisplayName(option);
                  }}
                  isOptionEqualToValue={(option, value) => {
                    if (!option || !value) return false;
                    const optionId = option._id || option.id;
                    const valueId = value._id || value.id;
                    return optionId && valueId && optionId.toString() === valueId.toString();
                  }}
                  loading={citiesLoading}
                  filterOptions={(options) => options} // Disable client-side filtering, use server-side search
                  noOptionsText={
                    citiesLoading 
                      ? (t('loading') || 'Loading...')
                      : citySearchTerm.length >= 1 
                        ? t('noSearchResults')
                        : t('searchCityPlaceholder')
                  }
                  renderOption={(props, option) => (
                    <li {...props} key={option._id || option.id}>
                      {getCityDisplayName(option)}
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('city')}
                      placeholder={t('searchCityPlaceholder')}
                      sx={{ borderRadius: 2 }}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {citiesLoading ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  sx={{ 
                    '& .MuiOutlinedInput-root': { 
                      borderRadius: 2 
                    } 
                  }}
                />
              </Grid>

              {/* View Mode Toggle - Hidden for now */}
              {/* <Grid item xs={12} md={3}>
                <Box display="flex" justifyContent="center" gap={1}>
                  <Tooltip title={t('gridView')}>
                    <IconButton
                      onClick={() => setViewMode("grid")}
                      color={viewMode === "grid" ? "primary" : "default"}
                      sx={{ 
                        borderRadius: 2,
                        backgroundColor: viewMode === "grid" ? theme.palette.primary.light + '20' : 'transparent'
                      }}
                    >
                      <ViewModuleIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('listView')}>
                    <IconButton
                      onClick={() => setViewMode("list")}
                      color={viewMode === "list" ? "primary" : "default"}
                      sx={{ 
                        borderRadius: 2,
                        backgroundColor: viewMode === "list" ? theme.palette.primary.light + '20' : 'transparent'
                      }}
                    >
                      <ViewListIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid> */}

              {/* Active Filters Display */}
              <Grid item xs={12}>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {activeFilterChips.map((chip, index) => (
                    <Chip 
                      key={index}
                      label={chip.label} 
                      onDelete={chip.onDelete}
                      color={chip.color}
                      variant={chip.variant}
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Box>

        {/* Posts Content */}
        {filteredPosts?.length ? (
          <>
            {/* Posts Grid/List */}
            <Box sx={{ mb: 4 }}>
              <Box
                display="grid"
                gap={3}
                sx={{
                  gridTemplateColumns: viewMode === "grid" ? {
                    xs: "repeat(1, 1fr)",
                    sm: "repeat(2, 1fr)",
                    md: "repeat(3, 1fr)",
                    lg: "repeat(4, 1fr)",
                    xl: "repeat(4, 1fr)", // Reduced from 5 to 4 to prevent overflow
                  } : "repeat(1, 1fr)",
                  // Remove conflicting width constraints and let grid handle sizing
                  '& > *': {
                    width: '100%',
                    minHeight: 'fit-content',
                  },
                  // Ensure the grid container doesn't overflow
                  maxWidth: '100%',
                  overflow: 'hidden'
                }}
              >
                {filteredPosts.map((post) => (
                  <Post 
                    key={post._id} 
                    post={post} 
                    viewMode={viewMode}
                  />
                ))}
              </Box>
            </Box>

            {/* Enhanced Pagination */}
            {totalPages > 1 && (
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 3, 
                  borderRadius: 3,
                  background: theme.palette.background.paper
                }}
              >
                <Box
                  display="flex"
                  flexDirection={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  alignItems="center"
                  gap={2}
                >
                  <Typography variant="body2" color="text.secondary">
                    {t('page')} {page} {t('of')} {totalPages} • {filteredPosts.length} {t('posts')}
                  </Typography>
                  
                  <Pagination
                    page={page}
                    count={totalPages}
                    onChange={handlePaginate}
                    color="primary"
                    size={isMobile ? "small" : "medium"}
                    showFirstButton
                    showLastButton
                    sx={{
                      '& .MuiPaginationItem-root': {
                        borderRadius: 2,
                        fontWeight: 600
                      }
                    }}
                  />
                  
                  <Box display="flex" gap={1} alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      {t('postsPerPage')}:
                    </Typography>
                    <Select
                      value={pageSize}
                      onChange={handlePageSizeChange}
                      size="small"
                      sx={{ minWidth: 80 }}
                    >
                      <MenuItem value={4}>4</MenuItem>
                      <MenuItem value={8}>8</MenuItem>
                      <MenuItem value={12}>12</MenuItem>
                      <MenuItem value={16}>16</MenuItem>
                    </Select>
                  </Box>
                </Box>
              </Paper>
            )}
          </>
        ) : (
          <EmptyState
            icon={Search}
            title={
              selectedCity 
                ? t('noPostsInCity', { cityName: getCityDisplayName(selectedCity) })
                : hasActiveFilters 
                  ? t('noPostsMatchFilters') 
                  : t('noPostsFound')
            }
            description={
              selectedCity
                ? t('noPostsInCityDescription', { cityName: getCityDisplayName(selectedCity) })
                : hasActiveFilters
                  ? t('adjustFilters')
                  : `${t('noPostsInArea')} ${t('tryChangingCountry')}`
            }
            action={
              <Box display="flex" gap={2} flexWrap="wrap" justifyContent="center">
                <Link to="/dash/posts/new">
                  <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    sx={{ 
                      borderRadius: '4px',
                      px: 3,
                      py: 1,
                      textTransform: 'none',
                      fontWeight: 600,
                      background: 'linear-gradient(45deg, #4A8BFF 30%, #1A6EEE 90%)',
                      boxShadow: '0 3px 5px 2px rgba(26, 110, 238, .3)',
                      color: '#fff !important',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #5A9BFF 30%, #2A7EFF 90%)',
                        boxShadow: '0 4px 8px 2px rgba(26, 110, 238, .4)',
                        color: '#fff !important',
                      },
                      '& .MuiButton-startIcon': {
                        marginRight: currentLanguage === 'ar' ? 0 : '8px',
                        marginLeft: currentLanguage === 'ar' ? '8px' : 0,
                      }
                    }}
                  >
                    {selectedCity 
                      ? t('createPostInCity', { cityName: getCityDisplayName(selectedCity) })
                      : t('addNewPost')
                    }
                  </Button>
                </Link>
                {!selectedCity && (
                  <Button 
                    variant="outlined" 
                    startIcon={<Language />}
                    onClick={handleSelectCountry}
                    sx={{ 
                      borderRadius: '4px',
                      px: 3,
                      py: 1,
                      textTransform: 'none',
                      fontWeight: 600,
                      borderColor: '#4A8BFF',
                      color: '#4A8BFF',
                      '&:hover': {
                        borderColor: '#5A9BFF',
                        backgroundColor: 'rgba(74, 139, 255, 0.1)',
                      },
                      '& .MuiButton-startIcon': {
                        marginRight: currentLanguage === 'ar' ? 0 : '8px',
                        marginLeft: currentLanguage === 'ar' ? '8px' : 0,
                      }
                    }}
                  >
                    {t('changeCountry')}
                  </Button>
                )}
              </Box>
            }
          />
        )}
      </Box>
    );
  }
  
  return content;
};

export default PostsList;
