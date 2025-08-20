import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate } from "react-router-dom";
import { useGetPostsQuery } from "../postsApiSlice";
import { memo } from "react";
import "./postslist.css";
import ma from "../../../img/ma.jpg";
import useAuth from "../../../hooks/useAuth";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Typography,
  useTheme,
  Box,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  useMediaQuery,
  Paper,
  alpha,
} from "@mui/material";
import {
  LocationOn as LocationIcon,
  LocationOnOutlined,
  KeyboardArrowRightOutlined,
  ReportProblemOutlined,
  CalendarToday as CalendarIcon,
  Category as CategoryIcon,
  Visibility as VisibilityIcon,
  ArrowForward as ArrowIcon
} from "@mui/icons-material";
import FlexBetween from "../../../components/FlexBetween";
import { useTranslation } from "../../../utils/translations";
import { getLabel, isRTL } from "../../../utils/languageUtils";
import { formatDistanceToNow } from 'date-fns';
import { ar, fr, enUS } from 'date-fns/locale';
import RenderIcon from "../../../components/RenderIcon";

// Get the API base URL for image construction
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3500";

const Post = ({ post, viewMode = "grid" }) => {
  const { usernameId, foundLost } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery("(max-width:768px)");
  const navigate = useNavigate();
  const { t, currentLanguage } = useTranslation();
  const isRTLMode = isRTL();

  if (post) {
    // Format date using date-fns with proper locale support
    const getLocale = () => {
      switch (currentLanguage) {
        case 'ar': return ar;
        case 'fr': return fr;
        default: return enUS;
      }
    };

    const created = formatDistanceToNow(new Date(post.createdAt), { 
      addSuffix: true,
      locale: getLocale()
    });

    const handleViewDetails = () => navigate(`/dash/posts/${post._id}`);
    const handleReport = () => navigate(`/dash/posts/report/${post._id}`);

    // Enhanced Found/Lost detection with proper multilingual support
    let foundLostValue = "FOUND"; // Default to FOUND
    let foundLostLabel = t('found'); // Default label
    let foundLostColor = theme.palette.success.main; // Default color
    
    // Debug logging for found/lost detection
    console.log('Found/Lost Debug:', {
      id: post._id,
      foundLost: post.foundLost,
      Floptions: post.Floptions,
      FloptionsLength: post.Floptions?.length
    });
    
    // Check Floptions array first (this contains the actual found/lost data from the lookup)
    if (post.Floptions && post.Floptions.length > 0) {
      const flOption = post.Floptions[0];
      console.log('FlOption:', flOption);
      if (flOption && flOption.code) {
        foundLostValue = flOption.code;
        foundLostLabel = getLabel(flOption.labels, currentLanguage) || 
                        (flOption.code === 'FOUND' ? t('found') : t('lost'));
        foundLostColor = flOption.color || 
                        (flOption.code === 'FOUND' ? theme.palette.success.main : theme.palette.error.main);
        console.log('Using FlOption:', { foundLostValue, foundLostLabel, foundLostColor });
      }
    }
    
    // Fallback: Check foundLost property (this is the ObjectId reference)
    if (!foundLostValue || foundLostValue === "FOUND") {
      if (post.foundLost) {
        if (typeof post.foundLost === 'string') {
          foundLostValue = post.foundLost.toUpperCase();
          foundLostLabel = post.foundLost === 'FOUND' ? t('found') : t('lost');
          foundLostColor = post.foundLost === 'FOUND' ? theme.palette.success.main : theme.palette.error.main;
        } else if (post.foundLost.code) {
          foundLostValue = post.foundLost.code;
          foundLostLabel = getLabel(post.foundLost.labels, currentLanguage) || 
                          (post.foundLost.code === 'FOUND' ? t('found') : t('lost'));
          foundLostColor = post.foundLost.color || 
                          (post.foundLost.code === 'FOUND' ? theme.palette.success.main : theme.palette.error.main);
        }
      }
    }



    // Normalize the value and set proper colors
    const isFound = foundLostValue === "FOUND";
    const statusColor = foundLostColor || (isFound ? theme.palette.success.main : theme.palette.error.main);
    const statusText = foundLostLabel;

    // Get category name safely with multilingual support
    const categoryName = post.categoryname || t('unknownCategory');

    // Get category color function (matching RecentPosts styling)
    const getCategoryColor = (category) => {
      const categoryColors = {
        Bag: { main: '#4CAF50', light: '#E8F5E9', dark: '#2E7D32', icon: '#2E7D32' },
        keys: { main: '#FF9800', light: '#FFF3E0', dark: '#E65100', icon: '#E65100' },
        person: { main: '#2196F3', light: '#E3F2FD', dark: '#1565C0', icon: '#1565C0' },
        Money: { main: '#9C27B0', light: '#F3E5F5', dark: '#6A1B9A', icon: '#6A1B9A' },
        Devices: { main: '#00BCD4', light: '#E0F7FA', dark: '#00838F', icon: '#00838F' },
        Wallet: { main: '#FF5722', light: '#FBE9E7', dark: '#BF360C', icon: '#BF360C' },
        Vehicle: { main: '#607D8B', light: '#ECEFF1', dark: '#37474F', icon: '#37474F' },
        Document: { main: '#795548', light: '#EFEBE9', dark: '#4E342E', icon: '#4E342E' },
      };
      return categoryColors[category] || categoryColors.Bag;
    };

    const categoryStyle = getCategoryColor(categoryName);
    const isDarkMode = theme.palette.mode === 'dark';

    // List view layout
    if (viewMode === "list") {
      return (
        <Paper 
          elevation={2} 
          sx={{ 
            borderRadius: 3,
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: theme.shadows[8]
            },
            direction: currentLanguage === 'ar' ? 'rtl' : 'ltr'
          }}
        >
          <Box display="flex" sx={{ height: 200 }}>
            {/* Image Section */}
            <Box sx={{ width: 200, flexShrink: 0 }}>
              <CardMedia
                component="img"
                sx={{ 
                  height: '100%',
                  width: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center'
                }}
                image={post.image ? (post.image.startsWith('http') ? post.image : `${API_BASE_URL}/${post.image}`) : ma}
                title={categoryName || 'Item Image'}
                onError={(e) => {
                  console.log('Image failed to load:', e.target.src);
                  e.target.src = ma;
                }}
              />
            </Box>

            {/* Content Section */}
            <Box sx={{ flex: 1, p: 3, display: 'flex', flexDirection: 'column' }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Box>
                  <Typography 
                    variant="h5" 
                    fontWeight={600} 
                    sx={{ 
                      mb: 1,
                      direction: currentLanguage === 'ar' ? 'rtl' : 'ltr'
                    }}
                  >
                    {post.exactLocation || t('unknownLocation')}
                  </Typography>
                  {post.countryLabels && (
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ 
                        direction: currentLanguage === 'ar' ? 'rtl' : 'ltr'
                      }}
                    >
                      {post.countryLabels[currentLanguage] || post.countryLabels.en || post.countryname}
                    </Typography>
                  )}
                  <Box display="flex" gap={2} alignItems="center" mb={1}>
                    <Chip 
                      label={statusText}
                      size="small"
                      sx={{ 
                        fontWeight: 600,
                        backgroundColor: statusColor,
                        color: 'white',
                        '& .MuiChip-label': {
                          color: 'white'
                        }
                      }}
                    />
                    <Box
                      sx={{
                        backgroundColor: isDarkMode ? alpha(categoryStyle.main, 0.15) : categoryStyle.light,
                        padding: '4px 8px',
                        borderRadius: '16px',
                        alignSelf: 'flex-start',
                        border: `1px solid ${isDarkMode ? alpha(categoryStyle.main, 0.3) : categoryStyle.main}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                      }}
                    >
                      <RenderIcon name={`${categoryName?.toLowerCase()}cate`} />
                      <Typography
                        sx={{
                          color: isDarkMode ? categoryStyle.main : categoryStyle.dark,
                          fontSize: { xs: '10px', sm: '12px' },
                          fontWeight: 600,
                          letterSpacing: '0.3px',
                        }}
                      >
                        {t(categoryName?.toLowerCase()) || categoryName}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                <Box display="flex" gap={1}>
                  <Tooltip title={t('viewDetails')}>
                    <IconButton 
                      onClick={handleViewDetails}
                      size="small"
                      sx={{ 
                        color: theme.palette.primary.main,
                        '&:hover': { backgroundColor: theme.palette.primary.light + '20' }
                      }}
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('report')}>
                    <IconButton 
                      onClick={() => {
                        if (!usernameId) {
                          navigate('/login');
                        } else {
                          handleReport();
                        }
                      }}
                      size="small"
                      sx={{ 
                        color: theme.palette.error.main,
                        '&:hover': { backgroundColor: theme.palette.error.light + '20' }
                      }}
                    >
                      <ReportProblemOutlined />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              <Box display="flex" gap={3} mb={2} flexWrap="wrap">
                <Box display="flex" alignItems="center" gap={1}>
                  <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ direction: currentLanguage === 'ar' ? 'rtl' : 'ltr' }}
                  >
                    {created}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <LocationOnOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ direction: currentLanguage === 'ar' ? 'rtl' : 'ltr' }}
                  >
                    {post.exactLocation || t('unknownLocation')}
                  </Typography>
                </Box>
                {post.contact && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <RenderIcon name="contact" sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ direction: currentLanguage === 'ar' ? 'rtl' : 'ltr' }}
                    >
                      {post.contact}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Description (if available) */}
              {post.description && (
                <Box mb={2}>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                      lineHeight: 1.5
                    }}
                  >
                    {post.description}
                  </Typography>
                </Box>
              )}

              <Box sx={{ mt: 'auto' }}>
                <Button
                  variant="contained"
                  endIcon={<RenderIcon name="view" data-directional="true" />}
                  onClick={handleViewDetails}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    direction: currentLanguage === 'ar' ? 'rtl' : 'ltr'
                  }}
                >
                  {t('viewDetails')}
                </Button>
              </Box>
            </Box>
          </Box>
        </Paper>
      );
    }

        // Grid view layout (modern design matching RecentPosts)
    console.log('Post component - Using modern design with only date and city');
    return (
      <Card
        sx={{
          backgroundColor: isDarkMode ? alpha('#1E1E1E', 0.9) : '#FFFFFF',
          position: 'relative',
          boxShadow: isDarkMode 
            ? '0 8px 32px rgba(0, 0, 0, 0.4)'
            : '0 8px 32px rgba(0, 0, 0, 0.12)',
          height: { xs: 'auto', sm: '20rem' },
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          borderRadius: '24px',
          overflow: 'hidden',
          border: `1px solid ${isDarkMode ? alpha('#fff', 0.1) : alpha('#000', 0.08)}`,
          '&:hover': {
            transform: { xs: 'none', sm: 'translateY(-8px) scale(1.02)' },
            boxShadow: isDarkMode
              ? '0 20px 48px rgba(0, 0, 0, 0.5)'
              : '0 20px 48px rgba(0, 0, 0, 0.2)',
          },
          direction: currentLanguage === 'ar' ? 'rtl' : 'ltr'
        }}
      >
        {/* Card Image with Modern Overlay */}
        <Box sx={{ position: 'relative', height: { xs: '160px', sm: '180px' } }}>
          <CardMedia
            component="img"
            sx={{
              height: '100%',
              width: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
            }}
            image={post.image ? (post.image.startsWith('http') ? post.image : `${API_BASE_URL}/${post.image}`) : ma}
            title={categoryName || 'Item Image'}
            onError={(e) => {
              console.log('Image failed to load:', e.target.src);
              e.target.src = ma;
            }}
          />
          
          {/* Modern Gradient Overlay */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%)',
              pointerEvents: 'none'
            }}
          />

          {/* Status Badge - Modern Floating Design */}
          <Chip 
            label={statusText}
            size="small"
            sx={{
              position: 'absolute',
              top: 16,
              left: currentLanguage === 'ar' ? 'auto' : 16,
              right: currentLanguage === 'ar' ? 16 : 'auto',
              fontWeight: 700,
              backgroundColor: alpha(statusColor, 0.95),
              color: 'white',
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(statusColor, 0.3)}`,
              boxShadow: `0 4px 16px ${alpha(statusColor, 0.3)}`,
              '& .MuiChip-label': {
                color: 'white',
                fontSize: '11px',
                fontWeight: 700,
              }
            }}
          />

          {/* Category Badge - Modern Floating Design */}
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              left: currentLanguage === 'ar' ? 16 : 'auto',
              right: currentLanguage === 'ar' ? 'auto' : 16,
              backgroundColor: alpha(categoryStyle.main, 0.95),
              padding: '8px 16px',
              borderRadius: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(categoryStyle.main, 0.3)}`,
              boxShadow: `0 4px 16px ${alpha(categoryStyle.main, 0.3)}`,
              mt: 4, // Move down to avoid overlap with status badge
            }}
          >
            <RenderIcon 
              name={`${categoryName?.toLowerCase()}cate`} 
              sx={{ fontSize: '16px', color: categoryStyle.icon || '#fff' }} 
            />
            <Typography
              sx={{
                color: '#fff',
                fontSize: { xs: '11px', sm: '13px' },
                fontWeight: 700,
                letterSpacing: '0.5px',
              }}
            >
              {t(categoryName?.toLowerCase()) || categoryName}
            </Typography>
          </Box>

          {/* Date Badge - Modern Floating Design */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 16,
              left: currentLanguage === 'ar' ? 'auto' : 16,
              right: currentLanguage === 'ar' ? 16 : 'auto',
              backgroundColor: alpha('#000', 0.8),
              padding: '6px 12px',
              borderRadius: '16px',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CalendarIcon sx={{ fontSize: '14px', color: '#fff' }} />
              <Typography
                sx={{
                  color: '#fff',
                  fontSize: { xs: '11px', sm: '12px' },
                  fontWeight: 600,
                }}
              >
                {new Date(post.createdAt).toLocaleDateString()}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Card Content - Simplified */}
        <CardContent 
          sx={{ 
            flexGrow: 1, 
            p: { xs: 2, sm: 2.5 },
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          {/* Location Info - Only City */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
              }}
            >
              <LocationIcon sx={{ fontSize: '18px' }} />
            </Avatar>
            <Box>
              <Typography
                sx={{
                  color: isDarkMode ? alpha('#fff', 0.9) : alpha('#000', 0.8),
                  fontSize: { xs: '14px', sm: '16px' },
                  fontWeight: 600,
                  lineHeight: 1.2,
                }}
              >
                {post.exactLocation || t('unknownLocation')}
              </Typography>
              {post.countryLabels && (
                <Typography
                  sx={{
                    color: isDarkMode ? alpha('#fff', 0.6) : alpha('#000', 0.5),
                    fontSize: { xs: '11px', sm: '12px' },
                    fontWeight: 400,
                  }}
                >
                  {post.countryLabels[currentLanguage] || post.countryLabels.en || post.countryname}
                </Typography>
              )}
            </Box>
          </Box>
        </CardContent>

        {/* Card Actions - Modern Design */}
        <CardActions
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            p: { xs: 2, sm: 2.5 },
            borderTop: '1px solid',
            borderColor: isDarkMode ? alpha('#fff', 0.08) : alpha('#000', 0.06),
            backgroundColor: isDarkMode ? alpha('#000', 0.3) : alpha('#f8f9fa', 0.8),
            gap: 1,
            mt: 'auto',
          }}
        >
          <Button
            onClick={() => {
              if (!usernameId) {
                navigate('/login');
              } else {
                handleReport();
              }
            }}
            variant="outlined"
            size="small"
            sx={{
              color: theme.palette.error.main,
              borderColor: theme.palette.error.main,
              textTransform: 'none',
              fontSize: { xs: '11px', sm: '12px' },
              fontWeight: 600,
              padding: { xs: '8px 12px', sm: '10px 16px' },
              borderRadius: '12px',
              '&:hover': {
                backgroundColor: theme.palette.error.main,
                color: '#fff',
                borderColor: theme.palette.error.main,
              },
            }}
            startIcon={<ReportProblemOutlined sx={{ fontSize: '14px' }} />}
          >
            {t('report')}
          </Button>

          <Button
            onClick={handleViewDetails}
            variant="contained"
            sx={{
              background: `linear-gradient(135deg, ${categoryStyle.main} 0%, ${categoryStyle.dark} 100%)`,
              color: '#fff',
              textTransform: 'none',
              fontSize: { xs: '11px', sm: '12px' },
              fontWeight: 700,
              padding: { xs: '8px 12px', sm: '10px 16px' },
              borderRadius: '12px',
              boxShadow: `0 4px 16px ${alpha(categoryStyle.main, 0.4)}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                background: `linear-gradient(135deg, ${categoryStyle.dark} 0%, ${categoryStyle.main} 100%)`,
                transform: 'translateY(-2px)',
                boxShadow: `0 6px 20px ${alpha(categoryStyle.main, 0.5)}`,
              },
            }}
            endIcon={<ArrowIcon sx={{ fontSize: '14px' }} />}
          >
            {t('viewDetails')}
          </Button>
        </CardActions>
      </Card>
    );
  } else return null;
};

const memoizedPost = memo(Post);

export default memoizedPost;
