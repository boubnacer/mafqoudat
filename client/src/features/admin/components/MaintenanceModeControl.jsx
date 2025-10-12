import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  Stack,
  Divider
} from '@mui/material';
import {
  Build as BuildIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import {
  useGetSystemSettingsQuery,
  useUpdateMaintenanceModeMutation
} from '../systemSettingsApiSlice';

/**
 * Maintenance Mode Control Component
 * 
 * @description Admin interface for managing maintenance mode
 * Demonstrates usage of systemSettingsApiSlice hooks
 * 
 * @example
 * <MaintenanceModeControl />
 */
const MaintenanceModeControl = () => {
  // Fetch current system settings
  const {
    data: settingsData,
    isLoading: isLoadingSettings,
    error: settingsError,
    refetch
  } = useGetSystemSettingsQuery();

  // Update maintenance mode mutation
  const [
    updateMaintenanceMode,
    {
      isLoading: isUpdating,
      error: updateError,
      isSuccess: updateSuccess
    }
  ] = useUpdateMaintenanceModeMutation();

  // Local state for form
  const [customMessage, setCustomMessage] = useState('');
  const [estimatedReturn, setEstimatedReturn] = useState('');
  const [showCustomFields, setShowCustomFields] = useState(false);

  // Extract maintenance mode data
  const maintenanceMode = settingsData?.data?.maintenanceMode;
  const isActive = maintenanceMode?.isActive || false;

  // Update local state when data loads
  React.useEffect(() => {
    if (maintenanceMode) {
      setCustomMessage(maintenanceMode.message || '');
      setEstimatedReturn(maintenanceMode.estimatedReturn || '');
    }
  }, [maintenanceMode]);

  /**
   * Handle quick toggle (no custom message)
   */
  const handleQuickToggle = async () => {
    try {
      await updateMaintenanceMode({}).unwrap();
      console.log('✅ Maintenance mode toggled successfully');
    } catch (error) {
      console.error('❌ Failed to toggle maintenance mode:', error);
    }
  };

  /**
   * Handle enable with custom message
   */
  const handleEnableWithCustomMessage = async () => {
    if (!customMessage.trim()) {
      alert('Please enter a custom message');
      return;
    }

    try {
      await updateMaintenanceMode({
        isActive: true,
        message: customMessage,
        estimatedReturn: estimatedReturn || 'soon'
      }).unwrap();
      
      console.log('✅ Maintenance mode enabled with custom message');
      setShowCustomFields(false);
    } catch (error) {
      console.error('❌ Failed to enable maintenance mode:', error);
    }
  };

  /**
   * Handle disable
   */
  const handleDisable = async () => {
    try {
      await updateMaintenanceMode({
        isActive: false
      }).unwrap();
      
      console.log('✅ Maintenance mode disabled');
    } catch (error) {
      console.error('❌ Failed to disable maintenance mode:', error);
    }
  };

  // Loading state
  if (isLoadingSettings) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" p={4}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (settingsError) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error" icon={<ErrorIcon />}>
            <Typography variant="body1" fontWeight={600} gutterBottom>
              Failed to load system settings
            </Typography>
            <Typography variant="body2">
              {settingsError.message || 'An error occurred while fetching system settings'}
            </Typography>
            <Button
              startIcon={<RefreshIcon />}
              onClick={refetch}
              sx={{ mt: 2 }}
              variant="outlined"
            >
              Retry
            </Button>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <BuildIcon fontSize="large" color={isActive ? 'warning' : 'action'} />
          <Box flex={1}>
            <Typography variant="h5" fontWeight={600}>
              Maintenance Mode
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Control system-wide maintenance mode
            </Typography>
          </Box>
          <Chip
            label={isActive ? 'ACTIVE' : 'INACTIVE'}
            color={isActive ? 'warning' : 'success'}
            icon={isActive ? <BuildIcon /> : <CheckIcon />}
          />
        </Box>

        {/* Success Message */}
        {updateSuccess && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => {}}>
            Maintenance mode updated successfully
          </Alert>
        )}

        {/* Update Error */}
        {updateError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {updateError.message || 'Failed to update maintenance mode'}
          </Alert>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Current Status */}
        <Box mb={3}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Current Status
          </Typography>
          <Stack spacing={1}>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2">Status:</Typography>
              <Typography variant="body2" fontWeight={600}>
                {isActive ? '🔴 Active' : '🟢 Inactive'}
              </Typography>
            </Box>
            {maintenanceMode?.lastUpdatedBy && (
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">Last Updated By:</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {maintenanceMode.lastUpdatedBy}
                </Typography>
              </Box>
            )}
            {maintenanceMode?.lastUpdatedAt && (
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">Last Updated:</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {new Date(maintenanceMode.lastUpdatedAt).toLocaleString()}
                </Typography>
              </Box>
            )}
          </Stack>
        </Box>

        {/* Current Message */}
        {isActive && (
          <Box mb={3}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Current Message
            </Typography>
            <Typography variant="body2" sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              {maintenanceMode?.message}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" mt={1}>
              Estimated Return: {maintenanceMode?.estimatedReturn}
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Quick Toggle */}
        <Box mb={2}>
          <Typography variant="subtitle2" gutterBottom>
            Quick Toggle
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <Switch
              checked={isActive}
              onChange={handleQuickToggle}
              disabled={isUpdating}
            />
            <Typography variant="body2">
              {isActive ? 'Disable maintenance mode' : 'Enable maintenance mode'}
            </Typography>
          </Box>
        </Box>

        {/* Custom Message Section */}
        {!showCustomFields ? (
          <Button
            variant="outlined"
            onClick={() => setShowCustomFields(true)}
            fullWidth
            disabled={isUpdating}
          >
            Enable with Custom Message
          </Button>
        ) : (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Custom Message
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Enter maintenance message (max 500 characters)"
              disabled={isUpdating}
              helperText={`${customMessage.length}/500 characters`}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              value={estimatedReturn}
              onChange={(e) => setEstimatedReturn(e.target.value)}
              placeholder="Estimated return (e.g., '2 hours', '30 minutes')"
              disabled={isUpdating}
              helperText="Optional - leave blank for 'soon'"
              sx={{ mb: 2 }}
            />
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                onClick={handleEnableWithCustomMessage}
                disabled={isUpdating || !customMessage.trim()}
                fullWidth
              >
                {isUpdating ? <CircularProgress size={24} /> : 'Enable Maintenance'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => setShowCustomFields(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
            </Stack>
          </Box>
        )}

        {/* Disable Button (when active) */}
        {isActive && !showCustomFields && (
          <Button
            variant="contained"
            color="success"
            onClick={handleDisable}
            disabled={isUpdating}
            fullWidth
            sx={{ mt: 2 }}
          >
            {isUpdating ? <CircularProgress size={24} /> : 'Disable Maintenance Mode'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default MaintenanceModeControl;

