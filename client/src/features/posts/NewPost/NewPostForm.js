import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAddNewPostMutation } from "../postsApiSlice";
import { useSelector } from "react-redux";
import { selectCurrentToken } from "../../auth/authSlice";
import * as Yup from "yup";
import { Formik, Form } from "formik";
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
  Divider
} from "@mui/material";
import { PhotoCamera, LocationOn, WhatsApp, Add as AddIcon } from '@mui/icons-material';
import { useTranslation } from "../../../utils/translations";
import PromotionDialog from "../../../components/PromotionDialog";

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
  const [selectedCityId, setSelectedCityId] = useState(null);
  const [selectKey, setSelectKey] = useState(0);
  const [forceCitySelection, setForceCitySelection] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState(null);
  const formikRef = useRef(null);

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
    customCityName: "",
    exactLocation: "",
    exactDate: new Date().toLocaleDateString(), // Default to current date as string
    description: "",
    image: null,
    additionalContact: {
      whatsapp: user.username || ""
    }
  };

  const formValidation = Yup.object().shape({
    contact: Yup.string().required(t('required')),
    category: Yup.string().required(t('required')),
    foundLost: Yup.string().required(t('required')),
    city: Yup.string()
      .required(t('cityRequired') || t('required'))
      .test('not-other', t('pleaseSelectCity') || 'Please select a city', function(value) {
        // Allow "other" if customCityName is provided
        if (value === 'other') {
          const customCityName = this.parent.customCityName;
          return customCityName && customCityName.trim() !== '';
        }
        return value !== 'other' && value !== '';
      }),
    customCityName: Yup.string().when('city', {
      is: 'other',
      then: (schema) => schema.required(t('customCityRequired') || 'Please enter a city name'),
      otherwise: (schema) => schema.notRequired()
    }),
    exactLocation: Yup.string().required(t('required')),
    exactDate: Yup.string().required(t('required')),
    description: Yup.string().optional(),
    image: Yup.mixed().nullable(),
  });

  const handleCountrySelect = (event) => {
    const countryId = event.target.value;
    const country = countries.find(c => c._id === countryId);
    setSelectedCountry(country);
    
    // Reset cities and selected city when country changes
    setCities([]);
    setShowCustomCityInput(false);
    setCustomCityName("");
    setForceCitySelection(null);
    setSelectKey(prev => prev + 1);
    
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

  const handleSubmit = async (values, { setSubmitting, setStatus }) => {
    try {
      // Store the submitted values to check if it's a lost item
      setLastSubmittedValues(values);
      
      
      // Handle custom city creation if city is "other"
      let finalCityId = values.city;
      if (values.city === 'other') {
        try {
          // Create the custom city
          const createdCity = await createCustomCity(values.customCityName.trim(), selectedCountry?._id);
          finalCityId = createdCity._id;
        } catch (error) {
          setStatus({ error: 'Failed to create custom city. Please try again.' });
          setSubmitting(false);
          return;
        }
      }
      
      const formData = new FormData();
      formData.append("user", user._id);
      formData.append("country", selectedCountry?._id || values.country);
      formData.append("category", values.category);
      formData.append("foundLost", values.foundLost);
      formData.append("city", finalCityId);
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
    if (!cityId) {
      console.log('🔍 DEBUG: getCityDisplayName - no cityId provided');
      return '';
    }
    
    console.log('🔍 DEBUG: getCityDisplayName called with:', { cityId, citiesCount: cities.length });
    
    // Handle custom city case - if it's "other" but we have a selected custom city
    if (cityId === "other" && selectedCustomCity) {
      console.log('🔍 DEBUG: getCityDisplayName - using selectedCustomCity:', selectedCustomCity);
      return selectedCustomCity;
    }
    
    // Find the city in the cities list
    const city = cities.find(c => c.id === cityId);
    if (city) {
      console.log('🔍 DEBUG: Found city in list:', { cityId, city, label: city.label });
      return city.label || city.code || city.name || 'Unknown City';
    }
    
    // If no city found in the list, it might be a custom city name or ID
    // This should not happen with the new implementation, but keeping as fallback
    console.log('🔍 DEBUG: City not found in list:', { 
      cityId, 
      citiesCount: cities.length,
      availableCities: cities.map(c => ({ id: c.id, label: c.label }))
    });
    return cityId;
  };

  // Handle "Other" city option
  const handleOtherCityClick = () => {
    setShowCustomCityInput(true);
    if (formikRef.current) {
      formikRef.current.setFieldValue('city', 'other');
      formikRef.current.setFieldValue('customCityName', '');
    }
  };

  // Handle custom city name change
  const handleCustomCityChange = (event) => {
    const value = event.target.value;
    setCustomCityName(value);
    if (formikRef.current) {
      formikRef.current.setFieldValue('customCityName', value);
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
      
      console.log(`Image compression: ${originalSize}MB → ${compressedSize}MB (${compressionRatio}% reduction)`);
      
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
            color: theme.palette.textColor.main,
            mb: 4,
            fontWeight: 600,
            fontSize: { xs: '1.8rem', md: '2.2rem' }
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
          {({ isSubmitting, status, setFieldValue, values, errors, touched }) => {
            
            return (
            <Form>
              {status?.error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {status.error}
                </Alert>
              )}
              
              <Box display="flex" flexDirection="column" gap={3}>
                {/* Basic Information Section */}
                <Typography variant="h5" sx={{ fontWeight: 600, color: theme.palette.primary.main, fontSize: '1.3rem' }}>
                  {t('basicInformation')}
                </Typography>

                <Box>
                  <FormLabel htmlFor="foundLost" sx={{ mb: 1, display: "block", fontWeight: 500, fontSize: '1.1rem' }}>
                    {t('foundOrLost')} *
                  </FormLabel>
                  <SelectOption name="foundLost" options={flOptions} />
                </Box>

                <Box>
                  <FormLabel htmlFor="country" sx={{ mb: 1, display: "block", fontWeight: 500, fontSize: '1.1rem' }}>
                    {t('country')} *
                  </FormLabel>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block", fontSize: '0.95rem' }}>
                    {getFoundLostType(values.foundLost) === 'LOST' 
                      ? t('chooseCountryLost') 
                      : t('chooseCountryFound')
                    }
                  </Typography>
                  <FormControl fullWidth>
                    <InputLabel id="country-select-label">{t('chooseCountry')}</InputLabel>
                    <Select
                      labelId="country-select-label"
                      value={selectedCountry?._id || ""}
                      label={t('chooseCountry')}
                      onChange={handleCountrySelect}
                      disableUnderline
                      sx={{
                        borderRadius: 2,
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
                  </FormControl>
                </Box>

                <Box>
                  <FormLabel htmlFor="category" sx={{ mb: 1, display: "block", fontWeight: 500, fontSize: '1.1rem' }}>
                    {t('category')} *
                  </FormLabel>
                  <SelectOption name="category" options={categories} />
                </Box>

                {/* Location Section */}
                <Typography variant="h5" sx={{ fontWeight: 600, color: theme.palette.primary.main, fontSize: '1.3rem' }}>
                  {t('location')}
                </Typography>

                <Box>
                  <FormLabel htmlFor="city" sx={{ mb: 1, display: "block", fontWeight: 500, fontSize: '1.1rem' }}>
                    {t('city')} *
                  </FormLabel>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block", fontSize: '0.95rem' }}>
                    {!selectedCountry 
                      ? t('selectCountryFirst') 
                      : loadingCities 
                        ? t('loadingCities') 
                        : cities.length === 0 
                          ? t('noCitiesFound') 
                          : t('selectCity')
                    }
                  </Typography>
                  
                  <FormControl fullWidth disabled={!selectedCountry || loadingCities} error={!!errors.city}>
                    <InputLabel id="city-select-label">{t('chooseCity')}</InputLabel>
                    <Select
                      key={selectKey}
                      labelId="city-select-label"
                      value={forceCitySelection || values.city || ""}
                      label={t('chooseCity')}
                      onClose={() => {
                        console.log('🔍 DEBUG: Select closed, final value:', values.city || "");
                      }}
                      onOpen={() => {
                        console.log('🔍 DEBUG: Select opened, current value:', values.city || "");
                        console.log('🔍 DEBUG: Cities list:', cities.map(c => ({ id: c.id, label: c.label })));
                      }}
                      onChange={(e) => {
                        console.log('🔍 DEBUG: Select onChange triggered with value:', e.target.value);
                        if (e.target.value === 'other') {
                          // Don't set the field to "other", just open the dialog
                          console.log('🔍 DEBUG: "other" option selected, opening dialog');
                          handleOtherCityClick();
                        } else {
                          console.log('🔍 DEBUG: City selected:', e.target.value);
                          setFieldValue('city', e.target.value);
                          setForceCitySelection(null); // Clear force selection
                          console.log('🔍 DEBUG: After setting city, form values:', formikRef.current?.values);
                        }
                      }}
                      displayEmpty
                      renderValue={(selected) => {
                        if (!selected) {
                          console.log('🔍 DEBUG: renderValue - no selection, showing placeholder');
                          return t('chooseCity');
                        }
                        const displayName = getCityDisplayName(selected);
                        console.log('🔍 DEBUG: renderValue called:', { 
                          selected, 
                          displayName,
                          citiesCount: cities.length,
                          availableCityIds: cities.map(c => c.id)
                        });
                        return displayName;
                      }}
                      disableUnderline
                      sx={{
                        borderRadius: 2,
                      }}
                    >
                      {cities.map((city) => (
                        <MenuItem key={city.id} value={city.id}>
                          <Box display="flex" alignItems="center" gap={1}>
                            {city.isCapital && (
                              <span style={{ fontSize: '16px' }}>🏛️</span>
                            )}
                            {city.isDynamic && (
                              <span style={{ fontSize: '16px' }}>🆕</span>
                            )}
                            {city.label || city.code || city.name || 'Unknown City'}
                          </Box>
                        </MenuItem>
                      ))}
                      <Divider />
                      <MenuItem
                        value="other" 
                        sx={{ 
                          color: theme.palette.mode === 'dark' ? '#fff' : '#1976d2',
                          fontWeight: 600,
                          backgroundColor: theme.palette.mode === 'dark' 
                            ? 'rgba(255, 255, 255, 0.08)' 
                            : 'rgba(25, 118, 210, 0.08)',
                          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(25, 118, 210, 0.3)'}`,
                          borderRadius: 2,
                          margin: '6px 8px',
                          padding: '12px 16px',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            backgroundColor: theme.palette.mode === 'dark' 
                              ? 'rgba(255, 255, 255, 0.12)' 
                              : 'rgba(25, 118, 210, 0.12)',
                            borderColor: theme.palette.mode === 'dark' 
                              ? 'rgba(255, 255, 255, 0.4)' 
                              : 'rgba(25, 118, 210, 0.5)',
                            transform: 'translateY(-1px)',
                            boxShadow: theme.palette.mode === 'dark'
                              ? '0 4px 8px rgba(0, 0, 0, 0.3)'
                              : '0 4px 8px rgba(25, 118, 210, 0.2)',
                          }
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={1}>
                          <AddIcon fontSize="small" />
                          {t('other')} - {t('addNewCity')}
                        </Box>
                      </MenuItem>
                    </Select>
                    {errors.city && (
                      <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                        {errors.city}
                      </Typography>
                    )}
                  </FormControl>
                  
                  {/* Custom City Input Field */}
                  {showCustomCityInput && (
                    <Box sx={{ mt: 2 }}>
                      <FormLabel htmlFor="customCityName" sx={{ mb: 1, display: "block", fontWeight: 500, fontSize: '1.1rem' }}>
                        {t('enterCityName')} *
                      </FormLabel>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block", fontSize: '0.95rem' }}>
                        {t('customCityDescription') || 'Enter the name of the city you want to add'}
                      </Typography>
                      <Textfield 
                        name="customCityName" 
                        variant="outlined" 
                        placeholder={t('cityNamePlaceholder') || "Enter city name"}
                        value={customCityName}
                        onChange={handleCustomCityChange}
                      />
                      {errors.customCityName && (
                        <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                          {errors.customCityName}
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>

                <Box>
                  <FormLabel htmlFor="exactDate" sx={{ mb: 1, display: "block", fontWeight: 500, fontSize: '1.1rem' }}>
                    {t('exactDate')} *
                  </FormLabel>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block", fontSize: '0.95rem' }}>
                    {getFoundLostType(values.foundLost) === 'LOST' 
                      ? t('exactDateLostPlaceholder') 
                      : t('exactDateFoundPlaceholder')
                    }
                  </Typography>
                  <Textfield 
                    name="exactDate" 
                    variant="outlined" 
                    placeholder={t('exactDatePlaceholder') || "Enter the date (e.g., 15/12/2023 or December 15, 2023)"}
                  />
                </Box>

                <Box>
                  <FormLabel htmlFor="exactLocation" sx={{ mb: 1, display: "block", fontWeight: 500, fontSize: '1.1rem' }}>
                    {t('exactLocation')} *
                  </FormLabel>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block", fontSize: '0.95rem' }}>
                    {getFoundLostType(values.foundLost) === 'LOST' 
                      ? t('exactLocationLostPlaceholder') 
                      : t('exactLocationFoundPlaceholder')
                    }
                  </Typography>
                  <Textfield 
                    name="exactLocation" 
                    variant="outlined" 
                    placeholder={t('exactLocationPlaceholder')}
                  />
                </Box>

                {/* Item Details Section */}
                <Typography variant="h5" sx={{ fontWeight: 600, color: theme.palette.primary.main, fontSize: '1.3rem' }}>
                  {t('itemDetails')}
                </Typography>

                <Box>
                  <FormLabel htmlFor="description" sx={{ mb: 1, display: "block", fontWeight: 500, fontSize: '1.1rem' }}>
                    {t('description')} ({t('optional')})
                  </FormLabel>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block", fontSize: '0.95rem' }}>
                    {getFoundLostType(values.foundLost) === 'LOST' 
                      ? t('descriptionLostPlaceholder') 
                      : t('descriptionFoundPlaceholder')
                    }
                  </Typography>
                  <Typography variant="caption" color="warning.main" sx={{ mb: 1, display: "block", fontStyle: "italic", fontSize: '0.95rem' }}>
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
                <Typography variant="h5" sx={{ fontWeight: 600, color: theme.palette.primary.main, fontSize: '1.3rem' }}>
                  {t('contactInformation')}
                </Typography>

                <Box>
                  <FormLabel htmlFor="contact" sx={{ mb: 1, display: "block", fontWeight: 500, fontSize: '1.1rem' }}>
                    {t('contact')} *
                  </FormLabel>
                  <Textfield name="contact" variant="outlined" />
                </Box>

                {/* WhatsApp Contact Details */}
                <Box>
                  <FormLabel sx={{ mb: 1, display: "block", fontWeight: 500, fontSize: '1.1rem' }}>
                    {t('whatsappContact')}
                  </FormLabel>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block", fontSize: '0.95rem' }}>
                    {getFoundLostType(values.foundLost) === 'LOST' 
                      ? (t('whatsappContactLostMessage') || "We'll use this WhatsApp number to contact you if someone finds your lost item.")
                      : (t('whatsappContactFoundMessage') || "We'll use this WhatsApp number to contact you if the owner of the found item wants to reach you.")
                    }
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
                <Typography variant="h5" sx={{ fontWeight: 600, color: theme.palette.primary.main, fontSize: '1.3rem' }}>
                  {t('itemImage')}
                </Typography>

                <Box>
                  <FormLabel htmlFor="image" sx={{ mb: 1, display: "block", fontWeight: 500, fontSize: '1.1rem' }}>
                    {t('addItemImage')} ({t('optional')})
                  </FormLabel>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Button
                      variant="contained"
                      component="label"
                      startIcon={isCompressing ? <CircularProgress size={16} color="inherit" /> : <PhotoCamera />}
                      disabled={isCompressing}
                      sx={{ 
                        textTransform: 'none', 
                        borderRadius: 2,
                        px: 3,
                        py: 1
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
                      <Typography variant="body2" color="text.secondary">
                        {selectedFileName}
                      </Typography>
                    )}
                    {compressionInfo && (
                      <Typography variant="caption" color="success.main" sx={{ display: "block", mt: 0.5 }}>
                        {t('compressionSuccess') || `Compressed: ${compressionInfo.originalSize}MB → ${compressionInfo.compressedSize}MB (${compressionInfo.compressionRatio}% smaller)`}
                      </Typography>
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block", fontSize: '0.95rem' }}>
                    {t('imageOptionalMessage')}
                  </Typography>
                </Box>
                
                <Box mt={4}>
                  <SubmitButton
                    disabled={isSubmitting || !selectedCountry || !values.city || !values.exactDate?.trim()}
                    sx={{ 
                      width: "100%",
                      py: 1.5,
                      fontSize: "1.2rem",
                      fontWeight: 600
                    }}
                  >
                    {isSubmitting ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      t('createPost')
                    )}
                  </SubmitButton>
                </Box>
              </Box>
            </Form>
            );
          }}
        </Formik>
      </Paper>
      
      
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
