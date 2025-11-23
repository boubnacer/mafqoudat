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
import { getCategoryConfig, getCategoryIcon } from "../../config/categories";
import { useState, useMemo } from "react";

// Get the API base URL for image construction
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3500";

const RecentPosts = ({ _id, categoryname, exactLocation, image, createdAt, countryLabels, countryname, contact, city, cityLabels, cityName, Category, Categories, mainDate }) => {
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

  // Function to detect if the site is in RTL mode (Arabic language)
  const isRTLMode = () => {
    return currentLanguage === 'ar';
  };

  // Function to detect if text contains Arabic characters (for exactLocation field alignment)
  const isArabicText = (text) => {
    if (!text) return false;
    // Arabic Unicode range: U+0600-U+06FF, U+0750-U+077F, U+08A0-U+08FF, U+FB50-U+FDFF, U+FE70-U+FEFF
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    return arabicRegex.test(text);
  };

  // Memoized categories array computation - support both new Categories array and legacy Category
  const categories = useMemo(() => {
    const cats = [];
    
    // First priority: Use the Categories array from API aggregation (new format)
    if (Categories && Array.isArray(Categories) && Categories.length > 0) {
      Categories.forEach(cat => {
        if (cat && cat.code) {
          cats.push({
            code: cat.code,
            labels: cat.labels,
            _id: cat._id
          });
        }
      });
    }
    
    // Fallback: Use the legacy Category object (backward compatibility)
    if (cats.length === 0 && Category && Category.code) {
      cats.push({
        code: Category.code,
        labels: Category.labels,
        _id: Category._id
      });
    }
    
    // Last fallback: Use categoryname if available
    if (cats.length === 0 && categoryname) {
      cats.push({
        code: categoryname,
        labels: null,
        _id: null
      });
    }
    
    return cats.length > 0 ? cats : [{ code: 'OTHER', labels: null, _id: null }];
  }, [Categories, Category, categoryname]);

  // Memoized category display names computation
  const categoryNames = useMemo(() => {
    return categories.map(cat => {
      if (cat.labels) {
        return cat.labels[currentLanguage] || cat.labels.en || cat.code;
      }
      return cat.code || t('unknownCategory');
    });
  }, [categories, currentLanguage, t]);

  // Memoized category styles computation
  const categoryStyles = useMemo(() => {
    return categories.map(cat => {
      try {
        const config = getCategoryConfig(cat.code);
        return {
          main: config.color,
          light: config.backgroundColor,
          dark: config.color,
          icon: config.color,
          background: config.backgroundColor,
          text: config.color
        };
      } catch (error) {
        return {
          main: '#2196F3',
          light: '#E3F2FD',
          dark: '#1976D2',
          icon: '#2196F3',
          background: '#E3F2FD',
          text: '#2196F3'
        };
      }
    });
  }, [categories]);

  // Legacy single category name for backward compatibility (first category)
  const categoryDisplayName = useMemo(() => {
    return categoryNames[0] || t('unknownCategory');
  }, [categoryNames, t]);

  // Legacy single category style for backward compatibility (first category)
  const categoryStyle = useMemo(() => {
    return categoryStyles[0] || {
      main: '#2196F3',
      light: '#E3F2FD',
      dark: '#1976D2',
      icon: '#2196F3',
      background: '#E3F2FD',
      text: '#2196F3'
    };
  }, [categoryStyles]);
  const isDarkMode = theme.palette.mode === 'dark';

  // Memoized category icons for when there's no image - support multiple categories
  const categoryIconsData = useMemo(() => {
    if (image) return []; // Only show icons when there's no image
    
    if (!categories || categories.length === 0) return [];
    
    return categories.map((cat, index) => {
      const IconComponent = getCategoryIcon(cat.code);
      const catStyle = categoryStyles[index];
      
      if (!IconComponent) return null;
      
      return {
        IconComponent,
        style: catStyle,
        code: cat.code
      };
    }).filter(Boolean); // Remove null entries
  }, [image, categories, categoryStyles]);

  return (
    <>
      <Card
        className="recent-post-card"
        data-testid="recent-posts"
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
        <Box sx={{ 
          position: 'relative', 
          height: { xs: '260px', sm: '200px' }, 
          backgroundColor: image ? 'transparent' : (categoryStyles[0]?.background || (theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5')),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {image ? (
            <LazyCardMedia
              component="img"
              sx={{
                height: '100%',
                width: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                zIndex: 1, // Base layer for image
              }}
              image={image.startsWith('http') ? getOptimizedImageUrl(image, 'card') : `${API_BASE_URL}/${image}`}
              alt={categoryname}
              fallback={noImageSvg}
              onError={(e) => {
                // Image failed to load - silently handle
              }}
            />
          ) : categoryIconsData.length > 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                padding: 2,
                zIndex: 1,
                width: '100%',
                height: '100%',
              }}
            >
              {categoryIconsData.length === 1 ? (() => {
                const IconComponent = categoryIconsData[0].IconComponent;
                return (
                  <IconComponent
                    sx={{
                      fontSize: { xs: '80px', sm: '100px' },
                      color: categoryIconsData[0].style?.main || theme.palette.text.secondary,
                      opacity: 0.85,
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                    }}
                  />
                );
              })() : (
                // Multiple icons - simple flex layout
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: { xs: 2, sm: 2.5 },
                    flexWrap: 'wrap',
                    paddingTop: { xs: 1, sm: 1.5 },
                  }}
                >
                  {categoryIconsData.slice(0, 4).map((iconData, idx) => {
                    const IconComponent = iconData.IconComponent;
                    return (
                      <IconComponent
                        key={iconData.code || idx}
                        sx={{
                          fontSize: { xs: '40px', sm: '48px' },
                          color: iconData.style?.main || theme.palette.text.secondary,
                          opacity: 0.85,
                          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                        }}
                      />
                    );
                  })}
                </Box>
              )}
            </Box>
          ) : null}
          
          {/* Gradient Overlay - Only show when there's an image */}
          {image && (
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
          )}

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
            {/* Category Badges - Multiple categories support */}
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 0.5,
                alignItems: 'center',
                zIndex: 11, // Higher z-index for category badges
              }}
            >
              {categories.map((cat, index) => {
                const catStyle = categoryStyles[index];
                const catName = categoryNames[index];
                return (
                  <Box
                    key={cat.code || index}
                    sx={{
                      backgroundColor: catStyle.background, // Always use light mode background
                      padding: '4px 8px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${catStyle.main}`, // Always use light mode border
                    }}
                  >
                    <RenderIcon 
                      name={`${cat.code?.toLowerCase() || 'other'}cate`} 
                      sx={{ 
                        fontSize: { xs: '14px', sm: '12px' }, 
                        color: catStyle.text // Always use light mode text color
                      }} 
                    />
                    <Typography
                      sx={{
                        color: catStyle.text, // Always use light mode text color
                        fontSize: { xs: '14px', sm: '12px' },
                        fontWeight: 700,
                      }}
                    >
                      {catName}
                    </Typography>
                  </Box>
                );
              })}
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
                position: 'relative',
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
            
            {/* Exact Location with L-shaped connector */}
            {exactLocation && (
              <Box
                sx={{
                  position: 'relative',
                  ml: { xs: 5.5, sm: 5 }, // Align with city text
                  mr: (isRTLMode() && isArabicText(exactLocation)) ? { xs: 5.5, sm: 5 } : 0, // RTL support only for Arabic text in RTL mode
                }}
              >
                {/* L-shaped connector line */}
                {isRTLMode() ? (
                  // RTL Mode
                  <>
                    {/* Vertical line */}
                    <Box
                      style={{
                        position: 'absolute',
                        // left: '0px',
                        right: !isArabicText(exactLocation) 
                          ? (isMobile ? '19px' : '17px')
                          : (isMobile ? '-25px' : '-23px'),
                        top: '-10px',
                        width: '1px',
                        height: '23px',
                        backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '1px',
                        zIndex: 1,
                      }}
                    />
                    {/* Horizontal line */}
                    <Box
                      style={{
                        position: 'absolute',
                        left: '0px',
                        right: !isArabicText(exactLocation) 
                          ? (isMobile ? '19px' : '17px')
                          : (isMobile ? '-25px' : '-23px'),
                        bottom: isMobile ? '5px' : '4px',
                        width: '17px',
                        height: '1px',
                        backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '1px',
                        zIndex: 1,
                      }}
                    />
                  </>
                ) : (
                  // LTR Mode
                  <>
                    {/* Vertical line */}
                    <Box
                      style={{
                        position: 'absolute',
                        left: isMobile ? '-25px' : '-22px',
                        top: '-10px',
                        width: '1px',
                        height: '23px',
                        backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '1px',
                        zIndex: 1,
                      }}
                    />
                    {/* Horizontal line */}
                    <Box
                      style={{
                        position: 'absolute',
                        left: isMobile ? '-25px' : '-21px',
                        bottom: isMobile ? '5px' : '4px',
                        width: '22px',
                        height: '1px',
                        backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '1px',
                        zIndex: 1,
                      }}
                    />
                  </>
                )}
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
                    pl: 1, // Add padding to account for connector line
                    // Add margin-right and force LTR direction for RTL mode when text is not Arabic
                    ...(isRTLMode() && !isArabicText(exactLocation) && {
                      marginRight: { xs: '48px', sm: '44px' },
                      textAlign: 'left',
                      direction: 'ltr !important'
                    }),
                  }}
                >
                  {exactLocation}
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>

      </Card>
    </>
  );
};

export default RecentPosts;