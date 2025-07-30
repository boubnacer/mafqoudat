import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUpdatePostMutation, useDeletePostMutation } from "../postsApiSlice";
import * as Yup from "yup";
import { Formik, Form } from "formik";
import Textfield from "../../../components/Textfield";
import SubmitButton from "../../../components/SubmitButton";
import SelectOption from "../../../components/SelectOption";
import { Box, FormLabel, Paper, Typography, CircularProgress, useTheme, Alert, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from "@mui/material";
import SelectCountry from "../../../components/SelectCountry";
import CheckBox from "../../../components/CheckBox";
import FlexBetween from "../../../components/FlexBetween";
import { Add as AddIcon } from '@mui/icons-material';
import { useCreateCategoryMutation, useCreateFoundLostMutation } from "../../dependencies/dependenciesApiSlice";

const EditPostForm = ({ post, user, countries, flOptions, categories }) => {
  const [updatePost, { isLoading, isSuccess, isError, error }] = useUpdatePostMutation();
  const [deletePost, { isSuccess: isDelSuccess, isError: isDelError, error: delerror }] = useDeletePostMutation();
  const [createCategory, { isLoading: isCreatingCategory }] = useCreateCategoryMutation();
  const [createFoundLost, { isLoading: isCreatingFoundLost }] = useCreateFoundLostMutation();

  const navigate = useNavigate();
  const theme = useTheme();
  
  // Dialog states for creating new dependencies
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false);
  const [showNewFoundLostDialog, setShowNewFoundLostDialog] = useState(false);
  const [newCategory, setNewCategory] = useState({ code: "", flag: "" });
  const [newFoundLost, setNewFoundLost] = useState({ code: "" });

  useEffect(() => {
    if (isSuccess || isDelSuccess) {
      navigate("/dash");
    }
  }, [isSuccess, isDelSuccess, navigate]);

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

  const initialFormState = {
    country: user.country,
    contact: user.username,
    category: categories[0]?.id || "",
    foundLost: flOptions[0]?.id || "",
    region: post.region,
    returned: false,
  };

  const formValidation = Yup.object().shape({
    country: Yup.string().required("country Required"),
    contact: Yup.string().required("contact Required"),
    category: Yup.string().required("category Required"),
    foundLost: Yup.string().required("foundLost Required"),
    region: Yup.string().required("region Required"),
    returned: Yup.boolean().required("Required"),
  });

  const handleSubmit = async (values) => {
    await updatePost({ ...values, user: user.id, id: post._id });
  };

  const handleDeletePost = async () => {
    await deletePost({ id: post._id });
  };

  if (isError || isDelError) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Alert severity="error" sx={{ maxWidth: 600 }}>
          <Typography variant="h6">Error</Typography>
          <Typography>{error?.data?.message || delerror?.data?.message || "An error occurred"}</Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
      <Paper elevation={3} sx={{ p: 4, maxWidth: 600, width: "100%" }}>
        <Typography variant="h4" gutterBottom textAlign="center" sx={{ color: theme.palette.textColor.main }}>
          Edit Post
        </Typography>

        <Formik
          initialValues={initialFormState}
          validationSchema={formValidation}
          onSubmit={handleSubmit}
        >
          <Form>
            <Box display="flex" flexDirection="column" gap={2}>
              <FormLabel>Country</FormLabel>
              <SelectCountry name="country" options={countries} />

              <FormLabel>Found or Lost</FormLabel>
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
                  Add
                </Button>
              </Box>

              <FormLabel>Category</FormLabel>
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
                  Add
                </Button>
              </Box>

              <FormLabel>Region</FormLabel>
              <Textfield name="region" />

              <FormLabel>Contact</FormLabel>
              <Textfield name="contact" />

              <CheckBox name="returned" legend="Item returned ?" label="Returned" />

              <FlexBetween>
                <SubmitButton disabled={isLoading}>
                  {isLoading ? <CircularProgress size={20} /> : "Update Post"}
                </SubmitButton>
                <Button 
                  onClick={handleDeletePost}
                  variant="outlined" 
                  color="error"
                  disabled={isLoading}
                >
                  Delete Post
                </Button>
              </FlexBetween>
            </Box>
          </Form>
        </Formik>

        {/* New Category Dialog */}
        <Dialog open={showNewCategoryDialog} onClose={() => setShowNewCategoryDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add New Category</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label="Category Code"
                value={newCategory.code}
                onChange={(e) => setNewCategory({ ...newCategory, code: e.target.value })}
                fullWidth
                required
                placeholder="Vehicle, Electronics, Documents"
              />
              <TextField
                label="Flag (optional)"
                value={newCategory.flag}
                onChange={(e) => setNewCategory({ ...newCategory, flag: e.target.value })}
                fullWidth
                placeholder="🚗, 📱, 📄"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowNewCategoryDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleCreateNewCategory}
              disabled={!newCategory.code || isCreatingCategory}
              variant="contained"
            >
              {isCreatingCategory ? "Creating..." : "Create Category"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* New Found/Lost Dialog */}
        <Dialog open={showNewFoundLostDialog} onClose={() => setShowNewFoundLostDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add New Found/Lost Option</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label="Option Code"
                value={newFoundLost.code}
                onChange={(e) => setNewFoundLost({ ...newFoundLost, code: e.target.value })}
                fullWidth
                required
                placeholder="Found, Lost, Stolen"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowNewFoundLostDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleCreateNewFoundLost}
              disabled={!newFoundLost.code || isCreatingFoundLost}
              variant="contained"
            >
              {isCreatingFoundLost ? "Creating..." : "Create Option"}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
};

export default EditPostForm;
