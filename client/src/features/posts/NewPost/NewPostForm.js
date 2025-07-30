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

const NewPostForm = ({ user, countries, categories, flOptions }) => {
  const [addNewPost, { isLoading, isSuccess, isError, error }] = useAddNewPostMutation();
  
  const navigate = useNavigate();
  const theme = useTheme();
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");

  useEffect(() => {
    if (isSuccess) {
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        navigate("/dash");
      }, 1500);
    }
  }, [isSuccess, navigate]);

  const initialFormState = {
    country: user.country,
    contact: user.username,
    category: categories[0]?.id || "",
    foundLost: flOptions[0]?.id || "",
    region: "",
    image: null,
  };

  const formValidation = Yup.object().shape({
    country: Yup.string().required("Required"),
    contact: Yup.string().required("Required"),
    category: Yup.string().required("Required"),
    region: Yup.string().required("Required"),
    foundLost: Yup.string().required("Required"),
    image: Yup.mixed().required("Please upload an image"),
  });

  const handleSubmit = async (values, { setSubmitting, setStatus }) => {
    try {
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

      await addNewPost(formData);
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
          <Typography variant="h6">Error Creating Post</Typography>
          <Typography>{error?.data?.message || "An error occurred while creating the post"}</Typography>
        </Alert>
      </Box>
    );
  }

  if (showSuccess) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Alert severity="success" sx={{ maxWidth: 600 }}>
          <Typography variant="h6">Post Created Successfully!</Typography>
          <Typography>Redirecting to dashboard...</Typography>
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
          Create New Post
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
                    Country
                  </FormLabel>
                  <SelectCountry name="country" options={countries} />
                </Box>

                <Box>
                  <FormLabel htmlFor="foundLost" sx={{ mb: 1, display: "block", fontWeight: 500 }}>
                    Found or Lost
                  </FormLabel>
                  <SelectOption name="foundLost" options={flOptions} />
                </Box>

                <Box>
                  <FormLabel htmlFor="category" sx={{ mb: 1, display: "block", fontWeight: 500 }}>
                    Category
                  </FormLabel>
                  <SelectOption name="category" options={categories} />
                </Box>

                <Box>
                  <FormLabel htmlFor="region" sx={{ mb: 1, display: "block", fontWeight: 500 }}>
                    Region
                  </FormLabel>
                  <Textfield name="region" variant="outlined" />
                </Box>

                <Box>
                  <FormLabel htmlFor="contact" sx={{ mb: 1, display: "block", fontWeight: 500 }}>
                    Contact
                  </FormLabel>
                  <Textfield name="contact" variant="outlined" />
                </Box>

                <Box>
                  <FormLabel htmlFor="image" sx={{ mb: 1, display: "block", fontWeight: 500 }}>
                    Add Item Image
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
                      Choose File
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
                      "Create Post"
                    )}
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

export default NewPostForm;
