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
  IconButton,
  Card,
  CardMedia,
  CardActions,
  Chip,
  LinearProgress,
  Fade,
  Slide,
  Skeleton
} from "@mui/material";
import { 
  PhotoCamera, 
  LocationOn, 
  WhatsApp, 
  Add as AddIcon, 
  Close as CloseIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CloudUpload as CloudUploadIcon,
  Person as PersonIcon,
  Category as CategoryIcon,
  Public as PublicIcon,
  CalendarToday as CalendarIcon,
  Place as PlaceIcon,
  Phone as PhoneIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useTranslation } from "../../../utils/translations";
import PromotionDialog from "../../../components/PromotionDialog";

// Enhanced Field Container Component
const FieldContainer = ({ children, icon, label, error, helperText, required, theme }) => {
  const getFieldIcon = () => {
    if (error) return <ErrorIcon sx={{ color: theme.palette.error.main, fontSize: 20 }} />;
    if (helperText && !error) return <CheckCircleIcon sx={{ color: theme.palette.success.main, fontSize: 20 }} />;
    return icon;
  };

  return (
    <Box
      sx={{
        position: 'relative',
        mb: 3,
        p: 3,
        borderRadius: 3,
        border: `2px solid ${error 
          ? theme.palette.error.main 
          : theme.palette.mode === 'dark' 
            ? 'rgba(255,255,255,0.1)' 
            : 'rgba(0,0,0,0.08)'}`,
        backgroundColor: theme.palette.mode === 'dark' 
          ? 'rgba(255,255,255,0.02)' 
          : 'rgba(0,0,0,0.02)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          borderColor: error 
            ? theme.palette.error.main 
            : theme.palette.mode === 'dark' 
              ? 'rgba(76, 175, 80, 0.5)' 
              : 'rgba(46, 125, 50, 0.5)',
          backgroundColor: theme.palette.mode === 'dark' 
            ? 'rgba(255,255,255,0.04)' 
            : 'rgba(0,0,0,0.04)',
          transform: 'translateY(-2px)',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 8px 25px rgba(0,0,0,0.3)'
            : '0 8px 25px rgba(0,0,0,0.1)'
        },
        '&:focus-within': {
          borderColor: error 
            ? theme.palette.error.main 
            : theme.palette.mode === 'dark' 
              ? '#4CAF50' 
              : '#2E7D32',
          backgroundColor: theme.palette.mode === 'dark' 
            ? 'rgba(76, 175, 80, 0.05)' 
            : 'rgba(46, 125, 50, 0.05)',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 0 0 3px rgba(76, 175, 80, 0.1)'
            : '0 0 0 3px rgba(46, 125, 50, 0.1)'
        }
      }}
    >
      {/* Field Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        {getFieldIcon()}
        <Typography 
          variant="subtitle1" 
          sx={{ 
            fontWeight: 600, 
            color: theme.palette.text.primary,
            fontSize: '1rem'
          }}
        >
          {label} {required && <span style={{ color: theme.palette.error.main }}>*</span>}
        </Typography>
      </Box>
      
      {/* Field Content */}
      {children}
      
      {/* Helper Text */}
      {helperText && (
        <Typography 
          variant="caption" 
          sx={{ 
            mt: 1, 
            display: 'block',
            color: error ? theme.palette.error.main : theme.palette.text.secondary,
            fontWeight: 500
          }}
        >
          {helperText}
        </Typography>
      )}
    </Box>
  );
};

// Enhanced TextField with Floating Label
const EnhancedTextField = ({ name, label, icon, required, multiline, rows, placeholder, theme, ...props }) => {
  const [field, meta, helpers] = useField(name);
  const [focused, setFocused] = useState(false);
  const hasValue = field.value && field.value.toString().trim() !== '';

  return (
    <FieldContainer 
      icon={icon} 
      label={label} 
      error={meta.touched && meta.error} 
      helperText={meta.touched && meta.error ? meta.error : props.helperText}
      required={required}
      theme={theme}
    >
      <TextField
        {...field}
        {...props}
        fullWidth
        multiline={multiline}
        rows={rows}
        placeholder={placeholder}
        variant="outlined"
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          setFocused(false);
          field.onBlur(e);
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'transparent',
            '& fieldset': {
              border: 'none',
            },
            '&:hover fieldset': {
              border: 'none',
            },
            '&.Mui-focused fieldset': {
              border: 'none',
            },
          },
          '& .MuiInputLabel-root': {
            color: theme.palette.text.secondary,
            '&.Mui-focused': {
              color: theme.palette.mode === 'dark' ? '#4CAF50' : '#2E7D32',
            },
            '&.MuiInputLabel-shrink': {
              color: theme.palette.mode === 'dark' ? '#4CAF50' : '#2E7D32',
            }
          },
          '& .MuiOutlinedInput-input': {
            color: theme.palette.text.primary,
            fontSize: '1rem',
            fontWeight: 500,
            '&::placeholder': {
              color: theme.palette.text.secondary,
              opacity: 0.7
            }
          }
        }}
        InputLabelProps={{
          shrink: focused || hasValue,
        }}
      />
    </FieldContainer>
  );
};

