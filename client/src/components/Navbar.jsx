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
} from "@mui/material";
import {
  DarkModeOutlined,
  LightModeOutlined,
  Menu,
  LogoutOutlined,
  Home,
  SwapHorizOutlined,
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
import { useEffect } from "react";
import { setActiveLink } from "../app/state/index";
import { useState } from "react";
import { useGetCountriesQuery } from "../features/countries/countriesApiSlice";
import { setCurrentCountry } from "../app/state";
import useAuth from "../hooks/useAuth";
import NavLinks from "./NavLinks";
import CountryAutoselect from "./CountryAutoselect";
import CountryModal from "./CountryModal";
import { LoadingState } from "./LoadingStates";
import LanguageToggle from "../lang/LanguageToggle";
import RenderIcon from "./RenderIcon";
import { getCurrentLanguage, t } from "../utils/languageUtils";

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

const Navbar = () => {
  const { country } = useAuth();
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width:600px)");
  const currentLanguage = getCurrentLanguage();

  const activeLink = useSelector(selectActiveLink);
  const currentCountry = useSelector(selectCurrentCountry);
  const openModal = useSelector(selectOpenModal);

  const [countryId, setCountryId] = useState(country);

  useEffect(() => {
    dispatch(
      setCurrentCountry({
        currentCountry: countryId,
      })
    );
  }, [currentCountry, countryId]);

  const { countries } = useGetCountriesQuery({
    language: currentLanguage
  }, {
    selectFromResult: ({ data }) => ({
      countries: data?.ids.map((id) => data?.entities[id]),
    }),
  });

  const { code } = useGetCountriesQuery({
    language: currentLanguage
  }, {
    selectFromResult: ({ data }) => ({
      code: data?.entities[countryId],
    }),
  });

  const onCountryIdChanged = (e) => setCountryId(e.target.value);

  // const countryOptions = countries.map(({ id, code }) => {
  //   return (
  //     <option key={id} value={id}>
  //       {code}
  //     </option>
  //   );
  // });



  const [sendLogout, { isLoading, isSuccess, isError, error }] =
    useSendLogoutMutation();

  useEffect(() => {
    if (isSuccess) navigate("/");
  }, [isSuccess, navigate]);

  const onGoHomeClicked = () => navigate("/dash");
  // const currentLanguage = getCurrentLanguage();

  if (!countries || !code) return <LoadingState message={t('loadingNavigation')} />;

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
          gap: { xs: '0.5rem', sm: '2rem' }
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

          {/* Nav links - desktop only */}
          {!isMobile && <NavLinks />}
        </Box>

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
              src={`https://flagcdn.com/w20/${code.code.toLowerCase()}.png`}
              srcSet={`https://flagcdn.com/w40/${code.code.toLowerCase()}.png 2x`}
              alt=""
            />
            <RenderIcon name="arrowDown" />
          </CountrySelector>

          {/* Language toggle - always visible */}
          <LanguageToggle />

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
            onClick={() => dispatch(setIsSidebarOpen())}
            sx={{ 
              display: { xs: 'flex', sm: 'none' }
            }}
          >
            <Menu sx={{ fontSize: "22px" }} />
          </ActionButton>

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
          countries={countries}
          openModal={openModal}
        />
      </StyledToolbar>
    </AppBar>
  );
};

export default Navbar;
