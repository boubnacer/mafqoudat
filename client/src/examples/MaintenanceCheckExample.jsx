/**
 * EXAMPLES: Using useMaintenanceCheck Hook
 * 
 * This file contains various examples of how to use the useMaintenanceCheck hook
 * in different scenarios. Copy the pattern that best fits your needs.
 */

import React, { useMemo } from 'react';
import { 
  ThemeProvider, 
  CssBaseline, 
  Box, 
  Alert, 
  Button, 
  CircularProgress,
  Paper,
  Typography
} from '@mui/material';
import { Refresh, AdminPanelSettings } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { createTheme } from '@mui/material/styles';

import useMaintenanceCheck from '../hooks/useMaintenanceCheck';
import MaintenanceMode from '../components/MaintenanceMode';
import { selectMode } from '../app/state';
import { useLanguage } from '../utils/languageContext';
import { themeSettings } from '../theme';

// ============================================================================
// EXAMPLE 1: Basic Integration (Recommended)
// ============================================================================

export function AppWithBasicMaintenanceCheck() {
  const { isMaintenanceMode, isLoading } = useMaintenanceCheck();
  const mode = useSelector(selectMode);
  const { currentLanguage } = useLanguage();
  const theme = useMemo(
    () => createTheme(themeSettings(mode, currentLanguage)),
    [mode, currentLanguage]
  );

  if (isLoading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          minHeight="100vh"
        >
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  if (isMaintenanceMode) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <MaintenanceMode />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="App">
        {/* Your normal app content */}
        <h1>Application is running</h1>
      </div>
    </ThemeProvider>
  );
}

// ============================================================================
// EXAMPLE 2: With Error Handling
// ============================================================================

export function AppWithErrorHandling() {
  const { 
    isMaintenanceMode, 
    isLoading, 
    error, 
    checkMaintenance 
  } = useMaintenanceCheck();
  
  const mode = useSelector(selectMode);
  const { currentLanguage } = useLanguage();
  const theme = useMemo(
    () => createTheme(themeSettings(mode, currentLanguage)),
    [mode, currentLanguage]
  );

  if (isLoading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          minHeight="100vh"
          flexDirection="column"
          gap={2}
        >
          <CircularProgress size={60} />
          <Typography variant="body1" color="text.secondary">
            Checking system status...
          </Typography>
        </Box>
      </ThemeProvider>
    );
  }

  if (error) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          minHeight="100vh"
          p={3}
        >
          <Paper elevation={3} sx={{ p: 4, maxWidth: 500 }}>
            <Typography variant="h5" gutterBottom color="error">
              Connection Error
            </Typography>
            <Typography variant="body1" paragraph>
              Unable to check system status: {error}
            </Typography>
            <Button 
              variant="contained" 
              onClick={checkMaintenance}
              startIcon={<Refresh />}
              fullWidth
            >
              Retry
            </Button>
          </Paper>
        </Box>
      </ThemeProvider>
    );
  }

  if (isMaintenanceMode) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <MaintenanceMode />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="App">
        {/* Your app content */}
      </div>
    </ThemeProvider>
  );
}

// ============================================================================
// EXAMPLE 3: With Admin Banner
// ============================================================================

export function AppWithAdminBanner() {
  const { 
    isMaintenanceMode, 
    isLoading, 
    isAdmin,
    checkMaintenance 
  } = useMaintenanceCheck();
  
  const mode = useSelector(selectMode);
  const { currentLanguage } = useLanguage();
  const theme = useMemo(
    () => createTheme(themeSettings(mode, currentLanguage)),
    [mode, currentLanguage]
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Non-admin users see maintenance screen
  if (isMaintenanceMode && !isAdmin) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <MaintenanceMode />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box>
        {/* Admin maintenance mode banner */}
        {isMaintenanceMode && isAdmin && (
          <Alert 
            severity="warning" 
            icon={<AdminPanelSettings />}
            sx={{ 
              mb: 2,
              borderRadius: 0,
              position: 'sticky',
              top: 0,
              zIndex: 1200
            }}
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={checkMaintenance}
                startIcon={<Refresh />}
              >
                Refresh Status
              </Button>
            }
          >
            <strong>🔧 Maintenance Mode Active</strong><br />
            You're accessing the system as an admin. Regular users are seeing the maintenance screen.
          </Alert>
        )}
        
        {/* Your app content */}
        <div className="App">
          <h1>Application</h1>
          {isAdmin && <p>Logged in as: Admin</p>}
        </div>
      </Box>
    </ThemeProvider>
  );
}

// ============================================================================
// EXAMPLE 4: With Manual Refresh Button
// ============================================================================

