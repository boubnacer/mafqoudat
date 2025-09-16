import React, { useState, useEffect } from "react";
import { useAddNewUserMutation } from "../../userSettings/usersApiSlice";
import { useNavigate, Link } from "react-router-dom";
import useTitle from "../../../hooks/useTitle";
import { useDispatch } from "react-redux";
import { setCredentials } from "../authSlice";
import { useTranslation } from "../../../utils/translations";
import { isRTL } from "../../../utils/languageUtils";
import { useLanguage } from "../../../utils/languageContext";

import { LoadingState } from "../../../components/LoadingStates";
// Material-UI imports
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  IconButton,
  InputAdornment,
  Alert,
  FormControlLabel,
  Checkbox,
  Divider,
  useTheme,
  useMediaQuery,
  alpha,
  styled,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  Chip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Menu,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Person,
  Lock,
  Email,
  Phone,
  LocationOn,
  DarkModeOutlined,
  LightModeOutlined,
  ArrowForward,
  Language,
  Security,
  CheckCircle,
  AccountCircle,
  KeyboardArrowDown,
} from "@mui/icons-material";
import { setMode } from "../../../app/state";

// Completely new styled components with different design approach
const PageContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  background: theme?.palette?.mode === 'dark' 
    ? 'linear-gradient(135deg, #121226 0%, #1a1a3a 25%, #2a2a4a 50%, #1a1a3a 75%, #121226 100%)'
    : 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 50%, #fff3e0 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme?.spacing?.(2) || '16px',
  position: 'relative',
  direction: theme?.direction || 'ltr',
}));

