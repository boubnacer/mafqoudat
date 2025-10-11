import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCredentials } from "./authSlice";
import useTitle from "../../hooks/useTitle";
import { Box, CircularProgress, Typography, useTheme } from "@mui/material";

const OAuthCallback = () => {
  useTitle("Completing Authentication | Mafqoudat");

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const theme = useTheme();

  useEffect(() => {
    // Get token and error from URL parameters
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    // Handle error case
    if (error) {
      console.error('OAuth error:', error);
      navigate(`/login?error=${error}`);
      return;
    }

    // Handle token case
    if (token) {
      try {
        // Dispatch credentials to Redux store
        dispatch(setCredentials({ accessToken: token }));
        
        // Navigate to dashboard
        navigate('/dash');
      } catch (err) {
        console.error('Error setting credentials:', err);
        navigate('/login?error=authentication_failed');
      }
      return;
    }

    // No token or error - redirect to login
    navigate('/login?error=no_token');
  }, [searchParams, navigate, dispatch]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: theme?.palette?.mode === 'dark' 
          ? 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 25%, #2d2d2d 50%, #1a1a1a 75%, #0a0a0a 100%)'
          : 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 50%, #fff3e0 100%)',
        padding: 2,
      }}
    >
      <CircularProgress
        size={60}
        sx={{
          mb: 3,
          color: theme?.palette?.primary?.main || '#667eea',
        }}
      />
      <Typography
        variant="h6"
        sx={{
          color: theme?.palette?.text?.primary,
          fontWeight: 500,
          textAlign: 'center',
        }}
      >
        Completing authentication...
      </Typography>
    </Box>
  );
};

export default OAuthCallback;

