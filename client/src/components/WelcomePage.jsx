import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setCurrentCountry, setMode, selectCurrentCountry } from "../app/state";
import { useGetCountriesQuery, useGetCategoriesQuery } from "../features/dependencies/dependenciesApiSlice"; // Fixed: Use dependenciesApiSlice instead of countriesApiSlice
import { useGetPostsQuery } from "../features/posts/postsApiSlice";
import { useTranslation } from "../utils/translations";
import { useLanguage } from "../utils/languageContext";
import { LoadingState } from "./LoadingStates";
import { languageStorage } from "../utils/authStorage";
import SeoMeta from "./SeoMeta";
import LazyCardMedia from "./LazyCardMedia";
import { getCategoryConfig, getCategoryIcon } from "../config/categories";
import {
  Box,
  Typography,
  Button,
  Grid,
  useTheme,
  alpha,
  styled,
  Autocomplete,
  TextField,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Skeleton,
} from "@mui/material";
import {
  LocationOn,
  ArrowForward,
  ArrowBack,
  Language,
  KeyboardArrowDown,
  DarkModeOutlined,
  LightModeOutlined,
  Login,
  PersonAdd,
  TaskAltOutlined,
  SearchOffOutlined,
  VerifiedUserOutlined,
  PublicOutlined,
  CategoryOutlined,
} from "@mui/icons-material";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3500";

const formatShortDate = (dateString, lang) => {
  try {
    return new Date(dateString).toLocaleDateString(
      lang === "ar" ? "ar-SA" : lang === "fr" ? "fr-FR" : "en-US",
      { month: "short", day: "numeric" }
    );
  } catch (e) {
    return "";
  }
};

// Styled components — all values sourced from theme.custom (Phase 1 tokens)
const PageContainer = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  backgroundColor: theme.custom.color.surfaceBase,
  direction: theme.direction || "ltr",
}));

const TopBar = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  gap: theme.spacing(1),
  padding: theme.spacing(2),
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(1.5),
  },
}));

const ControlButton = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(0.75),
  padding: "8px 14px",
  borderRadius: theme.custom.radius.md,
  cursor: "pointer",
  backgroundColor: theme.custom.color.surfaceRaised,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: theme.custom.elevation.e1,
  transition: "box-shadow 0.2s ease",
  "&:hover": {
    boxShadow: theme.custom.elevation.e2,
  },
}));

const SurfaceCard = styled(Box)(({ theme }) => ({
  backgroundColor: theme.custom.color.surfaceRaised,
  borderRadius: theme.custom.radius.xl,
  boxShadow: theme.custom.elevation.e2,
  border: `1px solid ${theme.palette.divider}`,
}));

// A fanned "hand of cards" stack — each card tilted outward from the center
// card by getFanGeometry() below. Deliberately not a new bespoke card DNA:
// same rounded/elevated/clickable card as the rest of the site, just laid
// out in a fan instead of a row. Category color (from config/categories.js,
// already an established token, not a new palette) fills the card solid so
// each one reads as visually distinct, mirroring the reference's bold-color
// card-stack look without introducing off-brand hues.
// Feed-in timing shared between the styled component's keyframes and the
// mount-timer in WelcomePage that decides when the animation is "done" (see
// heroEntranceArmedRef) — kept in one place so the two stay in sync.
const HERO_ENTRANCE_DURATION_MS = 650;
const HERO_ENTRANCE_STAGGER_MS = 120;

