import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAddNewPostMutation } from "../postsApiSlice";
import { useSelector } from "react-redux";
import { selectCurrentToken } from "../../auth/authSlice";
import * as Yup from "yup";
import { Formik, Form, useField } from "formik";
import Textfield from "../../../components/Textfield";
import SubmitButton from "../../../components/SubmitButton";
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
  InputLabel,
  TextField,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from "@mui/material";
import { PhotoCamera, LocationOn, WhatsApp, Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';
import { useTranslation } from "../../../utils/translations";
import PromotionDialog from "../../../components/PromotionDialog";

// Custom City Select Option Component (based on SelectOption but with city icons)
const CitySelectOption = ({ name, cities, disabled }) => {
  const [field, meta, helpers] = useField(name);

  const handleChange = (event) => {
    const { value } = event.target;
    helpers.setValue(value);
  };

  const selectConfig = {
    ...field,
    select: true,
    variant: "outlined",
    fullWidth: true,
    onChange: handleChange,
    disabled: disabled,
  };

  if (meta && meta.touched && meta.error) {
    selectConfig.error = true;
    selectConfig.helperText = meta.error;
  }

  return (
    <TextField {...selectConfig}>
      {cities.map((city) => (
        <MenuItem key={city._id} value={city._id}>
          {city.label || city.name || 'Unknown City'}
        </MenuItem>
      ))}
    </TextField>
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
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [showCustomCityInput, setShowCustomCityInput] = useState(false);
  const [customCityName, setCustomCityName] = useState("");
  const [isCompressing, setIsCompressing] = useState(false);
  const [isCreatingCity, setIsCreatingCity] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState(null);
  const [setFieldValueCallback, setSetFieldValueCallback] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const formikRef = useRef(null);

  // New state for unified city dropdown
  const [citySearchQuery, setCitySearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [selectedCityFromSearch, setSelectedCityFromSearch] = useState(null);
  const [filteredCities, setFilteredCities] = useState([]);

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


  // Initialize selectedCountry with user's country
  useEffect(() => {
    if (user.country && countries.length > 0 && !selectedCountry) {
      const userCountry = countries.find(c => c._id === user.country);
      if (userCountry) {
        setSelectedCountry(userCountry);
        fetchCitiesByCountry(userCountry._id);
      }
    }
  }, [user.country, countries, selectedCountry, fetchCitiesByCountry]);

  useEffect(() => {
    if (isSuccess) {
      setShowSuccess(true);
      // Check if this is a lost item post using the stored values
      const foundLostOption = lastSubmittedValues && flOptions.find(option => option.id === lastSubmittedValues.foundLost);
      const isLostItem = foundLostOption && foundLostOption.code === 'LOST';
      
      // Refresh cities list to include any newly created cities
      if (selectedCountry?._id) {
        fetchCitiesByCountry(selectedCountry._id);
      }
      
      if (isLostItem) {
        // Show promotion dialog instead of redirecting immediately
        setShowPromotionDialog(true);
      } else {
        // For found items, redirect after success message
        setTimeout(() => {
          setShowSuccess(false);
          navigate("/dash");
        }, 1500);
      }
    }
  }, [isSuccess, navigate, flOptions, lastSubmittedValues, selectedCountry?._id]);

  // Re-fetch cities when language changes
  useEffect(() => {
    if (selectedCountry?._id) {
      fetchCitiesByCountry(selectedCountry._id);
    }
  }, [fetchCitiesByCountry, selectedCountry?._id, currentLanguage]);

  const initialFormState = {
    country: user.country,
    contact: user.username,
    category: categories[0]?.id || "",
    foundLost: flOptions[0]?.id || "",
    city: "",
    exactLocation: "",
    exactDate: new Date().toLocaleDateString(), // Default to current date as string
    description: "",
    image: null,
    additionalContact: {
      whatsapp: user.username || ""
    }
  };

  // Remove Yup validation - we'll handle validation in handleSubmit
  const formValidation = Yup.object().shape({
    // Only validate optional fields, required fields will be validated in handleSubmit
    description: Yup.string().optional(),
    image: Yup.mixed().nullable(),
  });

  const handleCountrySelect = (event) => {
    const countryId = event.target.value;
    const country = countries.find(c => c._id === countryId);
    setSelectedCountry(country);
    
    // Clear country field error if country is selected
    if (countryId) {
      clearFieldError('country');
    }
    
    // Reset cities when country changes
    setCities([]);
    
    // Clear the city field in the form
    if (formikRef.current) {
      formikRef.current.setFieldValue('city', '');
    }
    
    // Fetch cities for the selected country
    if (countryId) {
      fetchCitiesByCountry(countryId);
    }
  };

  const fetchCitiesByCountry = useCallback(async (countryId) => {
    try {
      setLoadingCities(true);
      const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:3500";
      const url = `${baseUrl}/cities-public?countryId=${countryId}&language=${currentLanguage || 'en'}`;
      
             const response = await fetch(url);
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
  }, [currentLanguage]);

  // New function to search cities using hybrid search
  const searchCitiesHybrid = useCallback(async (searchQuery, countryCode) => {
    try {
      if (!searchQuery || searchQuery.length < 2) {
        return [];
      }

      const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:3500";
      const url = `${baseUrl}/cities/search?q=${encodeURIComponent(searchQuery)}&language=${currentLanguage || 'en'}&countryCode=${countryCode}&limit=10`;
      
      console.log('🌐 API Request:', url);
      
      const response = await fetch(url);
      console.log('🌐 API Response Status:', response.status);
      
      const data = await response.json();
      console.log('🌐 API Response Data:', data);
      
      if (data.success) {
        return data.data;
      } else {
        console.error('Failed to search cities:', data.message);
        return [];
      }
    } catch (error) {
      console.error('Error searching cities:', error);
      return [];
    }
  }, [currentLanguage]);

  // Traditional city search function (fallback)
  const searchCitiesTraditional = useCallback(async (searchQuery, countryId) => {
    try {
      const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:3500";
      const url = `${baseUrl}/cities/search-name?query=${encodeURIComponent(searchQuery)}&countryId=${countryId}&limit=10`;
      
      console.log('🔄 Traditional API Request:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        // Transform traditional results to match hybrid format
        return data.data.map(city => ({
          ...city,
          source: 'database',
          _id: city._id
        }));
      } else {
        console.error('Failed to search cities traditionally:', data.message);
        return [];
      }
    } catch (error) {
      console.error('Error in traditional city search:', error);
      return [];
    }
  }, []);

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
      if (!values.exactDate?.trim()) {
        missingFields.push(t('exactDate'));
        newFieldErrors.exactDate = t('required');
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
          } else if (missingFields.includes(t('exactDate'))) {
            fieldToScroll = document.querySelector('[data-testid="exactDate"]');
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
      
      // Store the submitted values to check if it's a lost item
      setLastSubmittedValues(values);
      
      const formData = new FormData();
      formData.append("user", user._id);
      formData.append("country", selectedCountry?._id || values.country);
      formData.append("category", values.category);
      formData.append("foundLost", values.foundLost);
      
      // Handle city - check if it's an API city or database city
      if (values.city && values.city.startsWith('api_')) {
        // API city - send the city data
        formData.append("city", selectedCityFromSearch?.code || values.city.replace('api_', ''));
        formData.append("cityData", JSON.stringify(selectedCityFromSearch));
      } else {
        // Database city
      formData.append("city", values.city);
      }
      
      formData.append("exactLocation", values.exactLocation);
      formData.append("exactDate", values.exactDate);
      formData.append("contact", values.contact);
      formData.append("description", values.description || "");
      formData.append("contactPreferences", JSON.stringify({ whatsapp: true }));
      formData.append("additionalContact", JSON.stringify(values.additionalContact));
      if (values.image) {
        formData.append("image", values.image);
      }

      const result = await addNewPost(formData);
      
      // Store the created post ID for promotion dialog
      if (result.data?.postId) {
        setCreatedPostId(result.data.postId);
      }
    } catch (error) {
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

  // Get city display name for selected city
  const getCityDisplayName = (cityId) => {
    if (!cityId) return '';
    const city = cities.find(c => c._id === cityId);
    return city ? (city.label || city.name || 'Unknown City') : cityId;
  };

  // Handle custom city name change
  const handleCustomCityChange = (event) => {
    setCustomCityName(event.target.value);
  };

  // Handle city search input change
  const handleCitySearchChange = useCallback(async (event) => {
    const query = event.target.value;
    setCitySearchQuery(query);
    
    // Always show dropdown when there's a query
    if (query.trim().length > 0) {
      setShowCityDropdown(true);
    }
    
    // Get country code from selectedCountry object
    const countryCode = selectedCountry?.code || selectedCountry?.labels?.en || selectedCountry?.names?.en;
    
    console.log('🔍 Search Debug:', {
      query,
      selectedCountry,
      countryCode,
      hasCountry: !!selectedCountry
    });
    
    if (query.length >= 2 && selectedCountry?._id) {
      setIsSearching(true);
      try {
        // Try hybrid search first
        const results = await searchCitiesHybrid(query, countryCode);
        console.log('🔍 Search Results:', results);
        console.log('🔍 First result structure:', results[0]);
        
        if (results.length > 0) {
          setSearchResults(results);
        } else {
          // Fallback to traditional search
          console.log('🔄 Trying traditional search as fallback...');
          const fallbackResults = await searchCitiesTraditional(query, selectedCountry._id);
          
          if (fallbackResults.length > 0) {
            setSearchResults(fallbackResults);
          } else {
            // Final fallback: filter existing cities
            console.log('🔄 Using local city filter as final fallback...');
            const localResults = cities.filter(city => 
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
        console.error('Error searching cities:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
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
      setSearchResults(localResults);
    } else {
      setSearchResults([]);
    }
  }, [searchCitiesHybrid, selectedCountry, cities]);

  // Handle city selection from dropdown
  const handleCitySelect = (city) => {
    setSelectedCityFromSearch(city);
    setCitySearchQuery(city.label || city.labels?.en || city.name || '');
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
    setShowCityDropdown(!showCityDropdown);
    // If opening dropdown and there's a search query, ensure results are shown
    if (!showCityDropdown && citySearchQuery.trim().length > 0) {
      // Trigger search again to ensure results are displayed
      const event = { target: { value: citySearchQuery } };
      handleCitySearchChange(event);
    }
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
  const compressImage = async (file) => {
    if (!file) return null;
    
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      console.warn('File is not an image:', file.type);
      return file;
    }
    
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1200,
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
      
      setIsCompressing(false);
      return compressedFile;
    } catch (error) {
      console.error('Error compressing image:', error);
      setIsCompressing(false);
      // Return original file if compression fails
      return file;
    }
  };

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
        background: theme.palette.background.default,
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
          {t('createNewPost')}
        </Typography>

        <Formik
          ref={formikRef}
          initialValues={initialFormState}
          validationSchema={formValidation}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, status, setFieldValue, values, errors, touched, handleChange }) => {
            // Store setFieldValue function for use in custom city creation
            setSetFieldValueCallback(() => setFieldValue);
            
            return (
            <Form>
              {status?.error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {status.error}
                </Alert>
              )}
              
              <Box display="flex" flexDirection="column" gap={3}>
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
                      value={selectedCountry?._id || ""}
                      onChange={handleCountrySelect}
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
                        : currentLanguage === 'ar' 
                          ? 'ابحث أو اختر مدينة...'
                          : currentLanguage === 'fr'
                            ? 'Rechercher ou sélectionner une ville...'
                            : 'Search or select a city...'
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
                        Debug: Country: {selectedCountry.code || selectedCountry.labels?.en || 'No code'} | Cities loaded: {cities.length}
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
                                  onClick={() => handleCitySelect(city)}
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
                                {t('addNewCityName') || 'Add new city name'}
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
                                    onClick={() => handleCitySelect(city)}
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

                          {/* Add New City Option */}
                      <Divider />
                          <Box
                            onClick={() => {
                              setShowCityDropdown(false);
                              setShowCustomCityInput(true);
                            }}
                            sx={{
                              p: 2,
                              cursor: 'pointer',
                              color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
                              fontWeight: 600,
                              backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#ffffff',
                              border: `1px solid ${theme.palette.divider}`,
                              margin: '6px 8px',
                              borderRadius: 2,
                              transition: 'all 0.2s ease-in-out',
                              '&:hover': {
                                backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f5f5f5',
                                color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
                                borderColor: theme.palette.primary.main,
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
                    htmlFor="exactDate" 
                    sx={{ 
                      mb: 1, 
                      display: "block", 
                      fontWeight: 600, 
                      fontSize: '1.15rem',
                      color: theme.palette.text.primary
                    }}
                  >
                    {t('exactDate')} *
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
                      ? t('exactDateLostPlaceholder') 
                      : t('exactDateFoundPlaceholder')
                    }
                  </Typography>
                  <Textfield 
                    name="exactDate" 
                    variant="outlined" 
                    placeholder={t('exactDatePlaceholder') || "Enter the date (e.g., 15/12/2023 or December 15, 2023)"}
                    data-testid="exactDate"
                    error={!!fieldErrors.exactDate}
                    helperText={fieldErrors.exactDate}
                    onErrorClear={clearFieldError}
                  />
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
                      ? t('exactLocationLostPlaceholder') 
                      : t('exactLocationFoundPlaceholder')
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
                    {t('phoneNumberDescription')}
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

                {/* WhatsApp Contact Details */}
                <Box>
                  <FormLabel 
                    sx={{ 
                      mb: 1, 
                      display: "block", 
                      fontWeight: 600, 
                      fontSize: '1.15rem',
                      color: theme.palette.text.primary
                    }}
                  >
                    {t('whatsappContact')} ({t('optional')})
                  </FormLabel>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      mb: 1, 
                      display: "block", 
                      fontSize: '1rem',
                      color: theme.palette.mode === 'dark' ? '#ff9800' : '#f57c00',
                      fontWeight: 500,
                      fontStyle: 'italic'
                    }}
                  >
                    {t('whatsappOptionalMessage') || "This is optional - you can provide your WhatsApp number if you prefer to be contacted via WhatsApp."}
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={2}>
                    <Textfield 
                      name="additionalContact.whatsapp" 
                      variant="outlined" 
                      placeholder={t('whatsappNumber') || "Enter your WhatsApp number (e.g., +1234567890)"}
                    />
                  </Box>
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
                    {t('addItemImage')} ({t('optional')})
                  </FormLabel>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Button
                      variant="contained"
                      component="label"
                      startIcon={isCompressing ? <CircularProgress size={16} color="inherit" /> : <PhotoCamera sx={{ ml: 0.5 }} />}
                      disabled={isCompressing}
                      sx={{ 
                        textTransform: 'none', 
                        borderRadius: 3,
                        px: 3,
                        py: 1.5,
                        fontSize: '1rem',
                        fontWeight: 600,
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
                          color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.7)',
                        },
                        transition: 'all 0.2s ease-in-out',
                        boxShadow: theme.palette.mode === 'dark'
                          ? '0 3px 8px rgba(76, 175, 80, 0.2)'
                          : '0 3px 8px rgba(46, 125, 50, 0.2)',
                      }}
                    >
                      {isCompressing ? t('compressingImage') || 'Compressing...' : t('chooseFile')}
                      <input
                        id="image"
                        name="image"
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={async (event) => {
                          const file = event.currentTarget.files[0];
                          // Clear previous compression info
                          setCompressionInfo(null);
                          
                          if (file) {
                            const compressedFile = await compressImage(file);
                            setFieldValue("image", compressedFile);
                            setSelectedFileName(compressedFile ? compressedFile.name : "");
                          } else {
                            setFieldValue("image", null);
                            setSelectedFileName("");
                          }
                        }}
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
                    {compressionInfo && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          display: "block", 
                          mt: 0.5,
                          color: theme.palette.mode === 'dark' ? '#4CAF50' : '#2E7D32',
                          fontWeight: 500
                        }}
                      >
                        {t('compressionSuccess') || `Compressed: ${compressionInfo.originalSize}MB → ${compressionInfo.compressedSize}MB (${compressionInfo.compressionRatio}% smaller)`}
                      </Typography>
                    )}
                  </Box>
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
                
                <Box 
                  mt={4} 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'center',
                    width: '100%'
                  }}
                >
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    sx={{ 
                      width: { xs: "100%", sm: "100%", md: "100%" },
                      maxWidth: { xs: "100%", sm: "400px", md: "500px" },
                      padding: '8px 16px',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      borderRadius: '4px',
                      background: 'linear-gradient(45deg, #4A8BFF 30%, #1A6EEE 90%)',
                      color: '#fff',
                      boxShadow: '0 3px 5px 2px rgba(26, 110, 238, .3)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #5A9BFF 30%, #2A7EFF 90%)',
                        boxShadow: '0 4px 8px 2px rgba(26, 110, 238, .4)',
                      },
                      '&:disabled': {
                        background: theme.palette.mode === 'dark' ? 'rgba(74, 139, 255, 0.3)' : 'rgba(26, 110, 238, 0.3)',
                        color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.7)',
                      },
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    {isSubmitting ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      t('createPost')
                    )}
                  </Button>
                </Box>
                
                {/* Dynamic validation error message */}
                {status?.validationError && (
                  <Box mt={2} sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <Alert 
                      severity="error" 
                      sx={{ 
                        width: '100%',
                        maxWidth: { xs: "100%", sm: "400px", md: "500px" },
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
            borderRadius: 4,
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(135deg, rgba(20,20,20,0.98) 0%, rgba(35,35,35,0.98) 100%)' 
              : 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)',
            backdropFilter: 'blur(20px)',
            border: `2px solid ${theme.palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.15)' 
              : 'rgba(0, 0, 0, 0.08)'}`,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 20px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)'
              : '0 20px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)'
          }
        }}
        BackdropProps={{
          sx: {
            backgroundColor: 'transparent'
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: 1,
            borderBottom: `1px solid ${theme.palette.divider}`
          }}
        >
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 700, 
              color: theme.palette.text.primary,
              fontSize: '1.3rem'
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
        
        <DialogContent sx={{ pt: 3 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              mb: 2,
              color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
              fontSize: '1rem',
              fontWeight: 500
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
              borderRadius: 3,
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: theme.palette.mode === 'dark' ? '#4CAF50' : '#2E7D32',
                },
                '&.Mui-focused fieldset': {
                  borderColor: theme.palette.mode === 'dark' ? '#4CAF50' : '#2E7D32',
                },
                '& fieldset': {
                  borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
                },
                color: theme.palette.text.primary,
                fontWeight: 500
              }
            }}
          />
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            variant="outlined"
            onClick={() => {
              setShowCustomCityInput(false);
              setCustomCityName("");
            }}
            disabled={isCreatingCity}
            sx={{ 
              borderRadius: '4px',
              borderColor: '#4A8BFF',
              color: '#4A8BFF',
              fontSize: '1rem',
              fontWeight: 600,
              py: 1.5,
              px: 3,
              '&:hover': {
                borderColor: '#5A9BFF',
                backgroundColor: 'rgba(74, 139, 255, 0.1)',
              },
              transition: 'all 0.2s ease-in-out'
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
              borderRadius: '4px',
              background: 'linear-gradient(45deg, #4A8BFF 30%, #1A6EEE 90%)',
              boxShadow: '0 3px 5px 2px rgba(26, 110, 238, .3)',
              fontSize: '1rem',
              fontWeight: 600,
              py: 1.5,
              px: 3,
              '&:hover': {
                background: 'linear-gradient(45deg, #5A9BFF 30%, #2A7EFF 90%)',
                boxShadow: '0 4px 8px 2px rgba(26, 110, 238, .4)',
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
            startIcon={isCreatingCity ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {isCreatingCity ? (t('creatingCity') || 'Creating City...') : t('confirm')}
          </Button>
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
        onPromotionRequested={() => {
          // Handle successful promotion request
        }}
      />
    </Box>
  );
};

export default NewPostForm;
