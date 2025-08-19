import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAddNewPostMutation } from "../postsApiSlice";
import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import Textfield from "../../../components/Textfield";
import SubmitButton from "../../../components/SubmitButton";
import SelectOption from "../../../components/SelectOption";
import { Box, FormLabel, Paper, Typography, CircularProgress, useTheme, Alert, Button } from "@mui/material";
import SelectCountry from "../../../components/SelectCountry";
import { PhotoCamera } from '@mui/icons-material';
import { useTranslation } from "../../../utils/translations";
import PromotionDialog from "../../../components/PromotionDialog";

const NewPostForm = ({ user, countries, categories, flOptions }) => {
  const [addNewPost, { isLoading, isSuccess, isError, error }] = useAddNewPostMutation();
  const { t } = useTranslation();
  
  const navigate = useNavigate();
  const theme = useTheme();
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [createdPostId, setCreatedPostId] = useState(null);
  const [lastSubmittedValues, setLastSubmittedValues] = useState(null);

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
    image: null,
  };

  const formValidation = Yup.object().shape({
    country: Yup.string().required(t('required')),
    contact: Yup.string().required(t('required')),
    category: Yup.string().required(t('required')),
    region: Yup.string().required(t('required')),
    foundLost: Yup.string().required(t('required')),
    image: Yup.mixed().nullable(), // Changed from required to optional
  });

  const handleSubmit = async (values, { setSubmitting, setStatus }) => {
    try {
      // Store the submitted values to check if it's a lost item
      setLastSubmittedValues(values);
      
      const formData = new FormData();
      formData.append("user", user._id);
      formData.append("country", values.country);
      formData.append("category", values.category);
      formData.append("foundLost", values.foundLost);
      formData.append("region", values.region);
      formData.append("contact", values.contact);
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
          maxWidth: 600, 
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
                <Box>
                  <FormLabel htmlFor="country" sx={{ mb: 1, display: "block", fontWeight: 500 }}>
                    {t('country')}
                  </FormLabel>
                  <SelectCountry name="country" options={countries} />
                </Box>

                <Box>
                  <FormLabel htmlFor="foundLost" sx={{ mb: 1, display: "block", fontWeight: 500 }}>
                    {t('foundOrLost')}
                  </FormLabel>
                  <SelectOption name="foundLost" options={flOptions} />
                </Box>

                <Box>
                  <FormLabel htmlFor="category" sx={{ mb: 1, display: "block", fontWeight: 500 }}>
                    {t('category')}
                  </FormLabel>
                  <SelectOption name="category" options={categories} />
                </Box>

                <Box>
                  <FormLabel htmlFor="region" sx={{ mb: 1, display: "block", fontWeight: 500 }}>
                    {t('region')}
                  </FormLabel>
                  <Textfield name="region" variant="outlined" />
                </Box>

                <Box>
                  <FormLabel htmlFor="contact" sx={{ mb: 1, display: "block", fontWeight: 500 }}>
                    {t('contact')}
                  </FormLabel>
                  <Textfield name="contact" variant="outlined" />
                </Box>

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
                    disabled={isSubmitting}
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
