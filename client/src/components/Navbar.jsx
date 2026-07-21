import {
  AppBar,
  Avatar,
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
  Chip,
  Tooltip,
  Drawer,
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
  Close,
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

// Phase 1 tokens only (theme.custom.*) — see designTokens.js / CLAUDE.md.
const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  justifyContent: "space-between",
  backgroundColor: alpha(theme.custom.color.surfaceRaised, 0.95),
  backdropFilter: "blur(20px)",
  padding: "0.75rem 2rem",
  borderBottom: `1px solid ${alpha(theme.custom.color.ink, 0.08)}`,
  boxShadow: theme.custom.elevation.e1,
  transition: "background-color 0.3s ease",
  [theme.breakpoints.down("md")]: {
    padding: "0.75rem 1rem",
    minHeight: "72px",
  },
}));

const LogoButton = styled(Button)(({ theme }) => ({
  padding: "8px 12px",
  borderRadius: theme.custom.radius.sm,
  background: "transparent",
  minWidth: "auto",
  boxShadow: "none",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  "&:hover": {
    background: alpha(theme.custom.color.ink, 0.04),
    boxShadow: "none",
  },
  "& img": {
    height: "auto",
    maxHeight: "35px",
    width: "auto",
    objectFit: "contain",
  },
}));

const ActionButton = styled(IconButton)(({ theme }) => ({
  color: theme.custom.color.ink,
  transition: "background-color 0.2s ease",
  margin: "0 4px",
  padding: "10px",
  borderRadius: theme.custom.radius.sm,
  backgroundColor: alpha(theme.custom.color.ink, 0.03),
  "&:hover": {
    backgroundColor: alpha(theme.custom.color.ink, 0.08),
  },
}));

const NavigationButton = styled(Button)(({ theme }) => ({
  color: theme.custom.color.ink,
  fontSize: "0.9rem",
  fontWeight: 600,
  padding: "8px 14px",
  borderRadius: theme.custom.radius.sm,
  whiteSpace: "nowrap",
  "&:hover": {
    backgroundColor: alpha(theme.custom.color.ink, 0.06),
  },
}));

// Combined country + language entry point (replaces the two separate pills).
const RegionSelector = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: "6px",
  padding: "6px 12px",
  borderRadius: theme.custom.radius.sm,
  cursor: "pointer",
  backgroundColor: alpha(theme.custom.color.ink, 0.03),
  border: `1px solid ${alpha(theme.custom.color.ink, 0.1)}`,
  transition: "background-color 0.2s ease",
  "&:hover": {
    backgroundColor: alpha(theme.custom.color.ink, 0.08),
  },
  "& img": {
    borderRadius: "2px",
    display: "block",
  },
}));

const CreatePostButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.custom.color.brandPrimary,
  color: theme.palette.common.white,
  fontSize: "0.9rem",
  fontWeight: 600,
  padding: "8px 18px",
  borderRadius: theme.custom.radius.sm,
  boxShadow: theme.custom.elevation.e1,
  "&:hover": {
    backgroundColor: theme.custom.color.brandPrimary,
    filter: "brightness(0.92)",
    boxShadow: theme.custom.elevation.e2,
  },
}));

const DrawerRow = styled(MenuItem)(({ theme }) => ({
  borderRadius: theme.custom.radius.sm,
  marginBottom: "4px",
  paddingTop: "12px",
  paddingBottom: "12px",
  "&:hover": {
    backgroundColor: alpha(theme.custom.color.ink, 0.06),
  },
}));

