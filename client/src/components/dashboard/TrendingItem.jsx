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
import { AccessTime as TimeIcon, ImageNotSupported as NoImageIcon, CheckCircle as CheckCircleIcon } from "@mui/icons-material";
import { useMemo, useEffect, useCallback } from "react";
import { formatDistanceToNow } from 'date-fns';
import { ar, fr, enUS } from 'date-fns/locale';
import FlexBetween from "../FlexBetween";
import RenderIcon from "../RenderIcon";
import { TrendingItemSkeleton, DashboardEmptyStates } from "../LoadingStates";
import { useTranslation } from "../../utils/translations";
import { getOptimizedImageUrl } from "../../utils/cloudinaryUtils";
import LazyCardMedia from "../LazyCardMedia";
import { getCategoryConfig, getCategoryIcon } from "../../config/categories";
import { useNavigate } from "react-router-dom";
import { getLabel } from "../../utils/languageUtils";
import noImageSvg from "../../img/noimage.svg";

// Get the API base URL for image construction
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3500";

const TrendingItem = ({ trend, isLoading }) => {
  // Handle both array and single object formats
  const trendData = Array.isArray(trend) ? trend[0] : trend;
  
  // Debug logging to understand the data structure
  // console.log('TrendingItem - trend prop:', trend);
  // console.log('TrendingItem - trendData:', trendData);
  // console.log('TrendingItem - trendData keys:', trendData ? Object.keys(trendData) : 'no trendData');
  
  const { _id, categoryname, floptionName, image, createdAt, mainDate, countryLabels, countryname, city, cityLabels, cityName, Floptions, Category, Categories, exactLocation, returned } = trendData || {};
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const { t, currentLanguage } = useTranslation();
  const navigate = useNavigate();

  // Helper function to check if mainDate has a meaningful value
  const hasValidMainDate = (date) => {
    if (!date) return false;
    if (typeof date !== 'string') return false;
    const trimmed = date.trim();
    return trimmed !== '' && trimmed !== 'null' && trimmed !== 'undefined';
  };

  // Debug mainDate value
  // console.log('TrendingItem - mainDate:', mainDate, 'type:', typeof mainDate, 'trimmed:', mainDate?.trim());
  // console.log('TrendingItem - hasValidMainDate result:', hasValidMainDate(mainDate));

  // Get locale for date-fns
  const getLocale = () => {
    switch (currentLanguage) {
      case 'ar': return ar;
      case 'fr': return fr;
      default: return enUS;
    }
  };

  // Format date using date-fns with proper validation and error handling
  const created = useMemo(() => {
    try {
      // Check if createdAt exists and is valid
      if (!createdAt) {
        return t('unknownTime') || 'Unknown time';
      }
      
      // Create date object and validate it
      const date = new Date(createdAt);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return t('invalidDate') || 'Invalid date';
      }
      
      // Format the date using date-fns
      return formatDistanceToNow(date, { 
        addSuffix: true,
        locale: getLocale()
      });
    } catch (error) {
      console.warn('Date formatting error:', error);
      return t('dateError') || 'Date error';
    }
  }, [createdAt, currentLanguage, t]);

  // Extract city from location (show only city) - helper function
  const getCityFromLocation = useCallback((location) => {
    if (!location) return t('unknownLocation');
    // Split by comma and take the first part (usually the city)
    const parts = location.split(',');
    const city = parts[0].trim();
    // Remove any extra location details that might be in parentheses
    const cleanCity = city.split('(')[0].trim();
    // Remove any numbers or extra details
    return cleanCity.replace(/\d+/g, '').trim();
  }, [t]);

  // Get city name with proper priority - standardized with RecentPosts approach
  const displayCityName = useMemo(() => {
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
    
    // Last fallback: extracting from exactLocation (if available)
    if (exactLocation) {
      return getCityFromLocation(exactLocation);
    }
    return t('unknownCity') || 'Unknown City';
  }, [cityLabels, cityName, city, currentLanguage, exactLocation, getCityFromLocation, t]);

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

  // Debug foundLostStatus
  // console.log('TrendingItem - foundLostStatus:', foundLostStatus);
  
  // Debug the actual condition that will be used in render
  const shouldShowDate = hasValidMainDate(mainDate);
  // console.log('TrendingItem - shouldShowDate:', shouldShowDate);
  // console.log('TrendingItem - foundLostStatus.isFound:', foundLostStatus.isFound);

  // Handle navigation to post
  const handleViewPost = () => {
    if (_id) {
      navigate(`/dash/posts/${_id}`);
    }
  };

  // Get optimized image URL - only use Cloudinary if image exists and is uploaded by user
  const finalImageUrl = image ? (image.startsWith('http') ? getOptimizedImageUrl(image, 'card') : `${API_BASE_URL}/${image}`) : null;

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

  if (isLoading) return <TrendingItemSkeleton />;
  if (!trendData) {
    return (
      <Box sx={{ 
        minWidth: isMobile ? '100%' : 'auto', 
        width: isMobile ? '100%' : 'auto',
        height: '100%',
        position: 'relative',
        marginTop: '0px',
        maxWidth: '100%',
        minWidth: 0,
      }}>
        <Card
          sx={{
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(30,30,30,0.95) 0%, rgba(40,40,40,0.98) 50%, rgba(30,30,30,0.95) 100%)'
              : 'linear-gradient(135deg, rgba(248,248,248,0.95) 0%, rgba(255,255,255,0.98) 50%, rgba(248,248,248,0.95) 100%)',
            borderRadius: '8px',
            border: `2px solid ${theme.palette.mode === 'dark' ? '#333' : '#e0e0e0'} !important`,
            borderColor: `${theme.palette.mode === 'dark' ? '#333' : '#e0e0e0'} !important`,
            overflow: 'hidden',
            height: '100%',
            minHeight: { xs: '500px', sm: '280px' },
            position: 'relative',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <DashboardEmptyStates.NoTrending />
        </Card>
      </Box>
    );
  }

  // Additional safety check for required fields
  if (!_id || !categoryname) {
    return (
      <Box sx={{ 
        minWidth: isMobile ? '100%' : 'auto', 
        width: isMobile ? '100%' : 'auto',
        height: '100%',
        position: 'relative',
        marginTop: '0px',
        maxWidth: '100%',
        minWidth: 0,
      }}>
        <Card
          sx={{
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(30,30,30,0.95) 0%, rgba(40,40,40,0.98) 50%, rgba(30,30,30,0.95) 100%)'
              : 'linear-gradient(135deg, rgba(248,248,248,0.95) 0%, rgba(255,255,255,0.98) 50%, rgba(248,248,248,0.95) 100%)',
            borderRadius: '8px',
            border: `2px solid ${theme.palette.mode === 'dark' ? '#333' : '#e0e0e0'} !important`,
            borderColor: `${theme.palette.mode === 'dark' ? '#333' : '#e0e0e0'} !important`,
            overflow: 'hidden',
            height: '100%',
            minHeight: { xs: '500px', sm: '280px' },
            position: 'relative',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <DashboardEmptyStates.NoTrending />
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minWidth: isMobile ? '100%' : 'auto', 
      width: isMobile ? '100%' : 'auto',
      height: '100%',
      position: 'relative',
      marginTop: '0px', // No pin icon needed
      maxWidth: '100%', // Prevent overflow
      minWidth: 0, // Allow shrinking if needed
    }}>

      <Card
        onClick={handleViewPost}
        sx={{
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, rgba(30,30,30,0.95) 0%, rgba(40,40,40,0.98) 50%, rgba(30,30,30,0.95) 100%)'
            : 'linear-gradient(135deg, rgba(248,248,248,0.95) 0%, rgba(255,255,255,0.98) 50%, rgba(248,248,248,0.95) 100%)',
          borderRadius: '8px',
          border: returned 
            ? `3px solid #4CAF50 !important`
            : `2px solid ${theme.palette.mode === 'dark' ? '#333' : '#e0e0e0'} !important`,
          borderColor: returned 
            ? '#4CAF50 !important'
            : `${theme.palette.mode === 'dark' ? '#333' : '#e0e0e0'} !important`,
          overflow: 'hidden',
          height: '100%',
          minHeight: { xs: '500px', sm: '280px' },
          position: 'relative',
          boxShadow: returned 
            ? '0 4px 12px rgba(76, 175, 80, 0.3), 0 2px 4px rgba(0, 0, 0, 0.15)'
            : '0 4px 8px rgba(0, 0, 0, 0.15)',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: returned 
              ? '0 8px 20px rgba(76, 175, 80, 0.4), 0 4px 8px rgba(0, 0, 0, 0.2)'
              : '0 8px 16px rgba(0, 0, 0, 0.2)',
          },
        }}
      >
        {/* Poster Header */}
        <Box
          sx={{
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(90deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)'
              : 'linear-gradient(90deg, #f8f9fa 0%, #e9ecef 50%, #f8f9fa 100%)',
            color: theme.palette.mode === 'dark' ? '#fff' : '#2c2c2c',
            padding: { xs: '12px 16px', sm: '16px 20px' },
            textAlign: 'center',
            direction: 'ltr', // Force LTR direction for centering
            borderBottom: `2px solid ${theme.palette.mode === 'dark' ? '#333' : '#e0e0e0'}`,
            position: 'relative',
            flexShrink: 0,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: theme.palette.mode === 'dark'
                ? 'repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(255,255,255,0.1) 4px, rgba(255,255,255,0.1) 8px)'
                : 'repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(0,0,0,0.05) 4px, rgba(0,0,0,0.05) 8px)',
              pointerEvents: 'none',
            },
            '& *': {
              direction: 'ltr', // Force all child elements to LTR
            }
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            {/* First line: Status + Date */}
            <Typography
              sx={{
                fontSize: { xs: '18px', sm: '20px' },
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: currentLanguage === 'ar' ? 'normal' : '1px',
                textAlign: 'center',
                fontFamily: currentLanguage === 'ar' 
                  ? '"Noto Sans Arabic", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif'
                  : '"Inter", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
                // Add line height for better Arabic text
                lineHeight: currentLanguage === 'ar' ? 1.6 : 1.4,
              }}
            >
              {hasValidMainDate(mainDate) ? (
                `${foundLostStatus.isFound ? t('foundAt') : t('lostAt')} ${mainDate.trim()}`
              ) : (
                `${foundLostStatus.isFound ? t('found') : t('lost')} ${t('in')} ${displayCityName}`
              )}
            </Typography>
            
            {/* Second line: Location - only show when mainDate is provided */}
            {hasValidMainDate(mainDate) && (
              <Typography
                sx={{
                  fontSize: { xs: '16px', sm: '18px' },
                  fontWeight: 600,
                  textAlign: 'center',
                  opacity: 0.9,
                  fontFamily: currentLanguage === 'ar' 
                    ? '"Noto Sans Arabic", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif'
                    : '"Inter", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
                  // Add line height for better Arabic text
                  lineHeight: currentLanguage === 'ar' ? 1.6 : 1.4,
                }}
              >
                {t('in')} {displayCityName}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Full Body Image Container */}
        <Box
          sx={{
            position: 'relative',
            height: { xs: '420px', sm: '200px' },
            overflow: 'hidden',
            backgroundColor: image ? (theme.palette.mode === 'dark' ? '#2a2a2a' : '#f5f5f5') : (categoryStyles[0]?.background || (theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5')),
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Background Image */}
          {image && finalImageUrl ? (
            <LazyCardMedia
              component="img"
              image={finalImageUrl}
              alt={categoryDisplayName || 'Item Image'}
              fallback={noImageSvg}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
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
                      fontSize: { xs: '100px', sm: '120px' },
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
                    gap: { xs: 3, sm: 3.5 },
                    flexWrap: 'wrap',
                    paddingTop: { xs: 2, sm: 2.5 },
                  }}
                >
                  {categoryIconsData.slice(0, 4).map((iconData, idx) => {
                    const IconComponent = iconData.IconComponent;
                    return (
                      <IconComponent
                        key={iconData.code || idx}
                        sx={{
                          fontSize: { xs: '56px', sm: '68px' },
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

          {/* Returned Badge - Top Right Overlay (when returned is true) */}
          {returned && (
            <Box
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                zIndex: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.5,
                background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
                borderRadius: '24px',
                padding: { xs: '6px 12px', sm: '8px 16px' },
                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4), 0 2px 4px rgba(0,0,0,0.2)',
                border: '2px solid rgba(255, 255, 255, 0.9)',
                animation: 'pulse 2s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%, 100%': {
                    transform: 'scale(1)',
                    boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4), 0 2px 4px rgba(0,0,0,0.2)',
                  },
                  '50%': {
                    transform: 'scale(1.02)',
                    boxShadow: '0 6px 16px rgba(76, 175, 80, 0.6), 0 4px 8px rgba(0,0,0,0.3)',
                  },
                },
              }}
            >
              <CheckCircleIcon
                sx={{
                  fontSize: { xs: '18px', sm: '20px' },
                  color: '#ffffff',
                  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))',
                }}
              />
              <Typography
                sx={{
                  color: '#ffffff',
                  fontSize: { xs: '12px', sm: '14px' },
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: currentLanguage === 'ar' ? 'normal' : '0.5px',
                  fontFamily: currentLanguage === 'ar' 
                    ? '"Noto Sans Arabic", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif'
                    : '"Inter", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                }}
              >
                {t('returned')}
              </Typography>
            </Box>
          )}

          {/* Status Chip - Bottom Right Overlay */}
          <Chip
            label={foundLostStatus.label}
            sx={{
              position: 'absolute',
              top: 16,
              right: returned ? { xs: 140, sm: 160 } : 16,
              zIndex: 10,
              backgroundColor: foundLostStatus.color, // Solid background color
              color: '#fff', // White text for better contrast
              fontWeight: 900,
              fontSize: { xs: '14px', sm: '16px' },
              height: { xs: '32px', sm: '36px' },
              padding: { xs: '0 12px', sm: '0 16px' },
              borderRadius: '8px',
              border: `1px solid ${foundLostStatus.color}`,
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
              '& .MuiChip-icon': {
                color: '#fff', // White icon for better contrast
                marginLeft: 0,
                fontSize: { xs: '14px', sm: '16px' },
              },
                  '& .MuiChip-label': {
                paddingLeft: { xs: '6px', sm: '8px' },
                paddingRight: { xs: '6px', sm: '8px' },
                textTransform: 'uppercase',
                letterSpacing: currentLanguage === 'ar' ? 'normal' : '1px',
                fontFamily: currentLanguage === 'ar' 
                  ? '"Noto Sans Arabic", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif'
                  : '"Inter", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
                lineHeight: currentLanguage === 'ar' ? 1.6 : 1.4,
              },
            }}
          />
          
          {/* Category Badges - Top Left Overlay - Multiple categories support */}
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              left: 16,
              zIndex: 10,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 0.5,
              alignItems: 'center',
              maxWidth: 'calc(100% - 120px)', // Prevent overflow
            }}
          >
            {categories.map((cat, index) => {
              const catStyle = categoryStyles[index];
              const catName = categoryNames[index];
              return (
                <Box
                  key={cat.code || index}
                  sx={{
                    backgroundColor: `${catStyle.background} !important`,
                    color: catStyle.text,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    padding: { xs: '4px 12px', sm: '10px 16px' },
                    border: `1px solid ${catStyle.main}`,
                    opacity: 1,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  }}
                >
                  <RenderIcon 
                    name={`${cat.code?.toLowerCase() || 'other'}cate`} 
                    sx={{ 
                      fontSize: { xs: '14px', sm: '16px' }, 
                      color: catStyle.text
                    }} 
                  />
                  <Typography
                    sx={{
                      color: catStyle.text,
                      fontSize: { xs: '14px', sm: '16px' },
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: currentLanguage === 'ar' ? 'normal' : '1px',
                      fontFamily: currentLanguage === 'ar' 
                        ? '"Noto Sans Arabic", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif'
                        : '"Inter", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
                      lineHeight: currentLanguage === 'ar' ? 1.6 : 1.4,
                    }}
                  >
                    {catName}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          {/* Created Date Badge with No Image Indicator */}
          <Box
            sx={{
              position: 'absolute',
              bottom: '16px',
              left: currentLanguage === 'ar' ? 'auto' : '16px',
              right: currentLanguage === 'ar' ? '16px' : 'auto',
              zIndex: 10,
              display: 'grid',
              gridTemplateColumns: 'auto',
              gap: 0.5,
              justifyItems: currentLanguage === 'ar' ? 'end' : 'start',
            }}
          >
            {/* Created Date Badge */}
            <Box
              sx={{
                backgroundColor: theme.palette.mode === 'dark' 
                  ? 'rgba(0,0,0,0.7)' 
                  : 'rgba(255,255,255,0.9)',
                color: theme.palette.mode === 'dark' ? '#fff' : '#333',
                padding: { xs: '0 12px', sm: '0 16px' },
                borderRadius: '8px',
                fontSize: { xs: '14px', sm: '16px' },
                fontWeight: 600,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
                zIndex: 2,
                height: { xs: '32px', sm: '36px' },
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                fontFamily: currentLanguage === 'ar' 
                  ? '"Noto Sans Arabic", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif'
                  : '"Inter", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
                width: 'fit-content',
                marginLeft: currentLanguage === 'ar' ? 'auto' : 0,
                marginRight: currentLanguage === 'ar' ? 0 : 'auto',
              }}
            >
              <TimeIcon sx={{ 
                fontSize: { xs: '14px', sm: '16px' }, 
                color: theme.palette.mode === 'dark' ? '#fff' : '#333'
              }} />
              {`${t('posted')} ${created}`}
            </Box>
            {/* No Image Indicator */}
            {!image && (
              <Box
                sx={{
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(0,0,0,0.7)' 
                    : 'rgba(255,255,255,0.9)',
                  color: theme.palette.mode === 'dark' ? '#fff' : '#333',
                  padding: { xs: '0 12px', sm: '0 16px' },
                  borderRadius: '8px',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
                  zIndex: 2,
                  height: { xs: '32px', sm: '36px' },
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  fontFamily: currentLanguage === 'ar' 
                    ? '"Noto Sans Arabic", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif'
                    : '"Inter", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
                  width: 'fit-content',
                  marginLeft: currentLanguage === 'ar' ? 'auto' : 0,
                  marginRight: currentLanguage === 'ar' ? 0 : 'auto',
                }}
              >
                <NoImageIcon sx={{ 
                  fontSize: { xs: '14px', sm: '16px' }, 
                  color: theme.palette.mode === 'dark' ? '#fff' : '#333',
                  opacity: 0.8,
                }} />
                <Typography
                  sx={{
                    fontSize: { xs: '12px', sm: '14px' },
                    fontWeight: 600,
                    fontFamily: currentLanguage === 'ar' 
                      ? '"Noto Sans Arabic", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif'
                      : '"Inter", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
                  }}
                >
                  {t('postHasNoImage')}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Card>
    </Box>
  );
};


export default TrendingItem;