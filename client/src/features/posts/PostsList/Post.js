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
  Divider,
} from "@mui/material";
import {
  LocationOn as LocationIcon,
  LocationOnOutlined,
  KeyboardArrowRightOutlined,
  ReportProblemOutlined,
  CalendarToday as CalendarIcon,
  Category as CategoryIcon,
  Visibility as VisibilityIcon,
  ArrowForward as ArrowIcon,
  AccessTime as TimeIcon,
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
    
    // Check Floptions array first (this contains the actual found/lost data from the lookup)
    if (post.Floptions && post.Floptions.length > 0) {
      const flOption = post.Floptions[0];
      if (flOption && flOption.code) {
        foundLostValue = flOption.code;
        foundLostLabel = getLabel(flOption.labels, currentLanguage) || 
                        (flOption.code === 'FOUND' ? t('found') : t('lost'));
        foundLostColor = flOption.color || 
                        (flOption.code === 'FOUND' ? theme.palette.success.main : theme.palette.error.main);
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

    // Updated category color function with better color matching
    const getCategoryColor = (category) => {
      const categoryColors = {
        Bag: { 
          main: '#4CAF50', 
          light: '#E8F5E9', 
          dark: '#2E7D32', 
          icon: '#2E7D32',
          background: '#E8F5E9',
          text: '#2E7D32'
        },
        keys: { 
          main: '#FF9800', 
          light: '#FFF3E0', 
          dark: '#E65100', 
          icon: '#E65100',
          background: '#FFF3E0',
          text: '#E65100'
        },
        person: { 
          main: '#2196F3', 
          light: '#E3F2FD', 
          dark: '#1565C0', 
          icon: '#1565C0',
          background: '#E3F2FD',
          text: '#1565C0'
        },
        Money: { 
          main: '#9C27B0', 
          light: '#F3E5F5', 
          dark: '#6A1B9A', 
          icon: '#6A1B9A',
          background: '#F3E5F5',
          text: '#6A1B9A'
        },
        Devices: { 
          main: '#00BCD4', 
          light: '#E0F7FA', 
          dark: '#00838F', 
          icon: '#00838F',
          background: '#E0F7FA',
          text: '#00838F'
        },
        Wallet: { 
          main: '#FF5722', 
          light: '#FBE9E7', 
          dark: '#BF360C', 
          icon: '#BF360C',
          background: '#FBE9E7',
          text: '#BF360C'
        },
        Vehicle: { 
          main: '#607D8B', 
          light: '#ECEFF1', 
          dark: '#37474F', 
          icon: '#37474F',
          background: '#ECEFF1',
          text: '#37474F'
        },
        Document: { 
          main: '#795548', 
          light: '#EFEBE9', 
          dark: '#4E342E', 
          icon: '#4E342E',
          background: '#EFEBE9',
          text: '#4E342E'
        },
      };
      return categoryColors[category] || categoryColors.Bag;
    };

    const categoryStyle = getCategoryColor(categoryName);
    const isDarkMode = theme.palette.mode === 'dark';

    // Extract city from location (show only city)
    const getCityFromLocation = (location) => {
      if (!location) return t('unknownLocation');
      // Split by comma and take the first part (usually the city)
      const parts = location.split(',');
      return parts[0].trim();
    };

    const cityName = getCityFromLocation(post.exactLocation || post.region);

    // List view layout
    if (viewMode === "list") {
      return (
        <Paper 
          elevation={0}
          sx={{ 
            borderRadius: 4,
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            border: `1px solid ${isDarkMode ? alpha('#fff', 0.08) : alpha('#000', 0.06)}`,
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: isDarkMode 
                ? '0 12px 40px rgba(0, 0, 0, 0.3)'
                : '0 12px 40px rgba(0, 0, 0, 0.1)',
            },
            direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
            backgroundColor: isDarkMode ? alpha('#1a1a1a', 0.8) : '#ffffff'
          }}
        >
          <Box display="flex" sx={{ height: { xs: 'auto', sm: 180 } }}>
            {/* Image Section */}
            <Box sx={{ 
              width: { xs: '100%', sm: 200 }, 
              height: { xs: 160, sm: 180 },
              flexShrink: 0 
            }}>
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
                  e.target.src = ma;
                }}
              />
            </Box>

            {/* Content Section */}
            <Box sx={{ 
              flex: 1, 
              p: { xs: 2, sm: 3 }, 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              {/* Header */}
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box sx={{ flex: 1 }}>
                    <Typography 
                      variant="h6" 
                      fontWeight={700} 
                      sx={{ 
                        mb: 1,
                        direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                        color: isDarkMode ? '#ffffff' : '#1a1a1a'
                      }}
                    >
                      {cityName}
                    </Typography>
                    <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                      <Chip 
                        label={statusText}
                        size="small"
                        sx={{ 
                          fontWeight: 600,
                          backgroundColor: statusColor,
                          color: 'white',
                          fontSize: '11px',
                          height: 24,
                          '& .MuiChip-label': {
                            color: 'white'
                          }
                        }}
                      />
                      <Box
                        sx={{
                          backgroundColor: isDarkMode ? alpha(categoryStyle.main, 0.15) : categoryStyle.background,
                          padding: '4px 8px',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          border: `1px solid ${isDarkMode ? alpha(categoryStyle.main, 0.3) : categoryStyle.main}`,
                        }}
                      >
                        <RenderIcon 
                          name={`${categoryName?.toLowerCase()}cate`} 
                          sx={{ 
                            fontSize: '12px', 
                            color: isDarkMode ? categoryStyle.main : categoryStyle.text 
                          }} 
                        />
                        <Typography
                          sx={{
                            color: isDarkMode ? categoryStyle.main : categoryStyle.text,
                            fontSize: '11px',
                            fontWeight: 600,
                          }}
                        >
                          {t(categoryName?.toLowerCase()) || categoryName}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Box display="flex" gap={0.5}>
                    <Tooltip title={t('viewDetails')}>
                      <IconButton 
                        onClick={handleViewDetails}
                        size="small"
                        sx={{ 
                          color: theme.palette.primary.main,
                          '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.1) }
                        }}
                      >
                        <VisibilityIcon sx={{ fontSize: 18 }} />
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
                          '&:hover': { backgroundColor: alpha(theme.palette.error.main, 0.1) }
                        }}
                      >
                        <ReportProblemOutlined sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                {/* Location and Time */}
                <Box display="flex" gap={2} mb={2} flexWrap="wrap">
                  <Box display="flex" alignItems="center" gap={1}>
                    <LocationIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ direction: currentLanguage === 'ar' ? 'rtl' : 'ltr' }}
                    >
                      {cityName}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <TimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ direction: currentLanguage === 'ar' ? 'rtl' : 'ltr' }}
                    >
                      {created}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Actions */}
              <Box sx={{ mt: 'auto' }}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleViewDetails}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    '&:hover': {
                      background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                    }
                  }}
                  endIcon={<ArrowIcon />}
                >
                  {t('viewDetails')}
                </Button>
              </Box>
            </Box>
          </Box>
        </Paper>
      );
    }

    // Grid view layout - Brand New Modern Design
    return (
      <Card
        sx={{
          backgroundColor: isDarkMode ? alpha('#1a1a1a', 0.9) : '#ffffff',
          position: 'relative',
          boxShadow: 'none',
          border: `1px solid ${isDarkMode ? alpha('#fff', 0.08) : alpha('#000', 0.06)}`,
          height: { xs: 'auto', sm: '320px' },
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          borderRadius: '20px',
          overflow: 'hidden',
          '&:hover': {
            transform: { xs: 'none', sm: 'translateY(-4px)' },
            boxShadow: isDarkMode
              ? '0 20px 40px rgba(0, 0, 0, 0.3)'
              : '0 20px 40px rgba(0, 0, 0, 0.08)',
          },
          direction: currentLanguage === 'ar' ? 'rtl' : 'ltr'
        }}
      >
        {/* Image Section with Overlays */}
        <Box sx={{ position: 'relative', height: { xs: '200px', sm: '180px' } }}>
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
              e.target.src = ma;
            }}
          />
          
          {/* Gradient Overlay */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 100%)',
              pointerEvents: 'none'
            }}
          />

          {/* Top Badges Container */}
          <Box
            sx={{
              position: 'absolute',
              top: 12,
              left: 12,
              right: 12,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 1,
            }}
          >
            {/* Status Badge */}
            <Chip 
              label={statusText}
              size="small"
              sx={{
                fontWeight: 700,
                backgroundColor: alpha(statusColor, 0.95),
                color: 'white',
                backdropFilter: 'blur(10px)',
                border: `1px solid ${alpha(statusColor, 0.3)}`,
                fontSize: '10px',
                height: 24,
                '& .MuiChip-label': {
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: 700,
                }
              }}
            />

            {/* Category Badge */}
            <Box
              sx={{
                backgroundColor: isDarkMode ? alpha(categoryStyle.main, 0.2) : categoryStyle.background,
                padding: '4px 8px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${isDarkMode ? alpha(categoryStyle.main, 0.3) : categoryStyle.main}`,
              }}
            >
              <RenderIcon 
                name={`${categoryName?.toLowerCase()}cate`} 
                sx={{ 
                  fontSize: '12px', 
                  color: isDarkMode ? categoryStyle.main : categoryStyle.text 
                }} 
              />
              <Typography
                sx={{
                  color: isDarkMode ? categoryStyle.main : categoryStyle.text,
                  fontSize: '10px',
                  fontWeight: 600,
                }}
              >
                {t(categoryName?.toLowerCase()) || categoryName}
              </Typography>
            </Box>
          </Box>

          {/* Time Badge */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 12,
              left: 12,
              backgroundColor: alpha('#000', 0.7),
              padding: '4px 8px',
              borderRadius: '8px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <TimeIcon sx={{ fontSize: '12px', color: '#fff' }} />
              <Typography
                sx={{
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: 600,
                }}
              >
                {created}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Content Section */}
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
                width: 28,
                height: 28,
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
              }}
            >
              <LocationIcon sx={{ fontSize: '16px' }} />
            </Avatar>
            <Box>
              <Typography
                sx={{
                  color: isDarkMode ? alpha('#fff', 0.9) : alpha('#000', 0.8),
                  fontSize: { xs: '14px', sm: '16px' },
                  fontWeight: 700,
                  lineHeight: 1.2,
                }}
              >
                {cityName}
              </Typography>
              {post.countryLabels && (
                <Typography
                  sx={{
                    color: isDarkMode ? alpha('#fff', 0.5) : alpha('#000', 0.4),
                    fontSize: { xs: '11px', sm: '12px' },
                    fontWeight: 400,
                  }}
                >
                  {post.countryLabels[currentLanguage] || post.countryLabels.en || post.countryname}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Description Preview (if available) */}
          {post.description && (
            <Typography
              sx={{
                color: isDarkMode ? alpha('#fff', 0.7) : alpha('#000', 0.6),
                fontSize: { xs: '12px', sm: '13px' },
                fontWeight: 400,
                lineHeight: 1.4,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {post.description}
            </Typography>
          )}
        </CardContent>

        {/* Actions Section */}
        <CardActions
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            p: { xs: 1.5, sm: 2 },
            borderTop: '1px solid',
            borderColor: isDarkMode ? alpha('#fff', 0.06) : alpha('#000', 0.04),
            backgroundColor: isDarkMode ? alpha('#000', 0.2) : alpha('#f8f9fa', 0.5),
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
              fontSize: { xs: '10px', sm: '11px' },
              fontWeight: 600,
              padding: { xs: '6px 10px', sm: '8px 12px' },
              borderRadius: '8px',
              minWidth: 'auto',
              '&:hover': {
                backgroundColor: theme.palette.error.main,
                color: '#fff',
                borderColor: theme.palette.error.main,
              },
            }}
            startIcon={<ReportProblemOutlined sx={{ fontSize: '12px' }} />}
          >
            {t('report')}
          </Button>

          <Button
            onClick={handleViewDetails}
            variant="contained"
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              color: '#fff',
              textTransform: 'none',
              fontSize: { xs: '10px', sm: '11px' },
              fontWeight: 700,
              padding: { xs: '6px 10px', sm: '8px 12px' },
              borderRadius: '8px',
              minWidth: 'auto',
              boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
              transition: 'all 0.3s ease',
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                transform: 'translateY(-1px)',
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
              },
            }}
            endIcon={<ArrowIcon sx={{ fontSize: '12px' }} />}
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
