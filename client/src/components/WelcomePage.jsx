import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setCurrentCountry, setMode } from "../app/state";
import { useGetCountriesQuery } from "../features/dependencies/dependenciesApiSlice"; // Fixed: Use dependenciesApiSlice instead of countriesApiSlice
import { useTranslation } from "../utils/translations";
import { useLanguage } from "../utils/languageContext";
import { LoadingState } from "./LoadingStates";
import { languageStorage } from "../utils/authStorage";
import SeoMeta from "./SeoMeta";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  useTheme,
  alpha,
  styled,
  Autocomplete,
  TextField,
  Paper,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  IconButton,
} from "@mui/material";
import {
  Public,
  Search,
  LocationOn,
  ArrowForward,
  ArrowBack,
  Language,
  KeyboardArrowDown,
  DarkModeOutlined,
  LightModeOutlined,
  Login,
  PersonAdd,
} from "@mui/icons-material";



// Styled components
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
  zIndex: 1,
}));

const WelcomeCard = styled(Card)(({ theme }) => ({
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
  marginBottom: theme?.spacing?.(4) || '32px',
  marginTop:'60px',
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
  '& .MuiSvgIcon-root': {
    fontSize: 40,
    color: 'white',
  }
}));

const FeatureCard = styled(Paper)(({ theme }) => ({
  padding: theme?.spacing?.(3) || '24px',
  borderRadius: 16,
  background: theme?.palette?.mode === 'dark'
    ? 'rgba(255, 255, 255, 0.05)'
    : 'rgba(255, 255, 255, 0.7)',
  border: `1px solid ${alpha(theme?.palette?.divider, 0.1)}`,
  transition: 'all 0.3s ease',
  // Remove default Paper shadow
  boxShadow: 'none',
  '&:hover': {
    transform: 'translateY(-2px)',
    // Keep only border on hover, no shadow
    border: `1px solid ${alpha(theme?.palette?.primary?.main || '#667eea', 0.3)}`,
    boxShadow: 'none',
  }
}));



const LanguageSelector = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: '12px 20px',
  borderRadius: '12px',
  cursor: 'pointer',
  background: 'rgba(30, 30, 30, 0.9)',
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
    background: `linear-gradient(45deg, 
      #1A6EEE, 
      #4A8BFF, 
      #6BA3FF, 
      #8BB5FF, 
      #1A6EEE)`,
    backgroundSize: '300% 300%',
    animation: 'gradientShift 3s ease infinite',
    opacity: 0.8,
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
    background: 'rgba(30, 30, 30, 1)',
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
    color: '#ffffff !important',
  },
  '&:hover .MuiSvgIcon-root': {
    transform: 'rotate(15deg) scale(1.1)',
  },
  // Ensure Typography text color - always white
  '& .MuiTypography-root': {
    color: '#ffffff !important',
  },
  // Target all SVG icons including the dropdown arrow - always white
  '& svg': {
    color: '#ffffff !important',
  },
}));