// Enhanced Select Field
const EnhancedSelectField = ({ name, label, icon, required, options, theme, ...props }) => {
  const [field, meta, helpers] = useField(name);
  const [focused, setFocused] = useState(false);
  const hasValue = field.value && field.value.toString().trim() !== '';

  const handleChange = (event) => {
    helpers.setValue(event.target.value);
  };

  return (
    <FieldContainer 
      icon={icon} 
      label={label} 
      error={meta.touched && meta.error} 
      helperText={meta.touched && meta.error ? meta.error : props.helperText}
      required={required}
      theme={theme}
    >
      <FormControl fullWidth>
        <Select
          {...field}
          value={field.value || ''}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={(e) => {
            setFocused(false);
            field.onBlur(e);
          }}
          displayEmpty
          sx={{
            backgroundColor: 'transparent',
            '& .MuiOutlinedInput-notchedOutline': {
              border: 'none',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              border: 'none',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              border: 'none',
            },
            '& .MuiSelect-select': {
              color: theme.palette.text.primary,
              fontSize: '1rem',
              fontWeight: 500,
            }
          }}
        >
          <MenuItem value="" disabled>
            <em style={{ color: theme.palette.text.secondary, fontStyle: 'italic' }}>
              {placeholder || `Select ${label.toLowerCase()}`}
            </em>
          </MenuItem>
          {options?.map((option) => (
            <MenuItem key={option.id || option._id} value={option.id || option._id}>
              {option.label || option.name || option.code}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </FieldContainer>
  );
};

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
  const [isLostItem, setIsLostItem] = useState(true);
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
  const [formProgress, setFormProgress] = useState(0);
  const formikRef = useRef(null);

  // Image management state
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showImageDialog, setShowImageDialog] = useState(false);

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

  // Function to calculate form completion progress
  const calculateFormProgress = (values) => {
    const requiredFields = ['foundLost', 'category', 'country', 'city', 'exactDate', 'exactLocation', 'contact'];
    const optionalFields = ['description', 'image'];
    
    let completedRequired = 0;
    let completedOptional = 0;
    
    // Check required fields
    requiredFields.forEach(field => {
      if (field === 'country') {
        if (selectedCountry?._id) completedRequired++;
      } else if (values[field] && values[field].toString().trim()) {
        completedRequired++;
      }
    });
    
    // Check optional fields
    optionalFields.forEach(field => {
      if (field === 'image') {
        if (selectedImage) completedOptional++;
      } else if (values[field] && values[field].toString().trim()) {
        completedOptional++;
      }
    });
    
    const requiredProgress = (completedRequired / requiredFields.length) * 80; // 80% for required fields
    const optionalProgress = (completedOptional / optionalFields.length) * 20; // 20% for optional fields
    
    return Math.round(requiredProgress + optionalProgress);
  };

  // Define fetchCitiesByCountry BEFORE it's used in useEffect
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
      const lostItemStatus = foundLostOption && foundLostOption.code === 'LOST';
      setIsLostItem(lostItemStatus);
      
      // Refresh cities list to include any newly created cities
      if (selectedCountry?._id) {
        fetchCitiesByCountry(selectedCountry._id);
      }
      
      // Show promotion dialog for both lost and found items
      setShowPromotionDialog(true);
    }
  }, [isSuccess, navigate, flOptions, lastSubmittedValues, selectedCountry?._id]);

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

  // New function to search cities using hybrid search
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
      
      // Combine basic fields into a single JSON object to reduce field count
      const postData = {
        user: user._id,
        country: selectedCountry?._id || values.country,
        category: values.category,
        foundLost: values.foundLost,
        exactLocation: values.exactLocation,
        exactDate: values.exactDate,
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
    
    
    if (query.length >= 2 && selectedCountry?._id) {
      setIsSearching(true);
      try {
        // Try hybrid search first
        const results = await searchCitiesHybrid(query, countryCode);
        
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
        background: theme.palette.mode === 'dark' 
          ? 'radial-gradient(ellipse at top, rgba(76, 175, 80, 0.1) 0%, transparent 50%), linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)'
          : 'radial-gradient(ellipse at top, rgba(46, 125, 50, 0.05) 0%, transparent 50%), linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: theme.palette.mode === 'dark'
            ? 'radial-gradient(circle at 20% 80%, rgba(76, 175, 80, 0.03) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(76, 175, 80, 0.03) 0%, transparent 50%)'
            : 'radial-gradient(circle at 20% 80%, rgba(46, 125, 50, 0.02) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(46, 125, 50, 0.02) 0%, transparent 50%)',
          pointerEvents: 'none',
          zIndex: 0
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
        elevation={0} 
        sx={{ 
          p: { xs: 4, md: 6 }, 
          maxWidth: 700, 
          width: "100%",
          borderRadius: 4,
          position: 'relative',
          zIndex: 1,
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(45, 45, 45, 0.95) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.1)' 
            : 'rgba(0, 0, 0, 0.08)'}`,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.1)'
            : '0 20px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.8)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(90deg, #4CAF50 0%, #66BB6A 50%, #4CAF50 100%)'
              : 'linear-gradient(90deg, #2E7D32 0%, #388E3C 50%, #2E7D32 100%)',
            borderRadius: '4px 4px 0 0',
            opacity: 0.8
          }
        }}
      >
        <Typography 
          variant="h3" 
          gutterBottom 
          textAlign="center" 
          sx={{ 
            color: theme.palette.text.primary,
            mb: 3,
            fontWeight: 700,
            fontSize: { xs: '1.8rem', md: '2.2rem' },
            textShadow: theme.palette.mode === 'dark' ? '0 2px 4px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,0.1)'
          }}
        >
          {t('createNewPost')}
        </Typography>

        {/* Progress Indicator */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                color: theme.palette.text.secondary,
                fontWeight: 500,
                fontSize: '0.9rem'
              }}
            >
              {t('formProgress') || 'Form Progress'}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: theme.palette.mode === 'dark' ? '#4CAF50' : '#2E7D32',
                fontWeight: 600,
                fontSize: '0.9rem'
              }}
            >
              {formProgress}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={formProgress}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(90deg, #4CAF50 0%, #66BB6A 50%, #81C784 100%)'
                  : 'linear-gradient(90deg, #2E7D32 0%, #388E3C 50%, #4CAF50 100%)',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 2px 8px rgba(76, 175, 80, 0.3)'
                  : '0 2px 8px rgba(46, 125, 50, 0.3)'
              }
            }}
          />
        </Box>

        <Formik
          ref={formikRef}
          initialValues={initialFormState}
          validationSchema={formValidation}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, status, setFieldValue, values, errors, touched, handleChange }) => {
            // Store setFieldValue function for use in custom city creation
            setSetFieldValueCallback(() => setFieldValue);
            
            // Update form progress when values change
            useEffect(() => {
              const progress = calculateFormProgress(values);
              setFormProgress(progress);
            }, [values, selectedCountry, selectedImage]);
            
            return (
            <Form>
              {status?.error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {status.error}
                </Alert>
              )}
              
              <Box display="flex" flexDirection="column" gap={4}>
                {/* Basic Information Section */}
                <Fade in timeout={600}>
                  <Box>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: 700, 
                        color: theme.palette.mode === 'dark' ? '#4CAF50' : '#2E7D32',
                        fontSize: '1.4rem',
                        mb: 2,
                        textShadow: theme.palette.mode === 'dark' ? '0 1px 2px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,0.1)',
                        position: 'relative',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          bottom: -8,
                          left: 0,
                          width: '40px',
                          height: '3px',
                          background: theme.palette.mode === 'dark'
                            ? 'linear-gradient(90deg, #4CAF50 0%, #66BB6A 100%)'
                            : 'linear-gradient(90deg, #2E7D32 0%, #388E3C 100%)',
                          borderRadius: '2px',
                          opacity: 0.8
                        }
                      }}
                    >
                      {t('basicInformation')}
                    </Typography>
                  </Box>
                </Fade>

                <EnhancedSelectField
                  name="foundLost"
                  label={t('haveYouLostOrFoundSomething')}
                  icon={<PersonIcon sx={{ color: theme.palette.text.secondary, fontSize: 20 }} />}
                  required={true}
                  options={flOptions}
                  theme={theme}
                  data-testid="foundLost"
                  error={!!fieldErrors.foundLost}
                  helperText={fieldErrors.foundLost}
                  onErrorClear={clearFieldError}
                />

                <FieldContainer 
                  icon={<PublicIcon sx={{ color: theme.palette.text.secondary, fontSize: 20 }} />}
                  label={t('country')}
                  error={!!fieldErrors.country}
                  helperText={fieldErrors.country || (getFoundLostType(values.foundLost) === 'LOST' 
                    ? t('chooseCountryLost') 
                    : t('chooseCountryFound'))}
                  required={true}
                  theme={theme}
                >
                  <FormControl fullWidth>
                    <Select
                      value={selectedCountry?._id || ""}
                      onChange={handleCountrySelect}
                      data-testid="country-select"
                      displayEmpty
                      sx={{
                        backgroundColor: 'transparent',
                        '& .MuiOutlinedInput-notchedOutline': {
                          border: 'none',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          border: 'none',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          border: 'none',
                        },
                        '& .MuiSelect-select': {
                          color: theme.palette.text.primary,
                          fontSize: '1rem',
                          fontWeight: 500,
                        }
                      }}
                    >
                      <MenuItem value="" disabled>
                        <em style={{ color: theme.palette.text.secondary, fontStyle: 'italic' }}>
                          {t('selectCountry') || 'Select Country'}
                        </em>
                      </MenuItem>
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
                  </FormControl>
                </FieldContainer>

                <EnhancedSelectField
                  name="category"
                  label={t('category')}
                  icon={<CategoryIcon sx={{ color: theme.palette.text.secondary, fontSize: 20 }} />}
                  required={true}
                  options={categories}
                  theme={theme}
                  data-testid="category"
                  error={!!fieldErrors.category}
                  helperText={fieldErrors.category}
                  onErrorClear={clearFieldError}
                />

                {/* Section Divider */}
                <Slide direction="right" in timeout={800}>
                  <Divider 
                    sx={{ 
                      my: 4,
                      '&::before, &::after': {
                        borderColor: theme.palette.mode === 'dark' 
                          ? 'rgba(76, 175, 80, 0.3)' 
                          : 'rgba(46, 125, 50, 0.3)'
                      }
                    }}
                  />
                </Slide>

                {/* Location Section */}
                <Fade in timeout={800}>
                  <Box>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: 700, 
                        color: theme.palette.mode === 'dark' ? '#4CAF50' : '#2E7D32',
                        fontSize: '1.4rem',
                        mb: 2,
                        textShadow: theme.palette.mode === 'dark' ? '0 1px 2px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,0.1)',
                        position: 'relative',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          bottom: -8,
                          left: 0,
                          width: '40px',
                          height: '3px',
                          background: theme.palette.mode === 'dark'
                            ? 'linear-gradient(90deg, #4CAF50 0%, #66BB6A 100%)'
                            : 'linear-gradient(90deg, #2E7D32 0%, #388E3C 100%)',
                          borderRadius: '2px',
                          opacity: 0.8
                        }
                      }}
                    >
                      {t('location')}
                    </Typography>
                  </Box>
                </Fade>


                <FieldContainer 
                  icon={<LocationOn sx={{ color: theme.palette.text.secondary, fontSize: 20 }} />}
                  label={t('city')}
                  error={!!fieldErrors.city}
                  helperText={fieldErrors.city || (!selectedCountry 
                    ? t('selectCountryFirst') 
                      : getFoundLostType(values.foundLost) === 'LOST'
                        ? currentLanguage === 'ar' 
                          ? 'يرجى تحديد المدينة التي فقدت فيها العنصر أو أقرب مدينة رئيسية إليها (العاصمة، العمالة، المقاطعة، الولاية، أو المحافظة)'
                          : currentLanguage === 'fr'
                            ? 'Veuillez sélectionner la ville où vous avez perdu l\'objet ou la ville principale la plus proche (capitale, préfecture, province, état ou gouvernorat)'
                            : 'Please select the city where you lost the item or the nearest major administrative center (capital, prefecture, province, state, or governorate)'
                        : currentLanguage === 'ar' 
                          ? 'يرجى تحديد المدينة التي وجدت فيها العنصر أو أقرب مدينة رئيسية إليها (العاصمة، العمالة، المقاطعة، الولاية، أو المحافظة)'
                          : currentLanguage === 'fr'
                            ? 'Veuillez sélectionner la ville où vous avez trouvé l\'objet ou la ville principale la plus proche (capitale, préfecture, province, état ou gouvernorat)'
                            : 'Please select the city where you found the item or the nearest major administrative center (capital, prefecture, province, state, or governorate)')}
                  required={true}
                  theme={theme}
                > 
                  
                  {/* Debug info */}
                  {process.env.NODE_ENV === 'development' && selectedCountry && (
                    <Box sx={{ mb: 2 }}>
                      <Typography 
                        variant="caption" 
                        sx={{ 
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
                    {/* Enhanced City Search Input */}
                    <TextField
                      fullWidth
                      placeholder={currentLanguage === 'ar' ? 'ابحث أو اختر مدينة...' : currentLanguage === 'fr' ? 'Rechercher ou sélectionner une ville...' : 'Search or select a city...'}
                      value={citySearchQuery}
                      onChange={handleCitySearchChange}
                      disabled={!selectedCountry}
                      data-testid="city-search"
                      onClick={handleCityDropdownToggle}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'transparent',
                          '& fieldset': {
                            border: 'none',
                          },
                          '&:hover fieldset': {
                            border: 'none',
                          },
                          '&.Mui-focused fieldset': {
                            border: 'none',
                          },
                          color: theme.palette.text.primary,
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            backgroundColor: theme.palette.mode === 'dark' 
                              ? 'rgba(255,255,255,0.05)' 
                              : 'rgba(0,0,0,0.05)',
                          }
                        },
                        '& .MuiOutlinedInput-input': {
                          color: theme.palette.text.primary,
                          fontSize: '1rem',
                          fontWeight: 500,
                          '&::placeholder': {
                            color: theme.palette.text.secondary,
                            opacity: 0.7
                          }
                        }
                      }}
                      InputProps={{
                        endAdornment: isSearching ? (
                          <CircularProgress size={20} sx={{ color: theme.palette.primary.main }} />
                        ) : (
                          <LocationOn sx={{ 
                            color: theme.palette.text.secondary,
                            transition: 'color 0.2s ease-in-out',
                            '&:hover': {
                              color: theme.palette.primary.main
                            }
                          }} />
                        )
                      }}
                    />

                    {/* Enhanced City Dropdown */}
                    {showCityDropdown && selectedCountry && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          zIndex: '99999 !important',
                          backgroundColor: theme.palette.mode === 'dark'
                            ? 'rgba(30, 30, 30, 0.98)'
                            : 'rgba(255, 255, 255, 0.98)',
                          backdropFilter: 'blur(20px)',
                          border: `2px solid ${theme.palette.mode === 'dark' 
                            ? 'rgba(255, 255, 255, 0.1)' 
                            : 'rgba(0, 0, 0, 0.08)'}`,
                          borderRadius: 3,
                          boxShadow: theme.palette.mode === 'dark'
                            ? '0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)'
                            : '0 20px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)',
                          maxHeight: 400,
                          overflow: 'hidden',
                          mt: 1,
                          animation: 'slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          '@keyframes slideDown': {
                            '0%': {
                              opacity: 0,
                              transform: 'translateY(-10px)'
                            },
                            '100%': {
                              opacity: 1,
                              transform: 'translateY(0)'
                            }
                          }
                        }}
                      >

                        {/* Cities List */}
                        <Box sx={{ 
                          maxHeight: 300, 
                          overflow: 'auto',
                          backgroundColor: 'transparent',
                          position: 'relative',
                          zIndex: 1
                        }}>
                          {/* Loading Skeletons */}
                          {isSearching && (
                            <Box sx={{ p: 2 }}>
                              {[...Array(3)].map((_, index) => (
                                <Box key={index} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <Skeleton variant="circular" width={24} height={24} />
                                  <Box sx={{ flex: 1 }}>
                                    <Skeleton variant="text" width="60%" height={20} />
                                    <Skeleton variant="text" width="40%" height={16} />
                                  </Box>
                                </Box>
                              ))}
                            </Box>
                          )}
                          
                          {/* Show search results if searching */}
                          {!isSearching && citySearchQuery.trim() && searchResults.length > 0 ? (
                            <>
                              <Box sx={{ 
                                p: 2, 
                                backgroundColor: theme.palette.mode === 'dark' 
                                  ? 'rgba(76, 175, 80, 0.1)' 
                                  : 'rgba(46, 125, 50, 0.1)',
                                borderBottom: `1px solid ${theme.palette.mode === 'dark' 
                                  ? 'rgba(76, 175, 80, 0.2)' 
                                  : 'rgba(46, 125, 50, 0.2)'}`,
                                position: 'sticky',
                                top: 0,
                                zIndex: 2
                              }}>
                                <Typography variant="caption" sx={{ 
                                  fontWeight: 600,
                                  color: theme.palette.mode === 'dark' ? '#4CAF50' : '#2E7D32',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px'
                                }}>
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
                                    backgroundColor: 'transparent',
                                    borderBottom: index < searchResults.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
                                    position: 'relative',
                                    zIndex: '999999 !important',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    '&:hover': {
                                      backgroundColor: theme.palette.mode === 'dark' 
                                        ? 'rgba(76, 175, 80, 0.1)' 
                                        : 'rgba(46, 125, 50, 0.1)',
                                      transform: 'translateX(8px)',
                                      boxShadow: theme.palette.mode === 'dark'
                                        ? '0 4px 12px rgba(76, 175, 80, 0.2)'
                                        : '0 4px 12px rgba(46, 125, 50, 0.2)',
                                    },
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2
                                  }}
                                >
                                  <Box sx={{
                                    p: 1,
                                    borderRadius: '50%',
                                    backgroundColor: theme.palette.mode === 'dark' 
                                      ? 'rgba(76, 175, 80, 0.2)' 
                                      : 'rgba(46, 125, 50, 0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s ease-in-out'
                                  }}>
                                    <LocationOn fontSize="small" sx={{ 
                                      color: theme.palette.mode === 'dark' ? '#4CAF50' : '#2E7D32',
                                      zIndex: '999999 !important', 
                                      position: 'relative' 
                                    }} />
                                  </Box>
                                  <Box sx={{ zIndex: '999999 !important', position: 'relative', flex: 1 }}>
                                    <Typography variant="body2" sx={{ 
                                      fontWeight: 600,
                                      color: theme.palette.text.primary,
                                      zIndex: '999999 !important',
                                      position: 'relative',
                                      mb: 0.5
                                    }}>
                                      {city.label || city.labels?.en || city.name || city.code || 'Unknown City'}
                                    </Typography>
                                    <Typography variant="caption" sx={{
                                      color: theme.palette.text.secondary,
                                      zIndex: '999999 !important',
                                      position: 'relative',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 1
                                    }}>
                                      {city.isCapital && (
                                        <Chip 
                                          label={t('capital') || 'Capital'} 
                                          size="small" 
                                          color="primary" 
                                          variant="outlined"
                                          sx={{ 
                                            height: 20, 
                                            fontSize: '0.7rem',
                                            '& .MuiChip-label': { px: 1 }
                                          }} 
                                        />
                                      )}
                                      {city.labels?.ar && (
                                        <span>• {city.labels.ar}</span>
                                      )}
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
                </FieldContainer>

                <EnhancedTextField
                  name="exactLocation"
                  label={t('exactLocation')}
                  icon={<PlaceIcon sx={{ color: theme.palette.text.secondary, fontSize: 20 }} />}
                  required={true}
                  placeholder={t('exactLocationPlaceholder')}
                  theme={theme}
                  data-testid="exactLocation"
                  error={!!fieldErrors.exactLocation}
                  helperText={fieldErrors.exactLocation || (getFoundLostType(values.foundLost) === 'LOST'
                    ? currentLanguage === 'ar' 
                      ? 'يرجى تحديد الموقع الدقيق والتفصيلي حيث فقدت العنصر (مثال: حي النور، شارع الملك، بجانب المسجد، أو أي معلم مميز)'
                      : currentLanguage === 'fr'
                        ? 'Veuillez spécifier l\'emplacement exact et détaillé où vous avez perdu l\'objet (ex: Quartier Al-Nour, Rue du Roi, près de la mosquée, ou tout point de repère distinctif)'
                        : 'Please specify the precise and detailed location where you lost the item (e.g., Al-Nour District, King Street, near the mosque, or any distinctive landmark)'
                    : currentLanguage === 'ar' 
                      ? 'يرجى تحديد الموقع الدقيق والتفصيلي حيث وجدت العنصر (مثال: حي النور، شارع الملك، بجانب المسجد، أو أي معلم مميز)'
                      : currentLanguage === 'fr'
                        ? 'Veuillez spécifier l\'emplacement exact et détaillé où vous avez trouvé l\'objet (ex: Quartier Al-Nour, Rue du Roi, près de la mosquée, ou tout point de repère distinctif)'
                        : 'Please specify the precise and detailed location where you found the item (e.g., Al-Nour District, King Street, near the mosque, or any distinctive landmark)')}
                  onErrorClear={clearFieldError}
                />

                <EnhancedTextField
                  name="exactDate"
                  label={t('exactDate')}
                  icon={<CalendarIcon sx={{ color: theme.palette.text.secondary, fontSize: 20 }} />}
                  required={true}
                  placeholder={t('exactDatePlaceholder') || "Enter the date (e.g., 15/12/2023 or December 15, 2023)"}
                  theme={theme}
                  data-testid="exactDate"
                  error={!!fieldErrors.exactDate}
                  helperText={fieldErrors.exactDate || (getFoundLostType(values.foundLost) === 'LOST' 
                    ? t('exactDateLostPlaceholder') 
                    : t('exactDateFoundPlaceholder'))}
                  onErrorClear={clearFieldError}
                />

                {/* Section Divider */}
                <Slide direction="right" in timeout={1000}>
                  <Divider 
                    sx={{ 
                      my: 4,
                      '&::before, &::after': {
                        borderColor: theme.palette.mode === 'dark' 
                          ? 'rgba(76, 175, 80, 0.3)' 
                          : 'rgba(46, 125, 50, 0.3)'
                      }
                    }}
                  />
                </Slide>

                {/* Item Details Section */}
                <Fade in timeout={1000}>
                  <Box>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: 700, 
                        color: theme.palette.mode === 'dark' ? '#4CAF50' : '#2E7D32',
                        fontSize: '1.4rem',
                        mb: 2,
                        textShadow: theme.palette.mode === 'dark' ? '0 1px 2px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,0.1)',
                        position: 'relative',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          bottom: -8,
                          left: 0,
                          width: '40px',
                          height: '3px',
                          background: theme.palette.mode === 'dark'
                            ? 'linear-gradient(90deg, #4CAF50 0%, #66BB6A 100%)'
                            : 'linear-gradient(90deg, #2E7D32 0%, #388E3C 100%)',
                          borderRadius: '2px',
                          opacity: 0.8
                        }
                      }}
                    >
                      {t('itemDetails')}
                    </Typography>
                  </Box>
                </Fade>

                <EnhancedTextField
                  name="description"
                  label={`${t('description')} (${t('optional')})`}
                  icon={<DescriptionIcon sx={{ color: theme.palette.text.secondary, fontSize: 20 }} />}
                  required={false}
                  multiline={true}
                  rows={4}
                  placeholder={t('descriptionPlaceholder')}
                  theme={theme}
                  helperText={getFoundLostType(values.foundLost) === 'LOST' 
                    ? (t('descriptionOptionalLostMessage') || "Description is optional but recommended when you don't have an image of the lost item.")
                    : (t('descriptionOptionalFoundMessage') || "Description is optional. You can add an image instead, or provide both for better identification.")}
                />

                {/* Section Divider */}
                <Slide direction="right" in timeout={1200}>
                  <Divider 
                    sx={{ 
                      my: 4,
                      '&::before, &::after': {
                        borderColor: theme.palette.mode === 'dark' 
                          ? 'rgba(76, 175, 80, 0.3)' 
                          : 'rgba(46, 125, 50, 0.3)'
                      }
                    }}
                  />
                </Slide>

                {/* Contact Information Section */}
                <Fade in timeout={1200}>
                  <Box>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: 700, 
                        color: theme.palette.mode === 'dark' ? '#4CAF50' : '#2E7D32',
                        fontSize: '1.4rem',
                        mb: 2,
                        textShadow: theme.palette.mode === 'dark' ? '0 1px 2px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,0.1)',
                        position: 'relative',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          bottom: -8,
                          left: 0,
                          width: '40px',
                          height: '3px',
                          background: theme.palette.mode === 'dark'
                            ? 'linear-gradient(90deg, #4CAF50 0%, #66BB6A 100%)'
                            : 'linear-gradient(90deg, #2E7D32 0%, #388E3C 100%)',
                          borderRadius: '2px',
                          opacity: 0.8
                        }
                      }}
                    >
                      {t('contactInformation')}
                    </Typography>
                  </Box>
                </Fade>

                <EnhancedTextField
                  name="contact"
                  label={t('phoneNumber')}
                  icon={<PhoneIcon sx={{ color: theme.palette.text.secondary, fontSize: 20 }} />}
                  required={true}
                  placeholder={t('phoneNumberPlaceholder') || "Enter your phone number"}
                  theme={theme}
                  data-testid="contact"
                  error={!!fieldErrors.contact}
                  helperText={fieldErrors.contact || (getFoundLostType(values.foundLost) === 'LOST'
                    ? currentLanguage === 'ar' 
                      ? 'سنقوم بالتواصل معك عبر هذا الرقم في حالة العثور على عنصرك المفقود من قبل شخص آخر'
                      : currentLanguage === 'fr'
                        ? 'Nous vous contacterons via ce numéro si quelqu\'un trouve votre objet perdu'
                        : 'We will contact you through this number if someone finds your lost item'
                    : currentLanguage === 'ar' 
                      ? 'سنقوم بالتواصل معك عبر هذا الرقم في حالة تواصل مالك العنصر معنا'
                      : currentLanguage === 'fr'
                        ? 'Nous vous contacterons via ce numéro si le propriétaire de l\'objet nous contacte'
                        : 'We will contact you through this number if the item owner contacts us')}
                  onErrorClear={clearFieldError}
                />

                {/* Section Divider */}
                <Slide direction="right" in timeout={1400}>
                  <Divider 
                    sx={{ 
                      my: 4,
                      '&::before, &::after': {
                        borderColor: theme.palette.mode === 'dark' 
                          ? 'rgba(76, 175, 80, 0.3)' 
                          : 'rgba(46, 125, 50, 0.3)'
                      }
                    }}
                  />
                </Slide>

                {/* Image Section */}
                <Fade in timeout={1400}>
                  <Box>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: 700, 
                        color: theme.palette.mode === 'dark' ? '#4CAF50' : '#2E7D32',
                        fontSize: '1.4rem',
                        mb: 2,
                        textShadow: theme.palette.mode === 'dark' ? '0 1px 2px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,0.1)',
                        position: 'relative',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          bottom: -8,
                          left: 0,
                          width: '40px',
                          height: '3px',
                          background: theme.palette.mode === 'dark'
                            ? 'linear-gradient(90deg, #4CAF50 0%, #66BB6A 100%)'
                            : 'linear-gradient(90deg, #2E7D32 0%, #388E3C 100%)',
                          borderRadius: '2px',
                          opacity: 0.8
                        }
                      }}
                    >
                      {t('itemImage')}
                    </Typography>
                  </Box>
                </Fade>

                <FieldContainer 
                  icon={<PhotoCamera sx={{ color: theme.palette.text.secondary, fontSize: 20 }} />}
                  label={`${t('itemImage')} (${t('optional')})`}
                  error={false}
                  helperText={t('imageOptionalMessage')}
                  required={false}
                  theme={theme}
                >
                  
                  {/* Current Image Display */}
                  {imagePreview && (
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
                          image={imagePreview}
                          alt="Selected item image"
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
                              label={t('newImage') || 'New Image'}
                              color="primary"
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

                  {/* Enhanced Image Upload Controls */}
                  <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                    <Button
                      variant="contained"
                      component="label"
                      startIcon={isCompressing ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <CloudUploadIcon sx={{ color: 'white' }} />}
                      disabled={isCompressing}
                      sx={{ 
                        textTransform: 'none', 
                        borderRadius: 3,
                        px: 4,
                        py: 2,
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: 'white',
                        background: theme.palette.mode === 'dark'
                          ? 'linear-gradient(45deg, #4CAF50 30%, #66BB6A 90%)'
                          : 'linear-gradient(45deg, #2E7D32 30%, #388E3C 90%)',
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: '-100%',
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                          transition: 'left 0.5s ease-in-out'
                        },
                        '&:hover': {
                          background: theme.palette.mode === 'dark'
                            ? 'linear-gradient(45deg, #388E3C 30%, #4CAF50 90%)'
                            : 'linear-gradient(45deg, #1B5E20 30%, #2E7D32 90%)',
                          transform: 'translateY(-2px) scale(1.02)',
                          boxShadow: theme.palette.mode === 'dark'
                            ? '0 8px 25px rgba(76, 175, 80, 0.4)'
                            : '0 8px 25px rgba(46, 125, 50, 0.4)',
                          '&::before': {
                            left: '100%'
                          }
                        },
                        '&:active': {
                          transform: 'translateY(0) scale(0.98)'
                        },
                        '&:disabled': {
                          background: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.3)' : 'rgba(46, 125, 50, 0.3)',
                          color: 'rgba(255,255,255,0.5)',
                          transform: 'none',
                          '&::before': {
                            display: 'none'
                          }
                        },
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: theme.palette.mode === 'dark'
                          ? '0 4px 12px rgba(76, 175, 80, 0.3)'
                          : '0 4px 12px rgba(46, 125, 50, 0.3)',
                      }}
                    >
                      {isCompressing ? t('compressingImage') : imagePreview ? t('replaceImage') : t('chooseFile')}
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
                  
                </FieldContainer>
                
                <Box 
                  mt={6} 
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
                      padding: '12px 24px',
                      fontSize: '1rem',
                      fontWeight: 600,
                      borderRadius: 3,
                      background: 'linear-gradient(45deg, #4A8BFF 30%, #1A6EEE 90%)',
                      color: '#fff',
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: '0 4px 15px rgba(26, 110, 238, 0.3)',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: '-100%',
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                        transition: 'left 0.6s ease-in-out'
                      },
                      '&:hover': {
                        background: 'linear-gradient(45deg, #5A9BFF 30%, #2A7EFF 90%)',
                        boxShadow: '0 8px 25px rgba(26, 110, 238, 0.4)',
                        transform: 'translateY(-2px) scale(1.02)',
                        '&::before': {
                          left: '100%'
                        }
                      },
                      '&:active': {
                        transform: 'translateY(0) scale(0.98)'
                      },
                      '&:disabled': {
                        background: theme.palette.mode === 'dark' ? 'rgba(74, 139, 255, 0.3)' : 'rgba(26, 110, 238, 0.3)',
                        color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.7)',
                        transform: 'none',
                        boxShadow: 'none',
                        '&::before': {
                          display: 'none'
                        }
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
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(45deg, #4CAF50 30%, #66BB6A 90%)'
                  : 'linear-gradient(45deg, #2E7D32 30%, #388E3C 90%)',
                '&:hover': {
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(45deg, #388E3C 30%, #4CAF50 90%)'
                    : 'linear-gradient(45deg, #1B5E20 30%, #2E7D32 90%)',
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
