import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCurrentCountry } from "../app/state";
import { useGetCountriesQuery } from "../features/countries/countriesApiSlice";
import { useTranslation } from "../utils/translations";
import { useLanguage } from "../utils/languageContext";
import { LoadingState } from "./LoadingStates";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Container,
  Grid,
  useTheme,
  useMediaQuery,
  alpha,
  styled,
  Autocomplete,
  TextField,
  Paper,
  Chip,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Public,
  Search,
  LocationOn,
  ArrowForward,
  Language,
  KeyboardArrowDown,
  Menu,
} from "@mui/icons-material";
import { setMode } from "../app/state";

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
  position: 'relative',
}));

const BrandLogo = styled(Box)(({ theme }) => ({
  width: 80,
  height: 80,
  borderRadius: '50%',
  background: `linear-gradient(135deg, ${theme?.palette?.primary?.main || '#667eea'} 0%, ${theme?.palette?.secondary?.main || '#764ba2'} 100%)`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 16px',
  boxShadow: `0 8px 32px ${alpha(theme?.palette?.primary?.main || '#667eea', 0.3)}`,
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

const ControlButton = styled(Button)(({ theme }) => ({
  position: 'absolute',
  top: theme?.spacing?.(2) || '16px',
  right: theme?.spacing?.(2) || '16px',
  minWidth: 'auto',
  padding: '8px',
  borderRadius: '50%',
  background: theme?.palette?.mode === 'dark' 
    ? alpha(theme?.palette?.common?.white, 0.1)
    : alpha(theme?.palette?.common?.black, 0.05),
  color: theme?.palette?.text?.primary,
  '&:hover': {
    background: theme?.palette?.mode === 'dark' 
      ? alpha(theme?.palette?.common?.white, 0.2)
      : alpha(theme?.palette?.common?.black, 0.1),
  }
}));

const LanguageSelector = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: theme?.spacing?.(2) || '16px',
  left: theme?.spacing?.(2) || '16px',
  display: 'flex',
  alignItems: 'center',
  padding: '8px 16px',
  borderRadius: '12px',
  cursor: 'pointer',
  background: theme?.palette?.mode === 'dark' 
    ? alpha(theme?.palette?.common?.white, 0.05)
    : alpha(theme?.palette?.common?.black, 0.05),
  transition: 'all 0.3s ease',
  '&:hover': {
    background: theme?.palette?.mode === 'dark' 
      ? alpha(theme?.palette?.common?.white, 0.1)
      : alpha(theme?.palette?.common?.black, 0.1),
    transform: 'translateY(-2px)',
  },
  '& .MuiSvgIcon-root': {
    marginRight: '8px',
    fontSize: '20px',
  },
}));

