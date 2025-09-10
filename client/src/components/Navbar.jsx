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
} from "@mui/icons-material";
import FlexBetween from "./FlexBetween";
import {
  selectCurrentCountry,
  selectOpenModal,
  setMode,
  setOpenModal,
} from "../app/state";
import { useDispatch, useSelector } from "react-redux";
import { useSendLogoutMutation } from "../features/auth/authApiSlice";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useGetCountriesQuery } from "../features/countries/countriesApiSlice";
import { setCurrentCountry } from "../app/state";
import useAuth from "../hooks/useAuth";
import CountryModal from "./CountryModal";
import { useTranslation } from "../utils/translations";
import { useGetflOptionsQuery } from "../features/dependencies/dependenciesApiSlice";

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
  [theme.breakpoints.down('sm')]: {
    padding: "1rem 1.5rem",
    minHeight: "72px",
  }
}));

const LogoButton = styled(Button)(({ theme }) => ({
  padding: '6px 10px',
  borderRadius: '12px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  background: 'transparent',
  minWidth: 'auto',
  boxShadow: 'none',
  marginLeft: theme.direction === 'rtl' ? '0' : '-4px',
  marginRight: theme.direction === 'rtl' ? '-4px' : '0',
  '&:hover': {
    transform: 'translateY(-2px)',
    background: 'transparent',
    boxShadow: 'none',
    '& img': {
      filter: theme.palette.mode === 'dark' 
        ? 'drop-shadow(0 0 16px rgba(59, 130, 246, 0.8))'
        : 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.5))',
      transform: 'scale(1.05)',
      '&::before': {
        opacity: 0.4,
        animation: 'pulseGlow 1.5s ease-in-out infinite',
      },
      '&::after': {
        animation: 'lightSweep 2s ease-in-out infinite',
      }
    }
  },
  '& img': {
    height: 'auto',
    maxHeight: theme.palette.mode === 'dark' ? '40px' : '24px', // Significantly bigger in dark mode
    width: 'auto',
    objectFit: 'contain',
    transition: 'all 0.3s ease',
    position: 'relative',
    zIndex: 2,
    // Theme-aware glow effect
    filter: theme.palette.mode === 'dark' 
      ? 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.6))'
      : 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.3))',
    // Add white background in dark mode for better contrast
    ...(theme.palette.mode === 'dark' && {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '8px',
      padding: '12px', // Extra padding for much larger logo
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
    }),
    // Animated lighting effect
    '&::before': {
      content: '""',
      position: 'absolute',
      top: '-3px',
      left: '-3px',
      right: '-3px',
      bottom: '-3px',
      background: theme.palette.mode === 'dark'
        ? 'linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), rgba(59, 130, 246, 0.2), transparent)'
        : 'linear-gradient(45deg, transparent, rgba(59, 130, 246, 0.2), transparent)',
      borderRadius: '10px',
      opacity: 0,
      transition: 'opacity 0.4s ease',
      zIndex: -1,
      animation: 'pulseGlow 4s ease-in-out infinite',
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      top: '50%',
      left: '-100%',
      width: '100%',
      height: '3px',
      background: theme.palette.mode === 'dark'
        ? 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.9), rgba(255, 255, 255, 0.7), rgba(59, 130, 246, 0.9), transparent)'
        : 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.8), rgba(255, 255, 255, 0.6), rgba(59, 130, 246, 0.8), transparent)',
      transform: 'translateY(-50%)',
      animation: 'lightSweep 4s ease-in-out infinite',
      zIndex: 1,
      borderRadius: '2px',
    },
    '@keyframes lightSweep': {
      '0%': { left: '-100%', opacity: 0 },
      '10%': { opacity: 1 },
      '50%': { left: '100%', opacity: 1 },
      '90%': { opacity: 0 },
      '100%': { left: '100%', opacity: 0 }
    },
    '@keyframes pulseGlow': {
      '0%, 100%': { opacity: 0, transform: 'scale(1)' },
      '50%': { opacity: 0.3, transform: 'scale(1.05)' }
    }
  },
  [theme.breakpoints.down('sm')]: {
    padding: '4px 6px',
    marginLeft: theme.direction === 'rtl' ? '0' : '-6px',
    marginRight: theme.direction === 'rtl' ? '-6px' : '0',
    '& img': {
      maxHeight: theme.palette.mode === 'dark' ? '36px' : '18px', // Even bigger in dark mode mobile
      ...(theme.palette.mode === 'dark' && {
        padding: '8px', // Mobile-specific padding for dark mode
      }),
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
    '& img': {
      marginRight: '6px',
    }
  }
}));

