import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCredentials } from "../authSlice";
import { useLoginMutation } from "../authApiSlice";
import useTitle from "../../../hooks/useTitle";
import { LoadingState } from "../../../components/LoadingStates";
import { getCurrentLanguage, t } from "../../../utils/languageUtils";
import { isRTL } from "../../../utils/languageUtils";

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
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  DarkModeOutlined,
  LightModeOutlined,
  ArrowForward,
} from "@mui/icons-material";

// Animation
import Lottie from "lottie-react";
import LoginAnimation from "../../../animations/LoginAnimation.json";
import LanguageToggle from "../../../lang/LanguageToggle";
import { setMode } from "../../../app/state";

// Styled components
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
    '&:hover': {
      backgroundColor: theme?.palette?.mode === 'dark' 
        ? alpha(theme?.palette?.common?.white || '#fff', 0.08)
        : alpha(theme?.palette?.common?.black || '#000', 0.04),
    },
    '&.Mui-focused': {
      backgroundColor: theme?.palette?.mode === 'dark' 
        ? alpha(theme?.palette?.common?.white || '#fff', 0.1)
        : alpha(theme?.palette?.common?.black || '#000', 0.06),
    }
  },
  '& .MuiInputLabel-root': {
    color: theme?.palette?.mode === 'dark' 
      ? alpha(theme?.palette?.common?.white || '#fff', 0.7)
      : alpha(theme?.palette?.common?.black || '#000', 0.6),
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
  '&:hover': {
    background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
  }
}));

const Login = () => {
  useTitle("Mafqoudat | Login");
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme() || {};
  const isMobile = useMediaQuery(theme?.breakpoints?.down?.('md') || '(max-width: 1024px)');
  const currentLanguage = getCurrentLanguage();
  const rtl = isRTL(currentLanguage);

  // State
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    <AuthContainer>
      {/* Header Controls */}
              <Box
          sx={{
            position: 'absolute',
            top: theme?.spacing?.(3) || '24px',
            right: theme?.spacing?.(3) || '24px',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            zIndex: 10,
          }}
        >
        <LanguageToggle />
        <IconButton
          onClick={() => dispatch(setMode())}
          sx={{
            color: 'white',
            backgroundColor: alpha(theme.palette.common.white, 0.1),
            backdropFilter: 'blur(10px)',
            '&:hover': {
              backgroundColor: alpha(theme.palette.common.white, 0.2),
            }
          }}
        >
          {theme.palette.mode === "dark" ? (
            <LightModeOutlined />
          ) : (
            <DarkModeOutlined />
          )}
        </IconButton>
      </Box>

      <AuthCard>
        <FormSection>
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
              }}
            >
              {t('brandName')}
            </Typography>
            <Typography
              variant="h5"
              sx={{
                color: theme.palette.text.secondary,
                fontWeight: 500,
                mb: 1,
              }}
            >
              {t('welcomeBack')}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: theme.palette.text.secondary,
              }}
            >
              {t('welcomeMessage')}
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 3, borderRadius: 2 }}
              onClose={() => setError("")}
            >
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
            <StyledTextField
              fullWidth
              label={t('username')}
              value={formData.username}
              onChange={handleInputChange('username')}
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ color: theme.palette.text.secondary }} />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />

            <StyledTextField
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
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.rememberMe}
                    onChange={handleCheckboxChange}
                    sx={{
                      '&.Mui-checked': {
                        color: '#667eea',
                      },
                    }}
                  />
                }
                label={t('rememberMe')}
              />
              <Button
                component={Link}
                to="/forgot-password"
                sx={{
                  color: theme.palette.primary.main,
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  }
                }}
              >
                {t('forgotPassword')}
              </Button>
            </Box>

            <StyledButton
              type="submit"
              fullWidth
              variant="contained"
              disabled={isSubmitting}
              endIcon={<ArrowForward />}
              sx={{ mb: 3 }}
            >
              {isSubmitting ? t('signingIn') : t('signin')}
            </StyledButton>
          </Box>

          <Divider sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              {t('or')}
            </Typography>
          </Divider>

          {/* Sign Up Link */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
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
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
                '&:hover': {
                  borderColor: theme.palette.primary.dark,
                  backgroundColor: alpha(theme.palette.primary.main, 0.04),
                }
              }}
            >
              {t('createAccount')}
            </Button>
          </Box>
        </FormSection>

        <AnimationSection>
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Lottie 
              animationData={LoginAnimation} 
              style={{ width: 400, height: 400 }}
            />
          </Box>
        </AnimationSection>
      </AuthCard>
    </AuthContainer>
  );
};

export default Login;
