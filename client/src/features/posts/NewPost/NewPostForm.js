import { useState, useEffect } from "react";
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
  Autocomplete,
  TextField,
  Chip,
  FormControlLabel,
  Checkbox,
  Divider
} from "@mui/material";
import { PhotoCamera, LocationOn, ContactPhone, ContactMail, WhatsApp } from '@mui/icons-material';
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
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    if (isSuccess) {
      setShowSuccess(true);
      // Check if this is a lost item post using the stored values
      const foundLostOption = lastSubmittedValues && flOptions.find(option => option.id === lastSubmittedValues.foundLost);
      const isLostItem = foundLostOption && foundLostOption.code === 'LOST';
      
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
  }, [isSuccess, navigate, flOptions, lastSubmittedValues]);

  const initialFormState = {
    country: user.country,
    contact: user.username,
    category: categories[0]?.id || "",
    foundLost: flOptions[0]?.id || "",
    region: "",
    city: "",
    exactLocation: "",
    title: "",
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
    country: Yup.string().required(t('required')),
    contact: Yup.string().required(t('required')),
    category: Yup.string().required(t('required')),
    region: Yup.string().required(t('required')),
    foundLost: Yup.string().required(t('required')),
    title: Yup.string().required(t('required')).min(3, t('titleMinLength')),
    description: Yup.string().required(t('required')).min(10, t('descriptionMinLength')),
    city: Yup.string().required(t('required')),
    exactLocation: Yup.string().optional(),
    image: Yup.mixed().nullable(),
  });

  const handleCountrySelect = (_, value) => {
    setSelectedCountry(value);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (values, { setSubmitting, setStatus }) => {
    try {
      // Store the submitted values to check if it's a lost item
      setLastSubmittedValues(values);
      
      const formData = new FormData();
      formData.append("user", user._id);
      formData.append("country", selectedCountry?._id || values.country);
      formData.append("category", values.category);
      formData.append("foundLost", values.foundLost);
      formData.append("region", values.region);
      formData.append("city", values.city);
      formData.append("exactLocation", values.exactLocation);
      formData.append("contact", values.contact);
      formData.append("title", values.title);
      formData.append("description", values.description);
      formData.append("tags", JSON.stringify(tags));
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
          maxWidth: 800, 
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
                  <FormLabel htmlFor="country" sx={{ mb: 1, display: "block", fontWeight: 500 }}>
                    {t('country')} *
                  </FormLabel>
                  <Autocomplete
                    options={countries || []}
                    autoHighlight
                    disableClearable
                    value={selectedCountry}
                    onChange={handleCountrySelect}
                    getOptionLabel={(option) => getCountryLabel(option)}
                    isOptionEqualToValue={(option, value) => option._id === value._id}
                    renderOption={(props, option) => (
                      <Box
                        component="li"
                        sx={{ "& > img": { mr: 2, flexShrink: 0 } }}
                        {...props}
                      >
                        {option.flag ? (
                          <span style={{ marginRight: 8, fontSize: '20px' }}>
                            {option.flag}
                          </span>
                        ) : (
                          <img
                            loading="lazy"
                            width="20"
                            src={`https://flagcdn.com/w20/${option.code.toLowerCase()}.png`}
                            srcSet={`https://flagcdn.com/w40/${option.code.toLowerCase()}.png 2x`}
                            alt=""
                          />
                        )}
                        {getCountryLabel(option)} ({option.code})
                      </Box>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={t('chooseCountry')}
                        variant="outlined"
                        fullWidth
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          }
                        }}
                        inputProps={{
                          ...params.inputProps,
                          autoComplete: "new-password",
                        }}
                      />
                    )}
                  />
                </Box>

                <Box>
                  <FormLabel htmlFor="foundLost" sx={{ mb: 1, display: "block", fontWeight: 500 }}>
                    {t('foundOrLost')} *
                  </FormLabel>
                  <SelectOption name="foundLost" options={flOptions} />
                </Box>

                <Box>
                  <FormLabel htmlFor="category" sx={{ mb: 1, display: "block", fontWeight: 500 }}>
                    {t('category')} *
                  </FormLabel>
                  <SelectOption name="category" options={categories} />
                </Box>

                {/* Item Details Section */}
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                  {t('itemDetails')}
                </Typography>

                <Box>
                  <FormLabel htmlFor="title" sx={{ mb: 1, display: "block", fontWeight: 500 }}>
                    {t('title')} *
                  </FormLabel>
                  <Textfield name="title" variant="outlined" placeholder={t('titlePlaceholder')} />
                </Box>

                <Box>
                  <FormLabel htmlFor="description" sx={{ mb: 1, display: "block", fontWeight: 500 }}>
                    {t('description')} *
                  </FormLabel>
                  <Textfield 
                    name="description" 
                    variant="outlined" 
                    multiline 
                    rows={4}
                    placeholder={t('descriptionPlaceholder')}
                  />
                </Box>

                <Box>
                  <FormLabel htmlFor="tags" sx={{ mb: 1, display: "block", fontWeight: 500 }}>
                    {t('tags')} ({t('optional')})
                  </FormLabel>
                  <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
                    {tags.map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag}
                        onDelete={() => handleRemoveTag(tag)}
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                    <Box display="flex" gap={1} alignItems="center">
                      <TextField
                        size="small"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder={t('addTag')}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        sx={{ minWidth: 120 }}
                      />
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={handleAddTag}
                        disabled={!newTag.trim()}
                      >
                        {t('add')}
                      </Button>
                    </Box>
                  </Box>
                </Box>

                {/* Location Section */}
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                  {t('location')}
                </Typography>

                <Box>
                  <FormLabel htmlFor="region" sx={{ mb: 1, display: "block", fontWeight: 500 }}>
                    {t('region')} *
                  </FormLabel>
                  <Textfield name="region" variant="outlined" />
                </Box>

                <Box>
                  <FormLabel htmlFor="city" sx={{ mb: 1, display: "block", fontWeight: 500 }}>
                    {t('city')} *
                  </FormLabel>
                  <Textfield name="city" variant="outlined" />
                </Box>

                <Box>
                  <FormLabel htmlFor="exactLocation" sx={{ mb: 1, display: "block", fontWeight: 500 }}>
                    {t('exactLocation')} ({t('optional')})
                  </FormLabel>
                  <Textfield 
                    name="exactLocation" 
                    variant="outlined" 
                    placeholder={t('exactLocationPlaceholder')}
                  />
                </Box>

                {/* Contact Information Section */}
                <Divider sx={{ my: 2 }} />
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
                <Divider sx={{ my: 2 }} />
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
                    disabled={isSubmitting || !selectedCountry}
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
