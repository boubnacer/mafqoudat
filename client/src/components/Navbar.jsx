import {
  AppBar,
  Box,
  Button,
  IconButton,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
  styled,
  alpha,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Autocomplete,
  TextField,
  Paper,
} from "@mui/material";
import {
  DarkModeOutlined,
  LightModeOutlined,
  Menu as MenuIcon,
  LogoutOutlined,
  Language,
  KeyboardArrowDown,
  Login,
  PersonAdd,
  Search,
  Explore,
  Dashboard,
  PostAdd,
  AdminPanelSettings,
  Person,
} from "@mui/icons-material";
import FlexBetween from "./FlexBetween";
import {
  selectCurrentCountry,
  setMode,
  setCurrentCountry,
} from "../app/state";
import { useDispatch, useSelector } from "react-redux";
import { useSendLogoutMutation } from "../features/auth/authApiSlice";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useGetCountriesQuery } from "../features/countries/countriesApiSlice";
import useAuth from "../hooks/useAuth";
import { useTranslation } from "../utils/translations";
import { useGetflOptionsQuery } from "../features/dependencies/dependenciesApiSlice";
import { useUnifiedLanguageChange } from "../hooks/useUnifiedLanguageChange";

// Global keyframes for logo animation
const globalStyles = `
  @keyframes mirrorReflection {
    0% {
      left: 0px;
      opacity: 0;
      transform: translateY(-50%) skew(-15deg) scaleX(0.5);
    }
    15% {
      opacity: 1;
      transform: translateY(-50%) skew(-15deg) scaleX(1);
    }
    85% {
      left: 100%;
      opacity: 1;
      transform: translateY(-50%) skew(-15deg) scaleX(1);
    }
    100% {
      left: 100%;
      opacity: 0;
      transform: translateY(-50%) skew(-15deg) scaleX(0.5);
    }
  }
`;

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  justifyContent: "space-between",
  background: theme.palette.mode === 'dark'
    ? `rgba(18, 18, 18, 0.95)`
    : `rgba(255, 255, 255, 0.95)`,
  backdropFilter: 'blur(20px)',
  padding: "0.75rem 2rem",
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  boxShadow: theme.palette.mode === 'dark' 
    ? '0 4px 20px rgba(0, 0, 0, 0.3)'
    : '0 4px 20px rgba(0, 0, 0, 0.08)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  // Force LTR layout for toolbar
  direction: 'ltr !important',
  [theme.breakpoints.down('sm')]: {
    padding: "1rem 1.5rem",
    minHeight: "72px",
  }
}));

const LogoButton = styled(Button)(({ theme }) => ({
  padding: '8px 12px',
  borderRadius: theme.palette.mode === 'dark' ? '4px' : '10px',
  position: 'relative',
  overflow: 'hidden',
  background: 'transparent',
  minWidth: 'auto',
  boxShadow: 'none',
  marginLeft: theme.direction === 'rtl' ? '0' : '-4px',
  marginRight: theme.direction === 'rtl' ? '-4px' : '0',
  '&:hover': {
    background: 'transparent',
    boxShadow: 'none',
  },
  '& img': {
    height: 'auto',
    maxHeight: '20px', // Default size for maflogo
    width: 'auto',
    objectFit: 'contain',
    transition: 'all 0.3s ease',
    position: 'relative',
    zIndex: 2,
  },
  '& img[alt="Mafqoudat Icon"]': {
    maxHeight: '50px', // Larger size specifically for maficon
  },
  [theme.breakpoints.down('sm')]: {
    padding: '6px 8px',
    marginLeft: theme.direction === 'rtl' ? '0' : '-6px',
    marginRight: theme.direction === 'rtl' ? '-6px' : '0',
    gap: '6px',
    '& img': {
      maxHeight: '16px', // Default size for maflogo on mobile
    },
    '& img[alt="Mafqoudat Icon"]': {
      maxHeight: '40px', // Larger size specifically for maficon on mobile
    }
  }
}));

const ActionButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.mode === 'dark' ? '#fff' : '#1a1a1a',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  margin: '0 4px',
  padding: '10px',
  borderRadius: '10px',
  background: theme.palette.mode === 'dark' 
    ? alpha(theme.palette.common.white, 0.05)
    : alpha(theme.palette.common.black, 0.03),
  '&:hover': {
    background: theme.palette.mode === 'dark' 
      ? alpha(theme.palette.common.white, 0.12)
      : alpha(theme.palette.common.black, 0.08),
    transform: 'translateY(-2px)',
    boxShadow: theme.palette.mode === 'dark'
      ? '0 4px 15px rgba(0, 0, 0, 0.3)'
      : '0 4px 15px rgba(0, 0, 0, 0.1)',
  },
  [theme.breakpoints.down('sm')]: {
    padding: '10px',
    margin: '0 3px',
  }
}));

const NavigationButton = styled(Button)(({ theme }) => ({
  color: theme.palette.mode === 'dark' ? '#fff' : '#1a1a1a',
  fontSize: '0.9rem',
  fontWeight: 600,
  padding: '8px 16px',
  borderRadius: '10px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  background: theme.palette.mode === 'dark' 
    ? alpha(theme.palette.common.white, 0.05)
    : alpha(theme.palette.common.black, 0.03),
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  '&:hover': {
    background: theme.palette.mode === 'dark' 
      ? alpha(theme.palette.common.white, 0.12)
      : alpha(theme.palette.common.black, 0.08),
    transform: 'translateY(-2px)',
    boxShadow: theme.palette.mode === 'dark'
      ? '0 4px 15px rgba(0, 0, 0, 0.3)'
      : '0 4px 15px rgba(0, 0, 0, 0.1)',
  },
}));

const CountrySelector = styled(Box)(({ theme }) => ({
  minWidth: { xs: '120px', sm: '140px' },
  maxWidth: { xs: '140px', sm: '180px' },
  [theme.breakpoints.down('sm')]: {
    minWidth: '100px',
    maxWidth: '120px',
  }
}));

const LanguageSelector = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '6px 12px',
  borderRadius: '10px',
  cursor: 'pointer',
  background: theme.palette.mode === 'dark' 
    ? alpha(theme.palette.common.white, 0.05)
    : alpha(theme.palette.common.black, 0.03),
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    background: theme.palette.mode === 'dark' 
      ? alpha(theme.palette.common.white, 0.12)
      : alpha(theme.palette.common.black, 0.08),
    transform: 'translateY(-2px)',
    boxShadow: theme.palette.mode === 'dark'
      ? '0 4px 15px rgba(0, 0, 0, 0.3)'
      : '0 4px 15px rgba(0, 0, 0, 0.1)',
  },
  '& .MuiSvgIcon-root': {
    marginRight: '8px',
    fontSize: '18px',
  },
  [theme.breakpoints.down('sm')]: {
    padding: '8px 10px',
    justifyContent: 'center',
    '& .MuiSvgIcon-root': {
      marginRight: '0',
      fontSize: '20px',
    }
  }
}));

const CreatePostButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(45deg, #4A8BFF 30%, #1A6EEE 90%)',
  color: '#fff',
  fontSize: '0.9rem',
  fontWeight: 600,
  padding: '8px 16px',
  borderRadius: '4px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: '0 3px 5px 2px rgba(26, 110, 238, .3)',
  '&:hover': {
    background: 'linear-gradient(45deg, #5A9BFF 30%, #2A7EFF 90%)',
    boxShadow: '0 4px 8px 2px rgba(26, 110, 238, .4)',
  },
}));

