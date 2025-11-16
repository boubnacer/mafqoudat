import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  useTheme,
  Tabs,
  Tab,
  Badge,
  Tooltip,
  Divider,
  Switch,
  InputAdornment,
} from '@mui/material';
import {
  AdminPanelSettings,
  Report,
  TrendingUp,
  Visibility,
  CheckCircle,
  Cancel,
  Edit,
  Refresh,
  FilterList,
  Search,
  LockReset,
  People,
  Article,
  Build,
  Warning,
  ContactMail,
  LocationCity,
  Delete,
  Save,
} from '@mui/icons-material';
import { useTranslation } from '../../utils/translations';
import {
  useGetAdminDashboardQuery,
  useGetReportsQuery,
  useGetPromotionsQuery,
  useUpdateReportStatusMutation,
  useUpdatePromotionStatusMutation,
  useDeletePostAdminMutation,
  useGetPasswordResetRequestsQuery,
  useUpdatePasswordResetRequestStatusMutation,
  useGetUsersAdminQuery,
  useAdminResetUserPasswordMutation,
  useDeleteUserAdminMutation,
  useGetAllPostsAdminQuery,
  useGetContactsAdminQuery,
  useGetContactStatsQuery,
  useUpdateContactStatusMutation,
  useDeleteContactAdminMutation,
} from './adminApiSlice';
import {
  useGetSystemSettingsQuery,
  useUpdateMaintenanceModeMutation,
} from './systemSettingsApiSlice';
import {
  useGetCategoriesQuery,
  useGetCountriesQuery,
} from '../dependencies/dependenciesApiSlice';
import {
  useGetCitiesByCountryAdminQuery,
  useUpdateCityAdminMutation,
  useDeleteCityAdminMutation,
} from './adminApiSlice';
import {
  UsersTable,
  UserPostsDialog,
  ResetPasswordDialog,
  UsersSearchBar,
  PostsTable,
  PostsFilterBar,
  PostDetailsDialog,
} from './components';
import VisitorStats from './components/VisitorStats';
import { useGetDbMetricsQuery } from './dbMetricsApiSlice';

