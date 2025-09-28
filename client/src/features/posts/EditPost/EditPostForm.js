import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUpdatePostMutation, useDeletePostMutation } from "../postsApiSlice";
import { useSelector } from "react-redux";
import { selectCurrentToken } from "../../auth/authSlice";
import * as Yup from "yup";
import { Formik, Form } from "formik";
import Textfield from "../../../components/Textfield";
import SelectOption from "../../../components/SelectOption";
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
  TextField
} from "@mui/material";
import { useTranslation } from "../../../utils/translations";
import useAuth from "../../../hooks/useAuth";

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
    if (post?.city && availableCities.length > 0 && setFieldValueCallback) {
      // Handle both object and string city formats
      const cityId = post.city?.id || post.city;
      // Check if the post city exists in available cities
      const cityExists = availableCities.find(city => city.id === cityId);
      if (cityExists) {
        setFieldValueCallback('city', cityId);
      }
    }
  }, [post?.city, availableCities, setFieldValueCallback]);

  // Update cities when country changes
  useEffect(() => {
    if (selectedCountry) {
      fetchCitiesByCountry(selectedCountry._id);
    }
  }, [selectedCountry, fetchCitiesByCountry]);

  // Re-fetch cities when language changes (with debouncing to prevent rate limits)
  useEffect(() => {
    if (selectedCountry?._id) {
      // Add a small delay to prevent multiple simultaneous API calls
      const timeoutId = setTimeout(() => {
        fetchCitiesByCountry(selectedCountry._id);
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  }, [fetchCitiesByCountry, selectedCountry?._id, currentLanguage]);

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
    
    // Clear the city field in the form
    setFieldValue('city', '');
    
    // Fetch cities for the selected country
    if (countryId) {
      fetchCitiesByCountry(countryId);
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

  // Initialize form state with existing post data
  const initialFormState = {
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
    city: post?.city?.id || post?.city || "",
    exactLocation: post?.exactLocation || "",
    exactDate: (() => {
      // Try multiple date fields in order of preference
      const dateFields = [
        { field: 'exactDate', value: post?.exactDate },
        { field: 'mainDate', value: post?.mainDate },
        { field: 'createdAt', value: post?.createdAt },
        { field: 'updatedAt', value: post?.updatedAt }
      ];
      
      for (const { field, value } of dateFields) {
        if (value) {
          try {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
              const formattedDate = date.toISOString().split('T')[0];
              return formattedDate;
            }
          } catch (error) {
            // Date conversion failed, continue to next field
          }
        }
      }
      
      return "";
    })(),
    description: post?.description || "",
    // image: null, // For new image uploads - temporarily disabled
    // Status fields
    status: post?.status || "active",
    returned: post?.returned || false
  };

  // Function to check if form has changed
  const checkFormChanged = (currentValues) => {
    const hasChanged = Object.keys(initialFormState).some(key => {
      return currentValues[key] !== initialFormState[key];
    });
    setHasFormChanged(hasChanged);
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

      setSubmitting(true);

      // Prepare form data for submission (like NewPostForm)
      const formData = new FormData();
      
      // Combine basic fields into a single JSON object to reduce field count
      const postData = {
        user: user._id,
        id: post._id,
        country: selectedCountry?._id || values.country,
        category: values.category,
        foundLost: values.foundLost,
        exactLocation: values.exactLocation,
        exactDate: values.exactDate,
        contact: values.contact,
        description: values.description || "",
        contactPreferences: { whatsapp: true }
      };
      
      // Handle city - simplified for database cities only
      postData.city = values.city;
      
      // Append combined data as single field
      const postDataString = JSON.stringify(postData);
      formData.append("postData", postDataString);
      
      // Only append image if present - temporarily disabled
      // if (values.image) {
      //   formData.append("image", values.image);
      // }

      await updatePost(formData).unwrap();
    } catch (error) {
      console.error('Update failed:', error);
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
    } catch (error) {
      console.error('Delete failed:', error);
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
                  ? 'rgba(76, 175, 80, 0.1)'
                  : 'rgba(76, 175, 80, 0.05)',
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
                        : currentLanguage === 'ar' 
                          ? 'اختر مدينتك أو أقرب مدينة رئيسية إليك (العاصمة، العمالة، المقاطعة أو الولاية)'
                          : currentLanguage === 'fr'
                            ? 'Sélectionnez votre ville ou la grande ville la plus proche (capitale, préfecture, province ou état)'
                            : 'Select your city or the nearest major city to you (capital, prefecture, province or state)'
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
                  
                  <FormControl fullWidth disabled={!selectedCountry || loadingCities} error={!!fieldErrors.city}>
                    <Select
                      name="city"
                      value={values.city || ""}
                      onChange={(e) => {
                        const selectedValue = e.target.value;
                          setFieldValue('city', selectedValue);
                          // Clear city field error if city is selected
                          if (selectedValue) {
                            clearFieldError('city');
                        }
                      }}
                      displayEmpty
                      data-testid="city-select"
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
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            maxHeight: 300,
                          }
                        }
                      }}
                    >
                      {availableCities.map((city) => (
                        <MenuItem key={city.id} value={city.id}>
                          {city.label || city.name || 'Unknown City'}
                        </MenuItem>
                      ))}
                    </Select>
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
                  </FormControl>
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
                  <TextField
                    name="exactDate"
                    type="date"
                    variant="outlined"
                    fullWidth
                    value={values.exactDate}
                    onChange={(e) => {
                      setFieldValue('exactDate', e.target.value);
                      // Clear field error if date is selected
                      if (e.target.value) {
                        clearFieldError('exactDate');
                      }
                    }}
                    data-testid="exactDate"
                    error={!!fieldErrors.exactDate}
                    helperText={fieldErrors.exactDate}
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

                {/* Image Section - Temporarily disabled */}
                {/* <Typography 
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
                </Typography> */}


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
                    disabled={isLoading || !selectedCountry || !values.city || !values.exactDate || !hasFormChanged}
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
                    {isLoading ? <CircularProgress size={24} color="inherit" /> : t('updatePost')}
                  </Button>
                </Box>
              </Box>
            </Form>
            );
          }}
        </Formik>
      </Paper>
      
      {/* Custom City Dialog - temporarily disabled */}
      {/* <Dialog>...</Dialog> */}
    </Box>
  );
};

export default EditPostForm;