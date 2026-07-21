import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useLocation, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCredentials } from "../authSlice";
import { useLoginMutation } from "../authApiSlice";
import { authStorage } from "../../../utils/authStorage";
import useTitle from "../../../hooks/useTitle";
import { LoadingState } from "../../../components/LoadingStates";
import { useTranslation } from "../../../utils/translations";
import authErrorHandler from "../../../utils/authErrorHandler";
import AuthErrorBoundary from "../../../components/AuthErrorBoundary";
import PasswordResetDialog from "../../../components/PasswordResetDialog";

import {
  Box,
  CardContent,
  Button,
  Typography,
  IconButton,
  InputAdornment,
  Alert,
  useTheme,
  alpha,
} from "@mui/material";
import { Visibility, VisibilityOff, Lock, Email, Phone } from "@mui/icons-material";

import {
  AuthPageContainer,
  AuthCardSlot,
  AuthCard,
  AuthTopControls,
  AuthHeader,
  AuthDivider,
  AuthTextField,
  AuthPrimaryButton,
  AuthGoogleButton,
  AuthOutlineButton,
  AuthNeutralButton,
  GoogleGlyph,
  redirectToGoogleAuth,
  OAUTH_WARNING_MESSAGE_KEYS,
  OAUTH_CALLBACK_ERROR_KEYS,
} from "../authShared";