const ActionButton = styled(IconButton)(({ theme }) => ({
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

const WelcomePage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t, currentLanguage } = useTranslation();
  const { currentLanguage: langContext, setLanguage } = useLanguage();
  
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [languageAnchorEl, setLanguageAnchorEl] = useState(null);
  
  // Get mode from Redux store
  const mode = useSelector((state) => state.global.mode);


  // Get countries list - Fixed: Use dependenciesApiSlice and proper error handling
  const { data: countriesData, error: countriesError, isLoading: countriesLoading } = useGetCountriesQuery({
    language: currentLanguage || langContext || 'en'
  }, {
    selectFromResult: ({ data, error, isLoading }) => ({
      data: data?.ids?.map((id) => data?.entities[id]) || [],
      error,
      isLoading
    }),
  });


  // Country code to name mapping for fallback
  const countryCodeToName = {
    'MA': { en: 'Morocco', ar: 'المغرب', fr: 'Maroc' },
    'DZ': { en: 'Algeria', ar: 'الجزائر', fr: 'Algérie' },
    'TN': { en: 'Tunisia', ar: 'تونس', fr: 'Tunisie' },
    'EG': { en: 'Egypt', ar: 'مصر', fr: 'Égypte' },
    'SA': { en: 'Saudi Arabia', ar: 'المملكة العربية السعودية', fr: 'Arabie Saoudite' },
    'AE': { en: 'United Arab Emirates', ar: 'الإمارات العربية المتحدة', fr: 'Émirats Arabes Unis' },
    'QA': { en: 'Qatar', ar: 'قطر', fr: 'Qatar' },
    'KW': { en: 'Kuwait', ar: 'الكويت', fr: 'Koweït' },
    'BH': { en: 'Bahrain', ar: 'البحرين', fr: 'Bahreïn' },
    'OM': { en: 'Oman', ar: 'عُمان', fr: 'Oman' },
    'JO': { en: 'Jordan', ar: 'الأردن', fr: 'Jordanie' },
    'LB': { en: 'Lebanon', ar: 'لبنان', fr: 'Liban' },
    'SY': { en: 'Syria', ar: 'سوريا', fr: 'Syrie' },
    'IQ': { en: 'Iraq', ar: 'العراق', fr: 'Irak' },
    'PS': { en: 'Palestine', ar: 'فلسطين', fr: 'Palestine' },
    'LY': { en: 'Libya', ar: 'ليبيا', fr: 'Libye' },
    'SD': { en: 'Sudan', ar: 'السودان', fr: 'Soudan' },
    'SO': { en: 'Somalia', ar: 'الصومال', fr: 'Somalie' },
    'DJ': { en: 'Djibouti', ar: 'جيبوتي', fr: 'Djibouti' },
    'KM': { en: 'Comoros', ar: 'جزر القمر', fr: 'Comores' },
    'MR': { en: 'Mauritania', ar: 'موريتانيا', fr: 'Mauritanie' },
    'ML': { en: 'Mali', ar: 'مالي', fr: 'Mali' },
    'NE': { en: 'Niger', ar: 'النيجر', fr: 'Niger' },
    'TD': { en: 'Chad', ar: 'تشاد', fr: 'Tchad' },
    'CF': { en: 'Central African Republic', ar: 'جمهورية أفريقيا الوسطى', fr: 'République Centrafricaine' }
  };

  // Fallback countries in case API fails
  const fallbackCountries = [
    { _id: '68b0b774dcafb50aec949f4e', code: 'MA', label: 'Morocco', labels: { en: 'MA', ar: 'MA', fr: 'MA' }, names: { en: 'Morocco', ar: 'المغرب', fr: 'Maroc' }, flag: '🇲🇦', isActive: true },
  ];

  // Use countries from API or fallback
  const countries = countriesData?.length > 0 ? countriesData : fallbackCountries;

  const handleCountrySelect = (_, value) => {
    setSelectedCountry(value);
  };

  const handleContinue = () => {
    if (selectedCountry) {
      // Use the selected country ID directly
      const countryId = selectedCountry._id;
      dispatch(setCurrentCountry({ currentCountry: countryId }));
      
      // Check if there's a redirect URL stored after country selection
      const redirectUrl = localStorage.getItem('redirectAfterCountrySelection');
      if (redirectUrl) {
        localStorage.removeItem('redirectAfterCountrySelection');
        navigate(redirectUrl);
      } else {
        // Navigate to dashboard (public view)
        navigate('/dash');
      }
    }
  };

  const handleLanguageChange = (newLanguage) => {
    // Use centralized language storage utility with page refresh
    languageStorage.setLanguage(newLanguage, true); // true = refresh page
    setLanguage(newLanguage);
    setLanguageAnchorEl(null);
    window.dispatchEvent(new Event('languageChange'));
  };

  const handleLanguageClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setLanguageAnchorEl(event.currentTarget);
  };

  const handleLanguageClose = () => {
    setLanguageAnchorEl(null);
  };


  const handleModeToggle = () => {
    dispatch(setMode());
  };

  const getLanguageDisplayName = (lang) => {
    switch (lang) {
      case 'en': return 'English';
      case 'ar': return 'العربية';
      case 'fr': return 'Français';
      default: return 'English';
    }
  };



  // Show loading state only if we're actively loading and have no data
  const seoMetadata = <SeoMeta pageKey="home" />;

  if (countriesLoading && countries.length === 0) {
    return (
      <>
        {seoMetadata}
        <LoadingState message={t('loadingCountries')} />
      </>
    );
  }

  // If there's an error but we have some countries, still show the page
  // If no countries at all, show a fallback
  if (countriesError && countries.length === 0) {
    return (
      <>
        {seoMetadata}
        <PageContainer>
          <WelcomeCard>
            <CardContent>
              <Typography variant="h6" color="error" align="center">
                {t('errorLoadingCountries')}
              </Typography>
              <Button 
                variant="contained" 
                onClick={() => window.location.reload()}
                sx={{ mt: 2 }}
              >
                Retry
              </Button>
            </CardContent>
          </WelcomeCard>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      {seoMetadata}
      <PageContainer>
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
          <ActionButton onClick={handleModeToggle} size="large">
            {mode === 'light' ? (
              <DarkModeOutlined />
            ) : (
              <LightModeOutlined />
            )}
          </ActionButton>

          
        </ControlsGroup>
      </TopControlsContainer>

      {/* Language Menu - Using Material-UI Menu like Login page */}
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
              : '0 8px 32px rgba(0, 0, 0, 0.15)',
            background: theme.palette.mode === 'dark'
              ? 'rgba(30, 30, 30, 0.95)'
              : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: theme.palette.mode === 'dark'
              ? `1px solid ${alpha(theme.palette.primary.main || '#4A8BFF', 0.3)}`
              : `1px solid rgba(0, 0, 0, 0.08)`,
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem 
          onClick={() => handleLanguageChange('en')}
          sx={{
            minWidth: 120,
            color: theme.palette.mode === 'dark' ? '#ffffff' : '#1a1a1a',
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
            }
          }}
        >
          <ListItemIcon>
            <Language sx={{ 
              fontSize: 20, 
              color: theme.palette.mode === 'dark' ? '#ffffff' : '#1a1a1a' 
            }} />
          </ListItemIcon>
          <ListItemText 
            primary="English" 
            primaryTypographyProps={{ 
              sx: { color: theme.palette.mode === 'dark' ? '#ffffff' : '#1a1a1a' } 
            }}
          />
        </MenuItem>
        <MenuItem 
          onClick={() => handleLanguageChange('ar')}
          sx={{
            minWidth: 120,
            color: theme.palette.mode === 'dark' ? '#ffffff' : '#1a1a1a',
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
            }
          }}
        >
          <ListItemIcon>
            <Language sx={{ 
              fontSize: 20, 
              color: theme.palette.mode === 'dark' ? '#ffffff' : '#1a1a1a' 
            }} />
          </ListItemIcon>
          <ListItemText 
            primary="العربية" 
            primaryTypographyProps={{ 
              sx: { color: theme.palette.mode === 'dark' ? '#ffffff' : '#1a1a1a' } 
            }}
          />
        </MenuItem>
        <MenuItem 
          onClick={() => handleLanguageChange('fr')}
          sx={{
            minWidth: 120,
            color: theme.palette.mode === 'dark' ? '#ffffff' : '#1a1a1a',
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
            }
          }}
        >
          <ListItemIcon>
            <Language sx={{ 
              fontSize: 20, 
              color: theme.palette.mode === 'dark' ? '#ffffff' : '#1a1a1a' 
            }} />
          </ListItemIcon>
          <ListItemText 
            primary="Français" 
            primaryTypographyProps={{ 
              sx: { color: theme.palette.mode === 'dark' ? '#ffffff' : '#1a1a1a' } 
            }}
          />
        </MenuItem>
      </Menu>




      <WelcomeCard>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
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
                mb: 8,
                display: 'block',
                margin: '0 auto',
                filter: theme?.palette?.mode === 'dark' 
                  ? 'brightness(1.1) contrast(1.1)' 
                  : 'none',
              }}
            />
            <Typography 
              variant="h6" 
              color="text.secondary" 
              sx={{ 
                mb: 3,
                mt: 4,
                fontSize: { xs: '1.1rem', md: '1.2rem' },
                textAlign: 'center',
                lineHeight: 1.6,
                // Arabic font size fix
                ...(currentLanguage === 'ar' && {
                  fontSize: { xs: '1.2rem', md: '1.3rem' },
                }),
              }}
            >
              {t('welcomeMessage')}
            </Typography>
          </HeaderSection>

          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="h5" 
              gutterBottom 
              align="center"
              sx={{ 
                fontWeight: 600,
                mb: 2,
                fontSize: { xs: '1.4rem', md: '1.6rem' }
              }}
            >
              {t('chooseCountryTitle')}
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary" 
              align="center"
              sx={{ 
                mb: 3,
                fontSize: { xs: '1.1rem', md: '1.2rem' }
              }}
            >
              {t('chooseCountryDescription')}
            </Typography>

            <Autocomplete
              options={countries || []}
              autoHighlight
              disableClearable
              value={selectedCountry}
              onChange={handleCountrySelect}
              getOptionLabel={(option) => {
                if (!option) return '';
                const currentLang = currentLanguage || langContext || 'en';
                
                // Get the appropriate name based on language (names field contains actual country names)
                if (option.names && option.names[currentLang]) {
                  return option.names[currentLang];
                }
                
                // Fallback to labels if names is not available
                if (option.labels && option.labels[currentLang]) {
                  const label = option.labels[currentLang];
                  // If label is a 2-letter code, try to get the name from mapping
                  if (label && label.length === 2 && label === label.toUpperCase()) {
                    // This is likely a country code, try to get the name from mapping
                    return countryCodeToName[label]?.[currentLang] || option.code;
                  }
                  return label;
                }
                
                // Final fallback to country code mapping
                if (option.code && countryCodeToName[option.code]) {
                  return countryCodeToName[option.code][currentLang] || option.code;
                }
                
                return option.label || option.code;
              }}
              isOptionEqualToValue={(option, value) => option._id === value._id}
              renderOption={(props, option) => (
                <Box
                  component="li"
                  sx={{ "& > img": { mr: 2, flexShrink: 0 } }}
                  {...props}
                >
                  {option.flag ? (
                    <span style={{ marginRight: 8, fontSize: '20px' }}>
                      {option.flag}
                    </span>
                  ) : (
                    <img
                      loading="lazy"
                      width="20"
                      src={`https://flagcdn.com/w20/${option.code.toLowerCase()}.png`}
                      srcSet={`https://flagcdn.com/w40/${option.code.toLowerCase()}.png 2x`}
                      alt=""
                    />
                  )}
                  {(() => {
                    const currentLang = currentLanguage || langContext || 'en';
                    
                    // Get the appropriate name based on language
                    if (option.names && option.names[currentLang]) {
                      return option.names[currentLang];
                    }
                    
                    // Fallback to labels if names is not available
                    if (option.labels && option.labels[currentLang]) {
                      const label = option.labels[currentLang];
                      // If label is a 2-letter code, try to get the name from mapping
                      if (label && label.length === 2 && label === label.toUpperCase()) {
                        return countryCodeToName[label]?.[currentLang] || option.code;
                      }
                      return label;
                    }
                    
                    // Final fallback to country code mapping
                    if (option.code && countryCodeToName[option.code]) {
                      return countryCodeToName[option.code][currentLang] || option.code;
                    }
                    
                    return option.label || option.code;
                  })()} ({option.code})
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('chooseCountry')}
                  variant="outlined"
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 4,
                      fontSize: { xs: '1.1rem', md: '1.2rem' },
                      padding: { xs: '8px 12px', md: '12px 16px' },
                      minHeight: { xs: '56px', md: '60px' },
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
                      },
                      // Enhanced dropdown icon styling
                      '& .MuiAutocomplete-endAdornment': {
                        right: '12px',
                        '& .MuiSvgIcon-root': {
                          fontSize: '28px',
                          color: theme?.palette?.text?.secondary,
                          transition: 'all 0.3s ease',
                        },
                        '&:hover .MuiSvgIcon-root': {
                          color: theme?.palette?.primary?.main || '#667eea',
                          transform: 'scale(1.1)',
                        }
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
                  }}
                  inputProps={{
                    ...params.inputProps,
                    autoComplete: "new-password",
                  }}
                />
              )}
              // Enhanced popup styling
              ListboxProps={{
                sx: {
                  '& .MuiAutocomplete-option': {
                    padding: '12px 16px',
                    fontSize: { xs: '1.1rem', md: '1.2rem' },
                    '&:hover': {
                      backgroundColor: alpha(theme?.palette?.primary?.main || '#667eea', 0.1),
                    },
                    '&.Mui-focused': {
                      backgroundColor: alpha(theme?.palette?.primary?.main || '#667eea', 0.15),
                    }
                  }
                }
              }}
              PaperComponent={({ children, ...other }) => (
                <Paper
                  {...other}
                  sx={{
                    borderRadius: 2,
                    boxShadow: theme?.palette?.mode === 'dark'
                      ? '0 8px 32px rgba(0, 0, 0, 0.4)'
                      : '0 8px 32px rgba(0, 0, 0, 0.1)',
                    background: theme?.palette?.mode === 'dark'
                      ? 'rgba(30, 30, 30, 0.95)'
                      : 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${alpha(theme?.palette?.divider, 0.1)}`,
                    maxHeight: '300px',
                    overflow: 'auto',
                  }}
                >
                  {children}
                </Paper>
              )}
            />

            <Button
              variant="contained"
              size="large"
              fullWidth
              disabled={!selectedCountry}
              onClick={handleContinue}
              endIcon={(currentLanguage || langContext) === 'ar' ? <ArrowBack /> : <ArrowForward />}
              sx={{
                mt: 3,
                py: { xs: 2, md: 2.5 },
                px: { xs: 3, md: 4 },
                borderRadius: '4px',
                fontSize: { xs: '1.1rem', md: '1.2rem' },
                fontWeight: 600,
                color: '#ffffff',
                minHeight: { xs: '56px', md: '60px' },
                background: 'linear-gradient(45deg, #4A8BFF 30%, #1A6EEE 90%)',
                boxShadow: '0 3px 5px 2px rgba(26, 110, 238, .3)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(45deg, #5A9BFF 30%, #2A7EFF 90%)',
                  boxShadow: '0 4px 8px 2px rgba(26, 110, 238, .4)',
                },
                '&:disabled': {
                  background: theme?.palette?.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.12)'
                    : 'rgba(0, 0, 0, 0.12)',
                  color: theme?.palette?.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.3)'
                    : 'rgba(0, 0, 0, 0.26)',
                  transform: 'none',
                  boxShadow: 'none',
                },
                '& .MuiButton-endIcon': {
                  marginLeft: (currentLanguage || langContext) === 'ar' ? '8px' : '4px',
                  marginRight: (currentLanguage || langContext) === 'ar' ? '4px' : '8px',
                }
              }}
            >
              {t('continueToPosts')}
            </Button>
          </Box>

          <Grid container spacing={3} sx={{ mt: 4 }}>
            <Grid item xs={12} md={4}>
              <FeatureCard>
                <Box sx={{ textAlign: 'center' }}>
                  <Search sx={{ 
                    fontSize: 40, 
                    color: theme?.palette?.mode === 'dark' ? 'primary.main' : 'primary.dark', 
                    mb: 2 
                  }} />
                  <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', md: '1.2rem' } }}>
                    {t('searchItems')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '1rem', md: '1.1rem' } }}>
                    {t('searchItemsDesc')}
                  </Typography>
                </Box>
              </FeatureCard>
            </Grid>
            <Grid item xs={12} md={4}>
              <FeatureCard>
                <Box sx={{ textAlign: 'center' }}>
                  <LocationOn sx={{ 
                    fontSize: 40, 
                    color: theme?.palette?.mode === 'dark' ? 'primary.main' : 'primary.dark', 
                    mb: 2 
                  }} />
                  <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', md: '1.2rem' } }}>
                    {t('localPosts')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '1rem', md: '1.1rem' } }}>
                    {t('localPostsDesc')}
                  </Typography>
                </Box>
              </FeatureCard>
            </Grid>
            <Grid item xs={12} md={4}>
              <FeatureCard>
                <Box sx={{ textAlign: 'center' }}>
                  <Public sx={{ 
                    fontSize: 40, 
                    color: theme?.palette?.mode === 'dark' ? 'primary.main' : 'primary.dark', 
                    mb: 2 
                  }} />
                  <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', md: '1.2rem' } }}>
                    {t('communityHelp')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '1rem', md: '1.1rem' } }}>
                    {t('communityHelpDesc')}
                  </Typography>
                </Box>
              </FeatureCard>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '1rem', md: '1.1rem' } }}>
              {t('alreadyHaveAccount')}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<Login />}
                onClick={() => navigate('/login')}
                sx={{ 
                  minWidth: { xs: '140px', sm: '160px' },
                  minHeight: { xs: '48px', sm: '52px' },
                  fontSize: { xs: '1.1rem', sm: '1.2rem' },
                  fontWeight: 600,
                  borderRadius: '4px',
                  textTransform: 'none',
                  background: 'linear-gradient(45deg, #4A8BFF 30%, #1A6EEE 90%)',
                  color: 'white',
                  boxShadow: '0 3px 5px 2px rgba(26, 110, 238, .3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #5A9BFF 30%, #2A7EFF 90%)',
                    boxShadow: '0 4px 8px 2px rgba(26, 110, 238, .4)',
                  },
                  '& .MuiButton-startIcon': {
                    marginRight: (currentLanguage || langContext) === 'ar' ? 0 : '8px',
                    marginLeft: (currentLanguage || langContext) === 'ar' ? '8px' : 0,
                  }
                }}
              >
                {t('signin')}
              </Button>
              
              <Button
                variant="outlined"
                size="large"
                startIcon={<PersonAdd />}
                onClick={() => navigate('/signup')}
                sx={{
                  minWidth: { xs: '140px', sm: '160px' },
                  minHeight: { xs: '48px', sm: '52px' },
                  fontSize: { xs: '1.1rem', sm: '1.2rem' },
                  fontWeight: 600,
                  borderRadius: '4px',
                  textTransform: 'none',
                  borderColor: '#4A8BFF',
                  color: '#4A8BFF',
                  borderWidth: '2px',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: '#3A7BEF',
                    backgroundColor: alpha('#4A8BFF', 0.05),
                    color: '#3A7BEF',
                    borderWidth: '2px',
                    transform: 'translateY(-1px)',
                    boxShadow: `0 4px 12px ${alpha('#4A8BFF', 0.2)}`,
                  },
                  '& .MuiButton-startIcon': {
                    marginRight: (currentLanguage || langContext) === 'ar' ? 0 : '8px',
                    marginLeft: (currentLanguage || langContext) === 'ar' ? '8px' : 0,
                  }
                }}
              >
                {t('signup')}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </WelcomeCard>
    </PageContainer>
    </>
  );
};



export default WelcomePage;
