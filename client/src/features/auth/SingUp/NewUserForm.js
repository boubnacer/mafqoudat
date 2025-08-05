import React, { useState, useEffect } from "react";
import { useAddNewUserMutation } from "../../userSettings/usersApiSlice";
import { useNavigate, Link } from "react-router-dom";
import useTitle from "../../../hooks/useTitle";
import { useDispatch } from "react-redux";
import { setCredentials } from "../authSlice";
import { useTranslation } from "../../../utils/translations";
import { isRTL } from "../../../utils/languageUtils";

import { LoadingState } from "../../../components/LoadingStates";
// Material-UI imports
import {
  Box,
  Paper,
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
  Container,
  Grid,
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
} from "@mui/icons-material";

// Animation
import Lottie from "lottie-react";
import LoginAnimation from '../../../animations/LoginAnimation.json';
import LanguageToggle from "../../../lang/LanguageToggle";
import { setMode } from "../../../app/state";


// Enhanced styled components with better responsiveness and modern design
const AuthContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: theme?.palette?.mode === 'dark' 
    ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  padding: theme?.spacing?.(2) || '16px',
  position: 'relative',
  overflow: 'hidden',
  direction: theme?.direction || 'ltr',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
    opacity: 0.3,
  }
}));

const AuthCard = styled(Paper)(({ theme }) => ({
  width: '100%',
  maxWidth: 1200,
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  borderRadius: 24,
  overflow: 'hidden',
  boxShadow: theme?.palette?.mode === 'dark'
    ? '0 20px 40px rgba(0, 0, 0, 0.4)'
    : '0 20px 40px rgba(0, 0, 0, 0.1)',
  backdropFilter: 'blur(20px)',
  border: `1px solid ${alpha(theme?.palette?.common?.white || '#fff', 0.1)}`,
  [theme?.breakpoints?.down?.('md') || '@media (max-width: 1024px)']: {
    gridTemplateColumns: '1fr',
    maxWidth: 500,
  },
  [theme?.breakpoints?.down?.('sm') || '@media (max-width: 600px)']: {
    maxWidth: '100%',
    borderRadius: 16,
  }
}));

const FormSection = styled(Box)(({ theme }) => ({
  padding: theme?.spacing?.(6) || '48px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  background: theme?.palette?.mode === 'dark' 
    ? alpha(theme?.palette?.background?.paper || '#fff', 0.9)
    : alpha(theme?.palette?.background?.paper || '#fff', 0.95),
  [theme?.breakpoints?.down?.('md') || '@media (max-width: 1024px)']: {
    padding: theme?.spacing?.(4) || '32px',
  },
  [theme?.breakpoints?.down?.('sm') || '@media (max-width: 600px)']: {
    padding: theme?.spacing?.(3) || '24px',
  }
}));

const AnimationSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: theme?.palette?.mode === 'dark'
    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  position: 'relative',
  [theme?.breakpoints?.down?.('md') || '@media (max-width: 1024px)']: {
    display: 'none',
  }
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 12,
    backgroundColor: theme?.palette?.mode === 'dark' 
      ? alpha(theme?.palette?.common?.white || '#fff', 0.05)
      : alpha(theme?.palette?.common?.black || '#000', 0.02),
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: theme?.palette?.mode === 'dark' 
        ? alpha(theme?.palette?.common?.white || '#fff', 0.08)
        : alpha(theme?.palette?.common?.black || '#000', 0.04),
      transform: 'translateY(-1px)',
    },
    '&.Mui-focused': {
      backgroundColor: theme?.palette?.mode === 'dark' 
        ? alpha(theme?.palette?.common?.white || '#fff', 0.1)
        : alpha(theme?.palette?.common?.black || '#000', 0.06),
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 20px rgba(102, 126, 234, 0.15)',
    }
  },
  '& .MuiInputLabel-root': {
    color: theme?.palette?.mode === 'dark' 
      ? alpha(theme?.palette?.common?.white || '#fff', 0.7)
      : alpha(theme?.palette?.common?.black || '#000', 0.6),
    transition: 'all 0.3s ease',
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: theme?.palette?.primary?.main || '#667eea',
  }
}));