const LoginComponent = () => {
  useTitle("Mafqoudat | Login");

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const theme = useTheme();
  const { t, currentLanguage } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const hasLoadedRedirectMessage = useRef(false);
  const hasReadOauthCallbackError = useRef(false);

  // State
  const [formData, setFormData] = useState({
    emailOrPhone: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [oauthWarningCode, setOauthWarningCode] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [loginNotice, setLoginNotice] = useState(null);

  const infoAlertMessage = loginNotice
    ? typeof loginNotice === 'string'
      ? loginNotice
      : loginNotice.messageKey
        ? t(loginNotice.messageKey, loginNotice.params || {})
        : loginNotice.fallback || ""
    : "";

  // Retranslates automatically if the user switches language while the notice is showing
  const warningMessage = oauthWarningCode ? t(OAUTH_WARNING_MESSAGE_KEYS[oauthWarningCode]) : "";

  // API
  const [login, { isLoading }] = useLoginMutation();

  useEffect(() => {
    if (hasLoadedRedirectMessage.current) return;
    hasLoadedRedirectMessage.current = true;

    const storedMessage = authStorage.getAndClearLoginRedirectMessage();
    if (storedMessage) {
      setLoginNotice(storedMessage);
    } else if (location?.state?.loginMessageKey || location?.state?.loginMessage) {
      setLoginNotice({
        messageKey: location.state.loginMessageKey || null,
        params: location.state.loginMessageParams || {},
        fallback: location.state.loginMessage || null
      });
    }
  }, [location]);

  // Surface ?error= codes OAuthCallback.jsx can redirect back with (oauth_failed,
  // token_generation_failed, oauth_error, no_token, authentication_failed), then
  // strip the param so a refresh doesn't re-show a stale error.
  useEffect(() => {
    if (hasReadOauthCallbackError.current) return;
    hasReadOauthCallbackError.current = true;

    const code = searchParams.get('error');
    if (code) {
      const messageKey = OAUTH_CALLBACK_ERROR_KEYS[code] || 'oauthGenericError';
      setError(t(messageKey));
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check if already logged in
  useEffect(() => {
    if (authStorage.isAuthenticated()) {
      const redirectUrl = authStorage.getAndClearRedirectUrl();

      if (redirectUrl) {
        navigate(redirectUrl);
      } else {
        navigate("/dash");
      }
    }
  }, [navigate]);

  // Handle form input changes
  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    if (error) setError("");
    if (oauthWarningCode) setOauthWarningCode(null);
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setOauthWarningCode(null);

    if (!formData.emailOrPhone.trim()) {
      setError(t('emailOrPhone') + ' ' + t('required'));
      return;
    }

    if (!formData.password.trim()) {
      setError(t('password') + ' ' + t('required'));
      return;
    }

    setIsSubmitting(true);

    try {
      const { accessToken } = await login({
        emailOrPhone: formData.emailOrPhone.trim(),
        password: formData.password
      }).unwrap();

      dispatch(setCredentials({ accessToken }));

      const redirectUrl = authStorage.getAndClearRedirectUrl();

      if (redirectUrl) {
        navigate(redirectUrl);
      } else {
        const countryRedirectUrl = localStorage.getItem('redirectAfterCountrySelection');
        if (countryRedirectUrl) {
          localStorage.removeItem('redirectAfterCountrySelection');
          navigate(countryRedirectUrl);
        } else {
          navigate("/dash");
        }
      }
    } catch (err) {
      const serverMessage = err?.data?.message || err?.message || null;
      const warningKey = OAUTH_WARNING_MESSAGE_KEYS[serverMessage];

      if (warningKey) {
        setOauthWarningCode(serverMessage);
      } else {
        const errorResult = await authErrorHandler.handleLoginError(err, { t });
        setError(errorResult.errorMessage.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingState message={t('signingIn')} />;
  }

  return (
    <AuthPageContainer key={currentLanguage}>
      <AuthTopControls />

      <AuthCardSlot>
        <AuthCard>
          <CardContent sx={{ p: { xs: 3, md: 5 } }}>
            <AuthHeader title={t('welcomeBack')} subtitle={t('welcomeMessage')} />

            {infoAlertMessage && (
              <Alert
                severity="info"
                sx={{ mb: 2, borderRadius: `${theme.custom.radius.md}px` }}
                onClose={() => setLoginNotice(null)}
              >
                {infoAlertMessage}
              </Alert>
            )}

            {warningMessage && (
              <Alert
                severity="warning"
                sx={{ mb: 2, borderRadius: `${theme.custom.radius.md}px` }}
                onClose={() => setOauthWarningCode(null)}
                action={
                  <Button color="inherit" size="small" onClick={redirectToGoogleAuth} sx={{ fontWeight: 600 }}>
                    {t('continueWithGoogle')}
                  </Button>
                }
              >
                {warningMessage}
              </Alert>
            )}

            {error && (
              <Alert
                severity="error"
                sx={{ mb: 2, borderRadius: `${theme.custom.radius.md}px` }}
                onClose={() => setError("")}
              >
                {error}
              </Alert>
            )}

            <AuthGoogleButton
              fullWidth
              variant="outlined"
              onClick={redirectToGoogleAuth}
              startIcon={<GoogleGlyph />}
              sx={{ mb: 2 }}
            >
              {t('continueWithGoogle')}
            </AuthGoogleButton>

            <AuthDivider />

            <Box component="form" onSubmit={handleSubmit}>
              <AuthTextField
                fullWidth
                label={t('emailOrPhone')}
                placeholder={t('emailOrPhonePlaceholder')}
                value={formData.emailOrPhone}
                onChange={handleInputChange('emailOrPhone')}
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Email sx={{ color: alpha(theme.custom.color.ink, 0.5), fontSize: '1.2rem' }} />
                        <Phone sx={{ color: alpha(theme.custom.color.ink, 0.5), fontSize: '1.2rem' }} />
                      </Box>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 1 }}
              />

              <AuthTextField
                fullWidth
                label={t('password')}
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange('password')}
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: alpha(theme.custom.color.ink, 0.5) }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                        sx={{ color: alpha(theme.custom.color.ink, 0.5) }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 1 }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                <Button
                  onClick={() => setResetPasswordDialogOpen(true)}
                  sx={{
                    color: theme.custom.color.brandPrimary,
                    textTransform: 'none',
                    fontWeight: 500,
                  }}
                >
                  {t('forgotPassword')}
                </Button>
              </Box>

              <AuthPrimaryButton
                type="submit"
                fullWidth
                variant="contained"
                disabled={isSubmitting}
              >
                {isSubmitting ? t('signingIn') : t('signin')}
              </AuthPrimaryButton>
            </Box>

            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography
                variant="body2"
                sx={{ mb: 2, color: alpha(theme.custom.color.ink, 0.7) }}
              >
                {t('firstTime')}
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <AuthOutlineButton component={Link} to="/signup">
                  {t('createAccount')}
                </AuthOutlineButton>

                <AuthNeutralButton component={Link} to="/">
                  {t('searchCountry')}
                </AuthNeutralButton>
              </Box>
            </Box>
          </CardContent>
        </AuthCard>
      </AuthCardSlot>

      <PasswordResetDialog
        open={resetPasswordDialogOpen}
        onClose={() => setResetPasswordDialogOpen(false)}
      />
    </AuthPageContainer>
  );
};

const Login = () => (
  <AuthErrorBoundary>
    <LoginComponent />
  </AuthErrorBoundary>
);

export default Login;
