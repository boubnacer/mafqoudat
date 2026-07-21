import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAddNewPostMutation } from "../postsApiSlice";
import { useSelector } from "react-redux";
import { selectCurrentToken } from "../../auth/authSlice";
import * as Yup from "yup";
import { Formik, Form } from "formik";
import imageCompression from "browser-image-compression";
import { lighten, alpha } from "@mui/material/styles";
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  useTheme,
  Alert,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Divider,
  Stepper,
  Step,
  StepButton,
  StepLabel
} from "@mui/material";
import {
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  HelpOutline as HelpOutlineIcon,
  LocationOn as LocationOnIcon,
  PhotoCamera as PhotoCameraIcon,
  FactCheck as FactCheckIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { useTranslation } from "../../../utils/translations";
import PromotionDialog from "../../../components/PromotionDialog";
import StepItem from "./steps/StepItem";
import StepLocation from "./steps/StepLocation";
import StepPhoto from "./steps/StepPhoto";
import StepReview from "./steps/StepReview";
import StepTransition from "./steps/StepTransition";
import WizardFooter from "./steps/WizardFooter";
import ReviewSubmitButton from "./steps/ReviewSubmitButton";
import { validateStep1, validateStep2, STEP_VALIDATORS, scrollToFirstErrorField } from "./wizardValidation";
import { getCityDisplayName } from "./cityDisplay";

// Maps each step's 1-based position (MUI auto-assigns `icon` = index + 1) to
// the icon shown in its desktop rail badge.
const RAIL_STEP_ICONS = {
  1: HelpOutlineIcon,
  2: LocationOnIcon,
  3: PhotoCameraIcon,
  4: FactCheckIcon,
};

// Custom step icon for the desktop rail: a circular badge colored from the
// Phase 1 brand token, swapping to a checkmark once a step is completed.
// Purely presentational - `active`/`completed` are the same booleans MUI's
// Stepper already derives from activeStep/maxStepReached.
const RailStepIcon = ({ active, completed, icon }) => {
  const theme = useTheme();
  const accent = theme.custom.color.brandPrimary;
  const IconComponent = RAIL_STEP_ICONS[icon] || HelpOutlineIcon;

  return (
    <Box
      sx={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        backgroundColor: active || completed
          ? alpha(accent, 0.14)
          : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
        color: active || completed ? accent : theme.palette.text.disabled,
        border: `2px solid ${active ? accent : 'transparent'}`,
        transition: 'all 0.2s ease-in-out',
      }}
    >
      {completed ? <CheckIcon fontSize="small" /> : <IconComponent fontSize="small" />}
    </Box>
  );
};

