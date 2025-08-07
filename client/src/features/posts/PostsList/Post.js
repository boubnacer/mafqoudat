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
  LocationOnOutlined,
  KeyboardArrowRightOutlined,
  ReportProblemOutlined,
  CalendarToday as CalendarIcon,
  Category as CategoryIcon,
  Visibility as VisibilityIcon
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
        Bag: { main: '#4CAF50', light: '#E8F5E9', dark: '#2E7D32' },
        keys: { main: '#FF9800', light: '#FFF3E0', dark: '#E65100' },
        person: { main: '#2196F3', light: '#E3F2FD', dark: '#1565C0' },
        Money: { main: '#9C27B0', light: '#F3E5F5', dark: '#6A1B9A' },
        Devices: { main: '#00BCD4', light: '#E0F7FA', dark: '#00838F' },
        Wallet: { main: '#FF5722', light: '#FBE9E7', dark: '#BF360C' },
        Vehicle: { main: '#607D8B', light: '#ECEFF1', dark: '#37474F' },
        Document: { main: '#795548', light: '#EFEBE9', dark: '#4E342E' },
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
                  objectFit: 'cover'
                }}
                image={post.image ? `${API_BASE_URL}/${post.image}` : ma}
                title={post.image}
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
                    {post.region || t('unknownRegion')}
                  </Typography>
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
                      onClick={handleReport}
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
                    {post.region || t('unknownRegion')}
                  </Typography>
                </Box>
              </Box>

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

    // Grid view layout (matching RecentPosts styling)
    return (
      <Card
        sx={{
          backgroundColor: isDarkMode ? alpha('#1E1E1E', 0.8) : '#FFFFFF',
          position: 'relative',
          boxShadow: isDarkMode 
            ? '0 4px 20px rgba(0, 0, 0, 0.3)'
            : '0 4px 20px rgba(0, 0, 0, 0.08)',
          height: { xs: 'auto', sm: '20rem' },
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease-in-out',
          borderRadius: '12px',
          overflow: 'hidden',
          '&:hover': {
            transform: { xs: 'none', sm: 'translateY(-4px)' },
            boxShadow: isDarkMode
              ? '0 8px 24px rgba(0, 0, 0, 0.4)'
              : '0 8px 24px rgba(0, 0, 0, 0.12)',
          },
          direction: currentLanguage === 'ar' ? 'rtl' : 'ltr'
        }}
      >
        {/* Card Image */}
        <CardMedia
          sx={{
            height: { xs: '160px', sm: '180px' },
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '50%',
              background: isDarkMode
                ? 'linear-gradient(to top, rgba(30, 30, 30, 0.9), transparent)'
                : 'linear-gradient(to top, rgba(255, 255, 255, 0.9), transparent)',
            },
          }}
          image={post.image ? `${API_BASE_URL}/${post.image}` : ma}
          title={categoryName}
        />

        {/* Status Badge */}
        <Chip 
          label={statusText}
          size="small"
          sx={{
            position: 'absolute',
            top: 12,
            left: currentLanguage === 'ar' ? 'auto' : 12,
            right: currentLanguage === 'ar' ? 12 : 'auto',
            fontWeight: 600,
            backgroundColor: statusColor,
            color: 'white',
            '& .MuiChip-label': {
              color: 'white'
            }
          }}
        />

        {/* Card Content */}
        <CardContent 
          sx={{ 
            flexGrow: 1, 
            p: { xs: 2, sm: 2.5 },
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          {/* Category Badge */}
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

          {/* Location and Date Info */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <RenderIcon name="locat" />
              <Typography
                sx={{
                  color: isDarkMode ? alpha('#fff', 0.9) : alpha('#000', 0.8),
                  fontSize: { xs: '13px', sm: '14px' },
                  fontWeight: 500,
                }}
              >
                {post.region || t('unknownRegion')}
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <RenderIcon name="timerace" />
              <Typography
                sx={{
                  color: isDarkMode ? alpha('#fff', 0.7) : alpha('#000', 0.6),
                  fontSize: { xs: '13px', sm: '14px' },
                  fontWeight: 500,
                }}
              >
                {new Date(post.createdAt).toLocaleDateString()}
              </Typography>
            </Box>


          </Box>
        </CardContent>

        {/* Card Actions */}
        <CardActions
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            p: { xs: 1.5, sm: 2 },
            borderTop: '1px solid',
            borderColor: isDarkMode ? alpha('#fff', 0.1) : alpha('#000', 0.1),
            backgroundColor: isDarkMode ? alpha('#000', 0.2) : alpha('#f5f5f5', 0.5),
          }}
        >
          <Button
            onClick={handleReport}
            sx={{
              color: theme.palette.error.main,
              textTransform: 'none',
              fontSize: { xs: '13px', sm: '14px' },
              fontWeight: 600,
              padding: '6px 12px',
              borderRadius: '20px',
              backgroundColor: isDarkMode ? alpha(theme.palette.error.main, 0.1) : alpha(theme.palette.error.main, 0.08),
              '&:hover': {
                backgroundColor: isDarkMode ? alpha(theme.palette.error.main, 0.2) : alpha(theme.palette.error.main, 0.12),
              },
            }}
            startIcon={<ReportProblemOutlined />}
          >
            {t('report')}
          </Button>

          <Button
            onClick={handleViewDetails}
            sx={{
              color: isDarkMode ? categoryStyle.main : categoryStyle.dark,
              textTransform: 'none',
              fontSize: { xs: '13px', sm: '14px' },
              fontWeight: 600,
              padding: '6px 16px',
              borderRadius: '20px',
              backgroundColor: isDarkMode ? alpha(categoryStyle.main, 0.1) : alpha(categoryStyle.main, 0.08),
              '&:hover': {
                backgroundColor: isDarkMode ? alpha(categoryStyle.main, 0.2) : alpha(categoryStyle.main, 0.12),
              },
            }}
            endIcon={<RenderIcon name="view" data-directional="true" />}
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
