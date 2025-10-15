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
  keyframes,
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

// Frame animations
const frameGlow = keyframes`
  0% {
    box-shadow: 0 0 20px rgba(255,215,0,0.3), 0 0 40px rgba(255,215,0,0.1);
  }
  50% {
    box-shadow: 0 0 30px rgba(255,215,0,0.5), 0 0 60px rgba(255,215,0,0.2);
  }
  100% {
    box-shadow: 0 0 20px rgba(255,215,0,0.3), 0 0 40px rgba(255,215,0,0.1);
  }
`;

const subtleFloat = keyframes`
  0%, 100% {
    transform: rotateY(-2deg) rotateX(1deg) translateY(0px);
  }
  50% {
    transform: rotateY(-1deg) rotateX(0.5deg) translateY(-2px);
  }
`;

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
            ? 'linear-gradient(135deg, rgba(25,25,25,0.95) 0%, rgba(35,35,35,0.98) 50%, rgba(45,45,45,0.95) 100%)'
            : 'linear-gradient(135deg, rgba(252,252,252,0.95) 0%, rgba(248,250,252,0.98) 50%, rgba(245,247,249,0.95) 100%)',
          backdropFilter: 'blur(25px) saturate(180%)',
          WebkitBackdropFilter: 'blur(25px) saturate(180%)',
          borderRadius: isMobile ? '20px' : '28px',
          border: `1px solid ${alpha(theme.palette.mode === 'dark' ? '#fff' : '#000', 0.05)}`,
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: theme.palette.mode === 'dark'
            ? `
              0 8px 32px -4px rgba(0, 0, 0, 0.3),
              0 4px 16px -2px rgba(0, 0, 0, 0.2),
              0 2px 8px -1px rgba(0, 0, 0, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.05),
              inset 0 -1px 0 rgba(255, 255, 255, 0.02)
            `
            : `
              0 8px 32px -4px rgba(0, 0, 0, 0.12),
              0 4px 16px -2px rgba(0, 0, 0, 0.08),
              0 2px 8px -1px rgba(0, 0, 0, 0.04),
              inset 0 1px 0 rgba(255, 255, 255, 0.8),
              inset 0 -1px 0 rgba(0, 0, 0, 0.02)
            `,
          height: '100%',
          minHeight: { xs: '480px', sm: '380px', md: '400px' },
          position: 'relative',
          cursor: 'pointer',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme.palette.mode === 'dark'
              ? `
                0 12px 40px -4px rgba(0, 0, 0, 0.4),
                0 8px 24px -2px rgba(0, 0, 0, 0.3),
                0 4px 16px -1px rgba(0, 0, 0, 0.2),
                inset 0 1px 0 rgba(255, 255, 255, 0.08),
                0 0 0 1px rgba(255, 215, 0, 0.1)
              `
              : `
                0 12px 40px -4px rgba(0, 0, 0, 0.15),
                0 8px 24px -2px rgba(0, 0, 0, 0.1),
                0 4px 16px -1px rgba(0, 0, 0, 0.06),
                inset 0 1px 0 rgba(255, 255, 255, 0.9),
                0 0 0 1px rgba(255, 215, 0, 0.05)
              `,
          }
        }}
      >
        {/* Wall-Mounted Picture Frame */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 0,
            width: { xs: '85%', sm: '75%', md: '70%' },
            height: { xs: '60%', sm: '55%', md: '50%' },
            perspective: '1000px',
            // Wall texture background
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '-20px',
              left: '-20px',
              right: '-20px',
              bottom: '-20px',
              background: theme.palette.mode === 'dark' 
                ? 'radial-gradient(circle at 30% 20%, rgba(139, 69, 19, 0.1) 0%, transparent 50%), linear-gradient(45deg, rgba(101, 67, 33, 0.05) 25%, transparent 25%, transparent 75%, rgba(101, 67, 33, 0.05) 75%)'
                : 'radial-gradient(circle at 30% 20%, rgba(139, 69, 19, 0.05) 0%, transparent 50%), linear-gradient(45deg, rgba(101, 67, 33, 0.03) 25%, transparent 25%, transparent 75%, rgba(101, 67, 33, 0.03) 75%)',
              backgroundSize: '20px 20px, 40px 40px',
              borderRadius: '8px',
              zIndex: -2,
            }
          }}
        >
          {/* Hanging Wire Effect */}
          <Box
            sx={{
              position: 'absolute',
              top: '-8px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '40px',
              height: '2px',
              background: 'linear-gradient(90deg, #8B4513 0%, #CD853F 50%, #8B4513 100%)',
              borderRadius: '1px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              zIndex: 1,
              '&::after': {
                content: '""',
                position: 'absolute',
                top: '-6px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '6px',
                height: '6px',
                background: 'radial-gradient(circle, #CD853F 0%, #8B4513 100%)',
                borderRadius: '50%',
                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3)',
              }
            }}
          />

          {/* Main Frame Container */}
          <Box
            sx={{
              width: '100%',
              height: '100%',
              position: 'relative',
              transform: 'rotateY(-2deg) rotateX(1deg)',
              transformStyle: 'preserve-3d',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              animation: `${subtleFloat} 8s ease-in-out infinite`,
              '&:hover': {
                transform: 'rotateY(0deg) rotateX(0deg) translateY(-8px)',
                animation: 'none', // Disable floating animation on hover
                '& .frame-shadow': {
                  boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)',
                },
                '& .frame-glow': {
                  opacity: 1,
                }
              }
            }}
          >
            {/* Frame Shadow */}
            <Box
              className="frame-shadow"
              sx={{
                position: 'absolute',
                top: '8px',
                left: '8px',
                right: '8px',
                bottom: '8px',
                background: 'linear-gradient(145deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 100%)',
                borderRadius: '16px',
                filter: 'blur(8px)',
                zIndex: -1,
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />

            {/* Frame Glow Effect */}
            <Box
              className="frame-glow"
              sx={{
                position: 'absolute',
                top: '-2px',
                left: '-2px',
                right: '-2px',
                bottom: '-2px',
                background: 'linear-gradient(45deg, rgba(255,215,0,0.1), rgba(255,165,0,0.1), rgba(255,215,0,0.1))',
                borderRadius: '20px',
                opacity: 0,
                transition: 'opacity 0.4s ease',
                zIndex: -1,
                filter: 'blur(1px)',
              }}
            />

            {/* Outer Frame - Metallic/Golden */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(145deg, #FFD700 0%, #FFA500 25%, #FF8C00 50%, #FFD700 75%, #FFF8DC 100%)',
                borderRadius: '18px',
                boxShadow: `
                  inset 0 2px 4px rgba(255,255,255,0.3),
                  inset 0 -2px 4px rgba(0,0,0,0.2),
                  0 4px 12px rgba(0,0,0,0.3),
                  0 0 0 1px rgba(255,215,0,0.5)
                `,
                zIndex: 2,
                animation: `${frameGlow} 6s ease-in-out infinite`,
                // Corner decorations
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
                  right: '8px',
                  bottom: '8px',
                  border: '2px solid rgba(255,215,0,0.6)',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)',
                }
              }}
            />

            {/* Inner Matting */}
            <Box
              sx={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                right: '12px',
                bottom: '12px',
                background: theme.palette.mode === 'dark' 
                  ? 'linear-gradient(135deg, rgba(40,40,40,0.9) 0%, rgba(20,20,20,0.95) 100%)'
                  : 'linear-gradient(135deg, rgba(248,248,248,0.9) 0%, rgba(240,240,240,0.95) 100%)',
                borderRadius: '8px',
                boxShadow: `
                  inset 0 2px 4px rgba(0,0,0,0.1),
                  inset 0 -1px 2px rgba(255,255,255,0.1)
                `,
                zIndex: 3,
                // Beveled edge effect
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: '2px',
                  left: '2px',
                  right: '2px',
                  bottom: '2px',
                  border: `1px solid ${alpha(theme.palette.mode === 'dark' ? '#fff' : '#000', 0.1)}`,
                  borderRadius: '6px',
                }
              }}
            />

            {/* Picture Area */}
            <Box
              sx={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                right: '20px',
                bottom: '20px',
                borderRadius: '4px',
                overflow: 'hidden',
                zIndex: 4,
                background: theme.palette.mode === 'dark' ? '#000' : '#fff',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)',
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
                  filter: image ? 'brightness(0.9) contrast(1.05) saturate(1.1)' : 'none',
                  transition: 'all 0.3s ease',
                }}
              />
              
              {/* No Image Overlay - Redesigned for frame */}
              {!image && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 5,
                    textAlign: 'center',
                    backgroundColor: alpha(theme.palette.mode === 'dark' ? '#000' : '#fff', 0.95),
                    borderRadius: '8px',
                    padding: '16px 20px',
                    backdropFilter: 'blur(10px)',
                    border: `2px solid ${alpha(theme.palette.mode === 'dark' ? '#fff' : '#000', 0.1)}`,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15), inset 0 1px 2px rgba(255,255,255,0.1)',
                    minWidth: '120px',
                  }}
                >
                  <RenderIcon 
                    name="image" 
                    sx={{ 
                      fontSize: '32px', 
                      color: theme.palette.mode === 'dark' ? '#fff' : '#666',
                      mb: 1,
                      display: 'block',
                      margin: '0 auto 8px auto'
                    }} 
                  />
                  <Typography
                    sx={{
                      color: theme.palette.mode === 'dark' ? '#fff' : '#666',
                      fontSize: { xs: '11px', sm: '12px' },
                      fontWeight: 600,
                      lineHeight: 1.2,
                    }}
                  >
                    {t('noImageAvailable')}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Frame Reflection Effect */}
            <Box
              sx={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                right: '12px',
                height: '30%',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 100%)',
                borderRadius: '8px 8px 0 0',
                pointerEvents: 'none',
                zIndex: 5,
              }}
            />
          </Box>
        </Box>

        {/* Content Overlay - Repositioned for frame design */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 10,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            p: { xs: 2, sm: 2.5 },
            pointerEvents: 'none', // Allow clicks to pass through to frame
            '& > *': {
              pointerEvents: 'auto', // Re-enable pointer events for interactive elements
            }
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
