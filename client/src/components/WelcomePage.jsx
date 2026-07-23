import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setCurrentCountry, setMode } from "../app/state";
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
  PhoneAndroidOutlined,
  ArticleOutlined,
  AccountBalanceWalletOutlined,
  KeyOutlined,
  DirectionsCarOutlined,
  LuggageOutlined,
} from "@mui/icons-material";

// Categories shown in the "browse by category" strip. Rendered directly
// (not via RenderIcon) — RenderIcon's name-matching routes anything
// containing "cate" through config/categories.js's separate hardcoded
// palette rather than theme.palette.categories, which silently produced
// the wrong icon for names that don't happen to match its plural keys.
// themeKey pairs with theme.palette.categories in client/src/theme.js.
const CATEGORY_SHOWCASE = [
  { themeKey: "devicecate", Icon: PhoneAndroidOutlined, labelKey: "devices" },
  { themeKey: "documentcate", Icon: ArticleOutlined, labelKey: "document" },
  { themeKey: "walletcate", Icon: AccountBalanceWalletOutlined, labelKey: "wallet" },
  { themeKey: "keyscate", Icon: KeyOutlined, labelKey: "keys" },
  { themeKey: "vehiclecate", Icon: DirectionsCarOutlined, labelKey: "vehicle" },
  { themeKey: "bagcate", Icon: LuggageOutlined, labelKey: "bag" },
];

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

const HeroPostCard = styled(Box)(({ theme, tone }) => ({
  display: "flex",
  flexDirection: "column",
  backgroundColor: theme.custom.color.surfaceRaised,
  borderRadius: theme.custom.radius.lg,
  boxShadow: theme.custom.elevation.e1,
  border: `1px solid ${theme.palette.divider}`,
  borderInlineStart: `6px solid ${tone}`,
  overflow: "hidden",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
  "&:hover": {
    transform: "translateY(-3px)",
    boxShadow: theme.custom.elevation.e2,
  },
}));

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

const SectionEyebrow = ({ children }) => (
  <Typography
    variant="overline"
    sx={{ fontWeight: 600, letterSpacing: 1, color: "text.secondary" }}
  >
    {children}
  </Typography>
);

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

  // Real, live category count for the coverage stat below (not a static/guessed number)
  const { data: categoriesData } = useGetCategoriesQuery({ language: activeLanguage }, {
    selectFromResult: ({ data }) => ({ data: data?.ids?.length || 0 }),
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

  const handleReportItem = () => {
    if (selectedCountry) {
      dispatch(setCurrentCountry({ currentCountry: selectedCountry._id }));
      navigate('/dash/posts/new');
    }
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

  // Show loading state only if we're actively loading and have no data
  if (countriesLoading && countries.length === 0) {
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

          <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
            {/* Headline + country + CTAs */}
            <Grid item xs={12} md={5}>
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
                  disabled={!selectedCountry}
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
                <Button
                  variant="outlined"
                  size="large"
                  disabled={!selectedCountry}
                  onClick={handleReportItem}
                  sx={{
                    py: 1.5,
                    borderRadius: `${theme.custom.radius.md}px`,
                    fontWeight: 600,
                    borderColor: theme.custom.color.brandPrimary,
                    color: theme.custom.color.brandPrimary,
                  }}
                >
                  {t('addNewPost')}
                </Button>
              </Box>
            </Grid>

            {/* Live post snapshot */}
            <Grid item xs={12} md={7}>
              <SectionEyebrow>{t('recentNearYou')}</SectionEyebrow>
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                {heroPostsLoading ? (
                  [0, 1, 2].map((i) => (
                    <Grid item xs={12} sm={4} key={i}>
                      <Skeleton
                        variant="rounded"
                        height={220}
                        sx={{ borderRadius: `${theme.custom.radius.lg}px` }}
                      />
                    </Grid>
                  ))
                ) : heroPosts.length > 0 ? (
                  heroPosts.map((post) => {
                    const status = getHeroPostStatus(post);
                    const tone = status === 'found' ? theme.custom.status.found : theme.custom.status.lost;
                    const categoryCode = getHeroPostCategoryCode(post);
                    const FallbackIcon = getCategoryIcon(categoryCode);
                    const categoryStyle = getCategoryConfig(categoryCode);
                    const imageUrl = getHeroPostImageUrl(post);
                    const cityName = getHeroPostCityName(post);
                    const categoryLabel = getHeroPostCategoryLabel(post, categoryCode);
                    return (
                      <Grid item xs={12} sm={4} key={post._id}>
                        <HeroPostCard tone={tone.main}>
                          {imageUrl ? (
                            <LazyCardMedia
                              image={imageUrl}
                              alt={cityName}
                              sx={{ height: 100, width: '100%' }}
                            />
                          ) : (
                            <Box
                              sx={{
                                height: 100,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: categoryStyle?.backgroundColor || alpha(tone.main, 0.06),
                              }}
                            >
                              {FallbackIcon && (
                                <FallbackIcon sx={{ fontSize: 36, color: categoryStyle?.color || tone.main, opacity: 0.85 }} />
                              )}
                            </Box>
                          )}
                          <Box sx={{ p: 1.5 }}>
                            <Box sx={{ mb: 1 }}>
                              <StatusTag status={status} label={t(status)} />
                            </Box>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                mb: 0.5,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {categoryLabel}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                                <LocationOn sx={{ fontSize: 14, color: 'text.secondary', flexShrink: 0 }} />
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                >
                                  {cityName}
                                </Typography>
                              </Box>
                              <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                                {formatShortDate(post.createdAt, activeLanguage)}
                              </Typography>
                            </Box>
                          </Box>
                        </HeroPostCard>
                      </Grid>
                    );
                  })
                ) : (
                  <Grid item xs={12}>
                    <SurfaceCard sx={{ p: 3, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        {t('noPostsInArea')}
                      </Typography>
                    </SurfaceCard>
                  </Grid>
                )}
              </Grid>
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
                  {t('platformCategoriesStat', { count: categoriesData || CATEGORY_SHOWCASE.length })}
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
              gap: 1.5,
              overflowX: 'auto',
              pb: 1,
              '&::-webkit-scrollbar': { height: 6 },
            }}
          >
            {CATEGORY_SHOWCASE.map((cat) => {
              const cateColors = theme.palette.categories?.[cat.themeKey];
              // categories[].back/icon are fixed pastel/saturated tones, not
              // mode-adaptive — so the label uses the same saturated icon
              // color rather than the theme's default (light-in-dark-mode)
              // text color, which would go low-contrast on the pastel chip.
              const tint = cateColors?.icon || theme.palette.text.primary;
              return (
                <Box
                  key={cat.themeKey}
                  onClick={selectedCountry ? handleContinue : undefined}
                  sx={{
                    flex: '0 0 auto',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0.75,
                    p: 2,
                    minWidth: 96,
                    borderRadius: `${theme.custom.radius.md}px`,
                    backgroundColor: cateColors?.back || theme.custom.color.surfaceRaised,
                    cursor: selectedCountry ? 'pointer' : 'default',
                    border: `1px solid ${theme.palette.divider}`,
                    transition: 'transform 0.2s ease',
                    '&:hover': selectedCountry ? { transform: 'translateY(-2px)' } : {},
                  }}
                >
                  <cat.Icon sx={{ color: tint, fontSize: 26 }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, textAlign: 'center', color: tint }}>
                    {t(cat.labelKey)}
                  </Typography>
                </Box>
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
