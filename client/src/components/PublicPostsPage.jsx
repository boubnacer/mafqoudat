import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useGetPostsQuery } from "../features/posts/postsApiSlice";
import { useGetCountriesQuery } from "../features/countries/countriesApiSlice";
import { selectCurrentCountry, setCurrentCountry } from "../app/state";
import { useTranslation } from "../utils/translations";
import { useUnifiedLanguageChange } from "../hooks/useUnifiedLanguageChange";
import { LoadingState } from "./LoadingStates";
import LazyCardMedia from "./LazyCardMedia";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  useMediaQuery,
  alpha,
  styled,
  AppBar,
  Toolbar,
  IconButton,
  Autocomplete,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Search,
  FilterList,
  LocationOn,
  Category,
  CalendarToday,
  Person,
  Visibility,
  Login,
  Add,
  Language,
  KeyboardArrowDown,
  Menu,
} from "@mui/icons-material";
import { setMode } from "../app/state";

// Styled components
const PageContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  background: theme?.palette?.mode === 'dark' 
    ? 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 25%, #2d2d2d 50%, #1a1a1a 75%, #0a0a0a 100%)'
    : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 25%, #cbd5e1 50%, #e2e8f0 75%, #f8fafc 100%)',
  paddingTop: theme?.spacing?.(8) || '64px',
  direction: theme?.direction || 'ltr',
}));

const PostCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 16,
  boxShadow: theme?.palette?.mode === 'dark'
    ? '0 8px 32px rgba(0, 0, 0, 0.3)'
    : '0 8px 32px rgba(0, 0, 0, 0.1)',
  background: theme?.palette?.mode === 'dark'
    ? 'rgba(30, 30, 30, 0.9)'
    : 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(20px)',
  border: `1px solid ${alpha(theme?.palette?.divider, 0.1)}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme?.palette?.mode === 'dark'
      ? '0 16px 48px rgba(0, 0, 0, 0.4)'
      : '0 16px 48px rgba(0, 0, 0, 0.15)',
  }
}));

const SearchBar = styled(Box)(({ theme }) => ({
  background: theme?.palette?.mode === 'dark'
    ? 'rgba(255, 255, 255, 0.05)'
    : 'rgba(255, 255, 255, 0.7)',
  borderRadius: 16,
  padding: theme?.spacing?.(3) || '24px',
  marginBottom: theme?.spacing?.(3) || '24px',
  backdropFilter: 'blur(20px)',
  border: `1px solid ${alpha(theme?.palette?.divider, 0.1)}`,
}));

const LanguageSelector = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: '8px 16px',
  borderRadius: '12px',
  cursor: 'pointer',
  background: theme?.palette?.mode === 'dark' 
    ? alpha(theme?.palette?.common?.white, 0.05)
    : alpha(theme?.palette?.common?.black, 0.05),
  transition: 'all 0.3s ease',
  '&:hover': {
    background: theme?.palette?.mode === 'dark' 
      ? alpha(theme?.palette?.common?.white, 0.1)
      : alpha(theme?.palette?.common?.black, 0.1),
    transform: 'translateY(-2px)',
  },
  '& .MuiSvgIcon-root': {
    marginRight: '8px',
    fontSize: '20px',
  },
}));

const PublicPostsPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery("(max-width:600px)");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t, currentLanguage } = useTranslation();
  const { currentLanguage: langContext, changeLanguage, isChanging } = useUnifiedLanguageChange({
    showLoadingState: false,
    refetchPriority: 'medium',
    enableLogging: process.env.NODE_ENV === 'development'
  });
  
  const currentCountry = useSelector(selectCurrentCountry);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [foundLostFilter, setFoundLostFilter] = useState("all");
  const [languageAnchorEl, setLanguageAnchorEl] = useState(null);

  // Get countries list
  const { data: countriesData } = useGetCountriesQuery({
    language: currentLanguage || langContext || 'en'
  });

  const countries = countriesData?.ids?.map((id) => countriesData?.entities[id]) || [];

  // Get posts for the selected country
  const { 
    data: postsData, 
    isLoading: postsLoading, 
    error: postsError 
  } = useGetPostsQuery({
    currentCountry,
    language: currentLanguage || langContext || 'en'
  }, {
    skip: !currentCountry
  });

  const posts = postsData?.ids?.map((id) => postsData?.entities[id]) || [];

  // Filter posts based on search and filters
  const filteredPosts = posts.filter(post => {
    const matchesSearch = !searchQuery || 
      post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.region?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || post.category === categoryFilter;
    const matchesFoundLost = foundLostFilter === "all" || post.foundLost === foundLostFilter;
    
    return matchesSearch && matchesCategory && matchesFoundLost;
  });

  const handleLanguageChange = async (language) => {
    console.log('🌐 [PUBLIC-POSTS-PAGE] Language change triggered:', { language, currentUrl: window.location.href });
    
    try {
      // Use unified language change handler
      const success = await changeLanguage(language);
      
      if (success) {
        setLanguageAnchorEl(null);
        console.log('🌐 [PUBLIC-POSTS-PAGE] Language changed successfully to:', language);
      } else {
        console.error('🌐 [PUBLIC-POSTS-PAGE] Failed to change language to:', language);
      }
    } catch (error) {
      console.error('🌐 [PUBLIC-POSTS-PAGE] Error changing language:', error);
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
    if (option.labels && option.labels[currentLanguage || langContext || 'en']) {
      return option.labels[currentLanguage || langContext || 'en'];
    }
    return option.label || option.code;
  };

  const getFlagSource = (option) => {
    if (option.flag) {
      return option.flag;
    }
    return `https://flagcdn.com/w20/${option.code.toLowerCase()}.png`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(
      currentLanguage === 'ar' ? 'ar-SA' : currentLanguage === 'fr' ? 'fr-FR' : 'en-US',
      { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }
    );
  };

  if (!currentCountry) {
    return (
      <PageContainer>
        <Container maxWidth="md">
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
            >
              {t('chooseCountry')}
            </Button>
          </Box>
        </Container>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* App Bar */}
      <AppBar 
        position="fixed" 
        sx={{ 
          background: theme?.palette?.mode === 'dark' 
            ? 'rgba(30, 30, 30, 0.9)' 
            : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${alpha(theme?.palette?.divider, 0.1)}`,
        }}
      >
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {t('brandName')}
          </Typography>
          
          <LanguageSelector onClick={handleLanguageClick} sx={{ mr: 2 }}>
            <Language />
            <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
              {currentLanguage === 'ar' ? 'العربية' : currentLanguage === 'fr' ? 'Français' : 'English'}
            </Typography>
            <KeyboardArrowDown />
          </LanguageSelector>

          <IconButton
            onClick={() => dispatch(setMode())}
            sx={{ mr: 2 }}
          >
            {theme?.palette?.mode === 'dark' ? '🌞' : '🌙'}
          </IconButton>

          <Button
            variant="outlined"
            startIcon={<Login />}
            onClick={() => navigate('/login')}
            sx={{ mr: 1 }}
          >
            {t('signin')}
          </Button>

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/signup')}
          >
            {t('createNewPost')}
          </Button>
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={languageAnchorEl}
        open={Boolean(languageAnchorEl)}
        onClose={handleLanguageClose}
        PaperProps={{
          sx: {
            background: theme?.palette?.mode === 'dark' 
              ? 'rgba(30, 30, 30, 0.95)'
              : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme?.palette?.divider, 0.1)}`,
          }
        }}
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

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Country Selector */}
        <Box sx={{ mb: 4 }}>
          <Autocomplete
            options={countries}
            value={countries.find(c => c._id === currentCountry) || null}
            onChange={handleCountryChange}
            getOptionLabel={(option) => getCountryLabel(option)}
            renderOption={(props, option) => (
              <Box component="li" sx={{ "& > img": { mr: 2, flexShrink: 0 } }} {...props}>
                {option.flag ? (
                  <span style={{ marginRight: 8, fontSize: '20px' }}>
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
                fullWidth
              />
            )}
          />
        </Box>

        {/* Search and Filters */}
        <SearchBar>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder={t('searchPostsPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>{t('category')}</InputLabel>
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  label={t('category')}
                >
                  <MenuItem value="all">{t('allCategories')}</MenuItem>
                  <MenuItem value="electronics">Electronics</MenuItem>
                  <MenuItem value="documents">Documents</MenuItem>
                  <MenuItem value="jewelry">Jewelry</MenuItem>
                  <MenuItem value="clothing">Clothing</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>{t('foundOrLost')}</InputLabel>
                <Select
                  value={foundLostFilter}
                  onChange={(e) => setFoundLostFilter(e.target.value)}
                  label={t('foundOrLost')}
                >
                  <MenuItem value="all">{t('all')}</MenuItem>
                  <MenuItem value="found">{t('found')}</MenuItem>
                  <MenuItem value="lost">{t('lost')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </SearchBar>

        {/* Posts Grid */}
        {postsLoading ? (
          <LoadingState message={t('loadingPosts')} />
        ) : postsError ? (
          <Typography variant="h6" color="error" align="center">
            {t('errorLoadingPosts')}
          </Typography>
        ) : filteredPosts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h5" gutterBottom>
              {searchQuery || categoryFilter !== 'all' || foundLostFilter !== 'all' 
                ? t('noPostsMatchFilters') 
                : t('noPostsInArea')}
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => navigate('/signup')}
              sx={{ mt: 2 }}
            >
              {t('createNewPost')}
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredPosts.map((post) => (
              <Grid item xs={12} sm={6} md={4} key={post.id}>
                <PostCard>
                  {post.image && (
                    <LazyCardMedia
                      component="img"
                      height="200"
                      image={post.image}
                      alt={post.title}
                      sx={{ objectFit: 'cover' }}
                    />
                  )}
                  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Chip 
                        label={t(post.foundLost)} 
                        color={post.foundLost === 'found' ? 'success' : 'error'}
                        size="small"
                      />
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(post.createdAt)}
                      </Typography>
                    </Box>
                    
                    <Typography variant="h6" component="h2" gutterBottom sx={{ flexGrow: 1 }}>
                      {post.title}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                      {post.description?.substring(0, 100)}...
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <LocationOn sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {post.region || t('unknownRegion')}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Category sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {post.category || t('unknownCategory')}
                      </Typography>
                    </Box>
                    
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Visibility />}
                      onClick={() => navigate('/signup')}
                      fullWidth
                    >
                      {t('viewDetails')}
                    </Button>
                  </CardContent>
                </PostCard>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </PageContainer>
  );
};

export default PublicPostsPage;
