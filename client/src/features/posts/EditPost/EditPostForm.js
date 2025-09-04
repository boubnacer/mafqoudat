import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useUpdatePostMutation, useDeletePostMutation } from "../postsApiSlice";
import * as Yup from "yup";
import { Formik, Form } from "formik";
import Textfield from "../../../components/Textfield";
import SubmitButton from "../../../components/SubmitButton";
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
  InputLabel,
  FormControlLabel,
  Checkbox,
  TextField,
  Divider
} from "@mui/material";
import { ContactPhone, ContactMail, WhatsApp } from '@mui/icons-material';
import { useTranslation } from "../../../utils/translations";

const EditPostForm = ({ post, user, countries, flOptions, categories, cities }) => {
  const [updatePost, { isLoading, isSuccess, isError, error }] = useUpdatePostMutation();
  const [deletePost, { isSuccess: isDelSuccess, isError: isDelError, error: delerror }] = useDeletePostMutation();
  const { t, currentLanguage } = useTranslation();

  const navigate = useNavigate();
  const theme = useTheme();
  
  // State for cities
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [availableCities, setAvailableCities] = useState(cities || []);
  const [loadingCities, setLoadingCities] = useState(false);

  useEffect(() => {
    if (isSuccess || isDelSuccess) {
      navigate("/dash");
    }
  }, [isSuccess, isDelSuccess, navigate]);

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

  // Update cities when country changes
  useEffect(() => {
    if (selectedCountry) {
      fetchCitiesByCountry(selectedCountry._id);
    }
  }, [selectedCountry]);

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

  const handleCountrySelect = (event, setFieldValue) => {
    const countryId = event.target.value;
    const country = countries.find(c => c._id === countryId);
    setSelectedCountry(country);
    
    // Update form value
    setFieldValue('country', countryId);
    
    // Reset cities when country changes
    setAvailableCities([]);
    
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
    return city ? (city.label || city.code || city.name || 'Unknown City') : cityId;
  };

  // Debug: Log the post data to see what we're receiving
  console.log('🔍 EditPostForm - Post data received:', post);
  console.log('🔍 EditPostForm - Post country:', post?.country);
  console.log('🔍 EditPostForm - Post category:', post?.category);
  console.log('🔍 EditPostForm - Post foundLost:', post?.foundLost);
  console.log('🔍 EditPostForm - Post contact:', post?.contact);
  console.log('🔍 EditPostForm - Post exactLocation:', post?.exactLocation);
  console.log('🔍 EditPostForm - Post exactDate:', post?.exactDate);

  // Initialize form state with existing post data
  const initialFormState = {
    country: post?.country || "",
    contact: post?.contact || "",
    category: post?.category || "",
    foundLost: post?.foundLost || "",
    city: post?.city || "",
    exactLocation: post?.exactLocation || "",
    exactDate: post?.exactDate ? new Date(post.exactDate).toISOString().split('T')[0] : "",
    description: post?.description || "",
    // Contact preferences
    contactPreferences: {
      phone: post?.contactPreferences?.phone ?? true,
      email: post?.contactPreferences?.email ?? false,
      whatsapp: post?.contactPreferences?.whatsapp ?? false
    },
    // Additional contact
    additionalContact: {
      phone: post?.additionalContact?.phone || "",
      email: post?.additionalContact?.email || "",
      whatsapp: post?.additionalContact?.whatsapp || ""
    },
    // Status fields
    status: post?.status || "active",
    returned: post?.returned || false
  };

  console.log('🔍 EditPostForm - Initial form state:', initialFormState);

  const formValidation = Yup.object().shape({
    country: Yup.string().required(t('country') + " " + t('required')),
    contact: Yup.string().required(t('contact') + " " + t('required')),
    category: Yup.string().required(t('category') + " " + t('required')),
    foundLost: Yup.string().required(t('foundOrLost') + " " + t('required')),
    city: Yup.string().required(t('city') + " " + t('required')),
    exactLocation: Yup.string().required(t('exactLocation') + " " + t('required')),
    exactDate: Yup.date().required(t('exactDate') + " " + t('required')),
    description: Yup.string().optional(),
    contactPreferences: Yup.object().shape({
      phone: Yup.boolean(),
      email: Yup.boolean(),
      whatsapp: Yup.boolean()
    }),
    additionalContact: Yup.object().shape({
      phone: Yup.string().optional(),
      email: Yup.string().email().optional(),
      whatsapp: Yup.string().optional()
    }),
    status: Yup.string().oneOf(['active', 'resolved', 'expired', 'suspended']),
    returned: Yup.boolean()
  });

  const handleSubmit = async (values, { setSubmitting, setStatus }) => {
    try {
      setSubmitting(true);
      setStatus(null);

      // Prepare the data for submission
      const submitData = {
        ...values,
        user: user.id,
        id: post._id,
        // Convert date to proper format
        exactDate: new Date(values.exactDate)
      };

      await updatePost(submitData).unwrap();
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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>{t('loadingPostData')}</Typography>
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
        background: theme.palette.background.default
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
          variant="h4" 
          gutterBottom 
          textAlign="center" 
          sx={{ 
            color: theme.palette.textColor.main,
            mb: 4,
            fontWeight: 600
          }}
        >
          {t('editPost')}
        </Typography>

        <Formik
          initialValues={initialFormState}
          validationSchema={formValidation}
          onSubmit={handleSubmit}
          enableReinitialize={true}
        >
          {({ isSubmitting, status, setFieldValue, values }) => (
            <Form>
              {status && (
                <Alert severity={status.type === 'error' ? 'error' : 'success'} sx={{ mb: 3 }}>
                  {status.message}
                </Alert>
              )}
              
              <Box display="flex" flexDirection="column" gap={3}>
                {/* Basic Information Section */}
                <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                  {t('basicInformation')}
                </Typography>

                <Box>
                  <FormLabel htmlFor="foundLost" sx={{ mb: 1, display: "block", fontWeight: 500 }}>
                    {t('foundOrLost')} *
                  </FormLabel>
                  <SelectOption name="foundLost" options={flOptions} />
                </Box>

                <Box>
                  <FormLabel htmlFor="country" sx={{ mb: 1, display: "block", fontWeight: 500 }}>
                    {t('country')} *
                  </FormLabel>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                    {getFoundLostType(values.foundLost) === 'LOST' 
                      ? t('chooseCountryLost') 
                      : t('chooseCountryFound')
                    }
                  </Typography>
                  <FormControl fullWidth>
                    <InputLabel id="country-select-label">{t('chooseCountry')}</InputLabel>
                    <Select
                      labelId="country-select-label"
                      value={values.country || ""}
                      label={t('chooseCountry')}
                      onChange={(e) => handleCountrySelect(e, setFieldValue)}
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
                  <FormLabel htmlFor="category" sx={{ mb: 1, display: "block", fontWeight: 500 }}>
                    {t('category')} *
                  </FormLabel>
                  <SelectOption name="category" options={categories} />
                </Box>

                {/* Location Section */}
                <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                  {t('location')}
                </Typography>

                <Box>
                  <FormLabel htmlFor="city" sx={{ mb: 1, display: "block", fontWeight: 500 }}>
                    {t('city')} *
                  </FormLabel>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                    {!selectedCountry 
                      ? t('selectCountryFirst') 
                      : loadingCities 
                        ? t('loadingCities') 
                        : availableCities.length === 0 
                          ? t('noCitiesFound') 
                          : t('selectCity')
                    }
                  </Typography>
                  
                  <FormControl fullWidth disabled={!selectedCountry || loadingCities}>
                    <InputLabel id="city-select-label">{t('chooseCity')}</InputLabel>
                    <Select
                      labelId="city-select-label"
                      value={values.city || ""}
                      label={t('chooseCity')}
                      onChange={(e) => setFieldValue('city', e.target.value)}
                      displayEmpty
                      renderValue={(selected) => {
                        if (!selected) return t('chooseCity');
                        return getCityDisplayName(selected);
                      }}
                      disableUnderline
                      sx={{
                        borderRadius: 2,
                      }}
                    >
                      {availableCities.map((city) => (
                        <MenuItem key={city.id} value={city.id}>
                          <Box display="flex" alignItems="center" gap={1}>
                            {city.isCapital && (
                              <span style={{ fontSize: '16px' }}>🏛️</span>
                            )}
                            {city.label || city.code || city.name || 'Unknown City'}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Box>
                  <FormLabel htmlFor="exactDate" sx={{ mb: 1, display: "block", fontWeight: 500 }}>
                    {t('exactDate')} *
                  </FormLabel>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
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
                    onChange={(e) => setFieldValue('exactDate', e.target.value)}
                    sx={{
                      borderRadius: 2,
                    }}
                  />
                </Box>

                <Box>
                  <FormLabel htmlFor="exactLocation" sx={{ mb: 1, display: "block", fontWeight: 500 }}>
                    {t('exactLocation')} *
                  </FormLabel>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
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
                <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                  {t('itemDetails')}
                </Typography>

                <Box>
                  <FormLabel htmlFor="description" sx={{ mb: 1, display: "block", fontWeight: 500 }}>
                    {t('description')} ({t('optional')})
                  </FormLabel>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                    {getFoundLostType(values.foundLost) === 'LOST' 
                      ? t('descriptionLostPlaceholder') 
                      : t('descriptionFoundPlaceholder')
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
                <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                  {t('contactInformation')}
                </Typography>

                <Box>
                  <FormLabel htmlFor="contact" sx={{ mb: 1, display: "block", fontWeight: 500 }}>
                    {t('contact')} *
                  </FormLabel>
                  <Textfield name="contact" variant="outlined" />
                </Box>

                <Box>
                  <FormLabel sx={{ mb: 1, display: "block", fontWeight: 500 }}>
                    {t('contactPreferences')}
                  </FormLabel>
                  <Box display="flex" flexDirection="column" gap={1}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={values.contactPreferences.phone}
                          onChange={(e) => setFieldValue('contactPreferences.phone', e.target.checked)}
                        />
                      }
                      label={
                        <Box display="flex" alignItems="center" gap={1}>
                          <ContactPhone fontSize="small" />
                          {t('phoneContact')}
                        </Box>
                      }
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={values.contactPreferences.email}
                          onChange={(e) => setFieldValue('contactPreferences.email', e.target.checked)}
                        />
                      }
                      label={
                        <Box display="flex" alignItems="center" gap={1}>
                          <ContactMail fontSize="small" />
                          {t('emailContact')}
                        </Box>
                      }
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={values.contactPreferences.whatsapp}
                          onChange={(e) => setFieldValue('contactPreferences.whatsapp', e.target.checked)}
                        />
                      }
                      label={
                        <Box display="flex" alignItems="center" gap={1}>
                          <WhatsApp fontSize="small" />
                          {t('whatsappContact')}
                        </Box>
                      }
                    />
                  </Box>
                </Box>

                {/* Additional Contact Details */}
                {(values.contactPreferences.email || values.contactPreferences.phone || values.contactPreferences.whatsapp) && (
                  <Box>
                    <FormLabel sx={{ mb: 1, display: "block", fontWeight: 500 }}>
                      {t('additionalContactDetails')}
                    </FormLabel>
                    <Box display="flex" flexDirection="column" gap={2}>
                      {values.contactPreferences.phone && (
                        <Textfield 
                          name="additionalContact.phone" 
                          variant="outlined" 
                          placeholder={t('phoneNumber')}
                        />
                      )}
                      {values.contactPreferences.email && (
                        <Textfield 
                          name="additionalContact.email" 
                          variant="outlined" 
                          placeholder={t('emailAddress')}
                        />
                      )}
                      {values.contactPreferences.whatsapp && (
                        <Textfield 
                          name="additionalContact.whatsapp" 
                          variant="outlined" 
                          placeholder={t('whatsappNumber')}
                        />
                      )}
                    </Box>
                  </Box>
                )}

                {/* Status Section */}
                <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                  {t('status')}
                </Typography>

                <Box>
                  <FormLabel htmlFor="status" sx={{ mb: 1, display: "block", fontWeight: 500 }}>
                    {t('postStatus')}
                  </FormLabel>
                  <FormControl fullWidth>
                    <Select
                      name="status"
                      value={values.status}
                      onChange={(e) => setFieldValue('status', e.target.value)}
                      variant="outlined"
                    >
                      <MenuItem value="active">{t('active')}</MenuItem>
                      <MenuItem value="resolved">{t('resolved')}</MenuItem>
                      <MenuItem value="expired">{t('expired')}</MenuItem>
                      <MenuItem value="suspended">{t('suspended')}</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <FormControlLabel
                  control={
                    <Checkbox
                      name="returned"
                      checked={values.returned}
                      onChange={(e) => setFieldValue('returned', e.target.checked)}
                    />
                  }
                  label={t('itemReturned')}
                />

                {/* Action Buttons */}
                <Box display="flex" gap={2} justifyContent="space-between" sx={{ mt: 4 }}>
                  <Button 
                    onClick={handleDeletePost}
                    variant="outlined" 
                    color="error"
                    disabled={isLoading}
                    sx={{ 
                      minWidth: 120,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600
                    }}
                  >
                    {t('deletePost')}
                  </Button>
                  
                  <SubmitButton 
                    disabled={isLoading || !selectedCountry || !values.city || !values.exactDate}
                    sx={{ 
                      minWidth: 120,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      py: 1.5
                    }}
                  >
                    {isLoading ? <CircularProgress size={20} /> : t('updatePost')}
                  </SubmitButton>
                </Box>
              </Box>
            </Form>
          )}
        </Formik>
      </Paper>
    </Box>
  );
};

export default EditPostForm;