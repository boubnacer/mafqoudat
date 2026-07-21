import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useGetPostsQuery } from "../features/posts/postsApiSlice";
import { useGetCountriesQuery } from "../features/countries/countriesApiSlice";
import { selectCurrentCountry, setCurrentCountry, setMode } from "../app/state";
import { useTranslation } from "../utils/translations";
import { useUnifiedLanguageChange } from "../hooks/useUnifiedLanguageChange";
import LazyCardMedia from "./LazyCardMedia";
import RenderIcon from "./RenderIcon";
import SeoMeta from "./SeoMeta";
import ExternalResults from "../features/externalSearch/ExternalResults";
import { formatDistanceToNow } from "date-fns";
import { ar, fr, enUS } from "date-fns/locale";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  alpha,
  styled,
  AppBar,
  Toolbar,
  IconButton,
  Autocomplete,
  ListItemIcon,
  ListItemText,
  Menu,
  ToggleButton,
  ToggleButtonGroup,
  Skeleton,
} from "@mui/material";
import {
  Search,
  LocationOn,
  Category,
  Visibility,
  Login,
  Add,
  Language,
  KeyboardArrowDown,
  TaskAltOutlined,
  SearchOffOutlined,
} from "@mui/icons-material";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3500";

// Styled components — all values sourced from theme.custom (Phase 1 tokens),
// mirroring the signature established in WelcomePage.jsx: solid-fill status
// tag + tone-colored borderInlineStart, everything else deliberately quiet.
const PageContainer = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  backgroundColor: theme.custom.color.surfaceBase,
  paddingTop: theme.spacing(8),
  direction: theme.direction || "ltr",
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

const FilterBar = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: theme.spacing(1.5),
  padding: theme.spacing(2),
  marginBottom: theme.spacing(3),
  backgroundColor: theme.custom.color.surfaceRaised,
  borderRadius: theme.custom.radius.lg,
  boxShadow: theme.custom.elevation.e1,
  border: `1px solid ${theme.palette.divider}`,
  [theme.breakpoints.up("sm")]: {
    position: "sticky",
    top: 64,
    zIndex: 10,
  },
}));

const PostCard = styled(Card)(({ theme, tone }) => ({
  height: "100%",
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
    transform: "translateY(-4px)",
    boxShadow: theme.custom.elevation.e2,
  },
}));

const MediaFrame = styled(Box)(({ theme }) => ({
  position: "relative",
  width: "100%",
  paddingTop: "75%",
  overflow: "hidden",
  backgroundColor: theme.custom.color.surfaceBase,
}));

// Solid fill, not a tint — the one place saturated color should dominate,
// since Lost vs. Found is the single most load-bearing fact about a post.
const StatusTag = ({ status, label }) => {
  const theme = useTheme();
  const tone = status === "found" ? theme.custom.status.found : theme.custom.status.lost;
  const Icon = status === "found" ? TaskAltOutlined : SearchOffOutlined;
  return (
    <Box
      sx={{
        position: "absolute",
        top: 8,
        insetInlineStart: 8,
        zIndex: 2,
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

const DateBadge = ({ children }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        position: "absolute",
        top: 8,
        insetInlineEnd: 8,
        zIndex: 2,
        px: 1,
        py: 0.375,
        borderRadius: `${theme.custom.radius.sm}px`,
        backgroundColor: alpha(theme.custom.color.surfaceRaised, 0.85),
      }}
    >
      <Typography variant="caption" sx={{ color: theme.custom.color.ink, fontWeight: 600, lineHeight: 1 }}>
        {children}
      </Typography>
    </Box>
  );
};

const PostCardSkeleton = () => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        borderRadius: `${theme.custom.radius.lg}px`,
        overflow: "hidden",
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.custom.color.surfaceRaised,
        boxShadow: theme.custom.elevation.e1,
      }}
    >
      <Skeleton variant="rectangular" animation="wave" sx={{ width: "100%", paddingTop: "75%" }} />
      <Box sx={{ p: 2 }}>
        <Skeleton variant="text" width="70%" height={28} />
        <Skeleton variant="text" width="100%" height={20} />
        <Skeleton variant="text" width="90%" height={20} />
        <Skeleton variant="text" width="50%" height={18} sx={{ mt: 1 }} />
        <Skeleton variant="rounded" width="100%" height={36} sx={{ mt: 2, borderRadius: `${theme.custom.radius.md}px` }} />
      </Box>
    </Box>
  );
};

const PublicPostsPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t, currentLanguage } = useTranslation();
  const { currentLanguage: langContext, changeLanguage } = useUnifiedLanguageChange({
    showLoadingState: false,
    refetchPriority: 'medium',
    enableLogging: process.env.NODE_ENV === 'development'
  });

  const activeLanguage = currentLanguage || langContext || 'en';

  const currentCountry = useSelector(selectCurrentCountry);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [foundLostFilter, setFoundLostFilter] = useState("all");
  const [languageAnchorEl, setLanguageAnchorEl] = useState(null);

  // Get countries list
  const { data: countriesData } = useGetCountriesQuery({
    language: activeLanguage
  });

  const countries = countriesData?.ids?.map((id) => countriesData?.entities[id]) || [];
  const selectedCountry = countries.find((c) => c._id === currentCountry);

  // Get posts for the selected country
  const {
    data: postsData,
    isLoading: postsLoading,
    error: postsError
  } = useGetPostsQuery({
    currentCountry,
    language: activeLanguage
  }, {
    skip: !currentCountry
  });

  // The endpoint returns { postsWithUser, page, totalPages, total } — not an
  // entity-adapter { ids, entities } shape. (Confirmed against the real API
  // response and against how PostsList.js/Post.js already consume this same
  // query successfully.)
  const posts = postsData?.postsWithUser || [];

  // foundLost/category come back as populated lookup objects (Floptions[0].code,
  // categoryname), not plain "found"/"lost"/"electronics" strings — mirroring
  // the field resolution already proven correct in Post.js.
  const getFoundLostCode = (post) => {
    const code = post.Floptions?.[0]?.code;
    if (code) return code.toLowerCase();
    if (typeof post.foundLost === 'string' && ['found', 'lost'].includes(post.foundLost.toLowerCase())) {
      return post.foundLost.toLowerCase();
    }
    return 'found';
  };

  const getCategoryCode = (post) => {
    return (post.categoryname || post.Category?.code || 'other').toLowerCase();
  };

  // Posts have no "title" field at all — the production post card (Post.js)
  // uses the resolved city name as its headline instead, falling back to the
  // first segment of exactLocation. Same chain, reused here.
  const getCityDisplayName = (post) => {
    if (post.cityLabels && typeof post.cityLabels === 'object') {
      const label = post.cityLabels[activeLanguage] || post.cityLabels.en;
      if (label && label.trim()) return label.trim();
    }
    if (post.city && typeof post.city === 'object' && post.city.labels) {
      const label = post.city.labels[activeLanguage] || post.city.labels.en;
      if (label && label.trim()) return label.trim();
    }
    if (post.cityName && typeof post.cityName === 'string' && post.cityName.trim()) return post.cityName.trim();
    if (post.city && typeof post.city === 'string' && post.city.trim()) return post.city.trim();
    if (post.exactLocation) {
      const first = post.exactLocation.split(',')[0].split('(')[0].replace(/\d+/g, '').trim();
      if (first) return first;
    }
    return t('unknownCity');
  };

  const getImageUrl = (post) => {
    if (!post.image) return null;
    return post.image.startsWith('http') ? post.image : `${API_BASE_URL}/${post.image}`;
  };

  // Filter posts based on search and filters
  const filteredPosts = posts.filter(post => {
    const cityDisplay = getCityDisplayName(post);
    const matchesSearch = !searchQuery ||
      post.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.exactLocation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cityDisplay?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === "all" || getCategoryCode(post) === categoryFilter;
    const matchesFoundLost = foundLostFilter === "all" || getFoundLostCode(post) === foundLostFilter;

    return matchesSearch && matchesCategory && matchesFoundLost;
  });

  const hasActiveFilters = Boolean(searchQuery) || categoryFilter !== "all" || foundLostFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setFoundLostFilter("all");
  };

  const categoryLabels = {
    electronics: t('categoryElectronics'),
    documents: t('categoryDocuments'),
    jewelry: t('categoryJewelry'),
    clothing: t('categoryClothing'),
  };

  const handleLanguageChange = async (language) => {
    try {
      const success = await changeLanguage(language);
      if (success) {
        setLanguageAnchorEl(null);
      }
    } catch (error) {
      console.error('[PUBLIC-POSTS-PAGE] Error changing language:', error);
    }
  };

  const handleLanguageClick = (event) => {
    setLanguageAnchorEl(event.currentTarget);
  };

  const handleLanguageClose = () => {
    setLanguageAnchorEl(null);
  };

  const handleCountryChange = (_, value) => {
    if (value) {
      dispatch(setCurrentCountry({ currentCountry: value._id }));
    }
  };

  const getCountryLabel = (option) => {
    if (option.labels && option.labels[activeLanguage]) {
      return option.labels[activeLanguage];
    }
    return option.label || option.code;
  };

  const getFlagSource = (option) => {
    if (option.flag) {
      return option.flag;
    }
    return `https://flagcdn.com/w20/${option.code.toLowerCase()}.png`;
  };

  // Relative "time ago" rather than an absolute date — this is a live lost &
  // found board, not a catalog, and recency is the whole point of the badge
  // (matches the pattern already proven in the authenticated Post.js card).
  const dateLocale = activeLanguage === 'ar' ? ar : activeLanguage === 'fr' ? fr : enUS;
  const formatDate = (dateString) => {
    if (!dateString) return t('unknownDate');
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: dateLocale });
    } catch (e) {
      return t('unknownDate');
    }
  };

  const getCategoryThemeKey = (post) => `${getCategoryCode(post)}cate`;

  const seoMetadata = <SeoMeta pageKey="posts" />;

  if (!currentCountry) {
    return (
      <>
        {seoMetadata}
        <PageContainer>
          <Container maxWidth="xl">
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h4" gutterBottom>
                {t('pleaseSelectCountry')}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                {t('chooseCountryMessage')}
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/')}
                size="large"
                sx={{
                  bgcolor: theme.custom.color.brandPrimary,
                  borderRadius: `${theme.custom.radius.md}px`,
                  '&:hover': { bgcolor: theme.custom.color.brandPrimary, opacity: 0.9 },
                }}
              >
                {t('chooseCountry')}
              </Button>
            </Box>
          </Container>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      {seoMetadata}
      <PageContainer>
        {/* App Bar */}
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            backgroundColor: theme.custom.color.surfaceRaised,
            backdropFilter: 'blur(20px)',
            borderBottom: `1px solid ${theme.palette.divider}`,
            boxShadow: theme.custom.elevation.e1,
          }}
        >
          <Toolbar sx={{ flexWrap: { xs: 'wrap', sm: 'nowrap' }, gap: { xs: 1, sm: 0 } }}>
            <Typography
              variant="h6"
              component="div"
              sx={{
                flexGrow: { xs: 1, sm: 1 },
                fontSize: { xs: '1rem', sm: '1.25rem' },
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {t('brandName')}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, flexWrap: 'nowrap', flexShrink: 0 }}>
              <ControlButton
                onClick={handleLanguageClick}
                sx={{
                  mr: { xs: 0.5, sm: 2 },
                  px: { xs: 1, sm: 2 },
                  py: { xs: 0.5, sm: 1 }
                }}
              >
                <Language sx={{ fontSize: { xs: '18px', sm: '20px' }, color: 'text.secondary' }} />
                <Typography
                  variant="body2"
                  sx={{
                    display: { xs: 'none', sm: 'block' },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    fontWeight: 600,
                  }}
                >
                  {activeLanguage === 'ar' ? 'العربية' : activeLanguage === 'fr' ? 'Français' : 'English'}
                </Typography>
                <KeyboardArrowDown sx={{ fontSize: { xs: '16px', sm: '20px' }, display: { xs: 'none', sm: 'block' }, color: 'text.secondary' }} />
              </ControlButton>

              <IconButton
                onClick={() => dispatch(setMode())}
                sx={{
                  mr: { xs: 0, sm: 2 },
                  p: { xs: 0.75, sm: 1 },
                  '& .MuiSvgIcon-root': {
                    fontSize: { xs: '20px', sm: '24px' }
                  }
                }}
              >
                {theme.palette.mode === 'dark' ? '🌞' : '🌙'}
              </IconButton>

              <Button
                variant="outlined"
                startIcon={<Login />}
                onClick={() => navigate('/login')}
                sx={{
                  mr: { xs: 0.5, sm: 1 },
                  px: { xs: 1, sm: 2 },
                  py: { xs: 0.5, sm: 1 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  minWidth: { xs: 'auto', sm: '64px' },
                  borderRadius: `${theme.custom.radius.md}px`,
                  borderColor: theme.custom.color.brandPrimary,
                  color: theme.custom.color.brandPrimary,
                  '& .MuiButton-startIcon': {
                    margin: { xs: 0, sm: '0 8px 0 0' }
                  }
                }}
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' }, whiteSpace: 'nowrap' }}>
                  {t('signin')}
                </Box>
              </Button>

              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate('/signup')}
                sx={{
                  px: { xs: 1, sm: 2 },
                  py: { xs: 0.5, sm: 1 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  minWidth: { xs: 'auto', sm: 'auto' },
                  borderRadius: `${theme.custom.radius.md}px`,
                  bgcolor: theme.custom.color.brandPrimary,
                  '&:hover': { bgcolor: theme.custom.color.brandPrimary, opacity: 0.9 },
                  '& .MuiButton-startIcon': {
                    margin: { xs: 0, sm: '0 8px 0 0' }
                  }
                }}
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' }, whiteSpace: 'nowrap' }}>
                  {t('createNewPost')}
                </Box>
              </Button>
            </Box>
          </Toolbar>
        </AppBar>

        <Menu
          anchorEl={languageAnchorEl}
          open={Boolean(languageAnchorEl)}
          onClose={handleLanguageClose}
        >
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

        <Container maxWidth="xl" sx={{ py: 4 }}>
          {/* Filters: search + country + category + lost/found, one toolbar,
              stacked on mobile, sticky under the app bar from sm up */}
          <FilterBar>
            <TextField
              placeholder={t('searchPostsPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              sx={{
                flex: { xs: '1 1 100%', sm: '1 1 240px' },
                '& .MuiOutlinedInput-root': {
                  borderRadius: `${theme.custom.radius.md}px`,
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ fontSize: 20, color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
            />

            <Autocomplete
              options={countries}
              value={countries.find(c => c._id === currentCountry) || null}
              onChange={handleCountryChange}
              getOptionLabel={(option) => getCountryLabel(option)}
              size="small"
              sx={{ flex: { xs: '1 1 100%', sm: '0 0 200px' } }}
              renderOption={(props, option) => (
                <Box component="li" sx={{ "& > img": { mr: 2, flexShrink: 0 } }} {...props}>
                  {option.flag ? (
                    <span style={{ marginInlineEnd: 8, fontSize: '20px' }}>
                      {option.flag}
                    </span>
                  ) : (
                    <img
                      loading="lazy"
                      width="20"
                      src={getFlagSource(option)}
                      srcSet={`https://flagcdn.com/w40/${option.code.toLowerCase()}.png 2x`}
                      alt=""
                    />
                  )}
                  {getCountryLabel(option)} ({option.code})
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('chooseCountry')}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: `${theme.custom.radius.md}px`,
                    },
                  }}
                />
              )}
            />

            <FormControl size="small" sx={{ flex: { xs: '1 1 100%', sm: '0 0 180px' } }}>
              <InputLabel>{t('category')}</InputLabel>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                label={t('category')}
                sx={{ borderRadius: `${theme.custom.radius.md}px` }}
              >
                <MenuItem value="all">{t('allCategories')}</MenuItem>
                <MenuItem value="electronics">{categoryLabels.electronics}</MenuItem>
                <MenuItem value="documents">{categoryLabels.documents}</MenuItem>
                <MenuItem value="jewelry">{categoryLabels.jewelry}</MenuItem>
                <MenuItem value="clothing">{categoryLabels.clothing}</MenuItem>
              </Select>
            </FormControl>

            <ToggleButtonGroup
              value={foundLostFilter}
              exclusive
              onChange={(_, value) => value && setFoundLostFilter(value)}
              aria-label={t('foundOrLost')}
              size="small"
              sx={{
                flex: { xs: '1 1 100%', sm: '0 0 auto' },
                '& .MuiToggleButton-root': {
                  flex: { xs: 1, sm: '0 0 auto' },
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: `${theme.custom.radius.md}px !important`,
                  border: `1px solid ${theme.palette.divider}`,
                },
              }}
            >
              <ToggleButton
                value="all"
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: alpha(theme.custom.color.brandPrimary, 0.12),
                    color: theme.custom.color.brandPrimary,
                    '&:hover': { backgroundColor: alpha(theme.custom.color.brandPrimary, 0.18) },
                  },
                }}
              >
                {t('all')}
              </ToggleButton>
              <ToggleButton
                value="found"
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: theme.custom.status.found.bg,
                    color: theme.custom.status.found.main,
                    '&:hover': { backgroundColor: theme.custom.status.found.bg },
                  },
                }}
              >
                {t('found')}
              </ToggleButton>
              <ToggleButton
                value="lost"
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: theme.custom.status.lost.bg,
                    color: theme.custom.status.lost.main,
                    '&:hover': { backgroundColor: theme.custom.status.lost.bg },
                  },
                }}
              >
                {t('lost')}
              </ToggleButton>
            </ToggleButtonGroup>
          </FilterBar>

          {/* Posts Grid */}
          {postsLoading ? (
            <Grid container spacing={3}>
              {Array.from({ length: 8 }).map((_, i) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
                  <PostCardSkeleton />
                </Grid>
              ))}
            </Grid>
          ) : postsError ? (
            <Typography variant="h6" color="error" align="center">
              {t('errorLoadingPosts')}
            </Typography>
          ) : filteredPosts.length === 0 ? (
            <Box
              sx={{
                textAlign: 'center',
                py: 8,
                px: 2,
                backgroundColor: theme.custom.color.surfaceRaised,
                border: `1px dashed ${theme.palette.divider}`,
                borderRadius: `${theme.custom.radius.lg}px`,
              }}
            >
              <SearchOffOutlined sx={{ fontSize: 56, color: 'text.secondary', mb: 2, opacity: 0.7 }} />
              <Typography variant="h6" gutterBottom>
                {hasActiveFilters ? t('noPostsMatchFilters') : t('noPostsInArea')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 420, mx: 'auto' }}>
                {hasActiveFilters ? t('adjustFilters') : t('chooseCountryMessage')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>
                {hasActiveFilters && (
                  <Button
                    variant="outlined"
                    onClick={clearFilters}
                    sx={{
                      borderRadius: `${theme.custom.radius.md}px`,
                      borderColor: theme.custom.color.brandPrimary,
                      color: theme.custom.color.brandPrimary,
                    }}
                  >
                    {t('clearFilters')}
                  </Button>
                )}
                <Button
                  variant="contained"
                  onClick={() => navigate('/signup')}
                  sx={{
                    borderRadius: `${theme.custom.radius.md}px`,
                    bgcolor: theme.custom.color.brandPrimary,
                    '&:hover': { bgcolor: theme.custom.color.brandPrimary, opacity: 0.9 },
                  }}
                >
                  {t('createNewPost')}
                </Button>
              </Box>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {filteredPosts.map((post) => {
                const flCode = getFoundLostCode(post);
                const tone = flCode === 'found' ? theme.custom.status.found : theme.custom.status.lost;
                const categoryCode = getCategoryCode(post);
                const cityDisplay = getCityDisplayName(post);
                const imageUrl = getImageUrl(post);
                return (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={post._id}>
                    <PostCard tone={tone.main}>
                      <MediaFrame>
                        {imageUrl ? (
                          <LazyCardMedia
                            image={imageUrl}
                            alt={cityDisplay}
                            sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                          />
                        ) : (
                          <Box
                            sx={{
                              position: 'absolute',
                              inset: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: alpha(tone.main, 0.06),
                            }}
                          >
                            <RenderIcon name={getCategoryThemeKey(post)} />
                          </Box>
                        )}
                        <StatusTag status={flCode} label={t(flCode)} />
                        <DateBadge>{formatDate(post.createdAt)}</DateBadge>
                      </MediaFrame>

                      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
                        <Typography
                          variant="subtitle1"
                          component="h2"
                          sx={{
                            fontWeight: 600,
                            mb: 0.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {cityDisplay}
                        </Typography>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mb: 1.5,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            minHeight: '2.6em',
                          }}
                        >
                          {post.description}
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75, minWidth: 0 }}>
                          <Category sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }} />
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          >
                            {categoryLabels[categoryCode] || post.categoryname || t('unknownCategory')}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 2, minWidth: 0 }}>
                          <LocationOn sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }} />
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          >
                            {post.exactLocation || t('unknownLocation')}
                          </Typography>
                        </Box>

                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Visibility />}
                          onClick={() => navigate('/signup')}
                          fullWidth
                          sx={{
                            mt: 'auto',
                            borderRadius: `${theme.custom.radius.md}px`,
                            borderColor: theme.custom.color.brandPrimary,
                            color: theme.custom.color.brandPrimary,
                          }}
                        >
                          {t('viewDetails')}
                        </Button>
                      </CardContent>
                    </PostCard>
                  </Grid>
                );
              })}
            </Grid>
          )}

          <ExternalResults
            query={searchQuery}
            countryCode={selectedCountry?.code}
            language={activeLanguage}
            localResultCount={filteredPosts.length}
          />
        </Container>
      </PageContainer>
    </>
  );
};

export default PublicPostsPage;
