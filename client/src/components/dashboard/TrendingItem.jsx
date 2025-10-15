import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Typography,
  useTheme,
  useMediaQuery,
  Chip,
  Avatar,
  alpha,
} from "@mui/material";
import { useMemo } from "react";
import FlexBetween from "../FlexBetween";
import RenderIcon from "../RenderIcon";
import { TrendingItemSkeleton, DashboardEmptyStates } from "../LoadingStates";
import { useTranslation } from "../../utils/translations";
import { getOptimizedImageUrl } from "../../utils/cloudinaryUtils";
import LazyCardMedia from "../LazyCardMedia";
import { getCategoryConfig } from "../../config/categories";
import { useNavigate } from "react-router-dom";
import { getLabel } from "../../utils/languageUtils";
import noImageSvg from "../../img/noimage.svg";

// Get the API base URL for image construction
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3500";

const TrendingItem = ({ trend, isLoading }) => {
  // Handle both array and single object formats
  const trendData = Array.isArray(trend) ? trend[0] : trend;
  const { _id, categoryname, floptionName, image, createdAt, countryLabels, countryname, city, cityLabels, cityName, Floptions, Category } = trendData || {};
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const { t, currentLanguage } = useTranslation();
  const navigate = useNavigate();

  // Get city name with proper priority
  const getCityName = () => {
    // First priority: Use the populated city data from the API
    if (cityLabels && cityLabels[currentLanguage]) {
      return cityLabels[currentLanguage];
    }
    // Second priority: Use the English city name as fallback
    if (cityName) {
      return cityName;
    }
    // Third priority: Use the city field directly (for custom city names)
    if (city && typeof city === 'string' && city.trim()) {
      return city.trim();
    }
    // Last fallback: "Unknown City"
    return t('unknownCity') || 'Unknown City';
  };

  const displayCityName = getCityName();

  // Get category name safely with multilingual support (same as PostsList)
  const categoryDisplayName = useMemo(() => {
    // First priority: Use the Category object from API aggregation (with labels)
    if (Category && Category.labels) {
      return Category.labels[currentLanguage] || Category.labels.en || Category.code || categoryname;
    }
    
    // Last fallback: return the original categoryname or unknown
    return categoryname || t('unknownCategory');
  }, [Category, categoryname, currentLanguage, t]);

  // Get category colors using centralized configuration (same as RecentPosts)
  const getCategoryColors = (category) => {
    const config = getCategoryConfig(category);
    const isDarkMode = theme.palette.mode === 'dark';
    
    return {
      main: config.color,
      light: config.backgroundColor,
      dark: config.color,
      icon: config.color,
      background: isDarkMode ? alpha(config.backgroundColor, 0.2) : config.backgroundColor,
      text: config.color
    };
  };

  const categoryStyle = getCategoryColors(categoryname);

  // Get found/lost status with proper colors from database (same as PostsList)
  const foundLostStatus = useMemo(() => {
    // Simple and direct approach based on server logs
    let foundLostValue = "FOUND"; // Default
    let foundLostLabel = t('found'); // Default
    let foundLostColor = "#4CAF50"; // Default green for FOUND
    
    // Priority 1: Use Floptions.code if available
    if (Floptions && Floptions.code) {
      foundLostValue = Floptions.code;
      foundLostColor = Floptions.color || "#4CAF50";
      
      // Simple label logic
      if (Floptions.code === 'FOUND') {
        foundLostLabel = t('found');
      } else if (Floptions.code === 'LOST') {
        foundLostLabel = t('lost');
        foundLostColor = foundLostColor || "#F44336";
      }
    }
    // Priority 2: Use floptionName as fallback
    else if (floptionName) {
      foundLostValue = floptionName.toUpperCase();
      if (floptionName.toUpperCase() === 'FOUND') {
        foundLostLabel = t('found');
        foundLostColor = "#4CAF50";
      } else if (floptionName.toUpperCase() === 'LOST') {
        foundLostLabel = t('lost');
        foundLostColor = "#F44336";
      }
    }

    const isFound = foundLostValue === "FOUND";
    return { 
      value: foundLostValue,
      label: foundLostLabel,
      color: foundLostColor,
      isFound 
    };
  }, [Floptions, floptionName, currentLanguage, t]);

  // Handle navigation to post
  const handleViewPost = () => {
    if (_id) {
      navigate(`/dash/posts/${_id}`);
    }
  };

  // Get optimized image URL - only use Cloudinary if image exists and is uploaded by user
  const finalImageUrl = image ? (image.startsWith('http') ? getOptimizedImageUrl(image, 'card') : `${API_BASE_URL}/${image}`) : noImageSvg;

  if (isLoading) return <TrendingItemSkeleton />;
  if (!trendData) {
    return <DashboardEmptyStates.NoTrending />;
  }

  // Additional safety check for required fields
  if (!_id || !categoryname) {
    return <DashboardEmptyStates.NoTrending />;
  }

  return (
    <Box flex={1} sx={{ 
      minWidth: isMobile ? '100%' : 'auto', 
      width: isMobile ? '100%' : 'auto',
    }}>
      <Card
        sx={{
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, rgba(18,18,18,0.85) 0%, rgba(28,28,28,0.9) 50%, rgba(35,35,35,0.85) 100%)'
            : 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.95) 50%, rgba(255,255,255,0.9) 100%)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderRadius: isMobile ? '16px' : '24px',
          border: 'none',
          overflow: 'hidden',
          transition: 'none',
          boxShadow: theme.palette.mode === 'dark'
            ? `
              0 4px 6px -1px rgba(0, 0, 0, 0.1),
              0 2px 4px -1px rgba(0, 0, 0, 0.06),
              0 8px 25px -5px rgba(0, 0, 0, 0.25),
              inset 0 1px 0 rgba(255, 255, 255, 0.1)
            `
            : `
              0 4px 6px -1px rgba(0, 0, 0, 0.1),
              0 2px 4px -1px rgba(0, 0, 0, 0.06),
              0 8px 25px -5px rgba(0, 0, 0, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.8)
            `,
          height: '100%',
          minHeight: { xs: '450px', sm: '350px' },
          position: 'relative',
        }}
      >
        {/* Large Background Image */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 0,
            overflow: 'hidden',
            backgroundColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <LazyCardMedia
            component="img"
            image={finalImageUrl}
            alt={categoryDisplayName || 'Item Image'}
            fallback={noImageSvg}
            sx={{
              width: image ? '100%' : '100%',
              height: image ? '100%' : '100%',
              objectFit: image ? 'cover' : 'contain',
              objectPosition: 'center',
              filter: image ? 'brightness(0.8)' : 'none',
              backgroundColor: image ? 'transparent' : (theme.palette.mode === 'dark' ? '#000' : '#fff'),
              // Ensure the smaller image is properly centered
              ...(image ? {} : {
                margin: 'auto',
                display: 'block',
              }),
            }}
          />
          
          {/* No Image Overlay */}
          {!image && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 3,
                textAlign: 'center',
                backgroundColor: alpha(theme.palette.mode === 'dark' ? '#000' : '#fff', 0.9),
                borderRadius: '12px',
                padding: '12px 16px',
                backdropFilter: 'blur(10px)',
                border: `1px solid ${alpha(theme.palette.mode === 'dark' ? '#fff' : '#000', 0.1)}`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
            >
              <Typography
                sx={{
                  color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                  fontSize: { xs: '12px', sm: '13px' },
                  fontWeight: 600,
                  lineHeight: 1.2,
                }}
              >
                {t('noImageAvailable')}
              </Typography>
            </Box>
          )}
          {/* Gradient overlay for better text readability */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 100%)', // Lighter overlay for better image visibility
              pointerEvents: 'none'
            }}
          />
        </Box>

        {/* Content Overlay */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            p: { xs: 3, sm: 2.5 }
          }}
        >

          {/* Top Section - Badges */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              mb: 2
            }}
          >
            {/* Left Side - Trending Badge */}
            <Box
              sx={{
                background: 'linear-gradient(45deg, #FF9800, #FFC107, #FF9800)',
                backgroundSize: '200% 200%',
                padding: { xs: '4px 8px', sm: '6px 12px' },
                borderRadius: '20px',
                boxShadow: '0 4px 15px rgba(255,152,0,0.4), 0 0 20px rgba(255,152,0,0.2)',
                animation: 'trendingPulse 3s ease-in-out infinite, trendingGradient 4s ease-in-out infinite',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: '0 6px 20px rgba(255,152,0,0.6), 0 0 30px rgba(255,152,0,0.3)',
                },
                '@keyframes trendingPulse': {
                  '0%': {
                    boxShadow: '0 4px 15px rgba(255,152,0,0.4), 0 0 20px rgba(255,152,0,0.2)',
                    transform: 'scale(1)',
                  },
                  '50%': {
                    boxShadow: '0 6px 25px rgba(255,152,0,0.6), 0 0 35px rgba(255,152,0,0.4)',
                    transform: 'scale(1.02)',
                  },
                  '100%': {
                    boxShadow: '0 4px 15px rgba(255,152,0,0.4), 0 0 20px rgba(255,152,0,0.2)',
                    transform: 'scale(1)',
                  },
                },
                '@keyframes trendingGradient': {
                  '0%': {
                    backgroundPosition: '0% 50%',
                  },
                  '50%': {
                    backgroundPosition: '100% 50%',
                  },
                  '100%': {
                    backgroundPosition: '0% 50%',
                  },
                },
              }}
            >
              <Typography
                sx={{
                  color: '#fff',
                  fontSize: { xs: '11px', sm: '13px' },
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                }}
              >