const FannedCard = styled(Box, {
  shouldForwardProp: (prop) => !["tilt", "lift", "isFront", "entranceIndex", "entranceActive"].includes(prop),
})(({ theme, tilt, lift, isFront, entranceIndex, entranceActive }) => {
  const restingTransform = `rotate(${tilt}deg) translateY(${lift}px) scale(${isFront ? 1.05 : 1})`;
  return {
    position: "relative",
    width: 168,
    height: 224,
    flexShrink: 0,
    borderRadius: `${theme.custom.radius.lg}px`,
    overflow: "hidden",
    cursor: "pointer",
    outline: "none",
    border: `1px solid ${alpha("#000000", 0.08)}`,
    boxShadow: isFront ? theme.custom.elevation.e2 : theme.custom.elevation.e1,
    transformOrigin: "bottom center",
    transition: "transform 0.25s ease, box-shadow 0.25s ease",
    marginInlineStart: -20,
    "&:first-of-type": { marginInlineStart: 0 },
    "&:hover, &:focus-visible": {
      transform: "rotate(0deg) translateY(-18px) scale(1.08)",
      boxShadow: theme.custom.elevation.e2,
      zIndex: 30,
    },
    [theme.breakpoints.down("sm")]: {
      width: 140,
      height: 188,
      marginInlineStart: -16,
    },
    // Entrance animation only plays once, right after mount/load (see
    // heroEntranceDone in WelcomePage) — once it's finished this branch
    // stops applying so the plain `transform`/hover rules above take back
    // over exactly at the same resting values the keyframe ends on.
    ...(entranceActive
      ? {
          opacity: 0,
          "@keyframes heroCardFeedIn": {
            "0%": { opacity: 0, transform: "translateY(64px) scale(0.92)" },
            "100%": { opacity: 1, transform: restingTransform },
          },
          animation: `heroCardFeedIn ${HERO_ENTRANCE_DURATION_MS}ms cubic-bezier(0.16, 1, 0.3, 1) ${
            entranceIndex * HERO_ENTRANCE_STAGGER_MS
          }ms both`,
          "@media (prefers-reduced-motion: reduce)": {
            animation: "none",
            opacity: 1,
            transform: restingTransform,
          },
        }
      : { transform: restingTransform }),
  };
});

// Symmetric outward tilt/lift around the middle card, independent of
// LTR/RTL — the fan mirrors automatically because it's built with logical
// flexbox order rather than hardcoded left/right positioning.
const getFanGeometry = (index, count) => {
  const centerIndex = Math.floor((count - 1) / 2);
  const offset = index - centerIndex;
  const isFront = offset === 0;
  return {
    tilt: offset * 6,
    lift: isFront ? -14 : Math.abs(offset) * 16,
    zIndex: 10 - Math.abs(offset),
    isFront,
  };
};

// Solid fill, not a tint — this is the one place on the page saturated color
// should dominate, since Lost vs. Found is the single most load-bearing fact
// about a post. Everything else on the page stays deliberately quieter.
const StatusTag = ({ status, label }) => {
  const theme = useTheme();
  const tone = status === "found" ? theme.custom.status.found : theme.custom.status.lost;
  const Icon = status === "found" ? TaskAltOutlined : SearchOffOutlined;
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        px: 1,
        py: 0.375,
        borderRadius: `${theme.custom.radius.sm}px`,
        backgroundColor: tone.main,
      }}
    >
      <Icon sx={{ fontSize: 14, color: theme.palette.getContrastText(tone.main) }} />
      <Typography
        variant="caption"
        sx={{ fontWeight: 700, letterSpacing: 0.3, color: theme.palette.getContrastText(tone.main), lineHeight: 1 }}
      >
        {label}
      </Typography>
    </Box>
  );
};

// Per-item scatter: vertical resting offset, tilt, size, and float timing
// vary across items so they read as a loosely scattered "mix" rather than a
// uniform row — a fixed, repeating sequence (not random) so the layout is
// stable across re-renders/languages and however many real categories load.
const CATEGORY_SCATTER = [
  { yOffset: 0, rotate: -6, size: "lg", duration: 4.2, delay: 0 },
  { yOffset: 20, rotate: 4, size: "md", duration: 3.6, delay: 0.4 },
  { yOffset: -14, rotate: -3, size: "sm", duration: 5, delay: 0.8 },
  { yOffset: 14, rotate: 6, size: "lg", duration: 4.6, delay: 0.2 },
  { yOffset: -8, rotate: -5, size: "md", duration: 3.9, delay: 0.6 },
  { yOffset: 10, rotate: 3, size: "sm", duration: 4.4, delay: 1 },
];
const CATEGORY_TILE_SIZE = { sm: 56, md: 68, lg: 80 };
const CATEGORY_ICON_SIZE = { sm: 22, md: 27, lg: 32 };