const Navbar = () => {
  const { country, username, role, isAuthenticated } = useAuth();
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // Single breakpoint: >=900px shows the full desktop bar, below it collapses to the drawer.
  const showDesktopNav = useMediaQuery(theme.breakpoints.up("md"));
  const { t, currentLanguage } = useTranslation();
  const { changeLanguage } = useUnifiedLanguageChange({
    showLoadingState: false,
    refetchPriority: "medium",
    enableLogging: process.env.NODE_ENV === "development",
  });

  // Use Redux selectors directly for better state synchronization
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const reduxUser = useSelector(selectCurrentUser);
  const authState = useSelector((state) => state.auth);
  const { isLoggedIn: authLoggedIn, user: authUser, lastUpdate } = authState;

  const currentCountry = useSelector(selectCurrentCountry);
  const mode = useSelector((state) => state.global.mode);

  const [selectedCountry, setSelectedCountry] = useState(null);
  const [regionAnchorEl, setRegionAnchorEl] = useState(null);
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get found/lost options for navigation
  const { data: flOptionsData } = useGetflOptionsQuery(
    { language: currentLanguage },
    {
      selectFromResult: ({ data }) => ({
        data: data?.ids?.map((id) => data?.entities[id]) || [],
      }),
    }
  );

  // Get system settings for maintenance mode indicator (only for admins)
  const { data: systemSettingsData } = useGetSystemSettingsQuery(undefined, {
    skip: role !== "admin", // Only fetch if user is admin
    pollingInterval: 30000, // Poll every 30 seconds
  });
  const isMaintenanceActive = systemSettingsData?.data?.maintenanceMode?.isActive || false;

  // Initialize country on component mount
  useEffect(() => {
    if (!isInitialized) {
      setIsInitialized(true);
    }
  }, [isInitialized]);

  const handleCountrySelect = (_, value) => {
    setSelectedCountry(value);
    if (value) {
      dispatch(setCurrentCountry({ currentCountry: value._id }));
    }
    setRegionAnchorEl(null);
  };

  const handleRegionClick = (event) => {
    setRegionAnchorEl(event.currentTarget);
  };

  const handleRegionClose = () => {
    setRegionAnchorEl(null);
  };

  const { countries } = useGetCountriesQuery(
    { language: currentLanguage },
    {
      selectFromResult: ({ data }) => ({
        countries: data?.ids.map((id) => data?.entities[id]),
      }),
      // Add debouncing to prevent multiple API calls during language switch
      refetchOnMountOrArgChange: 500, // 500ms debounce
    }
  );

  // Country code to name mapping for fallback
  const countryCodeToName = {
    MA: { en: "Morocco", ar: "المغرب", fr: "Maroc" },
    DZ: { en: "Algeria", ar: "الجزائر", fr: "Algérie" },
    TN: { en: "Tunisia", ar: "تونس", fr: "Tunisie" },
    EG: { en: "Egypt", ar: "مصر", fr: "Égypte" },
    SA: { en: "Saudi Arabia", ar: "المملكة العربية السعودية", fr: "Arabie Saoudite" },
    AE: { en: "United Arab Emirates", ar: "الإمارات العربية المتحدة", fr: "Émirats Arabes Unis" },
    QA: { en: "Qatar", ar: "قطر", fr: "Qatar" },
    KW: { en: "Kuwait", ar: "الكويت", fr: "Koweït" },
    BH: { en: "Bahrain", ar: "البحرين", fr: "Bahreïn" },
    OM: { en: "Oman", ar: "عُمان", fr: "Oman" },
    JO: { en: "Jordan", ar: "الأردن", fr: "Jordanie" },
    LB: { en: "Lebanon", ar: "لبنان", fr: "Liban" },
    SY: { en: "Syria", ar: "سوريا", fr: "Syrie" },
    IQ: { en: "Iraq", ar: "العراق", fr: "Irak" },
    PS: { en: "Palestine", ar: "فلسطين", fr: "Palestine" },
    LY: { en: "Libya", ar: "ليبيا", fr: "Libye" },
    SD: { en: "Sudan", ar: "السودان", fr: "Soudan" },
    SO: { en: "Somalia", ar: "الصومال", fr: "Somalie" },
    DJ: { en: "Djibouti", ar: "جيبوتي", fr: "Djibouti" },
    KM: { en: "Comoros", ar: "جزر القمر", fr: "Comores" },
    MR: { en: "Mauritania", ar: "موريتانيا", fr: "Mauritanie" },
    ML: { en: "Mali", ar: "مالي", fr: "Mali" },
    NE: { en: "Niger", ar: "النيجر", fr: "Niger" },
    TD: { en: "Chad", ar: "تشاد", fr: "Tchad" },
    CF: { en: "Central African Republic", ar: "جمهورية أفريقيا الوسطى", fr: "République Centrafricaine" },
  };

  // Fallback countries in case API fails
  const fallbackCountries = [
    { _id: "68a4b54ab46524c54c553ca9", code: "MA", label: "Morocco", labels: { en: "MA", ar: "MA", fr: "MA" }, names: { en: "Morocco", ar: "المغرب", fr: "Maroc" }, flag: "🇲🇦" },
  ];

  // Use countries from API or fallback
  const countriesToUse = countries || fallbackCountries;

  // Get current country data for display
  const currentCountryData = countriesToUse.find((c) => c._id === currentCountry) || countriesToUse[0];

  const [sendLogout, { isSuccess }] = useSendLogoutMutation();

  useEffect(() => {
    if (isSuccess) {
      // Define routes that require authentication
      const protectedRoutes = ["/dash/posts/new", "/dash/posts/edit", "/profile", "/admin"];

      const currentPath = window.location.pathname;

      // Check if current page requires authentication
      const isProtectedRoute = protectedRoutes.some((route) => currentPath.startsWith(route));

      if (isProtectedRoute) {
        // Redirect to dashboard if on protected route
        navigate("/dash");
      }
    }
  }, [isSuccess, navigate]);

  const onGoHomeClicked = () => navigate("/dash");

  // Menu handlers
  const handleMobileDrawerClose = () => setMobileDrawerOpen(false);
  const handleProfileClick = (event) => setProfileAnchorEl(event.currentTarget);
  const handleProfileClose = () => setProfileAnchorEl(null);

  // Admin refresh handler
  const handleRefreshAllData = async () => {
    try {
      setIsRefreshing(true);
      await forceRefreshAllDependencies(currentLanguage);
      console.log("✅ All data refreshed successfully from navbar");
    } catch (error) {
      console.error("❌ Failed to refresh data from navbar:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLanguageChange = async (newLanguage) => {
    console.log("🌐 [NAVBAR] Language change triggered:", { newLanguage, currentUrl: window.location.href });

    try {
      // Use unified language change handler
      const success = await changeLanguage(newLanguage);

      if (success) {
        console.log("🌐 [NAVBAR] Language changed successfully to:", newLanguage);
        handleRegionClose();
      } else {
        console.error("🌐 [NAVBAR] Failed to change language to:", newLanguage);
      }
    } catch (error) {
      console.error("🌐 [NAVBAR] Error changing language:", error);
    }
  };

  const handleModeToggle = () => {
    dispatch(setMode());
  };

  const getLanguageDisplayName = (lang) => {
    switch (lang) {
      case "en":
        return "English";
      case "ar":
        return "العربية";
      case "fr":
        return "Français";
      default:
        return "English";
    }
  };

  // Primary navigation items (non-admin). Rendered flat on desktop, and
  // together with adminNavigationItems in the mobile drawer.
  const navigationItems = [
    {
      title: t("dashboard"),
      icon: <Dashboard sx={{ fontSize: 20 }} />,
      action: () => navigate("/dash"),
      description: t("goToDashboard"),
    },
    {
      title: t("all"),
      icon: <Explore sx={{ fontSize: 20 }} />,
      action: () => {
        // Reset found/lost state to show all posts
        dispatch(setFoundOrLost({ foundOrlost: "" }));
        navigate("/dash/posts");
      },
      description: t("viewAllPosts"),
    },
    ...(flOptionsData?.map((option) => {
      // Use custom Arabic titles for Found and Lost items
      let displayTitle = option.label || option.code;
      if (currentLanguage === "ar") {
        if (option.code === "FOUND") {
          displayTitle = "عثر عليها";
        } else if (option.code === "LOST") {
          displayTitle = "مفقودات";
        }
      }

      return {
        title: displayTitle,
        icon: (
          <Search
            sx={{
              fontSize: 20,
              color: option.code === "FOUND" ? theme.custom.status.found.main : theme.custom.status.lost.main,
            }}
          />
        ),
        action: () => {
          // Update Redux state with the found/lost status
          dispatch(setFoundOrLost({ foundOrlost: option.code }));
          // Navigate with the correct found/lost ID filter
          navigate(`/dash/posts?fl=${option._id}`);
        },
        description: t(`view${option.code}Items`),
      };
    }) || []),
    {
      title: t("blog"),
      icon: <PostAdd sx={{ fontSize: 20, color: theme.custom.color.brandPrimary }} />,
      action: () => navigate("/blog"),
      description: t("blogSubtitle"),
    },
    {
      title: t("helpCenter"),
      icon: <Build sx={{ fontSize: 20, color: theme.custom.color.brandPrimary }} />,
      action: () => navigate("/help"),
      description: t("helpCenterSubtitle"),
    },
  ];

  // Admin-only items — surfaced from the avatar menu on desktop, appended to
  // the drawer list on mobile. Same handlers as before, just relocated.
  const adminNavigationItems = [];
  if (authLoggedIn && authUser?.role === "admin") {
    adminNavigationItems.push({
      title: "Refresh All Data",
      icon: <Refresh sx={{ fontSize: 20, color: theme.custom.color.brandPrimary }} />,
      action: () => handleRefreshAllData(),
      description: "Refresh categories, countries, and found/lost options",
    });

    adminNavigationItems.push({
      title: t("adminPanel"),
      icon: <AdminPanelSettings sx={{ fontSize: 20, color: theme.custom.status.lost.main }} />,
      action: () => navigate("/dash/admin"),
      description: t("adminPanelDescription"),
    });
  }

  const regionFlagUrl = currentCountryData ? `https://flagcdn.com/w20/${currentCountryData.code.toLowerCase()}.png` : null;
  const regionFlagUrl2x = currentCountryData ? `https://flagcdn.com/w40/${currentCountryData.code.toLowerCase()}.png` : null;

  const maintenanceChip = role === "admin" && isMaintenanceActive && (
    <Tooltip title="Maintenance mode is currently active. Non-admin users cannot access the site." arrow>
      <Chip
        icon={<Build sx={{ fontSize: "16px" }} />}
        label="⚠️ Maintenance Active"
        size="small"
        sx={{
          backgroundColor: theme.custom.status.lost.bg,
          color: theme.custom.status.lost.main,
          fontWeight: 600,
          fontSize: "0.75rem",
          border: `1px solid ${theme.custom.status.lost.border}`,
        }}
      />
    </Tooltip>
  );

  return (
    <AppBar
      sx={{
        boxShadow: "none",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <StyledToolbar>
        {/* Logo */}
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <LogoButton onClick={onGoHomeClicked}>
            <img
              src="/maficonSVG.svg"
              alt="Mafqoudat Icon"
              loading="lazy"
              style={{ height: "35px", width: "35px", objectFit: "contain" }}
            />
            <img src="/maflogoSVG.svg" alt={t("brandName")} loading="lazy" />
          </LogoButton>
        </Box>

        {/* Primary nav — desktop only (>=900px) */}
        {showDesktopNav && (
          <Box sx={{ display: "flex", alignItems: "center", flex: 1, mx: 2, gap: 0.5, flexWrap: "wrap" }}>
            {navigationItems.map((item) => (
              <NavigationButton key={item.title} onClick={item.action} startIcon={item.icon}>
                {item.title}
              </NavigationButton>
            ))}
          </Box>
        )}

        {/* Right section: Actions */}
        <FlexBetween sx={{ gap: "10px" }}>
          {showDesktopNav && (
            <CreatePostButton
              onClick={() => {
                if (authLoggedIn) {
                  navigate("/dash/posts/new");
                } else {
                  navigate("/login");
                }
              }}
              startIcon={authLoggedIn ? <PostAdd /> : <Login />}
            >
              {authLoggedIn ? t("createPost") : t("signin")}
            </CreatePostButton>
          )}

          {showDesktopNav && (
            <RegionSelector onClick={handleRegionClick}>
              {isInitialized && currentCountryData ? (
                <img loading="lazy" width="20" height="15" src={regionFlagUrl} srcSet={`${regionFlagUrl2x} 2x`} alt="" />
              ) : (
                <Language sx={{ fontSize: 18 }} />
              )}
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.85rem" }}>
                {(currentCountryData?.code || "").toUpperCase()} / {currentLanguage.toUpperCase()}
              </Typography>
              <KeyboardArrowDown sx={{ fontSize: "16px" }} />
            </RegionSelector>
          )}

          {showDesktopNav && maintenanceChip}

          {showDesktopNav && (
            <ActionButton onClick={handleModeToggle}>
              {mode === "light" ? <DarkModeOutlined sx={{ fontSize: "20px" }} /> : <LightModeOutlined sx={{ fontSize: "20px" }} />}
            </ActionButton>
          )}

          {showDesktopNav && authLoggedIn && (
            <IconButton onClick={handleProfileClick} sx={{ padding: "4px" }}>
              <Avatar
                sx={{
                  width: 34,
                  height: 34,
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  bgcolor: theme.custom.color.brandPrimary,
                  color: theme.palette.common.white,
                }}
              >
                {username ? username.charAt(0).toUpperCase() : <Person sx={{ fontSize: 18 }} />}
              </Avatar>
            </IconButton>
          )}

          {/* Mobile menu button — everything else lives in the drawer below (<900px) */}
          {!showDesktopNav && (
            <ActionButton onClick={() => setMobileDrawerOpen(true)}>
              <MenuIcon sx={{ fontSize: "24px" }} />
            </ActionButton>
          )}
        </FlexBetween>

        {/* Combined Region Menu (country search + language) — shared by the
            desktop RegionSelector and the mobile drawer's Region row. */}
        <Menu
          anchorEl={regionAnchorEl}
          open={Boolean(regionAnchorEl)}
          onClose={handleRegionClose}
          PaperProps={{
            sx: {
              mt: 1,
              borderRadius: `${theme.custom.radius.md}px`,
              boxShadow: theme.custom.elevation.e3,
              border: `1px solid ${alpha(theme.custom.color.ink, 0.1)}`,
              minWidth: 320,
              maxWidth: 400,
            },
          }}
        >
          <Box sx={{ p: 2 }}>
            <Autocomplete
              options={countriesToUse || []}
              autoHighlight
              disableClearable
              value={selectedCountry}
              onChange={handleCountrySelect}
              getOptionLabel={(option) => {
                if (!option) return "";
                const currentLang = currentLanguage || "en";

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
                <Box component="li" sx={{ display: "flex", alignItems: "center", width: "100%", py: 1.5, px: 2 }} {...props}>
                  {option.flag ? (
                    <span style={{ marginInlineEnd: 12, fontSize: "20px", display: "flex", alignItems: "center" }}>{option.flag}</span>
                  ) : (
                    <img
                      loading="lazy"
                      width="20"
                      height="15"
                      src={`https://flagcdn.com/w20/${option.code.toLowerCase()}.png`}
                      srcSet={`https://flagcdn.com/w40/${option.code.toLowerCase()}.png 2x`}
                      alt=""
                      style={{ marginInlineEnd: 12, borderRadius: "2px" }}
                    />
                  )}
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: "0.9rem", lineHeight: 1.2 }}>
                    {(() => {
                      const currentLang = currentLanguage || "en";

                      if (option.names && option.names[currentLang]) {
                        return option.names[currentLang];
                      }

                      if (option.labels && option.labels[currentLang]) {
                        const label = option.labels[currentLang];
                        if (label && label.length === 2 && label === label.toUpperCase()) {
                          return countryCodeToName[label]?.[currentLang] || option.code;
                        }
                        return label;
                      }

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
                  placeholder={t("searchCountries") || "Search countries..."}
                  variant="outlined"
                  size="small"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: `${theme.custom.radius.sm}px`,
                      fontSize: "0.9rem",
                      backgroundColor: alpha(theme.custom.color.ink, 0.03),
                      "& fieldset": {
                        borderColor: alpha(theme.custom.color.ink, 0.1),
                      },
                      "&:hover fieldset": {
                        borderColor: alpha(theme.custom.color.brandPrimary, 0.4),
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: theme.custom.color.brandPrimary,
                      },
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
                  "& .MuiAutocomplete-option": {
                    padding: 0,
                    "&:hover": {
                      backgroundColor: alpha(theme.custom.color.brandPrimary, 0.08),
                    },
                    '&[aria-selected="true"]': {
                      backgroundColor: alpha(theme.custom.color.brandPrimary, 0.12),
                    },
                  },
                },
              }}
            />
          </Box>
          <Divider />
          {/* Language names are shown in their own autonym regardless of the
              active UI language — standard i18n convention, not hardcoded copy. */}
          <MenuItem onClick={() => handleLanguageChange("en")} selected={currentLanguage === "en"}>
            <ListItemIcon>
              <Language sx={{ fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText primary="English" />
          </MenuItem>
          <MenuItem onClick={() => handleLanguageChange("ar")} selected={currentLanguage === "ar"}>
            <ListItemIcon>
              <Language sx={{ fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText primary="العربية" />
          </MenuItem>
          <MenuItem onClick={() => handleLanguageChange("fr")} selected={currentLanguage === "fr"}>
            <ListItemIcon>
              <Language sx={{ fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText primary="Français" />
          </MenuItem>
        </Menu>

        {/* Profile Menu (desktop, logged in) */}
        <Menu
          anchorEl={profileAnchorEl}
          open={Boolean(profileAnchorEl)}
          onClose={handleProfileClose}
          PaperProps={{
            sx: {
              mt: 1,
              borderRadius: `${theme.custom.radius.md}px`,
              boxShadow: theme.custom.elevation.e3,
              border: `1px solid ${alpha(theme.custom.color.ink, 0.1)}`,
              minWidth: 220,
            },
          }}
        >
          <MenuItem
            onClick={() => {
              handleProfileClose();
              navigate("/dash/profile");
            }}
          >
            <ListItemIcon>
              <Person sx={{ fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText primary={t("myProfile")} primaryTypographyProps={{ fontWeight: 600, fontSize: "0.95rem" }} />
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleProfileClose();
              navigate("/dash/myposts");
            }}
          >
            <ListItemIcon>
              <PostAdd sx={{ fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText primary={t("myPosts")} primaryTypographyProps={{ fontWeight: 600, fontSize: "0.95rem" }} />
          </MenuItem>

          {adminNavigationItems.length > 0 && <Divider />}
          {adminNavigationItems.map((item) => (
            <MenuItem
              key={item.title}
              onClick={() => {
                item.action();
                handleProfileClose();
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.title} primaryTypographyProps={{ fontWeight: 600, fontSize: "0.95rem" }} />
            </MenuItem>
          ))}

          <Divider />
          <MenuItem
            onClick={() => {
              handleProfileClose();
              sendLogout();
            }}
          >
            <ListItemIcon>
              <LogoutOutlined sx={{ fontSize: 20, color: theme.custom.status.lost.main }} />
            </ListItemIcon>
            <ListItemText
              primary={t("logout")}
              primaryTypographyProps={{ fontWeight: 600, fontSize: "0.95rem", color: theme.custom.status.lost.main }}
            />
          </MenuItem>
        </Menu>

        {/* Mobile drawer — replaces the old anchored dropdown. Slides from the
            trailing edge (right in LTR, left in RTL) so it mirrors the hamburger's
            position once the toolbar itself mirrors under RTL. */}
        <Drawer
          anchor={currentLanguage === "ar" ? "left" : "right"}
          open={mobileDrawerOpen}
          onClose={handleMobileDrawerClose}
          PaperProps={{
            sx: {
              width: 300,
              maxWidth: "85vw",
              backgroundColor: theme.custom.color.surfaceRaised,
              padding: 2,
            },
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
            <IconButton onClick={handleMobileDrawerClose}>
              <Close sx={{ fontSize: "24px" }} />
            </IconButton>
          </Box>

          {/* Maintenance Mode Indicator - Mobile - Only for Admins */}
          {role === "admin" && isMaintenanceActive && (
            <>
              <Box
                sx={{
                  p: 2,
                  mb: 2,
                  borderRadius: `${theme.custom.radius.md}px`,
                  backgroundColor: theme.custom.status.lost.bg,
                  border: `1px solid ${theme.custom.status.lost.border}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                <Build sx={{ color: theme.custom.status.lost.main, fontSize: 24 }} />
                <Box flex={1}>
                  <Typography variant="body2" fontWeight={700} sx={{ color: theme.custom.status.lost.main }}>
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

          {/* Navigation items (includes admin items when applicable) */}
          {[...navigationItems, ...adminNavigationItems].map((item) => (
            <DrawerRow
              key={item.title}
              onClick={() => {
                item.action();
                handleMobileDrawerClose();
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.title}
                secondary={item.description}
                primaryTypographyProps={{ fontWeight: 600, fontSize: "1rem" }}
                secondaryTypographyProps={{ fontSize: "0.85rem", color: "text.secondary" }}
              />
            </DrawerRow>
          ))}

          <Divider sx={{ my: 1.5 }} />

          {/* Region row — opens the same combined Region Menu used on desktop */}
          <DrawerRow onClick={handleRegionClick}>
            <ListItemIcon>
              {isInitialized && currentCountryData ? (
                <img width="20" height="15" src={regionFlagUrl} srcSet={`${regionFlagUrl2x} 2x`} alt="" style={{ borderRadius: 2 }} />
              ) : (
                <Language sx={{ fontSize: 20 }} />
              )}
            </ListItemIcon>
            <ListItemText
              primary={t("region")}
              secondary={`${(currentCountryData?.code || "").toUpperCase()} · ${getLanguageDisplayName(currentLanguage)}`}
              primaryTypographyProps={{ fontWeight: 600, fontSize: "1rem" }}
            />
            <KeyboardArrowDown sx={{ fontSize: "18px" }} />
          </DrawerRow>

          {/* Theme Toggle */}
          <DrawerRow
            onClick={() => {
              handleModeToggle();
            }}
          >
            <ListItemIcon>
              {mode === "light" ? <DarkModeOutlined sx={{ fontSize: 22 }} /> : <LightModeOutlined sx={{ fontSize: 22 }} />}
            </ListItemIcon>
            <ListItemText
              primary={mode === "light" ? t("darkMode") : t("lightMode")}
              primaryTypographyProps={{ fontWeight: 600, fontSize: "1rem" }}
            />
          </DrawerRow>

          <Divider sx={{ my: 1.5 }} />

          {/* Authentication Section */}
          {authLoggedIn ? (
            <>
              <DrawerRow
                onClick={() => {
                  handleMobileDrawerClose();
                  navigate("/dash/profile");
                }}
              >
                <ListItemIcon>
                  <Person sx={{ fontSize: 22 }} />
                </ListItemIcon>
                <ListItemText primary={t("myProfile")} primaryTypographyProps={{ fontWeight: 600, fontSize: "1rem" }} />
              </DrawerRow>
              <DrawerRow
                onClick={() => {
                  handleMobileDrawerClose();
                  sendLogout();
                }}
              >
                <ListItemIcon>
                  <LogoutOutlined sx={{ fontSize: 22, color: theme.custom.status.lost.main }} />
                </ListItemIcon>
                <ListItemText
                  primary={t("logout")}
                  primaryTypographyProps={{ fontWeight: 600, fontSize: "1rem", color: theme.custom.status.lost.main }}
                />
              </DrawerRow>
            </>
          ) : (
            <>
              <DrawerRow
                onClick={() => {
                  handleMobileDrawerClose();
                  navigate("/login");
                }}
              >
                <ListItemIcon>
                  <Login sx={{ fontSize: 22 }} />
                </ListItemIcon>
                <ListItemText primary={t("signin")} primaryTypographyProps={{ fontWeight: 600, fontSize: "1rem" }} />
              </DrawerRow>
              <DrawerRow
                onClick={() => {
                  handleMobileDrawerClose();
                  navigate("/signup");
                }}
              >
                <ListItemIcon>
                  <PersonAdd sx={{ fontSize: 22 }} />
                </ListItemIcon>
                <ListItemText primary={t("signup")} primaryTypographyProps={{ fontWeight: 600, fontSize: "1rem" }} />
              </DrawerRow>
            </>
          )}
        </Drawer>
      </StyledToolbar>
    </AppBar>
  );
};

export default Navbar;
