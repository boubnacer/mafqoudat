import React, { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCredentials } from "./authSlice";
import { exchangeOAuthCode } from "../../utils/oauthExchange";
import useTitle from "../../hooks/useTitle";
import { Box, CircularProgress, Typography, useTheme } from "@mui/material";

const OAuthCallback = () => {
  useTitle("Completing Authentication | Mafqoudat");

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const theme = useTheme();
  // The exchange code is single-use server-side, so a second call (e.g.
  // React.StrictMode's double-invoked effect in dev) must not redeem it twice.
  const exchanging = useRef(false);

  useEffect(() => {
    // Get code and error from URL parameters. The server used to put the
    // access token itself here (?token=...); it now hands back a one-time
    // opaque code instead (see server/utils/oauthExchange.js), traded below
    // for the real token.
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // Handle error case
    if (error) {
      console.error('OAuth error:', error);
      navigate(`/login?error=${error}`);
      return;
    }

    // Handle code case
    if (code) {
      if (exchanging.current) return;
      exchanging.current = true;

      exchangeOAuthCode(code).then((accessToken) => {
        if (!accessToken) {
          navigate('/login?error=authentication_failed');
          return;
        }
        try {
          // Dispatch credentials to Redux store
          dispatch(setCredentials({ accessToken }));

          // Navigate to dashboard
          navigate('/dash');
        } catch (err) {
          console.error('Error setting credentials:', err);
          navigate('/login?error=authentication_failed');
        }
      });
      return;
    }

    // No code or error - redirect to login
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

