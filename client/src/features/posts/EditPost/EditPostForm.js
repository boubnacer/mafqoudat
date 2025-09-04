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
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Autocomplete
} from "@mui/material";
import { PhotoCamera, LocationOn, ContactPhone, ContactMail, WhatsApp, Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';
import { useTranslation } from "../../../utils/translations";
import { useCreateCategoryMutation, useCreateFoundLostMutation } from "../../dependencies/dependenciesApiSlice";
import SelectCountry from "../../../components/SelectCountry";

const EditPostForm = ({ post, user, countries, flOptions, categories, cities }) => {
  const [updatePost, { isLoading, isSuccess, isError, error }] = useUpdatePostMutation();
  const [deletePost, { isSuccess: isDelSuccess, isError: isDelError, error: delerror }] = useDeletePostMutation();
  const [createCategory, { isLoading: isCreatingCategory }] = useCreateCategoryMutation();
  const [createFoundLost, { isLoading: isCreatingFoundLost }] = useCreateFoundLostMutation();
  const { t, currentLanguage } = useTranslation();

  const navigate = useNavigate();
  const theme = useTheme();
  
  // Dialog states for creating new dependencies
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false);
  const [showNewFoundLostDialog, setShowNewFoundLostDialog] = useState(false);
  const [newCategory, setNewCategory] = useState({ code: "", flag: "" });
  const [newFoundLost, setNewFoundLost] = useState({ code: "" });

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

  // Update cities when country changes
  useEffect(() => {
    if (selectedCountry) {
      fetchCitiesByCountry(selectedCountry._id);
    }
  }, [selectedCountry]);

  const handleCreateNewCategory = async () => {
    if (newCategory.code) {
      try {
        await createCategory({
          code: newCategory.code,
          flag: newCategory.flag,
        }).unwrap();
        
        setShowNewCategoryDialog(false);
        setNewCategory({ code: "", flag: "" });
      } catch (error) {
        console.error("Failed to create category:", error);
      }
    }
  };

  const handleCreateNewFoundLost = async () => {
    if (newFoundLost.code) {
      try {
        await createFoundLost({
          code: newFoundLost.code,
        }).unwrap();
        
        setShowNewFoundLostDialog(false);
        setNewFoundLost({ code: "" });
      } catch (error) {
        console.error("Failed to create found/lost option:", error);
      }
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

  const handleCountrySelect = (event) => {
    const countryId = event.target.value;
    const country = countries.find(c => c._id === countryId);
    setSelectedCountry(country);
    
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

  // Helper function to get city label
  const getCityLabel = (city) => {
    if (city?.labels && city.labels[currentLanguage]) {
      return city.labels[currentLanguage];
    }
    return city?.code || city?.name || '';
  };

  // Initialize form state with existing post data
  const initialFormState = {
    country: post?.country || user?.country || "",
    contact: post?.contact || user?.username || "",
    category: post?.category || categories[0]?._id || "",
    foundLost: post?.foundLost || flOptions[0]?._id || "",
    city: post?.city || "",
    exactLocation: post?.exactLocation || "",
    exactDate: post?.exactDate ? new Date(post.exactDate).toISOString().split('T')[0] : "",
    description: post?.description || "",
    title: post?.title || "",
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
    returned: post?.returned || false,
    // Tags
    tags: post?.tags || []
  };

  const formValidation = Yup.object().shape({
    country: Yup.string().required(t('country') + " " + t('required')),
    contact: Yup.string().required(t('contact') + " " + t('required')),
    category: Yup.string().required(t('category') + " " + t('required')),
    foundLost: Yup.string().required(t('foundOrLost') + " " + t('required')),
    city: Yup.string().required(t('city') + " " + t('required')),
    exactLocation: Yup.string().required(t('exactLocation') + " " + t('required')),
    exactDate: Yup.date().required(t('exactDate') + " " + t('required')),
    description: Yup.string().optional(),
    title: Yup.string().optional(),
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
    returned: Yup.boolean(),
    tags: Yup.array().of(Yup.string())
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
        exactDate: new Date(values.exactDate),
        // Ensure tags is an array
        tags: Array.isArray(values.tags) ? values.tags : []
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

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh" sx={{ p: 2 }}>
      <Paper elevation={3} sx={{ p: 4, maxWidth: 800, width: "100%" }}>
        <Typography variant="h4" gutterBottom textAlign="center" sx={{ color: theme.palette.textColor.main, mb: 4 }}>
          {t('editPost')}
        </Typography>

        <Formik
          initialValues={initialFormState}
          validationSchema={formValidation}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, status, setFieldValue, values }) => (
            <Form>
              <Box display="flex" flexDirection="column" gap={3}>
                {/* Status Message */}
                {status && (
                  <Alert severity={status.type === 'error' ? 'error' : 'success'} sx={{ mb: 2 }}>
                    {status.message}
                  </Alert>
                )}

                {/* Basic Information Section */}
                <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                  {t('basicInformation')}
                </Typography>

                <Box>
                  <FormLabel htmlFor="country" sx={{ mb: 1, display: "block", fontWeight: 500 }}>
                    {t('country')} *
                  </FormLabel>
                  <SelectCountry name="country" countries={countries} />
                </Box>

                <Box>
                  <FormLabel htmlFor="foundLost" sx={{ mb: 1, display: "block", fontWeight: 500 }}>
                    {t('foundOrLost')} *
                  </FormLabel>
                  <Box display="flex" gap={1} alignItems="center">
                    <Box flex={1}>
                      <SelectOption name="foundLost" options={flOptions} />
                    </Box>
                    <Button
                      type="button"
                      variant="outlined"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => setShowNewFoundLostDialog(true)}
                      sx={{ minWidth: 'auto', px: 1 }}
                    >
                      {t('add')}
                    </Button>
                  </Box>
                </Box>

                <Box>
                  <FormLabel htmlFor="category" sx={{ mb: 1, display: "block", fontWeight: 500 }}>
                    {t('category')} *
                  </FormLabel>
                  <Box display="flex" gap={1} alignItems="center">
                    <Box flex={1}>
                      <SelectOption name="category" options={categories} />
                    </Box>
                    <Button
                      type="button"
                      variant="outlined"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => setShowNewCategoryDialog(true)}
                      sx={{ minWidth: 'auto', px: 1 }}
                    >
                      {t('add')}
                    </Button>
                  </Box>
                </Box>

                <Box>
                  <FormLabel htmlFor="contact" sx={{ mb: 1, display: "block", fontWeight: 500 }}>
                    {t('contact')} *
                  </FormLabel>
                  <Textfield name="contact" variant="outlined" />
                </Box>

                {/* Location and Date Section */}
                <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                  {t('locationAndDate')}
                </Typography>

                <Box>
                  <FormLabel htmlFor="city" sx={{ mb: 1, display: "block", fontWeight: 500 }}>
                    {t('city')} *
                  </FormLabel>
                  <Autocomplete
                    options={availableCities}
                    loading={loadingCities}
                    getOptionLabel={(option) => getCityLabel(option)}
                    value={availableCities.find(city => city._id === values.city) || null}
                    onChange={(_, value) => setFieldValue('city', value?._id || '')}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        variant="outlined"
                        placeholder={loadingCities ? t('loadingCities') : t('selectCity')}
                      />
                    )}
                    disabled={!selectedCountry}
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
                    sx={{ borderRadius: 2 }}
                  />
                </Box>

                {/* Item Details Section */}
                <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                  {t('itemDetails')}
                </Typography>

                <Box>
                  <FormLabel htmlFor="title" sx={{ mb: 1, display: "block", fontWeight: 500 }}>
                    {t('title')}
                  </FormLabel>
                  <Textfield 
                    name="title" 
                    variant="outlined" 
                    placeholder={t('titlePlaceholder')}
                  />
                </Box>

                <Box>
                  <FormLabel htmlFor="description" sx={{ mb: 1, display: "block", fontWeight: 500 }}>
                    {t('description')}
                  </FormLabel>
                  <Textfield 
                    name="description" 
                    variant="outlined" 
                    multiline 
                    rows={4}
                    placeholder={t('descriptionPlaceholder')}
                  />
                </Box>

                {/* Contact Preferences Section */}
                <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                  {t('contactPreferences')}
                </Typography>

                <Box>
                  <FormLabel sx={{ mb: 1, display: "block", fontWeight: 500 }}>
                    {t('preferredContactMethods')}
                  </FormLabel>
                  <Box display="flex" flexDirection="column" gap={1}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={values.contactPreferences.phone}
                          onChange={(e) => setFieldValue('contactPreferences.phone', e.target.checked)}
                        />
                      }
                      label={t('phone')}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={values.contactPreferences.email}
                          onChange={(e) => setFieldValue('contactPreferences.email', e.target.checked)}
                        />
                      }
                      label={t('email')}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={values.contactPreferences.whatsapp}
                          onChange={(e) => setFieldValue('contactPreferences.whatsapp', e.target.checked)}
                        />
                      }
                      label={t('whatsapp')}
                    />
                  </Box>
                </Box>

                {/* Additional Contact Information */}
                <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                  {t('additionalContact')}
                </Typography>

                <Box>
                  <FormLabel htmlFor="additionalContact.phone" sx={{ mb: 1, display: "block", fontWeight: 500 }}>
                    {t('phone')}
                  </FormLabel>
                  <Textfield 
                    name="additionalContact.phone" 
                    variant="outlined" 
                    placeholder={t('phonePlaceholder')}
                  />
                </Box>

                <Box>
                  <FormLabel htmlFor="additionalContact.email" sx={{ mb: 1, display: "block", fontWeight: 500 }}>
                    {t('email')}
                  </FormLabel>
                  <Textfield 
                    name="additionalContact.email" 
                    variant="outlined" 
                    type="email"
                    placeholder={t('emailPlaceholder')}
                  />
                </Box>

                <Box>
                  <FormLabel htmlFor="additionalContact.whatsapp" sx={{ mb: 1, display: "block", fontWeight: 500 }}>
                    {t('whatsapp')}
                  </FormLabel>
                  <Textfield 
                    name="additionalContact.whatsapp" 
                    variant="outlined" 
                    placeholder={t('whatsappPlaceholder')}
                  />
                </Box>

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

                {/* Tags Section */}
                <Box>
                  <FormLabel htmlFor="tags" sx={{ mb: 1, display: "block", fontWeight: 500 }}>
                    {t('tags')}
                  </FormLabel>
                  <Autocomplete
                    multiple
                    freeSolo
                    options={[]}
                    value={values.tags}
                    onChange={(_, value) => setFieldValue('tags', value)}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        variant="outlined"
                        placeholder={t('addTags')}
                      />
                    )}
                  />
                </Box>

                {/* Action Buttons */}
                <Box display="flex" gap={2} justifyContent="space-between" sx={{ mt: 3 }}>
                  <Button 
                    onClick={handleDeletePost}
                    variant="outlined" 
                    color="error"
                    disabled={isLoading}
                    sx={{ minWidth: 120 }}
                  >
                    {t('deletePost')}
                  </Button>
                  
                  <SubmitButton disabled={isLoading} sx={{ minWidth: 120 }}>
                    {isLoading ? <CircularProgress size={20} /> : t('updatePost')}
                  </SubmitButton>
                </Box>
              </Box>
            </Form>
          )}
        </Formik>

        {/* New Category Dialog */}
        <Dialog open={showNewCategoryDialog} onClose={() => setShowNewCategoryDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{t('addNewCategory')}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label={t('categoryCode')}
                value={newCategory.code}
                onChange={(e) => setNewCategory({ ...newCategory, code: e.target.value })}
                fullWidth
                required
                placeholder={t('vehicleElectronicsDocuments')}
              />
              <TextField
                label={t('flagOptional')}
                value={newCategory.flag}
                onChange={(e) => setNewCategory({ ...newCategory, flag: e.target.value })}
                fullWidth
                placeholder={t('emoji')}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowNewCategoryDialog(false)}>{t('cancel')}</Button>
            <Button 
              onClick={handleCreateNewCategory}
              disabled={!newCategory.code || isCreatingCategory}
              variant="contained"
            >
              {isCreatingCategory ? t('creating') : t('createCategory')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* New Found/Lost Dialog */}
        <Dialog open={showNewFoundLostDialog} onClose={() => setShowNewFoundLostDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{t('addNewFoundLostOption')}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label={t('optionCode')}
                value={newFoundLost.code}
                onChange={(e) => setNewFoundLost({ ...newFoundLost, code: e.target.value })}
                fullWidth
                required
                placeholder={t('foundLostStolen')}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowNewFoundLostDialog(false)}>{t('cancel')}</Button>
            <Button 
              onClick={handleCreateNewFoundLost}
              disabled={!newFoundLost.code || isCreatingFoundLost}
              variant="contained"
            >
              {isCreatingFoundLost ? t('creating') : t('createOption')}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
};

export default EditPostForm;