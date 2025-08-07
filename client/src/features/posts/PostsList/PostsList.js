import { useGetPostsQuery } from "../postsApiSlice";
import { useGetCategoriesQuery } from "../../dependencies/dependenciesApiSlice";
import { useTranslation } from "../../../utils/translations";
import Post from "./Post";
import useTitle from "../../../hooks/useTitle";
import { LoadingState, EmptyState, ErrorState } from "../../../components/LoadingStates";
import { useSelector, useDispatch } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Search, 
  Add as AddIcon, 
  FilterList as FilterIcon,
  Sort as SortIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  Category as CategoryIcon
} from "@mui/icons-material";
import { 
  Button, 
  Box, 
  Typography, 
  TextField, 
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Paper,
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip,
  Grid,
  Alert
} from "@mui/material";
import Pagination from "@mui/material/Pagination";
import { useEffect, useState, useCallback, useMemo } from "react";
import useAuth from "../../../hooks/useAuth";
import { selectCurrentCountry, selectFoundOrLost, selectCategoryFilter, setCategoryFilter } from "../../../app/state";
import FlexCenter from "../../../components/FlexCenter";

const POSTS_REGEX = /^\/dash\/posts(\/)?$/;
const HOME_REGEX = /^\/dash(\/)?$/;

const PostsList = () => {
  useTitle("Mafkoudat | Posts List");

  const theme = useTheme();
  const isNonMediumScreens = useMediaQuery("(min-width:1200px)");
  const isMobile = useMediaQuery("(max-width:768px)");

  const user = useAuth();
  const countryId = useSelector(selectCurrentCountry);
  const [currentCountry, setCurrentCountry] = useState(user.country);
  const foundOrlost = useSelector(selectFoundOrLost);
  const categoryFilter = useSelector(selectCategoryFilter);
  const dispatch = useDispatch();

  // State management
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [fl, setFl] = useState(foundOrlost);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState("grid");
  const [localCategoryFilter, setLocalCategoryFilter] = useState("all");

  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const location = useLocation();

  // Get current language
  const { t, currentLanguage } = useTranslation();

  // Initialize category filter from navigation state
  useEffect(() => {
    if (location.state?.fromCategory && location.state?.categoryFilter) {
      console.log('Setting category filter from navigation state:', location.state.categoryFilter);
      setLocalCategoryFilter(location.state.categoryFilter);
      // Clear the navigation state to prevent it from persisting
      navigate(location.pathname, { replace: true, state: {} });
    } else if (categoryFilter && categoryFilter !== "all") {
      console.log('Setting category filter from Redux:', categoryFilter);
      setLocalCategoryFilter(categoryFilter);
    }
  }, [location.state, categoryFilter, navigate, location.pathname]);

  // Get categories for dynamic filtering
  const { data: categoriesData } = useGetCategoriesQuery({
    language: currentLanguage
  }, {
    selectFromResult: ({ data }) => ({
      data: data?.ids?.map((id) => data?.entities[id]) || [],
    }),
  });

  const { data, isLoading, isSuccess, isError, error } = useGetPostsQuery({
    page,
    pageSize,
    fl,
    currentCountry,
    search: debouncedSearchTerm || undefined,
    categoryId: localCategoryFilter !== "all" ? localCategoryFilter : undefined,
    language: currentLanguage,
  }, {
    // Add debugging
    refetchOnMountOrArgChange: true,
  });

  // Debug logging
  useEffect(() => {
    console.log('API Call Parameters:', {
      page,
      pageSize,
      fl,
      currentCountry,
      search: debouncedSearchTerm,
      categoryId: localCategoryFilter !== "all" ? localCategoryFilter : undefined,
      language: currentLanguage,
    });
  }, [page, pageSize, fl, currentCountry, debouncedSearchTerm, localCategoryFilter, currentLanguage]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1); // Reset to first page when search changes
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentCountry(countryId);
    setFl(foundOrlost);
    setPage(1);
  }, [countryId, foundOrlost]);

  // Remove the cleanup effect that was clearing the category filter
  // This was interfering with category navigation from Dashboard

  const handlePaginate = (e, p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setPage(1);
  };

  const handleCategoryFilter = (e) => {
    setLocalCategoryFilter(e.target.value);
    setPage(1);
  };

  const handleViewModeChange = () => {
    setViewMode(viewMode === "grid" ? "list" : "grid");
  };

  const handleMore = () => navigate("/dash/posts");

  // Check if we have active filters
  const hasActiveFilters = useMemo(() => {
    return searchTerm || localCategoryFilter !== "all" || sortBy !== "newest";
  }, [searchTerm, localCategoryFilter, sortBy]);

  // Get posts from API response (already filtered by country and found/lost)
  const filteredPosts = useMemo(() => {
    if (!data?.postsWithUser) return [];
    return data.postsWithUser;
  }, [data?.postsWithUser]);

  let content;

  if (isLoading) content = <LoadingState message={t('loadingPosts')} />;

  if (isError) {
    content = (
      <ErrorState
        title="Failed to load posts"
        message={error?.data?.message || "Please try again later"}
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (isSuccess) {
    const { totalPages } = data;

    return (
      <Box sx={{ 
        p: { xs: 2, md: 4 },
        pt: { xs: "8rem", md: "10rem" },
        minHeight: "100vh"
      }}>
        {/* Header Section */}
        <Box sx={{ mb: 4 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Typography 
                variant="h3" 
                sx={{ 
                  color: theme.palette.textColor.main,
                  fontWeight: 700,
                  mb: 1
                }}
              >
                {t('posts')}
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: theme.palette.textColor.secondary,
                  fontWeight: 400
                }}
              >
                                     {filteredPosts.length} {t('posts')} {t('found')}
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate("/dash/posts/new")}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              {t('addNewPost')}
            </Button>
          </Box>

          {/* Filters and Search - Always visible */}
          <Paper 
            elevation={2} 
            sx={{ 
              p: 3, 
              borderRadius: 3,
              background: theme.palette.background.paper
            }}
          >
            <Grid container spacing={3} alignItems="center">
              {/* Search */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                                      placeholder={t('searchPostsPlaceholder')}
                  value={searchTerm}
                  onChange={handleSearch}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ 
                    '& .MuiOutlinedInput-root': { 
                      borderRadius: 2 
                    } 
                  }}
                />
              </Grid>

              {/* Sort */}
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth>
                  <InputLabel>{t('sortBy')}</InputLabel>
                  <Select
                    value={sortBy}
                    label={t('sortBy')}
                    onChange={handleSortChange}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="newest">{t('newestFirst')}</MenuItem>
                    <MenuItem value="oldest">{t('oldestFirst')}</MenuItem>
                    <MenuItem value="region">{t('byRegion')}</MenuItem>
                    <MenuItem value="category">{t('byCategory')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Category Filter */}
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth>
                  <InputLabel>{t('category')}</InputLabel>
                  <Select
                    value={localCategoryFilter}
                    label={t('category')}
                    onChange={handleCategoryFilter}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="all">{t('allCategories')}</MenuItem>
                    {categoriesData?.map((category) => (
                      <MenuItem key={category._id} value={category._id}>
                        {category.labels?.[currentLanguage] || category.code}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* View Mode Toggle */}
              <Grid item xs={12} md={2}>
                <Box display="flex" justifyContent="center" gap={1}>
                  <Tooltip title={t('gridView')}>
                    <IconButton
                      onClick={() => setViewMode("grid")}
                      color={viewMode === "grid" ? "primary" : "default"}
                      sx={{ 
                        borderRadius: 2,
                        backgroundColor: viewMode === "grid" ? theme.palette.primary.light + '20' : 'transparent'
                      }}
                    >
                      <ViewModuleIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('listView')}>
                    <IconButton
                      onClick={() => setViewMode("list")}
                      color={viewMode === "list" ? "primary" : "default"}
                      sx={{ 
                        borderRadius: 2,
                        backgroundColor: viewMode === "list" ? theme.palette.primary.light + '20' : 'transparent'
                      }}
                    >
                      <ViewListIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>

              {/* Active Filters Display */}
              <Grid item xs={12}>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {searchTerm && (
                    <Chip 
                      label={`Search: ${searchTerm}`} 
                      onDelete={() => setSearchTerm("")}
                      color="primary"
                      variant="outlined"
                    />
                  )}
                  {localCategoryFilter !== "all" && (
                    <Chip 
                      label={`${t('category')}: ${categoriesData?.find(cat => cat._id === localCategoryFilter)?.labels?.[currentLanguage] || categoriesData?.find(cat => cat._id === localCategoryFilter)?.code || localCategoryFilter}`} 
                      onDelete={() => setLocalCategoryFilter("all")}
                      color="secondary"
                      variant="outlined"
                    />
                  )}
                  {sortBy !== "newest" && (
                    <Chip 
                      label={`Sort: ${sortBy}`} 
                      onDelete={() => setSortBy("newest")}
                      color="info"
                      variant="outlined"
                    />
                  )}
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Box>

        {/* Posts Content */}
        {filteredPosts?.length ? (
          <>
            {/* Posts Grid/List */}
            <Box sx={{ mb: 4 }}>
              <Box
                display="grid"
                gap={3}
                sx={{
                  gridTemplateColumns: viewMode === "grid" ? {
                    xs: "repeat(1, 1fr)",
                    sm: "repeat(2, 1fr)",
                    md: "repeat(3, 1fr)",
                    lg: "repeat(4, 1fr)",
                  } : "repeat(1, 1fr)",
                }}
              >
                {filteredPosts.map((post) => (
                  <Post 
                    key={post._id} 
                    post={post} 
                    viewMode={viewMode}
                  />
                ))}
              </Box>
            </Box>

            {/* Enhanced Pagination */}
            {totalPages > 1 && (
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 3, 
                  borderRadius: 3,
                  background: theme.palette.background.paper
                }}
              >
                <Box
                  display="flex"
                  flexDirection={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  alignItems="center"
                  gap={2}
                >
                  <Typography variant="body2" color="text.secondary">
                    {t('page')} {page} {t('of')} {totalPages} • {filteredPosts.length} {t('posts')}
                  </Typography>
                  
                  <Pagination
                    page={page}
                    count={totalPages}
                    onChange={handlePaginate}
                    color="primary"
                    size={isMobile ? "small" : "medium"}
                    showFirstButton
                    showLastButton
                    sx={{
                      '& .MuiPaginationItem-root': {
                        borderRadius: 2,
                        fontWeight: 600
                      }
                    }}
                  />
                  
                  <Box display="flex" gap={1} alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      {t('postsPerPage')}:
                    </Typography>
                    <Select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(e.target.value);
                        setPage(1);
                      }}
                      size="small"
                      sx={{ minWidth: 80 }}
                    >
                      <MenuItem value={4}>4</MenuItem>
                      <MenuItem value={8}>8</MenuItem>
                      <MenuItem value={12}>12</MenuItem>
                      <MenuItem value={16}>16</MenuItem>
                    </Select>
                  </Box>
                </Box>
              </Paper>
            )}
          </>
        ) : (
          <EmptyState
            icon={Search}
                           title={hasActiveFilters ? t('noPostsMatchFilters') : t('noPostsFound')}
               description={
                 hasActiveFilters
                   ? t('adjustFilters')
                   : t('noPostsInArea')
               }
            action={
              <Link to="/dash/posts/new">
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />}
                  sx={{ 
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    textTransform: 'none',
                    fontWeight: 600
                  }}
                >
                  {t('addNewPost')}
                </Button>
              </Link>
            }
          />
        )}
      </Box>
    );
  }
  
  return content;
};

export default PostsList;