🔥 {t('trending')}
              </Typography>
            </Box>
            
            {/* Right Side Badges Container */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                alignItems: 'flex-end',
              }}
            >
              {/* Status Badge - Moved to top */}
              <Chip
                icon={<RenderIcon name={`${foundLostStatus.value.toLowerCase()}fl`} sx={{ fontSize: { xs: '16px', sm: '16px' } }} />}
                label={foundLostStatus.label}
                sx={{
                  backgroundColor: alpha(foundLostStatus.color, 0.95),
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: { xs: '13px', sm: '13px', md: '14px' },
                  height: { xs: '30px', sm: '30px', md: '32px' },
                  padding: { xs: '0 12px', sm: '0 12px', md: '0 16px' },
                  borderRadius: { xs: '12px', sm: '16px' },
                  boxShadow: `0 2px 8px ${alpha(foundLostStatus.color, 0.4)}, 0 0 15px ${alpha(foundLostStatus.color, 0.2)}`,
                  border: `1px solid ${alpha(foundLostStatus.color, 0.3)}`,
                  backdropFilter: 'blur(15px)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  '& .MuiChip-icon': {
                    color: '#fff',
                    marginLeft: 0,
                    transition: 'transform 0.3s ease',
                  },
                  '& .MuiChip-label': {
                    paddingLeft: { xs: '4px', sm: '6px' },
                    paddingRight: { xs: '4px', sm: '6px' },
                    transition: 'all 0.3s ease',
                  },
                  '&:hover': {
                    backgroundColor: alpha(foundLostStatus.color, 1),
                    transform: 'translateY(-2px) scale(1.05)',
                    boxShadow: `0 6px 20px ${alpha(foundLostStatus.color, 0.6)}, 0 0 25px ${alpha(foundLostStatus.color, 0.3)}`,
                    '& .MuiChip-icon': {
                      transform: 'scale(1.1) rotate(5deg)',
                    },
                    '& .MuiChip-label': {
                      transform: 'scale(1.02)',
                    }
                  }
                }}
              />
              
              {/* Category Badge - Moved to bottom */}
              <Box
                sx={{
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgb(232, 245, 233)' : categoryStyle.background,
                  padding: { xs: '6px 12px', sm: '6px 12px' },
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  backdropFilter: 'blur(15px)',
                  border: `1px solid ${theme.palette.mode === 'dark' ? alpha(categoryStyle.main, 0.3) : categoryStyle.main}`,
                  zIndex: 11, // Higher z-index for category badge (same as RecentPosts)
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  boxShadow: `0 2px 8px ${alpha(categoryStyle.main, 0.2)}, 0 0 12px ${alpha(categoryStyle.main, 0.1)}`,
                  '&:hover': {
                    transform: 'translateY(-1px) scale(1.03)',
                    boxShadow: `0 4px 15px ${alpha(categoryStyle.main, 0.3)}, 0 0 20px ${alpha(categoryStyle.main, 0.15)}`,
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? alpha('rgb(232, 245, 233)', 0.9) 
                      : alpha(categoryStyle.background, 0.8),
                  }
                }}
              >
                <RenderIcon 
                  name={`${categoryname?.toLowerCase()}cate`} 
                  sx={{ 
                    fontSize: { xs: '18px', sm: '18px' }, 
                    color: theme.palette.mode === 'dark' ? categoryStyle.main : categoryStyle.text
                  }} 
                />
                <Typography
                  sx={{
                    color: theme.palette.mode === 'dark' ? categoryStyle.main : categoryStyle.text,
                    fontSize: { xs: '14px', sm: '14px' },
                    fontWeight: 700, // Changed from 600 to 700 (same as RecentPosts)
                    lineHeight: 1,
                  }}
                >
                  {categoryDisplayName}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Middle Section - Main Content - Optimized for better image visibility */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            {/* Empty space for better visual balance */}
          </Box>

          {/* Bottom Section - Info and Action */}
          <Box>
            {/* Info Row */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
                p: { xs: 2, sm: 1.5 },
                backgroundColor: alpha('#000', 0.4),
                borderRadius: '16px',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: alpha('#000', 0.5),
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <RenderIcon name="time" sx={{ fontSize: { xs: '18px', sm: '16px' }, color: '#fff' }} />
                <Typography
                  sx={{
                    color: '#fff',
                    fontSize: { xs: '16px', sm: '14px' },
                    fontWeight: 500,
                  }}
                >
                  {new Date(createdAt).toLocaleDateString()}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <RenderIcon name="locat" sx={{ fontSize: { xs: '16px', sm: '14px' }, color: '#fff' }} />
                <Typography
                  sx={{
                    color: '#fff',
                    fontSize: { xs: '15px', sm: '13px' },
                    fontWeight: 400,
                    maxWidth: '80px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {displayCityName}
                </Typography>
              </Box>
            </Box>
            {/* Action Button */}
        <Button
          fullWidth
          variant="contained"
          onClick={handleViewPost}
          sx={{
            background: 'linear-gradient(45deg, #4A8BFF 30%, #1A6EEE 90%)',
            backgroundSize: '200% 200%',
            color: '#fff',
            borderRadius: '12px',
            padding: { xs: '14px', sm: '12px' },
            textTransform: 'none',
            fontSize: { xs: '16px', sm: '14px' },
            fontWeight: 600,
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 4px 15px rgba(26, 110, 238, 0.3), 0 0 20px rgba(26, 110, 238, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
              transition: 'left 0.5s ease',
            },
            '&:hover': {
              background: 'linear-gradient(45deg, #5A9BFF 30%, #2A7EFF 90%)',
              boxShadow: '0 8px 25px rgba(26, 110, 238, 0.4), 0 0 30px rgba(26, 110, 238, 0.2)',
              transform: 'translateY(-2px)',
              '&::before': {
                left: '100%',
              },
            },
            '&:active': {
              transform: 'translateY(0px)',
              boxShadow: '0 4px 15px rgba(26, 110, 238, 0.3)',
            }
          }}
          endIcon={<RenderIcon name="view" sx={{ fontSize: { xs: '18px', sm: '16px' }, transition: 'transform 0.3s ease' }} />}
        >
          {t('viewDetails')}
        </Button>
          </Box>
        </Box>
      </Card>
    </Box>
  );
};


export default TrendingItem;