const StyledSelect = styled(FormControl)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 12,
    backgroundColor: theme?.palette?.mode === 'dark' 
      ? alpha(theme?.palette?.common?.white || '#fff', 0.05)
      : alpha(theme?.palette?.common?.black || '#000', 0.02),
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: theme?.palette?.mode === 'dark' 
        ? alpha(theme?.palette?.common?.white || '#fff', 0.08)
        : alpha(theme?.palette?.common?.black || '#000', 0.04),
      transform: 'translateY(-1px)',
    },
    '&.Mui-focused': {
      backgroundColor: theme?.palette?.mode === 'dark' 
        ? alpha(theme?.palette?.common?.white || '#fff', 0.1)
        : alpha(theme?.palette?.common?.black || '#000', 0.06),
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 20px rgba(102, 126, 234, 0.15)',
    }
  },
  '& .MuiInputLabel-root': {
    color: theme?.palette?.mode === 'dark' 
      ? alpha(theme?.palette?.common?.white || '#fff', 0.7)
      : alpha(theme?.palette?.common?.black || '#000', 0.6),
    transition: 'all 0.3s ease',
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: theme?.palette?.primary?.main || '#667eea',
  }
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: 12,
  padding: theme.spacing(1.5, 4),
  fontSize: '1rem',
  fontWeight: 600,
  textTransform: 'none',
  boxShadow: 'none',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  transition: 'all 0.3s ease',
  '&:hover': {
    background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
    transform: 'translateY(-2px)',
  },
  '&:active': {
    transform: 'translateY(0)',
  }
}));

const HeaderControls = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: theme?.spacing?.(3) || '24px',
  right: theme?.spacing?.(3) || '24px',
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  zIndex: 10,
  [theme?.breakpoints?.down?.('sm') || '@media (max-width: 600px)']: {
    top: theme?.spacing?.(2) || '16px',
    right: theme?.spacing?.(2) || '16px',
  }
}));

const BrandTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  fontSize: '2.5rem',
  [theme?.breakpoints?.down?.('sm') || '@media (max-width: 600px)']: {
    fontSize: '2rem',
  }
}));

