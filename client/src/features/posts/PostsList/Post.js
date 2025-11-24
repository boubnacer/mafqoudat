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
  ImageNotSupported as NoImageIcon,
} from "@mui/icons-material";
import FlexBetween from "../../../components/FlexBetween";
import { useTranslation } from "../../../utils/translations";
import { getLabel, isRTL } from "../../../utils/languageUtils";
import { getOptimizedImageUrl } from "../../../utils/cloudinaryUtils";
import { formatDistanceToNow } from 'date-fns';
import { ar, fr, enUS } from 'date-fns/locale';
import RenderIcon from "../../../components/RenderIcon";
import { getCategoryConfig, getCategoryIcon } from "../../../config/categories";
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

  // Memoized categories array computation - support both new Categories array and legacy Category
  const categories = useMemo(() => {
    const cats = [];
    
    // First priority: Use the Categories array from API aggregation (new format)
    if (post?.Categories && Array.isArray(post.Categories) && post.Categories.length > 0) {
      post.Categories.forEach(cat => {
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
    if (cats.length === 0 && post?.Category && post.Category.code) {
      cats.push({
        code: post.Category.code,
        labels: post.Category.labels,
        _id: post.Category._id
      });
    }
    
    // Last fallback: Use categoryname if available
    if (cats.length === 0 && post?.categoryname) {
      cats.push({
        code: post.categoryname,
        labels: null,
        _id: null
      });
    }
    
    return cats.length > 0 ? cats : [{ code: 'OTHER', labels: null, _id: null }];
  }, [post?.Categories, post?.Category, post?.categoryname]);

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
  const categoryName = useMemo(() => {
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
    if (!post?.image) return null; // Return null instead of noImageSvg
    return post.image.startsWith('http') 
      ? getOptimizedImageUrl(post.image, 'card') 
      : `${API_BASE_URL}/${post.image}`;
  }, [post?.image]);

  // Memoized category icons for when there's no image - support multiple categories
  const categoryIconsData = useMemo(() => {
    if (post?.image) return []; // Only show icons when there's no image
    
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
  }, [post?.image, categories, categoryStyles]);

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
            backgroundColor: post?.image ? 'transparent' : (categoryStyles[0]?.background || (theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5')),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {post?.image && imageUrl ? (
              <LazyCardMedia
                component="img"
                sx={{ 
                  height: '100%',
                  width: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                }}
                image={imageUrl}
                alt={categoryName || 'Item Image'}
                fallback={noImageSvg}
                onError={handleImageError}
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
                  width: '100%',
                  height: '100%',
                }}
              >
                {categoryIconsData.length === 1 ? (() => {
                  const IconComponent = categoryIconsData[0].IconComponent;
                  return (
                    <IconComponent
                      sx={{
                        fontSize: { xs: '64px', sm: '80px' },
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
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 0.5,
                        alignItems: 'center',
                      }}
                    >
                      {categories.map((cat, index) => {
                        const catStyle = categoryStyles[index];
                        const catName = categoryNames[index];
                        return (
                          <Box
                            key={cat.code || index}
                            sx={{
                              backgroundColor: catStyle.background,
                              padding: '4px 8px',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                              border: `1px solid ${catStyle.main}`,
                            }}
                          >
                            <RenderIcon 
                              name={`${cat.code?.toLowerCase() || 'other'}cate`} 
                              sx={{ 
                                fontSize: '12px', 
                                color: catStyle.text
                              }} 
                            />
                            <Typography
                              sx={{
                                color: catStyle.text,
                                fontSize: '11px',
                                fontWeight: 600,
                              }}
                            >
                              {catName}
                            </Typography>
                          </Box>
                        );
                      })}
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
                <Box 
                  display="grid"
                  gridTemplateColumns="auto"
                  gap={1}
                  justifyItems={currentLanguage === 'ar' ? 'end' : 'start'}
                  width="100%"
                >
                  {/* Time - Left in LTR, Right in RTL */}
                  <Box 
                    display="flex" 
                    alignItems="center" 
                    gap={0.5}
                    sx={{
                      width: 'fit-content',
                      marginLeft: currentLanguage === 'ar' ? 'auto' : 0,
                      marginRight: currentLanguage === 'ar' ? 0 : 'auto',
                    }}
                  >
                    <TimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ direction: currentLanguage === 'ar' ? 'rtl' : 'ltr' }}
                    >
                      {created}
                    </Typography>
                  </Box>
                  {/* No Image Indicator - Right in LTR, Left in RTL */}
                  {!post?.image && (
                    <Box 
                      display="flex" 
                      alignItems="center" 
                      gap={0.5}
                      sx={{
                        width: 'fit-content',
                        marginLeft: currentLanguage === 'ar' ? 'auto' : 0,
                        marginRight: currentLanguage === 'ar' ? 0 : 'auto',
                      }}
                    >
                      <NoImageIcon sx={{ fontSize: 14, color: 'text.secondary', opacity: 0.7 }} />
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ 
                          fontSize: '11px',
                          direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                          opacity: 0.7,
                        }}
                      >
                        {t('postHasNoImage')}
                      </Typography>
                    </Box>
                  )}
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
        <Box sx={{ 
          position: 'relative', 
          height: { xs: '260px', sm: '200px' }, 
          backgroundColor: post?.image ? 'transparent' : (categoryStyles[0]?.background || (theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5')),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {post?.image && imageUrl ? (
            <LazyCardMedia
              component="img"
              sx={{
                height: '100%',
                width: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                zIndex: 1, // Base layer for image
              }}
              image={imageUrl}
              alt={categoryName || 'Item Image'}
              fallback={noImageSvg}
              onError={handleImageError}
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
                    gap: { xs: 2.5, sm: 3 },
                    flexWrap: 'wrap',
                    paddingTop: { xs: 1.5, sm: 2 },
                  }}
                >
                  {categoryIconsData.slice(0, 4).map((iconData, idx) => {
                    const IconComponent = iconData.IconComponent;
                    return (
                      <IconComponent
                        key={iconData.code || idx}
                        sx={{
                          fontSize: { xs: '48px', sm: '56px' },
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
                      backgroundColor: catStyle.background,
                      padding: '4px 8px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${catStyle.main}`,
                    }}
                  >
                    <RenderIcon 
                      name={`${cat.code?.toLowerCase() || 'other'}cate`} 
                      sx={{ 
                        fontSize: { xs: '14px', sm: '12px' }, 
                        color: catStyle.text
                      }} 
                    />
                    <Typography
                      sx={{
                        color: catStyle.text,
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

          {/* Time Badge with No Image Indicator */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 12,
              left: 12,
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: { xs: 0.5, sm: 1 },
              alignItems: { xs: 'flex-start', sm: 'center' },
            }}
          >
            {/* No Image Indicator */}
            {!post?.image && (
              <Box
                sx={{
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(0,0,0,0.7)' 
                    : 'rgba(255,255,255,0.9)',
                  color: theme.palette.mode === 'dark' ? '#fff' : '#333',
                  padding: '4px 8px',
                  borderRadius: '8px',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
                  zIndex: 11,
                  order: { xs: 0, sm: 1 },
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                }}
              >
                <NoImageIcon sx={{ 
                  fontSize: { xs: '12px', sm: '11px' }, 
                  color: theme.palette.mode === 'dark' ? '#fff' : '#333',
                  opacity: 0.8,
                }} />
                <Typography
                  sx={{
                    color: theme.palette.mode === 'dark' ? '#fff' : '#333',
                    fontSize: { xs: '11px', sm: '10px' },
                    fontWeight: 600,
                  }}
                >
                  {t('noImage')}
                </Typography>
              </Box>
            )}
            {/* Time Badge */}
            <Box
              sx={{
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

          {/* Gradient Overlay - Only show when there's an image */}
          {post?.image && imageUrl && (
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
                  mr: isArabicText(post.exactLocation) ? { xs: 5.5, sm: 5 } : 0, // RTL support for Arabic text in exactLocation
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
                        left: '0px',
                        right: !isArabicText(post.exactLocation) 
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
                        right: !isArabicText(post.exactLocation) 
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
                    textAlign: isArabicText(post.exactLocation) ? 'right' : 'left',
                    direction: isArabicText(post.exactLocation) ? 'rtl' : 'ltr',
                    pl: 1, // Add padding to account for connector line
                    // Add margin-right and force LTR direction for RTL mode when text is not Arabic
                    ...(isRTLMode() && !isArabicText(post.exactLocation) && {
                      marginRight: { xs: '48px', sm: '44px' },
                      textAlign: 'left',
                      direction: 'ltr !important'
                    }),
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

