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
  Chip,
  Tooltip,
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
  Build,
  Refresh,
} from "@mui/icons-material";
import FlexBetween from "./FlexBetween";
import {
  selectCurrentCountry,
  setMode,
  setCurrentCountry,
  setFoundOrLost,
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
import { forceRefreshAllDependencies } from "../utils/cacheRefresh";
import { selectIsLoggedIn, selectCurrentUser } from "../features/auth/authSlice";
import { useGetSystemSettingsQuery } from "../features/admin/systemSettingsApiSlice";

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
  '& img': {
    borderRadius: '4px',
    marginRight: '8px',
    transition: 'all 0.3s ease',
  },
  [theme.breakpoints.down('sm')]: {
    padding: '8px 10px',
    justifyContent: 'center',
    '& img': {
      marginRight: '0',
    }
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

  // Use Redux selectors directly for better state synchronization
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const reduxUser = useSelector(selectCurrentUser);
  const authState = useSelector(state => state.auth);
  const { isLoggedIn: authLoggedIn, user: authUser, lastUpdate } = authState;
  
  const currentCountry = useSelector(selectCurrentCountry);
  const mode = useSelector((state) => state.global.mode);

  const [selectedCountry, setSelectedCountry] = useState(null);
  const [countryAnchorEl, setCountryAnchorEl] = useState(null);
  const [languageAnchorEl, setLanguageAnchorEl] = useState(null);
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState(null);
  const [navigationAnchorEl, setNavigationAnchorEl] = useState(null);
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [logoAnimationTrigger, setLogoAnimationTrigger] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get found/lost options for navigation
  const { data: flOptionsData } = useGetflOptionsQuery({
    language: currentLanguage
  }, {
    selectFromResult: ({ data }) => ({
      data: data?.ids?.map((id) => data?.entities[id]) || [],
    }),
  });

  // Get system settings for maintenance mode indicator (only for admins)
  const { data: systemSettingsData } = useGetSystemSettingsQuery(undefined, {
    skip: role !== 'admin', // Only fetch if user is admin
    pollingInterval: 30000, // Poll every 30 seconds
  });
  const isMaintenanceActive = systemSettingsData?.data?.maintenanceMode?.isActive || false;


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
    setCountryAnchorEl(null);
  };

  const handleCountryClick = (event) => {
    setCountryAnchorEl(event.currentTarget);
  };

  const handleCountryClose = () => {
    setCountryAnchorEl(null);
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

  // Get current country data for display
  const currentCountryData = countriesToUse.find(c => c._id === currentCountry) || countriesToUse[0];

  const [sendLogout, { isSuccess }] = useSendLogoutMutation();

  useEffect(() => {
    if (isSuccess) {
      // Define routes that require authentication
      const protectedRoutes = [
        '/dash/posts/new',
        '/dash/posts/edit',
        '/profile',
        '/admin'
      ];
      
      const currentPath = window.location.pathname;
      
      // Check if current page requires authentication
      const isProtectedRoute = protectedRoutes.some(route => 
        currentPath.startsWith(route)
      );
      
      if (isProtectedRoute) {
        // Redirect to dashboard if on protected route
        navigate("/dash");
      }
    }
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

  // Admin refresh handler
  const handleRefreshAllData = async () => {
    try {
      setIsRefreshing(true);
      await forceRefreshAllDependencies(currentLanguage);
      console.log('✅ All data refreshed successfully from navbar');
    } catch (error) {
      console.error('❌ Failed to refresh data from navbar:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

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
        // Reset found/lost state to show all posts
        dispatch(setFoundOrLost({ foundOrlost: '' }));
        navigate('/dash/posts');
      },
      description: t('viewAllPosts')
    },
    ...(flOptionsData?.map(option => {
      // Use custom Arabic titles for Found and Lost items
      let displayTitle = option.label || option.code;
      if (currentLanguage === 'ar') {
        if (option.code === 'FOUND') {
          displayTitle = 'عثر عليها';
        } else if (option.code === 'LOST') {
          displayTitle = 'مفقودات';
        }
      }
      
      return {
        title: displayTitle,
        icon: option.code === 'FOUND' ? <Search sx={{ fontSize: 20, color: '#4CAF50' }} /> : <Search sx={{ fontSize: 20, color: '#757575' }} />,
        action: () => {
          // Update Redux state with the found/lost status
          dispatch(setFoundOrLost({ foundOrlost: option.code }));
          // Navigate with the correct found/lost ID filter
          navigate(`/dash/posts?fl=${option._id}`);
        },
        description: t(`view${option.code}Items`)
      };
    }) || []),
    {
      title: t('blog'),
      icon: <PostAdd sx={{ fontSize: 20, color: theme.palette.primary.main }} />,
      action: () => navigate('/blog'),
      description: t('blogSubtitle')
    },
    {
      title: t('helpCenter'),
      icon: <Build sx={{ fontSize: 20, color: theme.palette.primary.main }} />,
      action: () => navigate('/help'),
      description: t('helpCenterSubtitle')
    }
  ];

  // Add admin buttons if user is admin - use destructured auth state
  if (authLoggedIn && authUser?.role === 'admin') {
    navigationItems.push({
      title: 'Refresh All Data',
      icon: <Refresh sx={{ fontSize: 20, color: theme.palette.primary.main }} />,
      action: () => handleRefreshAllData(),
      description: 'Refresh categories, countries, and found/lost options'
    });
    
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
                if (authLoggedIn) {
                  navigate('/dash/posts/new');
                } else {
                  navigate('/login');
                }
              }}
              startIcon={authLoggedIn ? <PostAdd /> : <Login />}
            >
              {authLoggedIn ? t('createPost') : t('signin')}
            </CreatePostButton>

            {/* Admin-only refresh button */}
            {authLoggedIn && role === 'admin' && (
              <Tooltip title="Refresh all data (Categories, Countries, Found/Lost Options)" arrow>
                <Button
                  onClick={handleRefreshAllData}
                  disabled={isRefreshing}
                  variant="outlined"
                  size="small"
                  startIcon={<Refresh />}
                  sx={{
                    minWidth: 'auto',
                    px: 2,
                    color: theme.palette.mode === 'dark' ? '#fff' : theme.palette.text.primary,
                    borderColor: theme.palette.mode === 'dark' ? theme.palette.primary.main : theme.palette.divider,
                    backgroundColor: theme.palette.mode === 'dark' ? 'transparent' : theme.palette.background.paper,
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                    },
                    '&:disabled': {
                      opacity: 0.6,
                    }
                  }}
                >
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
              </Tooltip>
            )}
          </Box>
        )}

        {/* Right section: Actions */}
        <FlexBetween sx={{ 
          gap: { xs: '6px', sm: '8px' },
          direction: 'ltr !important'
        }}>
          {/* Country selector */}
          <CountrySelector onClick={handleCountryClick}>
            {isInitialized && currentCountryData ? (
              <>
                <img
                  loading="lazy"
                  width={isMobile ? "32" : "30"}
                  height={isMobile ? "20" : "20"}
                  src={`https://flagcdn.com/w20/${currentCountryData.code.toLowerCase()}.png`}
                  srcSet={`https://flagcdn.com/w40/${currentCountryData.code.toLowerCase()}.png 2x`}
                  alt=""
                />
                {!isMobile && (
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      fontSize: { xs: '0.85rem', sm: '0.9rem' },
                      display: 'block',
                      // Only apply RTL to text content, not layout
                      textAlign: currentLanguage === 'ar' ? 'right' : 'left'
                    }}
                  >
                    {currentCountryData.names?.[currentLanguage] || currentCountryData.names?.en || currentCountryData.code}
                  </Typography>
                )}
              </>
            ) : (
              <Box
                sx={{
                  width: isMobile ? 32 : 30,
                  height: isMobile ? 20 : 20,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid rgba(255,255,255,0.8)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' }
                    }
                  }}
                />
              </Box>
            )}
            {!isMobile && <KeyboardArrowDown sx={{ fontSize: '16px', ml: 0.5 }} />}
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

          {/* Maintenance Mode Indicator - Only for Admins */}
          {role === 'admin' && isMaintenanceActive && (
            <Tooltip 
              title="Maintenance mode is currently active. Non-admin users cannot access the site."
              arrow
            >
              <Chip
                icon={<Build sx={{ fontSize: '16px' }} />}
                label="⚠️ Maintenance Active"
                size="small"
                sx={{
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(237, 108, 2, 0.2)'
                    : 'rgba(255, 152, 0, 0.15)',
                  color: 'warning.main',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  border: '1px solid',
                  borderColor: 'warning.main',
                  animation: 'pulse 2s ease-in-out infinite',
                  '@keyframes pulse': {
                    '0%, 100%': {
                      opacity: 1,
                    },
                    '50%': {
                      opacity: 0.7,
                    },
                  },
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark'
                      ? 'rgba(237, 108, 2, 0.3)'
                      : 'rgba(255, 152, 0, 0.25)',
                  },
                  display: { xs: 'none', md: 'flex' },
                  mr: 1,
                }}
              />
            </Tooltip>
          )}

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
          {authLoggedIn && (
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

        {/* Country Dropdown Menu with Search */}
        <Menu
          anchorEl={countryAnchorEl}
          open={Boolean(countryAnchorEl)}
          onClose={handleCountryClose}
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
              minWidth: 320,
              maxWidth: 400,
              maxHeight: 400,
              overflow: 'hidden',
            }
          }}
          transformOrigin={{ horizontal: 'left', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        >
          <Box sx={{ p: 2 }}>
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
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    py: 1.5,
                    px: 2,
                  }}
                  {...props}
                >
                  {option.flag ? (
                    <span style={{ marginRight: 12, fontSize: '20px', display: 'flex', alignItems: 'center' }}>
                      {option.flag}
                    </span>
                  ) : (
                    <img
                      loading="lazy"
                      width="20"
                      height="15"
                      src={`https://flagcdn.com/w20/${option.code.toLowerCase()}.png`}
                      srcSet={`https://flagcdn.com/w40/${option.code.toLowerCase()}.png 2x`}
                      alt=""
                      style={{ marginRight: 12, borderRadius: '2px' }}
                    />
                  )}
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.9rem', lineHeight: 1.2 }}>
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
                    })()}
                  </Typography>
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder={t('searchCountries') || 'Search countries...'}
                  variant="outlined"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      fontSize: '0.9rem',
                      padding: '8px 12px',
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? alpha(theme.palette.common.white, 0.05)
                        : alpha(theme.palette.common.black, 0.03),
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      '&:hover': {
                        borderColor: alpha(theme.palette.primary.main, 0.3),
                      },
                      '&.Mui-focused': {
                        borderColor: theme.palette.primary.main,
                        boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
                      },
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '0.9rem',
                    },
                  }}
                  inputProps={{
                    ...params.inputProps,
                    autoComplete: "new-password",
                  }}
                />
              )}
              ListboxProps={{
                sx: {
                  maxHeight: 250,
                  py: 1,
                  px: 1,
                  '& .MuiAutocomplete-option': {
                    padding: 0,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    },
                    '&.Mui-focused': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.15),
                    }
                  }
                }
              }}
            />
          </Box>
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
              navigate('/dash/profile');
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
              <Person sx={{ fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText 
              primary={t('myProfile')}
              primaryTypographyProps={{
                fontWeight: 600,
                fontSize: '0.95rem',
                textAlign: currentLanguage === 'ar' ? 'right' : 'left'
              }}
            />
          </MenuItem>
          <MenuItem 
            onClick={() => {
              handleProfileClose();
              navigate('/dash/myposts');
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
              <PostAdd sx={{ fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText 
              primary={t('myPosts')}
              primaryTypographyProps={{
                fontWeight: 600,
                fontSize: '0.95rem',
                textAlign: currentLanguage === 'ar' ? 'right' : 'left'
              }}
            />
          </MenuItem>
          <Divider />
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
            {/* Maintenance Mode Indicator - Mobile - Only for Admins */}
            {role === 'admin' && isMaintenanceActive && (
              <>
                <Box
                  sx={{
                    p: 2,
                    mb: 2,
                    borderRadius: 2,
                    backgroundColor: theme.palette.mode === 'dark'
                      ? 'rgba(237, 108, 2, 0.2)'
                      : 'rgba(255, 152, 0, 0.15)',
                    border: '2px solid',
                    borderColor: 'warning.main',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                  }}
                >
                  <Build sx={{ color: 'warning.main', fontSize: 24 }} />
                  <Box flex={1}>
                    <Typography variant="body2" fontWeight={700} color="warning.main">
                      ⚠️ Maintenance Mode Active
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Site is inaccessible to non-admin users
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ mb: 1 }} />
              </>
            )}
            
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
            {authLoggedIn ? (
              <>
                <MenuItem
                  onClick={() => {
                    handleMobileMenuClose();
                    navigate('/dash/profile');
                  }}
                  sx={{
                    borderRadius: 1,
                    py: 1.5,
                    mb: 0.5,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    }
                  }}
                >
                  <ListItemIcon>
                    <Person sx={{ fontSize: 22 }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={t('myProfile')}
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
              </>
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
