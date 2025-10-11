import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCredentials } from "./authSlice";
import { useGetCountriesQuery } from "../dependencies/dependenciesApiSlice";
import useTitle from "../../hooks/useTitle";
import { LoadingState } from "../../components/LoadingStates";
import { useTranslation } from "../../utils/translations";
import { isRTL } from "../../utils/languageUtils";
import { useLanguage } from "../../utils/languageContext";
import axios from "axios";

// Material-UI imports
import {
  Box,
  Card,
  CardContent,
  Button,
  Typography,
  IconButton,
  Alert,
  useTheme,
  useMediaQuery,
  alpha,
  styled,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Menu,
  ListItemIcon,
  ListItemText,
  InputAdornment,
} from "@mui/material";
import {
  LocationOn,
  DarkModeOutlined,
  LightModeOutlined,
  Language,
  KeyboardArrowDown,
} from "@mui/icons-material";
import { setMode } from "../../app/state";

// Styled components matching Login.js pattern
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
  marginTop:'70px',
  marginBottom: theme?.spacing?.(4) || '32px',
  position: 'relative',
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
  }
}));

const SubmitButton = styled(Button)(({ theme }) => ({
  borderRadius: 12,
  padding: { xs: '14px 24px', md: '16px 32px' },
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
  },
  '&:disabled': {
    background: theme?.palette?.mode === 'dark' 
      ? 'rgba(255, 255, 255, 0.1)'
      : 'rgba(0, 0, 0, 0.1)',
    color: theme?.palette?.text?.disabled,
  }
}));

const CountrySelection = () => {
  useTitle("Select Your Country | Mafqoudat");

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const theme = useTheme() || {};
  const isMobile = useMediaQuery(theme?.breakpoints?.down?.('sm') || '(max-width: 600px)');
  const { t, currentLanguage } = useTranslation();
  const { currentLanguage: langContext, setLanguage } = useLanguage();
  const isRTLMode = isRTL();

  // Get pending token from URL
  const pendingToken = searchParams.get('pendingToken');

  // State
  const [selectedCountry, setSelectedCountry] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [languageAnchorEl, setLanguageAnchorEl] = useState(null);

  // Fetch countries
  const {
    data: countriesData,
    isLoading: countriesLoading,
    isError: countriesError,
  } = useGetCountriesQuery({ 
    language: currentLanguage || 'en',
    active: true 
  });

  const countries = countriesData?.ids?.map(id => countriesData.entities[id]) || [];

  // Redirect if no pending token
  useEffect(() => {
    if (!pendingToken) {
      navigate('/login');
    }
  }, [pendingToken, navigate]);

  // Helper function to get country label based on current language
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

  // Language menu handlers
  const handleLanguageClick = (event) => {
    setLanguageAnchorEl(event.currentTarget);
  };

  const handleLanguageClose = () => {
    setLanguageAnchorEl(null);
  };

  const handleLanguageSelect = (language) => {
    setLanguage(language);
    handleLanguageClose();
  };

  // Theme toggle
  const handleThemeToggle = () => {
    dispatch(setMode());
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedCountry) {
      setError(t('pleaseSelectCountry') || 'Please select your country');
      return;
    }

    setIsSubmitting(true);

    try {
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:3500";
      const response = await axios.post(`${apiUrl}/auth/complete`, {
        pendingToken,
        countryId: selectedCountry
      });

      if (response.data?.accessToken) {
        // Dispatch credentials to Redux store
        dispatch(setCredentials({ 
          accessToken: response.data.accessToken 
        }));

        // Navigate to dashboard
        navigate('/dash');
      } else {
        setError('Failed to complete registration. Please try again.');
      }
    } catch (err) {
      console.error('Country selection error:', err);
      
      let errorMessage = 'Failed to complete registration. Please try again.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 400) {
        errorMessage = 'Invalid or expired token. Please try logging in again.';
      } else if (!err.response) {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while fetching countries
  if (countriesLoading) {
    return <LoadingState message="Loading countries..." />;
  }

  // Show error if countries failed to load
  if (countriesError) {
    return (
      <PageContainer>
        <FloatingCard>
          <CardContent>
            <Alert severity="error">
              Failed to load countries. Please refresh the page.
            </Alert>
          </CardContent>
        </FloatingCard>
      </PageContainer>
    );
  }

  const languageLabels = {
    en: 'English',
    ar: 'العربية',
    fr: 'Français'
  };

  return (
    <PageContainer>
      <FloatingCard>
        {/* Top Controls */}
        <TopControlsContainer currentLanguage={currentLanguage}>
          <ControlsGroup currentLanguage={currentLanguage}>
            {/* Language Selector */}
            <LanguageSelector onClick={handleLanguageClick}>
              <Language />
              <Typography variant="body2" fontWeight={500}>
                {languageLabels[currentLanguage || 'en']}
              </Typography>
              <KeyboardArrowDown />
            </LanguageSelector>

            <Menu
              anchorEl={languageAnchorEl}
              open={Boolean(languageAnchorEl)}
              onClose={handleLanguageClose}
              PaperProps={{
                sx: {
                  borderRadius: 2,
                  mt: 1,
                  minWidth: 150,
                }
              }}
            >
              <MenuItem onClick={() => handleLanguageSelect('en')}>
                <ListItemIcon><Language fontSize="small" /></ListItemIcon>
                <ListItemText>English</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleLanguageSelect('ar')}>
                <ListItemIcon><Language fontSize="small" /></ListItemIcon>
                <ListItemText>العربية</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => handleLanguageSelect('fr')}>
                <ListItemIcon><Language fontSize="small" /></ListItemIcon>
                <ListItemText>Français</ListItemText>
              </MenuItem>
            </Menu>

            {/* Theme Toggle */}
            <ControlButton onClick={handleThemeToggle} aria-label="Toggle theme">
              {theme?.palette?.mode === 'dark' ? <LightModeOutlined /> : <DarkModeOutlined />}
            </ControlButton>
          </ControlsGroup>
        </TopControlsContainer>

        <CardContent sx={{ p: { xs: 3, md: 5 } }}>
          <HeaderSection>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: theme?.palette?.mode === 'dark'
                  ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)'
                  : 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                mb: 3,
              }}
            >
              <LocationOn sx={{ fontSize: 40, color: theme?.palette?.primary?.main }} />
            </Box>

            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '1.75rem', md: '2.25rem' },
                mb: 2,
                background: theme?.palette?.mode === 'dark'
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {t('selectYourCountry') || 'Select Your Country'}
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: theme?.palette?.text?.secondary,
                fontSize: { xs: '0.95rem', md: '1.05rem' },
                maxWidth: 450,
                margin: '0 auto',
              }}
            >
              {t('selectCountryDescription') || 'Choose your country to complete your registration'}
            </Typography>
          </HeaderSection>

          <Box component="form" onSubmit={handleSubmit}>
            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <ModernSelect fullWidth sx={{ mb: 3 }}>
              <InputLabel>{t('country') || 'Country'}</InputLabel>
              <Select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                label={t('country') || 'Country'}
                startAdornment={
                  <InputAdornment position="start">
                    <LocationOn color="action" />
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

            <SubmitButton
              type="submit"
              fullWidth
              disabled={isSubmitting || !selectedCountry}
            >
              {isSubmitting ? t('completing') || 'Completing...' : t('continue') || 'Continue'}
            </SubmitButton>
          </Box>
        </CardContent>
      </FloatingCard>
    </PageContainer>
  );
};

export default CountrySelection;

