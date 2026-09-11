import { useNavigate } from "react-router-dom";
import { memo, useCallback, useMemo } from "react";
import React from "react";
import noImageSvg from "../../../img/noimage.svg";
import {
  Button,
  Card,
  CardActions,
  Typography,
  useTheme,
  Box,
  Chip,
  useMediaQuery,
  Paper,
  alpha,
  styled,
} from "@mui/material";
import {
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Category as CategoryIcon,
  ArrowForward as ArrowIcon,
  AccessTime as TimeIcon,
  ImageNotSupported as NoImageIcon,
  CheckCircle as CheckCircleIcon,
  TaskAltOutlined,
  SearchOffOutlined,
  Facebook as FacebookIcon,
  Instagram as InstagramIcon,
} from "@mui/icons-material";
import FlexBetween from "../../../components/FlexBetween";
import { useTranslation } from "../../../utils/translations";
import { getLabel, isRTL } from "../../../utils/languageUtils";
import { getOptimizedImageUrl } from "../../../utils/cloudinaryUtils";
import { formatDistanceToNow, format } from 'date-fns';
import { ar, fr, enUS } from 'date-fns/locale';
import RenderIcon from "../../../components/RenderIcon";
import { getCategoryConfig, getCategoryIcon } from "../../../config/categories";
import LazyCardMedia from "../../../components/LazyCardMedia";
import ReachRow from "../../../components/ReachRow";
import { summarizeSocialStats, readSiteViews } from "../../../utils/socialStats";


// Get the API base URL for image construction
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3500";

// Post card DNA - canonical here, mirrored by TrendingItem.jsx: surfaceRaised,
// radius (xl on this card), elevation.e1 -> e2 hover-lift, no border. The page
// behind this card (PostsList.js's root Box) uses postsListBackdrop rather than
// plain surfaceBase specifically so this plain-white card stands out from it -
// which rules out the dashboard panels' translucent backdrop-filter treatment
// here (it would let that backdrop show through and undo the contrast). The
// background stays fully opaque; the "background" prop below (set per-post,
// since it needs the found/lost tone) layers one soft radial wash over the
// solid surfaceRaised fill instead, so the same family of "played-with"
// background reads on this card without losing the opacity that makes it pop.
const PostCardRoot = styled(Card)(({ theme }) => ({
  height: "100%",
  display: "flex",
  flexDirection: "column",
  paddingBottom: theme.spacing(1),
  borderRadius: `${theme.custom.radius.xl}px`,
  boxShadow: theme.custom.elevation.e1,
  overflow: "hidden",
  cursor: "pointer",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: theme.custom.elevation.e2,
  },
}));


// index.css ships two global RTL rules - `body[dir="rtl"] * { text-align:
// inherit }` and `body[dir="rtl"] .MuiTypography-root { direction: rtl }` -
// and both outrank a single Emotion class. This card centres its own copy and
// keeps Latin text in Latin order, so it has to say so at a specificity those
// rules cannot override. Scoped to this card on purpose: the globals are older
// than the card and fixing them belongs to a pass of its own.

