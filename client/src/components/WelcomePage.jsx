import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setCurrentCountry, setMode } from "../app/state";
import { useGetCountriesQuery } from "../features/dependencies/dependenciesApiSlice"; // Fixed: Use dependenciesApiSlice instead of countriesApiSlice
import { useTranslation } from "../utils/translations";
import { useLanguage } from "../utils/languageContext";
import { LoadingState } from "./LoadingStates";
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
} from "@mui/icons-material";



// Styled components
const PageContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  background: theme?.palette?.mode === 'dark' 
    ? 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 25%, #2d2d2d 50%, #1a1a1a 75%, #0a0a0a 100%)'
    : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 25%, #cbd5e1 50%, #e2e8f0 75%, #f8fafc 100%)',
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
  marginTop:'70px',
  position: 'relative',
}));

const BrandLogo = styled(Box)(({ theme }) => ({
  width: 80,
  height: 80,
  borderRadius: '50%',
  background: `linear-gradient(135deg, #023DA5 0%, #1B6FEF 100%)`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 16px',
  boxShadow: `0 8px 32px ${alpha('#023DA5', 0.3)}`,
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
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme?.palette?.mode === 'dark'
      ? '0 8px 32px rgba(0, 0, 0, 0.3)'
      : '0 8px 32px rgba(0, 0, 0, 0.1)',
  }
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

const TopControlsContainer = styled(Box)(({ theme }) => ({
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
}));

const ControlsGroup = styled(Box)(({ theme, currentLanguage }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme?.spacing?.(1) || '8px',
  marginRight: currentLanguage === 'ar' ? 0 : theme?.spacing?.(2) || '16px',
  marginLeft: currentLanguage === 'ar' ? theme?.spacing?.(2) || '16px' : 0,
  [theme?.breakpoints?.down?.('sm') || '@media (max-width: 600px)']: {
    gap: theme?.spacing?.(2) || '16px',
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

  // Monitor languageAnchorEl changes
  useEffect(() => {
    console.log('WelcomePage: languageAnchorEl changed to:', languageAnchorEl);
    console.log('WelcomePage: Menu should be open:', Boolean(languageAnchorEl));
  }, [languageAnchorEl]);

  // Debug logging
  console.log('WelcomePage: currentLanguage from useTranslation:', currentLanguage);
  console.log('WelcomePage: langContext from useLanguage:', langContext);
  console.log('WelcomePage: localStorage language:', localStorage.getItem('language'));
  console.log('WelcomePage: localStorage app_language:', localStorage.getItem('app_language'));
  console.log('WelcomePage: languageAnchorEl:', languageAnchorEl);
  console.log('WelcomePage: Menu open state:', Boolean(languageAnchorEl));

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

  // Debug logging for API call
  console.log('WelcomePage: API call details:', {
    countriesData,
    countriesError,
    countriesLoading,
    currentLanguage,
    langContext
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
      console.log('WelcomePage: Setting country:', countryId, 'for country:', selectedCountry);
      dispatch(setCurrentCountry({ currentCountry: countryId }));
      // Navigate to dashboard (public view)
      navigate('/dash');
    }
  };

  const handleLanguageChange = (newLanguage) => {
    console.log('WelcomePage: Changing language to:', newLanguage);
    localStorage.setItem('currentLanguage', newLanguage);
    localStorage.setItem('language', newLanguage);
    localStorage.setItem('app_language', newLanguage);
    setLanguage(newLanguage);
    setLanguageAnchorEl(null);
    window.dispatchEvent(new Event('languageChange'));
    console.log('WelcomePage: Language change event dispatched');
    
    // Force page refresh to apply language changes [[memory:5294070]]
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const handleLanguageClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    console.log('WelcomePage: Language click triggered', event.currentTarget);
    console.log('WelcomePage: Current languageAnchorEl before:', languageAnchorEl);
    setLanguageAnchorEl(event.currentTarget);
    console.log('WelcomePage: Setting languageAnchorEl to:', event.currentTarget);
  };

  const handleLanguageClose = () => {
    console.log('WelcomePage: Closing language menu');
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
  if (countriesLoading && countries.length === 0) {
    return <LoadingState message={t('loadingCountries')} />;
  }

  // If there's an error but we have some countries, still show the page
  // If no countries at all, show a fallback
  if (countriesError && countries.length === 0) {
    return (
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
    );
  }

  return (
    <PageContainer>
      {/* Top Controls Container */}
      <TopControlsContainer>
        {/* Controls Group */}
        <ControlsGroup currentLanguage={currentLanguage || langContext}>
          {/* Dark/Light mode toggle */}
          <ActionButton onClick={handleModeToggle} size="large">
            {mode === 'light' ? (
              <DarkModeOutlined />
            ) : (
              <LightModeOutlined />
            )}
          </ActionButton>

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
                display: 'block'
              }}
            >
              {getLanguageDisplayName(currentLanguage || langContext || 'en')}
            </Typography>
            <KeyboardArrowDown sx={{ fontSize: '20px', ml: 0.5 }} />
          </LanguageSelector>
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




      <WelcomeCard>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <HeaderSection>
            <BrandLogo>
              <Public />
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
                fontSize: { xs: '1rem', md: '1.25rem' },
                textAlign: 'center',
                lineHeight: 1.6,
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
                fontSize: { xs: '1.25rem', md: '1.5rem' }
              }}
            >
              {t('chooseCountryTitle')}
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary" 
              align="center"
              sx={{ mb: 3 }}
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
                      borderRadius: 2,
                      fontSize: { xs: '1rem', md: '1.1rem' }
                    }
                  }}
                  inputProps={{
                    ...params.inputProps,
                    autoComplete: "new-password",
                  }}
                />
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
                py: 1.5,
                borderRadius: 2,
                fontSize: { xs: '1rem', md: '1.1rem' },
                fontWeight: 600,
                color: '#ffffff',
                background: `linear-gradient(135deg, ${theme?.palette?.primary?.main} 0%, ${theme?.palette?.secondary?.main} 100%)`,
                boxShadow: theme?.palette?.mode === 'dark' 
                  ? '0 4px 20px rgba(0, 0, 0, 0.3)'
                  : '0 4px 20px rgba(0, 0, 0, 0.2)',
                '&:hover': {
                  background: `linear-gradient(135deg, ${theme?.palette?.primary?.dark} 0%, ${theme?.palette?.secondary?.dark} 100%)`,
                  boxShadow: theme?.palette?.mode === 'dark' 
                    ? '0 6px 25px rgba(0, 0, 0, 0.4)'
                    : '0 6px 25px rgba(0, 0, 0, 0.3)',
                },
                '&:disabled': {
                  background: theme?.palette?.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.12)'
                    : 'rgba(0, 0, 0, 0.12)',
                  color: theme?.palette?.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.3)'
                    : 'rgba(0, 0, 0, 0.26)',
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
                  <Typography variant="h6" gutterBottom>
                    {t('searchItems')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
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
                  <Typography variant="h6" gutterBottom>
                    {t('localPosts')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
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
                  <Typography variant="h6" gutterBottom>
                    {t('communityHelp')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('communityHelpDesc')}
                  </Typography>
                </Box>
              </FeatureCard>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t('alreadyHaveAccount')}
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/login')}
              sx={{ 
                marginRight: (currentLanguage || langContext) === 'ar' ? '0px' : '16px',
                marginLeft: (currentLanguage || langContext) === 'ar' ? '16px' : '0px',
                minWidth: { xs: '140px', sm: '160px' },
                minHeight: { xs: '48px', sm: '52px' },
                fontSize: { xs: '1rem', sm: '1.1rem' },
                fontWeight: 600,
                background: 'linear-gradient(135deg, #2196F3 0%, #21CBF3 100%)',
                color: 'white',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1976D2 0%, #0288D1 100%)',
                }
              }}
            >
              {t('signin')}
            </Button>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/signup')}
              sx={{
                marginLeft: (currentLanguage || langContext) === 'ar' ? '0px' : '8px',
                marginRight: (currentLanguage || langContext) === 'ar' ? '8px' : '0px',
                minWidth: { xs: '140px', sm: '160px' },
                minHeight: { xs: '48px', sm: '52px' },
                fontSize: { xs: '1rem', sm: '1.1rem' },
                fontWeight: 600,
                background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
                color: 'white',
                '&:hover': {
                  background: 'linear-gradient(135deg, #388E3C 0%, #43A047 100%)',
                }
              }}
            >
              {t('signup')}
            </Button>
          </Box>
        </CardContent>
      </WelcomeCard>
    </PageContainer>
  );
};

export default WelcomePage;
