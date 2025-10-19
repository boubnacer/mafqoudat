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
  Chip
} from "@mui/material";
import { 
  LocationOn, 
  Add as AddIcon, 
  Close as CloseIcon, 
  PhotoCamera, 
  Delete as DeleteIcon,
  Edit as EditIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import { useTranslation } from "../../../utils/translations";
import useAuth from "../../../hooks/useAuth";
import { getOptimizedImageUrl } from "../../../utils/cloudinaryUtils";

// CSS keyframes for loading animations will be injected in useEffect

const EditPostForm = ({ post, user, countries, flOptions, categories }) => {
  const [updatePost, { isLoading, isSuccess, isError, error }] = useUpdatePostMutation();
  const [deletePost, { isSuccess: isDelSuccess, isError: isDelError, error: delerror }] = useDeletePostMutation();
  const { t, currentLanguage } = useTranslation();
  const { role } = useAuth();
  const token = useSelector(selectCurrentToken);
  const navigate = useNavigate();
  const theme = useTheme();
  
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

  // New state for unified city dropdown (from NewPostForm)
  const [citySearchQuery, setCitySearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [selectedCityFromSearch, setSelectedCityFromSearch] = useState(null);
  const [filteredCities, setFilteredCities] = useState([]);
  const [showCustomCityInput, setShowCustomCityInput] = useState(false);
  const [customCityName, setCustomCityName] = useState("");
  const [isCreatingCity, setIsCreatingCity] = useState(false);

  // Image management state
  const [selectedImage, setSelectedImage] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [showImageDialog, setShowImageDialog] = useState(false);

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
          city.label?.toLowerCase().includes(citySearchQuery.toLowerCase()) ||
          city.name?.toLowerCase().includes(citySearchQuery.toLowerCase()) ||
          city.labels?.en?.toLowerCase().includes(citySearchQuery.toLowerCase()) ||
          city.labels?.ar?.toLowerCase().includes(citySearchQuery.toLowerCase()) ||
          city.labels?.fr?.toLowerCase().includes(citySearchQuery.toLowerCase())
        );
        setFilteredCities(filtered);
      } else {
        setFilteredCities(availableCities);
      }
    }
  }, [availableCities, citySearchQuery]);

  // Define fetchCitiesByCountry function FIRST, before any useEffect that uses it
  const fetchCitiesByCountry = useCallback(async (countryId) => {
    try {
      setLoadingCities(true);
      const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:3500";
      const url = `${baseUrl}/cities-public?countryId=${countryId}&language=${currentLanguage || 'en'}`;
      
      const response = await fetch(url);
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
  }, [currentLanguage]);

  // New function to search cities using hybrid search (from NewPostForm)
  const searchCitiesHybrid = useCallback(async (searchQuery, countryCode) => {
    try {
      if (!searchQuery || searchQuery.length < 2) {
        return [];
      }

      const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:3500";
      const url = `${baseUrl}/cities/search?q=${encodeURIComponent(searchQuery)}&language=${currentLanguage || 'en'}&countryCode=${countryCode}&limit=10`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      }
      return [];
    } catch (error) {
      console.error('City search error:', error.message);
      return [];
    }
  }, [currentLanguage]);

  // Traditional city search function (fallback)
  const searchCitiesTraditional = useCallback(async (searchQuery, countryId) => {
    try {
      const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:3500";
      const url = `${baseUrl}/cities/search-name?query=${encodeURIComponent(searchQuery)}&countryId=${countryId}&limit=10`;
      
      const response = await fetch(url);
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

  // Set city search query when post and cities are available
  useEffect(() => {
    if (post?.city) {
      // Handle both database cities (object) and API cities (string)
      if (typeof post.city === 'object' && post.city.id) {
        // Database city object - use cityName or cityLabels for display
        if (post.cityName) {
          setCitySearchQuery(post.cityName);
        } else if (post.cityLabels && post.cityLabels[currentLanguage]) {
          setCitySearchQuery(post.cityLabels[currentLanguage]);
        } else if (availableCities.length > 0) {
          const existingCity = availableCities.find(city => 
            city.id === post.city.id || city._id === post.city.id
          );
          
          if (existingCity) {
            setCitySearchQuery(existingCity.label || existingCity.name || '');
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
            setCitySearchQuery(existingCity.label || existingCity.name || '');
          } else {
            // It's an API city (string like "EL_JADIDA")
            // Use cityLabels for proper translation, then cityName, then city string
            if (post.cityLabels && post.cityLabels[currentLanguage]) {
              setCitySearchQuery(post.cityLabels[currentLanguage]);
            } else {
              setCitySearchQuery(post.cityName || post.city);
            }
          }
        } else {
          // No available cities yet, but we have a string city - likely API city
          // Use cityLabels for proper translation, then cityName, then city string
          if (post.cityLabels && post.cityLabels[currentLanguage]) {
            setCitySearchQuery(post.cityLabels[currentLanguage]);
          } else {
            setCitySearchQuery(post.cityName || post.city);
          }
        }
      }
    }
  }, [post?.city, post?.cityName, post?.cityLabels, availableCities, currentLanguage]);

  // Initialize selected country from post data
  useEffect(() => {
    if (post?.country && countries) {
      const country = countries.find(c => c._id === post.country);
      if (country) {
        setSelectedCountry(country);
      }
    }
  }, [post?.country, countries]);

  // Initialize cities when post data is available
  useEffect(() => {
    if (post?.country && !selectedCountry) {
      const country = countries?.find(c => c._id === post.country);
      if (country) {
        setSelectedCountry(country);
        fetchCitiesByCountry(post.country);
      }
    }
  }, [post?.country, countries, selectedCountry, fetchCitiesByCountry]);

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

  // Update cities when country changes
  useEffect(() => {
    if (selectedCountry) {
      fetchCitiesByCountry(selectedCountry._id);
    }
  }, [selectedCountry, fetchCitiesByCountry]);

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
          city.label?.toLowerCase().includes(citySearchQuery.toLowerCase()) ||
          city.name?.toLowerCase().includes(citySearchQuery.toLowerCase()) ||
          city.labels?.en?.toLowerCase().includes(citySearchQuery.toLowerCase()) ||
          city.labels?.ar?.toLowerCase().includes(citySearchQuery.toLowerCase()) ||
          city.labels?.fr?.toLowerCase().includes(citySearchQuery.toLowerCase())
        );
        setFilteredCities(filtered);
      } else {
        setFilteredCities(availableCities);
      }
    }
  }, [availableCities, citySearchQuery]);

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

  // Handle city search input change (from NewPostForm)
  const handleCitySearchChange = useCallback(async (event) => {
    const query = event.target.value;
    setCitySearchQuery(query);
    
    // Always show dropdown when there's a query
    if (query.trim().length > 0) {
      setShowCityDropdown(true);
    }
    
    // Get country code from selectedCountry object
    const countryCode = selectedCountry?.code || selectedCountry?.labels?.en || selectedCountry?.names?.en;
    
    if (query.length >= 2 && selectedCountry?._id) {
      setIsSearching(true);
      try {
        // Try hybrid search first
        const results = await searchCitiesHybrid(query, countryCode);
        
        if (results.length > 0) {
          setSearchResults(results);
        } else {
          // Fallback to traditional search
          const fallbackResults = await searchCitiesTraditional(query, selectedCountry._id);
          
          if (fallbackResults.length > 0) {
            setSearchResults(fallbackResults);
          } else {
            // Final fallback: filter existing cities
            const localResults = availableCities.filter(city => 
              city.label?.toLowerCase().includes(query.toLowerCase()) ||
              city.name?.toLowerCase().includes(query.toLowerCase())
            ).map(city => ({
              ...city,
              source: 'database',
              _id: city.id || city._id
            }));
            
            setSearchResults(localResults);
          }
        }
      } catch (error) {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    } else if (query.length > 0) {
      // Show local filtered results for shorter queries
      const localResults = availableCities.filter(city => 
        city.label?.toLowerCase().includes(query.toLowerCase()) ||
        city.name?.toLowerCase().includes(query.toLowerCase())
      ).map(city => ({
        ...city,
        source: 'database',
        _id: city.id || city._id
      }));
      setSearchResults(localResults);
    } else {
      setSearchResults([]);
    }
  }, [searchCitiesHybrid, searchCitiesTraditional, selectedCountry, availableCities, currentLanguage]);

  // Handle city selection from dropdown (from NewPostForm)
  const handleCitySelect = (city, setFieldValue) => {
    setSelectedCityFromSearch(city);
    setCitySearchQuery(city.label || city.labels?.en || city.name || '');
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
    setShowCityDropdown(!showCityDropdown);
    // If opening dropdown and there's a search query, ensure results are shown
    if (!showCityDropdown && citySearchQuery.trim().length > 0) {
      // Trigger search again to ensure results are displayed
      const event = { target: { value: citySearchQuery } };
      handleCitySearchChange(event);
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

  // Get city display name for selected city
  const getCityDisplayName = (cityId) => {
    if (!cityId) return '';
    const city = availableCities.find(c => c.id === cityId);
    return city ? (city.label || city.name || 'Unknown City') : cityId;
  };

  // Debug: Log city field differences

  // Initialize form state with existing post data
  const initialFormState = useMemo(() => {
    if (!post) return {};
    
    return {
    country: post?.country || "",
    contact: post?.contact || "",
    category: (() => {
      // Try to find the category by matching the categoryname with the categories array
      let categoryValue = "";
      
      if (post?.categoryname && categories) {
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
      if (!values.category) {
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
      const postData = {
        user: post.user, // Use the original post's user ID to avoid validation issues
        country: selectedCountry?._id || values.country,
        category: values.category,
        foundLost: values.foundLost,
        exactLocation: values.exactLocation,
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
        // Create FormData for image upload
        const formData = new FormData();
        const postDataWithId = { id: post._id, ...postData };
        // console.log('🔍 UPDATE POST - Sending FormData with postData:', postDataWithId);
        // console.log('🔍 UPDATE POST - Image file:', selectedImage);
        formData.append("postData", JSON.stringify(postDataWithId));
        formData.append("image", selectedImage);
        
        // Use fetch directly for FormData
        const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:3500";
        const response = await fetch(`${baseUrl}/posts`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        
        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
          } catch (e) {
            errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
          }
          // console.error('❌ UPDATE POST - Server error response:', errorData);
          throw new Error(errorData.message || 'Update failed');
        }
        
        result = { data: await response.text() };
        
        // Manually trigger success flow for FormData requests - show immediately
        setSuccessMessage(t('postUpdatedSuccessfully') || 'Post updated successfully! Your changes have been saved.');
        setShowSuccessMessage(true);
        setTimeout(() => {
          setShowSuccessMessage(false);
          navigate("/dash");
        }, 2000);
      } else {
        // Use regular JSON for non-image updates
        result = await updatePost({ id: post._id, ...postData }).unwrap();
      }
      // console.log('✅ UPDATE POST - API call successful:', result);
    } catch (error) {
      console.error('❌ UPDATE POST - Update failed:', error);
      console.error('❌ UPDATE POST - Error status:', error?.status);
      console.error('❌ UPDATE POST - Error data:', error?.data);
      console.error('❌ UPDATE POST - Error message:', error?.data?.message);
      console.error('❌ UPDATE POST - Error details:', error?.data?.errors);
      if (error?.data?.errors && error.data.errors.length > 0) {
        console.error('❌ UPDATE POST - First error:', error.data.errors[0]);
        console.error('❌ UPDATE POST - Error field:', error.data.errors[0]?.field);
        console.error('❌ UPDATE POST - Error message:', error.data.errors[0]?.message);
      }
      setStatus({
        type: 'error',
        message: error?.data?.message || t('updateFailed')
      });
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
              src="/maflogo.png"
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
        background: theme.palette.background.default,
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
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 8px 32px rgba(76, 175, 80, 0.3)'
                  : '0 8px 32px rgba(76, 175, 80, 0.2)',
                border: `2px solid ${theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.3)' : 'rgba(76, 175, 80, 0.2)'}`,
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(76, 175, 80, 0.2)'
                  : 'rgba(76, 175, 80, 0.15)',
                backdropFilter: 'blur(10px)',
                '& .MuiAlert-icon': {
                  fontSize: '1.5rem',
                  color: theme.palette.mode === 'dark' ? '#4CAF50' : '#2E7D32',
                },
                '& .MuiAlert-message': {
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: theme.palette.mode === 'dark' ? '#4CAF50' : '#2E7D32',
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
                    backgroundColor: theme.palette.mode === 'dark' ? '#4CAF50' : '#2E7D32',
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
            // Store setFieldValue function for use in custom city creation
            setSetFieldValueCallback(() => setFieldValue);
            
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
                      ? theme.palette.mode === 'dark' 
                        ? 'rgba(76, 175, 80, 0.1)' 
                        : 'rgba(76, 175, 80, 0.05)'
                      : theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.02)' 
                        : 'rgba(0, 0, 0, 0.02)',
                    transition: 'all 0.3s ease-in-out',
                    cursor: 'pointer',
                    '&:hover': {
                      borderColor: values.returned ? theme.palette.success.dark : theme.palette.primary.main,
                      backgroundColor: values.returned 
                        ? theme.palette.mode === 'dark' 
                          ? 'rgba(76, 175, 80, 0.15)' 
                          : 'rgba(76, 175, 80, 0.08)'
                        : theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.04)' 
                          : 'rgba(0, 0, 0, 0.04)',
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
                    color: theme.palette.mode === 'dark' ? '#4CAF50' : '#2E7D32',
                    fontSize: '1.4rem',
                    mb: 1,
                    textShadow: theme.palette.mode === 'dark' ? '0 1px 2px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,0.1)'
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
                          borderColor: theme.palette.mode === 'dark' ? '#4CAF50' : '#2E7D32',
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
                                style={{ marginRight: 8 }}
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
                          color: theme.palette.mode === 'dark' ? '#f44336' : '#d32f2f',
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
                    htmlFor="category" 
                    sx={{ 
                      mb: 1, 
                      display: "block", 
                      fontWeight: 600, 
                      fontSize: '1.15rem',
                      color: theme.palette.text.primary
                    }}
                  >
                    {t('category')} *
                  </FormLabel>
                  <SelectOption 
                    name="category" 
                    options={categories} 
                    data-testid="category"
                    error={!!fieldErrors.category}
                    helperText={fieldErrors.category}
                    onErrorClear={clearFieldError}
                  />
                </Box>

                {/* Location Section */}
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 700, 
                    color: theme.palette.mode === 'dark' ? '#4CAF50' : '#2E7D32',
                    fontSize: '1.4rem',
                    mb: 1,
                    textShadow: theme.palette.mode === 'dark' ? '0 1px 2px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,0.1)'
                  }}
                >
                  {t('location')}
                </Typography>

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
                          color: theme.palette.mode === 'dark' ? '#ff9800' : '#f57c00',
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
                    {/* City Search Input */}
                    <TextField
                      fullWidth
                      placeholder={currentLanguage === 'ar' ? 'ابحث أو اختر مدينة...' : currentLanguage === 'fr' ? 'Rechercher ou sélectionner une ville...' : 'Search or select a city...'}
                      value={citySearchQuery}
                      onChange={handleCitySearchChange}
                      disabled={!selectedCountry}
                      data-testid="city-search"
                      onClick={handleCityDropdownToggle}
                      sx={{
                        borderRadius: 2,
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': {
                          borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
                        },
                          '&.Mui-focused fieldset': {
                          borderColor: theme.palette.mode === 'dark' ? '#4CAF50' : '#2E7D32',
                        },
                          '& fieldset': {
                            borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
                        },
                        color: theme.palette.text.primary,
                          fontWeight: 500,
                          cursor: 'pointer'
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
                        {/* Cities List */}
                        <Box sx={{ 
                            maxHeight: 300,
                          overflow: 'auto',
                          backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#ffffff',
                          position: 'relative',
                          zIndex: 1
                        }}>
                          {/* Show search results if searching */}
                          {citySearchQuery.trim() && searchResults.length > 0 ? (
                            <>
                              <Box sx={{ 
                                p: 1, 
                                backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#ffffff',
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
                                    backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#ffffff',
                                    borderBottom: index < searchResults.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
                                    position: 'relative',
                                    zIndex: '999999 !important',
                                    '&:hover': {
                                      backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f5f5f5',
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
                                      {city.label || city.labels?.en || city.name || city.code || 'Unknown City'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{
                                      zIndex: '999999 !important',
                                      position: 'relative'
                                    }}>
                                      {city.isCapital && `${t('capital') || 'Capital'}`}
                                      {city.labels?.ar && ` • ${city.labels.ar}`}
                                    </Typography>
                                  </Box>
                                </Box>
                              ))}
                            </>
                          ) : citySearchQuery.trim() && searchResults.length === 0 && !isSearching ? (
                            <Box sx={{ 
                              p: 3, 
                              textAlign: 'center',
                              backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#ffffff',
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
                              <Box sx={{ 
                                p: 1, 
                                backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#ffffff',
                                position: 'sticky',
                                top: 0,
                                zIndex: 2
                              }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                  {currentLanguage === 'ar' ? `المدن المتاحة (${filteredCities.length})` : currentLanguage === 'fr' ? `Villes disponibles (${filteredCities.length})` : `Available Cities (${filteredCities.length})`}
                                </Typography>
                              </Box>
                              {filteredCities.length > 0 ? (
                                filteredCities.map((city, index) => (
                                  <Box
                                    key={city.id || city._id}
                                    onClick={() => handleCitySelect(city, setFieldValue)}
                        sx={{ 
                                      p: 2,
                                      cursor: 'pointer',
                                      backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#ffffff',
                                      borderBottom: index < filteredCities.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
                                      position: 'relative',
                                      zIndex: '999999 !important',
                          '&:hover': {
                                        backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f5f5f5',
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
                                        {city.label || city.name || 'Unknown City'}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary" sx={{
                                        zIndex: '999999 !important',
                                        position: 'relative'
                                      }}>
                                        {city.isCapital && `${t('capital') || 'Capital'}`}
                                        {city.labels?.ar && ` • ${city.labels.ar}`}
                                      </Typography>
                        </Box>
                                  </Box>
                                ))
                              ) : (
                                <Box sx={{ 
                                  p: 3, 
                                  textAlign: 'center',
                                  backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#ffffff',
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
                        </Box>
                      </Box>
                    )}

                    {fieldErrors.city && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          mt: 1, 
                          display: 'block',
                          color: theme.palette.mode === 'dark' ? '#f44336' : '#d32f2f',
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
                    placeholder={t('exactLocationPlaceholder')}
                    data-testid="exactLocation"
                    error={!!fieldErrors.exactLocation}
                    helperText={fieldErrors.exactLocation}
                    onErrorClear={clearFieldError}
                  />
                </Box>


                {/* Item Details Section */}
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 700, 
                    color: theme.palette.mode === 'dark' ? '#4CAF50' : '#2E7D32',
                    fontSize: '1.4rem',
                    mb: 1,
                    textShadow: theme.palette.mode === 'dark' ? '0 1px 2px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,0.1)'
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
                      ? t('descriptionLostPlaceholder') 
                      : t('descriptionFoundPlaceholder')
                    }
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      mb: 1, 
                      display: "block", 
                      fontStyle: "italic", 
                      fontSize: '1rem',
                      color: theme.palette.mode === 'dark' ? '#ff9800' : '#f57c00',
                      fontWeight: 500
                    }}
                  >
                    {getFoundLostType(values.foundLost) === 'LOST' 
                      ? (t('descriptionOptionalLostMessage') || "Description is optional but recommended when you don't have an image of the lost item.")
                      : (t('descriptionOptionalFoundMessage') || "Description is optional. You can add an image instead, or provide both for better identification.")
                    }
                  </Typography>
                  <Textfield 
                    name="description" 
                    variant="outlined" 
                    multiline 
                    rows={4}
                    placeholder={t('descriptionPlaceholder')}
                  />
                </Box>

                {/* Contact Information Section */}
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 700, 
                    color: theme.palette.mode === 'dark' ? '#4CAF50' : '#2E7D32',
                    fontSize: '1.4rem',
                    mb: 1,
                    textShadow: theme.palette.mode === 'dark' ? '0 1px 2px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,0.1)'
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
                    color: theme.palette.mode === 'dark' ? '#4CAF50' : '#2E7D32',
                    fontSize: '1.4rem',
                    mb: 1,
                    textShadow: theme.palette.mode === 'dark' ? '0 1px 2px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,0.1)'
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
                          border: `2px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
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
                          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'
                        }}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Chip 
                              icon={<PhotoCamera />}
                              label={imagePreview ? t('newImage') : t('currentImage')}
                              color={imagePreview ? 'primary' : 'default'}
                              size="small"
                              variant="outlined"
                              sx={{
                                color: theme.palette.text.primary,
                                borderColor: theme.palette.divider,
                                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                              }}
                            />
                            {compressionInfo && (
                              <Chip 
                                label={`${compressionInfo.compressedSize}MB`}
                                color="success"
                                size="small"
                                variant="outlined"
                                sx={{
                                  color: theme.palette.success.main,
                                  borderColor: theme.palette.success.main,
                                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.05)'
                                }}
                              />
                            )}
                          </Box>
                          <Box display="flex" gap={1}>
                            <IconButton
                              size="small"
                              onClick={handleImageDialogOpen}
                              sx={{
                                color: theme.palette.primary.main,
                                '&:hover': {
                                  backgroundColor: theme.palette.primary.main + '20'
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
                                  backgroundColor: theme.palette.error.main + '20'
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
                      component="label"
                      startIcon={isCompressing ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <CloudUploadIcon sx={{ color: 'white' }} />}
                      disabled={isCompressing}
                      sx={{ 
                        textTransform: 'none', 
                        borderRadius: 3,
                        px: 3,
                        py: 1.5,
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: 'white',
                        background: theme.palette.mode === 'dark'
                          ? 'linear-gradient(45deg, #4CAF50 30%, #66BB6A 90%)'
                          : 'linear-gradient(45deg, #2E7D32 30%, #388E3C 90%)',
                        '&:hover': {
                          background: theme.palette.mode === 'dark'
                            ? 'linear-gradient(45deg, #388E3C 30%, #4CAF50 90%)'
                            : 'linear-gradient(45deg, #1B5E20 30%, #2E7D32 90%)',
                          transform: 'translateY(-1px)',
                          boxShadow: theme.palette.mode === 'dark'
                            ? '0 6px 16px rgba(76, 175, 80, 0.3)'
                            : '0 6px 16px rgba(46, 125, 50, 0.3)',
                        },
                        '&:disabled': {
                          background: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.3)' : 'rgba(46, 125, 50, 0.3)',
                          color: 'rgba(255,255,255,0.5)',
                        },
                        transition: 'all 0.2s ease-in-out',
                        boxShadow: theme.palette.mode === 'dark'
                          ? '0 3px 8px rgba(76, 175, 80, 0.2)'
                          : '0 3px 8px rgba(46, 125, 50, 0.2)',
                      }}
                    >
                      {isCompressing ? t('compressingImage') : getCurrentImageUrl() ? t('replaceImage') : t('chooseFile')}
                      <input
                        id="image"
                        name="image"
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={handleImageSelect}
                      />
                    </Button>
                    
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
                        color: theme.palette.mode === 'dark' ? '#4CAF50' : '#2E7D32',
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
                        color: theme.palette.mode === 'dark' ? '#4CAF50' : '#2E7D32',
                        fontSize: '1.4rem',
                        mb: 1,
                        textShadow: theme.palette.mode === 'dark' ? '0 1px 2px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,0.1)'
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
                              borderColor: theme.palette.mode === 'dark' ? '#4CAF50' : '#2E7D32',
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
                    onClick={() => navigate(`/post/${post._id}`)}
                    variant="outlined" 
                    disabled={isLoading}
                    sx={{ 
                      width: { xs: "90%", sm: "100%" },
                      justifySelf: { xs: "center", sm: "stretch" },
                      py: 1.5,
                      px: 3,
                      fontSize: '1rem',
                      fontWeight: 600,
                      borderRadius: '4px',
                      textTransform: 'none',
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
                      color: theme.palette.text.primary,
                      '&:hover': {
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                        transform: 'translateY(-1px)',
                        boxShadow: theme.palette.mode === 'dark'
                          ? '0 6px 16px rgba(0,0,0,0.3)'
                          : '0 6px 16px rgba(0,0,0,0.1)',
                      },
                      '&:disabled': {
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                        color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                      },
                      transition: 'all 0.2s ease-in-out',
                      boxShadow: theme.palette.mode === 'dark'
                        ? '0 3px 8px rgba(0,0,0,0.2)'
                        : '0 3px 8px rgba(0,0,0,0.05)',
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
                      borderRadius: '4px',
                      textTransform: 'none',
                      borderColor: theme.palette.mode === 'dark' ? '#f44336' : '#d32f2f',
                      color: theme.palette.mode === 'dark' ? '#f44336' : '#d32f2f',
                      '&:hover': {
                        borderColor: theme.palette.mode === 'dark' ? '#e53935' : '#c62828',
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(244, 67, 54, 0.08)' : 'rgba(211, 47, 47, 0.08)',
                        transform: 'translateY(-1px)',
                        boxShadow: theme.palette.mode === 'dark'
                          ? '0 6px 16px rgba(244, 67, 54, 0.3)'
                          : '0 6px 16px rgba(211, 47, 47, 0.3)',
                      },
                      '&:disabled': {
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(244, 67, 54, 0.3)' : 'rgba(211, 47, 47, 0.3)',
                        color: theme.palette.mode === 'dark' ? 'rgba(244, 67, 54, 0.5)' : 'rgba(211, 47, 47, 0.7)',
                      },
                      transition: 'all 0.2s ease-in-out',
                      boxShadow: theme.palette.mode === 'dark'
                        ? '0 3px 8px rgba(244, 67, 54, 0.2)'
                        : '0 3px 8px rgba(211, 47, 47, 0.2)',
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
                      borderRadius: '4px',
                      textTransform: 'none',
                      background: hasFormChanged 
                        ? 'linear-gradient(45deg, #4A8BFF 30%, #1A6EEE 90%)'
                        : 'rgba(74, 139, 255, 0.3)',
                      color: hasFormChanged ? '#ffffff !important' : 'rgba(255,255,255,0.7)',
                      boxShadow: hasFormChanged ? '0 3px 5px 2px rgba(26, 110, 238, .3)' : 'none',
                      '&:hover': hasFormChanged ? {
                        background: 'linear-gradient(45deg, #5A9BFF 30%, #2A7EFF 90%)',
                        boxShadow: '0 4px 8px 2px rgba(26, 110, 238, .4)',
                        transform: 'translateY(-1px)',
                      } : {},
                      '&:disabled': {
                        background: 'rgba(74, 139, 255, 0.3)',
                        color: 'rgba(255,255,255,0.7)',
                      },
                      transition: 'all 0.2s ease-in-out',
                    }}
                  >
                    {isSubmitting ? <CircularProgress size={24} color="inherit" /> : t('updatePost')}
                  </Button>
                </Box>
              </Box>
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
            backgroundColor: theme.palette.background.paper,
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
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(45deg, #4CAF50 30%, #66BB6A 90%)'
                  : 'linear-gradient(45deg, #2E7D32 30%, #388E3C 90%)',
                '&:hover': {
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(45deg, #388E3C 30%, #4CAF50 90%)'
                    : 'linear-gradient(45deg, #1B5E20 30%, #2E7D32 90%)',
                },
                // RTL spacing fix - add space between icon and text
                '& .MuiButton-startIcon': {
                  marginRight: '0px',
                  marginLeft: currentLanguage === 'ar' ? '12px' : '0px',
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
    </Box>
  );
};

export default EditPostForm;