export function AppWithRefreshButton() {
  const { 
    isMaintenanceMode, 
    isLoading, 
    checkMaintenance 
  } = useMaintenanceCheck();
  
  const mode = useSelector(selectMode);
  const { currentLanguage } = useLanguage();
  const theme = useMemo(
    () => createTheme(themeSettings(mode, currentLanguage)),
    [mode, currentLanguage]
  );

  if (isMaintenanceMode) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box position="relative">
          <MaintenanceMode />
          
          {/* Floating refresh button */}
          <Button
            variant="contained"
            onClick={checkMaintenance}
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : <Refresh />}
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 10000,
              boxShadow: 3
            }}
          >
            {isLoading ? 'Checking...' : 'Check Status'}
          </Button>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="App">
        {/* Your app content */}
      </div>
    </ThemeProvider>
  );
}

// ============================================================================
// EXAMPLE 5: Status Dashboard (For Admins)
// ============================================================================

export function AppWithStatusDashboard() {
  const { 
    isMaintenanceMode, 
    isLoading, 
    isAdmin,
    checkMaintenance,
    error
  } = useMaintenanceCheck();
  
  const mode = useSelector(selectMode);
  const { currentLanguage } = useLanguage();
  const theme = useMemo(
    () => createTheme(themeSettings(mode, currentLanguage)),
    [mode, currentLanguage]
  );

  if (isMaintenanceMode && !isAdmin) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <MaintenanceMode />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box>
        {/* Status dashboard for admins */}
        {isAdmin && (
          <Paper 
            elevation={2} 
            sx={{ 
              p: 2, 
              m: 2, 
              background: theme.palette.mode === 'dark' 
                ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)' 
                : 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)'
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h6" gutterBottom>
                  System Status
                </Typography>
                <Box display="flex" gap={2} alignItems="center">
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: isMaintenanceMode 
                        ? '#ff9800' 
                        : '#4caf50',
                      boxShadow: `0 0 10px ${isMaintenanceMode ? '#ff9800' : '#4caf50'}`
                    }}
                  />
                  <Typography variant="body1">
                    {isMaintenanceMode 
                      ? '🔧 Maintenance Mode Active' 
                      : '✅ System Operational'}
                  </Typography>
                </Box>
                {error && (
                  <Typography variant="caption" color="error">
                    Last check failed: {error}
                  </Typography>
                )}
              </Box>
              
              <Button
                variant="outlined"
                onClick={checkMaintenance}
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={16} /> : <Refresh />}
              >
                {isLoading ? 'Checking...' : 'Refresh'}
              </Button>
            </Box>
          </Paper>
        )}
        
        {/* Your app content */}
        <div className="App">
          {/* ... */}
        </div>
      </Box>
    </ThemeProvider>
  );
}

// ============================================================================
// EXAMPLE 6: Minimal Integration
// ============================================================================

export function AppMinimal() {
  const { isMaintenanceMode } = useMaintenanceCheck();
  
  if (isMaintenanceMode) {
    return <MaintenanceMode />;
  }
  
  return <div className="App">{/* Your content */}</div>;
}

// ============================================================================
// EXAMPLE 7: With Custom Loading Component
// ============================================================================

const CustomLoadingScreen = () => (
  <Box
    display="flex"
    flexDirection="column"
    justifyContent="center"
    alignItems="center"
    minHeight="100vh"
    gap={3}
  >
    <CircularProgress size={80} thickness={4} />
    <Typography variant="h5" color="text.secondary">
      Initializing application...
    </Typography>
    <Typography variant="body2" color="text.secondary">
      Checking system status
    </Typography>
  </Box>
);

export function AppWithCustomLoading() {
  const { isMaintenanceMode, isLoading } = useMaintenanceCheck();
  const mode = useSelector(selectMode);
  const { currentLanguage } = useLanguage();
  const theme = useMemo(
    () => createTheme(themeSettings(mode, currentLanguage)),
    [mode, currentLanguage]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {isLoading && <CustomLoadingScreen />}
      {!isLoading && isMaintenanceMode && <MaintenanceMode />}
      {!isLoading && !isMaintenanceMode && (
        <div className="App">{/* Your content */}</div>
      )}
    </ThemeProvider>
  );
}

// ============================================================================
// USAGE INSTRUCTIONS
// ============================================================================

/**
 * To use any of these examples:
 * 
 * 1. Choose the example that best fits your needs
 * 2. Copy the code into your App.js
 * 3. Adjust styling and components as needed
 * 4. Make sure useMaintenanceCheck hook is properly imported
 * 5. Ensure MaintenanceMode component exists
 * 6. Test with both maintenance on and off
 * 
 * RECOMMENDED: Start with Example 1 (Basic Integration) or Example 3 (With Admin Banner)
 */

export default AppWithBasicMaintenanceCheck;

