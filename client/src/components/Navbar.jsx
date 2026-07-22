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
  Popper,
  Grow,
  ClickAwayListener,
  Paper,
  Collapse,
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
  Explore as ExploreIcon,
  Apps,
  Dashboard,
  PostAdd,
  AdminPanelSettings,
  Person,
  Build,
  Refresh,
  Close,
} from "@mui/icons-material";
import {
  selectCurrentCountry,
  setMode,
  setCurrentCountry,
  setFoundOrLost,
} from "../app/state";
import { useDispatch, useSelector } from "react-redux";
import { useSendLogoutMutation } from "../features/auth/authApiSlice";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useGetCountriesQuery } from "../features/countries/countriesApiSlice";
import useAuth from "../hooks/useAuth";
import { useTranslation } from "../utils/translations";
import { useGetflOptionsQuery } from "../features/dependencies/dependenciesApiSlice";
import { useUnifiedLanguageChange } from "../hooks/useUnifiedLanguageChange";
import { forceRefreshAllDependencies } from "../utils/cacheRefresh";
import { selectIsLoggedIn, selectCurrentUser } from "../features/auth/authSlice";
import { useGetSystemSettingsQuery } from "../features/admin/systemSettingsApiSlice";

// Phase 1 tokens only (theme.custom.*) — see designTokens.js / CLAUDE.md.
// Three-column grid (not flex space-between) so the center cluster is
// genuinely centered regardless of how wide the left/right clusters are.
const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
  alignItems: "center",
  columnGap: "16px",
  backgroundColor: alpha(theme.custom.color.surfaceRaised, 0.95),
  backdropFilter: "blur(20px)",
  padding: "0.75rem 2.5rem",
  borderBottom: `1px solid ${alpha(theme.custom.color.ink, 0.08)}`,
  boxShadow: theme.custom.elevation.e1,
  transition: "background-color 0.3s ease",
  [theme.breakpoints.down("md")]: {
    padding: "0.75rem 1rem",
    minHeight: "72px",
  },
}));

const LogoButton = styled(Button)(({ theme }) => ({
  padding: "6px 10px 6px 6px",
  borderRadius: theme.custom.radius.md,
  background: "transparent",
  minWidth: "auto",
  boxShadow: "none",
  display: "flex",
  alignItems: "center",
  gap: "10px",
  "&:hover": {
    background: alpha(theme.custom.color.ink, 0.04),
    boxShadow: "none",
    "& .brand-mark": {
      transform: "rotate(-6deg) scale(1.06)",
    },
  },
}));

const BrandMark = styled(Box)(({ theme }) => ({
  width: 34,
  height: 34,
  borderRadius: theme.custom.radius.md,
  backgroundColor: alpha(theme.custom.color.brandPrimary, 0.12),
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
  "& img": {
    width: 18,
    height: 18,
  },
}));

