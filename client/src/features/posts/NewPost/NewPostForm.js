import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAddNewPostMutation } from "../postsApiSlice";
import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
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
import { PhotoCamera, LocationOn, ContactPhone, ContactMail, WhatsApp, Add as AddIcon } from '@mui/icons-material';
import { useTranslation } from "../../../utils/translations";
import PromotionDialog from "../../../components/PromotionDialog";

const NewPostForm = ({ user, countries, categories, flOptions }) => {
  const [addNewPost, { isLoading, isSuccess, isError, error }] = useAddNewPostMutation();
  const { t, currentLanguage } = useTranslation();
  
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
    exactDate: new Date().toISOString().split('T')[0], // Default to today's date
    description: "",
    image: null,
    contactPreferences: {
      phone: true,
      email: false,
      whatsapp: false
    },
    additionalContact: {
      phone: "",
      email: "",
      whatsapp: ""
    }
  };

  const formValidation = Yup.object().shape({
    contact: Yup.string().required(t('required')),
    category: Yup.string().required(t('required')),
    foundLost: Yup.string().required(t('required')),
    city: Yup.string().required(t('required')),
    exactLocation: Yup.string().required(t('required')),
    exactDate: Yup.date().required(t('required')),
    description: Yup.string().optional(),
    image: Yup.mixed().nullable(),
  });

  const handleCountrySelect = (event) => {
    const countryId = event.target.value;
    const country = countries.find(c => c._id === countryId);
    setSelectedCountry(country);
    
    // Reset cities when country changes
    setCities([]);
    
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
      const responseText = await response.text();
      const data = JSON.parse(responseText);
      
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
      formData.append("contactPreferences", JSON.stringify(values.contactPreferences));
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

  // Handle "Other" city option
  const handleOtherCityClick = () => {
    setShowCustomCityInput(true);
    setCustomCityName("");
  };

  // Handle custom city name change
  const handleCustomCityChange = (event) => {
    setCustomCityName(event.target.value);
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
          {t('createNewPost')}
        </Typography>

        <Formik
          initialValues={initialFormState}
          validationSchema={formValidation}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, status, setFieldValue, values }) => (
            <Form>
              {status?.error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {status.error}
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
                        : cities.length === 0 
                          ? t('noCitiesFound') 
                          : t('selectCity')
                    }
                  </Typography>
                  
                  {!showCustomCityInput ? (
                    <FormControl fullWidth disabled={!selectedCountry || loadingCities}>
                      <InputLabel id="city-select-label">{t('chooseCity')}</InputLabel>
                      <Select
                        labelId="city-select-label"
                        value={values.city || ""}
                        label={t('chooseCity')}
                        onChange={(e) => setFieldValue('city', e.target.value)}
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
                              {city.label}
                            </Box>
                          </MenuItem>
                        ))}
                        <Divider />
                        <MenuItem 
                          value="other" 
                          onClick={handleOtherCityClick}
                          sx={{ 
                            color: theme.palette.primary.main,
                            fontWeight: 600,
                            backgroundColor: theme.palette.mode === 'dark' 
                              ? 'rgba(25, 118, 210, 0.15)' 
                              : 'rgba(25, 118, 210, 0.08)',
                            border: `1px solid ${theme.palette.primary.main}`,
                            borderRadius: 1,
                            margin: '4px 8px',
                            '&:hover': {
                              backgroundColor: theme.palette.primary.main,
                              color: 'white',
                              transform: 'translateY(-1px)',
                              boxShadow: '0 4px 8px rgba(25, 118, 210, 0.3)'
                            }
                          }}
                        >
                          <Box display="flex" alignItems="center" gap={1}>
                            <AddIcon fontSize="small" />
                            {t('other')} - {t('addNewCity')}
                          </Box>
                        </MenuItem>
                      </Select>
                    </FormControl>
                  ) : (
                    <Box display="flex" flexDirection="column" gap={2}>
                      <TextField
                        fullWidth
                        placeholder={t('cityNamePlaceholder')}
                        value={customCityName}
                        onChange={handleCustomCityChange}
                        variant="outlined"
                        sx={{ borderRadius: 2 }}
                      />
                      <Box display="flex" gap={1}>
                        <Button
                          variant="outlined"
                          onClick={() => {
                            setShowCustomCityInput(false);
                            setCustomCityName("");
                            setFieldValue('city', "");
                          }}
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
                          onClick={() => {
                            if (customCityName.trim()) {
                              setFieldValue('city', customCityName.trim());
                              setShowCustomCityInput(false);
                            }
                          }}
                          disabled={!customCityName.trim()}
                          sx={{ 
                            borderRadius: 2,
                            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                            '&:hover': {
                              background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                            }
                          }}
                        >
                          {t('confirm')}
                        </Button>
                      </Box>
                    </Box>
                  )}
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

                {/* Image Section */}
                <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                  {t('itemImage')}
                </Typography>

                <Box>
                  <FormLabel htmlFor="image" sx={{ mb: 1, display: "block", fontWeight: 500 }}>
                    {t('addItemImage')} ({t('optional')})
                  </FormLabel>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Button
                      variant="contained"
                      component="label"
                      startIcon={<PhotoCamera />}
                      sx={{ 
                        textTransform: 'none', 
                        borderRadius: 2,
                        px: 3,
                        py: 1
                      }}
                    >
                      {t('chooseFile')}
                      <input
                        id="image"
                        name="image"
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(event) => {
                          const file = event.currentTarget.files[0];
                          setFieldValue("image", file);
                          setSelectedFileName(file ? file.name : "");
                        }}
                      />
                    </Button>
                    {selectedFileName && (
                      <Typography variant="body2" color="text.secondary">
                        {selectedFileName}
                      </Typography>
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                    {t('imageOptionalMessage')}
                  </Typography>
                </Box>
                
                <Box mt={4}>
                  <SubmitButton
                    disabled={isSubmitting || !selectedCountry || !values.city || !values.exactDate}
                    sx={{ 
                      width: "100%",
                      py: 1.5,
                      fontSize: "1.1rem",
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
          )}
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
