import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUpdatePostMutation, useDeletePostMutation } from "../postsApiSlice";
import { useSelector } from "react-redux";
import { selectCurrentToken } from "../../auth/authSlice";
import * as Yup from "yup";
import { Formik, Form } from "formik";
import Textfield from "../../../components/Textfield";
import SelectOption from "../../../components/SelectOption";
import imageCompression from "browser-image-compression";
import { lighten, alpha } from "@mui/material/styles";
import {
  Box,
  FormLabel,
  Paper, 
  Typography, 
  CircularProgress, 
  useTheme, 
  Alert, 
  Button,
  Select,
  MenuItem,
  FormControl,
  TextField,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Card,
  CardMedia,
  CardActions,
  Chip,
  Autocomplete
} from "@mui/material";
import { 
  LocationOn, 
  Add as AddIcon, 
  Close as CloseIcon, 
  PhotoCamera, 
  Delete as DeleteIcon,
  Edit as EditIcon,
  CloudUpload as CloudUploadIcon,
  WarningAmber as WarningAmberIcon
} from '@mui/icons-material';
import { useTranslation } from "../../../utils/translations";
import useAuth from "../../../hooks/useAuth";
import { getOptimizedImageUrl } from "../../../utils/cloudinaryUtils";
import { getCategoryColor, getCategoryBackgroundColor } from "../../../config/categories";

// CSS keyframes for loading animations will be injected in useEffect

// Helper function to get city display name with fallback logic
const getCityDisplayName = (city, currentLanguage) => {
  if (!city) return 'Unknown City';
  
  // For Arabic language, prioritize Arabic script
  if (currentLanguage === 'ar') {
    // Priority: Arabic -> English -> French -> any available
    const priorityOrder = ['ar', 'en', 'fr'];
    for (const lang of priorityOrder) {
      if (city.labels?.[lang]) {
        return city.labels[lang];
      }
    }
  } else {
    // For English and French, prioritize Latin script (English/French)
    // Priority: Current language -> English -> French -> Arabic (as last resort)
    const priorityOrder = [currentLanguage, 'en', 'fr', 'ar'];
    for (const lang of priorityOrder) {
      if (city.labels?.[lang]) {
        // For English and French, avoid Arabic script if possible
        if ((currentLanguage === 'en' || currentLanguage === 'fr') && lang === 'ar') {
          // Only use Arabic if no Latin script is available
          continue;
        }
        return city.labels[lang];
      }
    }
  }
  
  // Fallback to any available label
  if (city.label) return city.label;
  if (city.name) return city.name;
  if (city.code) return city.code;
  
  return 'Unknown City';
};

