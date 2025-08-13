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
  background: theme.palette.mode === 'dark'
    ? alpha(theme.palette.primary.main, 0.1)
    : alpha(theme.palette.primary.main, 0.05),
  color: theme.palette.primary.main,
  fontWeight: 600,
  borderRadius: '12px',
  padding: '8px 16px',
  textTransform: 'none',
  transition: 'all 0.3s ease',
  '&:hover': {
    background: theme.palette.mode === 'dark'
      ? alpha(theme.palette.primary.main, 0.2)
      : alpha(theme.palette.primary.main, 0.1),
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

// Fallback countries data
const fallbackCountries = [
  { _id: 'fallback-1', code: 'US', label: 'United States', labels: { en: 'United States', ar: 'الولايات المتحدة', fr: 'États-Unis' }, flag: '🇺🇸' },
  { _id: 'fallback-2', code: 'GB', label: 'United Kingdom', labels: { en: 'United Kingdom', ar: 'المملكة المتحدة', fr: 'Royaume-Uni' }, flag: '🇬🇧' },
  { _id: 'fallback-3', code: 'FR', label: 'France', labels: { en: 'France', ar: 'فرنسا', fr: 'France' }, flag: '🇫🇷' },
  { _id: 'fallback-4', code: 'DE', label: 'Germany', labels: { en: 'Germany', ar: 'ألمانيا', fr: 'Allemagne' }, flag: '🇩🇪' },
  { _id: 'fallback-5', code: 'CA', label: 'Canada', labels: { en: 'Canada', ar: 'كندا', fr: 'Canada' }, flag: '🇨🇦' },
];

const SimpleNavbar = () => {
  const { country } = useAuth();
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width:600px)");
  const { t, currentLanguage } = useTranslation();

  const activeLink = useSelector(selectActiveLink);
  const currentCountry = useSelector(selectCurrentCountry);
  const openModal = useSelector(selectOpenModal);

  const [countryId, setCountryId] = useState(country || 'fallback-1');
  const [languageAnchorEl, setLanguageAnchorEl] = useState(null);
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState(null);

  useEffect(() => {
    dispatch(
      setCurrentCountry({
        currentCountry: countryId,
      })
    );
  }, [currentCountry, countryId]);

  // Use fallback countries instead of API call
  const countries = fallbackCountries;
  const currentCountryData = fallbackCountries.find(c => c._id === countryId) || fallbackCountries[0];

  const onCountryIdChanged = (e) => setCountryId(e.target.value);

  const [sendLogout, { isLoading, isSuccess, isError, error }] =
    useSendLogoutMutation();

  useEffect(() => {
    if (isSuccess) navigate("/");
  }, [isSuccess, navigate]);

  const onGoHomeClicked = () => navigate("/dash");

  // Language dropdown handlers
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
    localStorage.setItem('currentLanguage', newLanguage);
    localStorage.setItem('language', newLanguage);
    localStorage.setItem('app_language', newLanguage);
    
    window.dispatchEvent(new Event('languageChange'));
    
    handleLanguageClose();
  };

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
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: { xs: '0.5rem', sm: '1rem' }
        }}>
          {/* Country Selector */}
          <CountrySelector onClick={() => dispatch(setOpenModal())}>
            <img
              loading="lazy"
              width="30"
              height="20"
              src={`https://flagcdn.com/w20/${currentCountryData.code.toLowerCase()}.png`}
              srcSet={`https://flagcdn.com/w40/${currentCountryData.code.toLowerCase()}.png 2x`}
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
              {currentCountryData.labels?.[currentLanguage] || currentCountryData.labels?.en || currentCountryData.code}
            </Typography>
            <KeyboardArrowDown sx={{ fontSize: 20 }} />
          </CountrySelector>

          {/* Language Selector */}
          <LanguageSelector onClick={handleLanguageClick}>
            <Language sx={{ fontSize: 20 }} />
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                fontSize: { xs: '0.8rem', sm: '0.9rem' },
                display: { xs: 'none', sm: 'block' }
              }}
            >
              {getLanguageDisplayName(currentLanguage)}
            </Typography>
            <KeyboardArrowDown sx={{ fontSize: 20 }} />
          </LanguageSelector>

          {/* Theme Toggle */}
          <IconButton
            onClick={() => dispatch(setMode())}
            sx={{
              background: theme.palette.mode === 'dark' 
                ? alpha(theme.palette.common.white, 0.05)
                : alpha(theme.palette.common.black, 0.05),
              borderRadius: '12px',
              padding: '8px',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: theme.palette.mode === 'dark' 
                  ? alpha(theme.palette.common.white, 0.1)
                  : alpha(theme.palette.common.black, 0.1),
                transform: 'translateY(-2px)',
              },
            }}
          >
            {theme.palette.mode === "dark" ? (
              <LightModeOutlined sx={{ fontSize: 20 }} />
            ) : (
              <DarkModeOutlined sx={{ fontSize: 20 }} />
            )}
          </IconButton>

          {/* Mobile Menu Button */}
          {isMobile && (
            <IconButton
              onClick={handleMobileMenuClick}
              sx={{
                background: theme.palette.mode === 'dark' 
                  ? alpha(theme.palette.common.white, 0.05)
                  : alpha(theme.palette.common.black, 0.05),
                borderRadius: '12px',
                padding: '8px',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: theme.palette.mode === 'dark' 
                    ? alpha(theme.palette.common.white, 0.1)
                    : alpha(theme.palette.common.black, 0.1),
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <MenuIcon sx={{ fontSize: 20 }} />
            </IconButton>
          )}
        </Box>
      </StyledToolbar>

      {/* Language Menu */}
      <Menu anchorEl={languageAnchorEl} open={Boolean(languageAnchorEl)} onClose={handleLanguageClose}>
        <MenuItem onClick={() => handleLanguageChange('en')}>
          <ListItemIcon>
            <Language sx={{ fontSize: 20 }} />
          </ListItemIcon>
          <ListItemText primary="English" />
        </MenuItem>
        <MenuItem onClick={() => handleLanguageChange('ar')}>
          <ListItemIcon>
            <Language sx={{ fontSize: 20 }} />
          </ListItemIcon>
          <ListItemText primary="العربية" />
        </MenuItem>
        <MenuItem onClick={() => handleLanguageChange('fr')}>
          <ListItemIcon>
            <Language sx={{ fontSize: 20 }} />
          </ListItemIcon>
          <ListItemText primary="Français" />
        </MenuItem>
      </Menu>

      {/* Mobile Menu */}
      <Menu anchorEl={mobileMenuAnchorEl} open={Boolean(mobileMenuAnchorEl)} onClose={handleMobileMenuClose}>
        <MenuItem onClick={() => { handleMobileMenuClose(); navigate('/dash'); }}>
          <ListItemIcon>
            <Home sx={{ fontSize: 20 }} />
          </ListItemIcon>
          <ListItemText primary={t('home')} />
        </MenuItem>
        <MenuItem onClick={() => { handleMobileMenuClose(); navigate('/dash/posts'); }}>
          <ListItemIcon>
            <RenderIcon activeLink={activeLink} />
          </ListItemIcon>
          <ListItemText primary={t('posts')} />
        </MenuItem>
      </Menu>

      {/* Country Modal */}
      <CountryModal
        open={openModal}
        onClose={() => dispatch(setOpenModal())}
        countries={countries}
        setCountryId={setCountryId}
        currentLanguage={currentLanguage}
      />
    </AppBar>
  );
};

export default SimpleNavbar;
