import { useGetPostsQuery } from "../postsApiSlice";
import { useGetCategoriesQuery, useGetCitiesQuery } from "../../dependencies/dependenciesApiSlice";
import { useTranslation } from "../../../utils/translations";
import Post from "./Post";
import useTitle from "../../../hooks/useTitle";
import { ErrorState } from "../../../components/LoadingStates";
import PostsListSkeleton from "./PostsListSkeleton";
import SeoMeta from "../../../components/SeoMeta";
import { useSelector, useDispatch } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { store } from "../../../app/store";
import {
  Search,
  Add as AddIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  Language,
  LocationOn,
  TuneRounded as FilterIcon,
  CategoryOutlined as CategoryIcon,
  ExpandMoreRounded as ExpandMoreIcon,
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
  Alert,
  alpha,
  lighten,
  Collapse,
} from "@mui/material";
import Pagination from "@mui/material/Pagination";
import { useEffect, useState, useMemo, useCallback, useLayoutEffect } from "react";
import useAuth from "../../../hooks/useAuth";
import { selectCurrentCountry, selectFoundOrLost, selectCategoryFilter, selectActiveLink } from "../../../app/state";
import FlexCenter from "../../../components/FlexCenter";
import { authStorage } from "../../../utils/authStorage";


/**
 * Normalize Arabic text by removing diacritics and normalizing similar characters
 * This helps match "اكادير" with "أكادير" (without/with hamza on alif)
 * @param {string} text - Text to normalize
 * @returns {string} - Normalized text
 */