const Navbar = () => {
  const { country, username, role, isAuthenticated } = useAuth();
  const user = { username };
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width:600px)");
  const isTablet = useMediaQuery("(max-width:900px)");
  const { t, currentLanguage } = useTranslation();
  const { changeLanguage, isChanging: isLanguageChanging } = useUnifiedLanguageChange({
    showLoadingState: false,
    refetchPriority: 'medium',
    enableLogging: process.env.NODE_ENV === 'development'
  });

  const currentCountry = useSelector(selectCurrentCountry);
  const mode = useSelector((state) => state.global.mode);

  const [selectedCountry, setSelectedCountry] = useState(null);
  const [languageAnchorEl, setLanguageAnchorEl] = useState(null);
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState(null);
  const [navigationAnchorEl, setNavigationAnchorEl] = useState(null);
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [logoAnimationTrigger, setLogoAnimationTrigger] = useState(false);

  // Get found/lost options for navigation
  const { data: flOptionsData } = useGetflOptionsQuery({
    language: currentLanguage
  }, {
    selectFromResult: ({ data }) => ({
      data: data?.ids?.map((id) => data?.entities[id]) || [],
    }),
  });


  // Initialize country on component mount
  useEffect(() => {
    if (!isInitialized) {
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Inject global styles for animation
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = globalStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Trigger logo animation on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setLogoAnimationTrigger(true);
    }, 1000); // Start animation after 1 second
    return () => clearTimeout(timer);
  }, []);

  const handleCountrySelect = (_, value) => {
    setSelectedCountry(value);
    if (value) {
      dispatch(setCurrentCountry({ currentCountry: value._id }));
    }
  };

  const { countries } = useGetCountriesQuery({
    language: currentLanguage
  }, {
    selectFromResult: ({ data }) => ({
      countries: data?.ids.map((id) => data?.entities[id]),
    }),
    // Add debouncing to prevent multiple API calls during language switch
    refetchOnMountOrArgChange: 500, // 500ms debounce
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
    { _id: '68a4b54ab46524c54c553ca9', code: 'MA', label: 'Morocco', labels: { en: 'MA', ar: 'MA', fr: 'MA' }, names: { en: 'Morocco', ar: 'المغرب', fr: 'Maroc' }, flag: '🇲🇦' },
  ];

  // Use countries from API or fallback
  const countriesToUse = countries || fallbackCountries;

  const [sendLogout, { isSuccess }] = useSendLogoutMutation();

  useEffect(() => {
    if (isSuccess) navigate("/login");
  }, [isSuccess, navigate]);

  const onGoHomeClicked = () => navigate("/dash");

  // Menu handlers
  const handleLanguageClick = (event) => setLanguageAnchorEl(event.currentTarget);
  const handleLanguageClose = () => setLanguageAnchorEl(null);
  const handleMobileMenuClick = (event) => setMobileMenuAnchorEl(event.currentTarget);
  const handleMobileMenuClose = () => setMobileMenuAnchorEl(null);
  const handleNavigationClick = (event) => setNavigationAnchorEl(event.currentTarget);
  const handleNavigationClose = () => setNavigationAnchorEl(null);
  const handleProfileClick = (event) => setProfileAnchorEl(event.currentTarget);
  const handleProfileClose = () => setProfileAnchorEl(null);

  const handleLanguageChange = async (newLanguage) => {
    console.log('🌐 [NAVBAR] Language change triggered:', { newLanguage, currentUrl: window.location.href });
    
    try {
      // Use unified language change handler
      const success = await changeLanguage(newLanguage);
      
      if (success) {
        console.log('🌐 [NAVBAR] Language changed successfully to:', newLanguage);
        handleLanguageClose();
      } else {
        console.error('🌐 [NAVBAR] Failed to change language to:', newLanguage);
      }
    } catch (error) {
      console.error('🌐 [NAVBAR] Error changing language:', error);
    }
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


  // Navigation menu items
  const navigationItems = [
    {
      title: t('dashboard'),
      icon: <Dashboard sx={{ fontSize: 20 }} />,
      action: () => navigate('/dash'),
      description: t('goToDashboard')
    },
    {
      title: t('all'),
      icon: <Explore sx={{ fontSize: 20 }} />,
      action: () => {
        navigate('/dash/posts');
        // Reset filters to show all posts
        // You might need to dispatch actions here to reset filters
      },
      description: t('viewAllPosts')
    },
    ...(flOptionsData?.map(option => ({
      title: option.label || option.code,
      icon: option.code === 'FOUND' ? <Search sx={{ fontSize: 20, color: '#4CAF50' }} /> : <Search sx={{ fontSize: 20, color: '#757575' }} />,
      action: () => {
        // Navigate with the correct found/lost ID filter
        navigate(`/dash/posts?fl=${option._id}`);
      },
      description: t(`view${option.code}Items`)
    })) || [])
  ];

  // Add admin button if user is admin
  if (isAuthenticated && role === 'admin') {
    navigationItems.push({
      title: t('adminPanel'),
      icon: <AdminPanelSettings sx={{ fontSize: 20, color: theme.palette.error.main }} />,
      action: () => navigate('/dash/admin'),
      description: t('adminPanelDescription')
    });
  }

  return (
    <AppBar
      sx={{
        boxShadow: 'none',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: (theme) => theme.zIndex.drawer + 1,
        // Force LTR layout for navbar regardless of language
        direction: 'ltr !important',
        '& *': {
          direction: 'ltr !important',
        }
      }}
    >
      <StyledToolbar>
        {/* Left section: Logo */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: { xs: '0.75rem', sm: '1rem' },
          direction: 'ltr !important'
        }}>
          <LogoButton 
            onClick={onGoHomeClicked}
            sx={{
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <img
              src="/maficon.png"
              alt="Mafqoudat Icon"
              loading="lazy"
              style={{
                height: '35px',
                width: '35px',
                objectFit: 'contain',
                position: 'relative',
                zIndex: 2,
              }}
            />
            <img
              src="/maflogo.png"
              alt={t("brandName")}
              loading="lazy"
              style={{
                position: 'relative',
                zIndex: 2,
              }}
            />
          </LogoButton>
        </Box>

        {/* Center section: Navigation - desktop only */}
        {!isTablet && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            mx: 2,
            gap: 1,
            direction: 'ltr !important'
          }}>
            {/* Navigation Dropdown */}
            <NavigationButton
              onClick={handleNavigationClick}
              endIcon={<KeyboardArrowDown />}
              sx={{ minWidth: 140 }}
            >
              {t('explore')}
            </NavigationButton>

            {/* Dynamic Button - Sign In for logged out, Create Post for logged in */}
            <CreatePostButton
              onClick={() => {
                if (isAuthenticated) {
                  navigate('/dash/posts/new');
                } else {
                  navigate('/login');
                }
              }}
              startIcon={isAuthenticated ? <PostAdd /> : <Login />}
            >
              {isAuthenticated ? t('createPost') : t('signin')}
            </CreatePostButton>
          </Box>
        )}

        {/* Right section: Actions */}
        <FlexBetween sx={{ 
          gap: { xs: '6px', sm: '8px' },
          direction: 'ltr !important'
        }}>
          {/* Country selector */}
          <CountrySelector>
            <Autocomplete
              options={countriesToUse || []}
              autoHighlight
              disableClearable
              value={selectedCountry}
              onChange={handleCountrySelect}
              getOptionLabel={(option) => {
                if (!option) return '';
                const currentLang = currentLanguage || 'en';
                
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
                    const currentLang = currentLanguage || 'en';
                    
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
                  variant="outlined"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      fontSize: { xs: '0.8rem', sm: '0.9rem' },
                      padding: { xs: '4px 8px', sm: '6px 12px' },
                      minHeight: { xs: '36px', sm: '40px' },
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? alpha(theme.palette.common.white, 0.05)
                        : alpha(theme.palette.common.black, 0.03),
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: alpha(theme.palette.primary.main, 0.3),
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? alpha(theme.palette.common.white, 0.08)
                          : alpha(theme.palette.common.black, 0.05),
                      },
                      '&.Mui-focused': {
                        borderColor: theme.palette.primary.main,
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? alpha(theme.palette.common.white, 0.1)
                          : alpha(theme.palette.common.black, 0.06),
                        boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
                      },
                    },
                    '& .MuiInputLabel-root': {
                      display: 'none', // Hide label for compact navbar
                    },
                    '& .MuiAutocomplete-endAdornment': {
                      right: '8px',
                      '& .MuiSvgIcon-root': {
                        fontSize: '16px',
                        color: theme.palette.text.secondary,
                      },
                    }
                  }}
                  inputProps={{
                    ...params.inputProps,
                    autoComplete: "new-password",
                  }}
                />
              )}
              PaperComponent={({ children, ...other }) => (
                <Paper
                  {...other}
                  sx={{
                    borderRadius: 2,
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 8px 32px rgba(0, 0, 0, 0.4)'
                      : '0 8px 32px rgba(0, 0, 0, 0.1)',
                    background: theme.palette.mode === 'dark'
                      ? 'rgba(30, 30, 30, 0.95)'
                      : 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    maxHeight: '300px',
                    overflow: 'auto',
                  }}
                >
                  {children}
                </Paper>
              )}
            />
          </CountrySelector>

          {/* Language selector */}
          <LanguageSelector 
            onClick={handleLanguageClick}
            sx={{
              padding: { xs: '8px 10px', sm: '6px 12px' },
            }}
          >
            <Language />
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                fontSize: { xs: '0.8rem', sm: '0.9rem' },
                display: { xs: 'none', sm: 'block' },
                // Only apply RTL to text content, not layout
                textAlign: currentLanguage === 'ar' ? 'right' : 'left'
              }}
            >
              {getLanguageDisplayName(currentLanguage)}
            </Typography>
            {!isMobile && <KeyboardArrowDown sx={{ fontSize: '16px', ml: 0.5 }} />}
          </LanguageSelector>

          {/* Dark/Light mode toggle */}
          <ActionButton
            onClick={handleModeToggle}
            sx={{ 
              display: { xs: 'none', sm: 'flex' }
            }}
          >
            {mode === 'light' ? (
              <DarkModeOutlined sx={{ fontSize: "20px" }} />
            ) : (
              <LightModeOutlined sx={{ fontSize: "20px" }} />
            )}
          </ActionButton>

          {/* Profile button for authenticated users - desktop only */}
          {isAuthenticated && (
            <ActionButton
              onClick={handleProfileClick}
              sx={{
                display: { xs: 'none', sm: 'flex' }
              }}
            >
              <Person sx={{ fontSize: "20px" }} />
            </ActionButton>
          )}

          {/* Mobile menu button */}
          <ActionButton
            onClick={handleMobileMenuClick}
            sx={{ 
              display: { xs: 'flex', sm: 'none' },
            }}
          >
            <MenuIcon sx={{ fontSize: "24px" }} />
          </ActionButton>
        </FlexBetween>

        {/* Navigation Dropdown Menu */}
        <Menu
          anchorEl={navigationAnchorEl}
          open={Boolean(navigationAnchorEl)}
          onClose={handleNavigationClose}
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
              minWidth: 280,
            }
          }}
          transformOrigin={{ horizontal: 'center', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
        >
          {navigationItems.map((item, index) => (
            <MenuItem 
              key={item.title}
              onClick={() => {
                item.action();
                handleNavigationClose();
              }}
              sx={{
                py: 1.5,
                px: 2,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                }
              }}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.title}
                secondary={item.description}
                primaryTypographyProps={{
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  textAlign: currentLanguage === 'ar' ? 'right' : 'left'
                }}
                secondaryTypographyProps={{
                  fontSize: '0.8rem',
                  color: 'text.secondary',
                  textAlign: currentLanguage === 'ar' ? 'right' : 'left'
                }}
              />
            </MenuItem>
          ))}
        </Menu>

        {/* Language Dropdown Menu */}
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
            <ListItemText 
              primary="English" 
              primaryTypographyProps={{
                textAlign: currentLanguage === 'ar' ? 'right' : 'left'
              }}
            />
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
            <ListItemText 
              primary="العربية" 
              primaryTypographyProps={{
                textAlign: currentLanguage === 'ar' ? 'right' : 'left'
              }}
            />
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
            <ListItemText 
              primary="Français" 
              primaryTypographyProps={{
                textAlign: currentLanguage === 'ar' ? 'right' : 'left'
              }}
            />
          </MenuItem>
        </Menu>

        {/* Profile Dropdown Menu */}
        <Menu
          anchorEl={profileAnchorEl}
          open={Boolean(profileAnchorEl)}
          onClose={handleProfileClose}
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
              minWidth: 200,
            }
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem 
            onClick={() => {
              handleProfileClose();
              sendLogout();
            }}
            sx={{
              py: 1.5,
              px: 2,
              '&:hover': {
                backgroundColor: alpha(theme.palette.error.main, 0.1),
              }
            }}
          >
            <ListItemIcon>
              <LogoutOutlined sx={{ fontSize: 20, color: 'error.main' }} />
            </ListItemIcon>
            <ListItemText 
              primary={t('logout')}
              sx={{ color: 'error.main' }}
              primaryTypographyProps={{
                fontWeight: 600,
                fontSize: '0.95rem',
                textAlign: currentLanguage === 'ar' ? 'right' : 'left'
              }}
            />
          </MenuItem>
        </Menu>

        {/* Mobile Menu */}
        <Menu
          anchorEl={mobileMenuAnchorEl}
          open={Boolean(mobileMenuAnchorEl)}
          onClose={handleMobileMenuClose}
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
              minWidth: 280,
            }
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ p: 1.5 }}>
            {/* Navigation Items */}
            {navigationItems.map((item, index) => (
              <MenuItem
                key={item.title}
                onClick={() => {
                  item.action();
                  handleMobileMenuClose();
                }}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  py: 1.5,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  }
                }}
              >
                <ListItemIcon>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.title}
                  secondary={item.description}
                  primaryTypographyProps={{
                    fontWeight: 600,
                    fontSize: '1rem',
                    textAlign: currentLanguage === 'ar' ? 'right' : 'left'
                  }}
                  secondaryTypographyProps={{
                    fontSize: '0.85rem',
                    color: 'text.secondary',
                    textAlign: currentLanguage === 'ar' ? 'right' : 'left'
                  }}
                />
              </MenuItem>
            ))}
            
            <Divider sx={{ my: 1.5, opacity: 0.3 }} />
            
            {/* Theme Toggle */}
            <MenuItem
              onClick={() => {
                handleModeToggle();
                handleMobileMenuClose();
              }}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                py: 1.5,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                }
              }}
            >
              <ListItemIcon>
                {mode === 'light' ? (
                  <DarkModeOutlined sx={{ fontSize: 22 }} />
                ) : (
                  <LightModeOutlined sx={{ fontSize: 22 }} />
                )}
              </ListItemIcon>
              <ListItemText 
                primary={mode === 'light' ? t('darkMode') : t('lightMode')}
                primaryTypographyProps={{
                  fontWeight: 600,
                  fontSize: '1rem',
                  textAlign: currentLanguage === 'ar' ? 'right' : 'left'
                }}
              />
            </MenuItem>
            
            {/* Authentication Section */}
            {isAuthenticated ? (
              <MenuItem
                onClick={() => {
                  handleMobileMenuClose();
                  sendLogout();
                }}
                sx={{
                  borderRadius: 1,
                  py: 1.5,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.error.main, 0.1),
                  }
                }}
              >
                <ListItemIcon>
                  <LogoutOutlined sx={{ fontSize: 22, color: 'error.main' }} />
                </ListItemIcon>
                <ListItemText 
                  primary={t('logout')} 
                  sx={{ color: 'error.main' }}
                  primaryTypographyProps={{
                    fontWeight: 600,
                    fontSize: '1rem',
                    textAlign: currentLanguage === 'ar' ? 'right' : 'left'
                  }}
                />
              </MenuItem>
            ) : (
              <>
                <MenuItem
                  onClick={() => {
                    handleMobileMenuClose();
                    navigate('/login');
                  }}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    py: 1.5,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    }
                  }}
                >
                  <ListItemIcon>
                    <Login sx={{ fontSize: 22 }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={t('signin')}
                    primaryTypographyProps={{
                      fontWeight: 600,
                      fontSize: '1rem',
                      textAlign: currentLanguage === 'ar' ? 'right' : 'left'
                    }}
                  />
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    handleMobileMenuClose();
                    navigate('/signup');
                  }}
                  sx={{
                    borderRadius: 1,
                    py: 1.5,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                    }
                  }}
                >
                  <ListItemIcon>
                    <PersonAdd sx={{ fontSize: 22 }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={t('signup')}
                    primaryTypographyProps={{
                      fontWeight: 600,
                      fontSize: '1rem',
                      textAlign: currentLanguage === 'ar' ? 'right' : 'left'
                    }}
                  />
                </MenuItem>
              </>
            )}
          </Box>
        </Menu>

      </StyledToolbar>
    </AppBar>
  );
};

export default Navbar;
