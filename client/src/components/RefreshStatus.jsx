import React from 'react';
import { useSelector } from 'react-redux';
import { 
  selectIsRefreshing, 
  selectRefreshAttempts, 
  selectLastRefreshError 
} from '../features/auth/authSlice';
import { 
  Alert, 
  Snackbar, 
  CircularProgress, 
  Box, 
  Typography 
} from '@mui/material';

/**
 * RefreshStatus Component
 * 
 * Displays token refresh status and errors to users
 * Provides visual feedback during refresh attempts and error states
 */
const RefreshStatus = () => {
  const isRefreshing = useSelector(selectIsRefreshing);
  const refreshAttempts = useSelector(selectRefreshAttempts);
  const lastRefreshError = useSelector(selectLastRefreshError);

  // Don't show anything if not refreshing and no error
  if (!isRefreshing && !lastRefreshError) {
    return null;
  }

  return (
    <>
      {/* Refresh in progress indicator */}
      {isRefreshing && (
        <Box
          sx={{
            position: 'fixed',
            top: 16,
            right: 16,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            padding: 1,
            borderRadius: 1,
            boxShadow: 2,
          }}
        >
          <CircularProgress size={20} />
          <Typography variant="body2" color="text.secondary">
            {refreshAttempts > 1 
              ? `Refreshing session... (attempt ${refreshAttempts})`
              : 'Refreshing session...'
            }
          </Typography>
        </Box>
      )}

      {/* Refresh error notification */}
      {lastRefreshError && (
        <Snackbar
          open={!!lastRefreshError}
          autoHideDuration={6000}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            severity="error" 
            variant="filled"
            sx={{ width: '100%' }}
          >
            <Typography variant="body2">
              {lastRefreshError}
            </Typography>
          </Alert>
        </Snackbar>
      )}
    </>
  );
};

export default RefreshStatus;