const EditPostForm = ({ post, user, countries, flOptions, categories }) => {
  const [updatePost, { isLoading, isSuccess, isError, error }] = useUpdatePostMutation();
  const [deletePost, { isSuccess: isDelSuccess, isError: isDelError, error: delerror }] = useDeletePostMutation();
  const { t, currentLanguage } = useTranslation();
  const { role } = useAuth();
  const token = useSelector(selectCurrentToken);
  const navigate = useNavigate();
  const theme = useTheme();

  // Maps a city result's `source` field ('database' | 'geonames' | 'google',
  // set by the backend's DB -> GeoNames -> Google Places cascade) to a
  // label + color, same as NewPostForm's StepLocation.jsx, so it's visible
  // in the dropdown which API actually supplied a given suggestion.
  const getCitySourceInfo = (source) => {
    const sourceMap = {
      geonames: {
        label: { en: 'GeoNames', fr: 'GeoNames', ar: 'GeoNames' },
        color: theme.palette.info.main,
      },
      google: {
        label: { en: 'Google Places', fr: 'Google Places', ar: 'Google Places' },
        color: theme.palette.warning.main,
      },
      database: {
        label: { en: 'Database', fr: 'Base de données', ar: 'قاعدة البيانات' },
        color: theme.palette.success.main,
      },
    };
    const entry = sourceMap[source] || sourceMap.database;
    return { label: entry.label[currentLanguage] || entry.label.en, color: entry.color };
  };

  const sourceCaptionPrefix = currentLanguage === 'ar' ? 'المصدر' : 'Source';

  // State for cities
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [availableCities, setAvailableCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [setFieldValueCallback, setSetFieldValueCallback] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [hasFormChanged, setHasFormChanged] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const formikRef = useRef(null);
  const fileInputRef = useRef(null);

  // New state for unified city dropdown (from NewPostForm)
  const [citySearchQuery, setCitySearchQuery] = useState(""); // For search input inside dropdown
  const [cityDisplayValue, setCityDisplayValue] = useState(""); // For display in main read-only input
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [selectedCityFromSearch, setSelectedCityFromSearch] = useState(null);
  const [filteredCities, setFilteredCities] = useState([]);
  const [showCustomCityInput, setShowCustomCityInput] = useState(false);
  const [customCityName, setCustomCityName] = useState("");
  const [isCreatingCity, setIsCreatingCity] = useState(false);
  // Debounce timer + monotonically increasing sequence token for city
  // search - see handleCitySearchChange/performCitySearch. Same pattern as
  // NewPostForm: avoids hammering rate-limited external APIs on every
  // keystroke and prevents a slow response for an old query from
  // overwriting results for what's currently typed.
  const citySearchDebounceRef = useRef(null);
  const citySearchRequestIdRef = useRef(0);

  // Image management state
  const [selectedImage, setSelectedImage] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showImageWarningDialog, setShowImageWarningDialog] = useState(false);
  const [proceedCountdown, setProceedCountdown] = useState(0);
  
  // Track if categories have been initialized to prevent resetting user changes
  const categoriesInitializedRef = useRef(false);

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

  // Update filtered cities when cities or search query changes
  useEffect(() => {
    if (availableCities.length > 0) {
      if (citySearchQuery.trim()) {
        // Filter existing cities based on search query
        const filtered = availableCities.filter(city =>
          getCityDisplayName(city, currentLanguage).toLowerCase().includes(citySearchQuery.toLowerCase()) ||
          city.labels?.en?.toLowerCase().includes(citySearchQuery.toLowerCase()) ||
          city.labels?.ar?.toLowerCase().includes(citySearchQuery.toLowerCase()) ||
          city.labels?.fr?.toLowerCase().includes(citySearchQuery.toLowerCase())
        );
        setFilteredCities(filtered);
      } else {
        setFilteredCities(availableCities);
      }
    }
  }, [availableCities, citySearchQuery, currentLanguage]);

  // Cancel any pending debounced city search on unmount
  useEffect(() => {
    return () => {
      if (citySearchDebounceRef.current) {
        clearTimeout(citySearchDebounceRef.current);
      }
    };
  }, []);

  // Define fetchCitiesByCountry function FIRST, before any useEffect that uses it
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
        setAvailableCities(data.data);
      } else {
        console.error('Failed to fetch cities:', data.message);
        setAvailableCities([]);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
      setAvailableCities([]);
    } finally {
      setLoadingCities(false);
    }
  }, [currentLanguage, token]);

  // New function to search cities using hybrid search (from NewPostForm)
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
  }, [token]);

  // Inject CSS styles for loading animations
  useEffect(() => {
const loadingStyles = `
@keyframes mirrorReflection {
  0% {
    left: 0px;
    opacity: 0;
    transform: translateY(-50%) skew(-15deg) scaleX(0.5);
  }
  15% {
    opacity: 1;
    transform: translateY(-50%) skew(-15deg) scaleX(1);
  }
  85% {
    left: 100%;
    opacity: 1;
    transform: translateY(-50%) skew(-15deg) scaleX(1);
  }
  100% {
    left: 100%;
    opacity: 0;
    transform: translateY(-50%) skew(-15deg) scaleX(0.5);
  }
}
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = loadingStyles;
  document.head.appendChild(styleSheet);
}
  }, []);

  useEffect(() => {
    if (isSuccess) {
      setSuccessMessage(t('postUpdatedSuccessfully') || 'Post updated successfully! Your changes have been saved.');
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
        navigate("/dash");
      }, 2000);
    }
    if (isDelSuccess) {
      setSuccessMessage(t('postDeletedSuccessfully') || 'Post deleted successfully! The post has been removed.');
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
        navigate("/dash");
      }, 2000);
    }
  }, [isSuccess, isDelSuccess, navigate, t]);

  // Set city display value when post and cities are available
  useEffect(() => {
    if (post?.city) {
      // Handle both database cities (object) and API cities (string)
      if (typeof post.city === 'object' && post.city.id) {
        // Database city object - use cityName or cityLabels for display
        if (post.cityName) {
          setCityDisplayValue(post.cityName);
        } else if (post.cityLabels && post.cityLabels[currentLanguage]) {
          setCityDisplayValue(post.cityLabels[currentLanguage]);
        } else if (availableCities.length > 0) {
          const existingCity = availableCities.find(city => 
            city.id === post.city.id || city._id === post.city.id
          );
          
          if (existingCity) {
            setCityDisplayValue(getCityDisplayName(existingCity, currentLanguage));
          }
        }
      } else if (typeof post.city === 'string') {
        // Check if it's a database city (ObjectId format) or API city
        if (availableCities.length > 0) {
          const existingCity = availableCities.find(city => 
            city.id === post.city || 
            city._id === post.city
          );
          
          if (existingCity) {
            setCityDisplayValue(getCityDisplayName(existingCity, currentLanguage));
          } else {
            // It's an API city (string like "EL_JADIDA")
            // Use cityLabels for proper translation, then cityName, then city string
            if (post.cityLabels && post.cityLabels[currentLanguage]) {
              setCityDisplayValue(post.cityLabels[currentLanguage]);
            } else {
              setCityDisplayValue(post.cityName || post.city);
            }
          }
        } else {
          // No available cities yet, but we have a string city - likely API city
          // Use cityLabels for proper translation, then cityName, then city string
          if (post.cityLabels && post.cityLabels[currentLanguage]) {
            setCityDisplayValue(post.cityLabels[currentLanguage]);
          } else {
            setCityDisplayValue(post.cityName || post.city);
          }
        }
      }
    }
  }, [post?.city, post?.cityName, post?.cityLabels, availableCities, currentLanguage]);

  // Initialize selected country from post data
  useEffect(() => {
    if (post?.country && countries && countries.length > 0) {
      const country = countries.find(c => c._id === post.country);
      if (country && (!selectedCountry || selectedCountry._id !== country._id)) {
        setSelectedCountry(country);
      }
    }
  }, [post?.country, countries, selectedCountry]);

  // Store setFieldValue in a ref to avoid dependency issues
  const setFieldValueRef = useRef(null);
  
  // Update form values when categories become available (only on initial load)
  useEffect(() => {
    // Only initialize categories once when post and categories are first available
    // Don't reset if user has already made changes
    const setFieldValue = setFieldValueRef.current || setFieldValueCallback;
    
    if (post && categories && categories.length > 0 && setFieldValue && !categoriesInitializedRef.current) {
      // Get category IDs from post
      let categoryIds = [];
      
      // Support both new categories array and legacy single category
      // Handle Categories (capital C) - array of category objects from API
      if (post.Categories && Array.isArray(post.Categories) && post.Categories.length > 0) {
        // Extract IDs from category objects
        categoryIds = post.Categories.map(cat => String(cat._id || cat.id)).filter(Boolean);
      } else if (post.categories && Array.isArray(post.categories) && post.categories.length > 0) {
        // New format: categories array - convert to strings for consistency
        categoryIds = post.categories.map(id => String(id));
      } else if (post.categoryname && categories.length > 0) {
        // Legacy format: find category by categoryname
        const matchingCategory = categories.find(cat => 
          cat.code === post.categoryname || 
          cat.labels?.en === post.categoryname ||
          cat.labels?.fr === post.categoryname ||
          cat.labels?.ar === post.categoryname
        );
        if (matchingCategory) {
          categoryIds = [String(matchingCategory._id || matchingCategory.id)];
        }
      } else if (post.category) {
        // Fallback to direct category field - convert to string
        categoryIds = [String(post.category)];
      }
      
      // Verify that the category IDs exist in the categories array and update form
      if (categoryIds.length > 0) {
        // Convert all category IDs to strings for comparison
        const categoryIdsStr = categoryIds.map(id => String(id));
        const validCategoryIds = categoryIdsStr.filter(catId => 
          categories.some(cat => String(cat.id || cat._id) === catId)
        );
        if (validCategoryIds.length > 0) {
          setFieldValue('categories', validCategoryIds);
          // Also update legacy category field
          setFieldValue('category', validCategoryIds[0]);
          // Mark as initialized to prevent resetting user changes
          categoriesInitializedRef.current = true;
        }
      }
    }
  }, [post, categories, setFieldValueCallback]);
  
  // Reset initialization flag when post changes (user navigates to different post)
  useEffect(() => {
    categoriesInitializedRef.current = false;
  }, [post?._id]);

  // Update country in form when selectedCountry changes
  useEffect(() => {
    if (selectedCountry && selectedCountry._id && setFieldValueCallback) {
      setFieldValueCallback('country', selectedCountry._id);
    }
  }, [selectedCountry, setFieldValueCallback]);

  // Set the city value when cities are loaded and we have a post city
  useEffect(() => {
    if (post?.city && setFieldValueCallback) {
      // Handle both object and string city formats
      if (typeof post.city === 'object' && post.city.id) {
        // Database city - use the id directly (ObjectId)
        setFieldValueCallback('city', post.city.id);
      } else if (typeof post.city === 'string') {
        // Check if it's a database city (ObjectId format) or API city
        if (availableCities.length > 0) {
          const cityExists = availableCities.find(city => 
            city.id === post.city || city._id === post.city
          );
          if (cityExists) {
            // Use the city's id or _id as the form value
            const formCityId = cityExists.id || cityExists._id;
            setFieldValueCallback('city', formCityId);
          } else {
            // It's an API city (string like "EL_JADIDA")
            // Set form value with api_ prefix to match NewPostForm logic
            setFieldValueCallback('city', `api_${post.city}`);
            // Create a mock city object for selectedCityFromSearch
            setSelectedCityFromSearch({
              code: post.city,
              label: post.cityLabels?.[currentLanguage] || post.cityName || post.city,
              labels: post.cityLabels || { en: post.cityName || post.city }
            });
          }
        } else {
          // No available cities yet, but we have a string city - likely API city
          // Set form value with api_ prefix to match NewPostForm logic
          setFieldValueCallback('city', `api_${post.city}`);
          // Create a mock city object for selectedCityFromSearch
          setSelectedCityFromSearch({
            code: post.city,
            label: post.cityLabels?.[currentLanguage] || post.cityName || post.city,
            labels: post.cityLabels || { en: post.cityName || post.city }
          });
        }
      }
    }
  }, [post?.city, post?.cityName, post?.cityLabels, availableCities, setFieldValueCallback, currentLanguage]);

  // Initialize cities when country is selected
  useEffect(() => {
    if (selectedCountry && selectedCountry._id) {
      fetchCitiesByCountry(selectedCountry._id);
    }
  }, [selectedCountry?._id, fetchCitiesByCountry]);

  // Re-fetch cities when language changes (with debouncing to prevent rate limits)
  useEffect(() => {
    // Check if this is a language change refresh to avoid interference
    const urlParams = new URLSearchParams(window.location.search);
    const isLanguageChange = urlParams.get('lang_changed') === 'true';
    
    if (selectedCountry?._id && !isLanguageChange) {
      // Add a small delay to prevent multiple simultaneous API calls
      const timeoutId = setTimeout(() => {
        fetchCitiesByCountry(selectedCountry._id);
      }, 300);
      
      return () => clearTimeout(timeoutId);
    } else if (selectedCountry?._id && isLanguageChange) {
      // For language changes, wait longer to ensure auth state is restored
      const timeoutId = setTimeout(() => {
        fetchCitiesByCountry(selectedCountry._id);
      }, 1000); // Original working delay
      
      return () => clearTimeout(timeoutId);
    }
  }, [fetchCitiesByCountry, selectedCountry?._id, currentLanguage]);

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

  // Update filtered cities when cities or search query changes
  useEffect(() => {
    if (availableCities.length > 0) {
      if (citySearchQuery.trim()) {
        // Filter existing cities based on search query
        const filtered = availableCities.filter(city => 
          getCityDisplayName(city, currentLanguage).toLowerCase().includes(citySearchQuery.toLowerCase()) ||
          city.labels?.en?.toLowerCase().includes(citySearchQuery.toLowerCase()) ||
          city.labels?.ar?.toLowerCase().includes(citySearchQuery.toLowerCase()) ||
          city.labels?.fr?.toLowerCase().includes(citySearchQuery.toLowerCase())
        );
        setFilteredCities(filtered);
      } else {
        setFilteredCities(availableCities);
      }
    }
  }, [availableCities, citySearchQuery, currentLanguage]);

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

  // Image compression function (from NewPostForm)
  const compressImage = useCallback(async (file) => {
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
      
      setCompressionInfo({
        originalSize,
        compressedSize,
        compressionRatio
      });
      
      return compressedFile;
    } catch (error) {
      console.error('Image compression failed:', error);
      setCompressionInfo(null);
      return file; // Return original file if compression fails
    } finally {
      setIsCompressing(false);
    }
  }, []);

  const handleImageButtonClick = useCallback(() => {
    if (isCompressing) return;
    setProceedCountdown(6);
    setShowImageWarningDialog(true);
  }, [isCompressing]);

  const handleImageWarningProceed = useCallback(() => {
    if (proceedCountdown > 0) return;
    setShowImageWarningDialog(false);
    setProceedCountdown(0);
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 150);
  }, [fileInputRef, proceedCountdown]);

  const handleImageWarningClose = useCallback(() => {
    setShowImageWarningDialog(false);
    setProceedCountdown(0);
  }, []);

  useEffect(() => {
    if (!showImageWarningDialog) {
      return;
    }
    if (proceedCountdown <= 0) {
      return;
    }
    const timer = setTimeout(() => {
      setProceedCountdown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearTimeout(timer);
  }, [showImageWarningDialog, proceedCountdown]);

  // Get current image URL for display
  const getCurrentImageUrl = useCallback(() => {
    // If image was removed, don't show anything
    if (selectedImage === "REMOVED") {
      return null;
    }
    
    if (imagePreview) {
      return imagePreview;
    }
    if (post?.image) {
      const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3500";
      return post.image.startsWith('http') 
        ? getOptimizedImageUrl(post.image, 'card') 
        : `${API_BASE_URL}/${post.image}`;
    }
    return null;
  }, [post?.image, imagePreview, selectedImage]);

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
    
    // Mark that image has been removed (set to null to indicate removal)
    setSelectedImage("REMOVED");
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

  const handleCountrySelect = (event, setFieldValue) => {
    const countryId = event.target.value;
    const country = countries.find(c => c._id === countryId);
    setSelectedCountry(country);
    
    // Clear country field error if country is selected
    if (countryId) {
      clearFieldError('country');
    }
    
    // Update form value
    setFieldValue('country', countryId);
    
    // Reset cities when country changes
    setAvailableCities([]);
    setFilteredCities([]);
    setCitySearchQuery("");
    setSearchResults([]);
    
    // Clear the city field in the form
    setFieldValue('city', '');
    
    // Fetch cities for the selected country
    if (countryId) {
      fetchCitiesByCountry(countryId);
    }
  };

  // Runs the actual search for one query. `requestId` is a snapshot of
  // citySearchRequestIdRef taken when this call was scheduled; if the user
  // has typed something else since (bumping the ref further), every
  // setSearchResults below is skipped so a slow response for an old,
  // partial query can never overwrite results for what's currently typed.
  const performCitySearch = useCallback(async (query, requestId) => {
    const isStale = () => requestId !== citySearchRequestIdRef.current;

    // Get country code from selectedCountry object - must be ISO code (e.g., 'MA', 'EG')
    let countryCode = selectedCountry?.code;
    if (countryCode && typeof countryCode === 'string' && countryCode.length === 2) {
      countryCode = countryCode.toUpperCase();
    } else {
      console.warn('⚠️ Invalid or missing country code:', {
        code: selectedCountry?.code,
        country: selectedCountry
      });
      countryCode = null;
    }

    try {
      if (query.length >= 2 && selectedCountry?._id) {
        // Try hybrid search first (includes GeoNames + Google Places API)
        const results = await searchCitiesHybrid(query, countryCode);
        if (isStale()) return;

        if (results.length > 0) {
          setSearchResults(results);
          return;
        }

        // Fallback to traditional search
        const fallbackResults = await searchCitiesTraditional(query, selectedCountry._id);
        if (isStale()) return;

        if (fallbackResults.length > 0) {
          setSearchResults(fallbackResults);
          return;
        }

        // Final fallback: filter existing cities
        const localResults = availableCities.filter(city =>
          getCityDisplayName(city, currentLanguage).toLowerCase().includes(query.toLowerCase()) ||
          city.labels?.en?.toLowerCase().includes(query.toLowerCase()) ||
          city.labels?.ar?.toLowerCase().includes(query.toLowerCase()) ||
          city.labels?.fr?.toLowerCase().includes(query.toLowerCase())
        ).map(city => ({
          ...city,
          source: 'database',
          _id: city.id || city._id
        }));
        setSearchResults(localResults);
      } else if (query.length > 0) {
        // Show local filtered results for shorter queries
        const localResults = availableCities.filter(city =>
          getCityDisplayName(city, currentLanguage).toLowerCase().includes(query.toLowerCase()) ||
          city.labels?.en?.toLowerCase().includes(query.toLowerCase()) ||
          city.labels?.ar?.toLowerCase().includes(query.toLowerCase()) ||
          city.labels?.fr?.toLowerCase().includes(query.toLowerCase())
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
  }, [searchCitiesHybrid, searchCitiesTraditional, selectedCountry, availableCities, currentLanguage]);

  // Handle city search input change (only from dropdown search input).
  // Debounced (300ms) and sequence-guarded - see performCitySearch above and
  // the matching comment in NewPostForm.js for why this is needed.
  const handleCitySearchChange = useCallback((event) => {
    const query = event.target.value;
    setCitySearchQuery(query);

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

  // Handle city selection from dropdown (from NewPostForm)
  const handleCitySelect = (city, setFieldValue) => {
    setSelectedCityFromSearch(city);
    const cityDisplayName = getCityDisplayName(city, currentLanguage);
    setCityDisplayValue(cityDisplayName); // Set display value
    setCitySearchQuery(""); // Clear search query
    setShowCityDropdown(false);
    
    // Set the city value in the form - match NewPostForm logic exactly
    if (city._id) {
      // Database city
      setFieldValue('city', city._id);
    } else {
      // API city - we'll handle this in the submit (match NewPostForm)
      setFieldValue('city', `api_${city.code}`);
    }
    
    // Clear city field error
    clearFieldError('city');
  };

  // Handle dropdown toggle (from NewPostForm)
  const handleCityDropdownToggle = () => {
    if (!showCityDropdown) {
      // Opening dropdown - clear search query to start fresh
      setCitySearchQuery("");
      setSearchResults([]);
    }
    setShowCityDropdown(!showCityDropdown);
  };

  // Handle custom city name change
  const handleCustomCityChange = (event) => {
    setCustomCityName(event.target.value);
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

  // Helper function to get found/lost type from ID
  const getFoundLostType = (foundLostId) => {
    const flOption = flOptions.find(option => option._id === foundLostId);
    return flOption?.code || 'UNKNOWN';
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

  // Get city display name for selected city or city object
  const getCityDisplayName = (cityOrId, currentLang = 'en') => {
    if (!cityOrId) return '';
    
    // If it's a city object (from search results or filtered cities)
    if (typeof cityOrId === 'object') {
      const city = cityOrId;
      // Try to get the label in the current language first
      if (city.labels && city.labels[currentLang]) {
        return city.labels[currentLang];
      }
      // Fallback to other language labels or properties
      return city.label || city.labels?.en || city.name || city.code || 'Unknown City';
    }
    
    // If it's a city ID (existing logic)
    const city = availableCities.find(c => c.id === cityOrId);
    return city ? (city.label || city.name || 'Unknown City') : cityOrId;
  };

  // Debug: Log city field differences

  // Initialize form state with existing post data
  const initialFormState = useMemo(() => {
    if (!post) return {};
    
    // Helper function to get category IDs from post
    const getCategoryIds = () => {
      // Support both new categories array and legacy single category
      // Handle Categories (capital C) - array of category objects from API
      if (post?.Categories && Array.isArray(post.Categories) && post.Categories.length > 0) {
        // Extract IDs from category objects
        return post.Categories.map(cat => cat._id || cat.id).filter(Boolean);
      }
      // Handle categories (lowercase c) - array of category IDs
      if (post?.categories && Array.isArray(post.categories) && post.categories.length > 0) {
        // New format: categories array - return IDs directly (convert to strings for consistency)
        return post.categories.map(id => String(id));
      } else {
        // Legacy format: single category - convert to array
        let categoryValue = "";
        
        if (post?.categoryname && categories && categories.length > 0) {
          // Find category by matching the categoryname (code) with the categories array
          const matchingCategory = categories.find(cat => 
            cat.code === post.categoryname || 
            cat.labels?.en === post.categoryname ||
            cat.labels?.fr === post.categoryname ||
            cat.labels?.ar === post.categoryname
          );
          if (matchingCategory) {
            categoryValue = matchingCategory._id || matchingCategory.id;
          }
        }
        
        // Fallback to direct category field
        if (!categoryValue) {
          categoryValue = post?.category || "";
        }
        
        // Return as array for new format, empty array if no category
        return categoryValue ? [categoryValue] : [];
      }
    };
    
    return {
    country: post?.country || "",
    contact: post?.contact || "",
    categories: getCategoryIds(),
    category: (() => {
      // Keep for backward compatibility during transition
      // Get first category from Categories array, categories array, or legacy category field
      const categoryIds = getCategoryIds();
      if (categoryIds.length > 0) {
        return categoryIds[0];
      }
      
      // Fallback: Try to find the category by matching the categoryname with the categories array
      let categoryValue = "";
      
      if (post?.categoryname && categories && categories.length > 0) {
        // Find category by matching the categoryname (code) with the categories array
        const matchingCategory = categories.find(cat => 
          cat.code === post.categoryname || 
          cat.labels?.en === post.categoryname ||
          cat.labels?.fr === post.categoryname ||
          cat.labels?.ar === post.categoryname
        );
        if (matchingCategory) {
          categoryValue = String(matchingCategory._id || matchingCategory.id);
        }
      }
      
      // Fallback to direct category field
      if (!categoryValue) {
        categoryValue = post?.category ? String(post.category) : "";
      }
      
      return categoryValue;
    })(),
    foundLost: post?.foundLost || "",
    city: (() => {
      // Handle both object and string city formats
      if (post?.city) {
        if (typeof post.city === 'object' && post.city.id) {
          // Database city object - return the id (ObjectId)
          return post.city.id;
        } else if (typeof post.city === 'string') {
          // String city - could be ObjectId or API city
          // For API cities, return with api_ prefix to match NewPostForm
          return `api_${post.city}`;
        }
      }
      return "";
    })(),
    exactLocation: post?.exactLocation || "",
    exactDate: post?.mainDate || "", // Add mainDate field as exactDate
    description: post?.description || "",
    // image: null, // For new image uploads - temporarily disabled
    // Status fields
    status: post?.status || "active",
    returned: post?.returned || false
  };
  }, [post, categories]);

  // Function to check if form has changed
  const checkFormChanged = (currentValues) => {
    // Only check for changes if we have a proper initial form state
    if (!initialFormState || Object.keys(initialFormState).length === 0) {
      return;
    }
    
    const hasChanged = Object.keys(initialFormState).some(key => {
      // Skip only status field for change detection (admin-only field)
      if (key === 'status') {
        return false;
      }
      const initialValue = initialFormState[key];
      const currentValue = currentValues[key];
      const isChanged = currentValue !== initialValue;
      
      return isChanged;
    });
    
    // Also check for image changes
    const hasImageChanged = selectedImage !== null;
    
    setHasFormChanged(hasChanged || hasImageChanged);
  };

  // Remove Yup validation - we'll handle validation in handleSubmit
  const formValidation = Yup.object().shape({
    // Only validate optional fields, required fields will be validated in handleSubmit
    description: Yup.string().optional(),
    // image: Yup.mixed().nullable(), // temporarily disabled
    status: Yup.string().oneOf(['active', 'resolved', 'expired', 'suspended']),
    returned: Yup.boolean()
  });

  const handleSubmit = async (values, { setSubmitting, setStatus }) => {
    
    try {
      // Clear any previous validation errors
      setStatus(null);
      setFieldErrors({});
      
      // Validate required fields
      const missingFields = [];
      const newFieldErrors = {};
      
      if (!values.foundLost) {
        missingFields.push(t('foundOrLost'));
        newFieldErrors.foundLost = t('required');
      }
      // Validate categories - support both new categories array and legacy single category
      // Ensure categories is always an array of string IDs
      let selectedCategories = [];
      if (values.categories && Array.isArray(values.categories) && values.categories.length > 0) {
        // Convert all category IDs to strings and filter out any invalid values
        selectedCategories = values.categories
          .map(cat => {
            // Handle both ID strings and category objects
            if (typeof cat === 'string') {
              return cat;
            } else if (typeof cat === 'object' && cat !== null) {
              return String(cat.id || cat._id || '');
            }
            return String(cat || '');
          })
          .filter(id => id && id !== 'undefined' && id !== 'null');
      } else if (values.category) {
        // Fallback to legacy single category
        selectedCategories = [String(values.category)];
      }
      
      if (selectedCategories.length === 0) {
        missingFields.push(t('category'));
        newFieldErrors.category = t('required');
      }
      if (!selectedCountry) {
        missingFields.push(t('country'));
        newFieldErrors.country = t('required');
      }
      if (!values.city || values.city === 'other') {
        missingFields.push(t('city'));
        newFieldErrors.city = t('required');
      }
      if (!values.exactLocation?.trim()) {
        missingFields.push(t('exactLocation'));
        newFieldErrors.exactLocation = t('required');
      }
      if (!values.contact?.trim()) {
        missingFields.push(t('contact'));
        newFieldErrors.contact = t('required');
      }
      
      if (missingFields.length > 0) {
        const errorMessage = `${t('fillRequiredFields')}: ${missingFields.join(', ')}`;
        setStatus({ validationError: errorMessage });
        setFieldErrors(newFieldErrors);
        setSubmitting(false);
        
        // Scroll to first error field
        setTimeout(() => {
          let fieldToScroll = null;
          
          // Map missing field names to actual field selectors
          if (missingFields.includes(t('foundOrLost'))) {
            fieldToScroll = document.querySelector('[data-testid="foundLost"]');
          } else if (missingFields.includes(t('category'))) {
            fieldToScroll = document.querySelector('[data-testid="category"]');
          } else if (missingFields.includes(t('country'))) {
            fieldToScroll = document.querySelector('[data-testid="country-select"]');
          } else if (missingFields.includes(t('city'))) {
            fieldToScroll = document.querySelector('[data-testid="city-select"]');
          } else if (missingFields.includes(t('exactLocation'))) {
            fieldToScroll = document.querySelector('[data-testid="exactLocation"]');
          } else if (missingFields.includes(t('contact'))) {
            fieldToScroll = document.querySelector('[data-testid="contact"]');
          }
          
          if (fieldToScroll) {
            // Get the field's position
            const rect = fieldToScroll.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const targetPosition = rect.top + scrollTop - 100; // 100px offset from top
            
            // Smooth scroll to the field
            window.scrollTo({
              top: targetPosition,
              behavior: 'smooth'
            });
            
            // Focus the field after scroll
            setTimeout(() => {
              fieldToScroll.focus();
            }, 500);
          }
        }, 100);
        return;
      }

      setSubmitting(true);

      // Prepare data for submission (match API expectations)
      // selectedCategories is already declared above in validation section
      // Ensure categories is an array of valid string IDs
      const categoriesArray = Array.isArray(selectedCategories) && selectedCategories.length > 0
        ? selectedCategories.map(id => String(id)).filter(Boolean)
        : [];
      
      const postData = {
        user: post.user, // Use the original post's user ID to avoid validation issues
        country: selectedCountry?._id || values.country,
        categories: categoriesArray, // New: array of category IDs (ensured to be strings)
        category: categoriesArray.length > 0 ? categoriesArray[0] : null, // Legacy: first category for backward compatibility
        foundLost: values.foundLost,
        exactLocation: values.exactLocation,
        mainDate: values.exactDate || "", // Add mainDate field
        contact: values.contact,
        description: values.description || "",
        returned: values.returned || false, // Add the returned field
        contactPreferences: { whatsapp: true }
      };

      // Handle image - include new image if selected or mark for removal
      if (selectedImage === "REMOVED") {
        postData.image = null; // Mark image for removal
      } else if (selectedImage && selectedImage !== "REMOVED") {
        postData.image = selectedImage; // New image
      }

      // Handle city - match NewPostForm logic exactly
      if (values.city && values.city.startsWith('api_')) {
        // API city - send the city data
        postData.city = selectedCityFromSearch?.code || values.city.replace('api_', '');
        postData.cityData = selectedCityFromSearch;
      } else {
        // Database city - send the ObjectId directly
        postData.city = values.city;
      }
      
      // console.log('🚀 UPDATE POST - Starting update process...');
      // console.log('📦 UPDATE POST - Prepared postData:', postData);
      // console.log('🌐 UPDATE POST - Calling updatePost API...');
      
      // Use FormData if there's an image, otherwise use regular JSON
      let result;
      if (selectedImage && selectedImage !== "REMOVED") {
        // Validate that selectedImage is actually a File/Blob object
        if (!(selectedImage instanceof File) && !(selectedImage instanceof Blob)) {
          console.error('❌ UPDATE POST - Invalid image type:', typeof selectedImage, selectedImage);
          setStatus({
            type: 'error',
            message: t('invalidImageFile') || 'Invalid image file. Please select a valid image.'
          });
          setSubmitting(false);
          return;
        }
        
        // Create FormData for image upload
        const formData = new FormData();
        const postDataWithId = { id: post._id, ...postData };
        formData.append("postData", JSON.stringify(postDataWithId));
        formData.append("image", selectedImage);
        
        // Use fetch directly for FormData
        const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:3500";
        try {
          const response = await fetch(`${baseUrl}/posts`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          });
          
          if (!response.ok) {
            let errorData;
            const contentType = response.headers.get("content-type");
            try {
              if (contentType && contentType.includes("application/json")) {
                errorData = await response.json();
              } else {
                const text = await response.text();
                errorData = { 
                  message: text || `HTTP ${response.status}: ${response.statusText}`,
                  status: response.status
                };
              }
            } catch (e) {
              errorData = { 
                message: `HTTP ${response.status}: ${response.statusText}`,
                status: response.status
              };
            }
            throw new Error(errorData.message || errorData.error?.message || 'Update failed');
          }
          
          result = { data: await response.text() };
          
          // Manually trigger success flow for FormData requests - show immediately
          setSuccessMessage(t('postUpdatedSuccessfully') || 'Post updated successfully! Your changes have been saved.');
          setShowSuccessMessage(true);
          setTimeout(() => {
            setShowSuccessMessage(false);
            navigate("/dash");
          }, 2000);
        } catch (fetchError) {
          // Re-throw fetch errors with better context
          throw fetchError;
        }
      } else {
        // Use regular JSON for non-image updates
        result = await updatePost({ id: post._id, ...postData }).unwrap();
      }
    } catch (error) {
      console.error('❌ UPDATE POST - Update failed:', error);
      
      // Handle RTK Query errors (have data property)
      if (error?.data) {
        setStatus({
          type: 'error',
          message: error?.data?.message || error?.data?.error?.message || t('updateFailed')
        });
      } else {
        // Handle regular Error objects (from fetch)
        setStatus({
          type: 'error',
          message: error?.message || t('updateFailed')
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async () => {
    try {
      await deletePost({ id: post._id }).unwrap();
      setSuccessMessage(t('postDeletedSuccessfully'));
      setShowSuccessMessage(true);
      setTimeout(() => {
        navigate("/dash");
      }, 2000);
    } catch (error) {
      console.error('Delete failed:', error?.data?.message || error.message);
      setSuccessMessage(error?.data?.message || t('deleteFailed'));
      setShowSuccessMessage(true);
    }
  };

  if (isError || isDelError) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Alert severity="error" sx={{ maxWidth: 600 }}>
          <Typography variant="h6">{t('error')}</Typography>
          <Typography>{error?.data?.message || delerror?.data?.message || t('errorOccurred')}</Typography>
        </Alert>
      </Box>
    );
  }

  // Show loading state while post data is being loaded
  if (!post) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        width="100vw"
        gap={2}
        sx={{ 
          backgroundColor: 'white',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 9999
        }}
      >
        <Box
          sx={{
            width: 150,
            height: 150,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
            <img
              src="/maflogoSVG.svg"
              alt="Loading..."
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                position: 'relative',
                zIndex: 2
              }}
            />
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '0px',
              width: '30px',
              height: '80%',
              background: 'linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.4), transparent)',
              transform: 'translateY(-50%) skew(-15deg)',
              borderRadius: '2px',
              zIndex: 3,
              animation: 'mirrorReflection 1s ease-in-out infinite',
              boxShadow: '0 0 10px rgba(255, 255, 255, 0.3)',
              pointerEvents: 'none',
            }} />
          </div>
        </Box>
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
        position: 'relative'
      }}
    >
      {/* Backdrop overlay - temporarily disabled */}
      {/* {showCustomCityInput && (
        <Box>...</Box>
      )} */}
      <Paper
        elevation={4}
        sx={{
          p: { xs: 3, md: 5 },
          maxWidth: 700,
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
          {t('editPost')}
        </Typography>

        {/* Success Message */}
        {showSuccessMessage && (
          <Box
            sx={{
              position: 'fixed',
              top: { xs: '80px', md: '100px' },
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9999,
              maxWidth: { xs: '90%', sm: '400px' },
              width: '100%',
              animation: 'slideDown 0.3s ease-out',
              '@keyframes slideDown': {
                '0%': {
                  opacity: 0,
                  transform: 'translateX(-50%) translateY(-20px)',
                },
                '100%': {
                  opacity: 1,
                  transform: 'translateX(-50%) translateY(0)',
                },
              },
            }}
          >
            <Alert
              severity="success"
              sx={{
                borderRadius: 3,
                boxShadow: `0 8px 32px ${alpha(theme.palette.success.main, theme.palette.mode === 'dark' ? 0.3 : 0.2)}`,
                border: `2px solid ${alpha(theme.palette.success.main, theme.palette.mode === 'dark' ? 0.3 : 0.2)}`,
                backgroundColor: alpha(theme.palette.success.main, theme.palette.mode === 'dark' ? 0.2 : 0.15),
                backdropFilter: 'blur(10px)',
                '& .MuiAlert-icon': {
                  fontSize: '1.5rem',
                  color: theme.palette.success.main,
                },
                '& .MuiAlert-message': {
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: theme.palette.success.main,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                },
              }}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: theme.palette.success.main,
                    animation: 'pulse 1.5s ease-in-out infinite',
                    '@keyframes pulse': {
                      '0%': {
                        transform: 'scale(1)',
                        opacity: 1,
                      },
                      '50%': {
                        transform: 'scale(1.2)',
                        opacity: 0.7,
                      },
                      '100%': {
                        transform: 'scale(1)',
                        opacity: 1,
                      },
                    },
                  }}
                />
                {successMessage}
              </Box>
            </Alert>
          </Box>
        )}

        <Formik
          ref={formikRef}
          initialValues={initialFormState}
          validationSchema={formValidation}
          onSubmit={handleSubmit}
          enableReinitialize={true}
        >
          {({ isSubmitting, status, setFieldValue, values }) => {
            // Store setFieldValue function for use in custom city creation and category initialization
            setSetFieldValueCallback(() => setFieldValue);
            setFieldValueRef.current = setFieldValue;
            
            // Check if form has changed whenever values change (call directly instead of useEffect)
            checkFormChanged(values);
            
            return (
            <Form>
              {status?.error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {status.error}
                </Alert>
              )}
              
              {status?.validationError && (
                <Alert 
                  severity="error" 
                  sx={{ 
                    mb: 3,
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
              )}
              
              <Box display="flex" flexDirection="column" gap={3}>
                {/* Item Returned Status */}
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    border: `2px solid ${values.returned ? theme.palette.success.main : theme.palette.divider}`,
                    backgroundColor: values.returned
                      ? alpha(theme.palette.success.main, theme.palette.mode === 'dark' ? 0.1 : 0.05)
                      : alpha(theme.custom.color.ink, 0.02),
                    transition: 'all 0.3s ease-in-out',
                    cursor: 'pointer',
                    '&:hover': {
                      borderColor: values.returned ? theme.palette.success.dark : theme.custom.color.brandPrimary,
                      backgroundColor: values.returned
                        ? alpha(theme.palette.success.main, theme.palette.mode === 'dark' ? 0.15 : 0.08)
                        : alpha(theme.custom.color.ink, 0.04),
                      transform: 'translateY(-2px)',
                      boxShadow: theme.palette.mode === 'dark'
                        ? '0 8px 25px rgba(0, 0, 0, 0.3)'
                        : '0 8px 25px rgba(0, 0, 0, 0.1)',
                    }
                  }}
                  onClick={() => setFieldValue('returned', !values.returned)}
                >
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        border: `2px solid ${values.returned ? theme.palette.success.main : theme.palette.text.secondary}`,
                        backgroundColor: values.returned ? theme.palette.success.main : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease-in-out',
                        position: 'relative',
                        '&::after': values.returned ? {
                          content: '"✓"',
                          color: 'white',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          position: 'absolute',
                        } : {}
                      }}
                    />
                    <Box>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 600,
                          color: values.returned ? theme.palette.success.main : theme.palette.text.primary,
                          transition: 'color 0.2s ease-in-out'
                        }}
                      >
                        {t('itemReturned')}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Basic Information Section */}
                <Typography 
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: theme.custom.color.brandPrimary,
                    fontSize: '1.4rem',
                    mb: 1
                  }}
                >
                  {t('basicInformation')}
                </Typography>

                <Box>
                  <FormLabel 
                    htmlFor="foundLost" 
                    sx={{ 
                      mb: 1, 
                      display: "block", 
                      fontWeight: 600, 
                      fontSize: '1.15rem',
                      color: theme.palette.text.primary
                    }}
                  >
                    {t('haveYouLostOrFoundSomething')} *
                  </FormLabel>
                  <SelectOption 
                    name="foundLost" 
                    options={flOptions} 
                    data-testid="foundLost"
                    error={!!fieldErrors.foundLost}
                    helperText={fieldErrors.foundLost}
                    onErrorClear={clearFieldError}
                  />
                </Box>

                <Box>
                  <FormLabel 
                    htmlFor="categories" 
                    sx={{ 
                      mb: 1, 
                      display: "block", 
                      fontWeight: 600, 
                      fontSize: '1.15rem',
                      color: theme.palette.text.primary
                    }}
                  >
                    {getFoundLostType(values.foundLost) === 'LOST' 
                      ? t('specifyItemTypeLost')
                      : t('specifyItemTypeFound')
                    } *
                  </FormLabel>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      mb: 1, 
                      display: "block", 
                      fontSize: '1rem',
                      color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                      fontWeight: 500
                    }}
                  >
                    {currentLanguage === 'ar' 
                      ? 'يمكنك اختيار عدة فئات (مثال: محفظة، أوراق، بطاقة هوية)'
                      : currentLanguage === 'fr'
                        ? 'Vous pouvez sélectionner plusieurs catégories (ex: portefeuille, papiers, carte d\'identité)'
                        : 'You can select multiple categories (e.g., wallet, papers, ID card)'
                    }
                  </Typography>
                  <Autocomplete
                    multiple
                    options={categories || []}
                    getOptionLabel={(option) => {
                      if (typeof option === 'string') {
                        // If option is just an ID string, find the category object
                        const cat = categories.find(c => c.id === option || c._id === option);
                        if (cat) {
                          return cat.labels?.[currentLanguage] || cat.label || cat.code || option;
                        }
                        return option;
                      }
                      return option.labels?.[currentLanguage] || option.label || option.code || '';
                    }}
                    value={(() => {
                      // Get category IDs from form values
                      const categoryIds = values.categories && Array.isArray(values.categories) && values.categories.length > 0
                        ? values.categories
                        : (values.category ? [values.category] : []);
                      
                      if (categoryIds.length === 0 || !categories || categories.length === 0) {
                        return [];
                      }
                      
                      // Convert all IDs to strings for comparison
                      const categoryIdsStr = categoryIds.map(id => String(id));
                      
                      // Filter categories that match any of the category IDs
                      return categories.filter(cat => {
                        const catId = String(cat.id || cat._id);
                        return categoryIdsStr.includes(catId);
                      });
                    })()}
                    onChange={(event, newValue) => {
                      // Extract category IDs and ensure they're strings
                      const categoryIds = newValue
                        .map(cat => {
                          const id = cat.id || cat._id;
                          return id ? String(id) : null;
                        })
                        .filter(Boolean); // Remove any null/undefined values
                      
                      setFieldValue('categories', categoryIds);
                      // Also set legacy category field for backward compatibility
                      if (categoryIds.length > 0) {
                        setFieldValue('category', categoryIds[0]);
                      } else {
                        setFieldValue('category', '');
                      }
                      clearFieldError('category');
                    }}
                    isOptionEqualToValue={(option, value) => {
                      const optionId = option.id || option._id;
                      const valueId = value.id || value._id;
                      return optionId === valueId;
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        variant="outlined"
                        placeholder={currentLanguage === 'ar' 
                          ? 'اختر الفئات...'
                          : currentLanguage === 'fr'
                            ? 'Sélectionner les catégories...'
                            : 'Select categories...'
                        }
                        data-testid="category"
                        error={!!fieldErrors.category}
                        helperText={fieldErrors.category || (currentLanguage === 'ar' 
                          ? 'يمكنك اختيار أكثر من فئة واحدة'
                          : currentLanguage === 'fr'
                            ? 'Vous pouvez sélectionner plusieurs catégories'
                            : 'You can select multiple categories'
                        )}
                        sx={{
                          borderRadius: 2,
                          '& .MuiOutlinedInput-root': {
                            '&:hover fieldset': {
                              borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: theme.custom.color.brandPrimary,
                            },
                            '& fieldset': {
                              borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
                            },
                          },
                        }}
                      />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => {
                        const { key, ...tagProps } = getTagProps({ index });
                        const categoryName = option.labels?.[currentLanguage] || option.label || option.code || '';
                        // Use the category's own color if the data has a code for it;
                        // otherwise fall back to the wizard's brand accent.
                        const chipColor = option.code
                          ? getCategoryColor(option.code)
                          : theme.custom.color.brandPrimary;
                        const chipBackground = option.code
                          ? getCategoryBackgroundColor(option.code)
                          : (theme.palette.mode === 'dark' ? 'rgba(91, 127, 255, 0.2)' : 'rgba(27, 77, 255, 0.1)');
                        return (
                          <Chip
                            key={key}
                            label={categoryName}
                            {...tagProps}
                            sx={{
                              borderRadius: 2,
                              backgroundColor: theme.palette.mode === 'dark' ? `${chipColor}33` : chipBackground,
                              color: chipColor,
                              border: `1px solid ${chipColor}`,
                              '& .MuiChip-deleteIcon': {
                                color: chipColor,
                              },
                            }}
                          />
                        );
                      })
                    }
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />
                </Box>

                {/* Location Section */}
                <Typography 
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: theme.custom.color.brandPrimary,
                    fontSize: '1.4rem',
                    mb: 1
                  }}
                >
                  {t('location')}
                </Typography>

                <Box>
                  <FormLabel 
                    htmlFor="country" 
                    sx={{ 
                      mb: 1, 
                      display: "block", 
                      fontWeight: 600, 
                      fontSize: '1.15rem',
                      color: theme.palette.text.primary
                    }}
                  >
                    {t('country')} *
                  </FormLabel>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      mb: 1, 
                      display: "block", 
                      fontSize: '1rem',
                      color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                      fontWeight: 500
                    }}
                  >
                    {getFoundLostType(values.foundLost) === 'LOST' 
                      ? t('chooseCountryLost') 
                      : t('chooseCountryFound')
                    }
                  </Typography>
                  <FormControl fullWidth error={!!fieldErrors.country}>
                    <Select
                      value={values.country || ""}
                      onChange={(e) => handleCountrySelect(e, setFieldValue)}
                      data-testid="country-select"
                      displayEmpty
                      sx={{
                        borderRadius: 2,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.custom.color.brandPrimary,
                        },
                        color: theme.palette.text.primary,
                        fontWeight: 500
                      }}
                    >
                      {countries?.map((country) => (
                        <MenuItem key={country._id} value={country._id}>
                          <Box display="flex" alignItems="center" gap={1}>
                            {country.flag ? (
                              <span style={{ fontSize: '20px' }}>
                                {country.flag}
                              </span>
                            ) : (
                              <img
                                loading="lazy"
                                width="20"
                                src={`https://flagcdn.com/w20/${country.code.toLowerCase()}.png`}
                                srcSet={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png 2x`}
                                alt=""
                                style={{ marginInlineEnd: 8 }}
                              />
                            )}
                            {getCountryLabel(country)} ({country.code})
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                    {fieldErrors.country && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          mt: 1, 
                          display: 'block',
                          color: theme.palette.error.main,
                          fontWeight: 500
                        }}
                      >
                        {fieldErrors.country}
                      </Typography>
                    )}
                  </FormControl>
                </Box>

                <Box>
                  <FormLabel 
                    htmlFor="city" 
                    sx={{ 
                      mb: 1, 
                      display: "block", 
                      fontWeight: 600, 
                      fontSize: '1.15rem',
                      color: theme.palette.text.primary
                    }}
                  >
                    {t('city')} *
                  </FormLabel>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      mb: 1, 
                      display: "block", 
                      fontSize: '1rem',
                      color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                      fontWeight: 500
                    }}
                  >
                    {!selectedCountry 
                      ? t('selectCountryFirst') 
                        : getFoundLostType(values.foundLost) === 'LOST'
                          ? currentLanguage === 'ar' 
                            ? 'يرجى تحديد المدينة التي فقدت فيها العنصر أو أقرب مدينة رئيسية إليها'
                            : currentLanguage === 'fr'
                              ? 'Veuillez sélectionner la ville où vous avez perdu l\'objet ou la ville principale la plus proche'
                              : 'Please select the city where you lost the item or the nearest major administrative center'
                          : currentLanguage === 'ar' 
                            ? 'يرجى تحديد المدينة التي وجدت فيها العنصر أو أقرب مدينة رئيسية إليها'
                            : currentLanguage === 'fr'
                              ? 'Veuillez sélectionner la ville où vous avez trouvé l\'objet ou la ville principale la plus proche'
                              : 'Please select the city where you found the item or the nearest major administrative center'
                    }
                  </Typography>
                  
                  {/* Debug info */}
                  {process.env.NODE_ENV === 'development' && selectedCountry && (
                    <Box>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          mb: 1, 
                          display: "block", 
                          fontSize: '0.8rem',
                          color: theme.palette.warning.main,
                          fontWeight: 500
                        }}
                      >
                        Debug: Country: {selectedCountry.code || selectedCountry.labels?.en || 'No code'} | Cities loaded: {availableCities.length}
                      </Typography>
                    </Box>
                  )}
                  
                  <Box sx={{ 
                    position: 'relative'
                  }} data-testid="city-dropdown">
                    {/* City Display Input (Read-only) */}
                    <TextField
                      fullWidth
                      placeholder={currentLanguage === 'ar' ? 'اختر مدينة...' : currentLanguage === 'fr' ? 'Sélectionner une ville...' : 'Select a city...'}
                      value={cityDisplayValue}
                      readOnly
                      disabled={!selectedCountry}
                      data-testid="city-select"
                      onClick={handleCityDropdownToggle}
                      sx={{
                        borderRadius: 2,
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': {
                          borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
                        },
                          '&.Mui-focused fieldset': {
                          borderColor: theme.custom.color.brandPrimary,
                        },
                          '& fieldset': {
                            borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
                          },
                        color: theme.palette.text.primary,
                          fontWeight: 500,
                          cursor: 'pointer',
                          '& .MuiInputBase-input': {
                            cursor: 'pointer'
                          }
                        }
                      }}
                      InputProps={{
                        endAdornment: isSearching ? (
                          <CircularProgress size={20} />
                        ) : (
                          <LocationOn sx={{ color: theme.palette.text.secondary }} />
                        )
                      }}
                    />

                    {/* Unified City Dropdown */}
                    {showCityDropdown && selectedCountry && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          zIndex: '99999 !important',
                          backgroundColor: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 2,
                          boxShadow: theme.shadows[8],
                          maxHeight: 400,
                          overflow: 'hidden',
                          mt: 0.5
                        }}
                      >
                        {/* Search Input inside Dropdown */}
                        <Box sx={{
                          p: 2,
                          borderBottom: `1px solid ${theme.palette.divider}`,
                          backgroundColor: theme.palette.background.paper
                        }}>
                          <TextField
                            fullWidth
                            size="small"
                            placeholder={currentLanguage === 'ar' ? 'ابحث عن مدينة...' : currentLanguage === 'fr' ? 'Rechercher une ville...' : 'Search for a city...'}
                            value={citySearchQuery}
                            onChange={handleCitySearchChange}
                            autoFocus
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                                '& fieldset': {
                                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
                                },
                                '&:hover': {
                                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                                },
                                '&:hover fieldset': {
                                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
                                },
                                '&.Mui-focused': {
                                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                                },
                                '&.Mui-focused fieldset': {
                                  borderColor: theme.custom.color.brandPrimary,
                                },
                              },
                              '& .MuiInputBase-input': {
                                color: theme.palette.text.primary,
                              }
                            }}
                            InputProps={{
                              startAdornment: isSearching ? (
                                <CircularProgress size={16} sx={{ marginInlineEnd: 1 }} />
                              ) : (
                                <LocationOn sx={{ color: theme.palette.text.secondary, marginInlineEnd: 1, fontSize: 20 }} />
                              )
                            }}
                          />
                        </Box>

                        {/* Cities List */}
                        <Box sx={{
                            maxHeight: 300,
                          overflow: 'auto',
                          backgroundColor: theme.palette.background.paper,
                          position: 'relative',
                          zIndex: 1
                        }}>
                          {/* Show search results if searching */}
                          {citySearchQuery.trim() && isSearching ? (
                            <Box sx={{
                              p: 3,
                              textAlign: 'center',
                              backgroundColor: theme.palette.background.paper,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 1
                            }}>
                              <CircularProgress size={16} />
                              <Typography variant="body2" color="text.secondary">
                                {currentLanguage === 'ar' ? 'جارٍ البحث...' : currentLanguage === 'fr' ? 'Recherche...' : 'Searching...'}
                              </Typography>
                            </Box>
                          ) : citySearchQuery.trim() && searchResults.length > 0 ? (
                            <>
                              <Box sx={{
                                p: 1,
                                backgroundColor: theme.palette.background.paper,
                                position: 'sticky',
                                top: 0,
                                zIndex: 2
                              }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                  {currentLanguage === 'ar' ? 'نتائج البحث' : currentLanguage === 'fr' ? 'Résultats de recherche' : 'Search Results'}
                                </Typography>
                              </Box>
                              {searchResults.map((city, index) => (
                                <Box
                                  key={city._id || city.code || city.id || index}
                                  onClick={() => handleCitySelect(city, setFieldValue)}
                                  sx={{
                                    p: 2,
                                    cursor: 'pointer',
                                    backgroundColor: theme.palette.background.paper,
                                    borderBottom: index < searchResults.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
                                    position: 'relative',
                                    zIndex: '999999 !important',
                                    '&:hover': {
                                      backgroundColor: theme.palette.action.hover,
                                      transform: 'translateX(4px)',
                                      transition: 'all 0.2s ease-in-out'
                                    },
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    transition: 'all 0.2s ease-in-out'
                                  }}
                                >
                                  <LocationOn fontSize="small" color="primary" sx={{ zIndex: '999999 !important', position: 'relative' }} />
                                  <Box sx={{ zIndex: '999999 !important', position: 'relative' }}>
                                    <Typography variant="body2" sx={{ 
                                      fontWeight: 500,
                                      zIndex: '999999 !important',
                                      position: 'relative'
                                    }}>
                                      {getCityDisplayName(city, currentLanguage)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{
                                      zIndex: '999999 !important',
                                      position: 'relative'
                                    }}>
                                      {city.labels?.ar && currentLanguage !== 'ar' && ` • ${city.labels.ar}`}
                                      {city.labels?.fr && currentLanguage !== 'fr' && ` • ${city.labels.fr}`}
                                      {city.labels?.en && currentLanguage !== 'en' && ` • ${city.labels.en}`}
                                    </Typography>
                                    <Typography variant="caption" sx={{
                                      display: 'block',
                                      fontWeight: 600,
                                      color: getCitySourceInfo(city.source).color,
                                      zIndex: '999999 !important',
                                      position: 'relative'
                                    }}>
                                      {sourceCaptionPrefix}: {getCitySourceInfo(city.source).label}
                                    </Typography>
                                  </Box>
                                </Box>
                              ))}
                            </>
                          ) : citySearchQuery.trim() && searchResults.length === 0 && !isSearching ? (
                            <Box sx={{
                              p: 3,
                              textAlign: 'center',
                              backgroundColor: theme.palette.background.paper,
                              position: 'relative',
                              zIndex: '999999 !important'
                            }}>
                              <Typography variant="body2" color="text.secondary">
                                {t('noCitiesFound') || 'No cities found'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                {currentLanguage === 'ar' ? 'أضف اسم المدينة الجديدة' : 
                                 currentLanguage === 'fr' ? 'Ajouter un nouveau nom de ville' : 
                                 'Add new city name'}
                              </Typography>
                            </Box>
                          ) : (
                            <>
                              {/* Show existing cities when not searching */}
                              {filteredCities.length > 0 ? (
                                filteredCities.map((city, index) => (
                                  <Box
                                    key={city.id || city._id}
                                    onClick={() => handleCitySelect(city, setFieldValue)}
                                    sx={{
                                      p: 2,
                                      cursor: 'pointer',
                                      backgroundColor: theme.palette.background.paper,
                                      borderBottom: index < filteredCities.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
                                      position: 'relative',
                                      zIndex: '999999 !important',
                                      '&:hover': {
                                        backgroundColor: theme.palette.action.hover,
                                        transform: 'translateX(4px)',
                                        transition: 'all 0.2s ease-in-out'
                                      },
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 1,
                                      transition: 'all 0.2s ease-in-out'
                                    }}
                                  >
                                    <LocationOn fontSize="small" color="primary" sx={{ zIndex: '999999 !important', position: 'relative' }} />
                                    <Box sx={{ zIndex: '999999 !important', position: 'relative' }}>
                                      <Typography variant="body2" sx={{ 
                                        fontWeight: 500,
                                        zIndex: '999999 !important',
                                        position: 'relative'
                                      }}>
                                        {getCityDisplayName(city, currentLanguage)}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary" sx={{
                                        zIndex: '999999 !important',
                                        position: 'relative'
                                      }}>
                                        {city.labels?.ar && currentLanguage !== 'ar' && ` • ${city.labels.ar}`}
                                        {city.labels?.fr && currentLanguage !== 'fr' && ` • ${city.labels.fr}`}
                                        {city.labels?.en && currentLanguage !== 'en' && ` • ${city.labels.en}`}
                                      </Typography>
                                      <Typography variant="caption" sx={{
                                        display: 'block',
                                        fontWeight: 600,
                                        color: getCitySourceInfo(city.source).color,
                                        zIndex: '999999 !important',
                                        position: 'relative'
                                      }}>
                                        {sourceCaptionPrefix}: {getCitySourceInfo(city.source).label}
                                      </Typography>
                        </Box>
                                  </Box>
                                ))
                              ) : (
                                <Box sx={{
                                  p: 3,
                                  textAlign: 'center',
                                  backgroundColor: theme.palette.background.paper,
                                  position: 'relative',
                                  zIndex: '999999 !important'
                                }}>
                                  <Typography variant="body2" color="text.secondary">
                                    {t('noCitiesAvailable') || 'No cities available'}
                                  </Typography>
                                </Box>
                              )}
                            </>
                          )}

                          {/* Add New City Option - Only show when search has no results */}
                          {citySearchQuery.trim().length > 0 && !isSearching && searchResults.length === 0 && (
                            <>
                              <Divider />
                              <Box
                                onClick={() => {
                                  setShowCityDropdown(false);
                                  setShowCustomCityInput(true);
                                }}
                                sx={{
                                  p: 2,
                                  cursor: 'pointer',
                                  color: theme.palette.text.primary,
                                  fontWeight: 600,
                                  backgroundColor: theme.palette.background.paper,
                                  border: `1px solid ${theme.palette.divider}`,
                                  margin: '6px 8px',
                                  borderRadius: 2,
                                  transition: 'all 0.2s ease-in-out',
                                  '&:hover': {
                                    backgroundColor: theme.palette.action.hover,
                                    color: theme.palette.text.primary,
                                    borderColor: theme.custom.color.brandPrimary,
                                    transform: 'translateY(-1px)',
                                    boxShadow: theme.shadows[4],
                                  }
                                }}
                              >
                                <Box display="flex" alignItems="center" gap={1}>
                                  <AddIcon fontSize="small" />
                                  {t('addNewCity') || 'Add New City'}
                                </Box>
                              </Box>
                            </>
                          )}
                        </Box>
                      </Box>
                    )}

                    {fieldErrors.city && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          mt: 1, 
                          display: 'block',
                          color: theme.palette.error.main,
                          fontWeight: 500
                        }}
                      >
                        {fieldErrors.city}
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Box>
                  <FormLabel 
                    htmlFor="exactLocation" 
                    sx={{ 
                      mb: 1, 
                      display: "block", 
                      fontWeight: 600, 
                      fontSize: '1.15rem',
                      color: theme.palette.text.primary
                    }}
                  >
                    {t('exactLocation')} *
                  </FormLabel>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      mb: 1, 
                      display: "block", 
                      fontSize: '1rem',
                      color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                      fontWeight: 500
                    }}
                  >
                    {getFoundLostType(values.foundLost) === 'LOST'
                      ? currentLanguage === 'ar' 
                        ? 'يرجى تحديد الموقع الدقيق والتفصيلي حيث فقدت العنصر (مثال: حي النور، شارع الملك، بجانب المسجد، أو أي معلم مميز)'
                        : currentLanguage === 'fr'
                          ? 'Veuillez spécifier l\'emplacement exact et détaillé où vous avez perdu l\'objet (ex: Quartier Al-Nour, Rue du Roi, près de la mosquée, ou tout point de repère distinctif)'
                          : 'Please specify the precise and detailed location where you lost the item (e.g., Al-Nour District, King Street, near the mosque, or any distinctive landmark)'
                      : currentLanguage === 'ar' 
                        ? 'يرجى تحديد الموقع الدقيق والتفصيلي حيث وجدت العنصر (مثال: حي النور، شارع الملك، بجانب المسجد، أو أي معلم مميز)'
                        : currentLanguage === 'fr'
                          ? 'Veuillez spécifier l\'emplacement exact et détaillé où vous avez trouvé l\'objet (ex: Quartier Al-Nour, Rue du Roi, près de la mosquée, ou tout point de repère distinctif)'
                          : 'Please specify the precise and detailed location where you found the item (e.g., Al-Nour District, King Street, near the mosque, or any distinctive landmark)'
                    }
                  </Typography>
                  <Textfield 
                    name="exactLocation" 
                    variant="outlined" 
                    multiline
                    rows={4}
                    placeholder={t('exactLocationPlaceholder')}
                    data-testid="exactLocation"
                    error={!!fieldErrors.exactLocation}
                    helperText={fieldErrors.exactLocation}
                    onErrorClear={clearFieldError}
                  />
                </Box>

                <Box>
                  <FormLabel 
                    htmlFor="exactDate" 
                    sx={{ 
                      mb: 1, 
                      display: "block", 
                      fontWeight: 600, 
                      fontSize: '1.15rem',
                      color: theme.palette.text.primary
                    }}
                  >
                    {getFoundLostType(values.foundLost) === 'LOST' 
                      ? t('exactDateLost') 
                      : t('exactDateFound')
                    } ({t('optional')})
                  </FormLabel>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      mb: 1, 
                      display: "block", 
                      fontSize: '1rem',
                      color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                      fontWeight: 500
                    }}
                  >
                    {getFoundLostType(values.foundLost) === 'LOST' 
                      ? t('exactDateLostPlaceholderOptional') 
                      : t('exactDateFoundPlaceholderOptional')
                    }
                  </Typography>
                  <Textfield 
                    name="exactDate" 
                    variant="outlined" 
                    placeholder={`${t('exactDatePlaceholder')} ${new Date().toLocaleDateString()})`}
                    data-testid="exactDate"
                  />
                </Box>

                {/* Item Details Section */}
                <Typography 
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: theme.custom.color.brandPrimary,
                    fontSize: '1.4rem',
                    mb: 1
                  }}
                >
                  {t('itemDetails')}
                </Typography>

                <Box>
                  <FormLabel 
                    htmlFor="description" 
                    sx={{ 
                      mb: 1, 
                      display: "block", 
                      fontWeight: 600, 
                      fontSize: '1.15rem',
                      color: theme.palette.text.primary
                    }}
                  >
                    {t('description')} ({t('optional')})
                  </FormLabel>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      mb: 1, 
                      display: "block", 
                      fontSize: '1rem',
                      color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                      fontWeight: 500
                    }}
                  >
                    {getFoundLostType(values.foundLost) === 'LOST' 
                      ? (t('descriptionOptionalLostMessage') || "Description is optional but recommended when you don't have an image of the lost item.")
                      : (t('descriptionOptionalFoundMessage') || "Description is optional. You can add an image instead, or provide both for better identification.")
                    }
                  </Typography>
                  
                  {/* Sensitive Information Warning - Only show for Found items */}
                  {getFoundLostType(values.foundLost) === 'FOUND' && (
                    <Alert 
                      severity="warning" 
                      sx={{ 
                        mb: 2,
                        borderRadius: 2,
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? 'rgba(255, 152, 0, 0.1)' 
                          : 'rgba(255, 152, 0, 0.05)',
                        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.3)' : 'rgba(255, 152, 0, 0.2)'}`,
                        '& .MuiAlert-icon': {
                          color: theme.palette.mode === 'dark' ? '#ff9800' : '#f57c00',
                        },
                        '& .MuiAlert-message': {
                          color: theme.palette.text.primary,
                          fontSize: '0.9rem',
                          fontWeight: 500,
                        }
                      }}
                    >
                      {t('descriptionSensitiveInfoWarning')}
                    </Alert>
                  )}
                  
                  <Textfield 
                    name="description" 
                    variant="outlined" 
                    multiline 
                    rows={4}
                    placeholder={getFoundLostType(values.foundLost) === 'LOST' 
                      ? t('descriptionPlaceholderLost') 
                      : t('descriptionPlaceholderFound')
                    }
                    data-testid="description"
                  />
                </Box>

                {/* Contact Information Section */}
                <Typography 
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: theme.custom.color.brandPrimary,
                    fontSize: '1.4rem',
                    mb: 1
                  }}
                >
                  {t('contactInformation')}
                </Typography>

                <Box>
                  <FormLabel 
                    htmlFor="contact" 
                    sx={{ 
                      mb: 1, 
                      display: "block", 
                      fontWeight: 600, 
                      fontSize: '1.15rem',
                      color: theme.palette.text.primary
                    }}
                  >
                    {t('phoneNumber')} *
                  </FormLabel>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      mb: 1, 
                      display: "block", 
                      fontSize: '1rem',
                      color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                      fontWeight: 500
                    }}
                  >
                    {getFoundLostType(values.foundLost) === 'LOST'
                      ? currentLanguage === 'ar' 
                        ? 'سنقوم بالتواصل معك عبر هذا الرقم في حالة العثور على عنصرك المفقود من قبل شخص آخر'
                        : currentLanguage === 'fr'
                          ? 'Nous vous contacterons via ce numéro si quelqu\'un trouve votre objet perdu'
                          : 'We will contact you through this number if someone finds your lost item'
                      : currentLanguage === 'ar' 
                        ? 'سنقوم بالتواصل معك عبر هذا الرقم في حالة تواصل مالك العنصر معنا'
                        : currentLanguage === 'fr'
                          ? 'Nous vous contacterons via ce numéro si le propriétaire de l\'objet nous contacte'
                          : 'We will contact you through this number if the item owner contacts us'
                    }
                  </Typography>
                  <Textfield 
                    name="contact" 
                    variant="outlined" 
                    data-testid="contact"
                    error={!!fieldErrors.contact}
                    helperText={fieldErrors.contact}
                    onErrorClear={clearFieldError}
                  />
                </Box>

                {/* Image Section */}
                <Typography 
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: theme.custom.color.brandPrimary,
                    fontSize: '1.4rem',
                    mb: 1
                  }}
                >
                  {t('itemImage')}
                </Typography>

                <Box>
                  <FormLabel 
                    htmlFor="image" 
                    sx={{ 
                      mb: 1, 
                      display: "block", 
                      fontWeight: 600, 
                      fontSize: '1.15rem',
                      color: theme.palette.text.primary
                    }}
                  >
                    {t('itemImage')} ({t('optional')})
                  </FormLabel>
                  
                  {/* Current Image Display */}
                  {getCurrentImageUrl() && (
                    <Box sx={{ mb: 3 }}>
                      <Card
                        sx={{
                          maxWidth: 400,
                          borderRadius: 3,
                          overflow: 'hidden',
                          boxShadow: theme.shadows[4],
                          border: `2px solid ${alpha(theme.custom.color.ink, 0.1)}`,
                          transition: 'all 0.3s ease-in-out',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: theme.shadows[8],
                          }
                        }}
                      >
                        <CardMedia
                          component="img"
                          height="200"
                          image={getCurrentImageUrl()}
                          alt="Current item image"
                          sx={{
                            objectFit: 'cover',
                            cursor: 'pointer'
                          }}
                          onClick={handleImageDialogOpen}
                        />
                        <CardActions sx={{
                          justifyContent: 'space-between',
                          p: 2,
                          backgroundColor: alpha(theme.custom.color.ink, 0.02)
                        }}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Chip
                              icon={<PhotoCamera />}
                              label={imagePreview ? t('newImage') : t('currentImage')}
                              size="small"
                              variant="outlined"
                              sx={{
                                color: theme.palette.text.primary,
                                borderColor: theme.palette.divider,
                                backgroundColor: alpha(theme.custom.color.ink, 0.05)
                              }}
                            />
                            {compressionInfo && (
                              <Chip
                                label={`${compressionInfo.compressedSize}MB`}
                                size="small"
                                variant="outlined"
                                sx={{
                                  color: theme.palette.success.main,
                                  borderColor: theme.palette.success.main,
                                  backgroundColor: alpha(theme.palette.success.main, 0.08)
                                }}
                              />
                            )}
                          </Box>
                          <Box display="flex" gap={1}>
                            <IconButton
                              size="small"
                              onClick={handleImageDialogOpen}
                              sx={{
                                color: theme.custom.color.brandPrimary,
                                '&:hover': {
                                  backgroundColor: alpha(theme.custom.color.brandPrimary, 0.12)
                                }
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={handleImageRemove}
                              sx={{
                                color: theme.palette.error.main,
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.error.main, 0.12)
                                }
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </CardActions>
                      </Card>
                    </Box>
                  )}

                  {/* Image Upload Controls */}
                  <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                    <Button
                      variant="contained"
                      onClick={handleImageButtonClick}
                      startIcon={isCompressing ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <CloudUploadIcon sx={{ color: 'white' }} />}
                      disabled={isCompressing}
                      sx={{
                        textTransform: 'none',
                        borderRadius: 2,
                        px: 3,
                        py: 1.5,
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: `${theme.palette.getContrastText(theme.custom.color.brandPrimary)} !important`,
                        background: `linear-gradient(45deg, ${theme.custom.color.brandPrimary} 30%, ${lighten(theme.custom.color.brandPrimary, 0.15)} 90%)`,
                        '&:hover': {
                          background: `linear-gradient(45deg, ${lighten(theme.custom.color.brandPrimary, 0.08)} 30%, ${lighten(theme.custom.color.brandPrimary, 0.25)} 90%)`,
                          transform: 'translateY(-1px)',
                          boxShadow: `0 6px 16px ${alpha(theme.custom.color.brandPrimary, 0.3)}`,
                        },
                        '&:disabled': {
                          background: alpha(theme.custom.color.brandPrimary, 0.3),
                          color: 'rgba(255,255,255,0.5)',
                        },
                        transition: 'all 0.2s ease-in-out',
                        boxShadow: `0 3px 8px ${alpha(theme.custom.color.brandPrimary, 0.2)}`,
                      }}
                    >
                      {isCompressing ? t('compressingImage') : getCurrentImageUrl() ? t('replaceImage') : t('chooseFile')}
                    </Button>
                    <input
                      ref={fileInputRef}
                      id="image"
                      name="image"
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={handleImageSelect}
                    />
                    
                    {selectedFileName && (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)',
                          fontWeight: 500
                        }}
                      >
                        {selectedFileName}
                      </Typography>
                    )}
                  </Box>
                  
                  {compressionInfo && (
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        mt: 1,
                        color: theme.custom.color.brandPrimary,
                        fontWeight: 500
                      }}
                    >
                      {t('compressionSuccess')}
                    </Typography>
                  )}
                  
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      mt: 1, 
                      display: "block", 
                      fontSize: '1rem',
                      color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                      fontWeight: 500
                    }}
                  >
                    {t('imageOptionalMessage')}
                  </Typography>
                </Box>


                {/* Status Section - Only visible for admin */}
                {role === 'admin' && (
                  <>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        color: theme.custom.color.brandPrimary,
                        fontSize: '1.4rem',
                        mb: 1
                      }}
                    >
                      {t('status')}
                    </Typography>

                    <Box>
                      <FormLabel 
                        htmlFor="status" 
                        sx={{ 
                          mb: 1, 
                          display: "block", 
                          fontWeight: 600, 
                          fontSize: '1.15rem',
                          color: theme.palette.text.primary
                        }}
                      >
                        {t('postStatus')}
                      </FormLabel>
                      <FormControl fullWidth>
                        <Select
                          name="status"
                          value={values.status}
                          onChange={(e) => setFieldValue('status', e.target.value)}
                          variant="outlined"
                          sx={{
                            borderRadius: 3,
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: theme.custom.color.brandPrimary,
                            },
                            color: theme.palette.text.primary,
                            fontWeight: 500
                          }}
                        >
                          <MenuItem value="active">{t('active')}</MenuItem>
                          <MenuItem value="resolved">{t('resolved')}</MenuItem>
                          <MenuItem value="expired">{t('expired')}</MenuItem>
                          <MenuItem value="suspended">{t('suspended')}</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  </>
                )}


                {/* Action Buttons */}
                <Box 
                  display="grid"
                  gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr 1fr" }}
                  gap={2} 
                  justifyContent="center" 
                  alignItems="center"
                  sx={{ mt: 4 }}
                >
                  {/* Cancel Button - Left in LTR, Right in RTL */}
                  <Button
                    onClick={() => navigate(`/dash/posts/${post._id}`)}
                    variant="outlined"
                    disabled={isLoading}
                    sx={{
                      width: { xs: "90%", sm: "100%" },
                      justifySelf: { xs: "center", sm: "stretch" },
                      py: 1.5,
                      px: 3,
                      fontSize: '1rem',
                      fontWeight: 600,
                      borderRadius: 2,
                      textTransform: 'none',
                    }}
                  >
                    {t('cancel')}
                  </Button>

                  {/* Delete Button - Center */}
                  <Button
                    onClick={handleDeletePost}
                    variant="outlined"
                    disabled={isLoading}
                    sx={{
                      width: { xs: "90%", sm: "100%" },
                      justifySelf: { xs: "center", sm: "stretch" },
                      py: 1.5,
                      px: 3,
                      fontSize: '1rem',
                      fontWeight: 600,
                      borderRadius: 2,
                      textTransform: 'none',
                      borderColor: theme.palette.error.main,
                      color: theme.palette.error.main,
                      '&:hover': {
                        borderColor: theme.palette.error.dark,
                        backgroundColor: alpha(theme.palette.error.main, 0.08),
                      },
                      '&:disabled': {
                        borderColor: alpha(theme.palette.error.main, 0.3),
                        color: alpha(theme.palette.error.main, 0.5),
                      },
                      transition: 'all 0.2s ease-in-out',
                    }}
                  >
                    {t('deletePost')}
                  </Button>

                  {/* Update Button - Right in LTR, Left in RTL */}
                  <Button
                    type="submit"
                    disabled={isSubmitting || !selectedCountry || !values.city || !hasFormChanged}
                    sx={{
                      width: { xs: "90%", sm: "100%" },
                      justifySelf: { xs: "center", sm: "stretch" },
                      py: 1.5,
                      px: 3,
                      fontSize: '1rem',
                      fontWeight: 600,
                      borderRadius: 2,
                      textTransform: 'none',
                      background: hasFormChanged
                        ? `linear-gradient(45deg, ${theme.custom.color.brandPrimary} 30%, ${lighten(theme.custom.color.brandPrimary, 0.15)} 90%)`
                        : alpha(theme.custom.color.brandPrimary, 0.3),
                      color: `${theme.palette.getContrastText(theme.custom.color.brandPrimary)} !important`,
                      boxShadow: hasFormChanged ? `0 4px 15px ${alpha(theme.custom.color.brandPrimary, 0.3)}` : 'none',
                      '&:hover': hasFormChanged ? {
                        background: `linear-gradient(45deg, ${lighten(theme.custom.color.brandPrimary, 0.08)} 30%, ${lighten(theme.custom.color.brandPrimary, 0.25)} 90%)`,
                        boxShadow: `0 6px 20px ${alpha(theme.custom.color.brandPrimary, 0.4)}`,
                        transform: 'translateY(-1px)',
                      } : {},
                      '&:disabled': {
                        background: alpha(theme.custom.color.brandPrimary, 0.3),
                        color: `${alpha(theme.palette.getContrastText(theme.custom.color.brandPrimary), theme.palette.mode === 'dark' ? 0.5 : 0.7)} !important`,
                      },
                      transition: 'all 0.2s ease-in-out',
                    }}
                  >
                    {isSubmitting ? <CircularProgress size={24} color="inherit" /> : t('updatePost')}
                  </Button>
                </Box>
              </Box>

            <Dialog
              open={showImageWarningDialog}
              onClose={handleImageWarningClose}
              maxWidth="sm"
              fullWidth
              PaperProps={{
                sx: {
                  borderRadius: 3,
                  boxShadow: theme.shadows[12],
                  backgroundColor: theme.custom.color.surfaceRaised,
                  backgroundImage: 'none'
                }
              }}
              BackdropProps={{
                sx: {
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(0,0,0,0.7)'
                    : 'rgba(0,0,0,0.45)'
                }
              }}
            >
              <DialogTitle
                sx={{
                  px: { xs: 2.5, sm: 3 },
                  pt: { xs: 2, sm: 3 },
                  pb: { xs: 1.5, sm: 2 }
                }}
              >
                <Box display="flex" alignItems="center" gap={1.5}>
                  <WarningAmberIcon
                    color="warning"
                    sx={{
                      fontSize: 30,
                      flexShrink: 0
                    }}
                  />
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: theme.palette.text.primary,
                      fontSize: { xs: '1.05rem', sm: '1.2rem' }
                    }}
                  >
                    {t('imageWarningTitle')}
                  </Typography>
                </Box>
              </DialogTitle>
              <DialogContent
                sx={{
                  px: { xs: 2.5, sm: 3 },
                  pb: { xs: 2, sm: 3 }
                }}
              >
                {getFoundLostType(values.foundLost) === 'FOUND' ? (
                  <>
                    <Typography
                      variant="body1"
                      sx={{
                        color: theme.palette.text.primary,
                        mb: 2,
                        lineHeight: 1.6,
                        fontSize: { xs: '0.95rem', sm: '1rem' }
                      }}
                    >
                      {t('imageWarningDescriptionFound')}
                    </Typography>
                    <Box
                      component="ul"
                      sx={{
                        paddingInlineStart: 2.5,
                        m: 0,
                        display: 'grid',
                        gap: 1.25,
                        color: theme.palette.text.secondary
                      }}
                    >
                      <Typography component="li" variant="body2" sx={{ lineHeight: 1.6 }}>
                        {t('imageWarningBulletProtectDetails')}
                      </Typography>
                      <Typography component="li" variant="body2" sx={{ lineHeight: 1.6 }}>
                        {t('imageWarningBulletUseNeutralBackground')}
                      </Typography>
                    </Box>
                  </>
                ) : (
                  <Typography
                    variant="body1"
                    sx={{
                      color: theme.palette.text.primary,
                      lineHeight: 1.6,
                      fontSize: { xs: '0.95rem', sm: '1rem' }
                    }}
                  >
                    {t('imageWarningDescriptionLost')}
                  </Typography>
                )}
              </DialogContent>
              <DialogActions
                sx={{
                  px: { xs: 2.5, sm: 3 },
                  pb: { xs: 2.5, sm: 3 },
                  pt: 0,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1
                }}
              >
                <Button
                  variant="outlined"
                  onClick={handleImageWarningClose}
                  sx={{
                    textTransform: 'none',
                    borderRadius: 2,
                    px: 3,
                    fontWeight: 600,
                  }}
                >
                  {t('cancel')}
                </Button>
                <Button
                  variant="contained"
                  onClick={handleImageWarningProceed}
                  disabled={proceedCountdown > 0}
                  sx={{
                    textTransform: 'none',
                    borderRadius: 2,
                    px: 3,
                    fontWeight: 700,
                    backgroundColor: theme.custom.color.brandPrimary,
                    color: `${theme.palette.getContrastText(theme.custom.color.brandPrimary)} !important`,
                    '&:hover': { backgroundColor: theme.custom.color.brandPrimary },
                    '&:disabled': {
                      backgroundColor: alpha(theme.custom.color.brandPrimary, 0.3),
                      color: 'rgba(255,255,255,0.7)',
                    },
                  }}
                >
                  {proceedCountdown > 0
                    ? `${t('imageWarningProceed')} (${proceedCountdown})`
                    : t('imageWarningProceed')}
                </Button>
              </DialogActions>
            </Dialog>
            </Form>
            );
          }}
        </Formik>
      </Paper>
      
      {/* Image Preview Dialog */}
      <Dialog
        open={showImageDialog}
        onClose={handleImageDialogClose}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 3,
            backgroundColor: theme.custom.color.surfaceRaised,
            boxShadow: theme.shadows[12],
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 1
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
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
          {getCurrentImageUrl() && (
            <Box sx={{ 
              position: 'relative',
              width: '100%',
              height: 'auto',
              maxHeight: '70vh',
              overflow: 'hidden'
            }}>
              <img
                src={getCurrentImageUrl()}
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
          {getCurrentImageUrl() && (
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
                },
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
              if (customCityName.trim() && selectedCountry?._id) {
                setIsCreatingCity(true);
                try {
                  // Create the custom city in the backend
                  const createdCity = await createCustomCity(customCityName.trim(), selectedCountry._id);
                  
                  // Close the dialog first
                  setShowCustomCityInput(false);
                  setCustomCityName("");
                  
                  // Refresh the cities list to get the newly created city
                  await fetchCitiesByCountry(selectedCountry._id);
                  
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
            disabled={!customCityName.trim() || !selectedCountry?._id || isCreatingCity}
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
    </Box>
  );
};

export default EditPostForm;