const MainCard = styled(Card)(({ theme }) => ({
  width: '100%',
  maxWidth: 600,
  borderRadius: 24,
  boxShadow: theme?.palette?.mode === 'dark'
    ? '0 30px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)'
    : '0 30px 60px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(20px)',
  background: theme?.palette?.mode === 'dark'
    ? 'rgba(25, 25, 35, 0.95)'
    : 'rgba(255, 255, 255, 0.95)',
  border: `1px solid ${alpha(theme?.palette?.primary?.main || '#667eea', 0.1)}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: theme?.palette?.mode === 'dark'
      ? '0 40px 80px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.1)'
      : '0 40px 80px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.95)',
  }
}));

const HeaderSection = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  marginTop: '70px',
  marginBottom: theme?.spacing?.(4) || '32px',
  position: 'relative',
}));

const BrandLogo = styled(Box)(({ theme }) => ({
  width: 80,
  height: 80,
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #043FA5 0%, #1B6EEF 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 16px',
  boxShadow: '0 10px 30px rgba(4, 63, 165, 0.3)',
  '& svg': {
    fontSize: 40,
    color: 'white',
  }
}));

const ModernTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 12,
    backgroundColor: theme?.palette?.mode === 'dark' 
      ? 'rgba(255, 255, 255, 0.05)'
      : 'rgba(0, 0, 0, 0.02)',
    border: `1px solid ${alpha(theme?.palette?.primary?.main || '#667eea', 0.1)}`,
    transition: 'all 0.3s ease',
    fontSize: { xs: '1.1rem', md: '1.2rem' },
    padding: { xs: '8px 12px', md: '12px 16px' },
    minHeight: { xs: '56px', md: '60px' },
    '&:hover': {
      borderColor: alpha(theme?.palette?.primary?.main || '#667eea', 0.3),
      backgroundColor: theme?.palette?.mode === 'dark' 
        ? 'rgba(255, 255, 255, 0.08)'
        : 'rgba(0, 0, 0, 0.04)',
    },
    '&.Mui-focused': {
      borderColor: theme?.palette?.primary?.main || '#667eea',
      backgroundColor: theme?.palette?.mode === 'dark' 
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(0, 0, 0, 0.06)',
      boxShadow: `0 0 0 3px ${alpha(theme?.palette?.primary?.main || '#667eea', 0.1)}`,
    }
  },
  '& .MuiInputLabel-root': {
    color: theme?.palette?.text?.secondary,
    fontWeight: 500,
    fontSize: { xs: '1.1rem', md: '1.2rem' },
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: theme?.palette?.primary?.main || '#667eea',
    fontWeight: 600,
  }
}));

const ModernSelect = styled(FormControl)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 12,
    backgroundColor: theme?.palette?.mode === 'dark' 
      ? 'rgba(255, 255, 255, 0.05)'
      : 'rgba(0, 0, 0, 0.02)',
    border: `1px solid ${alpha(theme?.palette?.primary?.main || '#667eea', 0.1)}`,
    transition: 'all 0.3s ease',
    fontSize: { xs: '1.1rem', md: '1.2rem' },
    padding: { xs: '8px 12px', md: '12px 16px' },
    minHeight: { xs: '56px', md: '60px' },
    '&:hover': {
      borderColor: alpha(theme?.palette?.primary?.main || '#667eea', 0.3),
      backgroundColor: theme?.palette?.mode === 'dark' 
        ? 'rgba(255, 255, 255, 0.08)'
        : 'rgba(0, 0, 0, 0.04)',
    },
    '&.Mui-focused': {
      borderColor: theme?.palette?.primary?.main || '#667eea',
      backgroundColor: theme?.palette?.mode === 'dark' 
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(0, 0, 0, 0.06)',
      boxShadow: `0 0 0 3px ${alpha(theme?.palette?.primary?.main || '#667eea', 0.1)}`,
    }
  },
  '& .MuiInputLabel-root': {
    color: theme?.palette?.text?.secondary,
    fontWeight: 500,
    fontSize: { xs: '1.1rem', md: '1.2rem' },
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: theme?.palette?.primary?.main || '#667eea',
    fontWeight: 600,
  }
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: 12,
  padding: { xs: '16px 24px', md: '18px 32px' },
  fontSize: { xs: '1.1rem', md: '1.2rem' },
  fontWeight: 600,
  textTransform: 'none',
  background: 'linear-gradient(135deg, #4A7BC8 0%, #5B8FDF 100%)',
  color: 'white',
  border: 'none',
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
  minHeight: { xs: '56px', md: '60px' },
  '&:hover': {
    background: 'linear-gradient(135deg, #3A6BB8 0%, #4B7FCF 100%)',
    transform: 'translateY(-2px)',
    boxShadow: '0 10px 25px rgba(74, 123, 200, 0.4)',
  },
  '&:active': {
    transform: 'translateY(0)',
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
    transition: 'left 0.5s',
  },
  '&:hover::before': {
    left: '100%',
  }
}));

const TopControlsContainer = styled(Box)(({ theme, currentLanguage }) => ({
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  width: '100%',
  padding: theme?.spacing?.(2) || '16px',
  position: 'absolute',
  top: '10px',
  left: '20px',
  right: 0,
  zIndex: 10,
  [theme?.breakpoints?.down?.('sm') || '@media (max-width: 600px)']: {
    left: 0,
    right: 0,
    padding: theme?.spacing?.(1) || '8px',
  },
}));

const ControlsGroup = styled(Box)(({ theme, currentLanguage }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme?.spacing?.(1) || '8px',
  marginRight: currentLanguage === 'ar' ? 0 : theme?.spacing?.(2) || '16px',
  marginLeft: currentLanguage === 'ar' ? theme?.spacing?.(2) || '16px' : 0,
  [theme?.breakpoints?.down?.('sm') || '@media (max-width: 600px)']: {
    gap: theme?.spacing?.(2) || '16px',
    marginTop:'10px',
    marginRight:  '20px',
    marginLeft:  '20px',
  },
}));

const LanguageSelector = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: '12px 20px',
  borderRadius: '12px',
  cursor: 'pointer',
  background: theme?.palette?.mode === 'dark' 
    ? 'rgba(255, 255, 255, 0.1)'
    : 'rgba(0, 0, 0, 0.05)',
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme?.palette?.primary?.main || '#667eea', 0.1)}`,
  transition: 'all 0.3s ease',
  minHeight: '48px',
  '&:hover': {
    background: theme?.palette?.mode === 'dark' 
      ? 'rgba(255, 255, 255, 0.2)'
      : 'rgba(0, 0, 0, 0.1)',
    transform: 'translateY(-2px)',
  },
  '& .MuiSvgIcon-root': {
    marginRight: '12px',
    fontSize: '24px',
  },
}));

const ControlButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: theme?.palette?.mode === 'dark' 
    ? 'rgba(255, 255, 255, 0.1)'
    : 'rgba(0, 0, 0, 0.05)',
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme?.palette?.primary?.main || '#667eea', 0.1)}`,
  color: theme?.palette?.text?.primary,
  transition: 'all 0.3s ease',
  width: '48px',
  height: '48px',
  '&:hover': {
    backgroundColor: theme?.palette?.mode === 'dark' 
      ? 'rgba(255, 255, 255, 0.2)'
      : 'rgba(0, 0, 0, 0.1)',
    transform: 'scale(1.05)',
  },
  '& .MuiSvgIcon-root': {
    fontSize: '24px',
  }
}));

const NewUserForm = ({ countries }) => {
  useTitle("Mafqoudat | Sign Up");

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme() || {};
  const isMobile = useMediaQuery(theme?.breakpoints?.down?.('sm') || '(max-width: 600px)');
  const { t, currentLanguage } = useTranslation();
  const { setLanguage } = useLanguage();
  const isRTLMode = isRTL();

  // Debug logging
  useEffect(() => {
    console.log('SignUp component - currentLanguage:', currentLanguage);
  }, [currentLanguage]);

  // Check for already logged in users and redirect if needed
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn === 'true') {
      // Check for redirect URL and handle it directly here
      const redirectUrl = localStorage.getItem('redirectAfterLogin');
      console.log('Already logged in - checking for redirect URL:', redirectUrl);
      
      if (redirectUrl) {
        console.log('Already logged in - redirecting to stored URL:', redirectUrl);
        localStorage.removeItem('redirectAfterLogin');
        navigate(redirectUrl);
      } else {
        console.log('Already logged in - no redirect URL, going to dashboard');
        navigate("/dash");
      }
    }
  }, [navigate]);

  // API
  const [addNewUser, { isLoading, isError, error }] = useAddNewUserMutation();

  // State
  const [formData, setFormData] = useState({
    emailOrPhone: "",
    password: "",
    country: countries?.[0]?.id || "",
    acceptTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [languageAnchorEl, setLanguageAnchorEl] = useState(null);

  // Validation patterns
  const PWD_REGEX = /^[A-z0-9!@#$%]{4,12}$/;
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_REGEX = /^[+]?[\d\s\-\(\)]{7,20}$/;

  // Handle form input changes
  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear field-specific error
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
  };

  // Handle checkbox changes
  const handleCheckboxChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.checked
    }));
    
    // Clear field-specific error
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
  };

  // Language dropdown handlers - same approach as navbar
  const handleLanguageClick = (event) => {
    setLanguageAnchorEl(event.currentTarget);
  };

  const handleLanguageClose = () => {
    setLanguageAnchorEl(null);
  };

  const handleLanguageChange = (newLanguage) => {
    // Use the language context to change language instead of reloading
    if (setLanguage(newLanguage)) {
      handleLanguageClose();
    }
  };

  // Get language display name
  const getLanguageDisplayName = (lang) => {
    switch (lang) {
      case 'en':
        return 'English';
      case 'ar':
        return 'العربية';
      case 'fr':
        return 'Français';
      default:
        return 'English';
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

  // Validate email or phone - accept any non-empty input
  const validateEmailOrPhone = (value) => {
    return value.trim().length > 0;
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Email or Phone validation
    if (!formData.emailOrPhone.trim()) {
      newErrors.emailOrPhone = t('emailOrPhone') + ' ' + t('required');
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = t('password') + ' ' + t('required');
    } else if (!PWD_REGEX.test(formData.password)) {
      newErrors.password = t('password') + ' ' + t('mustBeValid');
    }

    // Country validation
    if (!formData.country) {
      newErrors.country = t('chooseCountry');
    }

    // Terms validation
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
      // Determine if input is email or phone
      const isEmail = EMAIL_REGEX.test(formData.emailOrPhone.trim());
      
      const { accessToken } = await addNewUser({
        username: formData.emailOrPhone.trim(), // Use email/phone as username
        password: formData.password,
        country: formData.country,
      }).unwrap();

      dispatch(setCredentials({ accessToken }));
      localStorage.setItem('isLoggedIn', 'true');
      
      // Check for redirect URL and handle it directly here
      const redirectUrl = localStorage.getItem('redirectAfterLogin');
      console.log('Signup success - checking for redirect URL:', redirectUrl);
      
      if (redirectUrl) {
        console.log('Signup success - redirecting to stored URL:', redirectUrl);
        localStorage.removeItem('redirectAfterLogin');
        navigate(redirectUrl);
      } else {
        console.log('Signup success - no redirect URL, going to dashboard');
        navigate("/dash");
      }
    } catch (err) {
      console.error('Signup error:', err);
      
      if (!err.status) {
        setErrors({ general: t('networkError') });
      } else if (err.status === 400) {
        setErrors({ general: err.data?.message || t('signupError') });
      } else {
        setErrors({ general: err.data?.message || t('serverError') });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingState message={t('loadingSignupForm')} />;
  }

  return (
    <PageContainer key={currentLanguage}>
      {/* Top Controls Container */}
      <TopControlsContainer currentLanguage={currentLanguage || langContext}>
        {/* Controls Group */}
        <ControlsGroup currentLanguage={currentLanguage || langContext}>
          {/* Language Selector */}
          <LanguageSelector 
            id="language-selector"
            onClick={handleLanguageClick}
            sx={{
              '&:hover': {
                cursor: 'pointer',
              }
            }}
          >
            <Language />
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                fontSize: '1rem',
                display: 'block',
                // Arabic font size fix
                ...(currentLanguage === 'ar' && {
                  fontSize: '1.1rem',
                }),
              }}
            >
              {getLanguageDisplayName(currentLanguage || langContext || 'en')}
            </Typography>
            <KeyboardArrowDown sx={{ fontSize: '20px', ml: 0.5 }} />
          </LanguageSelector>

          {/* Dark/Light mode toggle */}
          <ControlButton onClick={() => dispatch(setMode())} size="large">
            {theme.palette.mode === 'light' ? (
              <DarkModeOutlined />
            ) : (
              <LightModeOutlined />
            )}
          </ControlButton>
        </ControlsGroup>
      </TopControlsContainer>

      {/* Language Menu - Using Material-UI Menu like Welcome page */}
      <Menu
        anchorEl={languageAnchorEl}
        open={Boolean(languageAnchorEl)}
        onClose={handleLanguageClose}
        PaperProps={{
          sx: {
            mt: 1,
            borderRadius: 2,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 8px 32px rgba(0, 0, 0, 0.4)'
              : '0 8px 32px rgba(0, 0, 0, 0.1)',
            background: theme.palette.mode === 'dark'
              ? 'rgba(30, 30, 30, 0.95)'
              : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem 
          onClick={() => handleLanguageChange('en')}
          sx={{
            minWidth: 120,
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
            }
          }}
        >
          <ListItemIcon>
            <Language sx={{ fontSize: 20 }} />
          </ListItemIcon>
          <ListItemText primary="English" />
        </MenuItem>
        <MenuItem 
          onClick={() => handleLanguageChange('ar')}
          sx={{
            minWidth: 120,
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
            }
          }}
        >
          <ListItemIcon>
            <Language sx={{ fontSize: 20 }} />
          </ListItemIcon>
          <ListItemText primary="العربية" />
        </MenuItem>
        <MenuItem 
          onClick={() => handleLanguageChange('fr')}
          sx={{
            minWidth: 120,
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
            }
          }}
        >
          <ListItemIcon>
            <Language sx={{ fontSize: 20 }} />
          </ListItemIcon>
          <ListItemText primary="Français" />
        </MenuItem>
      </Menu>

      <MainCard>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            {/* Header */}
            <HeaderSection>
              <BrandLogo>
                <AccountCircle />
              </BrandLogo>
              <Box
                component="img"
                src="/maflogo.png"
                alt="Mafqoudat"
                sx={{
                  height: { xs: '40px', md: '50px' },
                  width: 'auto',
                  maxWidth: '100%',
                  objectFit: 'contain',
                  mb: 4,
                  display: 'block',
                  margin: '0 auto',
                  filter: theme?.palette?.mode === 'dark' 
                    ? 'brightness(1.1) contrast(1.1)' 
                    : 'none',
                }}
              />
              <Typography
                variant="h5"
                sx={{
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                  mb: 2,
                  fontSize: { xs: '1.4rem', md: '1.6rem' },
                  marginTop: '3rem'
                }}
              >
                {t('createAccount')}
              </Typography>
            </HeaderSection>

            {/* Error Alert */}
            {errors.general && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3, 
                  borderRadius: 3,
                  border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                }}
                onClose={() => setErrors(prev => ({ ...prev, general: "" }))}
              >
                {errors.general}
              </Alert>
            )}

            {/* Signup Form */}
            <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography
                    variant="body1"
                    sx={{
                      color: theme.palette.text.secondary,
                      display: 'block',
                      mb: 3,
                      fontSize: { xs: '1.1rem', md: '1.2rem' },
                      fontWeight: 500,
                      textAlign: 'center',
                    }}
                  >
                    Join our community and help find lost items
                  </Typography>
                </Grid>
                                 <Grid item xs={12}>
                   <ModernTextField
                     fullWidth
                     label={t('emailOrPhone')}
                     placeholder={t('emailOrPhonePlaceholder')}
                     value={formData.emailOrPhone}
                     onChange={handleInputChange('emailOrPhone')}
                     error={!!errors.emailOrPhone}
                     helperText={errors.emailOrPhone}
                     InputProps={{
                       startAdornment: (
                         <InputAdornment position="start">
                           <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                             <Email sx={{ color: theme.palette.text.secondary, fontSize: '1.2rem' }} />
                             <Phone sx={{ color: theme.palette.text.secondary, fontSize: '1.2rem' }} />
                           </Box>
                         </InputAdornment>
                       ),
                     }}
                     // Remove email validation to allow both email and phone
                     inputProps={{
                       autoComplete: 'off',
                       spellCheck: false,
                     }}
                   />
                 </Grid>

                <Grid item xs={12}>
                  <ModernTextField
                    fullWidth
                    label={t('password')}
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange('password')}
                    error={!!errors.password}
                    helperText={errors.password}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock sx={{ color: theme.palette.text.secondary }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            size="small"
                            sx={{
                              color: theme.palette.text.secondary,
                              '&:hover': {
                                color: theme.palette.primary.main,
                              }
                            }}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>


                <Grid item xs={12}>
                  <ModernSelect fullWidth>
                    <InputLabel>{t('chooseCountry')}</InputLabel>
                    <Select
                      value={formData.country}
                      onChange={handleInputChange('country')}
                      label={t('chooseCountry')}
                      error={!!errors.country}
                      startAdornment={
                        <InputAdornment position="start">
                          <LocationOn sx={{ color: theme.palette.text.secondary }} />
                        </InputAdornment>
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
                                style={{ marginRight: 8 }}
                              />
                            )}
                            {getCountryLabel(country)} ({country.code})
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </ModernSelect>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 2 }}>
                    <Checkbox
                      checked={formData.acceptTerms}
                      onChange={handleCheckboxChange('acceptTerms')}
                      sx={{
                        '&.Mui-checked': {
                          color: '#4A7BC8',
                        },
                        '&.MuiCheckbox-root': {
                          color: theme.palette.text.secondary,
                        },
                        '&:hover': {
                          backgroundColor: alpha('#4A7BC8', 0.1),
                        },
                      }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          lineHeight: 1.6,
                          fontSize: { xs: '1rem', md: '1.1rem' },
                          color: theme.palette.text.primary,
                        }}
                      >
                        {t('acceptTerms')}{' '}
                        <Button
                          component={Link}
                          to="/terms"
                          sx={{
                            color: '#4A7BC8',
                            textDecoration: 'underline',
                            p: 0,
                            minWidth: 'auto',
                            fontSize: 'inherit',
                            fontWeight: 600,
                            textTransform: 'none',
                            '&:hover': {
                              backgroundColor: 'transparent',
                              textDecoration: 'none',
                              color: '#3A6BB8',
                            }
                          }}
                        >
                          {t('termsAndConditions')}
                        </Button>
                      </Typography>
                      {errors.acceptTerms && (
                        <Typography
                          variant="body2"
                          color="error"
                          sx={{ display: 'block', mt: 0.5, fontSize: { xs: '0.9rem', md: '1rem' } }}
                        >
                          {errors.acceptTerms}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Grid>
              </Grid>

              <Box sx={{ mt: 3 }}>
                <ActionButton
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={isSubmitting}
                  sx={{ 
                    mb: 3,
                    py: 2,
                  }}
                >
                  {isSubmitting ? t('creatingAccount') : t('createAccount')}
                </ActionButton>
              </Box>
            </Box>

            <Divider sx={{ mb: 3 }}>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ px: 2 }}
              >
                {t('or')}
              </Typography>
            </Divider>

            {/* Sign In Link */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography 
                variant="body1" 
                sx={{ 
                  mb: 2,
                  color: theme.palette.text.secondary,
                  fontSize: { xs: '1.1rem', md: '1.2rem' },
                }}
              >
                {t('alreadyMember')}
              </Typography>
                             <Button
                 component={Link}
                 to="/login"
                 variant="contained"
                 sx={{
                   borderRadius: 3,
                   textTransform: 'none',
                   fontWeight: 600,
                   background: 'linear-gradient(135deg, #5B8FDF 0%, #4A7BC8 100%)',
                   color: 'white',
                   py: 1.5,
                   px: 4,
                   fontSize: { xs: '1.1rem', md: '1.2rem' },
                   boxShadow: '0 8px 25px rgba(91, 143, 223, 0.3)',
                   '&:hover': {
                     background: 'linear-gradient(135deg, #4B7FCF 0%, #3A6BB8 100%)',
                     transform: 'translateY(-2px)',
                     boxShadow: '0 12px 35px rgba(91, 143, 223, 0.4)',
                   }
                 }}
               >
                 {t('signin')}
               </Button>
            </Box>
        </CardContent>
      </MainCard>
    </PageContainer>
  );
};

export default NewUserForm; 