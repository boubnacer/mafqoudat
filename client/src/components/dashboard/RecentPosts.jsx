import {
  Box,
  Typography,
  useTheme,
  Card,
  CardContent,
  CardActions,
  Button,
  alpha,
  Chip,
  useMediaQuery,
  Avatar,
} from "@mui/material";
import noImageSvg from "../../img/noimage.svg";
import { useNavigate } from "react-router-dom";
import RenderIcon from "../RenderIcon";
import { useTranslation } from "../../utils/translations";
import { getOptimizedImageUrl } from "../../utils/cloudinaryUtils";
import LazyCardMedia from "../LazyCardMedia";
import { authStorage } from "../../utils/authStorage";
import { 
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  ArrowForward as ArrowIcon,
  AccessTime as TimeIcon,
  Event as EventIcon,
} from "@mui/icons-material";
import { formatDistanceToNow } from 'date-fns';
import { ar, fr, enUS } from 'date-fns/locale';
import useAuth from "../../hooks/useAuth";
import { getCategoryConfig } from "../../config/categories";
import { useState } from "react";

// Get the API base URL for image construction
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3500";

const RecentPosts = ({ _id, categoryname, exactLocation, image, createdAt, countryLabels, countryname, contact, city, cityLabels, cityName, Category, mainDate }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { t, currentLanguage } = useTranslation();
  const isMobile = useMediaQuery("(max-width:768px)");
  const { usernameId } = useAuth();




  // Format date using date-fns with proper locale support
  const getLocale = () => {
    switch (currentLanguage) {
      case 'ar': return ar;
      case 'fr': return fr;
      default: return enUS;
    }
  };

  const created = formatDistanceToNow(new Date(createdAt), { 
    addSuffix: true,
    locale: getLocale()
  });

  const handleViewDetails = () => navigate(`/dash/posts/${_id}`);

  // Extract city from location (show only city)
  const getCityFromLocation = (location) => {
    if (!location) return t('unknownLocation');
    // Split by comma and take the first part (usually the city)
    const parts = location.split(',');
    const city = parts[0].trim();
    // Remove any extra location details that might be in parentheses
    const cleanCity = city.split('(')[0].trim();
    // Remove any numbers or extra details
    return cleanCity.replace(/\d+/g, '').trim();
  };

  // Get city name with proper multilingual support
  const getCityName = () => {
    // First priority: Use the populated city labels from the API (multilingual)
    if (cityLabels && typeof cityLabels === 'object') {
      const cityLabel = cityLabels[currentLanguage] || cityLabels.en;
      if (cityLabel && cityLabel.trim()) {
        return cityLabel.trim();
      }
    }
    
    // Second priority: Use the cityName field from API
    if (cityName && typeof cityName === 'string' && cityName.trim()) {
      return cityName.trim();
    }
    
    // Third priority: Use the city field directly (for custom city names)
    if (city && typeof city === 'string' && city.trim()) {
      return city.trim();
    }
    
    // Last fallback: extracting from exactLocation
    return getCityFromLocation(exactLocation);
  };

  const displayCityName = getCityName();

  // Function to detect if text contains Arabic characters
  const isArabicText = (text) => {
    if (!text) return false;
    // Arabic Unicode range: U+0600-U+06FF, U+0750-U+077F, U+08A0-U+08FF, U+FB50-U+FDFF, U+FE70-U+FEFF
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    return arabicRegex.test(text);
  };

  // Get category name safely with multilingual support
  const getCategoryDisplayName = (categoryCode) => {
    // First priority: Use the Category object from API aggregation (with labels)
    if (Category && Category.labels) {
      return Category.labels[currentLanguage] || Category.labels.en || Category.code || categoryCode;
    }
    
    // Last fallback: return the original categoryCode or unknown
    return categoryCode || t('unknownCategory');
  };

  const categoryDisplayName = getCategoryDisplayName(categoryname);

  // Get category colors using centralized configuration
  const getCategoryColors = (category) => {
    const config = getCategoryConfig(category);
    
    return {
      main: config.color,
      light: config.backgroundColor,
      dark: config.color,
      icon: config.color,
      background: config.backgroundColor, // Always use light mode background
      text: config.color
    };
  };

  const categoryStyle = getCategoryColors(categoryname);
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <>
      <Card
        className="recent-post-card"
        onClick={handleViewDetails}
        style={{
          backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
          background: isDarkMode ? '#1a1a1a' : '#ffffff',
          cursor: 'pointer',
        }}
        sx={{
          backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
          background: isDarkMode ? '#1a1a1a' : '#ffffff',
          position: 'relative',
          boxShadow: 'none',
          border: `1px solid ${isDarkMode ? alpha('#fff', 0.08) : alpha('#000', 0.06)}`,
          height: { xs: 'auto', sm: 'auto' },
          minHeight: { xs: '300px', sm: '350px' },
          width: { xs: '100%', sm: '100%' },
          maxWidth: { xs: '100%', sm: '100%' },
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          borderRadius: '12px',
          overflow: 'hidden',
          cursor: 'pointer',
          '&:hover': {
            transform: { xs: 'none', sm: 'translateY(-4px)' },
            boxShadow: 'none',
            backgroundColor: isDarkMode ? '#1a1a1a !important' : '#ffffff !important',
            background: isDarkMode ? '#1a1a1a !important' : '#ffffff !important',
          },
          direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
          // Force white background in light mode with higher specificity
          '&.MuiCard-root': {
            backgroundColor: isDarkMode ? '#1a1a1a !important' : '#ffffff !important',
            background: isDarkMode ? '#1a1a1a !important' : '#ffffff !important',
          },
          // Additional override for any inherited styles
          '&': {
            backgroundColor: isDarkMode ? '#1a1a1a !important' : '#ffffff !important',
            background: isDarkMode ? '#1a1a1a !important' : '#ffffff !important',
          }
        }}
      >
        {/* Image Section with Overlays */}
        <Box sx={{ position: 'relative', height: { xs: '260px', sm: '200px' }, backgroundColor: 'transparent' }}>
          <LazyCardMedia
            component="img"
            sx={{
              height: '100%',
              width: '100%',
              objectFit: image ? 'cover' : 'contain',
              objectPosition: 'center',
              zIndex: 1, // Base layer for image
              backgroundColor: image ? 'transparent' : (theme.palette.mode === 'dark' ? '#000' : '#fff'),
            }}
            image={image ? (image.startsWith('http') ? getOptimizedImageUrl(image, 'card') : `${API_BASE_URL}/${image}`) : noImageSvg}
            alt={categoryname}
            fallback={noImageSvg}
            onError={(e) => {
              // Image failed to load - silently handle
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
          
          {/* Gradient Overlay */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 100%)',
              pointerEvents: 'none',
              zIndex: 2, // Above image, below badges
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
              zIndex: 10, // Ensure badges are above image
            }}
          >
            {/* Category Badge */}
            <Box
              sx={{
                backgroundColor: categoryStyle.background, // Always use light mode background
                padding: '4px 8px',
                borderRadius: '8px', // Match the time badge border radius
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${categoryStyle.main}`, // Always use light mode border
                zIndex: 11, // Higher z-index for category badge
              }}
            >
              <RenderIcon 
                name={`${categoryname?.toLowerCase()}cate`} 
                sx={{ 
                  fontSize: { xs: '14px', sm: '12px' }, 
                  color: categoryStyle.text // Always use light mode text color
                }} 
              />
              <Typography
                sx={{
                  color: categoryStyle.text, // Always use light mode text color
                  fontSize: { xs: '14px', sm: '12px' },
                  fontWeight: 700,
                }}
              >
                {categoryDisplayName}
              </Typography>
            </Box>
          </Box>

          {/* Time Badge */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 12,
              left: 12,
              backgroundColor: theme.palette.mode === 'dark' 
                ? 'rgba(0,0,0,0.7)' 
                : 'rgba(255,255,255,0.9)',
              color: theme.palette.mode === 'dark' ? '#fff' : '#333',
              padding: '4px 8px',
              borderRadius: '8px',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
              zIndex: 11, // Higher z-index for time badge
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <TimeIcon sx={{ 
                fontSize: { xs: '14px', sm: '12px' }, 
                color: theme.palette.mode === 'dark' ? '#fff' : '#333'
              }} />
              <Typography
                sx={{
                  color: theme.palette.mode === 'dark' ? '#fff' : '#333',
                  fontSize: { xs: '14px', sm: '12px' },
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
            p: { xs: 2.5, sm: 2.5 },
            pb: { xs: 3, sm: 3 }, // Explicit bottom padding for consistent spacing
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            backgroundColor: isDarkMode ? '#3A3A3A' : '#E9ECEF',
            background: isDarkMode ? '#3A3A3A' : '#E9ECEF',
            // Force override any Material-UI defaults
            '&.MuiCardContent-root': {
              backgroundColor: isDarkMode ? '#3A3A3A' : '#E9ECEF',
              background: isDarkMode ? '#3A3A3A' : '#E9ECEF',
            }
          }}
        >
          {/* Location Info - Main Date, City and Exact Location */}
          <Box 
            sx={{ 
              backgroundColor: isDarkMode ? '#3a3a3a' : '#E9ECEF',
              mb: 1, // Add margin bottom for proper spacing from card border (8px)
            }}
          >
            {/* Main Date with Event Icon */}
            {mainDate && (
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  // mb: 0.25,
                }}
              >
                <Avatar
                  sx={{
                    width: { xs: 40, sm: 36 },
                    height: { xs: 40, sm: 36 },
                    backgroundColor: 'transparent',
                    color: isDarkMode ? alpha('#fff', 0.8) : alpha('#000', 0.7),
                    flexShrink: 0,
                    transition: 'all 0.3s ease',
                  }}
                >
                  <EventIcon sx={{ fontSize: { xs: '20px', sm: '18px' } }} />
                </Avatar>
                <Typography
                  sx={{
                    color: isDarkMode ? alpha('#fff', 0.9) : alpha('#000', 0.8),
                    fontSize: { xs: '16px', sm: '14px' },
                    fontWeight: 700,
                    lineHeight: 1.2,
                  }}
                >
                  {mainDate}
                </Typography>
              </Box>
            )}

            {/* City with Location Icon */}
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                mb: 0.5,
              }}
            >
              <Avatar
                sx={{
                  width: { xs: 40, sm: 36 },
                  height: { xs: 40, sm: 36 },
                  backgroundColor: 'transparent',
                  color: isDarkMode ? alpha('#fff', 0.8) : alpha('#000', 0.7),
                  flexShrink: 0,
                  transition: 'all 0.3s ease',
                }}
              >
                <LocationIcon sx={{ fontSize: { xs: '20px', sm: '18px' } }} />
              </Avatar>
              <Typography
                sx={{
                  color: isDarkMode ? alpha('#fff', 0.9) : alpha('#000', 0.8),
                  fontSize: { xs: '16px', sm: '14px' },
                  fontWeight: 700,
                  lineHeight: 1.2,
                }}
              >
                {displayCityName}
              </Typography>
            </Box>
            
            {/* Exact Location - Below city and icon */}
            {exactLocation && (
              <Typography
                sx={{
                  color: isDarkMode ? alpha('#fff', 0.7) : alpha('#000', 0.6),
                  fontSize: { xs: '14px', sm: '13px' },
                  fontWeight: 500,
                  lineHeight: 1.3,
                  wordBreak: 'break-word',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  textAlign: isArabicText(exactLocation) ? 'right' : 'left',
                  direction: isArabicText(exactLocation) ? 'rtl' : 'ltr',
                  ml: { xs: 5.5, sm: 5 }, // Add left margin to align with city text (icon width + gap)
                  mr: isArabicText(exactLocation) ? { xs: 5.5, sm: 5 } : 0, // Add right margin for RTL mode
                }}
              >
                {exactLocation}
              </Typography>
            )}
          </Box>
        </CardContent>

      </Card>
    </>
  );
};

export default RecentPosts;