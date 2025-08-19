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
} from "@mui/material";
import {
  DarkModeOutlined,
  LightModeOutlined,
  Menu as MenuIcon,
  LogoutOutlined,
  Language,
  KeyboardArrowDown,
  AddCircleOutline,
  Login,
  PersonAdd,
  Home,
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
import NavLinks from "./NavLinks";
import CountryModal from "./CountryModal";
import { useTranslation } from "../utils/translations";

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  justifyContent: "space-between",
  background: theme.palette.mode === 'dark'
    ? `rgba(23, 25, 35, 0.8)`
    : `rgba(255, 255, 255, 0.8)`,
  backdropFilter: 'blur(12px)',
  padding: "1rem 2rem",
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow: theme.palette.mode === 'dark' 
    ? '0 4px 30px rgba(0, 0, 0, 0.1)'
    : '0 4px 30px rgba(0, 0, 0, 0.05)',
  transition: 'all 0.3s ease',
  [theme.breakpoints.down('sm')]: {
    padding: "0.75rem 1rem",
  }
}));

const LogoButton = styled(Button)(({ theme }) => ({
  color: theme.palette.mode === 'dark' ? '#fff' : '#000',
  fontSize: '1.3rem',
  fontWeight: 700,
  padding: '10px 20px',
  borderRadius: '12px',
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
  '&:before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: theme.palette.primary.main,
    opacity: 0,
    transition: 'all 0.3s ease',
    zIndex: -1,
  },
  '&:hover': {
    transform: 'translateY(-2px)',
    '&:before': {
      opacity: 0.1,
    }
  },
}));

const ActionButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.mode === 'dark' ? '#fff' : '#000',
  transition: 'all 0.3s ease',
  margin: '0 6px',
  padding: '12px',
  borderRadius: '12px',
  background: theme.palette.mode === 'dark' 
    ? alpha(theme.palette.common.white, 0.05)
    : alpha(theme.palette.common.black, 0.05),
  '&:hover': {
    background: theme.palette.mode === 'dark' 
      ? alpha(theme.palette.common.white, 0.1)
      : alpha(theme.palette.common.black, 0.1),
    transform: 'translateY(-2px)',
  },
}));

const CountrySelector = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: '8px 16px',
  borderRadius: '12px',
  cursor: 'pointer',
  background: theme.palette.mode === 'dark' 
    ? alpha(theme.palette.common.white, 0.05)
    : alpha(theme.palette.common.black, 0.05),
  transition: 'all 0.3s ease',
  '&:hover': {
    background: theme.palette.mode === 'dark' 
      ? alpha(theme.palette.common.white, 0.1)
      : alpha(theme.palette.common.black, 0.1),
    transform: 'translateY(-2px)',
  },
  '& img': {
    borderRadius: '6px',
    marginRight: '8px',
    transition: 'all 0.3s ease',
  },
}));

const LanguageSelector = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: '8px 16px',
  borderRadius: '12px',
  cursor: 'pointer',
  background: theme.palette.mode === 'dark' 
    ? alpha(theme.palette.common.white, 0.05)
    : alpha(theme.palette.common.black, 0.05),
  transition: 'all 0.3s ease',
  '&:hover': {
    background: theme.palette.mode === 'dark' 
      ? alpha(theme.palette.common.white, 0.1)
      : alpha(theme.palette.common.black, 0.1),
    transform: 'translateY(-2px)',
  },
  '& .MuiSvgIcon-root': {
    marginRight: '8px',
    fontSize: '20px',
  },
}));