const NewPostForm = ({ user, countries, categories, flOptions }) => {
  const [addNewPost, { isSuccess, isError, error }] = useAddNewPostMutation();
  const { t, currentLanguage } = useTranslation();
  const token = useSelector(selectCurrentToken);
  
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [createdPostId, setCreatedPostId] = useState(null);
  const [lastSubmittedValues, setLastSubmittedValues] = useState(null);
  const [isLostItem, setIsLostItem] = useState(true);
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [showCustomCityInput, setShowCustomCityInput] = useState(false);
  const [customCityName, setCustomCityName] = useState("");
  const [isCompressing, setIsCompressing] = useState(false);
  const [isCreatingCity, setIsCreatingCity] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState(null);
  const [setFieldValueCallback, setSetFieldValueCallback] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  // Wizard step state (component state only - not persisted, see C5)
  const [activeStep, setActiveStep] = useState(0);
  const [maxStepReached, setMaxStepReached] = useState(0);
  // Tracks whether the last step change was a forward or backward move, so
  // the step transition animation can slide the right way (purely visual).
  const [stepDirection, setStepDirection] = useState(1);
  const formikRef = useRef(null);
  const fileInputRef = useRef(null);
  // values.country is the single source of truth (Formik); this ref just guards
  // the one-time initial city preload so it doesn't re-fire on every render.
  const hasInitializedCitiesRef = useRef(false);

  // Image management state
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showImageDialog, setShowImageDialog] = useState(false);

  // New state for unified city dropdown
  const [citySearchQuery, setCitySearchQuery] = useState(""); // For search input inside dropdown
  const [cityDisplayValue, setCityDisplayValue] = useState(""); // For display in main read-only input
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [selectedCityFromSearch, setSelectedCityFromSearch] = useState(null);
  const [filteredCities, setFilteredCities] = useState([]);
  // Debounce timer + monotonically increasing sequence token for city
  // search - see handleCitySearchChange/performCitySearch.
  const citySearchDebounceRef = useRef(null);
  const citySearchRequestIdRef = useRef(0);

  // Click outside handler to close city dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCityDropdown && !event.target.closest('[data-testid="city-dropdown"]')) {
        setShowCityDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCityDropdown]);

  // Cancel any pending debounced city search on unmount
  useEffect(() => {
    return () => {
      if (citySearchDebounceRef.current) {
        clearTimeout(citySearchDebounceRef.current);
      }
    };
  }, []);

  // Update filtered cities when cities or search query changes
  useEffect(() => {
    if (cities.length > 0) {
      if (citySearchQuery.trim()) {
        // Filter existing cities based on search query
        const filtered = cities.filter(city => 
          city.label?.toLowerCase().includes(citySearchQuery.toLowerCase()) ||
          city.name?.toLowerCase().includes(citySearchQuery.toLowerCase()) ||
          city.labels?.en?.toLowerCase().includes(citySearchQuery.toLowerCase()) ||
          city.labels?.ar?.toLowerCase().includes(citySearchQuery.toLowerCase()) ||
          city.labels?.fr?.toLowerCase().includes(citySearchQuery.toLowerCase())
        );
        setFilteredCities(filtered);
      } else {
        setFilteredCities(cities);
      }
    }
  }, [cities, citySearchQuery]);

  // Function to clear specific field error
  const clearFieldError = (fieldName) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };


  // Define fetchCitiesByCountry BEFORE it's used in useEffect
  const fetchCitiesByCountry = useCallback(async (countryId) => {
    try {
      setLoadingCities(true);
      const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:3500";
      const url = `${baseUrl}/cities-public?countryId=${countryId}&language=${currentLanguage || 'en'}`;
      
      // Include Authorization header if token exists (needed for admin bypass during maintenance)
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(url, { headers });
      const data = await response.json();
      
      if (data.success) {
        setCities(data.data);
      } else {
        console.error('Failed to fetch cities:', data.message);
        setCities([]);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
      setCities([]);
    } finally {
      setLoadingCities(false);
    }
  }, [currentLanguage, token]);

  // Preload cities for the initial country (values.country, seeded from user.country)
  // exactly once - subsequent country changes are handled by handleCountryChange.
  useEffect(() => {
    if (user.country && countries.length > 0 && !hasInitializedCitiesRef.current) {
      hasInitializedCitiesRef.current = true;
      fetchCitiesByCountry(user.country);
    }
  }, [user.country, countries, fetchCitiesByCountry]);

  useEffect(() => {
    if (isSuccess) {
      setShowSuccess(true);
      // Check if this is a lost item post using the stored values
      const foundLostOption = lastSubmittedValues && flOptions.find(option => option.id === lastSubmittedValues.foundLost);
      const lostItemStatus = foundLostOption && foundLostOption.code === 'LOST';
      setIsLostItem(lostItemStatus);

      // Refresh cities list to include any newly created cities - use the country
      // that was actually submitted, not whatever the dropdown shows right now
      if (lastSubmittedValues?.country) {
        fetchCitiesByCountry(lastSubmittedValues.country);
      }

      // Show promotion dialog for both lost and found items
      setShowPromotionDialog(true);
    }
  }, [isSuccess, navigate, flOptions, lastSubmittedValues]);

  // Re-fetch cities when language changes (with debouncing to prevent rate limits)
  useEffect(() => {
    // Check if this is a language change refresh to avoid interference
    const urlParams = new URLSearchParams(window.location.search);
    const isLanguageChange = urlParams.get('lang_changed') === 'true';
    // Read the live Formik value via ref rather than a dependency - this effect
    // is meant to react to language changes, not country changes (those are
    // already handled directly by handleCountryChange).
    const countryId = formikRef.current?.values?.country;

    if (countryId && !isLanguageChange) {
      // Add a small delay to prevent multiple simultaneous API calls
      const timeoutId = setTimeout(() => {
        fetchCitiesByCountry(countryId);
      }, 300);

      return () => clearTimeout(timeoutId);
    } else if (countryId && isLanguageChange) {
      // For language changes, wait longer to ensure auth state is restored
      const timeoutId = setTimeout(() => {
        fetchCitiesByCountry(countryId);
      }, 1000); // Original working delay

      return () => clearTimeout(timeoutId);
    }
  }, [fetchCitiesByCountry, currentLanguage]);

  // Wizard step labels, in step order.
  const steps = [
    { key: 'item', label: t('wizardStepItemTitle'), subtitle: t('wizardStepItemSubtitle') },
    { key: 'location', label: t('wizardStepLocationTitle'), subtitle: t('wizardStepLocationSubtitle') },
    { key: 'photo', label: t('wizardStepPhotoTitle'), subtitle: t('wizardStepPhotoSubtitle') },
    { key: 'rest', label: t('wizardStepReviewTitle'), subtitle: t('wizardStepReviewSubtitle') },
  ];

  // Single place that changes the active step, so the direction used by the
  // step transition animation (purely visual) always stays correct.
  const goToStep = (nextIndex) => {
    setStepDirection(nextIndex > activeStep ? 1 : -1);
    setActiveStep(nextIndex);
  };

  // Gate moving from step 1 ("What happened") to the next step behind its
  // per-step validators (S2). Reuses the same fieldErrors + scroll-to-error
  // mechanism as the original single-page handleSubmit validation.
  const handleNextFromItemStep = (values, setStatus) => {
    const { missingFields, fieldErrors: newFieldErrors } = validateStep1(values, t);

    if (missingFields.length > 0) {
      const errorMessage = `${t('fillRequiredFields')}: ${missingFields.join(', ')}`;
      setStatus({ validationError: errorMessage });
      setFieldErrors(newFieldErrors);
      scrollToFirstErrorField(newFieldErrors);
      return;
    }

    setStatus(null);
    setFieldErrors({});
    goToStep(1);
    setMaxStepReached((m) => Math.max(m, 1));
  };

  // Gate moving from step 2 ("Where & when") to the next step (S2).
  const handleNextFromLocationStep = (values, setStatus) => {
    const { missingFields, fieldErrors: newFieldErrors } = validateStep2(values, t);

    if (missingFields.length > 0) {
      const errorMessage = `${t('fillRequiredFields')}: ${missingFields.join(', ')}`;
      setStatus({ validationError: errorMessage });
      setFieldErrors(newFieldErrors);
      scrollToFirstErrorField(newFieldErrors);
      return;
    }

    setStatus(null);
    setFieldErrors({});
    goToStep(2);
    setMaxStepReached((m) => Math.max(m, 2));
  };

  // Step 3 ("Photo") has no required fields (S2), so Next just advances.
  const handleNextFromPhotoStep = () => {
    setFieldErrors({});
    goToStep(3);
    setMaxStepReached((m) => Math.max(m, 3));
  };

  // A user can click back to any already-validated step, but never jump
  // ahead of the furthest step they've passed validation for (S1).
  const handleStepClick = (index) => {
    if (index <= maxStepReached) {
      goToStep(index);
    }
  };

  // Function to get default foundLost value based on URL parameters
  const getDefaultFoundLost = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    
    if (type === 'found') {
      // Find the "found" option
      const foundOption = flOptions.find(option => option.code === 'FOUND');
      return foundOption?.id || flOptions[0]?.id || "";
    } else if (type === 'lost') {
      // Find the "lost" option
      const lostOption = flOptions.find(option => option.code === 'LOST');
      return lostOption?.id || flOptions[0]?.id || "";
    }
    
    // Default to first option if no type parameter or unknown type
    return flOptions[0]?.id || "";
  };

  const initialFormState = {
    country: user.country,
    contact: "",
    categories: [], // Changed to array for multiple categories
    category: categories[0]?.id || "", // Keep for backward compatibility during transition
    foundLost: getDefaultFoundLost(),
    city: "",
    exactLocation: "",
    exactDate: "", // Empty by default - placeholder will show example
    description: "",
  };

  // Remove Yup validation - we'll handle validation in handleSubmit
  const formValidation = Yup.object().shape({
    // Only validate optional fields, required fields will be validated in handleSubmit
    description: Yup.string().optional(),
  });

  // New function to search cities using hybrid search
  const searchCitiesHybrid = useCallback(async (searchQuery, countryCode) => {
    try {
      if (!searchQuery || searchQuery.length < 2) {
        return [];
      }
      
      // Ensure countryCode is valid (2 uppercase letters) or null
      const validCountryCode = countryCode && countryCode.length === 2 
        ? countryCode.toUpperCase() 
        : null;
      
      const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:3500";
      let url = `${baseUrl}/cities/search?q=${encodeURIComponent(searchQuery)}&language=${currentLanguage || 'en'}&limit=10`;
      
      // Only add countryCode if it's valid
      if (validCountryCode) {
        url += `&countryCode=${validCountryCode}`;
      }
      
      console.log(`🔍 Hybrid search: "${searchQuery}" in ${validCountryCode || 'all countries'} (${currentLanguage || 'en'})`);
      
      // Include Authorization header if token exists (needed for admin bypass during maintenance)
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        console.error(`❌ Search API error: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        return [];
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Hybrid search found ${data.data?.length || 0} cities`);
        return data.data || [];
      } else {
        console.warn(`⚠️ Search API returned success=false:`, data.message);
        return [];
      }
    } catch (error) {
      console.error('❌ City search error:', error.message);
      console.error('Error details:', error);
      return [];
    }
  }, [currentLanguage, token]);

  // Traditional city search function (fallback)
  const searchCitiesTraditional = useCallback(async (searchQuery, countryId) => {
    try {
      const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:3500";
      const url = `${baseUrl}/cities/search-name?query=${encodeURIComponent(searchQuery)}&countryId=${countryId}&limit=10`;
      
      // Include Authorization header if token exists (needed for admin bypass during maintenance)
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(url, { headers });
      const data = await response.json();
      
      if (data.success) {
        // Transform traditional results to match hybrid format
        return data.data.map(city => ({
          ...city,
          source: 'database',
          _id: city._id
        }));
      }
      return [];
    } catch (error) {
      return [];
    }
  }, []);

  const handleSubmit = async (values, { setSubmitting, setStatus }) => {
    try {
      // Clear any previous validation errors
      setStatus(null);
      setFieldErrors({});
      
      // Support both new categories array and legacy single category - declare once at the top
      const selectedCategories = values.categories && Array.isArray(values.categories) && values.categories.length > 0
        ? values.categories
        : (values.category ? [values.category] : []);

      // Safety net: re-run every step's validator in case a field was somehow
      // cleared after its step was already passed (S2). Jump to the earliest
      // offending step rather than just blocking submission.
      const missingFields = [];
      const newFieldErrors = {};
      let earliestFailingStep = null;

      STEP_VALIDATORS.forEach((validateStep, stepIndex) => {
        const stepResult = validateStep(values, t);
        if (stepResult.missingFields.length > 0) {
          missingFields.push(...stepResult.missingFields);
          Object.assign(newFieldErrors, stepResult.fieldErrors);
          if (earliestFailingStep === null) {
            earliestFailingStep = stepIndex;
          }
        }
      });

      if (missingFields.length > 0) {
        const errorMessage = `${t('fillRequiredFields')}: ${missingFields.join(', ')}`;
        setStatus({ validationError: errorMessage });
        setFieldErrors(newFieldErrors);
        setSubmitting(false);
        goToStep(earliestFailingStep);
        setMaxStepReached((m) => Math.max(m, earliestFailingStep));
        scrollToFirstErrorField(newFieldErrors);
        return;
      }

      // Store the submitted values to check if it's a lost item
      setLastSubmittedValues(values);
      
      const formData = new FormData();
      
      // Combine basic fields into a single JSON object to reduce field count
      // selectedCategories is already declared above in validation section
      const postData = {
        user: user._id,
        country: values.country,
        categories: selectedCategories, // New: array of category IDs
        category: selectedCategories.length > 0 ? selectedCategories[0] : null, // Legacy: first category for backward compatibility
        foundLost: values.foundLost,
        exactLocation: values.exactLocation,
        exactDate: values.exactDate, // This gets stored as mainDate in the server
        contact: values.contact,
        description: values.description || "",
        contactPreferences: { whatsapp: true }
      };
      
      // Handle city - check if it's an API city or database city
      if (values.city && values.city.startsWith('api_')) {
        // API city - send the city data
        postData.city = selectedCityFromSearch?.code || values.city.replace('api_', '');
        postData.cityData = selectedCityFromSearch;
      } else {
        // Database city
        postData.city = values.city;
      }
      
      // Append combined data as single field
      const postDataString = JSON.stringify(postData);
      formData.append("postData", postDataString);
      
      // Only append image if present
      if (selectedImage) {
        formData.append("image", selectedImage);
      }

      const result = await addNewPost(formData);
      
      // Store the created post ID for promotion dialog
      if (result.data?.postId) {
        setCreatedPostId(result.data.postId);
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setStatus({ error: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Get country label based on language
  const getCountryLabel = (option) => {
    if (!option) return '';
    if (option.names && option.names[currentLanguage || 'en']) {
      return option.names[currentLanguage || 'en'];
    }
    if (option.labels && option.labels[currentLanguage || 'en']) {
      return option.labels[currentLanguage || 'en'];
    }
    return option.label || option.code;
  };

  // Get found/lost type for dynamic instructions
  const getFoundLostType = (foundLostId) => {
    const option = flOptions.find(opt => opt.id === foundLostId);
    return option?.code || 'FOUND';
  };


  // Handle custom city name change
  const handleCustomCityChange = (event) => {
    setCustomCityName(event.target.value);
  };

  // Runs the actual search for one query. `requestId` is a snapshot of
  // citySearchRequestIdRef taken when this call was scheduled; if the user
  // has typed something else since (bumping the ref further), every
  // setSearchResults below is skipped so a slow response for an old,
  // partial query can never overwrite results for what's currently typed.
  const performCitySearch = useCallback(async (query, requestId) => {
    const isStale = () => requestId !== citySearchRequestIdRef.current;

    // Read the live Formik country value via ref (this callback is memoized and
    // must not close over a stale country from an earlier render). Falls back
    // to user.country (the value Formik was seeded with) in case the ref isn't
    // populated yet for some reason.
    const formikCountryId = formikRef.current?.values?.country;
    const countryId = formikCountryId || user.country;
    const selectedCountryObj = countries.find(c => c._id === countryId);

    // Get country code from the selected country object - must be ISO code (e.g., 'MA', 'EG')
    // The code should be a 2-letter ISO country code
    let countryCode = selectedCountryObj?.code;
    if (typeof countryCode === 'string') {
      countryCode = countryCode.trim().toUpperCase();
    }

    // Ensure countryCode is a valid ISO code (2 uppercase letters)
    if (!(countryCode && countryCode.length === 2)) {
      // Invalid or missing country code
      console.warn('⚠️ Invalid or missing country code. Sources checked:', {
        formikCountryId,
        userCountryFallback: user.country,
        resolvedCountryId: countryId,
        matchedCountry: selectedCountryObj,
        rawCode: selectedCountryObj?.code
      });
      countryCode = null;
    }

    try {
      if (query.length >= 2 && countryId) {
        // Try hybrid search first (includes Google Places API)
        const results = await searchCitiesHybrid(query, countryCode);
        if (isStale()) return;

        if (results.length > 0) {
          setSearchResults(results);
          return;
        }

        // Fallback to traditional search
        const fallbackResults = await searchCitiesTraditional(query, countryId);
        if (isStale()) return;

        if (fallbackResults.length > 0) {
          setSearchResults(fallbackResults);
          return;
        }

        // Final fallback: filter existing cities
        const localResults = cities.filter(city =>
          city.label?.toLowerCase().includes(query.toLowerCase()) ||
          city.name?.toLowerCase().includes(query.toLowerCase())
        ).map(city => ({
          ...city,
          source: 'database',
          _id: city.id || city._id
        }));
        setSearchResults(localResults);
      } else if (query.length > 0) {
        // Show local filtered results for shorter queries
        const localResults = cities.filter(city =>
          city.label?.toLowerCase().includes(query.toLowerCase()) ||
          city.name?.toLowerCase().includes(query.toLowerCase())
        ).map(city => ({
          ...city,
          source: 'database',
          _id: city.id || city._id
        }));
        if (!isStale()) setSearchResults(localResults);
      }
    } catch (error) {
      console.error('❌ City search error:', error);
      if (!isStale()) setSearchResults([]);
    } finally {
      if (!isStale()) setIsSearching(false);
    }
  }, [searchCitiesHybrid, searchCitiesTraditional, countries, cities, currentLanguage, user.country]);

  // Handle city search input change (only from dropdown search input).
  // Debounced (300ms) and sequence-guarded: the query only actually fires
  // after the user pauses typing, and citySearchRequestIdRef is bumped on
  // every keystroke so any in-flight request from an earlier keystroke gets
  // ignored by performCitySearch when it resolves. Without this, typing
  // "Taghazout" fired 9 separate searches against rate-limited external
  // APIs, and a slower response for an earlier partial query (e.g. "Tagha")
  // could resolve after a faster one for a later query and overwrite it,
  // leaving stale suggestions on screen.
  //
  // searchResults is cleared synchronously here, immediately on every
  // keystroke - not just when performCitySearch's own response comes back.
  // Otherwise the dropdown keeps showing the previous query's matches under
  // "Search Results" for the entire debounce + network round-trip (can be
  // over a second for the GeoNames->Google chain) after the user has
  // already typed something else, which reads as old and new results being
  // mixed/stacked together.
  const handleCitySearchChange = useCallback((event) => {
    const query = event.target.value;
    setCitySearchQuery(query);

    // Always show dropdown when there's a query
    if (query.trim().length > 0) {
      setShowCityDropdown(true);
    }

    citySearchRequestIdRef.current += 1;
    const requestId = citySearchRequestIdRef.current;

    if (citySearchDebounceRef.current) {
      clearTimeout(citySearchDebounceRef.current);
    }

    // Whatever was shown for the previous query must never linger while the
    // user edits the text - clear it immediately, before the debounced
    // fetch even starts.
    setSearchResults([]);

    if (!query.trim()) {
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    citySearchDebounceRef.current = setTimeout(() => {
      performCitySearch(query, requestId);
    }, 300);
  }, [performCitySearch]);

  // Handle city selection from dropdown
  const handleCitySelect = (city) => {
    setSelectedCityFromSearch(city);
    const cityDisplayName = getCityDisplayName(city, currentLanguage);
    setCityDisplayValue(cityDisplayName); // Set display value
    setCitySearchQuery(""); // Clear search query
    setShowCityDropdown(false);
    
    // Set the city value in the form
    if (setFieldValueCallback) {
      if (city._id) {
        // Database city
        setFieldValueCallback('city', city._id);
      } else {
        // API city - we'll handle this in the submit
        setFieldValueCallback('city', `api_${city.code}`);
      }
    }
    
    // Clear city field error
    clearFieldError('city');
  };

  // Handle dropdown toggle
  const handleCityDropdownToggle = () => {
    if (!showCityDropdown) {
      // Opening dropdown - clear search query to start fresh
      setCitySearchQuery("");
      setSearchResults([]);
    }
    setShowCityDropdown(!showCityDropdown);
  };

  // Create custom city in backend
  const createCustomCity = async (cityName, countryId) => {
    try {
      const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:3500";
      const headers = {
        'Content-Type': 'application/json',
      };
      
      // Add authentication token if available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${baseUrl}/cities/dynamic`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          cityName: cityName.trim(),
          countryId: countryId,
          sourceLanguage: currentLanguage || 'en'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        return data.data; // Return the created city object
      } else {
        console.error('Failed to create custom city:', data.message);
        throw new Error(data.message || 'Failed to create custom city');
      }
    } catch (error) {
      console.error('Error creating custom city:', error);
      throw error;
    }
  };

  // Image compression function
  const compressImage = useCallback(async (file) => {
    if (!file) return null;
    
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      console.warn('File is not an image:', file.type);
      return file;
    }
    
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      quality: 0.8
    };

    try {
      setIsCompressing(true);
      const compressedFile = await imageCompression(file, options);
      
      // Log compression results for debugging
      const originalSize = (file.size / 1024 / 1024).toFixed(2);
      const compressedSize = (compressedFile.size / 1024 / 1024).toFixed(2);
      const compressionRatio = ((1 - compressedFile.size / file.size) * 100).toFixed(1);
      
      // Store compression info for display
      setCompressionInfo({
        originalSize,
        compressedSize,
        compressionRatio
      });
      
      return compressedFile;
    } catch (error) {
      console.error('Error compressing image:', error);
      setCompressionInfo(null);
      return file; // Return original file if compression fails
    } finally {
      setIsCompressing(false);
    }
  }, []);

  // The privacy warning used to gate this behind a 6-second countdown
  // dialog; it's now an always-visible inline notice on the Photo step
  // (S3), so the button just opens the file picker directly.
  const handleImageButtonClick = useCallback(() => {
    if (isCompressing) return;
    fileInputRef.current?.click();
  }, [isCompressing, fileInputRef]);

  // Handle image selection
  const handleImageSelect = useCallback(async (event) => {
    const file = event.currentTarget.files[0];
    if (!file) return;

    // Clear previous compression info
    setCompressionInfo(null);
    
    try {
      const compressedFile = await compressImage(file);
      setSelectedImage(compressedFile);
      setSelectedFileName(compressedFile.name);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(compressedFile);
      setImagePreview(previewUrl);
    } catch (error) {
      console.error('Error processing image:', error);
    }
  }, [compressImage]);


  // Handle image removal
  const handleImageRemove = useCallback(() => {
    setSelectedImage(null);
    setSelectedFileName("");
    setCompressionInfo(null);
    
    // Clean up preview URL
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  }, [imagePreview]);

  // Handle image dialog open/close
  const handleImageDialogOpen = useCallback(() => {
    setShowImageDialog(true);
  }, []);

  const handleImageDialogClose = useCallback(() => {
    setShowImageDialog(false);
  }, []);

  // Cleanup image preview URL on unmount
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  if (isError) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Alert severity="error" sx={{ maxWidth: 600 }}>
          <Typography variant="h6">{t('errorCreatingPost')}</Typography>
          <Typography>{error?.data?.message || t('errorCreatingPostMessage')}</Typography>
        </Alert>
      </Box>
    );
  }

  if (showSuccess && !showPromotionDialog) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Alert severity="success" sx={{ maxWidth: 600 }}>
          <Typography variant="h6">{t('postCreatedSuccessfully')}</Typography>
          <Typography>{t('redirectingToDashboard')}</Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        minHeight: "100vh",
        pt: { xs: "6rem", md: "8rem" },
        pb: { xs: "4rem", md: "6rem" },
        px: { xs: 2, md: 4 },
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        background: theme.custom.color.surfaceBase,
        position: 'relative',
        // Add shimmer animation styles
        '@keyframes shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        }
      }}
    >
      {/* Backdrop overlay when dialog is open */}
      {showCustomCityInput && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(0, 0, 0, 0.7)' 
              : 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 1200,
            pointerEvents: 'auto'
          }}
        />
      )}
      <Paper
        elevation={4}
        sx={{
          p: { xs: 3, md: 5 },
          pb: { xs: 11, sm: 5 },
          maxWidth: 960,
          width: "100%",
          borderRadius: 3,
          backgroundColor: theme.custom.color.surfaceRaised,
          boxShadow: theme.shadows[8]
        }}
      >
        <Typography 
          variant="h3" 
          gutterBottom 
          textAlign="center" 
          sx={{ 
            color: theme.palette.text.primary,
            mb: 4,
            fontWeight: 700,
            fontSize: { xs: '1.8rem', md: '2.2rem' },
            textShadow: theme.palette.mode === 'dark' ? '0 2px 4px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,0.1)'
          }}
        >
          {t('createNewPost')}
        </Typography>

        <Formik
          innerRef={formikRef}
          initialValues={initialFormState}
          validationSchema={formValidation}
          onSubmit={handleSubmit}
        >
          {({ status, setStatus, setFieldValue, values }) => {
            // Store setFieldValue function for use in custom city creation
            setSetFieldValueCallback(() => setFieldValue);

            // values.country is the single source of truth; derive the full
            // country object here wherever the UI needs more than the id.
            const selectedCountryObj = countries.find(c => c._id === values.country) || null;

            const handleCountryChange = (event) => {
              const countryId = event.target.value;
              setFieldValue('country', countryId);

              if (countryId) {
                clearFieldError('country');
              }

              // Reset cities when country changes
              setCities([]);

              // Clear the city field in the form
              setFieldValue('city', '');

              // Fetch cities for the selected country
              if (countryId) {
                fetchCitiesByCountry(countryId);
              }
            };

            const accentColor = theme.custom.color.brandPrimary;

            return (
            <Form>
              <Box
                sx={{
                  display: { xs: 'block', sm: 'flex' },
                  alignItems: 'flex-start',
                  gap: { sm: 4 },
                }}
              >
                {/* Mobile-only segmented progress bar (replaces the desktop rail) */}
                <Box sx={{ display: { xs: 'block', sm: 'none' }, mb: 3 }}>
                  <Box sx={{ display: 'flex', gap: 0.75, mb: 1 }}>
                    {steps.map((step, index) => (
                      <Box
                        key={step.key}
                        sx={{
                          flex: 1,
                          height: 6,
                          borderRadius: `${theme.custom.radius.sm}px`,
                          backgroundColor: index <= activeStep
                            ? accentColor
                            : alpha(theme.custom.color.ink, theme.palette.mode === 'dark' ? 0.1 : 0.08),
                        }}
                      />
                    ))}
                  </Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>
                    {t('wizardStepProgressShort', { current: activeStep + 1, total: steps.length })}
                  </Typography>
                </Box>

                {/* Desktop rail: vertical Stepper with icon badges, current step highlighted */}
                <Box sx={{ display: { xs: 'none', sm: 'block' }, width: 240, flexShrink: 0 }}>
                  <Stepper
                    activeStep={activeStep}
                    orientation="vertical"
                    sx={{
                      '& .MuiStepConnector-root.Mui-active .MuiStepConnector-line, & .MuiStepConnector-root.Mui-completed .MuiStepConnector-line': {
                        borderColor: accentColor,
                      },
                      '& .MuiStepLabel-label': {
                        fontWeight: 600,
                        color: theme.palette.text.secondary,
                      },
                      '& .MuiStepLabel-label.Mui-active': { color: accentColor },
                      '& .MuiStepLabel-label.Mui-completed': { color: theme.palette.text.primary },
                    }}
                  >
                    {steps.map((step, index) => (
                      <Step key={step.key} completed={index < maxStepReached}>
                        <StepButton
                          onClick={() => handleStepClick(index)}
                          disabled={index > maxStepReached}
                          sx={{
                            borderRadius: `${theme.custom.radius.md}px`,
                            py: 1,
                            ...(index === activeStep && {
                              backgroundColor: alpha(theme.custom.color.brandPrimary, theme.palette.mode === 'dark' ? 0.08 : 0.06),
                            }),
                          }}
                        >
                          <StepLabel
                            StepIconComponent={RailStepIcon}
                            optional={
                              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                {step.subtitle}
                              </Typography>
                            }
                          >
                            {step.label}
                          </StepLabel>
                        </StepButton>
                      </Step>
                    ))}
                  </Stepper>
                </Box>

                <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />

                {/* Content pane */}
                <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: accentColor, fontSize: '1.4rem' }}>
                      {steps[activeStep].label}
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
                      {steps[activeStep].subtitle}
                    </Typography>
                  </Box>

                  {status?.error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                      {status.error}
                    </Alert>
                  )}

                  {/* Not gated by activeStep, so it's visible whichever step's
                      Next/Submit validation raised it. */}
                  {status?.validationError && (
                    <Box mb={3} sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                      <Alert
                        severity="error"
                        sx={{
                          width: '100%',
                          borderRadius: 2,
                          '& .MuiAlert-message': {
                            width: '100%'
                          }
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {status.validationError}
                        </Typography>
                      </Alert>
                    </Box>
                  )}

                  <StepTransition stepKey={activeStep} direction={stepDirection}>
                    {activeStep === 0 && (
                      <>
                        <StepItem
                          flOptions={flOptions}
                          categories={categories}
                          fieldErrors={fieldErrors}
                          clearFieldError={clearFieldError}
                          getFoundLostType={getFoundLostType}
                        />
                        <WizardFooter showBack={false}>
                          <Button
                            variant="contained"
                            onClick={() => handleNextFromItemStep(values, setStatus)}
                            sx={{ textTransform: 'none', borderRadius: 2, px: 4, py: 1.25, fontWeight: 600 }}
                          >
                            {t('wizardNext')}
                          </Button>
                        </WizardFooter>
                      </>
                    )}

                    {activeStep === 1 && (
                      <>
                        <StepLocation
                          countries={countries}
                          fieldErrors={fieldErrors}
                          clearFieldError={clearFieldError}
                          getFoundLostType={getFoundLostType}
                          getCountryLabel={getCountryLabel}
                          selectedCountryObj={selectedCountryObj}
                          handleCountryChange={handleCountryChange}
                          cities={cities}
                          citySearchQuery={citySearchQuery}
                          cityDisplayValue={cityDisplayValue}
                          searchResults={searchResults}
                          isSearching={isSearching}
                          showCityDropdown={showCityDropdown}
                          filteredCities={filteredCities}
                          setShowCityDropdown={setShowCityDropdown}
                          setShowCustomCityInput={setShowCustomCityInput}
                          handleCityDropdownToggle={handleCityDropdownToggle}
                          handleCitySearchChange={handleCitySearchChange}
                          handleCitySelect={handleCitySelect}
                        />
                        <WizardFooter onBack={() => goToStep(0)}>
                          <Button
                            variant="contained"
                            onClick={() => handleNextFromLocationStep(values, setStatus)}
                            sx={{ textTransform: 'none', borderRadius: 2, px: 4, py: 1.25, fontWeight: 600 }}
                          >
                            {t('wizardNext')}
                          </Button>
                        </WizardFooter>
                      </>
                    )}

                    {activeStep === 2 && (
                      <>
                        <StepPhoto
                          getFoundLostType={getFoundLostType}
                          imagePreview={imagePreview}
                          selectedFileName={selectedFileName}
                          compressionInfo={compressionInfo}
                          isCompressing={isCompressing}
                          fileInputRef={fileInputRef}
                          handleImageButtonClick={handleImageButtonClick}
                          handleImageSelect={handleImageSelect}
                          handleImageRemove={handleImageRemove}
                          handleImageDialogOpen={handleImageDialogOpen}
                        />
                        <WizardFooter onBack={() => goToStep(1)}>
                          <Button
                            variant="contained"
                            onClick={handleNextFromPhotoStep}
                            sx={{ textTransform: 'none', borderRadius: 2, px: 4, py: 1.25, fontWeight: 600 }}
                          >
                            {t('wizardNext')}
                          </Button>
                        </WizardFooter>
                      </>
                    )}

                    {activeStep === 3 && (
                      <>
                        <StepReview
                          flOptions={flOptions}
                          categories={categories}
                          countries={countries}
                          fieldErrors={fieldErrors}
                          clearFieldError={clearFieldError}
                          getFoundLostType={getFoundLostType}
                          getCountryLabel={getCountryLabel}
                          cityDisplayValue={cityDisplayValue}
                          imagePreview={imagePreview}
                          onEditStep={handleStepClick}
                        />
                        <WizardFooter onBack={() => goToStep(2)} stackOnMobile>
                          <ReviewSubmitButton />
                        </WizardFooter>
                      </>
                    )}
                  </StepTransition>
                </Box>
              </Box>
            </Form>
            );
          }}
        </Formik>
      </Paper>
      
      {/* Custom City Dialog */}
      <Dialog
        open={showCustomCityInput}
        onClose={() => {
          if (!isCreatingCity) {
            setShowCustomCityInput(false);
            setCustomCityName("");
          }
        }}
        maxWidth="sm"
        fullWidth
        sx={{ zIndex: 1300 }}
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: theme.custom.color.surfaceRaised,
            boxShadow: theme.shadows[12]
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: 1
          }}
        >
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600, 
              color: theme.palette.text.primary
            }}
          >
            {t('addNewCity')}
          </Typography>
          <IconButton
            onClick={() => {
              setShowCustomCityInput(false);
              setCustomCityName("");
            }}
            disabled={isCreatingCity}
            sx={{
              color: theme.palette.text.secondary,
              '&:hover': {
                backgroundColor: theme.palette.action.hover
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              mb: 2,
              color: theme.palette.text.secondary
            }}
          >
            {t('enterCustomCityName')}
          </Typography>
          <TextField
            fullWidth
            placeholder={t('cityNamePlaceholder')}
            value={customCityName}
            onChange={handleCustomCityChange}
            variant="outlined"
            autoFocus
            sx={{ 
              borderRadius: 2,
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: theme.custom.color.brandPrimary,
                },
                '&.Mui-focused fieldset': {
                  borderColor: theme.custom.color.brandPrimary,
                },
                '& fieldset': {
                  borderColor: alpha(theme.custom.color.ink, theme.palette.mode === 'dark' ? 0.3 : 0.2),
                },
                color: theme.palette.text.primary
              }
            }}
          />
        </DialogContent>
        
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => {
              setShowCustomCityInput(false);
              setCustomCityName("");
            }}
            disabled={isCreatingCity}
            sx={{ 
              textTransform: 'none',
              borderRadius: 2,
              px: 3
            }}
          >
            {t('cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={async () => {
              const countryId = formikRef.current?.values?.country;
              if (customCityName.trim() && countryId) {
                setIsCreatingCity(true);
                try {
                  // Create the custom city in the backend
                  const createdCity = await createCustomCity(customCityName.trim(), countryId);

                  // Close the dialog first
                  setShowCustomCityInput(false);
                  setCustomCityName("");

                  // Refresh the cities list to get the newly created city
                  await fetchCitiesByCountry(countryId);

                  // Set the display value
                  const cityDisplayName = getCityDisplayName(createdCity, currentLanguage);
                  setCityDisplayValue(cityDisplayName);
                  
                  // Set the field value directly using setFieldValue from Formik
                  if (setFieldValueCallback) {
                    setFieldValueCallback('city', createdCity._id);
                  }
                  
                } catch (error) {
                  console.error('Error creating custom city:', error);
                  // Show error message to user
                  alert(t('errorCreatingCustomCity') || 'Error creating custom city. Please try again.');
                } finally {
                  setIsCreatingCity(false);
                }
              }
            }}
            disabled={!customCityName.trim() || !formikRef.current?.values?.country || isCreatingCity}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 3,
              background: `linear-gradient(45deg, ${theme.custom.color.brandPrimary} 30%, ${lighten(theme.custom.color.brandPrimary, 0.15)} 90%)`,
              color: `${theme.palette.getContrastText(theme.custom.color.brandPrimary)} !important`,
              '&:hover': {
                background: `linear-gradient(45deg, ${lighten(theme.custom.color.brandPrimary, 0.08)} 30%, ${lighten(theme.custom.color.brandPrimary, 0.25)} 90%)`,
              }
            }}
            startIcon={isCreatingCity ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {isCreatingCity ? (t('creatingCity') || 'Creating City...') : t('confirm')}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Image Preview Dialog */}
      <Dialog
        open={showImageDialog}
        onClose={handleImageDialogClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            backgroundColor: theme.custom.color.surfaceRaised,
            boxShadow: theme.shadows[8],
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center'
        }}>
          <Typography variant="h6">
            {t('imagePreview') || 'Image Preview'}
          </Typography>
          <IconButton
            onClick={handleImageDialogClose}
            sx={{
              color: theme.palette.text.secondary,
              '&:hover': {
                backgroundColor: theme.palette.action.hover
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {imagePreview && (
            <Box sx={{ 
              position: 'relative',
              width: '100%',
              height: 'auto',
              maxHeight: '70vh',
              overflow: 'hidden'
            }}>
              <img
                src={imagePreview}
                alt="Item preview"
                style={{
                  width: '100%',
                  height: 'auto',
                  objectFit: 'contain',
                  display: 'block'
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={handleImageDialogClose}
            variant="outlined"
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 3
            }}
          >
            {t('close')}
          </Button>
          {imagePreview && (
            <Button
              component="label"
              variant="contained"
              startIcon={<CloudUploadIcon />}
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                px: 3,
                background: `linear-gradient(45deg, ${theme.custom.color.brandPrimary} 30%, ${lighten(theme.custom.color.brandPrimary, 0.15)} 90%)`,
                color: `${theme.palette.getContrastText(theme.custom.color.brandPrimary)} !important`,
                '&:hover': {
                  background: `linear-gradient(45deg, ${lighten(theme.custom.color.brandPrimary, 0.08)} 30%, ${lighten(theme.custom.color.brandPrimary, 0.25)} 90%)`,
                }
              }}
            >
              {t('replaceImage')}
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleImageSelect}
              />
            </Button>
          )}
        </DialogActions>
      </Dialog>
      
      {/* Promotion Dialog */}
      <PromotionDialog
        open={showPromotionDialog}
        onClose={() => {
          setShowPromotionDialog(false);
          setShowSuccess(false);
          navigate("/dash");
        }}
        postId={createdPostId}
        isLostItem={isLostItem}
        onPromotionRequested={() => {
          // Handle successful promotion request
        }}
      />
    </Box>
  );
};


export default NewPostForm;
