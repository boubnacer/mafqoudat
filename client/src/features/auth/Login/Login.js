import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCredentials } from "../authSlice";
import { useLoginMutation } from "../authApiSlice";
import { authStorage } from "../../../utils/authStorage";
import useTitle from "../../../hooks/useTitle";
import { LoadingState } from "../../../components/LoadingStates";
import { useTranslation } from "../../../utils/translations";
import { isRTL } from "../../../utils/languageUtils";
import { useLanguage } from "../../../utils/languageContext";
import authErrorHandler from "../../../utils/authErrorHandler";
import AuthErrorBoundary from "../../../components/AuthErrorBoundary";
import PasswordResetDialog from "../../../components/PasswordResetDialog";

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
  Grid,
  Paper,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Lock,
  DarkModeOutlined,
  LightModeOutlined,
  ArrowForward,
  Person,
  Email,
  Phone,
  Security,
  Login as LoginIcon,
  Language,
  KeyboardArrowDown,
} from "@mui/icons-material";

import { setMode } from "../../../app/state";

// Completely new styled components with different design approach
const PageContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  background: theme?.palette?.mode === 'dark' 
    ? 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 25%, #2d2d2d 50%, #1a1a1a 75%, #0a0a0a 100%)'
    : 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 50%, #fff3e0 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme?.spacing?.(2) || '16px',
  position: 'relative',
  direction: theme?.direction || 'ltr',
}));

