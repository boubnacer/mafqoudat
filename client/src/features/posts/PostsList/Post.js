import { useNavigate } from "react-router-dom";
import { memo, useState, useCallback, useMemo } from "react";
import React from "react";
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
  IconButton,
  Tooltip,
  useMediaQuery,
  Paper,
  alpha,
  styled,
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
  CheckCircle as CheckCircleIcon,
  TaskAltOutlined,
  SearchOffOutlined,
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

// Post card DNA — same recipe as PublicPostsPage.jsx / TrendingItem.jsx:
// surfaceRaised + radius.lg + elevation.e1->e2 hover-lift + status accent bar.
const PostCardRoot = styled(Card)(({ theme, tone }) => ({
  height: "100%",
  display: "flex",
  flexDirection: "column",
  backgroundColor: theme.custom.color.surfaceRaised,
  borderRadius: `${theme.custom.radius.lg}px`,
  boxShadow: theme.custom.elevation.e1,
  border: `1px solid ${theme.palette.divider}`,
  borderInlineStart: `6px solid ${tone}`,
  overflow: "hidden",
  cursor: "pointer",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: theme.custom.elevation.e2,
  },
}));

const MediaFrame = styled(Box)(({ theme }) => ({
  position: "relative",
  width: "100%",
  overflow: "hidden",
}));

const StatusTag = ({ isFound, label }) => {
  const theme = useTheme();
  const tone = isFound ? theme.custom.status.found : theme.custom.status.lost;
  const Icon = isFound ? TaskAltOutlined : SearchOffOutlined;
  return (
    <Box
      sx={{
        position: "absolute",
        top: 12,
        insetInlineStart: 12,
        zIndex: 11,
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        px: 1,
        py: 0.375,
        borderRadius: `${theme.custom.radius.sm}px`,
        backgroundColor: tone.main,
      }}
    >
      <Icon sx={{ fontSize: 14, color: theme.palette.getContrastText(tone.main) }} />
      <Typography
        variant="caption"
        sx={{ fontWeight: 700, letterSpacing: 0.3, color: theme.palette.getContrastText(tone.main), lineHeight: 1 }}
      >
        {label}
      </Typography>
    </Box>
  );
};

const DateBadge = ({ children }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        position: "absolute",
        top: 12,
        insetInlineEnd: 12,
        zIndex: 11,
        px: 1,
        py: 0.375,
        borderRadius: `${theme.custom.radius.sm}px`,
        backgroundColor: alpha(theme.custom.color.surfaceRaised, 0.85),
      }}
    >
      <Typography variant="caption" sx={{ color: theme.custom.color.ink, fontWeight: 600, lineHeight: 1 }}>
        {children}
      </Typography>
    </Box>
  );
};

