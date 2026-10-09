import { useNavigate, Link } from "react-router-dom";
import { memo, useCallback, useMemo, Fragment } from "react";
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
import { getCategoryConfig, getCategoryIcon, getCategoryBadgeStyle } from "../../../config/categories";
import LazyCardMedia from "../../../components/LazyCardMedia";
import ReachRow from "../../../components/ReachRow";
import { summarizeSocialStats, readSiteViews, readTotalViews } from "../../../utils/socialStats";
import { API_BASE_URL } from "../../../config/api";

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

// Unified Frosted Pod for no-image states: 1 category has prominent icon + label,
// 2 or more categories has line-by-line vertical rows with hairline dividers
const CategoryBentoPod = ({ items }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const dividerColor = isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)";
  const count = items?.length || 0;

  if (count === 0) return null;

  return (
    <Box
      sx={{
        backgroundColor: isDark
          ? alpha(theme.custom.color.surfaceRaised || "#1e293b", 0.82)
          : "rgba(255, 255, 255, 0.88)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.14)" : "rgba(255, 255, 255, 0.95)"}`,
        boxShadow: isDark
          ? "0 8px 32px rgba(0, 0, 0, 0.35), 0 2px 6px rgba(0, 0, 0, 0.2)"
          : "0 10px 28px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)",
        borderRadius: { xs: "18px", sm: "22px" },
        width: count === 1 ? "fit-content" : "100%",
        maxWidth: count === 1 ? { xs: "88%", sm: "84%" } : { xs: "92%", sm: "88%" },
        boxSizing: "border-box",
        overflow: "hidden",
        p: count === 1
          ? { xs: "16px 24px", sm: "20px 30px" }
          : { xs: "12px 14px", sm: "14px 18px" },
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* 1 Category: current centered icon + label design */}
      {count === 1 && (() => {
        const item = items[0];
        const Icon = item.IconComponent;
        return (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, width: "100%", minWidth: 0 }}>
            <Box
              sx={{
                color: item.style?.main || theme.palette.text.primary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                "& svg": { fontSize: { xs: 44, sm: 54 } },
              }}
            >
              <Icon />
            </Box>
            <Typography
              noWrap
              sx={{
                fontWeight: 750,
                fontSize: { xs: "13px", sm: "14px" },
                color: item.style?.main || theme.custom.color.ink,
                lineHeight: 1.2,
                textAlign: "center",
                maxWidth: 160,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {item.label}
            </Typography>
          </Box>
        );
      })()}

      {/* 2 or more Categories: Vertical Line-by-Line list with hairline dividers */}
      {count >= 2 && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            minWidth: 0,
            boxSizing: "border-box",
          }}
        >
          {items.slice(0, 5).map((item, idx) => {
            const Icon = item.IconComponent;
            return (
              <Fragment key={item.code || idx}>
                {idx > 0 && (
                  <Box
                    sx={{
                      width: "100%",
                      height: "1px",
                      bgcolor: dividerColor,
                      my: count >= 5 ? 0.35 : 0.5,
                      flexShrink: 0,
                      boxSizing: "border-box",
                    }}
                  />
                )}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: { xs: 1, sm: 1.25 },
                    width: "100%",
                    minWidth: 0,
                    boxSizing: "border-box",
                    py: count >= 5 ? 0.2 : 0.35,
                  }}
                >
                  <Box
                    sx={{
                      color: item.style?.main || theme.palette.text.primary,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      "& svg": {
                        fontSize: count >= 5 ? { xs: 17, sm: 19 } : { xs: 19, sm: 22 },
                      },
                    }}
                  >
                    <Icon />
                  </Box>
                  <Typography
                    noWrap
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      fontWeight: 750,
                      fontSize: count >= 5 ? { xs: "11px", sm: "11.5px" } : { xs: "11.5px", sm: "12.5px" },
                      color: theme.custom.color.ink,
                      lineHeight: 1.2,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.label}
                  </Typography>
                </Box>
              </Fragment>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

const Post = ({ post, type }) => {
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
        foundLostLabel = (flOption.code === 'FOUND' ? t('found') : flOption.code === 'LOST' ? t('lost') : null) ||
                        getLabel(flOption.labels, currentLanguage) ||
                        (flOption.code === 'FOUND' ? t('found') : t('lost'));
        foundLostColor = flOption.color ||
                        (flOption.code === 'FOUND' ? theme.custom.status.found.main : theme.custom.status.lost.main);
      }
    }

    // Direct type prop or post.type fallback (e.g. from RecentSection)
    if (!foundLostValue && (type || post?.type)) {
      const code = (type || post?.type).toUpperCase();
      if (code === 'FOUND' || code === 'LOST') {
        foundLostValue = code;
        foundLostLabel = code === 'FOUND' ? t('found') : t('lost');
        foundLostColor = code === 'FOUND' ? theme.custom.status.found.main : theme.custom.status.lost.main;
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
        foundLostLabel = (post.foundLost.code === 'FOUND' ? t('found') : post.foundLost.code === 'LOST' ? t('lost') : null) ||
                        getLabel(post.foundLost.labels, currentLanguage) ||
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
    const statusText = t(isFound ? 'found' : 'lost');

    return { isFound, statusColor, statusText };
  }, [post?.Floptions, post?.foundLost, post?.type, type, currentLanguage, t, theme.custom.status.found.main, theme.custom.status.lost.main]);

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
        const badge = getCategoryBadgeStyle(cat.code);
        return {
          main: config.color,
          light: config.backgroundColor,
          dark: config.color,
          icon: config.color,
          background: config.backgroundColor,
          text: config.color,
          badge,
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
        code: cat.code,
        label: categoryNames[index]
      };
    }).filter(Boolean); // Remove null entries
  }, [post?.image, categories, categoryStyles, categoryNames]);

  const hasImage = Boolean(post?.image);
  const showTopCategoryBadges = hasImage;

  // Memoized error handler for image
  const handleImageError = useCallback((e) => {
    // Image failed to load
  }, []);

  // Memoized event handlers

  const handleViewDetails = useCallback(() => {
    navigate(`/dash/posts/${post?._id}`);
  }, [navigate, post?._id]);

  // Ambient Aura Mesh background for no-image cards (Option 1)
  const noImageBackground = useMemo(() => {
    const isDark = isDarkMode;
    const isRtl = isRTLMode();
    const baseBg = isDark
      ? (theme.custom?.color?.surfaceBase || '#0F172A')
      : (theme.custom?.color?.surfaceBase || '#F8FAFC');

    if (!categoryStyles || categoryStyles.length === 0) {
      return baseBg;
    }

    const c1 = categoryStyles[0]?.main || theme.custom?.color?.brandPrimary || '#00BCD4';
    const c2 = categoryStyles[1]?.main || c1;
    const c3 = categoryStyles[2]?.main;

    // 1 Category: Centered ambient aura framing the category pod
    if (categoryStyles.length === 1) {
      return `radial-gradient(circle at 50% 45%, ${alpha(c1, isDark ? 0.36 : 0.26)} 0%, ${alpha(c1, isDark ? 0.08 : 0.05)} 65%, transparent 100%), ${baseBg}`;
    }

    // 2 or more Categories: Ambient multi-radial glow orbs
    const pos1 = isRtl ? '80% 25%' : '20% 25%';
    const pos2 = isRtl ? '15% 75%' : '85% 75%';
    const pos3 = isRtl ? '30% 20%' : '70% 20%';

    const layers = [
      `radial-gradient(circle at ${pos1}, ${alpha(c1, isDark ? 0.34 : 0.26)} 0%, ${alpha(c1, isDark ? 0.08 : 0.05)} 65%, transparent 100%)`,
      `radial-gradient(circle at ${pos2}, ${alpha(c2, isDark ? 0.30 : 0.22)} 0%, ${alpha(c2, isDark ? 0.06 : 0.04)} 65%, transparent 100%)`,
    ];

    if (c3 && categoryStyles.length >= 3) {
      layers.push(
        `radial-gradient(circle at ${pos3}, ${alpha(c3, isDark ? 0.22 : 0.15)} 0%, transparent 100%)`
      );
    }

    layers.push(baseBg);
    return layers.join(', ');
  }, [categoryStyles, isDarkMode, currentLanguage, theme]);

  // Early return after all hooks
  if (!post) return null;

  // Grid view layout - the photo leads as a square top block (its own
  // corners rounded to match the card), status and quick actions overlaid on
  // it, then a plain content stack below: category, city headline, exact
  // location, the date/time/views facts, and a stats bar reusing ReachRow's
  // metrics. One fixed density: the card carried a control that cycled it
  // through three widths, and that control is gone, so the layout that reads
  // best in a grid cell is the only one it renders.
  const tone = foundLostStatus.isFound ? theme.custom.status.found : theme.custom.status.lost;
  const StatusIcon = foundLostStatus.isFound ? TaskAltOutlined : SearchOffOutlined;

  const totalViews = readTotalViews(post);
  const socialStats = summarizeSocialStats(post);
  // Reactions/likes and comments are the same kind of activity whichever
  // platform they happened on, so - like `interactions` itself above - they
  // combine across Facebook/Instagram. `null` only when neither platform has
  // anything fetched, so an unfetched number never reads as a real zero.
  const combineCounts = (a, b) => (a === null && b === null ? null : (a || 0) + (b || 0));
  const reactionsCount = combineCounts(socialStats.facebook.reactions, socialStats.instagram.likes);
  const commentsCount = combineCounts(socialStats.facebook.comments, socialStats.instagram.comments);
  const statsBarItems = [
    { key: 'views', label: t('views'), value: totalViews },
    { key: 'reactions', label: t('reactions'), value: reactionsCount },
    { key: 'comments', label: t('comments'), value: commentsCount },
  ];

  return (
    <PostCardRoot
      component={Link}
      to={`/dash/posts/${post?._id}`}
      sx={{
        textDecoration: 'none',
        color: 'inherit',
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
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: { xs: 1.5, sm: 2 },
              width: '100%',
              height: '100%',
              zIndex: 1,
              boxSizing: 'border-box',
            }}
          >
            <CategoryBentoPod items={categoryIconsData} />
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

        {/* Category: on the opposite end of the same top row (insetInlineEnd)
            from the status badge. Displays when post has image OR when post has
            more than 2 categories without image. */}
        {showTopCategoryBadges && (
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            insetInlineEnd: 12,
            zIndex: 2,
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
            gap: 0.75,
            maxWidth: '55%',
          }}
        >
          {categories.map((cat, index) => {
            const catStyle = categoryStyles[index];
            const catName = categoryNames[index];
            const badge = catStyle?.badge || getCategoryBadgeStyle(cat.code);
            return (
              <Box
                key={cat.code || index}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  backgroundColor: badge.backgroundColor,
                  backdropFilter: badge.backdropFilter,
                  border: badge.border,
                  color: badge.color,
                  boxShadow: badge.boxShadow,
                  fontWeight: 700,
                  fontSize: { xs: '12px', sm: '13px' },
                  lineHeight: 1,
                  borderRadius: `${theme.custom.radius.sm}px`,
                  px: { xs: 1.25, sm: 1.5 },
                  py: { xs: 0.5, sm: 0.625 },
                }}
              >
                {catName}
              </Box>
            );
          })}
        </Box>
        )}

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

      {/* Header: city. Category chips moved up onto the photo as a pill
          inline with the found/lost status badge (see above) - this row
          used to carry the category chips, now carries the exact-location
          line instead. */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: { xs: '0 16px', sm: '0 20px' }, pt: { xs: 1.5, sm: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <LocationIcon sx={{ fontSize: 20, color: theme.custom.color.ink, flexShrink: 0 }} />
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: theme.custom.color.ink }}>
            {cityName}
          </Typography>
        </Box>
      </Box>

      {/* Stats bar: the same reach metrics ReachRow renders elsewhere,
          spelled out as a 3-column grid instead of an inline row. */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          borderRadius: '18px',
          backgroundColor: theme.custom.color.surfaceBase,
          padding: { xs: '10px 4px', sm: '14px 6px' },
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
              minWidth: 0,
              px: { xs: 0.25, sm: 0.5 },
              borderInlineEnd: index < statsBarItems.length - 1
                ? `1px solid ${alpha(theme.custom.color.ink, 0.1)}`
                : 'none',
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: alpha(theme.custom.color.ink, 0.6),
                fontWeight: 600,
                fontSize: { xs: '11px', sm: '12px' },
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%',
                lineHeight: 1.2,
              }}
            >
              {item.label}
            </Typography>
            <Typography
              sx={{
                color: theme.custom.color.brandLogo,
                fontWeight: 800,
                fontSize: { xs: 14, sm: 16 },
                lineHeight: 1.2,
              }}
            >
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

