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
  Home,
  SwapHorizOutlined,
  Language,
  KeyboardArrowDown,
} from "@mui/icons-material";
import FlexBetween from "./FlexBetween";
import {
  selectActiveLink,
  selectCurrentCountry,
  selectDirection,
  selectOpenModal,
  setIsSidebarOpen,
  setMode,
  setOpenModal,
} from "../app/state";
import { useDispatch, useSelector } from "react-redux";
import { useSendLogoutMutation } from "../features/auth/authApiSlice";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { setActiveLink } from "../app/state/index";
import { useGetCountriesQuery } from "../features/countries/countriesApiSlice";
import { setCurrentCountry } from "../app/state";
import useAuth from "../hooks/useAuth";
import NavLinks from "./NavLinks";
import CountryAutoselect from "./CountryAutoselect";
import CountryModal from "./CountryModal";
import { LoadingState } from "./LoadingStates";
import RenderIcon from "./RenderIcon";
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
  const { country } = useAuth();
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width:600px)");
  const { t, currentLanguage } = useTranslation();

  const activeLink = useSelector(selectActiveLink);
  const currentCountry = useSelector(selectCurrentCountry);
  const openModal = useSelector(selectOpenModal);

  const [countryId, setCountryId] = useState(country);
  const [languageAnchorEl, setLanguageAnchorEl] = useState(null);
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState(null);

  useEffect(() => {
    if (countryId && countryId !== currentCountry) {
      dispatch(
        setCurrentCountry({
          currentCountry: countryId,
        })
      );
    }
  }, [countryId, currentCountry, dispatch]);

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
      currentCountryData: data?.entities[countryId],
    }),
  });

  const onCountryIdChanged = (e) => setCountryId(e.target.value);

  const [sendLogout, { isLoading, isSuccess, isError, error }] =
    useSendLogoutMutation();

  useEffect(() => {
    if (isSuccess) navigate("/");
  }, [isSuccess, navigate]);

  const onGoHomeClicked = () => navigate("/dash");

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
    console.log('Navbar: Changing language to:', newLanguage);
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
    { _id: '507f1f77bcf86cd799439011', code: 'US', label: 'United States', labels: { en: 'United States', ar: 'الولايات المتحدة', fr: 'États-Unis' }, flag: '🇺🇸' },
    { _id: '507f1f77bcf86cd799439012', code: 'GB', label: 'United Kingdom', labels: { en: 'United Kingdom', ar: 'المملكة المتحدة', fr: 'Royaume-Uni' }, flag: '🇬🇧' },
    { _id: '507f1f77bcf86cd799439013', code: 'FR', label: 'France', labels: { en: 'France', ar: 'فرنسا', fr: 'France' }, flag: '🇫🇷' },
    { _id: '507f1f77bcf86cd799439014', code: 'DE', label: 'Germany', labels: { en: 'Germany', ar: 'ألمانيا', fr: 'Allemagne' }, flag: '🇩🇪' },
    { _id: '507f1f77bcf86cd799439015', code: 'CA', label: 'Canada', labels: { en: 'Canada', ar: 'كندا', fr: 'Canada' }, flag: '🇨🇦' },
  ];

  // Use fallback data if API fails
  const countriesToUse = countries || fallbackCountries;
  const currentCountryDataToUse = currentCountryData || fallbackCountries.find(c => c._id === countryId) || fallbackCountries[0];

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
                             {currentCountryDataToUse.labels?.[currentLanguage] || currentCountryDataToUse.labels?.en || currentCountryDataToUse.code}
            </Typography>
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

          {/* Theme toggle - desktop only */}
          <ActionButton 
            onClick={() => dispatch(setMode())}
            sx={{
              display: { xs: 'none', sm: 'flex' }
            }}
          >
            {theme.palette.mode === "dark" ? (
              <LightModeOutlined sx={{ fontSize: "22px" }} />
            ) : (
              <DarkModeOutlined sx={{ fontSize: "22px" }} />
            )}
          </ActionButton>

          {/* Mobile menu button */}
          <ActionButton
            onClick={handleMobileMenuClick}
            sx={{ 
              display: { xs: 'flex', sm: 'none' }
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
              <NavLinks onLinkClick={handleMobileMenuClose} />
            </Box>
          </Menu>

          {/* Logout button - desktop only */}
          <ActionButton 
            onClick={sendLogout}
            sx={{
              display: { xs: 'none', sm: 'flex' }
            }}
          >
            <LogoutOutlined sx={{ fontSize: "22px" }} />
          </ActionButton>
        </FlexBetween>

        {/* Country Modal */}
        <CountryModal
          setCountryId={setCountryId}
          countries={countriesToUse}
          openModal={openModal}
        />
      </StyledToolbar>
    </AppBar>
  );
};

export default Navbar;
