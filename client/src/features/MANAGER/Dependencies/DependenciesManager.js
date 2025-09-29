import React, { useState } from "react";
import { 
  Box, 
  Typography, 
  Tabs, 
  Tab, 
  Paper, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction, 
  IconButton, 
  Chip,
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider,
  Alert,
  useTheme,
  useMediaQuery
} from "@mui/material";
import { 
  Add as AddIcon, 
  Delete as DeleteIcon,
  Flag as FlagIcon,
  Category as CategoryIcon,
  Public as PublicIcon,
  Settings as SettingsIcon
} from "@mui/icons-material";
import { useGetCountriesQuery, useGetCategoriesQuery, useGetflOptionsQuery, useCreateCountryMutation, useCreateCategoryMutation, useCreateFoundLostMutation } from "../../dependencies/dependenciesApiSlice";
import { LoadingState } from "../../../components/LoadingStates";
import useTitle from "../../../hooks/useTitle";
import { useLanguage } from "../../../utils/languageContext";

const DependenciesManager = () => {
  useTitle("Mafqoudat | Admin Dashboard - Dependencies");

  const theme = useTheme();
  const isNonMediumScreens = useMediaQuery("(min-width:1200px)");
  const { currentLanguage } = useLanguage();
  
  const [activeTab, setActiveTab] = useState(0);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newItem, setNewItem] = useState({ code: "", label: "", flag: "" });

  // Queries
  const { data: countries, isLoading: countriesLoading } = useGetCountriesQuery({
    language: currentLanguage || 'en'
  });
  const { data: categories, isLoading: categoriesLoading } = useGetCategoriesQuery({
    language: currentLanguage || 'en'
  });
  const { data: flOptions, isLoading: flOptionsLoading } = useGetflOptionsQuery({
    language: currentLanguage || 'en'
  });

  // Mutations
  const [createCountry, { isLoading: isCreatingCountry }] = useCreateCountryMutation();
  const [createCategory, { isLoading: isCreatingCategory }] = useCreateCategoryMutation();
  const [createFoundLost, { isLoading: isCreatingFoundLost }] = useCreateFoundLostMutation();

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleCreateItem = async () => {
    if (!newItem.code) return;

    try {
      switch (activeTab) {
        case 0: // Countries
          await createCountry({ code: newItem.code, label: newItem.label });
          break;
        case 1: // Categories
          await createCategory({ code: newItem.code, flag: newItem.flag });
          break;
        case 2: // FoundLost
          await createFoundLost({ code: newItem.code });
          break;
      }
      
      setShowCreateDialog(false);
      setNewItem({ code: "", label: "", flag: "" });
    } catch (error) {
      console.error("Failed to create item:", error);
    }
  };

  const getCurrentData = () => {
    switch (activeTab) {
      case 0:
        return countries?.ids?.map(id => countries.entities[id]) || [];
      case 1:
        return categories?.ids?.map(id => categories.entities[id]) || [];
      case 2:
        return flOptions?.ids?.map(id => flOptions.entities[id]) || [];
      default:
        return [];
    }
  };

  const getTabLabel = (index) => {
    switch (index) {
      case 0: return "Countries";
      case 1: return "Categories";
      case 2: return "Found/Lost Options";
      default: return "";
    }
  };

  const getTabIcon = (index) => {
    switch (index) {
      case 0: return <PublicIcon />;
      case 1: return <CategoryIcon />;
      case 2: return <FlagIcon />;
      default: return <SettingsIcon />;
    }
  };

  const isLoading = countriesLoading || categoriesLoading || flOptionsLoading;

  if (isLoading) {
    return <LoadingState message="Loading dependencies..." />;
  }

  const currentData = getCurrentData();
  const countriesData = countries?.ids?.map(id => countries.entities[id]) || [];
  const categoriesData = categories?.ids?.map(id => categories.entities[id]) || [];
  const flOptionsData = flOptions?.ids?.map(id => flOptions.entities[id]) || [];

  return (
    <Box 
      sx={{ 
        p: { xs: 2, md: 4 },
        minHeight: "100vh",
        background: theme.palette.background.default
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h3" 
          sx={{ 
            color: theme.palette.textColor.main,
            fontWeight: 700,
            mb: 1
          }}
        >
          Admin Dashboard
        </Typography>
        <Typography 
          variant="h6" 
          sx={{ 
            color: theme.palette.textColor.secondary,
            fontWeight: 400
          }}
        >
          Manage system dependencies and configurations
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card 
            elevation={2}
            sx={{ 
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              color: 'white'
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {countriesData.length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Countries
                  </Typography>
                </Box>
                <PublicIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card 
            elevation={2}
            sx={{ 
              background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
              color: 'white'
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {categoriesData.length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Categories
                  </Typography>
                </Box>
                <CategoryIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card 
            elevation={2}
            sx={{ 
              background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
              color: 'white'
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {flOptionsData.length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Found/Lost Options
                  </Typography>
                </Box>
                <FlagIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Paper 
        elevation={3} 
        sx={{ 
          borderRadius: 3,
          overflow: 'hidden'
        }}
      >
        {/* Tabs Header */}
        <Box sx={{ 
          background: theme.palette.background.paper,
          borderBottom: 1,
          borderColor: 'divider'
        }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            aria-label="dependencies tabs"
            sx={{
              '& .MuiTab-root': {
                minHeight: 64,
                fontSize: '1rem',
                fontWeight: 600,
                textTransform: 'none'
              }
            }}
          >
            <Tab 
              label="Countries" 
              icon={<PublicIcon />} 
              iconPosition="start"
            />
            <Tab 
              label="Categories" 
              icon={<CategoryIcon />} 
              iconPosition="start"
            />
            <Tab 
              label="Found/Lost Options" 
              icon={<FlagIcon />} 
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* Content Area */}
        <Box sx={{ p: 3 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 3 
          }}>
            <Box>
              <Typography variant="h5" fontWeight={600} sx={{ mb: 0.5 }}>
                {getTabLabel(activeTab)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {currentData.length} items available
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowCreateDialog(true)}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Add {getTabLabel(activeTab).slice(0, -1)}
            </Button>
          </Box>

          {/* Data List */}
          <Paper elevation={1} sx={{ borderRadius: 2 }}>
            <List sx={{ p: 0 }}>
              {currentData.map((item, index) => (
                <ListItem 
                  key={item._id} 
                  divider={index < currentData.length - 1}
                  sx={{ 
                    py: 2,
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover
                    }
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography variant="h6" fontWeight={600}>
                        {item.code}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        {item.label || item.flag || "No description"}
                      </Typography>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip 
                        label={`ID: ${item._id.slice(-8)}`}
                        size="small" 
                        variant="outlined"
                        sx={{ 
                          fontFamily: 'monospace',
                          fontSize: '0.75rem'
                        }}
                      />
                      <IconButton 
                        edge="end" 
                        aria-label="delete" 
                        size="small"
                        sx={{
                          color: theme.palette.error.main,
                          '&:hover': {
                            backgroundColor: theme.palette.error.light + '20'
                          }
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
              {currentData.length === 0 && (
                <ListItem sx={{ py: 4 }}>
                  <Box textAlign="center" width="100%">
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                      No {getTabLabel(activeTab).toLowerCase()} found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Click the Add button to create your first item
                    </Typography>
                  </Box>
                </ListItem>
              )}
            </List>
          </Paper>
        </Box>
      </Paper>

      {/* Create Dialog */}
      <Dialog 
        open={showCreateDialog} 
        onClose={() => setShowCreateDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h5" fontWeight={600}>
            Add New {getTabLabel(activeTab).slice(0, -1)}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            <TextField
              label="Code"
              value={newItem.code}
              onChange={(e) => setNewItem({ ...newItem, code: e.target.value })}
              fullWidth
              required
              placeholder={activeTab === 0 ? "US, UK, FR" : activeTab === 1 ? "Vehicle, Electronics" : "Found, Lost"}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            
            {activeTab === 0 && (
              <TextField
                label="Label"
                value={newItem.label}
                onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
                fullWidth
                required
                placeholder="United States, United Kingdom"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            )}
            
            {activeTab === 1 && (
              <TextField
                label="Flag (optional)"
                value={newItem.flag}
                onChange={(e) => setNewItem({ ...newItem, flag: e.target.value })}
                fullWidth
                placeholder="🚗, 📱, 💼"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => setShowCreateDialog(false)}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateItem}
            disabled={!newItem.code || (activeTab === 0 && !newItem.label) || 
                     (activeTab === 0 && isCreatingCountry) || 
                     (activeTab === 1 && isCreatingCategory) || 
                     (activeTab === 2 && isCreatingFoundLost)}
            variant="contained"
            sx={{ 
              textTransform: 'none', 
              fontWeight: 600,
              borderRadius: 2,
              px: 3
            }}
          >
            {isCreatingCountry || isCreatingCategory || isCreatingFoundLost ? "Creating..." : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DependenciesManager; 