const normalizeArabicText = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  return text
    // Remove Arabic diacritics (harakat): fatha, damma, kasra, shadda, sukun, etc.
    .replace(/[\u064B-\u065F\u0670]/g, '') // Remove combining diacritics
    // Normalize Arabic characters with hamza to base characters
    .replace(/أ|إ|آ/g, 'ا') // Normalize alif with hamza variations to plain alif
    .replace(/ى/g, 'ي') // Normalize alif maksura to ya
    .replace(/ة/g, 'ه') // Normalize ta marbuta to ha
    .replace(/[ًٌٍَُِّْ]/g, '') // Remove standalone diacritics
    .toLowerCase()
    .trim();
};

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
  // Seeded from ?search= so the WebSite SearchAction in public/index.html
  // describes something real: Google's sitelinks searchbox sends users to
  // /dash/posts?search=<term>, and that has to actually search on arrival.
  const initialSearchTerm = new URLSearchParams(window.location.search).get('search') || "";
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialSearchTerm);
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState("grid");
  const [localCategoryFilter, setLocalCategoryFilter] = useState("all");
  const [selectedCategories, setSelectedCategories] = useState([]); // Multiple categories filter
  // Collapsed by default - only the "Filters" header row shows until pressed.
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  // The filter bar is fixed below the navbar so it never scrolls out of view;
  // its height changes as it expands/collapses (and per language/breakpoint),
  // so a spacer of the same height is kept in the normal flow to reserve its
  // space rather than letting content jump underneath it.
  // A state-backed callback ref (not a plain useRef) because this component
  // returns a loading skeleton first - the filter bar (and its DOM node)
  // don't exist until the success branch renders, so the observer effect
  // needs to react to the node actually appearing rather than only running
  // once on mount.
  const [filterBarNode, setFilterBarNode] = useState(null);
  const filterBarRef = useCallback((node) => setFilterBarNode(node), []);
  const [filterBarHeight, setFilterBarHeight] = useState(0);
  // Real rendered height of the fixed navbar, measured rather than guessed -
  // it differs by breakpoint (and can shift with font loading/i18n string
  // length), and the filter bar has to sit flush under it with no dead gap.
  const [navbarHeight, setNavbarHeight] = useState(0);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [citySearchTerm, setCitySearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState(null);
  const [debouncedCitySearchTerm, setDebouncedCitySearchTerm] = useState("");
  const [cityInputFocused, setCityInputFocused] = useState(false);
  const [cachedCities, setCachedCities] = useState(() => {
    // Load cached cities from localStorage
    if (typeof window === 'undefined') return [];
    
    try {
      const cached = localStorage.getItem('cachedCities');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        } else if (Array.isArray(parsed) && parsed.length === 0) {
          // Empty array is valid, just return empty
        } else {
          console.error('Cached data is not a valid array:', parsed);
        }
      }
    } catch (error) {
      console.error('Error loading cached cities:', error);
      // If there's corrupted data, clear it
      try {
        localStorage.removeItem('cachedCities');
      } catch (e) {
        console.error('Error clearing corrupted cache:', e);
      }
    }
    return [];
  });

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

  // Verify cached cities are loaded on mount and ensure they're in state
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Always check localStorage on mount to verify state matches
    try {
      const cached = localStorage.getItem('cachedCities');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Normalize country fields in cached cities to ensure consistent filtering
          const normalizedCities = parsed.map(city => {
            if (city && city.country) {
              const normalizedCountry = typeof city.country === 'object' 
                ? (city.country._id || city.country.id || city.country)
                : city.country;
              return {
                ...city,
                country: normalizedCountry ? String(normalizedCountry) : city.country
              };
            }
            return city;
          });
          
          // Only update if different to avoid unnecessary re-renders
          setCachedCities(prevCached => {
            if (prevCached.length !== normalizedCities.length || 
                prevCached.some((city, idx) => {
                  const cachedId = city?._id || city?.id;
                  const parsedId = normalizedCities[idx]?._id || normalizedCities[idx]?.id;
                  return cachedId !== parsedId;
                })) {
              return normalizedCities;
            }
            return prevCached;
          });
        } else if (!Array.isArray(parsed)) {
          console.error('Cached data is not an array:', typeof parsed);
          localStorage.removeItem('cachedCities');
        }
      }
    } catch (error) {
      console.error('Error verifying cached cities on mount:', error);
      // If there's corrupted data, clear it
      try {
        localStorage.removeItem('cachedCities');
      } catch (e) {
        console.error('Error clearing corrupted cache:', e);
      }
    }
  }, []); // Only run once on mount

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

  // Get all cached cities for current country (for showing when focused)
  const allCachedCitiesForCountry = useMemo(() => {
    if (!currentCountry) {
      return [];
    }
    
    const filtered = cachedCities.filter(city => {
      if (!city || !city.labels) {
        return false;
      }
      
      // Filter by country if available
      if (currentCountry && city.country) {
        const cityCountryId = typeof city.country === 'object' ? (city.country._id || city.country.id) : city.country;
        const currentCountryId = typeof currentCountry === 'object' ? (currentCountry._id || currentCountry.id) : currentCountry;
        
        const cityCountryStr = cityCountryId ? cityCountryId.toString() : '';
        const currentCountryStr = currentCountryId ? currentCountryId.toString() : '';
        
        // If both have country IDs and they don't match, filter out
        if (cityCountryStr && currentCountryStr && cityCountryStr !== currentCountryStr) {
          return false;
        }
      }
      
      // If city has no country info, include it (might be from old cache)
      // If currentCountry exists but city.country doesn't, include it
      return true;
    });
    
    return filtered;
  }, [cachedCities, currentCountry]);

  // Filter cached cities by search term and country
  const filteredCachedCities = useMemo(() => {
    if (!currentCountry) return [];
    
    // If no search term, return all cached cities for the country (when focused)
    if (!debouncedCitySearchTerm || debouncedCitySearchTerm.length < 1) {
      return allCachedCitiesForCountry;
    }
    
    // Normalize search term for better matching (especially for Arabic)
    const normalizedSearch = normalizeArabicText(debouncedCitySearchTerm);
    const searchLower = debouncedCitySearchTerm.toLowerCase();
    
    return allCachedCitiesForCountry.filter(city => {
      if (!city || !city.labels) return false;
      
      // Get city names in all languages
      const cityNameEn = city.labels?.en || '';
      const cityNameFr = city.labels?.fr || '';
      const cityNameAr = city.labels?.ar || '';
      const cityCode = city.code || '';
      
      // Normalize Arabic text for better matching
      const normalizedEn = normalizeArabicText(cityNameEn);
      const normalizedFr = normalizeArabicText(cityNameFr);
      const normalizedAr = normalizeArabicText(cityNameAr);
      const normalizedCode = normalizeArabicText(cityCode);
      
      // Also check with lowercase for non-Arabic text
      const lowerEn = cityNameEn.toLowerCase();
      const lowerFr = cityNameFr.toLowerCase();
      const lowerAr = cityNameAr.toLowerCase();
      const lowerCode = cityCode.toLowerCase();
      
      // Match using both normalized (for Arabic) and lowercase (for other languages)
      return normalizedEn.includes(normalizedSearch) || 
             normalizedFr.includes(normalizedSearch) || 
             normalizedAr.includes(normalizedSearch) ||
             normalizedCode.includes(normalizedSearch) ||
             lowerEn.includes(searchLower) || 
             lowerFr.includes(searchLower) || 
             lowerAr.includes(searchLower) ||
             lowerCode.includes(searchLower);
    });
  }, [allCachedCitiesForCountry, debouncedCitySearchTerm, currentCountry]);

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


  // Combine cached and API cities, removing duplicates
  // When focused with no search term, show cached cities
  // When typing, show filtered cached cities + API results
  const allCitiesData = useMemo(() => {
    // Start with filtered cached cities (which includes all cached cities when no search term)
    const combined = [...filteredCachedCities];
    const existingIds = new Set(combined.map(c => c._id || c.id));
    
    // Add API results if available (when user is typing)
    if (citiesData && citiesData.length > 0) {
      citiesData.forEach(city => {
        const cityId = city._id || city.id;
        if (!existingIds.has(cityId)) {
          combined.push(city);
          existingIds.add(cityId);
        }
      });
    }
    
    return combined;
  }, [filteredCachedCities, citiesData]);

  // Memoize effectiveFl computation
  const effectiveFl = useMemo(() => {
    return urlFilter || '';
  }, [urlFilter]);

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
    categoryId: localCategoryFilter !== "all" && selectedCategories.length === 0 ? localCategoryFilter : undefined, // Legacy single category (backward compatibility)
    categoryIds: selectedCategories.length > 0 ? selectedCategories : undefined, // Multiple categories (new format)
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



  // Track the fixed filter bar's rendered height (it changes as it expands/
  // collapses via Collapse's own animation) so the spacer below can always
  // reserve exactly that much space. Depends on filterBarNode (not a mount-
  // only []) because the bar doesn't exist in the DOM until the query
  // resolves and the success branch renders it.
  useLayoutEffect(() => {
    if (!filterBarNode || typeof ResizeObserver === 'undefined') return undefined;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setFilterBarHeight(entry.contentRect.height);
      }
    });
    observer.observe(filterBarNode);
    return () => observer.disconnect();
  }, [filterBarNode]);

  // Measure the real fixed navbar height rather than guessing a fixed rem
  // value - it differs by breakpoint and can shift with content/i18n, and
  // the filter bar has to sit flush under it with no dead gap.
  useLayoutEffect(() => {
    if (typeof ResizeObserver === 'undefined') return undefined;
    const header = document.querySelector('header.MuiAppBar-root') || document.querySelector('header');
    if (!header) return undefined;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setNavbarHeight(entry.contentRect.height);
      }
    });
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  const handleToggleFilters = useCallback(() => {
    setFiltersExpanded((prev) => !prev);
  }, []);

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
    // Clear multiple categories when using single category filter
    if (e.target.value !== "all") {
      setSelectedCategories([]);
    }
    setPage(1);
  }, []);

  const handleCategoriesFilter = useCallback((event, newValue) => {
    const categoryIds = newValue.map(cat => cat.id || cat._id || cat);
    setSelectedCategories(categoryIds);
    // Clear single category filter when using multiple categories
    if (categoryIds.length > 0) {
      setLocalCategoryFilter("all");
    }
    setPage(1);
  }, []);

  const handleCityChange = useCallback((event, newValue) => {
    setSelectedCity(newValue);
    // Update search term to show selected city name in current language
    if (newValue) {
      const cityName = getCityDisplayName(newValue);
      setCitySearchTerm(cityName);
      
      // Save selected city to cache if not already there
      setCachedCities(prevCached => {
        const exists = prevCached.some(c => 
          (c._id || c.id) === (newValue._id || newValue.id)
        );
        if (!exists) {
          // Normalize country to always be a string ID for consistent filtering
          let normalizedCountry = currentCountry;
          if (newValue.country) {
            normalizedCountry = typeof newValue.country === 'object' 
              ? (newValue.country._id || newValue.country.id || currentCountry)
              : newValue.country;
          }
          // Ensure it's a string
          normalizedCountry = normalizedCountry ? String(normalizedCountry) : currentCountry;
          
          const cityToCache = {
            ...newValue,
            country: normalizedCountry
          };
          const newCached = [...prevCached, cityToCache];
          
          // Limit cache size to prevent localStorage from getting too large (keep last 100 cities)
          const limitedCache = newCached.slice(-100);
          
          // Save to localStorage
          try {
            localStorage.setItem('cachedCities', JSON.stringify(limitedCache));
          } catch (error) {
            console.error('Error saving cached cities:', error);
            // If localStorage is full, try to clear old entries
            try {
              const reducedCache = newCached.slice(-50);
              localStorage.setItem('cachedCities', JSON.stringify(reducedCache));
              return reducedCache;
            } catch (e) {
              console.error('Error saving reduced cached cities:', e);
            }
          }
          
          return limitedCache;
        }
        return prevCached;
      });
    } else {
      setCitySearchTerm('');
    }
    setPage(1);
    // Dropdown will close automatically because open={citySearchTerm.length >= 1 && !selectedCity}
  }, [getCityDisplayName, currentCountry]);

  const handleCityInputChange = useCallback((event, newInputValue, reason) => {
    // Only update search term if user is typing (not when selecting)
    if (reason === 'input') {
      setCitySearchTerm(newInputValue);
      // Clear selected city if user starts typing
      if (newInputValue && selectedCity) {
        setSelectedCity(null);
      }
    } else if (reason === 'reset' && selectedCity) {
      // When reset, show the selected city name in current language
      const cityName = getCityDisplayName(selectedCity);
      setCitySearchTerm(cityName);
    } else if (reason === 'clear') {
      setCitySearchTerm('');
      setSelectedCity(null);
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
    setSelectedCategories([]);
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
    return searchTerm || localCategoryFilter !== "all" || selectedCategories.length > 0 || selectedCity || sortBy !== "newest";
  }, [searchTerm, localCategoryFilter, selectedCategories, selectedCity, sortBy]);

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
      });
    }

    if (selectedCity) {
      chips.push({
        label: `${t('city')}: ${getCityDisplayName(selectedCity)}`,
        onDelete: handleClearCityFilter,
      });
    }

    if (selectedCategories.length > 0) {
      selectedCategories.forEach(categoryId => {
        const category = categoriesData?.find(cat => cat._id === categoryId);
        chips.push({
          label: `${t('category')}: ${category?.labels?.[currentLanguage] || category?.code || categoryId}`,
          onDelete: () => {
            setSelectedCategories(prev => prev.filter(id => id !== categoryId));
            setPage(1);
          },
        });
      });
    } else if (localCategoryFilter !== "all") {
      const category = categoriesData?.find(cat => cat._id === localCategoryFilter);
      chips.push({
        label: `${t('category')}: ${category?.labels?.[currentLanguage] || category?.code || localCategoryFilter}`,
        onDelete: handleClearCategoryFilter,
      });
    }

    if (sortBy !== "newest") {
      chips.push({
        label: `Sort: ${sortBy}`,
        onDelete: handleClearSort,
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
              backgroundColor: theme.custom.color.brandPrimary,
              borderRadius: `${theme.custom.radius.md}px`,
              '&:hover': {
                backgroundColor: theme.custom.color.brandPrimary,
                opacity: 0.9,
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
      content = <PostsListSkeleton />;
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

    // Filter panel treatment mirrors PostPage's SocialReach "SaaS panel" look
    // (glass card, brand-tinted glow/border, tinted pill controls) rather than
    // the flat bordered Paper this section used before.
    const brand = theme.custom.color.brandPrimary;
    const isDark = theme.palette.mode === 'dark';
    // radial-gradient has no logical-property equivalent, so the glow's start
    // corner is picked from theme.direction instead of a fixed 0% 0%.
    const glowOrigin = theme.direction === 'rtl' ? '100% 0%' : '0% 0%';
    const filterFieldSx = {
      '& .MuiOutlinedInput-root': {
        borderRadius: `${theme.custom.radius.md}px`,
        backgroundColor: alpha(brand, isDark ? 0.07 : 0.035),
        transition: 'background-color 0.2s ease',
        '& fieldset': { borderColor: alpha(brand, isDark ? 0.3 : 0.16) },
        '&:hover fieldset': { borderColor: alpha(brand, isDark ? 0.5 : 0.32) },
        '&.Mui-focused': { backgroundColor: alpha(brand, isDark ? 0.12 : 0.06) },
        '&.Mui-focused fieldset': { borderColor: brand, borderWidth: '1.5px' },
      },
      '& .MuiInputLabel-root.Mui-focused': { color: brand },
    };
    const filterFieldIconBadgeSx = {
      width: 26,
      height: 26,
      borderRadius: `${theme.custom.radius.sm}px`,
      backgroundColor: alpha(brand, isDark ? 0.18 : 0.1),
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      marginInlineEnd: 1,
    };
    const handleClearAllFilters = () => {
      handleClearCategoryFilter();
      handleClearCityFilter();
      handleClearSort();
      handleClearSearch();
    };
    // Falls back to the old approximate values only for the very first paint
    // before the navbar's real height has been measured.
    const navbarClearance = navbarHeight || (isMobile ? 96 : 112);

    return (
      <>
        <SeoMeta pageKey="dashPosts" />
        <Box sx={{
        p: { xs: 2, md: 4 },
        pt: `${navbarClearance}px`,
        minHeight: "100vh",
        backgroundColor: theme.custom.color.postsListBackdrop
      }}>
        {/* Filter bar is fixed flush below the navbar (top matches its
            measured height, no extra gap) so it's always reachable while
            scrolling. Collapsed by default - only this header row shows until
            pressed; the spacer right after it reserves whatever height the
            bar currently renders at (it grows when expanded), so page content
            is never covered by or jumps under the fixed bar. */}
        <Box
          ref={filterBarRef}
          sx={{
            position: 'fixed',
            top: `${navbarClearance}px`,
            insetInlineStart: 0,
            insetInlineEnd: 0,
            zIndex: (t) => t.zIndex.appBar - 1,
            backgroundColor: theme.custom.color.postsListBackdrop,
            px: { xs: 2, md: 4 },
            pt: 1,
            pb: 2,
          }}
        >
          <Box
            sx={{
              p: { xs: 2, md: 3 },
              position: 'relative',
              overflow: 'hidden',
              borderRadius: `${theme.custom.radius.lg}px`,
              border: `1px solid ${alpha(brand, isDark ? 0.35 : 0.18)}`,
              backgroundColor: theme.custom.color.surfaceRaised,
              backgroundImage: `radial-gradient(120% 100% at ${glowOrigin}, ${alpha(brand, isDark ? 0.16 : 0.07)} 0%, transparent 55%)`,
              boxShadow: `${theme.custom.elevation.e2}, 0 0 32px ${alpha(brand, isDark ? 0.16 : 0.08)}`,
            }}
          >
            <Box
              onClick={handleToggleFilters}
              role="button"
              tabIndex={0}
              aria-expanded={filtersExpanded}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleToggleFilters();
                }
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 1.5,
                mb: filtersExpanded ? 2.5 : 0,
                cursor: 'pointer',
                userSelect: 'none',
                borderRadius: `${theme.custom.radius.sm}px`,
                '&:focus-visible': {
                  outline: `2px solid ${brand}`,
                  outlineOffset: 2,
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <Box
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: `${theme.custom.radius.sm}px`,
                    backgroundImage: `linear-gradient(135deg, ${brand} 0%, ${lighten(brand, 0.45)} 100%)`,
                    boxShadow: `0 0 16px ${alpha(brand, 0.4)}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <FilterIcon sx={{ fontSize: 18, color: theme.palette.getContrastText(brand) }} />
                </Box>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, color: theme.custom.color.ink, fontSize: { xs: '1rem', md: '1.1rem' } }}
                >
                  {t('filters')}
                </Typography>
                {!filtersExpanded && activeFilterChips.length > 0 && (
                  <Box
                    sx={{
                      minWidth: 20,
                      height: 20,
                      px: 0.5,
                      borderRadius: '999px',
                      backgroundColor: brand,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 700, fontSize: '0.7rem', color: theme.palette.getContrastText(brand), lineHeight: 1 }}
                    >
                      {activeFilterChips.length}
                    </Typography>
                  </Box>
                )}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {hasActiveFilters && (
                  <Button
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearAllFilters();
                    }}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      borderRadius: `${theme.custom.radius.sm}px`,
                      color: brand,
                      '&:hover': { backgroundColor: alpha(brand, 0.08) },
                    }}
                  >
                    {t('clearFilters')}
                  </Button>
                )}
                <ExpandMoreIcon
                  sx={{
                    color: brand,
                    transform: filtersExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                />
              </Box>
            </Box>

            <Collapse in={filtersExpanded} timeout="auto" unmountOnExit>
            <Grid container spacing={2} alignItems="center">
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

              {/* Category Filter - Multiple categories support */}
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  multiple
                  options={categoryOptions || []}
                  getOptionLabel={(option) => {
                    if (typeof option === 'string') {
                      const cat = categoryOptions.find(c => c.id === option || c.value === option);
                      return cat?.label || option;
                    }
                    return option.label || option.id || '';
                  }}
                  value={selectedCategories.length > 0
                    ? categoryOptions.filter(cat => selectedCategories.includes(cat.id || cat.value))
                    : (localCategoryFilter !== "all"
                        ? categoryOptions.filter(cat => (cat.id || cat.value) === localCategoryFilter)
                        : [])
                  }
                  onChange={handleCategoriesFilter}
                  isOptionEqualToValue={(option, value) => {
                    const optionId = option.id || option.value;
                    const valueId = value.id || value.value;
                    return optionId === valueId;
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('category')}
                      placeholder={selectedCategories.length === 0
                        ? (currentLanguage === 'ar' ? 'اختر الفئات...' : currentLanguage === 'fr' ? 'Sélectionner les catégories...' : 'Select categories...')
                        : ''
                      }
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <Box sx={filterFieldIconBadgeSx}>
                              <CategoryIcon sx={{ fontSize: 15, color: brand }} />
                            </Box>
                            {params.InputProps.startAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => {
                      const { key, ...tagProps } = getTagProps({ index });
                      return (
                        <Chip
                          key={key}
                          label={option.label || option.id}
                          {...tagProps}
                          size="small"
                          sx={{
                            borderRadius: '999px',
                            backgroundColor: alpha(brand, isDark ? 0.18 : 0.1),
                            color: brand,
                            fontWeight: 600,
                            '& .MuiChip-deleteIcon': {
                              color: alpha(brand, 0.7),
                              '&:hover': { color: brand },
                            },
                          }}
                        />
                      );
                    })
                  }
                  sx={filterFieldSx}
                />
              </Grid>

              {/* City Filter */}
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  fullWidth
                  options={allCitiesData || []}
                  value={selectedCity}
                  autoHighlight={false}
                  autoSelect={false}
                  onChange={handleCityChange}
                  onInputChange={handleCityInputChange}
                  inputValue={citySearchTerm}
                  open={
                    !selectedCity && 
                    // Only open if there are cities to show
                    allCitiesData.length > 0 && 
                    !citiesLoading && (
                      // Open when focused and there are cached cities OR user is typing
                      (cityInputFocused && (allCachedCitiesForCountry.length > 0 || citySearchTerm.length >= 1)) ||
                      // Or when user is typing (even if not focused) AND there are results
                      (citySearchTerm.length >= 1)
                    )
                  }
                  onOpen={() => {
                    setCityInputFocused(true);
                  }}
                  onClose={() => {
                    setCityInputFocused(false);
                    // When dropdown closes, if a city is selected, keep the city name
                    if (selectedCity) {
                      const cityName = getCityDisplayName(selectedCity);
                      setCitySearchTerm(cityName);
                    }
                  }}
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
                  filterOptions={(options, state) => {
                    // Completely disable client-side filtering - return all options from server
                    // Server already filtered the results, so show all returned options
                    // IMPORTANT: Return all options without any filtering
                    return options || [];
                  }}
                  disableListWrap
                  freeSolo={false}
                  selectOnFocus
                  clearOnBlur
                  handleHomeEndKeys
                  noOptionsText={
                    citiesLoading 
                      ? (t('loading') || 'Loading...')
                      : citySearchTerm.length >= 1 
                        ? '' // Empty string to hide dropdown and show feedback message below
                        : allCachedCitiesForCountry.length === 0
                          ? t('searchCityPlaceholder')
                          : t('noSearchResults')
                  }
                  ListboxProps={{
                    style: { maxHeight: '300px' }
                  }}
                  renderOption={(props, option) => {
                    // Show city name in all languages for better search experience
                    const cityNames = [];
                    if (option.labels?.en) cityNames.push(option.labels.en);
                    if (option.labels?.fr) cityNames.push(option.labels.fr);
                    if (option.labels?.ar) cityNames.push(option.labels.ar);
                    const displayText = cityNames.length > 0 ? cityNames.join(' • ') : getCityDisplayName(option);
                    
                    return (
                      <li {...props} key={option._id || option.id}>
                        <Box>
                          <Typography variant="body1" fontWeight={500}>
                            {displayText}
                          </Typography>
                        </Box>
                      </li>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('city')}
                      placeholder={t('searchCityPlaceholder')}
                      onFocus={(e) => {
                        setCityInputFocused(true);
                        params.inputProps.onFocus?.(e);
                      }}
                      onBlur={(e) => {
                        // Delay to allow option selection
                        setTimeout(() => {
                          setCityInputFocused(false);
                        }, 200);
                        params.inputProps.onBlur?.(e);
                      }}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <Box sx={filterFieldIconBadgeSx}>
                              <LocationOn sx={{ fontSize: 15, color: brand }} />
                            </Box>
                            {params.InputProps.startAdornment}
                          </>
                        ),
                        endAdornment: (
                          <>
                            {citiesLoading ? <CircularProgress color="inherit" size={20} sx={{ color: brand }} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  sx={filterFieldSx}
                />
              </Grid>

              {/* City Not Found Message */}
              {citySearchTerm.length >= 1 && 
               !citiesLoading && 
               allCitiesData.length === 0 && 
               !selectedCity && (
                <Grid item xs={12}>
                  <Alert
                    severity="info"
                    icon={false}
                    sx={{
                      borderRadius: `${theme.custom.radius.md}px`,
                      alignItems: 'center',
                      backgroundColor: alpha(theme.custom.color.brandPrimary, 0.08),
                      color: theme.custom.color.ink,
                      '& .MuiAlert-message': {
                        width: '100%',
                        padding: 0,
                      }
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        gap: { xs: 2, md: 3 },
                        alignItems: { xs: 'stretch', md: 'center' },
                        width: '100%',
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          flex: { xs: 'none', md: 1 },
                          width: { xs: '100%', md: 'auto' },
                        }}
                      >
                        {t('noCityFoundMessage', { cityName: citySearchTerm })}
                      </Typography>
                      <Button
                        variant="contained"
                        size="medium"
                        startIcon={<AddIcon />}
                        onClick={handleAddNewPost}
                        sx={{
                          borderRadius: `${theme.custom.radius.md}px`,
                          textTransform: 'none',
                          fontWeight: 600,
                          backgroundColor: theme.custom.color.brandPrimary,
                          '&:hover': {
                            backgroundColor: theme.custom.color.brandPrimary,
                            opacity: 0.9,
                          },
                          width: { xs: '100%', md: 'auto' },
                          minWidth: { xs: '100%', md: '280px' },
                          px: { xs: 2, md: 4 },
                        }}
                      >
                        {t('createPostForCity', { cityName: citySearchTerm })}
                      </Button>
                    </Box>
                  </Alert>
                </Grid>
              )}

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
              {activeFilterChips.length > 0 && (
                <Grid item xs={12}>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {activeFilterChips.map((chip, index) => (
                      <Chip
                        key={index}
                        label={chip.label}
                        onDelete={chip.onDelete}
                        size="small"
                        sx={{
                          borderRadius: '999px',
                          height: 30,
                          fontWeight: 600,
                          backgroundColor: alpha(brand, isDark ? 0.16 : 0.08),
                          border: `1px solid ${alpha(brand, isDark ? 0.35 : 0.22)}`,
                          color: brand,
                          '& .MuiChip-deleteIcon': {
                            color: alpha(brand, 0.7),
                            '&:hover': { color: brand },
                          },
                        }}
                      />
                    ))}
                  </Box>
                </Grid>
              )}
            </Grid>
            </Collapse>
          </Box>
        </Box>

        {/* Spacer reserving the fixed filter bar's current height, plus a
            little extra breathing room so post cards don't start flush
            against its bottom edge. */}
        <Box sx={{ height: filterBarHeight ? filterBarHeight + 16 : 0 }} />

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

            {/* Add New Post Button - only shown once the user has paged to
                the last page (no more "next" page to reach) */}
            {page >= totalPages && (
              <Box
                sx={{
                  mb: 4,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddNewPost}
                  sx={{
                    borderRadius: `${theme.custom.radius.md}px`,
                    px: 4,
                    py: 1.5,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '1rem',
                    backgroundColor: theme.custom.color.brandPrimary,
                    '&:hover': {
                      backgroundColor: theme.custom.color.brandPrimary,
                      opacity: 0.9,
                    },
                    '& .MuiButton-startIcon': {
                      marginInlineEnd: '8px',
                      marginInlineStart: 0,
                    }
                  }}
                >
                  {t('addNewPost')}
                </Button>
              </Box>
            )}

            {/* Enhanced Pagination */}
            {totalPages > 1 && (
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: `${theme.custom.radius.lg}px`,
                  backgroundColor: theme.custom.color.surfaceRaised,
                  border: `1px solid ${theme.palette.divider}`,
                  boxShadow: theme.custom.elevation.e1,
                }}
              >
                <Box
                  display="flex"
                  flexDirection={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  alignItems="center"
                  gap={2}
                >
                  <Typography variant="body2" sx={{ color: alpha(theme.custom.color.ink, 0.65) }}>
                    {t('page')} {page} {t('of')} {totalPages} • {filteredPosts.length} {t('posts')}
                  </Typography>

                  <Pagination
                    page={page}
                    count={totalPages}
                    onChange={handlePaginate}
                    size={isMobile ? "small" : "medium"}
                    showFirstButton
                    showLastButton
                    sx={{
                      '& .MuiPaginationItem-root': {
                        borderRadius: `${theme.custom.radius.sm}px`,
                        fontWeight: 600,
                      },
                      '& .MuiPaginationItem-root.Mui-selected': {
                        backgroundColor: theme.custom.color.brandPrimary,
                        color: theme.palette.getContrastText(theme.custom.color.brandPrimary),
                        '&:hover': {
                          backgroundColor: theme.custom.color.brandPrimary,
                          opacity: 0.9,
                        },
                      },
                    }}
                  />

                  <Box display="flex" gap={1} alignItems="center">
                    <Typography variant="body2" sx={{ color: alpha(theme.custom.color.ink, 0.65) }}>
                      {t('postsPerPage')}:
                    </Typography>
                    <Select
                      value={pageSize}
                      onChange={handlePageSizeChange}
                      size="small"
                      sx={{ minWidth: 80, borderRadius: `${theme.custom.radius.md}px` }}
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
          // Locally tokenized rather than the shared (untokenized) EmptyState —
          // mirrors the DashboardEmptyStates.NoRecentFounds/NoRecentLosts
          // precedent in LoadingStates.jsx without touching that shared file.
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 8,
              px: 2,
              textAlign: 'center',
              backgroundColor: theme.custom.color.surfaceRaised,
              borderRadius: `${theme.custom.radius.lg}px`,
              border: `1px dashed ${alpha(theme.custom.color.ink, 0.15)}`,
            }}
          >
            <Search sx={{ fontSize: 56, color: theme.custom.color.brandPrimary, mb: 2, opacity: 0.6 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: theme.custom.color.ink, mb: 1 }}>
              {selectedCity && localCategoryFilter !== "all"
                ? t('noPostsInCityWithCategory', { cityName: getCityDisplayName(selectedCity) })
                : selectedCity
                  ? t('noPostsInCity', { cityName: getCityDisplayName(selectedCity) })
                  : hasActiveFilters
                    ? t('noPostsMatchFilters')
                    : t('noPostsFound')}
            </Typography>
            <Typography variant="body2" sx={{ color: alpha(theme.custom.color.ink, 0.65), mb: 3, maxWidth: 420 }}>
              {selectedCity && localCategoryFilter !== "all"
                ? t('noPostsInCityWithCategoryDescription', { cityName: getCityDisplayName(selectedCity) })
                : selectedCity
                  ? t('noPostsInCityDescription', { cityName: getCityDisplayName(selectedCity) })
                  : hasActiveFilters
                    ? t('adjustFilters')
                    : t('noPostsInArea')}
            </Typography>
            <Box display="flex" gap={2} flexWrap="wrap" justifyContent="center">
              <Link to="/dash/posts/new">
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  sx={{
                    borderRadius: `${theme.custom.radius.md}px`,
                    px: 3,
                    py: 1,
                    textTransform: 'none',
                    fontWeight: 600,
                    backgroundColor: theme.custom.color.brandPrimary,
                    '&:hover': {
                      backgroundColor: theme.custom.color.brandPrimary,
                      opacity: 0.9,
                    },
                  }}
                >
                  {selectedCity
                    ? t('createPostInCity', { cityName: getCityDisplayName(selectedCity) })
                    : t('addNewPost')}
                </Button>
              </Link>
              {!selectedCity && (
                <Button
                  variant="outlined"
                  startIcon={<Language />}
                  onClick={handleSelectCountry}
                  sx={{
                    borderRadius: `${theme.custom.radius.md}px`,
                    px: 3,
                    py: 1,
                    textTransform: 'none',
                    fontWeight: 600,
                    borderColor: theme.custom.color.brandPrimary,
                    color: theme.custom.color.brandPrimary,
                    '&:hover': {
                      borderColor: theme.custom.color.brandPrimary,
                      backgroundColor: alpha(theme.custom.color.brandPrimary, 0.08),
                    },
                  }}
                >
                  {t('changeCountry')}
                </Button>
              )}
            </Box>
          </Box>
        )}
      </Box>
      </>
    );
  }
  
  return (
    <>
      <SeoMeta pageKey="dashPosts" />
      {content}
    </>
  );
};

export default PostsList;
