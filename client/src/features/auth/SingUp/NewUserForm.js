import React, { useState, useEffect } from "react";
import { useAddNewUserMutation } from "../../userSettings/usersApiSlice";
import { useNavigate, Link } from "react-router-dom";
import useTitle from "../../../hooks/useTitle";
import { useDispatch } from "react-redux";
import { setCredentials } from "../authSlice";
import { authStorage } from "../../../utils/authStorage";
import { useTranslation } from "../../../utils/translations";
import authErrorHandler from "../../../utils/authErrorHandler";
import AuthErrorBoundary from "../../../components/AuthErrorBoundary";

import {
  Box,
  CardContent,
  Button,
  Typography,
  InputAdornment,
  Alert,
  useTheme,
  alpha,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Checkbox,
} from "@mui/material";
import { Lock, Email, Phone, LocationOn } from "@mui/icons-material";

import {
  AuthPageContainer,
  AuthCardSlot,
  AuthCard,
  AuthTopControls,
  AuthHeader,
  AuthDivider,
  AuthFormField,
  AuthFieldLabel,
  AuthSelectField,
  AuthPrimaryButton,
  AuthGoogleButton,
  AuthFacebookButton,
  AuthOutlineButton,
  AuthNeutralButton,
  AuthPromptRow,
  GoogleGlyph,
  FacebookGlyph,
  useAuthCompactLayout,
  AUTH_CARD_CONTENT_SX,
  redirectToGoogleAuth,
  redirectToFacebookAuth,
  OAUTH_WARNING_MESSAGE_KEYS,
} from "../authShared";