const LanguageSelector = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
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
    '& .MuiSvgIcon-root': {
      marginRight: '6px',
      fontSize: '18px',
    }
  }
}));

const CreatePostButton = styled(Button)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  color: '#fff',
  fontSize: '0.9rem',
  fontWeight: 600,
  padding: '8px 16px',
  borderRadius: '10px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: `0 4px 15px ${alpha(theme.palette.primary.main, 0.3)}`,
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.4)}`,
    background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
  },
}));

const Navbar = () => {
  const { country, username, role } = useAuth();
  const user = { username };
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width:600px)");
  const isTablet = useMediaQuery("(max-width:900px)");
  const { t, currentLanguage } = useTranslation();

  const currentCountry = useSelector(selectCurrentCountry);
  const openModal = useSelector(selectOpenModal);
  const mode = useSelector((state) => state.global.mode);

  const [countryId, setCountryId] = useState(null);
  const [languageAnchorEl, setLanguageAnchorEl] = useState(null);
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState(null);
  const [navigationAnchorEl, setNavigationAnchorEl] = useState(null);
  const [isUserSelectingCountry, setIsUserSelectingCountry] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const isAuthenticated = Boolean(user?.username);

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
      const initialCountry = country || currentCountry || '68a4b54ab46524c54c553ca9';
      setCountryId(initialCountry);
      setIsInitialized(true);
    }
  }, [country, currentCountry, isInitialized]);

  const handleCountrySelection = (newCountryId) => {
    setIsUserSelectingCountry(true);
    setCountryId(newCountryId);
    dispatch(setCurrentCountry({ currentCountry: newCountryId }));
    setTimeout(() => {
      setIsUserSelectingCountry(false);
    }, 100);
  };

  useEffect(() => {
    if (!isInitialized) return;
    if (isUserSelectingCountry) return;

    if (countryId && countryId !== currentCountry) {
      dispatch(setCurrentCountry({ currentCountry: countryId }));
    } else if (currentCountry && currentCountry !== countryId) {
      setCountryId(currentCountry);
    }
  }, [countryId, currentCountry, dispatch, isUserSelectingCountry, isInitialized]);

  const { countries } = useGetCountriesQuery({
    language: currentLanguage
  }, {
    selectFromResult: ({ data }) => ({
      countries: data?.ids.map((id) => data?.entities[id]),
    }),
  });

  const { currentCountryData } = useGetCountriesQuery({
    language: currentLanguage
  }, {
    selectFromResult: ({ data }) => ({
      currentCountryData: data?.entities[countryId || currentCountry],
    }),
    skip: !isInitialized || !countryId,
  });

  const [sendLogout, { isSuccess }] = useSendLogoutMutation();

  useEffect(() => {
    if (isSuccess) navigate("/");
  }, [isSuccess, navigate]);

  const onGoHomeClicked = () => navigate("/dash");

  // Menu handlers
  const handleLanguageClick = (event) => setLanguageAnchorEl(event.currentTarget);
  const handleLanguageClose = () => setLanguageAnchorEl(null);
  const handleMobileMenuClick = (event) => setMobileMenuAnchorEl(event.currentTarget);
  const handleMobileMenuClose = () => setMobileMenuAnchorEl(null);
  const handleNavigationClick = (event) => setNavigationAnchorEl(event.currentTarget);
  const handleNavigationClose = () => setNavigationAnchorEl(null);

  const handleLanguageChange = (newLanguage) => {
    localStorage.setItem('currentLanguage', newLanguage);
    localStorage.setItem('language', newLanguage);
    localStorage.setItem('app_language', newLanguage);
    window.dispatchEvent(new Event('languageChange'));
    handleLanguageClose();
    
    // Force page refresh to ensure all components update properly
    setTimeout(() => {
      window.location.reload();
    }, 100);
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

  const fallbackCountries = [
            { _id: '68a4b54ab46524c54c553ca9', code: 'MA', label: 'Morocco', labels: { en: 'MA', ar: 'MA', fr: 'MA' }, names: { en: 'Morocco', ar: 'المغرب', fr: 'Maroc' }, flag: '🇲🇦' },
  ];

  const countriesToUse = countries || fallbackCountries;
  const currentCountryDataToUse = isInitialized && countryId 
    ? (currentCountryData || fallbackCountries.find(c => c._id === countryId) || fallbackCountries[0])
    : null;

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
        // Remove direction from AppBar to prevent layout reversal
      }}
    >
      <StyledToolbar>
        {/* Left section: Logo */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: { xs: '0.75rem', sm: '1rem' }
        }}>
          <LogoButton 
            onClick={onGoHomeClicked}
            sx={{
              padding: { xs: '8px 14px', sm: '8px 16px' },
            }}
          >
            <img
              src="/maflogo.png"
              alt={t("brandName")}
              loading="lazy"
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
            gap: 1
          }}>
            {/* Navigation Dropdown */}
            <NavigationButton
              onClick={handleNavigationClick}
              endIcon={<KeyboardArrowDown />}
              sx={{ minWidth: 140 }}
            >
              {t('explore')}
            </NavigationButton>

            {/* Create Post Button - only for authenticated users */}
            {isAuthenticated && (
              <CreatePostButton
                onClick={() => navigate('/dash/posts/new')}
                startIcon={<PostAdd />}
              >
                {t('createPost')}
              </CreatePostButton>
            )}
          </Box>
        )}

        {/* Right section: Actions */}
        <FlexBetween sx={{ gap: { xs: '6px', sm: '8px' } }}>
          {/* Country selector */}
          <CountrySelector 
            onClick={() => dispatch(setOpenModal())}
            sx={{
              padding: { xs: '8px 10px', sm: '6px 12px' },
            }}
          >
            {isInitialized && currentCountryDataToUse ? (
              <>
                <img
                  loading="lazy"
                  width={isMobile ? "32" : "30"}
                  height={isMobile ? "20" : "20"}
                  src={`https://flagcdn.com/w20/${currentCountryDataToUse.code.toLowerCase()}.png`}
                  srcSet={`https://flagcdn.com/w40/${currentCountryDataToUse.code.toLowerCase()}.png 2x`}
                  alt=""
                />
                {!isMobile && (
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      fontSize: { xs: '0.85rem', sm: '0.9rem' },
                      display: 'block',
                      direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                      textAlign: currentLanguage === 'ar' ? 'right' : 'left'
                    }}
                  >
                    {currentCountryDataToUse.names?.[currentLanguage] || currentCountryDataToUse.names?.en || currentCountryDataToUse.code}
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
                display: 'block',
                direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
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

          {/* Logout button for authenticated users - desktop only */}
          {isAuthenticated && (
            <ActionButton
              onClick={() => sendLogout()}
              sx={{
                display: { xs: 'none', sm: 'flex' },
                background: alpha(theme.palette.error.main, 0.1),
                '&:hover': {
                  background: alpha(theme.palette.error.main, 0.2),
                }
              }}
            >
              <LogoutOutlined sx={{ fontSize: "20px", color: 'error.main' }} />
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
                  direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                  textAlign: currentLanguage === 'ar' ? 'right' : 'left'
                }}
                secondaryTypographyProps={{
                  fontSize: '0.8rem',
                  color: 'text.secondary',
                  direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
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
                direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
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
                direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
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
                direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
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
                    direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                    textAlign: currentLanguage === 'ar' ? 'right' : 'left'
                  }}
                  secondaryTypographyProps={{
                    fontSize: '0.85rem',
                    color: 'text.secondary',
                    direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
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
                  direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
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
                    direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
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
                      direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
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
                      direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                      textAlign: currentLanguage === 'ar' ? 'right' : 'left'
                    }}
                  />
                </MenuItem>
              </>
            )}
          </Box>
        </Menu>

        {/* Country Modal */}
        <CountryModal
          setCountryId={handleCountrySelection}
          countries={countriesToUse}
          openModal={openModal}
        />
      </StyledToolbar>
    </AppBar>
  );
};

export default Navbar;