// Resolved/returned is dashboard-specific — public marketing card has no
// equivalent. Reuses the same solid-fill badge language as StatusTag rather
// than the old hardcoded-green pulsing overlay.
const ResolvedBadge = ({ label }) => {
  const theme = useTheme();
  const tone = theme.custom.status.found;
  return (
    <Box
      sx={{
        position: "absolute",
        bottom: 12,
        insetInlineEnd: 12,
        zIndex: 11,
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        px: 1,
        py: 0.375,
        borderRadius: `${theme.custom.radius.sm}px`,
        backgroundColor: tone.main,
      }}
    >
      <CheckCircleIcon sx={{ fontSize: 14, color: theme.palette.getContrastText(tone.main) }} />
      <Typography
        variant="caption"
        sx={{ fontWeight: 700, letterSpacing: 0.3, color: theme.palette.getContrastText(tone.main), lineHeight: 1 }}
      >
        {label}
      </Typography>
    </Box>
  );
};

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

  // Memoized found/lost status computation.
  // `foundLostValue` starts unset so the ObjectId-reference fallback below only
  // runs when Floptions genuinely didn't resolve a code — previously it also
  // re-ran whenever the resolved code happened to be "FOUND", overwriting it
  // with the raw (never-"FOUND") ObjectId string and flipping every found post
  // to "lost".
  const foundLostStatus = useMemo(() => {
    let foundLostValue = null;
    let foundLostLabel = null;
    let foundLostColor = null;

    // Check Floptions array first (this contains the actual found/lost data from the lookup)
    if (post?.Floptions && post.Floptions.length > 0) {
      const flOption = post.Floptions[0];
      if (flOption && flOption.code) {
        foundLostValue = flOption.code;
        foundLostLabel = getLabel(flOption.labels, currentLanguage) ||
                        (flOption.code === 'FOUND' ? t('found') : t('lost'));
        foundLostColor = flOption.color ||
                        (flOption.code === 'FOUND' ? theme.custom.status.found.main : theme.custom.status.lost.main);
      }
    }

    // Fallback: Check foundLost property (this is the ObjectId reference), only
    // when Floptions didn't already resolve it.
    if (!foundLostValue && post?.foundLost) {
      if (typeof post.foundLost === 'string') {
        const code = post.foundLost.toUpperCase();
        if (code === 'FOUND' || code === 'LOST') {
          foundLostValue = code;
          foundLostLabel = code === 'FOUND' ? t('found') : t('lost');
          foundLostColor = code === 'FOUND' ? theme.custom.status.found.main : theme.custom.status.lost.main;
        }
      } else if (post.foundLost.code) {
        foundLostValue = post.foundLost.code;
        foundLostLabel = getLabel(post.foundLost.labels, currentLanguage) ||
                        (post.foundLost.code === 'FOUND' ? t('found') : t('lost'));
        foundLostColor = post.foundLost.color ||
                        (post.foundLost.code === 'FOUND' ? theme.custom.status.found.main : theme.custom.status.lost.main);
      }
    }

    // Default to FOUND only if nothing above resolved a value
    if (!foundLostValue) {
      foundLostValue = 'FOUND';
      foundLostLabel = t('found');
      foundLostColor = theme.custom.status.found.main;
    }

    const isFound = foundLostValue === "FOUND";
    const statusColor = foundLostColor;
    const statusText = foundLostLabel;

    return { isFound, statusColor, statusText };
  }, [post?.Floptions, post?.foundLost, currentLanguage, t, theme.custom.status.found.main, theme.custom.status.lost.main]);

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
          main: theme.custom.color.brandPrimary,
          light: alpha(theme.custom.color.brandPrimary, 0.08),
          dark: theme.custom.color.brandPrimary,
          icon: theme.custom.color.brandPrimary,
          background: alpha(theme.custom.color.brandPrimary, 0.08),
          text: theme.custom.color.brandPrimary
        };
      }
    });
  }, [categories, theme.custom.color.brandPrimary]);

  // Legacy single category name for backward compatibility (first category)
  const categoryName = useMemo(() => {
    return categoryNames[0] || t('unknownCategory');
  }, [categoryNames, t]);

  // Legacy single category style for backward compatibility (first category)
  const categoryStyle = useMemo(() => {
    return categoryStyles[0] || {
      main: theme.custom.color.brandPrimary,
      light: alpha(theme.custom.color.brandPrimary, 0.08),
      dark: theme.custom.color.brandPrimary,
      icon: theme.custom.color.brandPrimary,
      background: alpha(theme.custom.color.brandPrimary, 0.08),
      text: theme.custom.color.brandPrimary
    };
  }, [categoryStyles, theme.custom.color.brandPrimary]);

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
          border: post?.returned
            ? `3px solid ${theme.custom.status.found.main}`
            : `1px solid ${alpha(theme.custom.color.ink, isDarkMode ? 0.08 : 0.06)}`,
          boxShadow: post?.returned
            ? `0 4px 12px ${alpha(theme.custom.status.found.main, 0.2)}, 0 2px 4px rgba(0, 0, 0, 0.1)`
            : 'none',
          cursor: 'pointer',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: post?.returned
              ? `0 8px 20px ${alpha(theme.custom.status.found.main, 0.3)}, 0 4px 8px rgba(0, 0, 0, 0.15)`
              : (isDarkMode
                ? '0 12px 40px rgba(0, 0, 0, 0.3)'
                : '0 12px 40px rgba(0, 0, 0, 0.1)'),
          },
          direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
          backgroundColor: theme.custom.color.surfaceRaised
        }}
      >

        <Box display="flex" sx={{ height: { xs: 'auto', sm: 180 } }}>
          {/* Image Section */}
          <Box sx={{
            width: { xs: '100%', sm: 200 },
            height: { xs: 160, sm: 180 },
            flexShrink: 0,
            position: 'relative',
            backgroundColor: post?.image ? 'transparent' : (categoryStyles[0]?.background || theme.custom.color.surfaceBase),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {/* Returned Badge - Top Right Overlay (when returned is true) */}
            {post?.returned && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  zIndex: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.5,
                  backgroundColor: theme.custom.status.found.main,
                  borderRadius: '18px',
                  padding: { xs: '4px 8px', sm: '5px 10px' },
                  boxShadow: `0 4px 12px ${alpha(theme.custom.status.found.main, 0.4)}, 0 2px 4px rgba(0,0,0,0.2)`,
                  border: `2px solid ${alpha(theme.custom.color.surfaceRaised, 0.9)}`,
                  animation: 'pulse 2s ease-in-out infinite',
                  '@keyframes pulse': {
                    '0%, 100%': {
                      transform: 'scale(1)',
                      boxShadow: `0 4px 12px ${alpha(theme.custom.status.found.main, 0.4)}, 0 2px 4px rgba(0,0,0,0.2)`,
                    },
                    '50%': {
                      transform: 'scale(1.02)',
                      boxShadow: `0 6px 16px ${alpha(theme.custom.status.found.main, 0.6)}, 0 4px 8px rgba(0,0,0,0.3)`,
                    },
                  },
                }}
              >
                <CheckCircleIcon
                  sx={{
                    fontSize: { xs: '14px', sm: '16px' },
                    color: theme.palette.getContrastText(theme.custom.status.found.main),
                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))',
                  }}
                />
                <Typography
                  sx={{
                    color: theme.palette.getContrastText(theme.custom.status.found.main),
                    fontSize: { xs: '10px', sm: '11px' },
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
                      color: theme.custom.color.ink
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
                        color: theme.palette.getContrastText(foundLostStatus.statusColor),
                        fontSize: '11px',
                        height: 24,
                        '& .MuiChip-label': {
                          color: theme.palette.getContrastText(foundLostStatus.statusColor)
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
              <Box 
                display="flex" 
                gap={2} 
                mb={2} 
                flexWrap="wrap" 
                alignItems="flex-start"
                width="100%"
              >
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
                  sx={{
                    marginLeft: currentLanguage === 'ar' ? 'auto' : 0,
                    marginRight: currentLanguage === 'ar' ? 0 : 'auto',
                  }}
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

  // Grid view layout — reuses the Phase 3 post card DNA (surfaceRaised,
  // radius.lg, elevation.e1->e2 hover-lift, borderInlineStart status accent,
  // solid-fill StatusTag + translucent DateBadge) rather than the ad hoc
  // hardcoded-color card this page had before.
  const tone = foundLostStatus.isFound ? theme.custom.status.found : theme.custom.status.lost;

  return (
    <PostCardRoot tone={tone.main} onClick={handleViewDetails} sx={{ direction: currentLanguage === 'ar' ? 'rtl' : 'ltr' }}>
      <MediaFrame sx={{ height: { xs: '260px', sm: '200px' }, backgroundColor: post?.image ? 'transparent' : alpha(tone.main, 0.06) }}>
        {post?.image && imageUrl ? (
          <LazyCardMedia
            component="img"
            sx={{ height: '100%', width: '100%', objectFit: 'cover', objectPosition: 'center' }}
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
                    fontSize: { xs: '80px', sm: '100px' },
                    color: categoryIconsData[0].style?.main || theme.palette.text.secondary,
                    opacity: 0.85,
                  }}
                />
              );
            })() : (
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
                      }}
                    />
                  );
                })}
              </Box>
            )}
          </Box>
        ) : null}

        <StatusTag isFound={foundLostStatus.isFound} label={foundLostStatus.statusText} />
        <DateBadge>{created}</DateBadge>
        {post?.returned && <ResolvedBadge label={t('returned')} />}

        {post?.image && imageUrl && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 100%)',
              pointerEvents: 'none',
            }}
          />
        )}
      </MediaFrame>

      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1, p: 2.5 }}>
        {/* Category Badges - Multiple categories support */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center', mb: 0.5 }}>
          {categories.map((cat, index) => {
            const catStyle = categoryStyles[index];
            const catName = categoryNames[index];
            return (
              <Box
                key={cat.code || index}
                sx={{
                  backgroundColor: catStyle.background,
                  padding: '4px 8px',
                  borderRadius: `${theme.custom.radius.sm}px`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  border: `1px solid ${catStyle.main}`,
                }}
              >
                <RenderIcon
                  name={`${cat.code?.toLowerCase() || 'other'}cate`}
                  sx={{ fontSize: '12px', color: catStyle.text }}
                />
                <Typography sx={{ color: catStyle.text, fontSize: '11px', fontWeight: 700 }}>
                  {catName}
                </Typography>
              </Box>
            );
          })}
        </Box>

        {/* Main Date with Event Icon */}
        {post?.mainDate && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
            <EventIcon sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }} />
            <Typography variant="body2" sx={{ color: theme.custom.color.ink, fontWeight: 700 }}>
              {post.mainDate}
            </Typography>
          </Box>
        )}

        {/* City with Location Icon */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
          <LocationIcon sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }} />
          <Typography variant="body2" sx={{ color: theme.custom.color.ink, fontWeight: 700 }}>
            {cityName}
          </Typography>
        </Box>

        {/* Exact Location */}
        {post?.exactLocation && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              direction: isArabicText(post.exactLocation) ? 'rtl' : 'ltr',
              textAlign: isArabicText(post.exactLocation) ? 'right' : 'left',
            }}
          >
            {post.exactLocation}
          </Typography>
        )}
      </CardContent>
    </PostCardRoot>
  );
};

const memoizedPost = memo(Post);

export default memoizedPost;

