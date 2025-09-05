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
  const [selectedCustomCity, setSelectedCustomCity] = useState("");
  const [shouldClearCityValue, setShouldClearCityValue] = useState(false);
  const [selectedCityId, setSelectedCityId] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isCreatingCity, setIsCreatingCity] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState(null);
  const [selectKey, setSelectKey] = useState(0);
  const [newlyCreatedCityId, setNewlyCreatedCityId] = useState(null);
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

  // Handle clearing city value when dialog is canceled
  useEffect(() => {
    if (shouldClearCityValue && formikRef.current) {
      formikRef.current.setFieldValue('city', "");
      setShouldClearCityValue(false);
    }
  }, [shouldClearCityValue]);

  // Handle newly created city selection
  useEffect(() => {
    if (newlyCreatedCityId && formikRef.current) {
      console.log('Selecting newly created city:', newlyCreatedCityId);
      formikRef.current.setFieldValue('city', newlyCreatedCityId);
      setSelectKey(prev => prev + 1);
      setNewlyCreatedCityId(null);
    }
  }, [newlyCreatedCityId]);








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

  const formValidation = Yup.object().shape({
    contact: Yup.string().required(t('required')),
    category: Yup.string().required(t('required')),
    foundLost: Yup.string().required(t('required')),
    city: Yup.string()
      .required(t('cityRequired') || t('required'))
      .test('not-other', t('pleaseSelectCity') || 'Please select a city', function(value) {
        return value !== 'other' && value !== '';
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
    
    // Reset cities when country changes
    setCities([]);
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
      
      // Prevent submission if city is still "other"
      if (values.city === 'other') {
        setStatus({ error: 'Please select a city or create a custom city' });
        setSubmitting(false);
        return;
      }
      
      const formData = new FormData();
      formData.append("user", user._id);
      formData.append("country", selectedCountry?._id || values.country);
      formData.append("category", values.category);
      formData.append("foundLost", values.foundLost);
      formData.append("city", values.city);
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
      console.log('No city ID provided to getCityDisplayName');
      return '';
    }
    
    console.log('Getting display name for city ID:', cityId, 'Available cities:', cities.length);
    console.log('Available cities:', cities.map(c => ({ _id: c._id, id: c.id, label: c.label })));
    
    // Handle custom city case - if it's "other" but we have a selected custom city
    if (cityId === "other" && selectedCustomCity) {
      console.log('Using selected custom city:', selectedCustomCity);
      return selectedCustomCity;
    }
    
    // Find the city in the cities list - check both _id and id
    const city = cities.find(c => (c._id === cityId) || (c.id === cityId));
    console.log('Found city for display:', city);
    
    if (city) {
      const displayName = city.label || city.code || city.name || 'Unknown City';
      console.log('Returning display name from cities list:', displayName);
      return displayName;
    }
    
    // Check if this is the last created city
    if (lastCreatedCity && (lastCreatedCity._id === cityId || lastCreatedCity.id === cityId)) {
      console.log('Using last created city for display:', lastCreatedCity);
      const displayName = lastCreatedCity.label || lastCreatedCity.code || lastCreatedCity.name || 'Unknown City';
      console.log('Returning display name from last created city:', displayName);
      return displayName;
    }
    
    // If no city found in the list, it might be a custom city name or ID
    // This should not happen with the new implementation, but keeping as fallback
    console.log('City not found in list, returning cityId as fallback:', cityId);
    return cityId;
  };

  // Handle "Other" city option
  const handleOtherCityClick = () => {
    setShowCustomCityInput(true);
    setCustomCityName("");
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
      console.log('Frontend received response:', data);
      
      if (data.success) {
        console.log('City creation successful, returning data:', data.data);
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
                      value={values.city || ""}
                      label={t('chooseCity')}
                      onChange={(e) => {
                        if (e.target.value === 'other') {
                          handleOtherCityClick();
                        } else {
                          setFieldValue('city', e.target.value);
                        }
                      }}
                      displayEmpty
                      renderValue={(selected) => {
                        if (!selected) {
                          return t('chooseCity');
                        }
                        return getCityDisplayName(selected);
                      }}
                      disableUnderline
                      sx={{
                        borderRadius: 2,
                      }}
                    >
                      {cities.map((city) => {
                        const cityId = city._id || city.id;
                        return (
                          <MenuItem key={cityId} value={cityId}>
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
                        );
                      })}
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
      
      {/* Custom City Dialog */}
      <Dialog
        open={showCustomCityInput}
        onClose={() => {
          if (!isCreatingCity) {
            setShowCustomCityInput(false);
            setCustomCityName("");
            setShouldClearCityValue(true);
          }
        }}
        maxWidth="sm"
        fullWidth
        sx={{ zIndex: 1300 }}
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: theme.palette.mode === 'dark' 
              ? 'rgba(30, 30, 30, 0.95)' 
              : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${theme.palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.1)' 
              : 'rgba(0, 0, 0, 0.1)'}`,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 8px 32px rgba(0, 0, 0, 0.4)'
              : '0 8px 32px rgba(0, 0, 0, 0.15)'
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
          <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
            {t('addNewCity')}
          </Typography>
          <IconButton
            onClick={() => {
              setShowCustomCityInput(false);
              setCustomCityName("");
              setShouldClearCityValue(true);
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
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
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
                  borderColor: theme.palette.primary.main,
                },
                '&.Mui-focused fieldset': {
                  borderColor: theme.palette.primary.main,
                },
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
              setShouldClearCityValue(true);
            }}
            disabled={isCreatingCity}
            sx={{ 
              borderRadius: 2,
              borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
              color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
              '&:hover': {
                borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)',
              }
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
                  
                  // Add the custom city to the cities list
                  const customCity = {
                    _id: createdCity._id,
                    id: createdCity._id,
                    label: createdCity.labels.en || createdCity.labels[currentLanguage] || customCityName.trim(),
                    code: createdCity.code,
                    isDynamic: true
                  };
                  
                  // Update cities list
                  setCities(prevCities => [...prevCities, customCity]);
                  
                  // Set the newly created city ID to trigger selection
                  setNewlyCreatedCityId(createdCity._id);
                  
                  // Close the dialog
                  setShowCustomCityInput(false);
                  setCustomCityName("");
                  
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
              borderRadius: 2,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
              }
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
