import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useGetDashboardQuery } from '../features/posts/postsApiSlice';
import { selectCurrentCountry } from '../app/state';
import { useLanguage } from '../utils/languageContext';

const DebugDash = () => {
  const navigate = useNavigate();
  const [debugInfo, setDebugInfo] = useState([]);
  const currentCountry = useSelector(selectCurrentCountry);
  const { currentLanguage } = useLanguage();

  const addDebugInfo = (message, data = null) => {
    setDebugInfo(prev => [...prev, { message, data, timestamp: new Date().toISOString() }]);
  };

  useEffect(() => {
    addDebugInfo('DebugDash component mounted');
    addDebugInfo('Current country:', currentCountry);
    addDebugInfo('Current language:', currentLanguage);
  }, [currentCountry, currentLanguage]);

  // Try to call the dashboard query
  const { 
    data, 
    isError, 
    error, 
    isLoading,
    isFetching 
  } = useGetDashboardQuery({
    currentCountry,
    language: currentLanguage
  }, {
    skip: !currentCountry
  });

  useEffect(() => {
    addDebugInfo('Dashboard query state:', {
      isLoading,
      isFetching,
      isError,
      hasData: !!data,
      error: error?.data?.message || error?.message || error
    });
  }, [isLoading, isFetching, isError, data, error]);

  return (
    <Box 
      pt={{ xs: "6.5rem", sm: "7rem" }} 
      width="100%"
      p={2}
    >
      <Typography variant="h4" gutterBottom>
        🔍 Debug Dashboard
      </Typography>
      
      <Box mb={3}>
        <Typography variant="h6" gutterBottom>
          Current State:
        </Typography>
        <Typography>Country: {currentCountry || 'Not set'}</Typography>
        <Typography>Language: {currentLanguage}</Typography>
        <Typography>Loading: {isLoading ? 'Yes' : 'No'}</Typography>
        <Typography>Fetching: {isFetching ? 'Yes' : 'No'}</Typography>
        <Typography>Error: {isError ? 'Yes' : 'No'}</Typography>
        <Typography>Has Data: {data ? 'Yes' : 'No'}</Typography>
      </Box>

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6">Error Details:</Typography>
          <Typography>Status: {error?.status}</Typography>
          <Typography>Message: {error?.data?.message || error?.message || 'Unknown error'}</Typography>
          <pre>{JSON.stringify(error, null, 2)}</pre>
        </Alert>
      )}

      {data && (
        <Alert severity="success" sx={{ mb: 2 }}>
          <Typography variant="h6">Success! Dashboard data loaded:</Typography>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </Alert>
      )}

      <Box mb={3}>
        <Typography variant="h6" gutterBottom>
          Debug Log:
        </Typography>
        <Box sx={{ maxHeight: 300, overflow: 'auto', bgcolor: 'grey.100', p: 1 }}>
          {debugInfo.map((info, index) => (
            <Box key={index} mb={1}>
              <Typography variant="caption" color="text.secondary">
                {info.timestamp}
              </Typography>
              <Typography variant="body2">
                {info.message}
              </Typography>
              {info.data && (
                <pre style={{ fontSize: '0.8rem', margin: '4px 0' }}>
                  {JSON.stringify(info.data, null, 2)}
                </pre>
              )}
            </Box>
          ))}
        </Box>
      </Box>

      <Box display="flex" gap={2}>
        <Button 
          variant="contained" 
          onClick={() => navigate('/')}
        >
          Back to Welcome
        </Button>
        <Button 
          variant="outlined" 
          onClick={() => window.location.reload()}
        >
          Reload Page
        </Button>
      </Box>
    </Box>
  );
};

export default DebugDash;
