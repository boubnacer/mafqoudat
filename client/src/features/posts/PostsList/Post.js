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
  Paper
} from "@mui/material";
import {
  LocationOnOutlined,
  KeyboardArrowRightOutlined,
  ReportProblemOutlined,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Category as CategoryIcon,
  Visibility as VisibilityIcon,
  ContactPhone as ContactIcon
} from "@mui/icons-material";
import FlexBetween from "../../../components/FlexBetween";
import { getCurrentLanguage, getLabel, isRTL, t } from "../../../utils/languageUtils";
import { formatDistanceToNow } from 'date-fns';
import { ar, fr, enUS } from 'date-fns/locale';
import RenderIcon from "../../../components/RenderIcon";

const Post = ({ post, viewMode = "grid" }) => {
  const { usernameId, foundLost } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery("(max-width:768px)");
  const navigate = useNavigate();
  const currentLanguage = getCurrentLanguage();
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

    const handleEdit = () => navigate(`/dash/posts/${post._id}`);
    const handleReport = () => navigate(`/dash/posts/report/${post._id}`);

    // Enhanced Found/Lost detection with proper multilingual support
    let foundLostValue = "FOUND"; // Default to FOUND
    let foundLostLabel = t('found'); // Default label
    let foundLostColor = theme.palette.success.main; // Default color
    
    // Debug logging to understand the data structure
    console.log('Post foundLost data:', post.foundLost);
    console.log('Post Floptions data:', post.Floptions);
    
    // Check multiple possible properties and structures
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
      } else if (post.foundLost._id) {
        // If it's an ObjectId, we need to check the actual value
        // This might be the issue - we need to get the actual post type from the backend
        foundLostValue = "FOUND"; // Default for ObjectId
        foundLostLabel = t('found');
      }
    }
    
    // Also check Floptions array if it exists (this might be the actual data)
    if (post.Floptions && post.Floptions.length > 0) {
      const flOption = post.Floptions[0];
      if (typeof flOption === 'string') {
        foundLostValue = flOption.toUpperCase();
        foundLostLabel = flOption === 'FOUND' ? t('found') : t('lost');
        foundLostColor = flOption === 'FOUND' ? theme.palette.success.main : theme.palette.error.main;
      } else if (flOption.code) {
        foundLostValue = flOption.code;
        foundLostLabel = getLabel(flOption.labels, currentLanguage) || 
                        (flOption.code === 'FOUND' ? t('found') : t('lost'));
        foundLostColor = flOption.color || 
                        (flOption.code === 'FOUND' ? theme.palette.success.main : theme.palette.error.main);
      }
    }

    // Normalize the value and set proper colors
    const isFound = foundLostValue === "FOUND";
    const statusColor = foundLostColor || (isFound ? theme.palette.success.main : theme.palette.error.main);
    const statusText = foundLostLabel;

    // Get category name safely with multilingual support
    const categoryName = post.categoryname || 
                        getLabel(post.category?.labels, currentLanguage) || 
                        t(post.category?.code?.toLowerCase()) || 
                        post.category?.code || 
                        t('unknownCategory');

    // RTL-aware styles
    const rtlStyles = isRTLMode ? {
      direction: 'rtl',
      textAlign: 'right'
    } : {
      direction: 'ltr',
      textAlign: 'left'
    };

    // Modern typography styles
    const typographyStyles = {
      fontFamily: isRTLMode ? 
        '"Noto Sans Arabic", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif' :
        '"Inter", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
      fontWeight: 500
    };

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
            ...rtlStyles
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
                image={post.image ? `http://localhost:3500/${post.image}` : ma}
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
                      ...typographyStyles
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
                    <Chip 
                      label={categoryName}
                      variant="outlined"
                      size="small"
                      icon={<RenderIcon name={`${post.category?.code?.toLowerCase()}cate`} />}
                      sx={{ 
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        height: '20px',
                        padding: '0 6px',
                        '& .MuiChip-icon': {
                          fontSize: '0.8rem',
                          marginLeft: isRTLMode ? '2px' : '2px',
                          marginRight: isRTLMode ? '2px' : '2px'
                        },
                        '& .MuiChip-label': {
                          padding: '0 4px'
                        }
                      }}
                    />
                  </Box>
                </Box>
                <Box display="flex" gap={1}>
                  <Tooltip title={t('viewDetails')}>
                    <IconButton 
                      onClick={handleEdit}
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
                  <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={typographyStyles}
                  >
                    {post.username || t('unknownUser')}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={typographyStyles}
                  >
                    {created}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <LocationOnOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={typographyStyles}
                  >
                    {post.countryname || t('unknownCountry')}
                  </Typography>
                </Box>
                {post.contact && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <ContactIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={typographyStyles}
                    >
                      {post.contact}
                    </Typography>
                  </Box>
                )}
              </Box>

              <Box sx={{ mt: 'auto' }}>
                <Button
                  variant="contained"
                  endIcon={<KeyboardArrowRightOutlined data-directional="true" />}
                  onClick={handleEdit}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    ...typographyStyles
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

    // Grid view layout (default)
    return (
      <Card 
        sx={{ 
          borderRadius: 3,
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme.shadows[8]
          },
          ...rtlStyles
        }}
      >
        {/* Image */}
        <Box sx={{ position: 'relative' }}>
          <CardMedia
            component="img"
            sx={{ 
              height: 200,
              objectFit: 'cover'
            }}
            image={post.image ? `http://localhost:3500/${post.image}` : ma}
            title={post.image}
          />
          
          {/* Status Badge */}
          <Chip 
            label={statusText}
            size="small"
            sx={{
              position: 'absolute',
              top: 12,
              left: isRTLMode ? 'auto' : 12,
              right: isRTLMode ? 12 : 'auto',
              fontWeight: 600,
              backgroundColor: statusColor,
              color: 'white',
              '& .MuiChip-label': {
                color: 'white'
              }
            }}
          />

          {/* Category Badge */}
          <Chip 
            label={categoryName}
            variant="outlined"
            size="small"
            icon={<RenderIcon name={`${post.category?.code?.toLowerCase()}cate`} />}
            sx={{
              position: 'absolute',
              top: 12,
              left: isRTLMode ? 12 : 'auto',
              right: isRTLMode ? 'auto' : 12,
              backgroundColor: 'rgba(255,255,255,0.95)',
              fontWeight: 600,
              fontSize: '0.7rem',
              height: '20px',
              padding: '0 6px',
              '& .MuiChip-icon': {
                fontSize: '0.8rem',
                marginLeft: isRTLMode ? '2px' : '2px',
                marginRight: isRTLMode ? '2px' : '2px'
              },
              '& .MuiChip-label': {
                padding: '0 4px'
              }
            }}
          />
        </Box>

        {/* Content */}
        <CardContent sx={{ flex: 1, p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Typography 
              variant="h6" 
              fontWeight={600}
              sx={{ 
                color: theme.palette.textColor.main,
                lineHeight: 1.2,
                ...typographyStyles
              }}
            >
              {post.region || t('unknownRegion')}
            </Typography>
          </Box>

          <Box display="flex" flexDirection="column" gap={1.5}>
            <Box display="flex" alignItems="center" gap={1}>
              <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={typographyStyles}
              >
                {post.username || t('unknownUser')}
              </Typography>
            </Box>
            
            <Box display="flex" alignItems="center" gap={1}>
              <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={typographyStyles}
              >
                {created}
              </Typography>
            </Box>
            
            <Box display="flex" alignItems="center" gap={1}>
              <LocationOnOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={typographyStyles}
              >
                {post.countryname || t('unknownCountry')}
              </Typography>
            </Box>

            {post.contact && (
              <Box display="flex" alignItems="center" gap={1}>
                <ContactIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  noWrap
                  sx={typographyStyles}
                >
                  {post.contact}
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>

        {/* Actions */}
        <CardActions 
          sx={{
            p: 3,
            pt: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 1
          }}
        >
          <Button
            variant="outlined"
            size="small"
            startIcon={<ReportProblemOutlined />}
            onClick={handleReport}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              color: theme.palette.error.main,
              borderColor: theme.palette.error.main,
              '&:hover': {
                backgroundColor: theme.palette.error.light + '20',
                borderColor: theme.palette.error.main
              },
              ...typographyStyles
            }}
          >
            {t('report')}
          </Button>
          
          <Button
            variant="contained"
            size="small"
            endIcon={<KeyboardArrowRightOutlined />}
            onClick={handleEdit}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 2,
              ...typographyStyles
            }}
          >
            {t('view')}
          </Button>
        </CardActions>
      </Card>
    );
  } else return null;
};

const memoizedPost = memo(Post);

export default memoizedPost;
