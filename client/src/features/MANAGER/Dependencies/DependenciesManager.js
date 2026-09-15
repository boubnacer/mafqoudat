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
  Chip,
  Grid,
  Card,
  CardContent,
  Alert,
  useTheme,
  useMediaQuery,
  CircularProgress
} from "@mui/material";
import {
  Add as AddIcon,
  Flag as FlagIcon,
  Category as CategoryIcon,
  Public as PublicIcon,
  Settings as SettingsIcon
} from "@mui/icons-material";
import { useGetCountriesQuery, useGetCategoriesQuery, useGetflOptionsQuery, useCreateCountryMutation, useCreateCategoryMutation, useCreateFoundLostMutation } from "../../dependencies/dependenciesApiSlice";
import useTitle from "../../../hooks/useTitle";
import { useLanguage } from "../../../utils/languageContext";
import { useTranslation } from "../../../utils/translations";

const DependenciesManager = () => {
  useTitle("Mafqoudat | Admin Dashboard - Dependencies");

  const theme = useTheme();
  // eslint-disable-next-line no-unused-vars
  const isNonMediumScreens = useMediaQuery("(min-width:1200px)");
  const { currentLanguage } = useLanguage();
  const { t } = useTranslation();

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
        default:
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
      case 0: return t('countries');
      case 1: return t('categories');
      case 2: return t('foundLostOptions');
      default: return "";
    }
  };

  // Separate from getTabLabel (which is always plural, for the tab headers)
  // because the plural forms don't slice down to a correct singular in any
  // of the three languages - "Countries" -> "Countrie" was the previous
  // approach's result.
  const getTabSingularLabel = (index) => {
    switch (index) {
      case 0: return t('depManagerCountrySingular');
      case 1: return t('depManagerCategorySingular');
      case 2: return t('depManagerFoundLostSingular');
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
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const currentData = getCurrentData();
  const countriesData = countries?.ids?.map(id => countries.entities[id]) || [];
  const categoriesData = categories?.ids?.map(id => categories.entities[id]) || [];
  const flOptionsData = flOptions?.ids?.map(id => flOptions.entities[id]) || [];

  // theme.palette.primary.main is #FFFFFF in light mode (legacy pre-token
  // palette - see the admin console's adminSx.js for the same trap), and
  // .secondary.main/.success.main aren't design tokens either, so the stat
  // cards and both buttons below state their colour from theme.custom
  // instead of inheriting the MUI palette.
  const statCards = [
    { label: t('countries'), value: countriesData.length, icon: <PublicIcon sx={{ fontSize: 40, opacity: 0.8 }} />, color: theme.custom.color.brandPrimary },
    { label: t('categories'), value: categoriesData.length, icon: <CategoryIcon sx={{ fontSize: 40, opacity: 0.8 }} />, color: theme.custom.color.brandLogo },
    { label: t('foundLostOptions'), value: flOptionsData.length, icon: <FlagIcon sx={{ fontSize: 40, opacity: 0.8 }} />, color: theme.custom.status.found.main },
  ];

  const brandButtonSx = {
    borderRadius: 2,
    px: 3,
    py: 1,
    textTransform: 'none',
    fontWeight: 600,
    backgroundColor: theme.custom.color.brandPrimary,
    color: theme.palette.getContrastText(theme.custom.color.brandPrimary),
    '&:hover': {
      backgroundColor: theme.custom.color.brandPrimary,
      opacity: 0.9,
    },
  };

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
            color: theme.custom.color.ink,
            fontWeight: 700,
            mb: 1
          }}
        >
          {t('adminDashboard')}
        </Typography>
        <Typography
          variant="h6"
          sx={{
            color: theme.palette.text.secondary,
            fontWeight: 400
          }}
        >
          {t('depManagerSubtitle')}
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card) => (
          <Grid item xs={12} sm={6} md={4} key={card.label}>
            <Card
              elevation={2}
              sx={{
                backgroundColor: card.color,
                color: theme.palette.getContrastText(card.color),
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h4" fontWeight={700}>
                      {card.value}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {card.label}
                    </Typography>
                  </Box>
                  {card.icon}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
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
              label={t('countries')}
              icon={getTabIcon(0)}
              iconPosition="start"
            />
            <Tab
              label={t('categories')}
              icon={getTabIcon(1)}
              iconPosition="start"
            />
            <Tab
              label={t('foundLostOptions')}
              icon={getTabIcon(2)}
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
                {t('depManagerItemsAvailable', { count: currentData.length })}
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowCreateDialog(true)}
              sx={brandButtonSx}
            >
              {t('depManagerAddItem', { type: getTabSingularLabel(activeTab) })}
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
                  {/* No delete control here: the server has no delete route for
                      countries/categories/found-lost options (dependenciesRoutes.js
                      only exposes create), and never has - see the category
                      taxonomy notes on sync-categories deliberately never deleting
                      or deactivating. A Delete button with no working action behind
                      it was worse than no button. */}
                  <ListItemSecondaryAction>
                    <Chip
                      label={t('depManagerIdPrefix', { id: item._id.slice(-8) })}
                      size="small"
                      variant="outlined"
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.75rem'
                      }}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
              {currentData.length === 0 && (
                <ListItem sx={{ py: 4 }}>
                  <Box textAlign="center" width="100%">
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                      {t('depManagerNoItemsFound', { type: getTabLabel(activeTab) })}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('depManagerClickAddToCreate')}
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
            {t('depManagerNewItem', { type: getTabSingularLabel(activeTab) })}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            <TextField
              label={t('code')}
              value={newItem.code}
              onChange={(e) => setNewItem({ ...newItem, code: e.target.value })}
              fullWidth
              required
              placeholder={activeTab === 0 ? t('depManagerCodeExampleCountry') : activeTab === 1 ? t('depManagerCodeExampleCategory') : t('depManagerCodeExampleFoundLost')}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            {activeTab === 0 && (
              <TextField
                label={t('depManagerLabelField')}
                value={newItem.label}
                onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
                fullWidth
                required
                placeholder={t('depManagerCountryLabelExample')}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            )}

            {activeTab === 1 && (
              <TextField
                label={t('depManagerFlagOptional')}
                value={newItem.flag}
                onChange={(e) => setNewItem({ ...newItem, flag: e.target.value })}
                fullWidth
                placeholder={t('depManagerFlagExample')}
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
            {t('cancel')}
          </Button>
          <Button
            onClick={handleCreateItem}
            disabled={!newItem.code || (activeTab === 0 && !newItem.label) ||
                     (activeTab === 0 && isCreatingCountry) ||
                     (activeTab === 1 && isCreatingCategory) ||
                     (activeTab === 2 && isCreatingFoundLost)}
            variant="contained"
            sx={{ ...brandButtonSx, borderRadius: 2, px: 3, py: undefined }}
          >
            {isCreatingCountry || isCreatingCategory || isCreatingFoundLost ? t('depManagerCreating') : t('depManagerCreate')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DependenciesManager;
