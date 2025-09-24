import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  Alert, 
  Divider,
  Chip,
  Stack
} from '@mui/material';
import { 
  Language, 
  Security, 
  CheckCircle, 
  Error, 
  Refresh 
} from '@mui/icons-material';
import { runLanguageAuthIntegrationTest, testAuthAfterPageRefresh } from '../utils/testLanguageAuthIntegration';
import { authStorage, languageStorage } from '../utils/authStorage';

/**
 * Language Authentication Test Component
 * 
 * This component provides a UI to test the language switching
 * integration and verify that authentication state is preserved.
 * 
 * It should only be used in development/testing environments.
 */
const LanguageAuthTest = () => {
  const [testResults, setTestResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentAuthState, setCurrentAuthState] = useState(null);

  const runTests = async () => {
    setIsRunning(true);
    try {
      const results = runLanguageAuthIntegrationTest();
      setTestResults(results);
    } catch (error) {
      console.error('Test execution error:', error);
      setTestResults({
        overallSuccess: false,
        error: error.message
      });
    } finally {
      setIsRunning(false);
    }
  };

  const checkCurrentAuthState = () => {
    const authState = authStorage.getAuthState();
    const verification = authStorage.verifyAuthPersistence();
    setCurrentAuthState({
      authState,
      verification,
      currentLanguage: languageStorage.getCurrentLanguage()
    });
  };

  const getStatusColor = (success) => {
    return success ? 'success' : 'error';
  };

  const getStatusIcon = (success) => {
    return success ? <CheckCircle /> : <Error />;
  };

  return (
    <Paper sx={{ p: 3, m: 2, maxWidth: 800 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Language color="primary" />
        <Typography variant="h6" component="h2">
          Language Authentication Integration Test
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>
        This component tests that authentication state is properly preserved during language switching operations.
      </Alert>

      <Stack spacing={2}>
        <Box>
          <Button
            variant="contained"
            onClick={runTests}
            disabled={isRunning}
            startIcon={isRunning ? <Refresh /> : <Security />}
            sx={{ mr: 2 }}
          >
            {isRunning ? 'Running Tests...' : 'Run Integration Tests'}
          </Button>
          
          <Button
            variant="outlined"
            onClick={checkCurrentAuthState}
            startIcon={<Security />}
          >
            Check Current Auth State
          </Button>
        </Box>

        {currentAuthState && (
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="subtitle2" gutterBottom>
              Current Authentication State:
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <Chip
                icon={getStatusIcon(currentAuthState.authState.hasToken)}
                label={`Token: ${currentAuthState.authState.hasToken ? 'Present' : 'Missing'}`}
                color={getStatusColor(currentAuthState.authState.hasToken)}
                size="small"
              />
              <Chip
                icon={getStatusIcon(currentAuthState.authState.hasUser)}
                label={`User: ${currentAuthState.authState.hasUser ? 'Present' : 'Missing'}`}
                color={getStatusColor(currentAuthState.authState.hasUser)}
                size="small"
              />
              <Chip
                icon={getStatusIcon(currentAuthState.authState.isLoggedIn)}
                label={`Logged In: ${currentAuthState.authState.isLoggedIn ? 'Yes' : 'No'}`}
                color={getStatusColor(currentAuthState.authState.isLoggedIn)}
                size="small"
              />
              <Chip
                label={`Language: ${currentAuthState.currentLanguage.toUpperCase()}`}
                variant="outlined"
                size="small"
              />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Verification: {currentAuthState.verification.success ? '✅ Passed' : '❌ Failed'}
            </Typography>
          </Paper>
        )}

        {testResults && (
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              {getStatusIcon(testResults.overallSuccess)}
              <Typography variant="h6">
                Test Results
              </Typography>
              <Chip
                label={testResults.overallSuccess ? 'All Tests Passed' : 'Some Tests Failed'}
                color={getStatusColor(testResults.overallSuccess)}
                size="small"
              />
            </Box>

            {testResults.tests && testResults.tests.map((test, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  {getStatusIcon(test.success)}
                  <Typography variant="subtitle2">
                    {test.name}
                  </Typography>
                  <Chip
                    label={test.success ? 'Passed' : 'Failed'}
                    color={getStatusColor(test.success)}
                    size="small"
                  />
                </Box>
                
                {test.data && (
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                    {test.message}
                  </Typography>
                )}
                
                {index < testResults.tests.length - 1 && <Divider sx={{ mt: 1 }} />}
              </Box>
            ))}

            {testResults.error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                Test Error: {testResults.error}
              </Alert>
            )}
          </Paper>
        )}
      </Stack>
    </Paper>
  );
};

export default LanguageAuthTest;
