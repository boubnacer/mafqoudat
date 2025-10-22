import { useNavigate } from "react-router-dom";
import { memo, useState, useCallback, useMemo } from "react";
import React from "react";
// import "./postslist.css"; // Removed to prevent CSS conflicts with Material-UI
import noImageSvg from "../../../img/noimage.svg";
import {
  Button,
  Card,
  CardActions,
  CardContent,
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
  CalendarToday as CalendarIcon,
  Category as CategoryIcon,
  Visibility as VisibilityIcon,
  ArrowForward as ArrowIcon,
  AccessTime as TimeIcon,
  Event as EventIcon,
} from "@mui/icons-material";
import FlexBetween from "../../../components/FlexBetween";
import { useTranslation } from "../../../utils/translations";
import { getLabel, isRTL } from "../../../utils/languageUtils";
import { getOptimizedImageUrl } from "../../../utils/cloudinaryUtils";
import { formatDistanceToNow } from 'date-fns';
import { ar, fr, enUS } from 'date-fns/locale';
import RenderIcon from "../../../components/RenderIcon";
import { getCategoryConfig } from "../../../config/categories";
import LazyCardMedia from "../../../components/LazyCardMedia";

// Get the API base URL for image construction
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3500";

const Post = ({ post, viewMode = "grid" }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery("(max-width:768px)");
  const navigate = useNavigate();
  const { t, currentLanguage } = useTranslation();


  // Memoized computed values - ALL HOOKS MUST BE AT TOP LEVEL
  const locale = useMemo(() => {
    switch (currentLanguage) {
      case 'ar': return ar;
      case 'fr': return fr;
      default: return enUS;
    }
  }, [currentLanguage]);

  const created = useMemo(() => {
    // Check if createdAt exists and is valid
    if (!post?.createdAt) {
      return t('unknownDate');
    }
    
    try {
      return formatDistanceToNow(new Date(post.createdAt), { 
        addSuffix: true,
        locale
      });
    } catch (error) {
      console.error('Error formatting date:', error, 'post.createdAt:', post.createdAt);
      return t('unknownDate');
    }
  }, [post?.createdAt, locale, t]);

  // Memoized found/lost status computation
  const foundLostStatus = useMemo(() => {
    let foundLostValue = "FOUND"; // Default to FOUND
    let foundLostLabel = t('found'); // Default label
    let foundLostColor = theme.palette.success.main; // Default color
    
    // Check Floptions array first (this contains the actual found/lost data from the lookup)
    if (post?.Floptions && post.Floptions.length > 0) {
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
      if (post?.foundLost) {
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

    return { isFound, statusColor, statusText };
  }, [post?.Floptions, post?.foundLost, currentLanguage, t, theme.palette.success.main, theme.palette.error.main]);

  // Memoized category display name computation
  const categoryName = useMemo(() => {
    // First priority: Use the Category object from API aggregation (with labels)
    if (post?.Category && post.Category.labels) {
      return post.Category.labels[currentLanguage] || post.Category.labels.en || post.Category.code || post?.categoryname;
    }
    
    // Last fallback: return the original categoryname or unknown
    return post?.categoryname || t('unknownCategory');
  }, [post?.Category, post?.categoryname, currentLanguage, t]);

  // Memoized category colors computation
  const categoryStyle = useMemo(() => {
    try {
      const config = getCategoryConfig(post?.categoryname);
      
      return {
        main: config.color,
        light: config.backgroundColor,
        dark: config.color,
        icon: config.color,
        background: config.backgroundColor, // Always use light mode background
        text: config.color
      };
    } catch (error) {
      // Fallback to default colors
      return {
        main: '#2196F3',
        light: '#E3F2FD',
        dark: '#1976D2',
        icon: '#2196F3',
        background: '#E3F2FD', // Always use light mode background
        text: '#2196F3'
      };
    }
  }, [post?.categoryname]);

  const isDarkMode = theme.palette.mode === 'dark';

  // Function to detect if text contains Arabic characters
  const isArabicText = (text) => {
    if (!text) return false;
    // Arabic Unicode range: U+0600-U+06FF, U+0750-U+077F, U+08A0-U+08FF, U+FB50-U+FDFF, U+FE70-U+FEFF
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    return arabicRegex.test(text);
  };

  // Memoized city name computation
  const cityName = useMemo(() => {
    
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
    // First priority: Use the cityLabel field from API transformation
    if (post?.cityLabel && typeof post.cityLabel === 'string' && post.cityLabel.trim()) {
      return post.cityLabel.trim();
    }
    
    // Second priority: Use the populated city labels from the API (multilingual)
    if (post?.cityLabels && typeof post.cityLabels === 'object') {
      const cityLabel = post.cityLabels[currentLanguage] || post.cityLabels.en;
      if (cityLabel && cityLabel.trim()) {
        return cityLabel.trim();
      }
    }
    
    // Second priority (alternative): Use the city object labels if available
    if (post?.city && typeof post.city === 'object' && post.city.labels) {
      const cityLabel = post.city.labels[currentLanguage] || post.city.labels.en;
      if (cityLabel && cityLabel.trim()) {
        return cityLabel.trim();
      }
    }
    
    // Third priority: Use the cityName field from API
    if (post?.cityName && typeof post.cityName === 'string' && post.cityName.trim()) {
      return post.cityName.trim();
    }
    
    // Fourth priority: Use the city field directly (for custom city names)
    if (post?.city && typeof post.city === 'string' && post.city.trim()) {
      return post.city.trim();
    }
    
    // Last fallback: extracting from exactLocation
    return getCityFromLocation(post?.exactLocation);
  }, [post?.cityLabel, post?.cityLabels, post?.cityName, post?.city, post?.exactLocation, currentLanguage, t]);

  // Memoized image URL computation - only use Cloudinary if image exists and is uploaded by user
  const imageUrl = useMemo(() => {
    if (!post?.image) return noImageSvg;
    return post.image.startsWith('http') 
      ? getOptimizedImageUrl(post.image, 'card') 
      : `${API_BASE_URL}/${post.image}`;
  }, [post?.image]);

  // Memoized error handler for image
  const handleImageError = useCallback((e) => {
    // Image failed to load
  }, []);

  // Memoized event handlers

  const handleViewDetails = useCallback(() => {
    navigate(`/dash/posts/${post?._id}`);
  }, [navigate, post?._id]);


  // Early return after all hooks
  if (!post) return null;

  // List view layout
  if (viewMode === "list") {
    return (
      <Paper 
        elevation={0}
        onClick={handleViewDetails}
        sx={{ 
          borderRadius: 4,
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          border: `1px solid ${isDarkMode ? alpha('#fff', 0.08) : alpha('#000', 0.06)}`,
          cursor: 'pointer',
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
            flexShrink: 0,
            position: 'relative',
            backgroundColor: 'transparent'
          }}>
            <LazyCardMedia
              component="img"
              sx={{ 
                height: '100%',
                width: '100%',
                objectFit: post?.image ? 'cover' : 'contain',
                objectPosition: 'center',
                backgroundColor: post?.image ? 'transparent' : (theme.palette.mode === 'dark' ? '#000' : '#fff'),
              }}
              image={imageUrl}
              alt={categoryName || 'Item Image'}
              fallback={noImageSvg}
              onError={handleImageError}
            />
            
            {/* No Image Overlay for List View */}
            {!post?.image && (
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
                      label={foundLostStatus.statusText}
                      size="small"
                      sx={{ 
                        fontWeight: 600,
                        backgroundColor: foundLostStatus.statusColor,
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
                        backgroundColor: categoryStyle.background, // Always use light mode background
                        padding: '4px 8px',
                        borderRadius: '8px', // Match the time badge border radius
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        border: `1px solid ${categoryStyle.main}`, // Always use light mode border
                      }}
                    >
                      <RenderIcon 
                        name={`${post.categoryname?.toLowerCase() || 'other'}cate`} 
                        sx={{ 
                          fontSize: '12px', 
                          color: categoryStyle.text // Always use light mode text color
                        }} 
                      />
                      <Typography
                        sx={{
                          color: categoryStyle.text, // Always use light mode text color
                          fontSize: '11px',
                          fontWeight: 600,
                        }}
                      >
                        {categoryName}
                      </Typography>
                    </Box>
                  </Box>
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

          </Box>
        </Box>
      </Paper>
    );
  }

  // Grid view layout - Matching RecentPosts Design
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
              objectFit: post?.image ? 'cover' : 'contain',
              objectPosition: 'center',
              zIndex: 1, // Base layer for image
              backgroundColor: post?.image ? 'transparent' : (theme.palette.mode === 'dark' ? '#000' : '#fff'),
            }}
            image={imageUrl}
            alt={categoryName || 'Item Image'}
            fallback={noImageSvg}
            onError={handleImageError}
          />
          
          {/* No Image Overlay for Grid View */}
          {!post?.image && (
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
                name={`${post?.categoryname?.toLowerCase() || 'other'}cate`} 
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
                {categoryName}
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
        </Box>

        {/* Content Section */}
        <CardContent 
          sx={{ 
            flexGrow: 1, 
            p: { xs: 2.5, sm: 2.5 },
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
            }}
          >
            {/* Main Date with Event Icon */}
            {post?.mainDate && (
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
                  {post.mainDate}
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
                {cityName}
              </Typography>
            </Box>
            
            {/* Exact Location with L-shaped connector */}
            {post?.exactLocation && (
              <Box
                sx={{
                  position: 'relative',
                  ml: { xs: 5.5, sm: 5 }, // Align with city text
                  mr: isArabicText(post.exactLocation) ? { xs: 5.5, sm: 5 } : 0, // RTL support
                }}
              >
                {/* L-shaped connector line */}
                {(() => {
                  const isArabic = isArabicText(post.exactLocation);
                  console.log('post.exactLocation:', post.exactLocation, 'isArabic:', isArabic);
                  return isArabic;
                })() ? (
                  // RTL Mode
                  <Box
                    key="rtl-connector"
                    sx={{
                      position: 'absolute',
                      left: '0px',
                      right: { xs: -25, sm: -23 },
                      top: '-10px',
                      width: '1px',
                      height: '23px',
                      backgroundColor: isDarkMode ? alpha('#fff', 0.3) : alpha('#000', 0.3),
                      borderRadius: '1px',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: 0,
                        left: '-16px',
                        width: '17px',
                        height: '1px',
                        backgroundColor: isDarkMode ? alpha('#fff', 0.3) : alpha('#000', 0.3),
                        borderRadius: '1px',
                      }
                    }}
                  />
                ) : (
                  // LTR Mode
                  <Box
                    key="ltr-connector"
                    sx={{
                      position: 'absolute',
                      left: { xs: -24, sm: -22 },
                      top: { xs: -9, sm: -10 },
                      width: '1px',
                      height: '23px',
                      backgroundColor: isDarkMode ? alpha('#fff', 0.3) : alpha('#000', 0.3),
                      borderRadius: '1px',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        bottom: 0,
                        left: '1px',
                        width: '22px',
                        height: '1px',
                        backgroundColor: isDarkMode ? alpha('#fff', 0.3) : alpha('#000', 0.3),
                        borderRadius: '1px',
                      }
                    }}
                  />
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
                    textAlign: isArabicText(post.exactLocation) ? 'right' : 'left',
                    direction: isArabicText(post.exactLocation) ? 'rtl' : 'ltr',
                    pl: 1, // Add padding to account for connector line
                  }}
                >
                  {post.exactLocation}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Removed description preview to match RecentPosts design */}
        </CardContent>

      </Card>
    </>
  );
};

const memoizedPost = memo(Post);

export default memoizedPost;