const WelcomePage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery("(max-width:600px)");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t, currentLanguage } = useTranslation();
  const { currentLanguage: langContext, setLanguage } = useLanguage();
  
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [languageAnchorEl, setLanguageAnchorEl] = useState(null);

  // Get countries list
  const { data: countriesData, error: countriesError, isLoading: countriesLoading } = useGetCountriesQuery({
    language: currentLanguage || langContext || 'en'
  });

  // Fallback countries in case API fails
  const fallbackCountries = [
    { _id: 'fallback-1', code: 'US', label: 'United States', labels: { en: 'United States', ar: 'الولايات المتحدة', fr: 'États-Unis' }, flag: '🇺🇸' },
    { _id: 'fallback-2', code: 'GB', label: 'United Kingdom', labels: { en: 'United Kingdom', ar: 'المملكة المتحدة', fr: 'Royaume-Uni' }, flag: '🇬🇧' },
    { _id: 'fallback-3', code: 'FR', label: 'France', labels: { en: 'France', ar: 'فرنسا', fr: 'France' }, flag: '🇫🇷' },
    { _id: 'fallback-4', code: 'DE', label: 'Germany', labels: { en: 'Germany', ar: 'ألمانيا', fr: 'Allemagne' }, flag: '🇩🇪' },
    { _id: 'fallback-5', code: 'CA', label: 'Canada', labels: { en: 'Canada', ar: 'كندا', fr: 'Canada' }, flag: '🇨🇦' },
  ];

  const countries = countriesData?.ids?.map((id) => countriesData?.entities[id]) || fallbackCountries;

  const handleCountrySelect = (_, value) => {
    setSelectedCountry(value);
  };

  const handleContinue = () => {
    if (selectedCountry) {
      // For fallback countries, use a default country ID
      const countryId = selectedCountry._id.startsWith('fallback-') ? 'default-country' : selectedCountry._id;
      dispatch(setCurrentCountry({ currentCountry: countryId }));
      // Navigate to dashboard (public view)
      navigate('/dash');
    }
  };

  const handleLanguageChange = (language) => {
    setLanguage(language);
    setLanguageAnchorEl(null);
    // Refresh the page to apply language changes
    window.location.reload();
  };

  const handleLanguageClick = (event) => {
    setLanguageAnchorEl(event.currentTarget);
  };

  const handleLanguageClose = () => {
    setLanguageAnchorEl(null);
  };

  // Get the appropriate label based on language
  const getCountryLabel = (option) => {
    if (option.labels && option.labels[currentLanguage || langContext || 'en']) {
      return option.labels[currentLanguage || langContext || 'en'];
    }
    return option.label || option.code;
  };

  // Get flag source - prefer local flag, fallback to flagcdn
  const getFlagSource = (option) => {
    if (option.flag) {
      return option.flag; // Use emoji flag if available
    }
    return `https://flagcdn.com/w20/${option.code.toLowerCase()}.png`;
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
      {/* Language Selector */}
      <LanguageSelector onClick={handleLanguageClick}>
        <Language />
        <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
          {currentLanguage === 'ar' ? 'العربية' : currentLanguage === 'fr' ? 'Français' : 'English'}
        </Typography>
        <KeyboardArrowDown />
      </LanguageSelector>

      <Menu
        anchorEl={languageAnchorEl}
        open={Boolean(languageAnchorEl)}
        onClose={handleLanguageClose}
        PaperProps={{
          sx: {
            background: theme?.palette?.mode === 'dark' 
              ? 'rgba(30, 30, 30, 0.95)'
              : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme?.palette?.divider, 0.1)}`,
          }
        }}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
      >
        <MenuItem 
          onClick={() => handleLanguageChange('en')}
          sx={{
            minWidth: 120,
            '&:hover': {
              backgroundColor: alpha(theme?.palette?.primary?.main, 0.1),
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
              backgroundColor: alpha(theme?.palette?.primary?.main, 0.1),
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
              backgroundColor: alpha(theme?.palette?.primary?.main, 0.1),
            }
          }}
        >
          <ListItemIcon>
            <Language sx={{ fontSize: 20 }} />
          </ListItemIcon>
          <ListItemText primary="Français" />
        </MenuItem>
      </Menu>

      {/* Theme Toggle */}
      <ControlButton
        onClick={() => dispatch(setMode())}
        sx={{
          position: 'absolute',
          top: theme?.spacing?.(2) || '16px',
          right: theme?.spacing?.(2) || '16px',
        }}
      >
        {theme?.palette?.mode === 'dark' ? '🌞' : '🌙'}
      </ControlButton>

      <WelcomeCard>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <HeaderSection>
            <BrandLogo>
              <Public />
            </BrandLogo>
            <Typography 
              variant="h3" 
              component="h1" 
              gutterBottom
              sx={{ 
                fontWeight: 700,
                background: `linear-gradient(135deg, ${theme?.palette?.primary?.main} 0%, ${theme?.palette?.secondary?.main} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: { xs: '2rem', md: '3rem' }
              }}
            >
              {t('brandName')}
            </Typography>
            <Typography 
              variant="h6" 
              color="text.secondary" 
              sx={{ 
                mb: 3,
                fontSize: { xs: '1rem', md: '1.25rem' }
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
              options={countries}
              autoHighlight
              disableClearable
              value={selectedCountry}
              onChange={handleCountrySelect}
              getOptionLabel={(option) => getCountryLabel(option)}
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
                      src={getFlagSource(option)}
                      srcSet={`https://flagcdn.com/w40/${option.code.toLowerCase()}.png 2x`}
                      alt=""
                    />
                  )}
                  {getCountryLabel(option)} ({option.code})
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
              endIcon={<ArrowForward />}
              sx={{
                mt: 3,
                py: 1.5,
                borderRadius: 2,
                fontSize: { xs: '1rem', md: '1.1rem' },
                fontWeight: 600,
                background: `linear-gradient(135deg, ${theme?.palette?.primary?.main} 0%, ${theme?.palette?.secondary?.main} 100%)`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${theme?.palette?.primary?.dark} 0%, ${theme?.palette?.secondary?.dark} 100%)`,
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
                  <Search sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
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
                  <LocationOn sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
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
                  <Public sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
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
              variant="outlined"
              onClick={() => navigate('/login')}
              sx={{ mr: 2 }}
            >
              {t('signin')}
            </Button>
            <Button
              variant="text"
              onClick={() => navigate('/signup')}
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