const NewUserFormComponent = ({ countries }) => {
  useTitle("Mafqoudat | Sign Up");

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  const { t, currentLanguage } = useTranslation();
  const isCompact = useAuthCompactLayout();

  // Check for already logged in users and redirect if needed
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

  // API
  const [addNewUser] = useAddNewUserMutation();

  // State
  const [formData, setFormData] = useState({
    emailOrPhone: "",
    password: "",
    country: countries?.[0]?.id || "",
    acceptTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [errorCode, setErrorCode] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation patterns
  const PWD_REGEX = /^[A-z0-9!@#$%]{4,12}$/;

  // Retranslates automatically if the user switches language while the notice is showing
  const warningMessage = errorCode ? t(OAUTH_WARNING_MESSAGE_KEYS[errorCode]) : "";

  // Handle form input changes
  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
    if (formError) setFormError("");
    if (errorCode) setErrorCode(null);
  };

  // Handle checkbox changes
  const handleCheckboxChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.checked
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
  };

  // Get country label based on language
  const getCountryLabel = (option) => {
    if (!option) return '';
    if (option.names && option.names[currentLanguage || 'en']) {
      return option.names[currentLanguage || 'en'];
    }
    if (option.labels && option.labels[currentLanguage || 'en']) {
      return option.labels[currentLanguage || 'en'];
    }
    return option.label || option.code;
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.emailOrPhone.trim()) {
      newErrors.emailOrPhone = t('emailOrPhone') + ' ' + t('required');
    }

    if (!formData.password) {
      newErrors.password = t('password') + ' ' + t('required');
    } else if (!PWD_REGEX.test(formData.password)) {
      newErrors.password = t('password') + ' ' + t('mustBeValid');
    }

    if (!formData.country) {
      newErrors.country = t('chooseCountry');
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = t('termsRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const { accessToken } = await addNewUser({
        username: formData.emailOrPhone.trim(),
        password: formData.password,
        country: formData.country,
      }).unwrap();

      dispatch(setCredentials({ accessToken }));

      const redirectUrl = authStorage.getAndClearRedirectUrl();

      if (redirectUrl) {
        navigate(redirectUrl);
      } else {
        navigate("/dash");
      }
    } catch (err) {
      const serverMessage = err?.data?.message || err?.message || null;
      const warningKey = OAUTH_WARNING_MESSAGE_KEYS[serverMessage];

      if (warningKey) {
        setErrorCode(serverMessage);
        setFormError("");
      } else {
        setErrorCode(null);
        const errorResult = await authErrorHandler.handleLoginError(err, {
          t,
          customMessage: serverMessage
        });
        setFormError(errorResult.errorMessage.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPageContainer key={currentLanguage}>
      <AuthTopControls />

      <AuthCardSlot>
        {/* Mobile puts the wordmark on the page background above the card,
            the way the Expo SignUpScreen does; desktop keeps it inside. */}
        {isCompact && (
          <AuthHeader
            title={t('createAccount')}
            subtitle={t('createAccountMessage')}
            tagline={t('createAccountTagline')}
          />
        )}

        <AuthCard>
          <CardContent sx={AUTH_CARD_CONTENT_SX}>
            {!isCompact && (
              <AuthHeader title={t('createAccount')} subtitle={t('createAccountMessage')} />
            )}

            {warningMessage && (
              <Alert
                severity="warning"
                sx={{ mb: 2, borderRadius: `${theme.custom.radius.md}px` }}
                onClose={() => setErrorCode(null)}
                action={
                  <Button color="inherit" size="small" onClick={redirectToGoogleAuth} sx={{ fontWeight: 600 }}>
                    {t('continueWithGoogle')}
                  </Button>
                }
              >
                {warningMessage}
              </Alert>
            )}

            {formError && (
              <Alert
                severity="error"
                sx={{ mb: 2, borderRadius: `${theme.custom.radius.md}px` }}
                onClose={() => setFormError("")}
              >
                {formError}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={2.5}>
                <Grid item xs={12}>
                  <AuthGoogleButton
                    fullWidth
                    variant="outlined"
                    onClick={redirectToGoogleAuth}
                    startIcon={<GoogleGlyph />}
                    sx={{ mb: 1 }}
                  >
                    {t('continueWithGoogle')}
                  </AuthGoogleButton>

                  <AuthFacebookButton
                    fullWidth
                    variant="outlined"
                    onClick={redirectToFacebookAuth}
                    startIcon={<FacebookGlyph />}
                    sx={{ mb: 1 }}
                  >
                    {t('continueWithFacebook')}
                  </AuthFacebookButton>

                  <AuthDivider />
                </Grid>

                <Grid item xs={12}>
                  <AuthFormField
                    label={t('emailOrPhone')}
                    placeholder={t('emailOrPhonePlaceholder')}
                    value={formData.emailOrPhone}
                    onChange={handleInputChange('emailOrPhone')}
                    error={!!errors.emailOrPhone}
                    helperText={errors.emailOrPhone}
                    startIcon={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Email sx={{ color: alpha(theme.custom.color.ink, 0.5), fontSize: '1.2rem' }} />
                        <Phone sx={{ color: alpha(theme.custom.color.ink, 0.5), fontSize: '1.2rem' }} />
                      </Box>
                    }
                    inputProps={{
                      autoComplete: 'off',
                      spellCheck: false,
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <AuthFormField
                    label={t('password')}
                    placeholder={t('passwordPlaceholder')}
                    value={formData.password}
                    onChange={handleInputChange('password')}
                    error={!!errors.password}
                    helperText={errors.password}
                    password
                    showPassword={showPassword}
                    onTogglePassword={() => setShowPassword(!showPassword)}
                    startIcon={<Lock sx={{ color: alpha(theme.custom.color.ink, 0.5) }} />}
                  />
                </Grid>

                <Grid item xs={12}>
                  {isCompact && <AuthFieldLabel component="label">{t('chooseCountry')}</AuthFieldLabel>}
                  <AuthSelectField fullWidth error={!!errors.country}>
                    {!isCompact && <InputLabel>{t('chooseCountry')}</InputLabel>}
                    <Select
                      value={formData.country}
                      onChange={handleInputChange('country')}
                      label={isCompact ? undefined : t('chooseCountry')}
                      startAdornment={
                        isCompact ? undefined : (
                          <InputAdornment position="start">
                            <LocationOn sx={{ color: alpha(theme.custom.color.ink, 0.5) }} />
                          </InputAdornment>
                        )
                      }
                    >
                      {countries?.map((country) => (
                        <MenuItem key={country._id} value={country._id}>
                          <Box display="flex" alignItems="center" gap={1}>
                            {country.flag ? (
                              <span style={{ fontSize: '20px' }}>
                                {country.flag}
                              </span>
                            ) : (
                              <img
                                loading="lazy"
                                width="20"
                                src={`https://flagcdn.com/w20/${country.code.toLowerCase()}.png`}
                                srcSet={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png 2x`}
                                alt=""
                                style={{ marginInlineEnd: 8 }}
                              />
                            )}
                            {getCountryLabel(country)} ({country.code})
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </AuthSelectField>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 0.5, sm: 1.5 } }}>
                    <Checkbox
                      checked={formData.acceptTerms}
                      onChange={handleCheckboxChange('acceptTerms')}
                      size={isCompact ? 'small' : 'medium'}
                      sx={{
                        color: alpha(theme.custom.color.ink, 0.4),
                        '&.Mui-checked': {
                          color: theme.custom.color.brandPrimary,
                        },
                      }}
                    />
                    <Box sx={{ flex: 1, pt: { xs: 0.5, sm: 1 } }}>
                      <Typography
                        variant="body2"
                        sx={{ lineHeight: 1.6, color: theme.custom.color.ink }}
                      >
                        {t('acceptTerms')}{' '}
                        <Button
                          component={Link}
                          to="/terms"
                          sx={{
                            color: theme.custom.color.brandPrimary,
                            textDecoration: 'underline',
                            p: 0,
                            minWidth: 'auto',
                            fontSize: 'inherit',
                            fontWeight: 600,
                            textTransform: 'none',
                            '&:hover': { backgroundColor: 'transparent' },
                          }}
                        >
                          {t('termsAndConditions')}
                        </Button>
                      </Typography>
                      {errors.acceptTerms && (
                        <Typography
                          variant="body2"
                          sx={{ color: theme.palette.error.main, mt: 0.5 }}
                        >
                          {errors.acceptTerms}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Grid>
              </Grid>

              <AuthPrimaryButton
                type="submit"
                fullWidth
                variant="contained"
                disabled={isSubmitting}
                sx={{ mt: 3 }}
              >
                {isSubmitting ? t('creatingAccount') : t('createAccount')}
              </AuthPrimaryButton>
            </Box>

            {!isCompact && (
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Typography
                  variant="body2"
                  sx={{ mb: 2, color: alpha(theme.custom.color.ink, 0.7) }}
                >
                  {t('alreadyMember')}
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <AuthOutlineButton component={Link} to="/login">
                    {t('signin')}
                  </AuthOutlineButton>

                  <AuthNeutralButton component={Link} to="/">
                    {t('searchCountry')}
                  </AuthNeutralButton>
                </Box>
              </Box>
            )}
          </CardContent>
        </AuthCard>

        {isCompact && (
          <>
            <AuthPromptRow
              prompt={t('signInPrompt')}
              actionLabel={t('signin')}
              to="/login"
            />
            <Button
              component={Link}
              to="/"
              sx={{
                mt: 0.5,
                textTransform: 'none',
                fontWeight: 500,
                color: alpha(theme.custom.color.ink, 0.6),
              }}
            >
              {t('searchCountry')}
            </Button>
          </>
        )}
      </AuthCardSlot>
    </AuthPageContainer>
  );
};

const NewUserForm = (props) => (
  <AuthErrorBoundary>
    <NewUserFormComponent {...props} />
  </AuthErrorBoundary>
);

export default NewUserForm;
