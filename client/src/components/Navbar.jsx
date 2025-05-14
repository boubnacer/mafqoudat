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
import PulseLoader from "react-spinners/PulseLoader";
import LanguageToggle from "../lang/LanguageToggle";
import { useTranslation } from "react-i18next";
import RenderIcon from "./RenderIcon";

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  justifyContent: "space-between",
  background: theme.palette.mode === 'dark' 
    ? 'linear-gradient(to right, #1a1b1c, #242526)' 
    : 'linear-gradient(to right, #ffffff, #f8f9fa)',
  padding: "0.75rem 2rem",
  borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#333333' : '#e0e0e0'}`,
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
}));

const LogoButton = styled(Button)(({ theme }) => ({
  color: theme.palette.mode === 'dark' ? '#fff' : '#000',
  fontSize: '1.2rem',
  fontWeight: 600,
  padding: '8px 16px',
  borderRadius: '8px',
  transition: 'all 0.3s ease',
  '&:hover': {
    background: theme.palette.mode === 'dark' 
      ? 'rgba(255,255,255,0.1)' 
      : 'rgba(0,0,0,0.05)',
    transform: 'translateY(-1px)',
  },
}));

const ActionButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.mode === 'dark' ? '#fff' : '#000',
  transition: 'all 0.2s ease',
  margin: '0 4px',
  '&:hover': {
    background: theme.palette.mode === 'dark' 
      ? 'rgba(255,255,255,0.1)' 
      : 'rgba(0,0,0,0.05)',
    transform: 'scale(1.1)',
  },
}));

const CountrySelector = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: '4px 8px',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  '&:hover': {
    background: theme.palette.mode === 'dark' 
      ? 'rgba(255,255,255,0.1)' 
      : 'rgba(0,0,0,0.05)',
  },
  '& img': {
    borderRadius: '4px',
    marginRight: '4px',
  },
}));

const Navbar = () => {
  const { country } = useAuth();
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width:600px)");

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

  const { countries } = useGetCountriesQuery("countriesList", {
    selectFromResult: ({ data }) => ({
      countries: data?.ids.map((id) => data?.entities[id]),
    }),
  });

  

  const { code } = useGetCountriesQuery("countriesList", {
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

  const { t } = useTranslation();

  if (!countries || !code) return <PulseLoader color={"#FFF"} />;

  return (
    <AppBar
      sx={{
        boxShadow: 'none',
      }}
    >
      <StyledToolbar>
        {/* logo ---------- */}
        <LogoButton onClick={onGoHomeClicked}>
          {t("mafkoudat")}
        </LogoButton>
        
        <CountryModal
          setCountryId={setCountryId}
          countries={countries}
          openModal={openModal}
        />

        {/* mobile links------ */}
        <ActionButton
          onClick={() => dispatch(setIsSidebarOpen())}
          sx={{ display: isMobile ? "block" : "none" }}
        >
          <Menu sx={{ fontSize: "25px" }} />
        </ActionButton>

        {/* nav links --------- */}
        {!isMobile && <NavLinks />}

        {/* Right side actions */}
        <FlexBetween sx={{ gap: "16px" }}>
          {/* country selector */}
          <CountrySelector onClick={() => dispatch(setOpenModal())}>
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

          {/* language ---- */}
          <LanguageToggle />

          {/* light/dark mode  ------- */}
          <ActionButton onClick={() => dispatch(setMode())}>
            {theme.palette.mode === "dark" ? (
              <LightModeOutlined sx={{ fontSize: "22px" }} />
            ) : (
              <DarkModeOutlined sx={{ fontSize: "22px" }} />
            )}
          </ActionButton>

          <ActionButton onClick={sendLogout}>
            <LogoutOutlined sx={{ fontSize: "22px" }} />
          </ActionButton>
        </FlexBetween>
      </StyledToolbar>
    </AppBar>
  );
};

export default Navbar;