const SecondaryButton = styled(Button)(({ theme }) => ({
  color: theme.custom.color.ink,
  fontSize: "0.9rem",
  fontWeight: 600,
  padding: "8px 16px",
  borderRadius: theme.custom.radius.sm,
  border: `1px solid ${alpha(theme.custom.color.ink, 0.18)}`,
  backgroundColor: "transparent",
  whiteSpace: "nowrap",
  "&:hover": {
    backgroundColor: alpha(theme.custom.color.ink, 0.05),
    borderColor: alpha(theme.custom.color.ink, 0.3),
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

// Primary-nav trigger — deliberately distinct from the utility RegionSelector
// pill (bolder border, brand-tinted icon) since it's the main wayfinding entry.
const ExploreTrigger = styled(Button, { shouldForwardProp: (prop) => prop !== "isOpen" })(({ theme, isOpen }) => ({
  color: theme.custom.color.ink,
  fontSize: "0.9rem",
  fontWeight: 600,
  padding: "8px 14px",
  borderRadius: theme.custom.radius.sm,
  border: `1px solid ${alpha(theme.custom.color.ink, isOpen ? 0.18 : 0.1)}`,
  backgroundColor: isOpen ? alpha(theme.custom.color.brandPrimary, 0.08) : "transparent",
  transition: "background-color 0.2s ease, border-color 0.2s ease",
  "&:hover": {
    backgroundColor: alpha(theme.custom.color.brandPrimary, 0.08),
    borderColor: alpha(theme.custom.color.ink, 0.18),
  },
  "& .explore-chevron": {
    transition: "transform 0.2s ease",
    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
  },
}));

// Combined country + language entry point — unchanged from the previous pass.
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

// One tile inside the Explore panel. `tone` picks the accent — status colors
// for Found/Lost so the panel echoes the same semantic system as the posts
// themselves, brand tint for everything else.
const ExploreTile = styled(Box, { shouldForwardProp: (prop) => prop !== "toneBg" && prop !== "toneBorder" })(
  ({ theme, toneBg, toneBorder }) => ({
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "12px",
    borderRadius: theme.custom.radius.md,
    cursor: "pointer",
    backgroundColor: toneBg,
    border: `1px solid ${toneBorder}`,
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: theme.custom.elevation.e1,
    },
  })
);

const ExploreTileIcon = styled(Box)(({ theme }) => ({
  width: 32,
  height: 32,
  minWidth: 32,
  borderRadius: theme.custom.radius.sm,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: alpha(theme.custom.color.surfaceRaised, 0.6),
}));

const Navbar = () => {
  const { country, username, role, isAuthenticated } = useAuth();
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // Explore is now a compact dropdown rather than a row of flat buttons, so
  // the full desktop bar fits comfortably at a narrower width than before.
  const showDesktopNav = useMediaQuery("(min-width:760px)");
  const { t, currentLanguage } = useTranslation();
  const isRTL = currentLanguage === "ar";
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
  const [exploreOpen, setExploreOpen] = useState(false);
  const [mobileExploreOpen, setMobileExploreOpen] = useState(false);
  const exploreAnchorRef = useRef(null);

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

  const handleExploreToggle = () => setExploreOpen((prev) => !prev);
  const handleExploreClose = (event) => {
    if (exploreAnchorRef.current && exploreAnchorRef.current.contains(event.target)) {
      return;
    }
    setExploreOpen(false);
  };
  const handleExploreItemClick = (item) => {
    item.action();
    setExploreOpen(false);
  };

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

  // Browse items grouped under the Explore trigger — this is the full list
  // from the pre-redesign navbar's own "Explore" dropdown (Dashboard, All,
  // Found, Lost, Blog, Help Center), just restyled.
  const navigationItems = [
    {
      title: t("dashboard"),
      icon: <Dashboard sx={{ fontSize: 20 }} />,
      action: () => navigate("/dash"),
      description: t("goToDashboard"),
      tone: "neutral",
    },
    {
      title: t("all"),
      icon: <Apps sx={{ fontSize: 20 }} />,
      action: () => {
        // Reset found/lost state to show all posts
        dispatch(setFoundOrLost({ foundOrlost: "" }));
        navigate("/dash/posts");
      },
      description: t("viewAllPosts"),
      tone: "neutral",
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
        tone: option.code === "FOUND" ? "found" : "lost",
      };
    }) || []),
    {
      title: t("blog"),
      icon: <PostAdd sx={{ fontSize: 20, color: theme.custom.color.brandPrimary }} />,
      action: () => navigate("/blog"),
      description: t("blogSubtitle"),
      tone: "neutral",
    },
    {
      title: t("helpCenter"),
      icon: <Build sx={{ fontSize: 20, color: theme.custom.color.brandPrimary }} />,
      action: () => navigate("/help"),
      description: t("helpCenterSubtitle"),
      tone: "neutral",
    },
  ];

  const tileTone = (tone) => {
    if (tone === "found") {
      return { bg: theme.custom.status.found.bg, border: theme.custom.status.found.border };
    }
    if (tone === "lost") {
      return { bg: theme.custom.status.lost.bg, border: theme.custom.status.lost.border };
    }
    return { bg: alpha(theme.custom.color.ink, 0.03), border: alpha(theme.custom.color.ink, 0.08) };
  };

  // Admin-only items — surfaced from the avatar menu on desktop, kept as
  // their own section (not folded into Explore) in the mobile drawer.
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
        {/* Left: brand only */}
        <Box sx={{ display: "flex", alignItems: "center", justifySelf: "start", minWidth: 0 }}>
          <LogoButton onClick={onGoHomeClicked}>
            <BrandMark className="brand-mark">
              <img src="/maficonSVG.svg" alt="" loading="lazy" />
            </BrandMark>
            <img
              src="/maflogoSVG.svg"
              alt={t("brandName")}
              loading="lazy"
              style={{ height: "auto", maxHeight: "28px", width: "auto" }}
            />
          </LogoButton>
        </Box>

        {/* Center: Explore + primary CTA, genuinely centered via the grid
            column above rather than whatever space is left over. */}
        <Box sx={{ display: "flex", alignItems: "center", justifySelf: "center", gap: 1 }}>
          {showDesktopNav && (
            <>
              <ExploreTrigger
                ref={exploreAnchorRef}
                onClick={handleExploreToggle}
                isOpen={exploreOpen}
                startIcon={<ExploreIcon sx={{ fontSize: 20, color: theme.custom.color.brandPrimary }} />}
                endIcon={<KeyboardArrowDown className="explore-chevron" sx={{ fontSize: "18px" }} />}
              >
                {t("explore")}
              </ExploreTrigger>

              <Popper
                open={exploreOpen}
                anchorEl={exploreAnchorRef.current}
                placement={isRTL ? "bottom-end" : "bottom-start"}
                transition
                disablePortal={false}
                modifiers={[{ name: "offset", options: { offset: [0, 10] } }]}
                sx={{ zIndex: (theme) => theme.zIndex.drawer + 2, maxWidth: "calc(100vw - 32px)" }}
              >
                {({ TransitionProps, placement }) => (
                  <Grow
                    {...TransitionProps}
                    style={{ transformOrigin: placement.includes("end") ? "top right" : "top left" }}
                    timeout={180}
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        width: 460,
                        borderRadius: `${theme.custom.radius.lg}px`,
                        overflow: "hidden",
                        border: `1px solid ${alpha(theme.custom.color.ink, 0.1)}`,
                        boxShadow: theme.custom.elevation.e3,
                      }}
                    >
                      <ClickAwayListener onClickAway={handleExploreClose}>
                        <Box>
                          <Box sx={{ height: 3, backgroundColor: theme.custom.color.brandPrimary }} />
                          <Box
                            sx={{
                              p: 1.5,
                              display: "grid",
                              gridTemplateColumns: "repeat(2, 1fr)",
                              gap: 1,
                            }}
                          >
                            {navigationItems.map((item) => {
                              const tone = tileTone(item.tone);
                              return (
                                <ExploreTile
                                  key={item.title}
                                  toneBg={tone.bg}
                                  toneBorder={tone.border}
                                  onClick={() => handleExploreItemClick(item)}
                                >
                                  <ExploreTileIcon>{item.icon}</ExploreTileIcon>
                                  <Box sx={{ minWidth: 0 }}>
                                    <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: theme.custom.color.ink }}>
                                      {item.title}
                                    </Typography>
                                    <Typography
                                      sx={{
                                        fontSize: "0.75rem",
                                        color: "text.secondary",
                                        display: "-webkit-box",
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: "vertical",
                                        overflow: "hidden",
                                      }}
                                    >
                                      {item.description}
                                    </Typography>
                                  </Box>
                                </ExploreTile>
                              );
                            })}
                          </Box>
                        </Box>
                      </ClickAwayListener>
                    </Paper>
                  </Grow>
                )}
              </Popper>

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
            </>
          )}
        </Box>

        {/* Right: region/locale + remaining auth actions + utilities */}
        <Box sx={{ display: "flex", alignItems: "center", justifySelf: "end", gap: "10px" }}>
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

          {showDesktopNav && !authLoggedIn && (
            <SecondaryButton onClick={() => navigate("/signup")} startIcon={<PersonAdd sx={{ fontSize: 18 }} />}>
              {t("signup")}
            </SecondaryButton>
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

          {/* Mobile menu button — everything else lives in the drawer below (<760px) */}
          {!showDesktopNav && (
            <ActionButton onClick={() => setMobileDrawerOpen(true)}>
              <MenuIcon sx={{ fontSize: "24px" }} />
            </ActionButton>
          )}
        </Box>

        {/* Combined Region Menu (country search + language) — unchanged. */}
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

        {/* Mobile drawer. Explicit zIndex above theme.zIndex.appBar (which the
            AppBar above is pinned to at drawer+1) — without this the drawer's
            default zIndex.drawer level renders it BEHIND the fixed navbar. */}
        <Drawer
          anchor={currentLanguage === "ar" ? "left" : "right"}
          open={mobileDrawerOpen}
          onClose={handleMobileDrawerClose}
          sx={{ zIndex: (theme) => theme.zIndex.modal }}
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
          )}

          {/* Group: Explore — collapsed by default so the drawer opens short;
              expands to the same browse items as the desktop dropdown. */}
          <DrawerRow onClick={() => setMobileExploreOpen((prev) => !prev)}>
            <ListItemIcon>
              <ExploreIcon sx={{ fontSize: 20, color: theme.custom.color.brandPrimary }} />
            </ListItemIcon>
            <ListItemText primary={t("explore")} primaryTypographyProps={{ fontWeight: 600, fontSize: "1rem" }} />
            <KeyboardArrowDown
              sx={{ fontSize: "20px", transition: "transform 0.2s ease", transform: mobileExploreOpen ? "rotate(180deg)" : "rotate(0deg)" }}
            />
          </DrawerRow>
          <Collapse in={mobileExploreOpen} timeout="auto" unmountOnExit>
            <Box sx={{ paddingInlineStart: 2, borderInlineStart: `2px solid ${alpha(theme.custom.color.ink, 0.08)}`, marginInlineStart: 2, mb: 0.5 }}>
              {navigationItems.map((item) => (
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
                    primaryTypographyProps={{ fontWeight: 600, fontSize: "0.95rem" }}
                    secondaryTypographyProps={{ fontSize: "0.8rem", color: "text.secondary" }}
                  />
                </DrawerRow>
              ))}
            </Box>
          </Collapse>

          {/* Group: Preferences — region/language + theme, visually boxed so
              it reads as one cluster rather than more flat rows. */}
          <Divider sx={{ my: 1.5 }} />
          <Box
            sx={{
              p: 0.5,
              borderRadius: `${theme.custom.radius.md}px`,
              backgroundColor: alpha(theme.custom.color.ink, 0.03),
            }}
          >
            <DrawerRow onClick={handleRegionClick} sx={{ mb: 0.5 }}>
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

            <DrawerRow onClick={handleModeToggle} sx={{ mb: 0 }}>
              <ListItemIcon>
                {mode === "light" ? <DarkModeOutlined sx={{ fontSize: 22 }} /> : <LightModeOutlined sx={{ fontSize: 22 }} />}
              </ListItemIcon>
              <ListItemText
                primary={mode === "light" ? t("darkMode") : t("lightMode")}
                primaryTypographyProps={{ fontWeight: 600, fontSize: "1rem" }}
              />
            </DrawerRow>
          </Box>

          {/* Group: Admin (only for admins) — kept separate from Explore and
              from Account since it's a different kind of action entirely. */}
          {adminNavigationItems.length > 0 && (
            <>
              <Divider sx={{ my: 1.5 }} />
              <Box
                sx={{
                  p: 0.5,
                  borderRadius: `${theme.custom.radius.md}px`,
                  backgroundColor: theme.custom.status.lost.bg,
                }}
              >
                {adminNavigationItems.map((item) => (
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
              </Box>
            </>
          )}

          {/* Group: Account — auth actions grouped together, sign-in/sign-up
              rendered as clear primary/secondary buttons rather than rows. */}
          <Divider sx={{ my: 1.5 }} />
          {authLoggedIn ? (
            <Box
              sx={{
                p: 0.5,
                borderRadius: `${theme.custom.radius.md}px`,
                backgroundColor: alpha(theme.custom.color.ink, 0.03),
              }}
            >
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
                sx={{ mb: 0 }}
              >
                <ListItemIcon>
                  <LogoutOutlined sx={{ fontSize: 22, color: theme.custom.status.lost.main }} />
                </ListItemIcon>
                <ListItemText
                  primary={t("logout")}
                  primaryTypographyProps={{ fontWeight: 600, fontSize: "1rem", color: theme.custom.status.lost.main }}
                />
              </DrawerRow>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <CreatePostButton
                fullWidth
                startIcon={<Login sx={{ fontSize: 18 }} />}
                onClick={() => {
                  handleMobileDrawerClose();
                  navigate("/login");
                }}
              >
                {t("signin")}
              </CreatePostButton>
              <SecondaryButton
                fullWidth
                startIcon={<PersonAdd sx={{ fontSize: 18 }} />}
                onClick={() => {
                  handleMobileDrawerClose();
                  navigate("/signup");
                }}
              >
                {t("signup")}
              </SecondaryButton>
            </Box>
          )}
        </Drawer>
      </StyledToolbar>
    </AppBar>
  );
};

export default Navbar;