const NewUserForm = ({ countries }) => {
  useTitle("Mafqoudat | Sign Up");

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme() || {};
  const isMobile = useMediaQuery(theme?.breakpoints?.down?.('md') || '(max-width: 1024px)');
  const isSmallMobile = useMediaQuery(theme?.breakpoints?.down?.('sm') || '(max-width: 600px)');
  const { t, currentLanguage } = useTranslation();
  const isRTLMode = isRTL();

  // API
  const [addNewUser, { isLoading, isError, error }] = useAddNewUserMutation();

  // State
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    country: countries?.[0]?.id || "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation patterns
  const USER_REGEX = /^[A-z]{3,20}$/;
  const PWD_REGEX = /^[A-z0-9!@#$%]{4,12}$/;
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_REGEX = /^[\+]?[1-9][\d]{0,15}$/;

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

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = t('username') + ' ' + t('required');
    } else if (!USER_REGEX.test(formData.username)) {
      newErrors.username = t('username') + ' ' + t('mustBeValid');
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = t('password') + ' ' + t('required');
    } else if (!PWD_REGEX.test(formData.password)) {
      newErrors.password = t('password') + ' ' + t('mustBeValid');
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('confirmPassword') + ' ' + t('required');
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('passwordMismatch');
    }

    // Country validation
    if (!formData.country) {
      newErrors.country = t('chooseCountry');
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
        username: formData.username.trim(),
        password: formData.password,
        country: formData.country,
      }).unwrap();

      dispatch(setCredentials({ accessToken }));
      localStorage.setItem('isLoggedIn', 'true');
      navigate("/dash");
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
    <AuthContainer>
      {/* Header Controls */}
      <HeaderControls>
        <LanguageToggle />
        <IconButton
          onClick={() => dispatch(setMode())}
          sx={{
            color: 'white',
            backgroundColor: alpha(theme.palette.common.white, 0.1),
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: alpha(theme.palette.common.white, 0.2),
              transform: 'scale(1.05)',
            }
          }}
        >
          {theme.palette.mode === "dark" ? (
            <LightModeOutlined />
          ) : (
            <DarkModeOutlined />
          )}
        </IconButton>
      </HeaderControls>

      <AuthCard>
        <FormSection>
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <BrandTitle variant="h3" sx={{ mb: 1 }}>
              {t('brandName')}
            </BrandTitle>
            <Typography
              variant="h5"
              sx={{
                color: theme.palette.text.secondary,
                fontWeight: 500,
                mb: 1,
                fontSize: isSmallMobile ? '1.1rem' : '1.25rem',
              }}
            >
              {t('createAccount')}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: isSmallMobile ? '0.9rem' : '1rem',
              }}
            >
              {t('createAccountMessage')}
            </Typography>
          </Box>

          {/* Error Alert */}
          {errors.general && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3, 
                borderRadius: 2,
                '& .MuiAlert-message': {
                  fontSize: isSmallMobile ? '0.875rem' : '1rem',
                }
              }}
              onClose={() => setErrors(prev => ({ ...prev, general: "" }))}
            >
              {errors.general}
            </Alert>
          )}

          {/* Signup Form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
            <StyledTextField
              fullWidth
              label={t('username')}
              value={formData.username}
              onChange={handleInputChange('username')}
              error={!!errors.username}
              helperText={errors.username}
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

            <StyledSelect fullWidth margin="normal" sx={{ mb: 2 }}>
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
                  <MenuItem key={country.id} value={country.id}>
                    {country.labels?.[currentLanguage] || country.code}
                  </MenuItem>
                ))}
              </Select>
            </StyledSelect>

            <StyledTextField
              fullWidth
              label={t('password')}
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleInputChange('password')}
              error={!!errors.password}
              helperText={errors.password}
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

            <StyledTextField
              fullWidth
              label={t('confirmPassword')}
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleInputChange('confirmPassword')}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
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
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                      sx={{
                        color: theme.palette.text.secondary,
                        '&:hover': {
                          color: theme.palette.primary.main,
                        }
                      }}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />

            <StyledButton
              type="submit"
              fullWidth
              variant="contained"
              disabled={isSubmitting}
              endIcon={<ArrowForward />}
              sx={{ 
                mb: 3,
                fontSize: isSmallMobile ? '0.9rem' : '1rem',
                py: isSmallMobile ? 1.5 : 2,
              }}
            >
              {isSubmitting ? t('creatingAccount') : t('createAccount')}
            </StyledButton>
          </Box>

          <Divider sx={{ mb: 3 }}>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: isSmallMobile ? '0.875rem' : '1rem' }}
            >
              {t('or')}
            </Typography>
          </Divider>

          {/* Sign In Link */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography 
              variant="body1" 
              sx={{ 
                mb: 1,
                fontSize: isSmallMobile ? '0.9rem' : '1rem',
              }}
            >
              {t('alreadyMember')}
            </Typography>
            <Button
              component={Link}
              to="/"
              variant="outlined"
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
                fontSize: isSmallMobile ? '0.9rem' : '1rem',
                py: isSmallMobile ? 1 : 1.5,
                '&:hover': {
                  borderColor: theme.palette.primary.dark,
                  backgroundColor: alpha(theme.palette.primary.main, 0.04),
                  transform: 'translateY(-1px)',
                }
              }}
            >
              {t('signin')}
            </Button>
          </Box>
        </FormSection>

        <AnimationSection>
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Lottie 
              animationData={LoginAnimation} 
              style={{ 
                width: isMobile ? 300 : 400, 
                height: isMobile ? 300 : 400 
              }}
            />
          </Box>
        </AnimationSection>
      </AuthCard>
    </AuthContainer>
  );
};

export default NewUserForm;