// Resolved/returned is dashboard-specific — public marketing card has no
// equivalent. Sits at the photo's bottom-start corner, opposite the overlay
// action buttons at bottom-end.
const ResolvedBadge = ({ label }) => {
  const theme = useTheme();
  const tone = theme.custom.status.found;
  return (
    <Box
      sx={{
        position: "absolute",
        bottom: 12,
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

  // The exact date the card's calendar icon shows, distinct from `created`'s
  // relative "posted X ago" phrasing. Prefers the listing's own free-text
  // mainDate (when it was lost/found, as entered in DateEntryDialog); when a
  // post doesn't carry one, falls back to the post's own createdAt formatted
  // as a plain date, so the card never collapses to showing only the
  // relative "posted" time.
  const exactDateLabel = useMemo(() => {
    if (post?.mainDate) return post.mainDate;
    if (!post?.createdAt) return null;
    try {
      return format(new Date(post.createdAt), 'MMM d, yyyy', { locale });
    } catch (error) {
      return null;
    }
  }, [post?.mainDate, post?.createdAt, locale]);

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

            <ReachRow post={post} />
          </Box>
        </Box>
      </Paper>
    );
  }

  // Grid view layout - the photo leads as a square top block (its own
  // corners rounded to match the card), status and quick actions overlaid on
  // it, then a plain content stack below: category, city headline, exact
  // location, the date/time/views facts, and a stats bar reusing ReachRow's
  // metrics. One fixed density: the card carried a control that cycled it
  // through three widths, and that control is gone, so the layout that reads
  // best in a grid cell is the only one it renders.
  const tone = foundLostStatus.isFound ? theme.custom.status.found : theme.custom.status.lost;
  const StatusIcon = foundLostStatus.isFound ? TaskAltOutlined : SearchOffOutlined;

  // No-image icon backdrop: same per-category tint as above, bumped up from
  // the badge's 0.12/0.2 ratio (too faint stretched across the whole photo
  // box) so it actually reads as color. Blended across every category on a
  // multi-category post - a linear-gradient in reading direction, so it runs
  // start-to-end the same way the icons row itself lays out (icons render in
  // `categories` order inside a flex row that already reverses under
  // `direction: rtl`, so mirroring the gradient's direction the same way
  // keeps each stop under its own icon instead of just reversing the ramp).
  const categoryTints = categoryStyles.map(cs => alpha(cs.main, isDarkMode ? 0.32 : 0.22));
  const noImageBackground = categoryTints.length > 1
    ? `linear-gradient(${currentLanguage === 'ar' ? 'to left' : 'to right'}, ${categoryTints.join(', ')})`
    : categoryTints[0];

  const siteViews = readSiteViews(post);
  const socialStats = summarizeSocialStats(post);
  // Reactions/likes and comments are the same kind of activity whichever
  // platform they happened on, so - like `interactions` itself above - they
  // combine across Facebook/Instagram. `null` only when neither platform has
  // anything fetched, so an unfetched number never reads as a real zero.
  const combineCounts = (a, b) => (a === null && b === null ? null : (a || 0) + (b || 0));
  const reactionsCount = combineCounts(socialStats.facebook.reactions, socialStats.instagram.likes);
  const commentsCount = combineCounts(socialStats.facebook.comments, socialStats.instagram.comments);
  const statsBarItems = [
    { key: 'views', label: t('views'), value: siteViews },
    { key: 'reactions', label: t('reactions'), value: reactionsCount },
    { key: 'comments', label: t('comments'), value: commentsCount },
  ];

  return (
    <PostCardRoot
      onClick={handleViewDetails}
      sx={{
        direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
        position: 'relative',
        backgroundColor: theme.custom.color.surfaceRaised,
      }}
    >
      {/* Photo: the card's top block, inset from the card's own edges with
          its own radius.xl corners rather than sitting flush. Square from
          sm up; on xs a full 1:1 box made the card noticeably tall once
          everything below it was added, so the photo trims to 4:3 there. */}
      <Box sx={{ padding: { xs: '8px 8px 0', sm: '12px 12px 0' } }}>
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          aspectRatio: { xs: '4 / 3', sm: '1 / 1' },
          borderRadius: `${theme.custom.radius.xl}px`,
          overflow: 'hidden',
          background: post?.image ? 'transparent' : noImageBackground,
        }}
      >
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
                    fontSize: { xs: '72px', sm: '88px' },
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
                }}
              >
                {categoryIconsData.slice(0, 4).map((iconData, idx) => {
                  const IconComponent = iconData.IconComponent;
                  return (
                    <IconComponent
                      key={iconData.code || idx}
                      sx={{
                        fontSize: { xs: '44px', sm: '52px' },
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

        {/* Status: the same solid-fill tag as the dashboard's Recent
            Founds/Losts cards (RecentPosts.jsx) - tone.main fill,
            radius.sm corners, TaskAltOutlined/SearchOffOutlined icon,
            uppercase caption text - overlaid on the photo, top-start.
            Sized up from RecentPosts.jsx's fixed compact size (that one
            lives on a narrow poster-style card) with responsive steps for
            this card's larger real estate, and the label is t('found')/
            t('lost') - the same fixed translation key RecentPosts.jsx
            reads off its own `type` prop, rather than foundLostStatus's
            DB-sourced Floptions label, which doesn't always match. */}
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            insetInlineStart: 12,
            zIndex: 2,
            display: 'inline-flex',
            alignItems: 'center',
            gap: { xs: 0.5, sm: 0.75 },
            px: { xs: 1.25, sm: 1.5 },
            py: { xs: 0.5, sm: 0.625 },
            borderRadius: `${theme.custom.radius.sm}px`,
            backgroundColor: tone.main,
          }}
        >
          <StatusIcon sx={{ fontSize: { xs: 16, sm: 18 }, color: theme.palette.getContrastText(tone.main) }} />
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '12px', sm: '13px' },
              letterSpacing: 0.3,
              textTransform: 'uppercase',
              color: theme.palette.getContrastText(tone.main),
              lineHeight: 1,
            }}
          >
            {t(foundLostStatus.isFound ? 'found' : 'lost')}
          </Typography>
        </Box>

        {/* City: same white-pill treatment as the status badge above, on the
            opposite end of the same top row (insetInlineEnd), so the pair
            reads as one inline header - top-end in LTR, top-start in RTL.
            Same size/radius as the status badge (radius.sm, not a full
            pill) so the two match exactly - only the fill (white here vs.
            tone.main there) tells them apart. */}
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            insetInlineEnd: 12,
            zIndex: 2,
            display: 'inline-flex',
            alignItems: 'center',
            gap: { xs: 0.5, sm: 0.75 },
            px: { xs: 1.25, sm: 1.5 },
            py: { xs: 0.5, sm: 0.625 },
            backgroundColor: theme.custom.color.surfaceRaised,
            borderRadius: `${theme.custom.radius.sm}px`,
            boxShadow: theme.custom.elevation.e2,
            maxWidth: '55%',
          }}
        >
          <LocationIcon sx={{ fontSize: { xs: 16, sm: 18 }, color: theme.custom.color.ink, flexShrink: 0 }} />
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: { xs: '12px', sm: '13px' },
              color: theme.custom.color.ink,
              lineHeight: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {cityName}
          </Typography>
        </Box>

        {post?.returned && <ResolvedBadge label={t('returned')} />}

        {/* Date posted: replaces the share/save icon buttons that used to
            sit bottom-end on the photo. Same '#78808E' scrim background as
            those buttons (the reference design's own translucent overlay
            color, not a design token - it exists only on top of a photo and
            has no equivalent elsewhere), now a pill carrying the relative
            "posted X ago" time instead. */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 12,
            insetInlineEnd: 12,
            zIndex: 2,
            display: 'inline-flex',
            alignItems: 'center',
            gap: { xs: 0.5, sm: 0.75 },
            px: { xs: 1.25, sm: 1.5 },
            py: { xs: 0.5, sm: 0.625 },
            borderRadius: '999px',
            backgroundColor: alpha('#78808E', 0.55),
          }}
        >
          <TimeIcon sx={{ fontSize: { xs: 16, sm: 18 }, color: '#FFFFFF' }} />
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: { xs: '12px', sm: '13px' },
              color: '#FFFFFF',
              lineHeight: 1,
              whiteSpace: 'nowrap',
            }}
          >
            {created}
          </Typography>
        </Box>
      </Box>
      </Box>

      {/* Header: category chips. City moved up onto the photo as a pill
          inline with the found/lost status badge (see above) - this row
          used to also carry a second icon'd city line, now dropped since
          the photo-overlay pill is the only city mention on the card. */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: { xs: '0 16px', sm: '0 20px' }, pt: { xs: 1.5, sm: 2 } }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
          {categories.map((cat, index) => {
            const catStyle = categoryStyles[index];
            const catName = categoryNames[index];
            return (
              <Box
                key={cat.code || index}
                sx={{
                  alignSelf: 'flex-start',
                  backgroundColor: alpha(catStyle.main, 0.1),
                  border: `1px solid ${alpha(catStyle.main, 0.35)}`,
                  color: catStyle.main,
                  fontWeight: 800,
                  fontSize: 13,
                  borderRadius: '999px',
                  padding: '5px 12px',
                }}
              >
                {catName}
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Facts: the exact date (mainDate, or createdAt as a fallback so this
          slot never goes empty). Start-aligned (start in LTR, end in RTL,
          via flex-start on a direction-aware row) rather than centered.
          When the listing went up (relative) moved onto the photo as its
          own badge (see above) - not repeated here. View count isn't
          repeated here either - it's already the first column of the
          stats bar below. */}
      {exactDateLabel && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', padding: { xs: '0 16px', sm: '0 20px' }, pt: { xs: 1, sm: 1.5 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CalendarIcon sx={{ fontSize: 20, color: theme.custom.color.ink }} />
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: theme.custom.color.ink }}>
              {exactDateLabel}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Stats bar: the same reach metrics ReachRow renders elsewhere,
          spelled out as a 3-column grid instead of an inline row. */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          borderRadius: '18px',
          backgroundColor: theme.custom.color.surfaceBase,
          padding: { xs: '10px 6px', sm: '16px 6px' },
          mx: '6px',
          mt: { xs: 1.25, sm: 2 },
          mb: { xs: 0.5, sm: 1 },
        }}
      >
        {statsBarItems.map((item, index) => (
          <Box
            key={item.key}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.5,
              borderInlineEnd: index < statsBarItems.length - 1
                ? `1px solid ${alpha(theme.custom.color.ink, 0.1)}`
                : 'none',
            }}
          >
            <Typography variant="caption" sx={{ color: alpha(theme.custom.color.ink, 0.6), fontWeight: 600 }}>
              {item.label}
            </Typography>
            <Typography sx={{ color: theme.custom.color.brandLogo, fontWeight: 800, fontSize: 16 }}>
              {item.value !== null ? item.value : '—'}
            </Typography>
          </Box>
        ))}
      </Box>
    </PostCardRoot>
  );
};


const memoizedPost = memo(Post);

export default memoizedPost;