const AdminDashboard = () => {
  const { t, currentLanguage } = useTranslation();
  const theme = useTheme();
  
  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [reportsPage, setReportsPage] = useState(0);
  const [promotionsPage, setPromotionsPage] = useState(0);
  const [resetRequestsPage, setResetRequestsPage] = useState(0);
  const [usersPage, setUsersPage] = useState(0);
  const [postsPage, setPostsPage] = useState(0);
  const [contactsPage, setContactsPage] = useState(0);
  const [reportsRowsPerPage, setReportsRowsPerPage] = useState(10);
  const [promotionsRowsPerPage, setPromotionsRowsPerPage] = useState(10);
  const [resetRequestsRowsPerPage, setResetRequestsRowsPerPage] = useState(10);
  const [usersRowsPerPage, setUsersRowsPerPage] = useState(10);
  const [postsRowsPerPage, setPostsRowsPerPage] = useState(10);
  const [contactsRowsPerPage, setContactsRowsPerPage] = useState(10);
  const [selectedCountryId, setSelectedCountryId] = useState('');
  const [editingCity, setEditingCity] = useState(null);
  const [editCityLabels, setEditCityLabels] = useState({ en: '', fr: '', ar: '' });
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [reportStatusFilter, setReportStatusFilter] = useState('');
  const [promotionStatusFilter, setPromotionStatusFilter] = useState('');
  const [resetRequestStatusFilter, setResetRequestStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [postsFilters, setPostsFilters] = useState({
    search: '',
    status: '',
    category: '',
    country: '',
  });
  const [contactsFilters, setContactsFilters] = useState({
    search: '',
    status: '',
    priority: '',
  });
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [selectedResetRequest, setSelectedResetRequest] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [promotionDialogOpen, setPromotionDialogOpen] = useState(false);
  const [resetRequestDialogOpen, setResetRequestDialogOpen] = useState(false);
  const [userPostsDialogOpen, setUserPostsDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [postDetailsDialogOpen, setPostDetailsDialogOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  
  // Maintenance mode state
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [estimatedReturn, setEstimatedReturn] = useState('');
  const [confirmMaintenanceDialogOpen, setConfirmMaintenanceDialogOpen] = useState(false);
  const [maintenanceAlert, setMaintenanceAlert] = useState({ open: false, severity: 'success', message: '' });

  // API queries
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useGetAdminDashboardQuery();
  const { data: reportsData, isLoading: reportsLoading, error: reportsError } = useGetReportsQuery({
    page: reportsPage + 1,
    limit: reportsRowsPerPage,
    status: reportStatusFilter || undefined,
  });
  const { data: promotionsData, isLoading: promotionsLoading, error: promotionsError } = useGetPromotionsQuery({
    page: promotionsPage + 1,
    limit: promotionsRowsPerPage,
    status: promotionStatusFilter || undefined,
  });
  const { data: resetRequestsData, isLoading: resetRequestsLoading, error: resetRequestsError } = useGetPasswordResetRequestsQuery({
    page: resetRequestsPage + 1,
    limit: resetRequestsRowsPerPage,
    status: resetRequestStatusFilter || undefined,
  });
  const { data: usersData, isLoading: usersLoading, error: usersError } = useGetUsersAdminQuery({
    page: usersPage + 1,
    limit: usersRowsPerPage,
    search: searchQuery || undefined,
  });
  const { data: postsData, isLoading: postsLoading, error: postsError } = useGetAllPostsAdminQuery({
    page: postsPage + 1,
    limit: postsRowsPerPage,
    search: postsFilters.search || undefined,
    status: postsFilters.status || undefined,
    category: postsFilters.category || undefined,
    country: postsFilters.country || undefined,
  });
  const { data: contactsData, isLoading: contactsLoading, error: contactsError } = useGetContactsAdminQuery({
    page: contactsPage + 1,
    limit: contactsRowsPerPage,
    search: contactsFilters.search || undefined,
    status: contactsFilters.status || undefined,
    priority: contactsFilters.priority || undefined,
  });
  const { data: contactStatsData } = useGetContactStatsQuery();
  const { data: dbMetricsData, isLoading: dbMetricsLoading, error: dbMetricsError, refetch: refetchDbMetrics } = useGetDbMetricsQuery();
  
  // Fetch categories and countries for filters
  const { data: categoriesData } = useGetCategoriesQuery({
    language: currentLanguage || 'en'
  });
  const { data: countriesData } = useGetCountriesQuery({
    language: currentLanguage || 'en'
  });
  
  const categories = categoriesData?.ids?.map((id) => categoriesData?.entities[id]) || [];
  const countries = countriesData?.ids?.map((id) => countriesData?.entities[id]) || [];

  // Get cities by country (admin only)
  const { data: citiesData, isLoading: citiesLoading, error: citiesError } = useGetCitiesByCountryAdminQuery(
    { countryId: selectedCountryId, language: currentLanguage || 'en' },
    { skip: !selectedCountryId }
  );
  const allCities = citiesData?.data || [];
  
  // Filter cities by search query
  const cities = allCities.filter((city) => {
    if (!citySearchQuery.trim()) return true;
    const searchLower = citySearchQuery.toLowerCase();
    return (
      (city.labels?.en?.toLowerCase().includes(searchLower)) ||
      (city.labels?.fr?.toLowerCase().includes(searchLower)) ||
      (city.labels?.ar?.toLowerCase().includes(searchLower)) ||
      (city.code?.toLowerCase().includes(searchLower))
    );
  });

  // System settings query
  const { data: systemSettingsData, isLoading: settingsLoading } = useGetSystemSettingsQuery();
  const maintenanceMode = systemSettingsData?.data?.maintenanceMode;

  // Mutations
  const [updateReportStatus, { isLoading: updatingReport }] = useUpdateReportStatusMutation();
  const [updatePromotionStatus, { isLoading: updatingPromotion }] = useUpdatePromotionStatusMutation();
  const [deletePost, { isLoading: deletingPost }] = useDeletePostAdminMutation();
  const [updateResetRequestStatus, { isLoading: updatingResetRequest }] = useUpdatePasswordResetRequestStatusMutation();
  const [adminResetUserPassword] = useAdminResetUserPasswordMutation();
  const [deleteUserAdmin] = useDeleteUserAdminMutation();
  const [updateMaintenanceMode, { isLoading: updatingMaintenance }] = useUpdateMaintenanceModeMutation();
  const [updateContactStatus, { isLoading: updatingContact }] = useUpdateContactStatusMutation();
  const [deleteContactAdmin] = useDeleteContactAdminMutation();
  const [updateCityAdmin, { isLoading: updatingCity }] = useUpdateCityAdminMutation();
  const [deleteCityAdmin] = useDeleteCityAdminMutation();

  // Sync maintenance message when data loads
  React.useEffect(() => {
    if (maintenanceMode) {
      setMaintenanceMessage(maintenanceMode.message || '');
      setEstimatedReturn(maintenanceMode.estimatedReturn || '');
    }
  }, [maintenanceMode]);

  // Maintenance mode handlers
  const handleMaintenanceToggle = () => {
    if (!maintenanceMode?.isActive) {
      // If turning ON, show confirmation dialog
      setConfirmMaintenanceDialogOpen(true);
    } else {
      // If turning OFF, do it immediately
      handleUpdateMaintenance(false);
    }
  };

  const handleUpdateMaintenance = async (isActive) => {
    try {
      await updateMaintenanceMode({
        isActive,
        message: maintenanceMessage || undefined,
        estimatedReturn: estimatedReturn || undefined,
      }).unwrap();
      
      setMaintenanceAlert({
        open: true,
        severity: 'success',
        message: `Maintenance mode ${isActive ? 'enabled' : 'disabled'} successfully`,
      });
      
      setConfirmMaintenanceDialogOpen(false);
    } catch (error) {
      setMaintenanceAlert({
        open: true,
        severity: 'error',
        message: error.message || 'Failed to update maintenance mode',
      });
    }
  };

  const handleSaveMaintenanceSettings = async () => {
    try {
      await updateMaintenanceMode({
        isActive: maintenanceMode?.isActive,
        message: maintenanceMessage,
        estimatedReturn: estimatedReturn,
      }).unwrap();
      
      setMaintenanceAlert({
        open: true,
        severity: 'success',
        message: 'Maintenance settings updated successfully',
      });
    } catch (error) {
      setMaintenanceAlert({
        open: true,
        severity: 'error',
        message: error.message || 'Failed to update maintenance settings',
      });
    }
  };

  // Handlers
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleReportsPageChange = (event, newPage) => {
    setReportsPage(newPage);
  };

  const handlePromotionsPageChange = (event, newPage) => {
    setPromotionsPage(newPage);
  };

  const handleReportsRowsPerPageChange = (event) => {
    setReportsRowsPerPage(parseInt(event.target.value, 10));
    setReportsPage(0);
  };

  const handlePromotionsRowsPerPageChange = (event) => {
    setPromotionsRowsPerPage(parseInt(event.target.value, 10));
    setPromotionsPage(0);
  };

  const handleResetRequestsPageChange = (event, newPage) => {
    setResetRequestsPage(newPage);
  };

  const handleResetRequestsRowsPerPageChange = (event) => {
    setResetRequestsRowsPerPage(parseInt(event.target.value, 10));
    setResetRequestsPage(0);
  };

  const handleReportStatusUpdate = async (reportId, status) => {
    try {
      await updateReportStatus({
        reportId,
        status,
        adminNotes: adminNotes,
      }).unwrap();
      setReportDialogOpen(false);
      setAdminNotes('');
      setSelectedReport(null);
    } catch (error) {
      console.error('Error updating report status:', error);
    }
  };

  const handlePromotionStatusUpdate = async (postId, processed) => {
    try {
      await updatePromotionStatus({
        postId,
        processed,
      }).unwrap();
      setPromotionDialogOpen(false);
      setSelectedPromotion(null);
    } catch (error) {
      console.error('Error updating promotion status:', error);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!postId) {
      return;
    }

    if (window.confirm(t('confirmDeletePost'))) {
      try {
        const result = await deletePost(postId).unwrap();
        
        // Close dialogs and clear selections
        setReportDialogOpen(false);
        setPromotionDialogOpen(false);
        setSelectedReport(null);
        setSelectedPromotion(null);
        
        // Show success message (you could add a toast notification here)
        alert(t('postDeletedSuccessfully'));
      } catch (error) {
        alert(t('errorDeletingPost') + ': ' + (error.data?.message || error.message || 'Unknown error'));
      }
    }
  };

  const openReportDialog = (report) => {
    setSelectedReport(report);
    setReportDialogOpen(true);
  };

  const openPromotionDialog = (promotion) => {
    setSelectedPromotion(promotion);
    setPromotionDialogOpen(true);
  };

  const openResetRequestDialog = (request) => {
    setSelectedResetRequest(request);
    setResetRequestDialogOpen(true);
  };

  const handleResetRequestStatusUpdate = async (requestId, status) => {
    try {
      await updateResetRequestStatus({
        requestId,
        status,
        adminNotes: adminNotes,
      }).unwrap();
      setResetRequestDialogOpen(false);
      setAdminNotes('');
      setSelectedResetRequest(null);
    } catch (error) {
      console.error('Error updating reset request status:', error);
    }
  };

  // Users Management Handlers
  const handleUsersPageChange = (event, newPage) => {
    setUsersPage(newPage);
  };

  const handleUsersRowsPerPageChange = (event) => {
    setUsersRowsPerPage(parseInt(event.target.value, 10));
    setUsersPage(0);
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setUsersPage(0);
  };

  const handleViewPosts = (user) => {
    setSelectedUser(user);
    setUserPostsDialogOpen(true);
  };

  const handleResetPassword = (user) => {
    setSelectedUser(user);
    setResetPasswordDialogOpen(true);
  };

  const handleResetPasswordConfirm = async (userId, newPassword) => {
    try {
      await adminResetUserPassword({ userId, newPassword }).unwrap();
      alert(t('passwordResetSuccessfully') || 'Password reset successfully');
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  };

  const handleDeleteUser = async (user) => {
    if (user.role === 'admin') {
      alert(t('cannotDeleteAdmin') || 'Cannot delete admin users');
      return;
    }

    const confirmMessage = t('confirmDeleteUser') || `Are you sure you want to delete user "${user.username}"? This will also delete all their posts.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        await deleteUserAdmin(user._id).unwrap();
        alert(t('userDeletedSuccessfully') || 'User deleted successfully');
      } catch (error) {
        console.error('Error deleting user:', error);
        alert(t('errorDeletingUser') || 'Error deleting user: ' + (error.data?.message || error.message));
      }
    }
  };

  // Posts Management Handlers
  const handlePostsPageChange = (event, newPage) => {
    setPostsPage(newPage);
  };

  const handlePostsRowsPerPageChange = (event) => {
    setPostsRowsPerPage(parseInt(event.target.value, 10));
    setPostsPage(0);
  };

  const handlePostsFilterChange = (newFilters) => {
    setPostsFilters(newFilters);
    setPostsPage(0);
  };

  const handleViewPost = (post) => {
    setSelectedPost(post);
    setPostDetailsDialogOpen(true);
  };

  const handleDeletePostFromTable = async (post) => {
    const confirmMessage = t('confirmDeletePost') || `Are you sure you want to delete this post?`;
    
    if (window.confirm(confirmMessage)) {
      try {
        await deletePost(post._id).unwrap();
        alert(t('postDeletedSuccessfully') || 'Post deleted successfully');
      } catch (error) {
        console.error('Error deleting post:', error);
        alert(t('errorDeletingPost') || 'Error deleting post: ' + (error.data?.message || error.message));
      }
    }
  };

  // Contact Management Handlers
  const handleContactsPageChange = (event, newPage) => {
    setContactsPage(newPage);
  };

  const handleContactsRowsPerPageChange = (event) => {
    setContactsRowsPerPage(parseInt(event.target.value, 10));
    setContactsPage(0);
  };

  const handleContactsFilterChange = (newFilters) => {
    setContactsFilters(newFilters);
    setContactsPage(0);
  };

  const openContactDialog = (contact) => {
    setSelectedContact(contact);
    setContactDialogOpen(true);
  };

  const handleContactStatusUpdate = async (contactId, status, response) => {
    try {
      await updateContactStatus({
        contactId,
        status,
        response,
      }).unwrap();
      setContactDialogOpen(false);
      setAdminNotes('');
      setSelectedContact(null);
    } catch (error) {
      console.error('Error updating contact status:', error);
    }
  };

  const handleDeleteContact = async (contact) => {
    const confirmMessage = t('confirmDeleteContact') || `Are you sure you want to delete this contact submission?`;
    
    if (window.confirm(confirmMessage)) {
      try {
        await deleteContactAdmin(contact._id).unwrap();
        alert(t('contactDeletedSuccessfully') || 'Contact submission deleted successfully');
      } catch (error) {
        console.error('Error deleting contact:', error);
        alert(t('errorDeletingContact') || 'Error deleting contact: ' + (error.data?.message || error.message));
      }
    }
  };

  // Cities Management Handlers
  const handleCountryChange = (event) => {
    setSelectedCountryId(event.target.value);
    setEditingCity(null);
    setEditCityLabels({ en: '', fr: '', ar: '' });
    setCitySearchQuery(''); // Clear search when country changes
  };

  const handleEditCity = (city) => {
    setEditingCity(city._id);
    setEditCityLabels({
      en: city.labels?.en || '',
      fr: city.labels?.fr || '',
      ar: city.labels?.ar || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingCity(null);
    setEditCityLabels({ en: '', fr: '', ar: '' });
  };

  const handleSaveCity = async (cityId) => {
    try {
      await updateCityAdmin({
        cityId,
        labels: editCityLabels,
      }).unwrap();
      setEditingCity(null);
      setEditCityLabels({ en: '', fr: '', ar: '' });
      alert(t('cityUpdatedSuccessfully') || 'City updated successfully');
    } catch (error) {
      console.error('Error updating city:', error);
      alert(t('errorUpdatingCity') || 'Error updating city: ' + (error.data?.message || error.message));
    }
  };

  const handleDeleteCity = async (city) => {
    const confirmMessage = t('confirmDeleteCity') || `Are you sure you want to delete the city "${city.labels?.en || city.code}"?`;
    
    if (window.confirm(confirmMessage)) {
      try {
        await deleteCityAdmin(city._id).unwrap();
        alert(t('cityDeletedSuccessfully') || 'City deleted successfully');
      } catch (error) {
        console.error('Error deleting city:', error);
        alert(t('errorDeletingCity') || 'Error deleting city: ' + (error.data?.message || error.message));
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'reviewed': return 'info';
      case 'resolved': return 'success';
      case 'dismissed': return 'error';
      default: return 'default';
    }
  };

  const getReasonTypeLabel = (reasonType) => {
    const labels = {
      inappropriate_content: t('inappropriateContent'),
      spam_fake: t('spamFake'),
      duplicate: t('duplicate'),
      wrong_category: t('wrongCategory'),
      suspicious_activity: t('suspiciousActivity'),
      personal_info: t('personalInfo'),
      other: t('other'),
    };
    return labels[reasonType] || reasonType;
  };

  if (dashboardLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (dashboardError) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Alert severity="error">
          {t('errorLoadingDashboard')}: {dashboardError?.data?.message || dashboardError?.message}
        </Alert>
      </Container>
    );
  }

  const { statistics, recentReports, recentPromotions } = dashboardData?.data || {};

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <AdminPanelSettings sx={{ fontSize: 40, color: theme.palette.primary.main }} />
          <Typography variant="h4" fontWeight="bold">
            {t('adminDashboard')}
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          {t('adminDashboardDescription')}
        </Typography>
      </Box>

      {/* Maintenance Mode Alert */}
      {maintenanceAlert.open && (
        <Alert 
          severity={maintenanceAlert.severity} 
          sx={{ mb: 3 }}
          onClose={() => setMaintenanceAlert({ ...maintenanceAlert, open: false })}
        >
          {maintenanceAlert.message}
        </Alert>
      )}

      {/* System Maintenance Mode Control */}
      <Card 
        sx={{ 
          mb: 4, 
          border: maintenanceMode?.isActive ? '2px solid' : '1px solid',
          borderColor: maintenanceMode?.isActive ? 'warning.main' : 'divider',
          background: maintenanceMode?.isActive 
            ? theme.palette.mode === 'dark' 
              ? 'linear-gradient(135deg, rgba(237, 108, 2, 0.15) 0%, rgba(251, 140, 0, 0.05) 100%)'
              : 'linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(255, 193, 7, 0.05) 100%)'
            : 'default',
        }}
      >
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <Build 
              sx={{ 
                fontSize: 40, 
                color: maintenanceMode?.isActive ? 'warning.main' : 'action.active' 
              }} 
            />
            <Box flex={1}>
              <Typography variant="h5" fontWeight={700}>
                System Maintenance Mode
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Control system-wide maintenance mode for all non-admin users
              </Typography>
            </Box>
            <Chip
              icon={maintenanceMode?.isActive ? <Build /> : <CheckCircle />}
              label={maintenanceMode?.isActive ? 'ACTIVE' : 'INACTIVE'}
              color={maintenanceMode?.isActive ? 'warning' : 'success'}
              sx={{ fontWeight: 600, fontSize: '0.9rem', px: 1 }}
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          {settingsLoading ? (
            <Box display="flex" justifyContent="center" py={3}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Status and Toggle */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                      Quick Toggle
                    </Typography>
                    <Box 
                      display="flex" 
                      alignItems="center" 
                      gap={2} 
                      p={2} 
                      sx={{ 
                        bgcolor: 'action.hover', 
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      <Switch
                        checked={maintenanceMode?.isActive || false}
                        onChange={handleMaintenanceToggle}
                        disabled={updatingMaintenance}
                        color={maintenanceMode?.isActive ? 'warning' : 'success'}
                      />
                      <Box flex={1}>
                        <Typography variant="body2" fontWeight={600}>
                          {maintenanceMode?.isActive ? 'Maintenance Mode is ON' : 'Maintenance Mode is OFF'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {maintenanceMode?.isActive 
                            ? 'Site is inaccessible to non-admin users' 
                            : 'Site is fully operational'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                      Status Information
                    </Typography>
                    <Box 
                      p={2} 
                      sx={{ 
                        bgcolor: 'action.hover', 
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      {maintenanceMode?.lastUpdatedBy && (
                        <Typography variant="body2" gutterBottom>
                          <strong>Last Updated By:</strong> {maintenanceMode.lastUpdatedBy}
                        </Typography>
                      )}
                      {maintenanceMode?.lastUpdatedAt && (
                        <Typography variant="body2">
                          <strong>Last Updated:</strong> {new Date(maintenanceMode.lastUpdatedAt).toLocaleString()}
                        </Typography>
                      )}
                      {!maintenanceMode?.lastUpdatedBy && !maintenanceMode?.lastUpdatedAt && (
                        <Typography variant="body2" color="text.secondary">
                          No maintenance updates yet
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              {/* Message and Settings */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Maintenance Message
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    value={maintenanceMessage}
                    onChange={(e) => setMaintenanceMessage(e.target.value)}
                    placeholder="Enter the message users will see during maintenance (max 500 characters)"
                    disabled={updatingMaintenance}
                    helperText={`${maintenanceMessage.length}/500 characters`}
                    variant="outlined"
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Estimated Return Time
                  </Typography>
                  <TextField
                    fullWidth
                    value={estimatedReturn}
                    onChange={(e) => setEstimatedReturn(e.target.value)}
                    placeholder="e.g., '2 hours', '30 minutes', 'soon'"
                    disabled={updatingMaintenance}
                    helperText="Optional - leave blank for 'soon'"
                    variant="outlined"
                  />
                </Grid>
              </Grid>

              {/* Save Button */}
              <Box mt={3} display="flex" justifyContent="flex-end">
                <Button
                  variant="contained"
                  startIcon={updatingMaintenance ? <CircularProgress size={20} /> : <CheckCircle />}
                  onClick={handleSaveMaintenanceSettings}
                  disabled={updatingMaintenance || !maintenanceMessage.trim()}
                  sx={{ minWidth: 200 }}
                >
                  {updatingMaintenance ? 'Saving...' : 'Save Settings'}
                </Button>
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    {t('totalReports')}
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {statistics?.totalReports || 0}
                  </Typography>
                </Box>
                <Badge badgeContent={statistics?.pendingReports || 0} color="error">
                  <Report sx={{ fontSize: 40, color: theme.palette.error.main }} />
                </Badge>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    {t('pendingReports')}
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {statistics?.pendingReports || 0}
                  </Typography>
                </Box>
                <Report sx={{ fontSize: 40, color: theme.palette.warning.main }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    {t('totalPromotions')}
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {statistics?.totalPromotions || 0}
                  </Typography>
                </Box>
                <Badge badgeContent={statistics?.pendingPromotions || 0} color="warning">
                  <TrendingUp sx={{ fontSize: 40, color: theme.palette.primary.main }} />
                </Badge>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    {t('pendingPromotions')}
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {statistics?.pendingPromotions || 0}
                  </Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 40, color: theme.palette.warning.main }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    {t('totalResetRequests')}
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {statistics?.totalResetRequests || 0}
                  </Typography>
                </Box>
                <Badge badgeContent={statistics?.pendingResetRequests || 0} color="warning">
                  <LockReset sx={{ fontSize: 40, color: theme.palette.info.main }} />
                </Badge>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    {t('pendingResetRequests')}
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {statistics?.pendingResetRequests || 0}
                  </Typography>
                </Box>
                <LockReset sx={{ fontSize: 40, color: theme.palette.warning.main }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    {t('totalUsers')}
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {statistics?.totalUsers || 0}
                  </Typography>
                </Box>
                <People sx={{ fontSize: 40, color: theme.palette.success.main }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    {t('totalPosts')}
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {statistics?.totalPosts || 0}
                  </Typography>
                </Box>
                <Visibility sx={{ fontSize: 40, color: theme.palette.info.main }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    {t('totalContacts')}
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {contactStatsData?.data?.totalContacts || 0}
                  </Typography>
                </Box>
                <Badge badgeContent={contactStatsData?.data?.newContacts || 0} color="error">
                  <ContactMail sx={{ fontSize: 40, color: theme.palette.secondary.main }} />
                </Badge>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          <Tab 
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <Report />
                {t('reports')}
                {statistics?.pendingReports > 0 && (
                  <Chip 
                    label={statistics.pendingReports} 
                    size="small" 
                    color="error" 
                  />
                )}
              </Box>
            } 
          />
          <Tab 
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <TrendingUp />
                {t('promotions')}
                {statistics?.pendingPromotions > 0 && (
                  <Chip 
                    label={statistics.pendingPromotions} 
                    size="small" 
                    color="warning" 
                  />
                )}
              </Box>
            } 
          />
          <Tab 
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <LockReset />
                {t('passwordResetRequests')}
                {statistics?.pendingResetRequests > 0 && (
                  <Chip 
                    label={statistics.pendingResetRequests} 
                    size="small" 
                    color="warning" 
                  />
                )}
              </Box>
            } 
          />
          <Tab 
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <People />
                {t('usersManagement')}
                {statistics?.totalUsers > 0 && (
                  <Chip 
                    label={statistics.totalUsers} 
                    size="small" 
                    color="default" 
                  />
                )}
              </Box>
            } 
          />
          <Tab 
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <Article />
                {t('postsManagement')}
                {statistics?.totalPosts > 0 && (
                  <Chip 
                    label={statistics.totalPosts} 
                    size="small" 
                    color="default" 
                  />
                )}
              </Box>
            } 
          />
          <Tab 
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <ContactMail />
                {t('contactSubmissions')}
                {contactStatsData?.data?.totalContacts > 0 && (
                  <Chip 
                    label={contactStatsData.data.totalContacts} 
                    size="small" 
                    color="default" 
                  />
                )}
              </Box>
            } 
          />
          <Tab 
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <LocationCity />
                {t('countriesCitiesManagement') || 'Countries & Cities'}
              </Box>
            } 
          />
          <Tab 
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <Build />
                {t('databaseMetrics') || 'Database Metrics'}
              </Box>
            } 
          />
        </Tabs>
      </Paper>


      {/* Reports Tab */}
      {activeTab === 0 && (
        <Paper>
          <Box p={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                {t('reportedPosts')}
              </Typography>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>{t('filterByStatus')}</InputLabel>
                <Select
                  value={reportStatusFilter}
                  label={t('filterByStatus')}
                  onChange={(e) => setReportStatusFilter(e.target.value)}
                >
                  <MenuItem value="">{t('allStatuses')}</MenuItem>
                  <MenuItem value="pending">{t('pending')}</MenuItem>
                  <MenuItem value="reviewed">{t('reviewed')}</MenuItem>
                  <MenuItem value="resolved">{t('resolved')}</MenuItem>
                  <MenuItem value="dismissed">{t('dismissed')}</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {reportsLoading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : reportsError ? (
              <Alert severity="error">
                {t('errorLoadingReports')}: {reportsError?.data?.message || reportsError?.message}
              </Alert>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('post')}</TableCell>
                        <TableCell>{t('reason')}</TableCell>
                        <TableCell>{t('reportedBy')}</TableCell>
                        <TableCell>{t('status')}</TableCell>
                        <TableCell>{t('reportedAt')}</TableCell>
                        <TableCell>{t('actions')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reportsData?.data?.reports?.map((report) => (
                        <TableRow key={report._id}>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {report.postId?.title || t('noTitle')}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {report.postId?.exactLocation || t('noLocation')}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2">
                                {getReasonTypeLabel(report.reasonType)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {report.reason}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {report.reportedBy?.username || t('anonymous')}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={t(report.status)}
                              color={getStatusColor(report.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {new Date(report.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Tooltip title={t('viewDetails')}>
                              <IconButton
                                size="small"
                                onClick={() => openReportDialog(report)}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={reportsData?.data?.pagination?.totalReports || 0}
                  rowsPerPage={reportsRowsPerPage}
                  page={reportsPage}
                  onPageChange={handleReportsPageChange}
                  onRowsPerPageChange={handleReportsRowsPerPageChange}
                />
              </>
            )}
          </Box>
        </Paper>
      )}

      {/* Promotions Tab */}
      {activeTab === 1 && (
        <Paper>
          <Box p={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                {t('promotionRequests')}
              </Typography>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>{t('filterByStatus')}</InputLabel>
                <Select
                  value={promotionStatusFilter}
                  label={t('filterByStatus')}
                  onChange={(e) => setPromotionStatusFilter(e.target.value)}
                >
                  <MenuItem value="">{t('allStatuses')}</MenuItem>
                  <MenuItem value="requested">{t('requested')}</MenuItem>
                  <MenuItem value="processed">{t('processed')}</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {promotionsLoading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : promotionsError ? (
              <Alert severity="error">
                {t('errorLoadingPromotions')}: {promotionsError?.data?.message || promotionsError?.message}
              </Alert>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('post')}</TableCell>
                        <TableCell>{t('user')}</TableCell>
                        <TableCell>{t('category')}</TableCell>
                        <TableCell>{t('location')}</TableCell>
                        <TableCell>{t('requestedAt')}</TableCell>
                        <TableCell>{t('status')}</TableCell>
                        <TableCell>{t('actions')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {promotionsData?.data?.promotions?.map((promotion) => (
                        <TableRow key={promotion._id}>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {promotion.title || t('noTitle')}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {promotion.description?.substring(0, 50)}...
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {promotion.user?.username || t('unknown')}
                          </TableCell>
                          <TableCell>
                            {promotion.category?.labels?.en || promotion.category?.code || t('unknown')}
                          </TableCell>
                          <TableCell>
                            {promotion.city?.labels?.en || promotion.city || t('unknown')}
                          </TableCell>
                          <TableCell>
                            {new Date(promotion.promotionRequestedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={promotion.promotionProcessed ? t('processed') : t('pending')}
                              color={promotion.promotionProcessed ? 'success' : 'warning'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Tooltip title={t('viewDetails')}>
                              <IconButton
                                size="small"
                                onClick={() => openPromotionDialog(promotion)}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={promotionsData?.data?.pagination?.totalPromotions || 0}
                  rowsPerPage={promotionsRowsPerPage}
                  page={promotionsPage}
                  onPageChange={handlePromotionsPageChange}
                  onRowsPerPageChange={handlePromotionsRowsPerPageChange}
                />
              </>
            )}
          </Box>
        </Paper>
      )}

      {/* Password Reset Requests Tab */}
      {activeTab === 2 && (
        <Paper>
          <Box p={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                {t('passwordResetRequests')}
              </Typography>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>{t('filterByStatus')}</InputLabel>
                <Select
                  value={resetRequestStatusFilter}
                  label={t('filterByStatus')}
                  onChange={(e) => setResetRequestStatusFilter(e.target.value)}
                >
                  <MenuItem value="">{t('allStatuses')}</MenuItem>
                  <MenuItem value="pending">{t('pending')}</MenuItem>
                  <MenuItem value="processed">{t('processed')}</MenuItem>
                  <MenuItem value="rejected">{t('rejected')}</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {resetRequestsLoading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : resetRequestsError ? (
              <Alert severity="error">
                {t('errorLoadingReports')}: {resetRequestsError?.data?.message || resetRequestsError?.message}
              </Alert>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('contactInfoLabel')}</TableCell>
                        <TableCell>{t('requestedAt')}</TableCell>
                        <TableCell>{t('status')}</TableCell>
                        <TableCell>{t('processedBy')}</TableCell>
                        <TableCell>{t('actions')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {resetRequestsData?.data?.resetRequests?.map((request) => (
                        <TableRow key={request._id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {request.contactInfo}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {new Date(request.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={t(request.status)}
                              color={getStatusColor(request.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {request.processedBy?.username || '-'}
                          </TableCell>
                          <TableCell>
                            <Tooltip title={t('viewDetails')}>
                              <IconButton
                                size="small"
                                onClick={() => openResetRequestDialog(request)}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={resetRequestsData?.data?.pagination?.totalRequests || 0}
                  rowsPerPage={resetRequestsRowsPerPage}
                  page={resetRequestsPage}
                  onPageChange={handleResetRequestsPageChange}
                  onRowsPerPageChange={handleResetRequestsRowsPerPageChange}
                />
              </>
            )}
          </Box>
        </Paper>
      )}

      {/* Report Details Dialog */}
      <Dialog
        open={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff',
            backgroundImage: 'none',
          }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Report />
            {t('reportDetails')}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedReport && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {t('postInformation')}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('title')}:</strong> {selectedReport.postId?.title || t('noTitle')}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('location')}:</strong> {selectedReport.postId?.exactLocation || t('noLocation')}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('contact')}:</strong> {selectedReport.postId?.contact || t('noContact')}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('postLink')}:</strong> 
                <Button
                  variant="text"
                  color="primary"
                  size="small"
                  onClick={() => window.open(`/dash/posts/${selectedReport.postId?._id}`, '_blank')}
                  sx={{ ml: 1, textTransform: 'none' }}
                >
                  {t('viewPost')}
                </Button>
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                {t('reportInformation')}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('reason')}:</strong> {getReasonTypeLabel(selectedReport.reasonType)}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('description')}:</strong> {selectedReport.reason}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('reportedBy')}:</strong> {selectedReport.reportedBy?.username || t('anonymous')}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('reportedAt')}:</strong> {new Date(selectedReport.createdAt).toLocaleString()}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <TextField
                fullWidth
                multiline
                rows={3}
                label={t('adminNotes')}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={t('addNotesForThisReport')}
                sx={{ mt: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportDialogOpen(false)}>
            {t('cancel')}
          </Button>
          <Button
            onClick={() => {
              // Handle both cases: postId as string or as populated object
              const postId = selectedReport.postId?._id || selectedReport.postId;
              handleDeletePost(postId);
            }}
            color="error"
            variant="outlined"
            disabled={deletingPost}
          >
            {t('deletePost')}
          </Button>
          <Button
            onClick={() => handleReportStatusUpdate(selectedReport._id, 'dismissed')}
            color="warning"
            disabled={updatingReport}
          >
            {t('dismiss')}
          </Button>
          <Button
            onClick={() => handleReportStatusUpdate(selectedReport._id, 'resolved')}
            color="success"
            disabled={updatingReport}
          >
            {t('resolve')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Promotion Details Dialog */}
      <Dialog
        open={promotionDialogOpen}
        onClose={() => setPromotionDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff',
            backgroundImage: 'none',
          }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <TrendingUp />
            {t('promotionDetails')}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedPromotion && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {t('postInformation')}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('title')}:</strong> {selectedPromotion.title || t('noTitle')}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('description')}:</strong> {selectedPromotion.description || t('noDescription')}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('location')}:</strong> {selectedPromotion.exactLocation || t('noLocation')}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('contact')}:</strong> {selectedPromotion.contact || t('noContact')}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('postLink')}:</strong> 
                <Button
                  variant="text"
                  color="primary"
                  size="small"
                  onClick={() => window.open(`/dash/posts/${selectedPromotion._id}`, '_blank')}
                  sx={{ ml: 1, textTransform: 'none' }}
                >
                  {t('viewPost')}
                </Button>
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                {t('promotionInformation')}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('user')}:</strong> {selectedPromotion.user?.username || t('unknown')}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('category')}:</strong> {selectedPromotion.category?.labels?.en || selectedPromotion.category?.code || t('unknown')}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('phoneNumber')}:</strong> {selectedPromotion.promotionPhoneNumber || t('noPhoneNumber')}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('requestedAt')}:</strong> {new Date(selectedPromotion.promotionRequestedAt).toLocaleString()}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('status')}:</strong> {selectedPromotion.promotionProcessed ? t('processed') : t('pending')}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPromotionDialogOpen(false)}>
            {t('cancel')}
          </Button>
          <Button
            onClick={() => handleDeletePost(selectedPromotion._id)}
            color="error"
            variant="outlined"
            disabled={deletingPost}
          >
            {t('deletePost')}
          </Button>
          {!selectedPromotion?.promotionProcessed && (
            <Button
              onClick={() => handlePromotionStatusUpdate(selectedPromotion._id, true)}
              color="success"
              disabled={updatingPromotion}
            >
              {t('markAsProcessed')}
            </Button>
          )}
          {selectedPromotion?.promotionProcessed && (
            <Button
              onClick={() => handlePromotionStatusUpdate(selectedPromotion._id, false)}
              color="warning"
              disabled={updatingPromotion}
            >
              {t('markAsPending')}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Password Reset Request Details Dialog */}
      <Dialog
        open={resetRequestDialogOpen}
        onClose={() => setResetRequestDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff',
            backgroundImage: 'none',
          }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <LockReset />
            {t('resetRequestDetails')}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedResetRequest && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {t('resetRequestInformation')}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('contactInfoLabel')}:</strong> {selectedResetRequest.contactInfo}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('requestedAt')}:</strong> {new Date(selectedResetRequest.createdAt).toLocaleString()}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('status')}:</strong> {t(selectedResetRequest.status)}
              </Typography>
              {selectedResetRequest.processedBy && (
                <Typography variant="body2" paragraph>
                  <strong>{t('processedBy')}:</strong> {selectedResetRequest.processedBy.username}
                </Typography>
              )}
              {selectedResetRequest.processedAt && (
                <Typography variant="body2" paragraph>
                  <strong>{t('processedAt')}:</strong> {new Date(selectedResetRequest.processedAt).toLocaleString()}
                </Typography>
              )}
              {selectedResetRequest.ipAddress && (
                <Typography variant="body2" paragraph>
                  <strong>IP Address:</strong> {selectedResetRequest.ipAddress}
                </Typography>
              )}

              <Divider sx={{ my: 2 }} />

              <TextField
                fullWidth
                multiline
                rows={3}
                label={t('adminNotes')}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={t('addNotesForThisReport')}
                sx={{ mt: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetRequestDialogOpen(false)}>
            {t('cancel')}
          </Button>
          {selectedResetRequest?.status === 'pending' && (
            <>
              <Button
                onClick={() => handleResetRequestStatusUpdate(selectedResetRequest._id, 'rejected')}
                color="error"
                variant="outlined"
                disabled={updatingResetRequest}
              >
                {t('markAsRejected')}
              </Button>
              <Button
                onClick={() => handleResetRequestStatusUpdate(selectedResetRequest._id, 'processed')}
                color="success"
                disabled={updatingResetRequest}
              >
                {t('processResetRequest')}
              </Button>
            </>
          )}
          {selectedResetRequest?.status === 'processed' && (
            <Button
              onClick={() => handleResetRequestStatusUpdate(selectedResetRequest._id, 'pending')}
              color="warning"
              disabled={updatingResetRequest}
            >
              {t('markAsPending')}
            </Button>
          )}
          {selectedResetRequest?.status === 'rejected' && (
            <Button
              onClick={() => handleResetRequestStatusUpdate(selectedResetRequest._id, 'pending')}
              color="warning"
              disabled={updatingResetRequest}
            >
              {t('markAsPending')}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Users Management Tab */}
      {activeTab === 3 && (
        <Paper>
          <Box p={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                {t('usersManagement')}
              </Typography>
            </Box>

            <Box mb={2}>
              <UsersSearchBar
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder={t('searchUsers') || 'Search by username, email, or phone...'}
              />
            </Box>

            {usersLoading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : usersError ? (
              <Alert severity="error">
                {t('errorLoadingUsers')}: {usersError?.data?.message || usersError?.message}
              </Alert>
            ) : (
              <UsersTable
                users={usersData?.data?.users || []}
                pagination={usersData?.data?.pagination || {}}
                page={usersPage}
                rowsPerPage={usersRowsPerPage}
                onPageChange={handleUsersPageChange}
                onRowsPerPageChange={handleUsersRowsPerPageChange}
                onViewPosts={handleViewPosts}
                onResetPassword={handleResetPassword}
                onDeleteUser={handleDeleteUser}
                isLoading={usersLoading}
              />
            )}
          </Box>
        </Paper>
      )}

      {/* User Posts Dialog */}
      <UserPostsDialog
        open={userPostsDialogOpen}
        onClose={() => {
          setUserPostsDialogOpen(false);
          setSelectedUser(null);
        }}
        userId={selectedUser?._id}
        username={selectedUser?.username}
      />

      {/* Reset Password Dialog */}
      <ResetPasswordDialog
        open={resetPasswordDialogOpen}
        onClose={() => {
          setResetPasswordDialogOpen(false);
          setSelectedUser(null);
        }}
        userId={selectedUser?._id}
        username={selectedUser?.username}
        onConfirm={handleResetPasswordConfirm}
      />

      {/* Posts Management Tab */}
      {activeTab === 4 && (
        <Paper>
          <Box p={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                {t('postsManagement')}
              </Typography>
            </Box>

            <Box mb={2}>
              <PostsFilterBar
                filters={postsFilters}
                onFilterChange={handlePostsFilterChange}
                categories={categories}
                countries={countries}
              />
            </Box>

            {postsLoading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : postsError ? (
              <Alert severity="error">
                {t('errorLoadingPosts')}: {postsError?.data?.message || postsError?.message}
              </Alert>
            ) : (
              <PostsTable
                posts={postsData?.data?.posts || []}
                pagination={postsData?.data?.pagination || {}}
                page={postsPage}
                rowsPerPage={postsRowsPerPage}
                onPageChange={handlePostsPageChange}
                onRowsPerPageChange={handlePostsRowsPerPageChange}
                onViewPost={handleViewPost}
                onDeletePost={handleDeletePostFromTable}
                isLoading={postsLoading}
              />
            )}
          </Box>
        </Paper>
      )}

      {/* Countries & Cities Management Tab */}
      {activeTab === 6 && (
        <Paper>
          <Box p={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                {t('countriesCitiesManagement') || 'Countries & Cities Management'}
              </Typography>
            </Box>

            {/* Country Selection */}
            <Box mb={3}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>{t('selectCountry') || 'Select Country'}</InputLabel>
                    <Select
                      value={selectedCountryId}
                      label={t('selectCountry') || 'Select Country'}
                      onChange={handleCountryChange}
                    >
                      <MenuItem value="">
                        <em>{t('selectCountry') || 'Select a country'}</em>
                      </MenuItem>
                      {countries.map((country) => (
                        <MenuItem key={country._id} value={country._id}>
                          {country.label || country.labels?.en || country.code}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={t('searchCity') || 'Search City'}
                    placeholder={t('searchCityPlaceholder') || 'Search by city name...'}
                    value={citySearchQuery}
                    onChange={(e) => setCitySearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search />
                        </InputAdornment>
                      ),
                    }}
                    disabled={!selectedCountryId}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Cities Table */}
            {selectedCountryId ? (
              citiesLoading ? (
                <Box display="flex" justifyContent="center" p={4}>
                  <CircularProgress />
                </Box>
              ) : citiesError ? (
                <Alert severity="error">
                  {t('errorLoadingCities') || 'Error loading cities'}: {citiesError?.data?.message || citiesError?.message}
                </Alert>
              ) : cities.length === 0 ? (
                <Alert severity="info">
                  {citySearchQuery.trim() 
                    ? (t('noCitiesFoundForSearch') || `No cities found matching "${citySearchQuery}"`)
                    : (t('noCitiesFound') || 'No cities found for this country')
                  }
                </Alert>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('cityCode') || 'Code'}</TableCell>
                        <TableCell>{t('cityNameEnglish') || 'Name (English)'}</TableCell>
                        <TableCell>{t('cityNameFrench') || 'Name (French)'}</TableCell>
                        <TableCell>{t('cityNameArabic') || 'Name (Arabic)'}</TableCell>
                        <TableCell>{t('actions') || 'Actions'}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {cities.map((city) => (
                        <TableRow key={city._id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {city.code}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {editingCity === city._id ? (
                              <TextField
                                size="small"
                                value={editCityLabels.en}
                                onChange={(e) => setEditCityLabels({ ...editCityLabels, en: e.target.value })}
                                fullWidth
                              />
                            ) : (
                              <Typography variant="body2">
                                {city.labels?.en || '-'}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingCity === city._id ? (
                              <TextField
                                size="small"
                                value={editCityLabels.fr}
                                onChange={(e) => setEditCityLabels({ ...editCityLabels, fr: e.target.value })}
                                fullWidth
                              />
                            ) : (
                              <Typography variant="body2">
                                {city.labels?.fr || '-'}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingCity === city._id ? (
                              <TextField
                                size="small"
                                value={editCityLabels.ar}
                                onChange={(e) => setEditCityLabels({ ...editCityLabels, ar: e.target.value })}
                                fullWidth
                              />
                            ) : (
                              <Typography variant="body2">
                                {city.labels?.ar || '-'}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingCity === city._id ? (
                              <Box display="flex" gap={1}>
                                <Tooltip title={t('save') || 'Save'}>
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => handleSaveCity(city._id)}
                                    disabled={updatingCity}
                                  >
                                    <Save />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title={t('cancel') || 'Cancel'}>
                                  <IconButton
                                    size="small"
                                    color="inherit"
                                    onClick={handleCancelEdit}
                                    disabled={updatingCity}
                                  >
                                    <Cancel />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            ) : (
                              <Box display="flex" gap={1}>
                                <Tooltip title={t('edit') || 'Edit'}>
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => handleEditCity(city)}
                                  >
                                    <Edit />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title={t('delete') || 'Delete'}>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleDeleteCity(city)}
                                  >
                                    <Delete />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )
            ) : (
              <Alert severity="info">
                {t('pleaseSelectCountry') || 'Please select a country to view and manage its cities'}
              </Alert>
            )}
          </Box>
        </Paper>
      )}

      {/* Contact Submissions Tab */}
      {activeTab === 5 && (
        <Paper>
          <Box p={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                {t('contactSubmissions')}
              </Typography>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>{t('filterByStatus')}</InputLabel>
                <Select
                  value={contactsFilters.status}
                  label={t('filterByStatus')}
                  onChange={(e) => handleContactsFilterChange({ ...contactsFilters, status: e.target.value })}
                >
                  <MenuItem value="">{t('allStatuses')}</MenuItem>
                  <MenuItem value="new">{t('new')}</MenuItem>
                  <MenuItem value="in_progress">{t('inProgress')}</MenuItem>
                  <MenuItem value="resolved">{t('resolved')}</MenuItem>
                  <MenuItem value="closed">{t('closed')}</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {contactsLoading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : contactsError ? (
              <Alert severity="error">
                {t('errorLoadingContacts')}: {contactsError?.data?.message || contactsError?.message}
              </Alert>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('name')}</TableCell>
                        <TableCell>{t('email')}</TableCell>
                        <TableCell>{t('subject')}</TableCell>
                        <TableCell>{t('priority')}</TableCell>
                        <TableCell>{t('status')}</TableCell>
                        <TableCell>{t('submittedAt')}</TableCell>
                        <TableCell>{t('actions')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {contactsData?.data?.contacts?.map((contact) => (
                        <TableRow key={contact._id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {contact.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {contact.email}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {contact.subject}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={contact.priority}
                              color={contact.priority === 'high' ? 'error' : contact.priority === 'medium' ? 'warning' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={t(contact.status)}
                              color={getStatusColor(contact.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {new Date(contact.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Tooltip title={t('viewDetails')}>
                              <IconButton
                                size="small"
                                onClick={() => openContactDialog(contact)}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={contactsData?.data?.pagination?.totalContacts || 0}
                  rowsPerPage={contactsRowsPerPage}
                  page={contactsPage}
                  onPageChange={handleContactsPageChange}
                  onRowsPerPageChange={handleContactsRowsPerPageChange}
                />
              </>
            )}
          </Box>
        </Paper>
      )}

      {/* Database Metrics Tab */}
      {activeTab === 7 && (
        <Paper>
          <Box p={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                {t('databaseMetrics') || 'Database Metrics'}
              </Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Refresh />}
                onClick={() => refetchDbMetrics()}
              >
                {t('refresh') || 'Refresh'}
              </Button>
            </Box>

            {dbMetricsLoading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : dbMetricsError ? (
              <Alert severity="error">
                {t('errorLoadingMetrics') || 'Error loading metrics'}: {dbMetricsError?.data?.message || dbMetricsError?.message}
              </Alert>
            ) : (
              (() => {
                const d = dbMetricsData?.data || {};
                const storageMB = d.storageMB || 0;
                const dataMB = d.dataMB || 0;
                const connections = d.connections || 0;
                const ops = d.opsPerSec || {};
                const totalOps = (ops.insert || 0) + (ops.query || 0) + (ops.update || 0) + (ops.delete || 0) + (ops.command || 0);
                const p95 = Math.round(d.p95LatencyMs || 0);

                // Threshold helpers
                const statusOf = (value, warn, danger) => (value >= danger ? 'error' : value >= warn ? 'warning' : 'success');
                const colorOf = (status) => (status === 'error' ? 'error.main' : status === 'warning' ? 'warning.main' : 'success.main');
                const bgOf = (status, mode) => {
                  if (status === 'error') return mode === 'dark' ? 'rgba(211, 47, 47, 0.12)' : 'rgba(244, 67, 54, 0.10)';
                  if (status === 'warning') return mode === 'dark' ? 'rgba(237, 108, 2, 0.12)' : 'rgba(255, 152, 0, 0.10)';
                  return mode === 'dark' ? 'rgba(46, 125, 50, 0.12)' : 'rgba(76, 175, 80, 0.10)';
                };

                const storageStatus = statusOf(storageMB, 450, 500);
                const connStatus = statusOf(connections, 50, 80);
                const latencyStatus = statusOf(p95, 200, 400);
                const opsStatus = statusOf(totalOps, 50, 100);

                // Overall status (max of individual severities)
                const severityRank = { success: 0, warning: 1, error: 2 };
                const overallStatus = [storageStatus, connStatus, latencyStatus, opsStatus].reduce(
                  (acc, s) => (severityRank[s] > severityRank[acc] ? s : acc),
                  'success'
                );

                return (
                  <>
                    <Alert
                      severity={overallStatus === 'error' ? 'error' : overallStatus === 'warning' ? 'warning' : 'success'}
                      sx={{ mb: 2 }}
                    >
                      {overallStatus === 'success' && (t('dbHealthy') || 'Everything looks healthy. No need to switch.')}
                      {overallStatus === 'warning' && (t('dbWatch') || 'Approaching limits. Prepare to switch to Flex soon.')}
                      {overallStatus === 'error' && (t('dbSwitchNow') || 'Limits exceeded. Plan immediate switch to Flex.')}
                    </Alert>

                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Card
                          sx={{
                            border: '1px solid',
                            borderColor: colorOf(storageStatus),
                            backgroundColor: bgOf(storageStatus, theme.palette.mode),
                          }}
                        >
                          <CardContent>
                            <Typography variant="subtitle2" color="text.secondary">
                              {t('storageUsage') || 'Storage Usage'}
                            </Typography>
                            <Typography variant="h4" fontWeight={800} color={colorOf(storageStatus)}>
                              {storageMB.toFixed(1)} MB
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {t('dataSize') || 'Data size'}: {dataMB.toFixed(1)} MB
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {t('m0LimitHint') || 'M0 limit ~512 MB; switch before 500 MB'}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Card
                          sx={{
                            border: '1px solid',
                            borderColor: colorOf(connStatus),
                            backgroundColor: bgOf(connStatus, theme.palette.mode),
                          }}
                        >
                          <CardContent>
                            <Typography variant="subtitle2" color="text.secondary">
                              {t('activeConnections') || 'Active Connections'}
                            </Typography>
                            <Typography variant="h4" fontWeight={800} color={colorOf(connStatus)}>
                              {connections}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {t('connectionsHint') || 'Warn > 50, Critical > 80 on Free tier'}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Card
                          sx={{
                            border: '1px solid',
                            borderColor: colorOf(latencyStatus),
                            backgroundColor: bgOf(latencyStatus, theme.palette.mode),
                          }}
                        >
                          <CardContent>
                            <Typography variant="subtitle2" color="text.secondary">
                              {t('p95Latency') || 'P95 Latency (ms)'}
                            </Typography>
                            <Typography variant="h4" fontWeight={800} color={colorOf(latencyStatus)}>
                              {p95}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {t('latencyHint') || 'Warn > 200ms, Critical > 400ms'}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Card
                          sx={{
                            border: '1px solid',
                            borderColor: colorOf(opsStatus),
                            backgroundColor: bgOf(opsStatus, theme.palette.mode),
                          }}
                        >
                          <CardContent>
                            <Typography variant="subtitle2" color="text.secondary">
                              {t('throughputOps') || 'Throughput (ops/sec)'}
                            </Typography>
                            <Typography variant="h5" fontWeight={800} color={colorOf(opsStatus)}>
                              {totalOps.toFixed(1)} ops/sec
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              ins {ops.insert?.toFixed(1) || 0}, q {ops.query?.toFixed(1) || 0}, upd {ops.update?.toFixed(1) || 0}, del {ops.delete?.toFixed(1) || 0}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {t('opsHint') || 'Warn > 50, Critical > 100 (sustained) on Free tier'}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  </>
                );
              })()
            )}
          </Box>
        </Paper>
      )}

      {/* Visitor Statistics - Always visible in main dashboard */}
      <Paper sx={{ mt: 3 }}>
        <Box p={2}>
          <VisitorStats />
        </Box>
      </Paper>

      {/* Post Details Dialog */}
      <PostDetailsDialog
        open={postDetailsDialogOpen}
        onClose={() => {
          setPostDetailsDialogOpen(false);
          setSelectedPost(null);
        }}
        post={selectedPost}
        onDelete={handleDeletePostFromTable}
      />

      {/* Contact Details Dialog */}
      <Dialog
        open={contactDialogOpen}
        onClose={() => setContactDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff',
            backgroundImage: 'none',
          }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <ContactMail />
            {t('contactDetails')}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedContact && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {t('contactInformation')}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('name')}:</strong> {selectedContact.name}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('email')}:</strong> {selectedContact.email}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('subject')}:</strong> {selectedContact.subject}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('message')}:</strong> {selectedContact.message}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('priority')}:</strong> {selectedContact.priority}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('status')}:</strong> {t(selectedContact.status)}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('submittedAt')}:</strong> {new Date(selectedContact.createdAt).toLocaleString()}
              </Typography>
              {selectedContact.ipAddress && (
                <Typography variant="body2" paragraph>
                  <strong>IP Address:</strong> {selectedContact.ipAddress}
                </Typography>
              )}

              <Divider sx={{ my: 2 }} />

              <TextField
                fullWidth
                multiline
                rows={3}
                label={t('adminResponse')}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={t('addResponseForThisContact')}
                sx={{ mt: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setContactDialogOpen(false)}>
            {t('cancel')}
          </Button>
          <Button
            onClick={() => handleDeleteContact(selectedContact)}
            color="error"
            variant="outlined"
            disabled={updatingContact}
          >
            {t('deleteContact')}
          </Button>
          <Button
            onClick={() => handleContactStatusUpdate(selectedContact._id, 'in_progress', adminNotes)}
            color="info"
            disabled={updatingContact}
          >
            {t('markAsInProgress')}
          </Button>
          <Button
            onClick={() => handleContactStatusUpdate(selectedContact._id, 'resolved', adminNotes)}
            color="success"
            disabled={updatingContact}
          >
            {t('markAsResolved')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Maintenance Mode Confirmation Dialog */}
      <Dialog
        open={confirmMaintenanceDialogOpen}
        onClose={() => setConfirmMaintenanceDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Warning sx={{ color: 'warning.main', fontSize: 32 }} />
            <Typography variant="h6" fontWeight={700}>
              Confirm Enable Maintenance Mode
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight={600} gutterBottom>
              ⚠️ Warning: Site Accessibility Impact
            </Typography>
            <Typography variant="body2">
              This will make the site inaccessible to all non-admin users. 
              Only administrators will be able to access the system.
            </Typography>
          </Alert>
          
          <Typography variant="body2" gutterBottom>
            <strong>Current Message:</strong>
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              p: 2, 
              bgcolor: 'action.hover', 
              borderRadius: 1,
              fontStyle: 'italic'
            }}
          >
            "{maintenanceMessage || "We're currently performing scheduled maintenance. We'll be back soon! Thank you for your patience."}"
          </Typography>
          
          {estimatedReturn && (
            <>
              <Typography variant="body2" sx={{ mt: 2 }} gutterBottom>
                <strong>Estimated Return:</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {estimatedReturn}
              </Typography>
            </>
          )}
          
          <Typography variant="body2" sx={{ mt: 2 }} color="error">
            Are you sure you want to proceed?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setConfirmMaintenanceDialogOpen(false)}
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleUpdateMaintenance(true)}
            variant="contained"
            color="warning"
            disabled={updatingMaintenance}
            startIcon={updatingMaintenance ? <CircularProgress size={20} /> : <Warning />}
          >
            {updatingMaintenance ? 'Enabling...' : 'Yes, Enable Maintenance Mode'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;
