import {
  AppBar,
  Box,
  Button,
  IconButton,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
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

  useEffect(() => {
    dispatch(
      setCurrentCountry({
        currentCountry: countryId,
      })
    );
  }, [currentCountry, countryId]);

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
        // position: "static",
        // background: theme.palette.primary,
        boxShadow: "none",
        // borderBottom: "1px solid #333333",
      }}
    >
      <Toolbar
        sx={{
          justifyContent: "space-between",
          background: "#242526",
          // padding: "0.5rem 0",
        }}
      >
        {/* logo ---------- */}
        <Button
          onClick={onGoHomeClicked}
          sx={{
            color: theme.palette.textColor.links,
            "& > .css-1b9bpml-MuiButtonBase-root-MuiButton-root": {},
          }}
        >
          {t("mafkoudat")}
        </Button>
        <CountryModal
          setCountryId={setCountryId}
          countries={countries}
          openModal={openModal}
        />

        {/* mobile links------ */}
        <IconButton
          onClick={() => dispatch(setIsSidebarOpen())}
          sx={{ display: isMobile ? "block" : "none" }}
        >
          <Menu sx={{ fontSize: "25px" }} />
        </IconButton>

        {/* nav links --------- */}
        {!isMobile && <NavLinks />}

        {/* country --------- */}
        <FlexBetween sx={{ gap: "2px" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <img
              onClick={() => dispatch(setOpenModal())}
              loading="lazy"
              width="30"
              height="20"
              src={`https://flagcdn.com/w20/${code.code.toLowerCase()}.png`}
              srcSet={`https://flagcdn.com/w40/${code.code.toLowerCase()}.png 2x`}
              alt=""
              style={{ cursor: "pointer" }}
            />
            <RenderIcon name="arrowDown" />
          </Box>

          {/* language ---- */}
          <LanguageToggle />

          {/* light/dark mode  ------- */}
          <IconButton onClick={() => dispatch(setMode())}>
            {theme.palette.mode === "dark" ? (
              <LightModeOutlined sx={{ fontSize: "25px" }} />
            ) : (
              <DarkModeOutlined sx={{ fontSize: "25px" }} />
            )}
          </IconButton>

          <IconButton onClick={sendLogout}>
            <LogoutOutlined sx={{ fontSize: "25px" }} />
          </IconButton>
        </FlexBetween>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
