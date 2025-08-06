import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCredentials } from "../authSlice";
import { useLoginMutation } from "../authApiSlice";
import useTitle from "../../../hooks/useTitle";
import { LoadingState } from "../../../components/LoadingStates";
import { useTranslation } from "../../../utils/translations";
import { isRTL } from "../../../utils/languageUtils";

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
  Container,
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
    ? 'linear-gradient(45deg, #0a0a0a 0%, #1a1a1a 50%, #2d2d2d 100%)'
    : 'linear-gradient(45deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme?.spacing?.(2) || '16px',
  position: 'relative',
  direction: theme?.direction || 'ltr',
}));

const FloatingCard = styled(Card)(({ theme }) => ({
  width: '100%',
  maxWidth: 450,
  borderRadius: 20,
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
  marginBottom: theme?.spacing?.(4) || '32px',
  position: 'relative',
}));

const BrandLogo = styled(Box)(({ theme }) => ({
  width: 80,
  height: 80,
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 16px',
  boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
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
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: theme?.palette?.primary?.main || '#667eea',
    fontWeight: 600,
  }
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: 12,
  padding: '12px 24px',
  fontSize: '1rem',
  fontWeight: 600,
  textTransform: 'none',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  border: 'none',
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
    transform: 'translateY(-2px)',
    boxShadow: '0 10px 25px rgba(102, 126, 234, 0.4)',
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

const ControlPanel = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: theme?.spacing?.(3) || '24px',
  right: theme?.spacing?.(3) || '24px',
  display: 'flex',
  alignItems: 'center',
  gap: theme?.spacing?.(1) || '8px',
  zIndex: 10,
}));

const ControlButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: theme?.palette?.mode === 'dark' 
    ? 'rgba(255, 255, 255, 0.1)'
    : 'rgba(0, 0, 0, 0.05)',
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme?.palette?.primary?.main || '#667eea', 0.1)}`,
  color: theme?.palette?.text?.primary,
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: theme?.palette?.mode === 'dark' 
      ? 'rgba(255, 255, 255, 0.2)'
      : 'rgba(0, 0, 0, 0.1)',
    transform: 'scale(1.05)',
  }
}));

const LanguageSelector = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: '8px 16px',
  borderRadius: '12px',
  cursor: 'pointer',
  background: theme?.palette?.mode === 'dark' 
    ? 'rgba(255, 255, 255, 0.1)'
    : 'rgba(0, 0, 0, 0.05)',
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme?.palette?.primary?.main || '#667eea', 0.1)}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    background: theme?.palette?.mode === 'dark' 
      ? 'rgba(255, 255, 255, 0.2)'
      : 'rgba(0, 0, 0, 0.1)',
    transform: 'translateY(-2px)',
  },
  '& .MuiSvgIcon-root': {
    marginRight: '8px',
    fontSize: '20px',
  },
}));

const Login = () => {
  useTitle("Mafqoudat | Login");
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme() || {};
  const isMobile = useMediaQuery(theme?.breakpoints?.down?.('sm') || '(max-width: 600px)');
  const { t, currentLanguage } = useTranslation();
  const isRTLMode = isRTL();

  // State
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [languageAnchorEl, setLanguageAnchorEl] = useState(null);

  // API
  const [login, { isLoading }] = useLoginMutation();

  // Check if already logged in
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn === 'true') {
      navigate("/dash");
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

  const handleCheckboxChange = (event) => {
    setFormData(prev => ({
      ...prev,
      rememberMe: event.target.checked
    }));
  };

  // Language dropdown handlers - same approach as navbar
  const handleLanguageClick = (event) => {
    setLanguageAnchorEl(event.currentTarget);
  };

  const handleLanguageClose = () => {
    setLanguageAnchorEl(null);
  };

  const handleLanguageChange = (newLanguage) => {
    // Save to localStorage and reload page to fetch fresh translations
    localStorage.setItem('currentLanguage', newLanguage);
    localStorage.setItem('language', newLanguage);
    localStorage.setItem('app_language', newLanguage);
    window.location.reload();
    handleLanguageClose();
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
    
    if (!formData.username.trim() || !formData.password.trim()) {
      setError(t('invalidCredentials'));
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const { accessToken } = await login({
        username: formData.username.trim(),
        password: formData.password
      }).unwrap();

      dispatch(setCredentials({ accessToken }));
      localStorage.setItem('isLoggedIn', 'true');
      
      if (formData.rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }

      navigate("/dash");
    } catch (err) {
      console.error('Login error:', err);
      
      if (!err.status) {
        setError(t('networkError'));
      } else if (err.status === 400) {
        setError(t('invalidCredentials'));
      } else if (err.status === 401) {
        setError(t('invalidCredentials'));
      } else {
        setError(err.data?.message || t('serverError'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingState message={t('signingIn')} />;
  }

  return (
    <PageContainer>
      {/* Control Panel */}
      <ControlPanel>
        {/* Language selector */}
        <LanguageSelector onClick={handleLanguageClick}>
          <Language />
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              fontSize: '0.9rem',
              display: { xs: 'none', sm: 'block' }
            }}
          >
            {getLanguageDisplayName(currentLanguage)}
          </Typography>
          <KeyboardArrowDown sx={{ fontSize: '16px', ml: 0.5 }} />
        </LanguageSelector>

        {/* Language dropdown menu */}
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

        <ControlButton
          onClick={() => dispatch(setMode())}
          size="small"
        >
          {theme.palette.mode === "dark" ? (
            <LightModeOutlined />
          ) : (
            <DarkModeOutlined />
          )}
        </ControlButton>
      </ControlPanel>

      <Container maxWidth="sm">
        <FloatingCard>
          <CardContent sx={{ padding: isMobile ? 3 : 4 }}>
            {/* Header */}
            <HeaderSection>
              <BrandLogo>
                <Security />
              </BrandLogo>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  mb: 1,
                }}
              >
                {t('brandName')}
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                  mb: 1,
                }}
              >
                {t('welcomeBack')}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.text.secondary,
                  opacity: 0.8,
                }}
              >
                {t('welcomeMessage')}
              </Typography>
            </HeaderSection>

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

            {/* Login Form */}
            <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
              <ModernTextField
                fullWidth
                label={t('username')}
                value={formData.username}
                onChange={handleInputChange('username')}
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: theme.palette.text.secondary }} />
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
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 3,
                flexWrap: 'wrap',
                gap: 1,
              }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.rememberMe}
                      onChange={handleCheckboxChange}
                      sx={{
                        '&.Mui-checked': {
                          color: theme.palette.primary.main,
                        },
                      }}
                    />
                  }
                  label={t('rememberMe')}
                  sx={{
                    fontSize: '0.875rem',
                  }}
                />
                <Button
                  component={Link}
                  to="/forgot-password"
                  sx={{
                    color: theme.palette.primary.main,
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    '&:hover': {
                      textDecoration: 'underline',
                      backgroundColor: alpha(theme.palette.primary.main, 0.04),
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
                startIcon={<LoginIcon />}
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
                variant="body2" 
                sx={{ 
                  mb: 2,
                  color: theme.palette.text.secondary,
                }}
              >
                {t('firstTime')}
              </Typography>
              <Button
                component={Link}
                to="/signup"
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                  color: theme.palette.primary.main,
                  py: 1,
                  px: 3,
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    backgroundColor: alpha(theme.palette.primary.main, 0.04),
                    transform: 'translateY(-1px)',
                  }
                }}
              >
                {t('createAccount')}
              </Button>
            </Box>
          </CardContent>
        </FloatingCard>
      </Container>
    </PageContainer>
  );
};

export default Login; 