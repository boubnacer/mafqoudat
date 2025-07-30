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
    category: categories[0].id,
    foundLost: flOptions[0].id,
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
      const { image, ...otherValues } = values;
      if (image && image.size > 2097152) {
        setStatus({ error: "Image size should not exceed 2MB" });
        setSubmitting(false);
        return;
      }
      const formData = new FormData();
      Object.entries(otherValues).forEach(([key, value]) => {
        formData.append(key, value);
      });
      formData.append("user", user.id);
      formData.append("image", image);
      await addNewPost(formData);
      setStatus({ error: null });
    } catch (err) {
      setStatus({ error: err.message || "Submission failed" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        mt: { xs: 8, md: 12 },
        mb: { xs: 8, md: 12 },
        px: 2,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        minHeight: "80vh",
        width: '100vw',
        position: 'relative',
        left: 0,
        right: 0,
        backgroundColor: theme.palette.background.default,
        transition: 'background 0.3s',
        animation: 'fadeIn 0.6s',
        '@keyframes fadeIn': {
          from: { opacity: 0 },
          to: { opacity: 1 }
        }
      }}
    >
      <Paper
        elevation={4}
        sx={{
          p: { xs: 2, sm: 4 },
          width: "100%",
          maxWidth: 480,
          borderRadius: 3,
          boxShadow: theme.shadows[4],
          backgroundColor: theme.palette.background.paper,
          transition: 'background 0.3s',
        }}
      >
        <Typography variant="h5" align="center" fontWeight={600} mb={2}>
          Create New Post
        </Typography>
        <Formik
          initialValues={initialFormState}
          validationSchema={formValidation}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, status, setFieldValue, values }) => (
            <Form encType="multipart/form-data">
              {isError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error?.data?.message || "An error occurred."}
                </Alert>
              )}
              {status && status.error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {status.error}
                </Alert>
              )}
              {showSuccess && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Post created successfully!
                </Alert>
              )}
              <Box display="flex" flexDirection="column" gap={2}>
                <FormLabel htmlFor="country">Country</FormLabel>
                <SelectCountry name="country" options={countries} />

                <FormLabel htmlFor="foundLost">Found or Lost</FormLabel>
                <SelectOption name="foundLost" options={flOptions} />

                <FormLabel htmlFor="category">Category</FormLabel>
                <SelectOption name="category" options={categories} />

                <FormLabel htmlFor="region">Region</FormLabel>
                <Textfield name="region" variant="outlined" />

                <FormLabel htmlFor="contact">Contact</FormLabel>
                <Textfield name="contact" variant="outlined" />

                <FormLabel htmlFor="image">Add Item Image</FormLabel>
                <Box display="flex" alignItems="center" gap={2}>
                  <Button
                    variant="contained"
                    component="label"
                    startIcon={<PhotoCamera />}
                    sx={{ textTransform: 'none', borderRadius: 2 }}
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
                    <Typography variant="caption" color="text.secondary">
                      {selectedFileName}
                    </Typography>
                  )}
                </Box>
                <Box mt={2}>
                  <SubmitButton disabled={isSubmitting || isLoading}>
                    {isSubmitting || isLoading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      "Submit"
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