// A gently bobbing "icon cloud" rather than a static row — each tile floats
// on its own independent timer (see CATEGORY_SCATTER) so the group never
// moves in lockstep. Purely decorative motion: paused on hover for a clear
// interactive cue, and dropped entirely under prefers-reduced-motion.
const FloatingCategoryTile = styled(Box, {
  shouldForwardProp: (prop) => !["yOffset", "rotateDeg", "duration", "delay"].includes(prop),
})(({ yOffset, rotateDeg, duration, delay }) => ({
  "@keyframes categoryFloat": {
    "0%, 100%": { transform: `translateY(${yOffset}px) rotate(${rotateDeg}deg)` },
    "50%": { transform: `translateY(${yOffset - 12}px) rotate(${rotateDeg}deg)` },
  },
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 6,
  transform: `translateY(${yOffset}px) rotate(${rotateDeg}deg)`,
  animation: `categoryFloat ${duration}s ease-in-out ${delay}s infinite`,
  transition: "transform 0.25s ease",
  "&:hover": {
    animationPlayState: "paused",
    transform: `translateY(${yOffset - 6}px) rotate(0deg) scale(1.08)`,
  },
  "@media (prefers-reduced-motion: reduce)": {
    animation: "none",
  },
}));

const WelcomePage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t, currentLanguage } = useTranslation();
  const { currentLanguage: langContext, setLanguage } = useLanguage();
  const activeLanguage = currentLanguage || langContext || "en";
  const isRTL = activeLanguage === "ar";

  const [selectedCountry, setSelectedCountry] = useState(null);
  const [languageAnchorEl, setLanguageAnchorEl] = useState(null);

  // Get mode from Redux store
  const mode = useSelector((state) => state.global.mode);

  // Persisted country choice (only ever written by handleContinue below, on
  // explicit user confirmation) — used only to gate whether we bother doing
  // an IP-geolocation lookup at all; never written to by that lookup.
  const persistedCurrentCountry = useSelector(selectCurrentCountry);
  const [geoCountryCode, setGeoCountryCode] = useState(null);
  // Tracks explicit user interaction with the picker so a late-arriving geo
  // match never clobbers a choice the user already made by hand.
  const userSelectedCountryRef = useRef(false);
  const geoAppliedRef = useRef(false);

  // Get countries list - Fixed: Use dependenciesApiSlice and proper error handling
  const { data: countriesData, error: countriesError, isLoading: countriesLoading } = useGetCountriesQuery({
    language: activeLanguage
  }, {
    selectFromResult: ({ data, error, isLoading }) => ({
      data: data?.ids?.map((id) => data?.entities[id]) || [],
      error,
      isLoading
    }),
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
    { _id: '68b0b774dcafb50aec949f4e', code: 'MA', label: 'Morocco', labels: { en: 'MA', ar: 'MA', fr: 'MA' }, names: { en: 'Morocco', ar: 'المغرب', fr: 'Maroc' }, flag: '🇲🇦', isActive: true },
  ];

  // Use countries from API or fallback
  const countries = countriesData?.length > 0 ? countriesData : fallbackCountries;

  // Real, live category list — drives both the coverage stat and the
  // "browse by category" strip below, so neither is capped at a hardcoded
  // subset of categories.
  const { data: categoriesData } = useGetCategoriesQuery({ language: activeLanguage }, {
    selectFromResult: ({ data }) => ({ data: data?.ids?.map((id) => data?.entities[id]) || [] }),
  });

  // Pre-select the first available country so the hero can show real, local
  // content immediately — still fully editable via the selector below. The
  // fallback list's id is a hardcoded placeholder that won't match a real
  // country document, so once the real API data loads, swap out a selection
  // that came from the fallback for the real first country — otherwise the
  // hero stays locked onto a country id that returns zero posts forever.
  const hasRealCountries = countriesData?.length > 0;
  useEffect(() => {
    if (countries.length === 0) return;
    setSelectedCountry((prev) => {
      if (!prev) return countries[0];
      if (!hasRealCountries) return prev;
      const isFallbackSelection = fallbackCountries.some((fc) => fc._id === prev._id);
      return isFallbackSelection ? countries[0] : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countries.length, hasRealCountries]);

  // First-visit-only IP geolocation pre-selection. This never writes to the
  // Redux `global` slice / localStorage — it only nudges the local
  // `selectedCountry` UI state above, so the user still has to click Continue
  // to confirm exactly as before. `persistedCurrentCountry` is read once at
  // mount (deliberately not a dep here) to decide whether a lookup is even
  // warranted: if the user already has a country choice persisted, skip the
  // network call entirely rather than second-guessing it.
  useEffect(() => {
    if (persistedCurrentCountry) return;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    fetch("https://ipwho.is/", { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.success !== false && data.country_code) {
          setGeoCountryCode(data.country_code);
        }
      })
      .catch(() => {
        // Silent fail by design: timeout, network error, or malformed
        // response should never surface to the user — the picker just shows
        // with no preselection.
      })
      .finally(() => clearTimeout(timeoutId));

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply the geo match once both the lookup and the real countries list
  // have resolved, and only if the user hasn't already picked (or started
  // picking) something themselves. Runs after the countries[0] default-select
  // effect above, so a match here overrides that placeholder default.
  useEffect(() => {
    if (!geoCountryCode) return;
    if (geoAppliedRef.current) return;
    if (userSelectedCountryRef.current) return;
    if (!hasRealCountries) return;

    const match = countriesData.find(
      (c) => c.code && c.code.toUpperCase() === geoCountryCode.toUpperCase()
    );
    geoAppliedRef.current = true;
    if (match) {
      setSelectedCountry(match);
    }
    // countriesData/countries change identity each render (see fallback
    // effect above); gate on primitive counts instead to avoid re-running.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geoCountryCode, hasRealCountries]);

  const getCountryName = (option) => {
    if (!option) return '';
    if (option.names && option.names[activeLanguage]) {
      return option.names[activeLanguage];
    }
    if (option.labels && option.labels[activeLanguage]) {
      const label = option.labels[activeLanguage];
      if (label && label.length === 2 && label === label.toUpperCase()) {
        return countryCodeToName[label]?.[activeLanguage] || option.code;
      }
      return label;
    }
    if (option.code && countryCodeToName[option.code]) {
      return countryCodeToName[option.code][activeLanguage] || option.code;
    }
    return option.label || option.code;
  };

  // Live snapshot of a few recent posts for the selected country — the hero's
  // proof that the platform is active and local, not a marketing claim.
  const {
    data: heroPostsData,
    isLoading: heroPostsLoading,
  } = useGetPostsQuery({
    pageSize: 3,
    currentCountry: selectedCountry?._id,
    language: activeLanguage,
    fl: ''
  }, {
    skip: !selectedCountry?._id
  });
  // The endpoint returns { postsWithUser, page, totalPages, total } — not an
  // entity-adapter { ids, entities } shape (see PublicPostsPage.jsx / TrendingItem.jsx).
  const heroPosts = heroPostsData?.postsWithUser || [];

  // One-time "feed in" entrance for the fanned hero cards: staggered by
  // index so they slide up into place one after another instead of popping
  // in together. Guarded by a ref (not just the `animationDone` state) so a
  // later refetch of heroPosts — e.g. switching selectedCountry — never
  // re-arms the timer and replays the animation; it only ever plays once,
  // on the first successful load.
  const [heroEntranceDone, setHeroEntranceDone] = useState(false);
  const heroEntranceArmedRef = useRef(false);
  useEffect(() => {
    if (heroPostsLoading || heroPosts.length === 0 || heroEntranceArmedRef.current) return;
    heroEntranceArmedRef.current = true;
    const totalMs = HERO_ENTRANCE_DURATION_MS + (heroPosts.length - 1) * HERO_ENTRANCE_STAGGER_MS + 100;
    const timer = setTimeout(() => setHeroEntranceDone(true), totalMs);
    return () => clearTimeout(timer);
  }, [heroPostsLoading, heroPosts.length]);

  const getHeroPostStatus = (post) => {
    const code = post.Floptions?.[0]?.code;
    if (code) return code.toLowerCase();
    if (typeof post.foundLost === 'string' && ['found', 'lost'].includes(post.foundLost.toLowerCase())) {
      return post.foundLost.toLowerCase();
    }
    return 'found';
  };

  const getHeroPostCategoryCode = (post) => {
    if (post.Categories?.length > 0) return post.Categories[0].code;
    if (post.Category?.code) return post.Category.code;
    return post.categoryname || 'OTHER';
  };

  const getHeroPostCategoryLabel = (post, categoryCode) => {
    const labels = post.Categories?.[0]?.labels || post.Category?.labels || post.categoryLabels;
    if (labels && typeof labels === 'object') {
      const label = labels[activeLanguage] || labels.en;
      if (label && label.trim()) return label.trim();
    }
    return categoryCode;
  };

  // Posts have no "title" field — mirror TrendingItem/PublicPostsPage's city
  // resolution chain, falling back to exactLocation.
  const getHeroPostCityName = (post) => {
    if (post.cityLabels && typeof post.cityLabels === 'object') {
      const label = post.cityLabels[activeLanguage] || post.cityLabels.en;
      if (label && label.trim()) return label.trim();
    }
    if (post.city && typeof post.city === 'object' && post.city.labels) {
      const label = post.city.labels[activeLanguage] || post.city.labels.en;
      if (label && label.trim()) return label.trim();
    }
    if (post.cityName && typeof post.cityName === 'string' && post.cityName.trim()) return post.cityName.trim();
    if (post.exactLocation) {
      const first = post.exactLocation.split(',')[0].split('(')[0].replace(/\d+/g, '').trim();
      if (first) return first;
    }
    return t('unknownCity');
  };

  const getHeroPostImageUrl = (post) => {
    if (!post.image) return null;
    return post.image.startsWith('http') ? post.image : `${API_BASE_URL}/${post.image}`;
  };

  const handleCountrySelect = (_, value) => {
    userSelectedCountryRef.current = true;
    setSelectedCountry(value);
  };

  const handleContinue = () => {
    if (selectedCountry) {
      // Use the selected country ID directly
      const countryId = selectedCountry._id;
      dispatch(setCurrentCountry({ currentCountry: countryId }));

      // Check if there's a redirect URL stored after country selection
      const redirectUrl = localStorage.getItem('redirectAfterCountrySelection');
      if (redirectUrl) {
        localStorage.removeItem('redirectAfterCountrySelection');
        navigate(redirectUrl);
      } else {
        // Navigate to posts list page
        navigate('/dash');
      }
    }
  };

  const handleViewHeroPost = (post) => {
    if (!selectedCountry?._id) return;
    dispatch(setCurrentCountry({ currentCountry: selectedCountry._id }));
    navigate(`/dash/posts/${post._id}`);
  };

  const handleLanguageChange = (newLanguage) => {
    // Use centralized language storage utility with page refresh
    languageStorage.setLanguage(newLanguage, true); // true = refresh page
    setLanguage(newLanguage);
    setLanguageAnchorEl(null);
    window.dispatchEvent(new Event('languageChange'));
  };

  const handleLanguageClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setLanguageAnchorEl(event.currentTarget);
  };

  const handleLanguageClose = () => {
    setLanguageAnchorEl(null);
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

  const seoMetadata = <SeoMeta pageKey="home" />;

  // Show the site loading state until countries have actually been fetched —
  // countries falls back to a placeholder list while loading, so gating on
  // countriesLoading itself (not countries.length) is what keeps the welcome
  // page from rendering against fake data.
  if (countriesLoading) {
    return (
      <>
        {seoMetadata}
        <LoadingState message={t('loadingCountries')} />
      </>
    );
  }

  // If there's an error but we have some countries, still show the page
  // If no countries at all, show a fallback
  if (countriesError && countries.length === 0) {
    return (
      <>
        {seoMetadata}
        <PageContainer sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
          <SurfaceCard sx={{ maxWidth: 480, width: '100%', p: 4 }}>
            <Typography variant="h6" color="error" align="center">
              {t('errorLoadingCountries')}
            </Typography>
            <Button
              variant="contained"
              onClick={() => window.location.reload()}
              sx={{ mt: 2, display: 'block', mx: 'auto', bgcolor: theme.custom.color.brandPrimary }}
            >
              Retry
            </Button>
          </SurfaceCard>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      {seoMetadata}
      <PageContainer>
        {/* Top controls: language + dark/light mode */}
        <TopBar>
          <ControlButton id="language-selector" onClick={handleLanguageClick}>
            <Language sx={{ fontSize: 20, color: 'text.secondary' }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {getLanguageDisplayName(activeLanguage)}
            </Typography>
            <KeyboardArrowDown sx={{ fontSize: 18, color: 'text.secondary' }} />
          </ControlButton>

          <IconButton
            onClick={handleModeToggle}
            sx={{
              backgroundColor: theme.custom.color.surfaceRaised,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: theme.custom.elevation.e1,
              borderRadius: `${theme.custom.radius.md}px`,
              '&:hover': { boxShadow: theme.custom.elevation.e2 },
            }}
          >
            {mode === 'light' ? <DarkModeOutlined /> : <LightModeOutlined />}
          </IconButton>
        </TopBar>

        <Menu
          anchorEl={languageAnchorEl}
          open={Boolean(languageAnchorEl)}
          onClose={handleLanguageClose}
          transformOrigin={{ horizontal: isRTL ? 'left' : 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: isRTL ? 'left' : 'right', vertical: 'bottom' }}
        >
          {['en', 'ar', 'fr'].map((lng) => (
            <MenuItem key={lng} onClick={() => handleLanguageChange(lng)} sx={{ minWidth: 140 }}>
              <ListItemIcon>
                <Language sx={{ fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText primary={getLanguageDisplayName(lng)} />
            </MenuItem>
          ))}
        </Menu>

        {/* Hero */}
        <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 }, pt: { xs: 2, md: 4 }, pb: 6 }}>
          {/* The whole left block (logo, headline, subtext, selector, CTA) is
              one flex column running inline/side-by-side with "Recently
              posted near you" — both Grid items start at the same top row
              via alignItems="flex-start" rather than the logo/headline
              sitting full-width above the two-column split. */}
          <Grid container spacing={{ xs: 4, md: 6 }} alignItems="flex-start">
            <Grid item xs={12} md={5}>
              <Box
                component="img"
                src="/maflogoSVG.svg"
                alt="Mafqoudat"
                sx={{
                  height: { xs: '38px', md: '48px' },
                  width: 'auto',
                  display: 'block',
                  mb: { xs: 3, md: 5 },
                  filter: theme.palette.mode === 'dark' ? 'brightness(1.1) contrast(1.1)' : 'none',
                }}
              />

              <Typography
                variant="h1"
                sx={{ fontSize: { xs: '2rem', md: '2.5rem' }, mb: 2 }}
              >
                {t('heroHeadline')}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                {t('welcomeMessage')}
              </Typography>

              <Autocomplete
                options={countries || []}
                autoHighlight
                disableClearable
                value={selectedCountry}
                onChange={handleCountrySelect}
                getOptionLabel={getCountryName}
                isOptionEqualToValue={(option, value) => option._id === value._id}
                renderOption={(props, option) => (
                  <Box component="li" sx={{ "& > img": { marginInlineEnd: 2, flexShrink: 0 } }} {...props}>
                    {option.flag ? (
                      <span style={{ marginInlineEnd: 8, fontSize: '20px' }}>{option.flag}</span>
                    ) : (
                      <img
                        loading="lazy"
                        width="20"
                        src={`https://flagcdn.com/w20/${option.code.toLowerCase()}.png`}
                        srcSet={`https://flagcdn.com/w40/${option.code.toLowerCase()}.png 2x`}
                        alt=""
                      />
                    )}
                    {getCountryName(option)} ({option.code})
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('chooseCountry')}
                    variant="outlined"
                    fullWidth
                    sx={{
                      mb: 2,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: `${theme.custom.radius.md}px`,
                        backgroundColor: theme.custom.color.surfaceRaised,
                      },
                    }}
                    inputProps={{ ...params.inputProps, autoComplete: "new-password" }}
                  />
                )}
              />

              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5 }}>
                <Button
                  variant="contained"
                  size="large"
                  disabled={countriesLoading || !selectedCountry}
                  onClick={handleContinue}
                  endIcon={isRTL ? <ArrowBack /> : <ArrowForward />}
                  sx={{
                    py: 1.5,
                    borderRadius: `${theme.custom.radius.md}px`,
                    fontWeight: 600,
                    bgcolor: theme.custom.color.brandPrimary,
                    color: theme.palette.getContrastText(theme.custom.color.brandPrimary),
                    boxShadow: theme.custom.elevation.e1,
                    '&:hover': {
                      bgcolor: theme.custom.color.brandPrimary,
                      opacity: 0.9,
                      boxShadow: theme.custom.elevation.e2,
                    },
                  }}
                >
                  {t('browseNearYou')}
                </Button>
              </Box>
            </Grid>

            {/* Live post snapshot — fanned card stack */}
            <Grid item xs={12} md={7}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'flex-end',
                  flexWrap: 'nowrap',
                  // overflowX:'auto' paired with overflowY:'visible' isn't valid per the
                  // CSS overflow spec — a non-'visible' value on one axis forces the other
                  // to compute as 'auto' too, so this was silently clipping the fan
                  // vertically (cutting off the permanently-raised front card's top edge,
                  // and clipping further on hover-lift). Instead of fighting that, the
                  // container just gets enough top/bottom headroom that the tilt/lift/scale
                  // transforms never need to escape its box in the first place.
                  overflowX: 'auto',
                  pt: 6,
                  pb: 3,
                  px: { xs: 3, sm: 1 },
                }}
              >
                {heroPostsLoading ? (
                  [0, 1, 2].map((i) => {
                    const { tilt, lift, zIndex } = getFanGeometry(i, 3);
                    return (
                      <FannedCard key={i} tilt={tilt} lift={lift} isFront={false} sx={{ zIndex }}>
                        <Skeleton variant="rectangular" sx={{ width: '100%', height: '100%' }} />
                      </FannedCard>
                    );
                  })
                ) : heroPosts.length > 0 ? (
                  heroPosts.map((post, index) => {
                    const status = getHeroPostStatus(post);
                    const tone = status === 'found' ? theme.custom.status.found : theme.custom.status.lost;
                    const categoryCode = getHeroPostCategoryCode(post);
                    const FallbackIcon = getCategoryIcon(categoryCode);
                    const categoryStyle = getCategoryConfig(categoryCode);
                    const imageUrl = getHeroPostImageUrl(post);
                    const cityName = getHeroPostCityName(post);
                    const categoryLabel = getHeroPostCategoryLabel(post, categoryCode);
                    const { tilt, lift, zIndex, isFront } = getFanGeometry(index, heroPosts.length);
                    const cardColor = categoryStyle?.color || tone.main;
                    const textColor = imageUrl ? '#FFFFFF' : theme.palette.getContrastText(cardColor);
                    return (
                      <FannedCard
                        key={post._id}
                        tilt={tilt}
                        lift={lift}
                        isFront={isFront}
                        entranceActive={!heroEntranceDone}
                        entranceIndex={index}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleViewHeroPost(post)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleViewHeroPost(post);
                          }
                        }}
                        sx={{ zIndex, backgroundColor: cardColor }}
                      >
                        {imageUrl ? (
                          <LazyCardMedia
                            image={imageUrl}
                            alt={cityName}
                            sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          FallbackIcon && (
                            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <FallbackIcon sx={{ fontSize: 64, color: textColor, opacity: 0.9 }} />
                            </Box>
                          )
                        )}

                        {imageUrl && (
                          <Box
                            sx={{
                              position: 'absolute',
                              inset: 0,
                              background: `linear-gradient(to top, ${alpha('#000000', 0.6)} 0%, ${alpha('#000000', 0.05)} 45%, ${alpha('#000000', 0.45)} 100%)`,
                            }}
                          />
                        )}

                        <Box sx={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 1.25 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 0.5 }}>
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: 800,
                                color: textColor,
                                lineHeight: 1.15,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                flex: '1 1 auto',
                                minWidth: 44,
                              }}
                            >
                              {categoryLabel}
                            </Typography>
                            <Box sx={{ flexShrink: 0 }}>
                              <StatusTag status={status} label={t(status)} />
                            </Box>
                          </Box>

                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 0.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                                <LocationOn sx={{ fontSize: 13, color: textColor, flexShrink: 0, opacity: 0.9 }} />
                                <Typography
                                  variant="caption"
                                  sx={{ color: textColor, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                >
                                  {cityName}
                                </Typography>
                              </Box>
                              <Typography variant="caption" sx={{ color: alpha(textColor, 0.8), flexShrink: 0 }}>
                                {formatShortDate(post.createdAt, activeLanguage)}
                              </Typography>
                            </Box>
                            {isFront && (
                              <Box
                                sx={{
                                  mt: 1,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                  px: 1.25,
                                  py: 0.5,
                                  borderRadius: 999,
                                  backgroundColor: alpha('#FFFFFF', 0.92),
                                  // This pill is always near-white regardless of theme mode (it
                                  // sits on the category color, not the page background), so its
                                  // text needs a color computed from that fixed background rather
                                  // than theme.custom.color.ink — which flips to near-white in
                                  // dark mode and would disappear here.
                                  color: theme.palette.getContrastText('#FFFFFF'),
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                }}
                              >
                                {t('viewPost')}
                                {isRTL ? <ArrowBack sx={{ fontSize: 13 }} /> : <ArrowForward sx={{ fontSize: 13 }} />}
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </FannedCard>
                    );
                  })
                ) : (
                  <SurfaceCard sx={{ p: 3, textAlign: 'center', width: '100%' }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('noPostsInArea')}
                    </Typography>
                  </SurfaceCard>
                )}
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Coverage stats */}
        <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 }, pt: { xs: 1, md: 2 }, pb: { xs: 4, md: 6 } }}>
          <SurfaceCard sx={{ p: { xs: 2.5, md: 3 } }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: 'center',
                justifyContent: 'center',
                gap: { xs: 2, sm: 5 },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PublicOutlined sx={{ color: 'text.secondary' }} />
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {countries.length === 1
                    ? t('platformCountriesStatOne')
                    : t('platformCountriesStat', { count: countries.length })}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CategoryOutlined sx={{ color: 'text.secondary' }} />
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {t('platformCategoriesStat', { count: categoriesData.length })}
                </Typography>
              </Box>
            </Box>
          </SurfaceCard>
        </Box>

        {/* Browse by category */}
        <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 }, pb: { xs: 4, md: 6 } }}>
          <Typography variant="h5" sx={{ mb: 3 }}>
            {t('browseByCategory')}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center',
              rowGap: 4,
              columnGap: { xs: 3, sm: 5 },
              py: 3,
            }}
          >
            {categoriesData.map((category, index) => {
              // Sourced from config/categories.js's CATEGORY_CONFIG (same helper
              // Categories.jsx in the dashboard uses) rather than the legacy
              // theme.palette.categories block — that block's keys are stale
              // (e.g. "luggagecate"/"gamingcate") and don't cover every real
              // category code, so BAGS/BOOKS/CAMERAS/GLASSES/HEADPHONES fell
              // back to a plain grey tile instead of their real color.
              const categoryStyle = getCategoryConfig(category.code);
              const tint = categoryStyle.color;
              const CategoryIcon = getCategoryIcon(category.code);
              const label = category.labels?.[activeLanguage] || category.labels?.en || category.code;
              const { yOffset, rotate, size, duration, delay } = CATEGORY_SCATTER[index % CATEGORY_SCATTER.length];
              return (
                <FloatingCategoryTile
                  key={category._id}
                  yOffset={yOffset}
                  rotateDeg={rotate}
                  duration={duration}
                  delay={delay}
                  onClick={selectedCountry ? handleContinue : undefined}
                  sx={{ cursor: selectedCountry ? 'pointer' : 'default' }}
                >
                  <Box
                    sx={{
                      width: CATEGORY_TILE_SIZE[size],
                      height: CATEGORY_TILE_SIZE[size],
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: categoryStyle.backgroundColor,
                      border: `1px solid ${theme.palette.divider}`,
                      boxShadow: theme.custom.elevation.e1,
                    }}
                  >
                    <CategoryIcon sx={{ color: tint, fontSize: CATEGORY_ICON_SIZE[size] }} />
                  </Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, textAlign: 'center', color: theme.palette.text.primary }}>
                    {label}
                  </Typography>
                </FloatingCategoryTile>
              );
            })}
          </Box>
        </Box>

        {/* Safety / trust */}
        <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 }, pb: { xs: 4, md: 6 } }}>
          <SurfaceCard
            sx={{
              p: { xs: 2.5, md: 3 },
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'flex-start', sm: 'center' },
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
              <VerifiedUserOutlined sx={{ color: 'text.secondary', mt: 0.5 }} />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {t('securePlatform')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('securePlatformDesc')}
                </Typography>
              </Box>
            </Box>
            <Button
              variant="text"
              onClick={() => navigate('/safety')}
              sx={{ fontWeight: 600, color: theme.custom.color.brandPrimary, flexShrink: 0 }}
            >
              {t('viewSafetyTips')}
            </Button>
          </SurfaceCard>
        </Box>

        {/* Already have an account */}
        <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 }, pb: { xs: 6, md: 8 }, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('alreadyHaveAccount')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<Login />}
              onClick={() => navigate('/login')}
              sx={{
                borderRadius: `${theme.custom.radius.md}px`,
                borderColor: theme.custom.color.brandPrimary,
                color: theme.custom.color.brandPrimary,
              }}
            >
              {t('signin')}
            </Button>
            <Button
              variant="text"
              startIcon={<PersonAdd />}
              onClick={() => navigate('/signup')}
              sx={{ borderRadius: `${theme.custom.radius.md}px`, color: theme.custom.color.brandPrimary }}
            >
              {t('signup')}
            </Button>
          </Box>
        </Box>
      </PageContainer>
    </>
  );
};

export default WelcomePage;