const Navbar = () => {
  const { country, username } = useAuth();
  const user = { username }; // Create user object for consistency
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width:600px)");
  const { t, currentLanguage } = useTranslation();

  const currentCountry = useSelector(selectCurrentCountry);
  const openModal = useSelector(selectOpenModal);

  const [countryId, setCountryId] = useState(null); // Start with null to avoid flash
  const [languageAnchorEl, setLanguageAnchorEl] = useState(null);
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState(null);
  const [isUserSelectingCountry, setIsUserSelectingCountry] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check if user is authenticated
  const isAuthenticated = Boolean(user?.username);

  // Initialize country on component mount
  useEffect(() => {
    if (!isInitialized) {
      // Priority: 1. User's country from JWT, 2. Redux state, 3. Fallback
      const initialCountry = country || currentCountry || '507f1f77bcf86cd799439011';
      setCountryId(initialCountry);
      setIsInitialized(true);
    }
  }, [country, currentCountry, isInitialized]);

  // Custom function to handle country selection from user
  const handleCountrySelection = (newCountryId) => {
    setIsUserSelectingCountry(true);
    setCountryId(newCountryId);
    
    // Update Redux immediately
    dispatch(setCurrentCountry({ currentCountry: newCountryId }));
    
    // Reset the flag after a short delay to allow for future syncs
    setTimeout(() => {
      setIsUserSelectingCountry(false);
    }, 100);
  };

  // Sync countryId with currentCountry - only update if there's a meaningful change
  useEffect(() => {
    // Only sync after initialization
    if (!isInitialized) {
      return;
    }

    // If user is actively selecting a country, don't override their selection
    if (isUserSelectingCountry) {
      return;
    }

    // If countryId is set and different from currentCountry, update Redux
    if (countryId && countryId !== currentCountry) {
      dispatch(
        setCurrentCountry({
          currentCountry: countryId,
        })
      );
    }
    // If currentCountry is set and different from countryId, update local state
    else if (currentCountry && currentCountry !== countryId) {
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
    skip: !isInitialized || !countryId, // Skip query until we have a country ID
  });

  const [sendLogout, { isSuccess }] =
    useSendLogoutMutation();

  useEffect(() => {
    if (isSuccess) navigate("/");
  }, [isSuccess, navigate]);

  const onGoHomeClicked = () => navigate("/dash");
  const onWelcomePageClicked = () => navigate("/");

  // Language dropdown handlers - same approach as Login/SignUp pages
  const handleLanguageClick = (event) => {
    setLanguageAnchorEl(event.currentTarget);
  };

  const handleLanguageClose = () => {
    setLanguageAnchorEl(null);
  };

  const handleMobileMenuClick = (event) => {
    setMobileMenuAnchorEl(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchorEl(null);
  };

  const handleLanguageChange = (newLanguage) => {
    // Save to localStorage and reload page to fetch fresh translations
    localStorage.setItem('currentLanguage', newLanguage);
    localStorage.setItem('language', newLanguage);
    localStorage.setItem('app_language', newLanguage);
    
    // Force a re-render of the app without full page refresh
    window.dispatchEvent(new Event('languageChange'));
    
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

  // Use fallback data if API calls fail
  const fallbackCountries = [
    { _id: '507f1f77bcf86cd799439011', code: 'MA', label: 'Morocco', labels: { en: 'MA', ar: 'MA', fr: 'MA' }, names: { en: 'Morocco', ar: 'المغرب', fr: 'Maroc' }, flag: '🇲🇦' },
  ];

  // Use fallback data if API fails
  const countriesToUse = countries || fallbackCountries;
  
  // Only show country data after initialization to avoid flash
  const currentCountryDataToUse = isInitialized && countryId 
    ? (currentCountryData || fallbackCountries.find(c => c._id === countryId) || fallbackCountries[0])
    : null;
  
  // Debug logging (commented out for production)
  // console.log('Navbar: countryId:', countryId, 'currentCountry:', currentCountry, 'isInitialized:', isInitialized, 'isUserSelecting:', isUserSelectingCountry, 'currentCountryData:', currentCountryDataToUse);

  return (
    <AppBar
      sx={{
        boxShadow: 'none',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <StyledToolbar>
        {/* Left section: Logo */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: { xs: '0.5rem', sm: '1rem' }
        }}>
          <LogoButton 
            onClick={onGoHomeClicked}
            sx={{
              fontSize: { xs: '1rem', sm: '1.2rem' },
              padding: { xs: '6px 12px', sm: '8px 16px' },
            }}
          >
            {t("brandName")}
          </LogoButton>
        </Box>

        {/* Center section: Nav links - desktop only */}
        {!isMobile && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            mx: 2
          }}>
            <NavLinks />
          </Box>
        )}

        {/* Right section: Actions */}
        <FlexBetween sx={{ gap: { xs: '6px', sm: '12px' } }}>
          {/* Country selector - always visible */}
          <CountrySelector 
             onClick={() => dispatch(setOpenModal())}
             sx={{
               padding: { xs: '6px 8px', sm: '8px 16px' },
             }}
           >
             {isInitialized && currentCountryDataToUse ? (
               <>
                 <img
                   loading="lazy"
                   width="30"
                   height="20"
                   src={`https://flagcdn.com/w20/${currentCountryDataToUse.code.toLowerCase()}.png`}
                   srcSet={`https://flagcdn.com/w40/${currentCountryDataToUse.code.toLowerCase()}.png 2x`}
                   alt=""
                 />
                 <Typography
                   variant="body2"
                   sx={{
                     fontWeight: 500,
                     fontSize: { xs: '0.8rem', sm: '0.9rem' },
                     display: 'block'
                   }}
                 >
                   {currentCountryDataToUse.names?.[currentLanguage] || currentCountryDataToUse.names?.en || currentCountryDataToUse.labels?.[currentLanguage] || currentCountryDataToUse.labels?.en || currentCountryDataToUse.code}
                 </Typography>
               </>
             ) : (
               <>
                 <Box
                   sx={{
                     width: 30,
                     height: 20,
                     backgroundColor: 'rgba(255,255,255,0.1)',
                     borderRadius: '4px',
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center'
                   }}
                 >
                   <Box
                     sx={{
                       width: 16,
                       height: 16,
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
                 <Typography
                   variant="body2"
                   sx={{
                     fontWeight: 500,
                     fontSize: { xs: '0.8rem', sm: '0.9rem' },
                     display: 'block',
                     color: 'rgba(255,255,255,0.6)'
                   }}
                 >
                   Loading...
                 </Typography>
               </>
             )}
             <KeyboardArrowDown sx={{ fontSize: '16px', ml: 0.5 }} />
           </CountrySelector>

          {/* Language selector - always visible */}
          <LanguageSelector 
            onClick={handleLanguageClick}
            sx={{
              padding: { xs: '6px 8px', sm: '8px 16px' },
            }}
          >
            <Language />
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                fontSize: { xs: '0.8rem', sm: '0.9rem' },
                display: 'block'
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

          {/* Mobile menu button */}
          <ActionButton
            onClick={handleMobileMenuClick}
            sx={{ 
              display: { xs: 'flex', sm: 'none' },
              padding: { xs: '6px 8px', sm: '8px 16px' },
            }}
          >
            <MenuIcon sx={{ fontSize: "22px" }} />
          </ActionButton>

          {/* Mobile menu */}
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
                minWidth: 200,
              }
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ p: 1 }}>
              {/* Navigation Links */}
              <NavLinks onLinkClick={handleMobileMenuClose} />
              
              {/* Divider */}
              <Box sx={{ 
                height: 1, 
                bgcolor: 'divider', 
                my: 1,
                opacity: 0.3 
              }} />
              
              {/* Create New Post Link - only for authenticated users */}
              {isAuthenticated && (
                <MenuItem
                  onClick={() => {
                    handleMobileMenuClose();
                    navigate('/dash/posts/new');
                  }}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    }
                  }}
                >
                  <ListItemIcon>
                    <AddCircleOutline sx={{ fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText primary={t('createPost')} />
                </MenuItem>
              )}
              
              {/* Authentication Section */}
              {isAuthenticated ? (
                // User is logged in - show logout
                <MenuItem
                  onClick={() => {
                    handleMobileMenuClose();
                    sendLogout();
                  }}
                  sx={{
                    borderRadius: 1,
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
                  />
                </MenuItem>
              ) : (
                // User is not logged in - show login/signup
                <>
                  <MenuItem
                    onClick={() => {
                      handleMobileMenuClose();
                      navigate('/login');
                    }}
                    sx={{
                      borderRadius: 1,
                      mb: 0.5,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      }
                    }}
                  >
                    <ListItemIcon>
                      <Login sx={{ fontSize: 20 }} />
                    </ListItemIcon>
                    <ListItemText primary={t('signin')} />
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      handleMobileMenuClose();
                      navigate('/signup');
                    }}
                    sx={{
                      borderRadius: 1,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                      }
                    }}
                  >
                    <ListItemIcon>
                      <PersonAdd sx={{ fontSize: 20 }} />
                    </ListItemIcon>
                    <ListItemText primary={t('signup')} />
                  </MenuItem>
                </>
              )}
            </Box>
          </Menu>

          {/* Logout button - desktop only, only show if authenticated */}
          {isAuthenticated && (
            <ActionButton 
              onClick={sendLogout}
              sx={{
                display: { xs: 'none', sm: 'flex' }
              }}
            >
              <LogoutOutlined sx={{ fontSize: "22px" }} />
            </ActionButton>
          )}
        </FlexBetween>

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
