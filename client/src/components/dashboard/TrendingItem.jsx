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
      {/* Pinterest Pinboard Container with Frame Border */}
      <Card
        sx={{
          // Corkboard/Wall Pinboard Background
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #654321 0%, #8B4513 50%, #654321 100%)'
            : 'linear-gradient(135deg, #D2B48C 0%, #DEB887 50%, #D2B48C 100%)',
          borderRadius: isMobile ? '16px' : '20px',
          padding: { xs: '8px', sm: '12px' },
          position: 'relative',
          overflow: 'visible',
          height: '100%',
          minHeight: { xs: '450px', sm: '350px' },
          // Frame Border - Reduced for tighter spacing
          border: '4px solid #f5f5f5',
          boxShadow: theme.palette.mode === 'dark'
            ? `
              0 20px 40px rgba(0, 0, 0, 0.4),
              0 8px 16px rgba(0, 0, 0, 0.2),
              0 0 0 2px rgba(245, 245, 245, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.1)
            `
            : `
              0 20px 40px rgba(0, 0, 0, 0.15),
              0 8px 16px rgba(0, 0, 0, 0.1),
              0 0 0 2px rgba(245, 245, 245, 0.8),
              inset 0 1px 0 rgba(255, 255, 255, 0.3)
            `,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: isMobile ? '16px' : '20px',
            background: theme.palette.mode === 'dark'
              ? 'radial-gradient(circle at 30% 20%, rgba(139, 69, 19, 0.1) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(101, 67, 33, 0.08) 0%, transparent 50%)'
              : 'radial-gradient(circle at 30% 20%, rgba(210, 180, 140, 0.1) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(222, 184, 135, 0.08) 0%, transparent 50%)',
            backgroundSize: '20px 20px, 25px 25px',
            pointerEvents: 'none',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: '8px',
            left: '8px',
            right: '8px',
            bottom: '8px',
            borderRadius: isMobile ? '12px' : '16px',
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(45deg, transparent 0%, rgba(139, 69, 19, 0.05) 50%, transparent 100%)'
              : 'linear-gradient(45deg, transparent 0%, rgba(210, 180, 140, 0.05) 50%, transparent 100%)',
            pointerEvents: 'none',
          }
        }}
      >
        {/* Pinterest Photo Frame */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(1deg)',
            width: { xs: '85%', sm: '80%' },
            height: { xs: '70%', sm: '75%' },
            zIndex: 2,
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translate(-50%, -50%) rotate(0deg) translateY(-8px)',
              '& .photo-frame': {
                boxShadow: '0 25px 50px rgba(0,0,0,0.6), 0 10px 20px rgba(0,0,0,0.3)',
              },
              '& .top-center-pin': {
                transform: 'translate(-50%, -50%) rotate(12deg) scale(1.15)',
                filter: 'drop-shadow(0 5px 10px rgba(0,0,0,0.5))',
              }
            }
          }}
        >
          {/* Photo Frame Container - Minimal Padding */}
          <Box
            className="photo-frame"
            sx={{
              width: '100%',
              height: '100%',
              background: 'transparent',
              borderRadius: '8px',
              padding: '2px', // Minimal padding between frame and image
              boxShadow: '0 15px 35px rgba(0,0,0,0.4), 0 5px 15px rgba(0,0,0,0.2)',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
            }}
          >
            {/* Photo Content - No Border */}
            <Box
              sx={{
                width: '100%',
                height: '100%',
                borderRadius: '8px',
                overflow: 'hidden',
                position: 'relative',
                background: theme.palette.mode === 'dark' ? '#000' : '#fff',
                border: 'none',
              }}
            >
              <LazyCardMedia
                component="img"
                image={finalImageUrl}
                alt={categoryDisplayName || 'Item Image'}
                fallback={noImageSvg}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: image ? 'cover' : 'contain',
                  objectPosition: 'center',
                  filter: image ? 'brightness(0.9) contrast(1.05)' : 'none',
                  transition: 'filter 0.3s ease',
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
                    backgroundColor: alpha(theme.palette.mode === 'dark' ? '#000' : '#fff', 0.95),
                    borderRadius: '8px',
                    padding: '16px 20px',
                    backdropFilter: 'blur(10px)',
                    border: `2px solid ${alpha(theme.palette.mode === 'dark' ? '#fff' : '#000', 0.1)}`,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  }}
                >
                  <Typography
                    sx={{
                      color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                      fontSize: { xs: '14px', sm: '16px' },
                      fontWeight: 600,
                      lineHeight: 1.2,
                    }}
                  >
                    {t('noImageAvailable')}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Paper Curl Effect - Bottom Right */}
            <Box
              sx={{
                position: 'absolute',
                bottom: '8px',
                right: '8px',
                width: '30px',
                height: '30px',
                background: 'linear-gradient(135deg, transparent 0%, rgba(0,0,0,0.15) 70%, rgba(0,0,0,0.1) 100%)',
                clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 70%)',
                zIndex: 5,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.1)',
                  background: 'linear-gradient(135deg, transparent 0%, rgba(0,0,0,0.2) 70%, rgba(0,0,0,0.15) 100%)',
                }
              }}
            />
          </Box>

          {/* Top-Center Pin - Above Image Area */}
          <Box
            className="top-center-pin"
            sx={{
              position: 'absolute',
              top: '25%', // Moved to top quarter of card
              left: '50%',
              transform: 'translate(-50%, -50%) rotate(8deg)',
              width: '40px',
              height: '40px',
              backgroundImage: 'url(/pinIcon.svg)',
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              zIndex: 999,
              filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.4))',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer',
              '&:hover': {
                transform: 'translate(-50%, -50%) rotate(12deg) scale(1.1)',
                filter: 'drop-shadow(0 5px 10px rgba(0,0,0,0.5))',
              }
            }}
          />
        </Box>

        {/* Content Overlay - Below Top-Center Pin */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10, // Below center pin (999)
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            p: { xs: 3, sm: 2.5 },
            pointerEvents: 'none', // Allow clicks to pass through to underlying elements
            '& > *': {
              pointerEvents: 'auto', // Re-enable pointer events for interactive elements
            }
          }}
        >

          {/* Top Section - Pinterest Style Badges */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              mb: 2,
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
            }}
          >
            {/* Left Side - Pinterest Trending Badge */}
            <Box
              sx={{
                background: 'linear-gradient(45deg, #FF6B35, #FF9800, #FFC107)',
                backgroundSize: '200% 200%',
                padding: { xs: '6px 12px', sm: '8px 16px' },
                borderRadius: '25px',
                boxShadow: '0 6px 20px rgba(255,107,53,0.5), 0 0 25px rgba(255,152,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)',
                animation: 'trendingPulse 3s ease-in-out infinite, trendingGradient 4s ease-in-out infinite',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                border: '2px solid rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  transform: 'scale(1.08) translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(255,107,53,0.7), 0 0 35px rgba(255,152,0,0.4), inset 0 1px 0 rgba(255,255,255,0.4)',
                  border: '2px solid rgba(255,255,255,0.3)',
                },
                '@keyframes trendingPulse': {
                  '0%': {
                    boxShadow: '0 6px 20px rgba(255,107,53,0.5), 0 0 25px rgba(255,152,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)',
                    transform: 'scale(1)',
                  },
                  '50%': {
                    boxShadow: '0 8px 30px rgba(255,107,53,0.7), 0 0 40px rgba(255,152,0,0.5), inset 0 1px 0 rgba(255,255,255,0.4)',
                    transform: 'scale(1.03)',
                  },
                  '100%': {
                    boxShadow: '0 6px 20px rgba(255,107,53,0.5), 0 0 25px rgba(255,152,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)',
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

          {/* Bottom Section - Pinterest Style Info and Action */}
          <Box>
            {/* Pinterest Info Card */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
                p: { xs: 2.5, sm: 2 },
                backgroundColor: alpha('#000', 0.75),
                borderRadius: '20px',
                backdropFilter: 'blur(25px) saturate(180%)',
                WebkitBackdropFilter: 'blur(25px) saturate(180%)',
                border: '2px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
                '&:hover': {
                  backgroundColor: alpha('#000', 0.85),
                  boxShadow: '0 12px 35px rgba(0, 0, 0, 0.5), 0 6px 18px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
                  transform: 'translateY(-2px)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
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
            {/* Pinterest Style Action Button */}
        <Button
          fullWidth
          variant="contained"
          onClick={handleViewPost}
          sx={{
            background: 'linear-gradient(45deg, #E91E63 30%, #F06292 60%, #E91E63 90%)',
            backgroundSize: '200% 200%',
            color: '#fff',
            borderRadius: '16px',
            padding: { xs: '16px', sm: '14px' },
            textTransform: 'none',
            fontSize: { xs: '16px', sm: '15px' },
            fontWeight: 700,
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 8px 25px rgba(233, 30, 99, 0.4), 0 0 30px rgba(240, 98, 146, 0.2), inset 0 1px 0 rgba(255,255,255,0.3)',
            backdropFilter: 'blur(15px)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            position: 'relative',
            overflow: 'hidden',
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
              transition: 'left 0.6s ease',
            },
            '&:hover': {
              background: 'linear-gradient(45deg, #F06292 30%, #F48FB1 60%, #F06292 90%)',
              boxShadow: '0 12px 35px rgba(233, 30, 99, 0.6), 0 0 40px rgba(240, 98, 146, 0.3), inset 0 1px 0 rgba(255,255,255,0.4)',
              transform: 'translateY(-4px) scale(1.02)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              '&::before': {
                left: '100%',
              },
              '& .MuiButton-endIcon': {
                transform: 'translateX(4px) scale(1.1)',
              }
            },
            '&:active': {
              transform: 'translateY(-2px) scale(1.01)',
              boxShadow: '0 8px 25px rgba(233, 30, 99, 0.4), 0 0 30px rgba(240, 98, 146, 0.2)',
            }
          }}
          endIcon={<RenderIcon name="view" sx={{ fontSize: { xs: '20px', sm: '18px' }, transition: 'all 0.3s ease' }} />}
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