const FloatingCard = styled(Card)(({ theme }) => ({
  width: '100%',
  maxWidth: 600,
  borderRadius: 24,
  boxShadow: theme?.palette?.mode === 'dark'
    ? '0 25px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)'
    : '0 25px 50px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.8)',
  backdropFilter: 'blur(20px)',
  background: theme?.palette?.mode === 'dark'
    ? 'rgba(30, 30, 30, 0.9)'
    : 'rgba(255, 255, 255, 0.9)',
  border: `1px solid ${alpha(theme?.palette?.primary?.main || '#667eea', 0.1)}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme?.palette?.mode === 'dark'
      ? '0 35px 70px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)'
      : '0 35px 70px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.9)',
  }
}));

const HeaderSection = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  marginTop:'60px',
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

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: '4px',
  padding: { xs: '16px 24px', md: '18px 32px' },
  fontSize: { xs: '1.1rem', md: '1.2rem' },
  fontWeight: 600,
  textTransform: 'none',
  background: 'linear-gradient(45deg, #4A8BFF 30%, #1A6EEE 90%)',
  color: 'white',
  border: 'none',
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
  minHeight: { xs: '56px', md: '60px' },
  boxShadow: '0 3px 5px 2px rgba(26, 110, 238, .3)',
  '&:hover': {
    background: 'linear-gradient(45deg, #5A9BFF 30%, #2A7EFF 90%)',
    boxShadow: '0 4px 8px 2px rgba(26, 110, 238, .4)',
  },
  '&:active': {
    transform: 'translateY(0)',
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
  position: 'relative',
  overflow: 'hidden',
  // Animated gradient border effect - Blue tones only
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: '-2px',
    borderRadius: '14px',
    background: theme?.palette?.mode === 'dark'
      ? `linear-gradient(45deg, 
          #1A6EEE, 
          #4A8BFF, 
          #6BA3FF, 
          #8BB5FF, 
          #1A6EEE)`
      : `linear-gradient(45deg, 
          #043FA5, 
          #1A6EEE, 
          #4A8BFF, 
          #6BA3FF, 
          #043FA5)`,
    backgroundSize: '300% 300%',
    animation: 'gradientShift 3s ease infinite',
    opacity: theme?.palette?.mode === 'dark' ? 0.8 : 0.9,
    zIndex: -1,
    filter: 'blur(1px)',
  },
  '@keyframes gradientShift': {
    '0%': {
      backgroundPosition: '0% 50%',
    },
    '50%': {
      backgroundPosition: '100% 50%',
    },
    '100%': {
      backgroundPosition: '0% 50%',
    },
  },
  '&:hover': {
    background: theme?.palette?.mode === 'dark' 
      ? 'rgba(255, 255, 255, 0.2)'
      : 'rgba(0, 0, 0, 0.1)',
    transform: 'translateY(-2px) scale(1.02)',
    '&::before': {
      opacity: 1,
      animation: 'gradientShift 1.5s ease infinite',
      filter: 'blur(0.5px)',
    },
  },
  '& .MuiSvgIcon-root': {
    marginRight: '12px',
    fontSize: '24px',
    transition: 'transform 0.3s ease',
    color: `${theme?.palette?.mode === 'dark' ? '#ffffff' : '#1a1a1a'} !important`,
  },
  '&:hover .MuiSvgIcon-root': {
    transform: 'rotate(15deg) scale(1.1)',
  },
  // Ensure Typography text color
  '& .MuiTypography-root': {
    color: `${theme?.palette?.mode === 'dark' ? '#ffffff' : '#1a1a1a'} !important`,
  },
  // Target all SVG icons including the dropdown arrow
  '& svg': {
    color: `${theme?.palette?.mode === 'dark' ? '#ffffff' : '#1a1a1a'} !important`,
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

const LoginComponent = () => {
  useTitle("Mafqoudat | Login");
  
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const theme = useTheme() || {};
  const isMobile = useMediaQuery(theme?.breakpoints?.down?.('sm') || '(max-width: 600px)');
  // Get current language
  const { t, currentLanguage } = useTranslation();
  const { currentLanguage: langContext, setLanguage } = useLanguage();
  const isRTLMode = isRTL();

  const hasLoadedRedirectMessage = useRef(false);


  // State
  const [formData, setFormData] = useState({
    emailOrPhone: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [languageAnchorEl, setLanguageAnchorEl] = useState(null);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [loginNotice, setLoginNotice] = useState(null);
  
  const infoAlertMessage = loginNotice
    ? typeof loginNotice === 'string'
      ? loginNotice
      : loginNotice.messageKey
        ? t(loginNotice.messageKey, loginNotice.params || {})
        : loginNotice.fallback || ""
    : "";


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

  // Check if already logged in
  useEffect(() => {
    if (authStorage.isAuthenticated()) {
      // Check for redirect URL and handle it directly here
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

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Clear previous errors
    setError("");
    
    // Validate form fields
    if (!formData.emailOrPhone.trim()) {
      setError(t('emailOrPhone') + ' ' + t('required'));
      return;
    }
    
    if (!formData.password.trim()) {
      setError(t('password') + ' ' + t('required'));
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const { accessToken } = await login({
        emailOrPhone: formData.emailOrPhone.trim(),
        password: formData.password
      }).unwrap();

      dispatch(setCredentials({ accessToken }));
      
      // Check for redirect URL and handle it directly here
      const redirectUrl = authStorage.getAndClearRedirectUrl();
      
      if (redirectUrl) {
        navigate(redirectUrl);
      } else {
        // Check if there's a stored redirect URL from country selection
        const countryRedirectUrl = localStorage.getItem('redirectAfterCountrySelection');
        if (countryRedirectUrl) {
          localStorage.removeItem('redirectAfterCountrySelection');
          navigate(countryRedirectUrl);
        } else {
          navigate("/dash");
        }
      }
    } catch (err) {
      // Use centralized error handling
      const errorResult = await authErrorHandler.handleLoginError(err, {
        t: t
      });
      
      // Set local error state for form display
      setError(errorResult.errorMessage.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingState message={t('signingIn')} />;
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
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            background: 'rgba(30, 30, 30, 0.95)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.primary.main || '#4A8BFF', 0.3)}`,
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem 
          onClick={() => handleLanguageChange('en')}
          sx={{
            minWidth: 120,
            color: '#ffffff',
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
            }
          }}
        >
          <ListItemIcon>
            <Language sx={{ fontSize: 20, color: '#ffffff' }} />
          </ListItemIcon>
          <ListItemText 
            primary="English" 
            primaryTypographyProps={{ sx: { color: '#ffffff' } }}
          />
        </MenuItem>
        <MenuItem 
          onClick={() => handleLanguageChange('ar')}
          sx={{
            minWidth: 120,
            color: '#ffffff',
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
            }
          }}
        >
          <ListItemIcon>
            <Language sx={{ fontSize: 20, color: '#ffffff' }} />
          </ListItemIcon>
          <ListItemText 
            primary="العربية" 
            primaryTypographyProps={{ sx: { color: '#ffffff' } }}
          />
        </MenuItem>
        <MenuItem 
          onClick={() => handleLanguageChange('fr')}
          sx={{
            minWidth: 120,
            color: '#ffffff',
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
            }
          }}
        >
          <ListItemIcon>
            <Language sx={{ fontSize: 20, color: '#ffffff' }} />
          </ListItemIcon>
          <ListItemText 
            primary="Français" 
            primaryTypographyProps={{ sx: { color: '#ffffff' } }}
          />
        </MenuItem>
      </Menu>

      <FloatingCard>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          {/* Header */}
          <HeaderSection>
            <Box
              component="img"
              src="/maficonSVG.svg"
              alt="Mafqoudat Icon"
              sx={{
                display: 'none',
              }}
            />
            <Box
              component="img"
              src="/maflogoSVG.svg"
              alt="Mafqoudat"
              sx={{
                height: { xs: '45px', md: '60px' },
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
                  marginTop:'3rem'
                }}
              >
                {t('welcomeBack')}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: theme.palette.text.secondary,
                  opacity: 0.8,
                  fontSize: { xs: '1.1rem', md: '1.2rem' },
                }}
              >
                {t('welcomeMessage')}
              </Typography>
            </HeaderSection>

            {/* Redirect Info Alert */}
            {infoAlertMessage && (
              <Alert
                severity="info"
                sx={{
                  mb: 3,
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                }}
                onClose={() => setLoginNotice(null)}
              >
                {infoAlertMessage}
              </Alert>
            )}

            {/* Error Alert */}
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3, 
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                }}
                onClose={() => setError("")}
              >
                {error}
              </Alert>
            )}

            {/* Google OAuth Button */}
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:3500";
                window.location.href = `${apiUrl}/auth/google`;
              }}
              sx={{
                borderRadius: '12px',
                borderColor: '#dadce0',
                color: theme?.palette?.text?.primary,
                textTransform: 'none',
                fontSize: { xs: '1.1rem', md: '1.2rem' },
                fontWeight: 500,
                padding: { xs: '14px 24px', md: '16px 32px' },
                minHeight: { xs: '56px', md: '60px' },
                mb: 3,
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: alpha(theme?.palette?.primary?.main || '#667eea', 0.5),
                  backgroundColor: alpha(theme?.palette?.primary?.main || '#667eea', 0.05),
                  transform: 'translateY(-2px)',
                  boxShadow: `0 4px 12px ${alpha(theme?.palette?.primary?.main || '#667eea', 0.2)}`,
                },
                '&:active': {
                  transform: 'translateY(0)',
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                  style={{ width: '24px', height: '24px' }}
                />
                <Typography sx={{ fontSize: { xs: '1.1rem', md: '1.2rem' }, fontWeight: 500 }}>
                  {t('continueWithGoogle') || 'Continue with Google'}
                </Typography>
              </Box>
            </Button>

            {/* Divider */}
            <Divider sx={{ my: 3 }}>
              <Chip 
                label={t('or') || 'OR'} 
                sx={{ 
                  backgroundColor: theme?.palette?.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.02)',
                  color: theme?.palette?.text?.secondary,
                  fontWeight: 500,
                }}
              />
            </Divider>

            {/* Login Form */}
            <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
              <ModernTextField
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
                        <Email sx={{ color: theme.palette.text.secondary, fontSize: '1.2rem' }} />
                        <Phone sx={{ color: theme.palette.text.secondary, fontSize: '1.2rem' }} />
                      </Box>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              <ModernTextField
                fullWidth
                label={t('password')}
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange('password')}
                margin="normal"
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
                sx={{ mb: 2 }}
              />

              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                alignItems: 'center', 
                mb: 3,
              }}>
                <Button
                  onClick={() => setResetPasswordDialogOpen(true)}
                  sx={{
                    color: '#4A8BFF',
                    textDecoration: 'none',
                    fontSize: { xs: '1rem', md: '1.1rem' },
                    fontWeight: 500,
                    '&:hover': {
                      textDecoration: 'underline',
                      backgroundColor: alpha('#4A8BFF', 0.04),
                      color: '#3A7BEF',
                    }
                  }}
                >
                  {t('forgotPassword')}
                </Button>
              </Box>

              <ActionButton
                type="submit"
                fullWidth
                variant="contained"
                disabled={isSubmitting}
                sx={{ 
                  mb: 3,
                  py: 1.5,
                }}
              >
                {isSubmitting ? t('signingIn') : t('signin')}
              </ActionButton>
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

            {/* Sign Up Link */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography 
                variant="body1" 
                sx={{ 
                  mb: 2,
                  color: theme.palette.text.secondary,
                  fontSize: { xs: '1.1rem', md: '1.2rem' },
                }}
              >
                {t('firstTime')}
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  component={Link}
                  to="/signup"
                  variant="outlined"
                  sx={{
                    borderRadius: '4px',
                    textTransform: 'none',
                    fontWeight: 600,
                    borderColor: '#4A8BFF',
                    color: '#4A8BFF',
                    py: 1,
                    px: 3,
                    fontSize: { xs: '1.1rem', md: '1.2rem' },
                    borderWidth: '2px',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: '#3A7BEF',
                      backgroundColor: alpha('#4A8BFF', 0.05),
                      color: '#3A7BEF',
                      borderWidth: '2px',
                      transform: 'translateY(-1px)',
                      boxShadow: `0 4px 12px ${alpha('#4A8BFF', 0.2)}`,
                    }
                  }}
                >
                  {t('createAccount')}
                </Button>
                
                <Button
                  component={Link}
                  to="/"
                  variant="outlined"
                  sx={{
                    borderRadius: '4px',
                    textTransform: 'none',
                    fontWeight: 500,
                    borderColor: alpha(theme.palette.text.secondary, 0.3),
                    color: theme.palette.text.secondary,
                    py: 1,
                    px: 3,
                    fontSize: { xs: '1.1rem', md: '1.2rem' },
                    borderWidth: '1px',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: alpha(theme.palette.text.secondary, 0.6),
                      backgroundColor: alpha(theme.palette.text.secondary, 0.05),
                      color: theme.palette.text.primary,
                      borderWidth: '1px',
                    }
                  }}
                >
                  {t('searchCountry')}
                </Button>
              </Box>
            </Box>
        </CardContent>
      </FloatingCard>

      {/* Password Reset Dialog */}
      <PasswordResetDialog
        open={resetPasswordDialogOpen}
        onClose={() => setResetPasswordDialogOpen(false)}
      />
    </PageContainer>
  );
};

// Wrap with error boundary
const Login = () => (
  <AuthErrorBoundary>
    <LoginComponent />
  </AuthErrorBoundary>
);

export default Login; 