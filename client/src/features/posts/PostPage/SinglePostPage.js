import {
  Box,
  Button,
  Typography,
  Paper,
  Chip,
  Divider,
  Grid,
  useTheme,
  alpha,
  Alert,
  CircularProgress
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import useAuth from "../../../hooks/useAuth";
import noImageSvg from "../../../img/noimage.svg";
import { useState, useCallback, useMemo } from "react";
import ReportDialog from "../../../components/ReportDialog";
import { useSubmitReportMutation } from "../reportsApiSlice";
import { useBlockUserMutation } from "../../userSettings/usersApiSlice";
import { useDeletePostMutation } from "../postsApiSlice";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  MapOutlined as CityIcon,
  DescriptionOutlined as DescriptionSectionIcon,
  Public as CountryIcon,
  WhatsApp as WhatsAppIcon,
  CheckCircle as CheckCircleIcon,
  ImageNotSupported as NoImageIcon,
  TaskAltOutlined,
  SearchOffOutlined,
  Visibility as ViewIcon,
  Flag as FlagIcon,
  Block as BlockIcon,
  VerifiedUser as VerifiedUserIcon,
} from "@mui/icons-material";

import { useTranslation } from "../../../utils/translations";
import { getOptimizedImageUrl } from "../../../utils/cloudinaryUtils";
import LazyCardMedia from "../../../components/LazyCardMedia";
import { formatDistanceToNow } from 'date-fns';
import { ar, fr, enUS } from 'date-fns/locale';
import RenderIcon from "../../../components/RenderIcon";
import { authStorage } from "../../../utils/authStorage";
import { getCategoryConfig, getCategoryIcon } from "../../../config/categories";
import PromotionDialog from "../../../components/PromotionDialog";
import ClaimItemDialog from "../../../components/ClaimItemDialog";
import PostMatchesPanel from "../../notifications/PostMatchesPanel";
import SocialReach from "./SocialReach";
import CommentsSection from "./CommentsSection";

// Blends two hex colors at `ratio` (0-1, share of colorA) into a solid,
// fully opaque rgb() — used to tint a badge's fill with its status color
// without making the fill itself translucent (alpha() changes opacity, not
// hue mix, so it can't produce an opaque tint on its own).
const mixHexColors = (colorA, colorB, ratio) => {
  const toRgb = (hex) => {
    const int = parseInt(hex.replace('#', ''), 16);
    return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
  };
  const [r1, g1, b1] = toRgb(colorA);
  const [r2, g2, b2] = toRgb(colorB);
  const mix = (a, b) => Math.round(a * ratio + b * (1 - ratio));
  return `rgb(${mix(r1, r2)}, ${mix(g1, g2)}, ${mix(b1, b2)})`;
};

// Neumorphic treatment shared by every badge that sits directly on the post
// photo (status tag, date badge, resolved ribbon, no-image caption): a solid,
// fully opaque fill — never see-through, so the badge reads as its own
// surface rather than a tint of whatever photo is behind it — carved with
// the same soft-UI shadow pair as the "inner shadow" reference swatch this
// was built from (a dark inset shadow toward the bottom-right, a light inset
// shadow toward the top-left, blur/offset scaled down from that reference's
// 30px blur / 18px offset on a ~240px swatch to badge size).
//
// Optional `tone` (theme.custom.status.found/lost, or the warning fallback
// used for an undetermined status) tints the fill toward its status color —
// a single clean pastel, not a visibly "mixed" middle color — by leaning on
// the same ~11% ratio designTokens.js's own status.bg pastels already use
// against white (#D6483B mixed 11% into white lands within a point of
// #FBEAE8, the hand-picked "lost" light background), instead of the far
// stronger 18-32% blend this used before, which read as a muddy tint rather
// than a sweet, airy one. Light mode uses the designed status.bg token
// outright wherever it's already a solid hex; dark mode's status.bg is a
// translucent wash unusable on an opaque fill, so it's approximated with the
// same gentle mix ratio there and for the warning fallback (whose own `bg`
// is alpha-based in both modes). Badges with no type of their own (date,
// no-image caption) call this with no tone and get plain, opaque
// surfaceRaised. Either way the identity color still lives primarily in the
// icon/label, same rule mobile's neumorphic surfaces (theme/neumorphism.js)
// rest on.
const STATUS_TINT_RATIO = 0.11;

const neumorphicOverlaySx = (theme, tone) => {
  const isDark = theme.palette.mode === 'dark';
  const toneFill = tone && (
    !isDark && typeof tone.bg === 'string' && tone.bg.startsWith('#')
      ? tone.bg
      : mixHexColors(tone.main, theme.custom.color.surfaceRaised, STATUS_TINT_RATIO)
  );
  return {
    backgroundColor: toneFill || theme.custom.color.surfaceRaised,
    boxShadow: tone
      ? `inset 3px 3px 6px ${alpha(tone.main, isDark ? 0.35 : 0.2)}, inset -3px -3px 6px ${alpha('#FFFFFF', isDark ? 0.06 : 0.8)}`
      : isDark
        ? `inset 3px 3px 6px ${alpha('#000000', 0.55)}, inset -3px -3px 6px ${alpha(theme.custom.color.ink, 0.06)}`
        : `inset 3px 3px 6px ${alpha(theme.custom.color.ink, 0.16)}, inset -3px -3px 6px ${alpha('#FFFFFF', 0.85)}`,
  };
};

// Same signature as the post card DNA (Post.js/TrendingItem): this is the
// single most load-bearing fact on the page, so it lives on the image, not
// buried in a label:value row further down.
const StatusTag = ({ tone, icon: Icon, label }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 12,
        insetInlineStart: 12,
        zIndex: 3,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1.5,
        py: 0.625,
        borderRadius: `${theme.custom.radius.sm}px`,
        ...neumorphicOverlaySx(theme, tone),
      }}
    >
      <Icon sx={{ fontSize: 18, color: tone.main }} />
      <Typography
        variant="body2"
        sx={{ fontWeight: 700, letterSpacing: 0.3, color: tone.main, lineHeight: 1 }}
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
        position: 'absolute',
        top: 12,
        insetInlineEnd: 12,
        zIndex: 3,
        px: 1.25,
        py: 0.625,
        borderRadius: `${theme.custom.radius.sm}px`,
        ...neumorphicOverlaySx(theme),
      }}
    >
      <Typography variant="caption" sx={{ color: theme.custom.color.ink, fontWeight: 600, lineHeight: 1 }}>
        {children}
      </Typography>
    </Box>
  );
};

const ResolvedRibbon = ({ children }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 12,
        insetInlineStart: '50%',
        transform: 'translateX(-50%)',
        zIndex: 4,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: 2,
        py: 0.75,
        borderRadius: `${theme.custom.radius.sm}px`,
        ...neumorphicOverlaySx(theme, theme.custom.status.found),
      }}
    >
      <CheckCircleIcon sx={{ fontSize: 18, color: theme.custom.status.found.main }} />
      <Typography
        variant="body2"
        sx={{
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          lineHeight: 1,
          color: theme.custom.status.found.main,
        }}
      >
        {children}
      </Typography>
    </Box>
  );
};

// Icon + display-face title, one treatment for every block on the page
// (description, reach, comments) — mirrors mobile PostDetailScreen.js's
// SectionHeader (Phase 14) instead of this page's old plain h6/overline mix.
const SectionHeading = ({ icon: Icon, children }) => {
  const theme = useTheme();
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25 }}>
      <Icon sx={{ fontSize: 20, color: theme.custom.color.ink }} />
      <Typography
        variant="h6"
        sx={{ fontWeight: 700, color: theme.custom.color.ink, fontSize: { xs: '1rem', md: '1.1rem' } }}
      >
        {children}
      </Typography>
    </Box>
  );
};

// A single fact as a tinted tile — icon square, micro uppercase label, value.
// Mirrors mobile PostDetailScreen.js's InfoTile grid (Phase 14), replacing the
// old label:value fact-strip row for city/date/country/views. fullWidth is
// for the exact-location tile, whose free-text address can run long.
const InfoTile = ({ icon: Icon, label, value, fullWidth }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        p: 1.5,
        borderRadius: `${theme.custom.radius.md}px`,
        backgroundColor: alpha(theme.custom.color.ink, 0.04),
        flexBasis: fullWidth ? '100%' : { xs: '44%', sm: '31%', md: '22%' },
        flexGrow: 1,
        minWidth: 0,
      }}
    >
      <Box
        sx={{
          width: 38,
          height: 38,
          borderRadius: `${theme.custom.radius.sm}px`,
          backgroundColor: alpha(theme.custom.color.brandPrimary, 0.12),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon sx={{ fontSize: 19, color: theme.custom.color.brandPrimary }} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            fontWeight: 700,
            letterSpacing: 0.6,
            textTransform: 'uppercase',
            fontSize: '0.65rem',
            color: alpha(theme.custom.color.ink, 0.5),
          }}
        >
          {label}
        </Typography>
        <Typography
          variant="body2"
          noWrap={!fullWidth}
          sx={{ fontWeight: 700, color: theme.custom.color.ink, mt: 0.25, wordBreak: 'break-word' }}
        >
          {value}
        </Typography>
      </Box>
    </Box>
  );
};

const SinglePostPage = ({
  _id,
  categoryname,
  region,
  exactLocation,
  contact,
  user,
  image,
  username,
  createdAt,
  updatedAt,
  countryname,
  countryLabels,
  foundLost,
  Floptions,
  description,
  contactPreferences,
  additionalContact,
  city,
  cityLabels,
  cityName,
  // Additional fields from Post model
  title,
  titleLabels,
  descriptionLabels,
  mainDate,
  views,
  lastViewedAt,
  // Where this listing was auto-posted, and what it has collected there.
  social,
  socialStats,
  status,
  returned,
  resolvedAt,
  expiresAt,
  tags,
  promotionRequested,
  promotionRequestedAt,
  promotionProcessed,
  promotionProcessedAt,
  // Category object from aggregation
  Category,
  // Categories array from aggregation (new format)
  Categories,
  // API transformation fields
  foundLostLabel,
  // Refetch function
  refetchPost
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { usernameId, isAuthenticated, role } = useAuth();
  const { t, currentLanguage } = useTranslation();

  const canEdit = (user === usernameId || role === 'admin') && isAuthenticated;
  const canDelete = canEdit;
  const isAuthor = user === usernameId;
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [submitReport] = useSubmitReportMutation();
  const [blockUser, { isLoading: isBlocking }] = useBlockUserMutation();
  const [deletePost, { isLoading: isDeleting }] = useDeletePostMutation();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [showClaimDialog, setShowClaimDialog] = useState(false);

  // Memoized event handlers
  const handleEdit = useCallback(() => {
    navigate(`/dash/posts/edit/${_id}`);
  }, [navigate, _id]);

  const handleReport = useCallback(() => {
    // Check if user is authenticated
    if (!usernameId) {
      // Store the current post URL in localStorage for redirect after login
      const currentPostUrl = window.location.pathname;
      authStorage.setRedirectAfterLoginWithMessage(currentPostUrl, 'loginRequiredReportPost');

      // Redirect to login page
      navigate('/login');
      return;
    }

    // If authenticated, open the dialog
    setReportDialogOpen(true);
  }, [usernameId, navigate]);

  const handleSubmitReport = useCallback(async (reportData) => {
    try {
      const result = await submitReport(reportData).unwrap();
      return result;
    } catch (error) {
      throw new Error(error.data?.message || 'Failed to submit report');
    }
  }, [submitReport]);

  const handleCloseReportDialog = useCallback(() => {
    setReportDialogOpen(false);
  }, []);

  // Blocking hides every post by this author from the signed-in viewer and
  // stops their listings producing match alerts. Reversible from the blocked
  // users page, so the confirmation says so instead of warning about
  // permanence. Same endpoint and semantics as the mobile app.
  const handleBlockAuthor = useCallback(async () => {
    if (!usernameId) {
      authStorage.setRedirectAfterLoginWithMessage(window.location.pathname, 'loginRequiredReportPost');
      navigate('/login');
      return;
    }

    if (!window.confirm(t('blockUserConfirmMessage'))) return;

    try {
      await blockUser({ userId: user }).unwrap();
      // The listing this viewer came from still holds the blocked post, so send
      // them back to it refreshed rather than leaving them on hidden content.
      navigate('/dash/posts');
    } catch (error) {
      setSuccessMessage(error?.data?.message || t('blockUserError'));
      setShowSuccessMessage(true);
    }
  }, [usernameId, user, blockUser, navigate, t]);

  const handleDeletePost = useCallback(async () => {
    if (window.confirm(t('confirmDeletePost') || 'Are you sure you want to delete this post? This action cannot be undone.')) {
      try {
        await deletePost({ id: _id }).unwrap();
        setSuccessMessage(t('postDeletedSuccessfully') || 'Post deleted successfully! The post has been removed.');
        setShowSuccessMessage(true);
        setTimeout(() => {
          setShowSuccessMessage(false);
          navigate('/dash');
        }, 2000);
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
  }, [deletePost, _id, navigate, t]);

  const handlePromotionRequest = useCallback(() => {
    setShowPromotionDialog(true);
  }, []);

  const handleClosePromotionDialog = useCallback(() => {
    setShowPromotionDialog(false);
  }, []);

  const handlePromotionRequested = useCallback(() => {
    // Handle successful promotion request
    setSuccessMessage(t('promotionRequested') || 'Promotion request submitted successfully!');
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);
  }, [t]);

  const handleClaimItem = useCallback(() => {
    // Check if user is authenticated
    if (!isAuthenticated || !usernameId) {
      // Store the current post URL in localStorage for redirect after login
      const currentPostUrl = window.location.pathname;
      authStorage.setRedirectAfterLoginWithMessage(currentPostUrl, 'loginRequiredClaimItem');

      // Redirect to login page
      navigate('/login');
      return;
    }

    // If authenticated, open the claim dialog
    setShowClaimDialog(true);
  }, [isAuthenticated, usernameId, navigate]);

  const handleCloseClaimDialog = useCallback(() => {
    setShowClaimDialog(false);
  }, []);

  const handleItemMarkedAsReturned = useCallback(() => {
    // Handle successful marking as returned
    setSuccessMessage(t('itemMarkedAsReturned') || 'Item marked as returned successfully!');
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
      // Refetch the post data to get updated returned status
      if (refetchPost) {
        refetchPost();
      } else {
        // Fallback to page reload if refetch is not available
        window.location.reload();
      }
    }, 2000);
  }, [t, refetchPost]);

  // Memoized computed values
  const locale = useMemo(() => {
    switch (currentLanguage) {
      case 'ar': return ar;
      case 'fr': return fr;
      default: return enUS;
    }
  }, [currentLanguage]);

  const createdDate = useMemo(() => {
    const timeAgo = formatDistanceToNow(new Date(createdAt), {
      addSuffix: true,
      locale
    });
    return `${t('posted')} ${timeAgo}`;
  }, [createdAt, locale, t]);

  const isDarkMode = theme.palette.mode === 'dark';

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
          background: isDarkMode ? alpha(config.backgroundColor, 0.2) : config.backgroundColor,
          text: config.color
        };
      } catch (error) {
        return {
          main: theme.custom.color.brandPrimary,
          background: isDarkMode ? alpha(theme.custom.color.brandPrimary, 0.15) : alpha(theme.custom.color.brandPrimary, 0.08),
          text: theme.custom.color.brandPrimary
        };
      }
    });
  }, [categories, isDarkMode, theme.custom.color.brandPrimary]);

  // Extract city from location (show only city) - helper function
  const getCityFromLocation = useCallback((location) => {
    if (!location) return t('unknownLocation');
    // Split by comma and take the first part (usually the city)
    const parts = location.split(',');
    const cityPart = parts[0].trim();
    // Remove any extra location details that might be in parentheses
    const cleanCity = cityPart.split('(')[0].trim();
    // Remove any numbers or extra details
    return cleanCity.replace(/\d+/g, '').trim();
  }, [t]);

  // Memoized city name computation - standardized with RecentPosts approach
  const displayCityName = useMemo(() => {
    // Get city name with proper multilingual support
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
  }, [cityLabels, cityName, city, currentLanguage, exactLocation, getCityFromLocation]);

  // Memoized found/lost status computation
  const foundLostStatus = useMemo(() => {

    let foundLostValue = null;
    let displayLabel = null;

    // Priority 1: Use Floptions.code if available (populated object from server)
    if (Floptions) {

      // Handle both array and object formats
      let flOption = Floptions;
      if (Array.isArray(Floptions)) {
        flOption = Floptions[0]; // Take first element if it's an array
      }

      if (flOption && flOption.code) {
        foundLostValue = flOption.code;

        // Set label based on code
        if (flOption.code === 'FOUND') {
          displayLabel = t('found');
        } else if (flOption.code === 'LOST') {
          displayLabel = t('lost');
        }
      }
    }
    // Priority 2: Use foundLost as fallback (could be ObjectId or object)
    else if (foundLost) {
      if (typeof foundLost === 'string') {
        // If it's a string, check if it's an ObjectId or a code
        if (foundLost.length === 24) {
          // It's likely an ObjectId, we can't determine the value from this
          // This should be handled by the server to populate Floptions
          foundLostValue = null;
        } else {
          // It's a code string
          foundLostValue = foundLost.toUpperCase();
          if (foundLost.toUpperCase() === 'FOUND') {
            displayLabel = t('found');
          } else if (foundLost.toUpperCase() === 'LOST') {
            displayLabel = t('lost');
          }
        }
      } else if (foundLost.code) {
        // It's an object with code
        foundLostValue = foundLost.code;

        if (foundLost.code === 'FOUND') {
          displayLabel = t('found');
        } else if (foundLost.code === 'LOST') {
          displayLabel = t('lost');
        }
      }
    }

    // If we still don't have a value, we need to determine it from the data
    if (!foundLostValue) {

      // Check if we can determine from the post title or description
      // This is a fallback for when the server doesn't populate the foundLost field
      if (titleLabels && titleLabels[currentLanguage]) {
        const titleText = titleLabels[currentLanguage].toLowerCase();
        if (titleText.includes('lost') || titleText.includes('perdu') || titleText.includes('مفقود')) {
          foundLostValue = "LOST";
          displayLabel = t('lost');
        } else if (titleText.includes('found') || titleText.includes('trouvé') || titleText.includes('موجود')) {
          foundLostValue = "FOUND";
          displayLabel = t('found');
        }
      }

      // If still no value, check description
      if (!foundLostValue && description) {
        const desc = description.toLowerCase();
        if (desc.includes('lost') || desc.includes('perdu') || desc.includes('مفقود')) {
          foundLostValue = "LOST";
          displayLabel = t('lost');
        } else if (desc.includes('found') || desc.includes('trouvé') || desc.includes('موجود')) {
          foundLostValue = "FOUND";
          displayLabel = t('found');
        }
      }

      // If still no value, check if we have a foundLostLabel from the API transformation
      if (!foundLostValue && foundLostLabel) {
        const label = foundLostLabel.toLowerCase();
        if (label.includes('lost') || label.includes('perdu') || label.includes('مفقود')) {
          foundLostValue = "LOST";
          displayLabel = t('lost');
        } else if (label.includes('found') || label.includes('trouvé') || label.includes('موجود')) {
          foundLostValue = "FOUND";
          displayLabel = t('found');
        }
      }

      // Additional fallback: Check if there's a foundLostType field
      if (!foundLostValue && foundLost && typeof foundLost === 'object') {
        if (foundLost.foundLostType) {
          const type = foundLost.foundLostType.toLowerCase();
          if (type.includes('lost')) {
            foundLostValue = "LOST";
            displayLabel = t('lost');
          } else if (type.includes('found')) {
            foundLostValue = "FOUND";
            displayLabel = t('found');
          }
        }
      }

      // Last resort: Check if there's any other field that might indicate status
      if (!foundLostValue) {
        // Additional fallback: Check if we can determine from the foundLost ObjectId
        // This is a last resort when the server doesn't populate the lookup fields
        if (!foundLostValue && foundLost && typeof foundLost === 'string' && foundLost.length === 24) {
          // These are the known ObjectIds from your database
          if (foundLost === '68b708a085dd243c40a90826') { // LOST
            foundLostValue = "LOST";
            displayLabel = t('lost');
          } else if (foundLost === '68b708a085dd243c40a90825') { // FOUND
            foundLostValue = "FOUND";
            displayLabel = t('found');
          }
        }
      }
    }

    // Set defaults only if we couldn't determine the actual value
    if (!foundLostValue) {
      foundLostValue = "UNKNOWN";
      displayLabel = t('statusUnknown') || "Status Unknown";
    }

    const isFound = foundLostValue === "FOUND";
    const isLost = foundLostValue === "LOST";

    return { isFound, isLost, statusText: displayLabel };
  }, [foundLost, Floptions, foundLostLabel, titleLabels, description, currentLanguage, t]);

  // The one tone that drives the image status tag AND the card's accent bar —
  // reuses theme.custom.status rather than the old hardcoded #4CAF50/#F44336.
  const statusTone = useMemo(() => {
    if (foundLostStatus.isFound) return theme.custom.status.found;
    if (foundLostStatus.isLost) return theme.custom.status.lost;
    return { main: theme.palette.warning.main, bg: alpha(theme.palette.warning.main, 0.12) };
  }, [foundLostStatus, theme]);

  // Memoized image URL computation - only use Cloudinary if image exists and is uploaded by user
  const imageUrl = useMemo(() => {
    if (!image) return null;
    return image.startsWith('http')
      ? getOptimizedImageUrl(image, 'large')
      : image;
  }, [image]);

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

  // Sanitize contactPreferences and additionalContact to prevent React errors
  const sanitizedContactPreferences = useMemo(() => {
    if (!contactPreferences || typeof contactPreferences !== 'object') {
      return { phone: true, email: false, whatsapp: false };
    }
    return {
      phone: Boolean(contactPreferences.phone),
      email: Boolean(contactPreferences.email),
      whatsapp: Boolean(contactPreferences.whatsapp)
    };
  }, [contactPreferences]);

  const sanitizedAdditionalContact = useMemo(() => {
    if (!additionalContact || typeof additionalContact !== 'object') {
      return {};
    }
    return {
      phone: additionalContact.phone || '',
      email: additionalContact.email || '',
      whatsapp: additionalContact.whatsapp || ''
    };
  }, [additionalContact]);

  const countryDisplayName = (countryLabels && countryLabels[currentLanguage])
    || (countryLabels && countryLabels.en)
    || countryname;

  // Status already shows on the image-overlay badge above, and exact location
  // has its own InfoTile below (metaLocationLabel) — mirrors mobile
  // PostDetailScreen.js: no standalone headline needed on top of both.
  const metaLocationLabel = (exactLocation && exactLocation.trim() && exactLocation.trim() !== displayCityName)
    ? exactLocation.trim()
    : null;

  return (
    <Box
      sx={{
        p: { xs: 1.5, sm: 2, md: 4 },
        pt: { xs: "4rem", sm: "4.5rem", md: "5rem" },
        mt: { xs: "2rem", sm: "1.5rem", md: "1rem" },
        minHeight: "100vh",
        backgroundColor: theme.custom.color.surfaceBase
      }}
    >
      <Grid container spacing={{ xs: 2, md: 4 }}>
        {/* Main Content */}
        <Grid item xs={12} lg={8}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: `${theme.custom.radius.lg}px`,
              overflow: 'hidden',
              backgroundColor: theme.custom.color.surfaceRaised,
              boxShadow: theme.custom.elevation.e1,
            }}
          >
            {/* Image Section */}
            <Box sx={{
              position: 'relative',
              backgroundColor: image ? 'transparent' : alpha(statusTone.main, 0.06),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {returned && <ResolvedRibbon>{t('returned')}</ResolvedRibbon>}

              <StatusTag
                tone={statusTone}
                icon={foundLostStatus.isFound ? TaskAltOutlined : SearchOffOutlined}
                label={foundLostStatus.statusText}
              />
              <DateBadge>{createdDate}</DateBadge>

              {image && imageUrl ? (
                <LazyCardMedia
                  component="img"
                  sx={{
                    width: '100%',
                    height: { xs: 300, sm: 400, md: 500 },
                    objectFit: 'cover',
                    objectPosition: 'center',
                  }}
                  image={imageUrl}
                  alt={displayCityName || 'Post Image'}
                  fallback={noImageSvg}
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
                    height: { xs: 300, sm: 400, md: 500 },
                  }}
                >
                  {categoryIconsData.length === 1 ? (() => {
                    const IconComponent = categoryIconsData[0].IconComponent;
                    return (
                      <IconComponent
                        sx={{
                          fontSize: { xs: '120px', sm: '150px', md: '180px' },
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
                        gap: { xs: 3, sm: 3.5, md: 4 },
                        flexWrap: 'wrap',
                        paddingTop: { xs: 2, sm: 2.5, md: 3 },
                      }}
                    >
                      {categoryIconsData.slice(0, 4).map((iconData, idx) => {
                        const IconComponent = iconData.IconComponent;
                        return (
                          <IconComponent
                            key={iconData.code || idx}
                            sx={{
                              fontSize: { xs: '64px', sm: '80px', md: '96px' },
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

              {!image && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 12,
                    insetInlineEnd: 12,
                    zIndex: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 1.25,
                    py: 0.5,
                    borderRadius: `${theme.custom.radius.sm}px`,
                    ...neumorphicOverlaySx(theme),
                  }}
                >
                  <NoImageIcon sx={{ fontSize: 16, color: 'text.secondary', opacity: 0.7 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.7, fontWeight: 500 }}>
                    {t('postHasNoImage')}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Content Section */}
            <Box sx={{ p: { xs: 3, md: 4 } }}>
              {/* Category chips, icon + label like mobile's category pill. */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {categories.map((cat, index) => {
                  const CatIcon = getCategoryIcon(cat.code);
                  return (
                    <Chip
                      key={cat.code || index}
                      label={categoryNames[index]}
                      size="small"
                      icon={CatIcon ? <CatIcon sx={{ fontSize: '15px !important', color: `${categoryStyles[index].text} !important` }} /> : undefined}
                      sx={{
                        fontSize: '0.75rem',
                        height: 26,
                        backgroundColor: categoryStyles[index].background,
                        color: categoryStyles[index].text,
                        border: `1px solid ${alpha(categoryStyles[index].main, 0.4)}`,
                        fontWeight: 600,
                      }}
                    />
                  );
                })}
              </Box>

              {/* Info grid — the single-value facts (where, when, how many people
                  looked) as tinted tiles instead of a loose row of icon+text pairs.
                  Mirrors mobile PostDetailScreen.js's InfoTile grid (Phase 14). */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
                {metaLocationLabel && (
                  <InfoTile icon={LocationIcon} label={t('location')} value={metaLocationLabel} fullWidth />
                )}
                <InfoTile icon={CityIcon} label={t('city')} value={displayCityName} />
                {mainDate && mainDate.trim() && (
                  <InfoTile
                    icon={CalendarIcon}
                    label={t('date')}
                    value={mainDate}
                  />
                )}
                {countryDisplayName && <InfoTile icon={CountryIcon} label={t('country')} value={countryDisplayName} />}
                {typeof views === 'number' && <InfoTile icon={ViewIcon} label={t('views')} value={views} />}
              </Box>

              {/* Description */}
              <Box
                sx={{
                  mb: 3,
                  p: { xs: 1.75, md: 2.25 },
                  borderRadius: `${theme.custom.radius.md}px`,
                  backgroundColor: alpha(theme.custom.color.ink, 0.04),
                }}
              >
                <SectionHeading icon={DescriptionSectionIcon}>{t('description')}</SectionHeading>
                <Typography variant="body1" sx={{ lineHeight: 1.6, color: theme.palette.text.secondary }}>
                  {(descriptionLabels && descriptionLabels[currentLanguage]) || description || t('noDescriptionProvided')}
                </Typography>
              </Box>

              {/* Tags — operational, not primary to the reader, so they sit
                  quiet at the bottom instead of competing with the facts above. */}
              {tags && tags.length > 0 && (
                <>
                  <Divider sx={{ mb: 2, borderColor: theme.palette.divider }} />
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                    {tags.map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag}
                        size="small"
                        variant="outlined"
                        sx={{
                          height: 22,
                          fontSize: '0.7rem',
                          borderColor: theme.palette.divider,
                          color: 'text.secondary',
                        }}
                      />
                    ))}
                  </Box>
                </>
              )}

              {/* Reach on the Pages this listing was mirrored to. Renders
                  nothing until those numbers have actually been read back. */}
              {(social || socialStats) && (
                <Box sx={{ mt: 3 }}>
                  <SocialReach post={{ social, socialStats }} />
                </Box>
              )}

              {/* Comment thread — the site's own comments merged with the ones
                  left on the Facebook/Instagram copies. Public to read, signed-in
                  to write. Right after Reach, ahead of the sidebar (Claim dialog
                  etc.), mirroring mobile PostDetailScreen.js's section order. */}
              <Box sx={{ mt: 3 }}>
                <CommentsSection postId={_id} />
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ position: { xs: 'static', lg: 'sticky' }, top: { lg: '2rem' }, display: 'flex', flexDirection: 'column', gap: 3 }}>

            {/* Claim Item — the primary, positive action. Brand-colored (not
                status-colored) so it reads as "the thing to do here", not as
                another Lost/Found signal. */}
            {!isAuthor && !returned && (
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: `${theme.custom.radius.lg}px`,
                  border: `1px solid ${alpha(theme.custom.color.brandPrimary, 0.25)}`,
                  backgroundColor: theme.custom.color.surfaceRaised,
                  boxShadow: theme.custom.elevation.e2,
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    insetInlineStart: 0,
                    insetInlineEnd: 0,
                    height: '3px',
                    backgroundColor: theme.custom.color.brandPrimary,
                  }
                }}
              >
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Box
                    sx={{
                      backgroundColor: alpha(theme.custom.color.brandPrimary, 0.12),
                      borderRadius: '50%',
                      p: 1.5,
                      display: 'flex',
                    }}
                  >
                    <CheckCircleIcon sx={{ color: theme.custom.color.brandPrimary, fontSize: 24 }} />
                  </Box>
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    sx={{ color: theme.custom.color.brandPrimary, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
                  >
                    {foundLostStatus.isFound ? t('doYouThinkThisItemIsYours') : t('didYouFindThisItem')}
                  </Typography>
                </Box>

                <Typography variant="body1" sx={{ mb: 2.5, color: theme.palette.text.secondary, lineHeight: 1.6 }}>
                  {foundLostStatus.isFound ? t('ifYouLostThisItem') : t('ifYouFoundThisItem')}
                </Typography>

                <Button
                  variant="contained"
                  onClick={handleClaimItem}
                  fullWidth
                  startIcon={<CheckCircleIcon />}
                  sx={{
                    borderRadius: `${theme.custom.radius.md}px`,
                    textTransform: 'none',
                    fontWeight: 600,
                    py: 1.5,
                    fontSize: '1rem',
                    backgroundColor: theme.custom.color.brandPrimary,
                    '&:hover': {
                      backgroundColor: theme.custom.color.brandPrimary,
                      opacity: 0.9,
                    },
                  }}
                >
                  {foundLostStatus.isFound ? t('yesThisIsMyItem') : t('yesIFoundThisItem')}
                </Button>

                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, mt: 2 }}>
                  <VerifiedUserIcon sx={{ fontSize: 16, color: 'text.secondary', mt: '2px', flexShrink: 0 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                    {t('contactSafetyNote')}
                  </Typography>
                </Box>
              </Paper>
            )}

            {/* Promotion — owner only. WhatsApp green ties it to the channel the
                action actually uses, kept distinct from both brandPrimary (Claim)
                and the status colors (Lost/Found) so nothing competes. */}
            {canEdit && !promotionRequested && (
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: `${theme.custom.radius.lg}px`,
                  border: `1px solid ${alpha('#25D366', 0.3)}`,
                  backgroundColor: theme.custom.color.surfaceRaised,
                  boxShadow: theme.custom.elevation.e2,
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    insetInlineStart: 0,
                    insetInlineEnd: 0,
                    height: '3px',
                    backgroundColor: '#25D366',
                  }
                }}
              >
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Box sx={{ backgroundColor: alpha('#25D366', 0.15), borderRadius: '50%', p: 1.5, display: 'flex' }}>
                    <WhatsAppIcon sx={{ color: '#25D366', fontSize: 24 }} />
                  </Box>
                  <Typography variant="h6" fontWeight={700} sx={{ color: theme.palette.mode === 'dark' ? '#25D366' : '#1D8348', fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                    {foundLostStatus.isFound ? t('promoteYourFoundItem') : t('boostYourChances')}
                  </Typography>
                </Box>

                <Typography variant="body1" sx={{ mb: 2.5, color: theme.palette.text.secondary, lineHeight: 1.6 }}>
                  {foundLostStatus.isFound ? t('teamHasPromotionTechniques') : t('teamHasTechniques')}
                </Typography>

                <Button
                  variant="contained"
                  onClick={handlePromotionRequest}
                  fullWidth
                  startIcon={<WhatsAppIcon />}
                  sx={{
                    borderRadius: `${theme.custom.radius.md}px`,
                    textTransform: 'none',
                    fontWeight: 600,
                    py: 1.5,
                    backgroundColor: '#25D366',
                    // white text measures ~2:1 on this green — getContrastText picks dark text instead
                    color: `${theme.palette.getContrastText('#25D366')} !important`,
                    '&:hover': {
                      backgroundColor: '#1DA851',
                      color: `${theme.palette.getContrastText('#1DA851')} !important`,
                    },
                  }}
                >
                  {t('yesPromote')}
                </Button>
              </Paper>
            )}

            {/* Manage your post — owner only, deliberately neutral (no status
                or brand accent) so it reads as utility, not as competing with
                the Claim CTA a visitor would see. */}
            {canEdit && (
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: `${theme.custom.radius.lg}px`,
                  border: `1px solid ${theme.palette.divider}`,
                  backgroundColor: theme.custom.color.surfaceRaised,
                  boxShadow: theme.custom.elevation.e1,
                }}
              >
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2.5, color: theme.custom.color.ink, fontSize: '1.1rem' }}>
                  {t('manageYourPost')}
                </Typography>

                <Box display="flex" flexDirection="column" gap={1.5}>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={handleEdit}
                    fullWidth
                    sx={{
                      borderRadius: `${theme.custom.radius.md}px`,
                      textTransform: 'none',
                      fontWeight: 600,
                      borderColor: theme.custom.color.brandPrimary,
                      color: theme.custom.color.brandPrimary,
                      '&:hover': { backgroundColor: alpha(theme.custom.color.brandPrimary, 0.08) }
                    }}
                  >
                    {t('editPost')}
                  </Button>

                  {canDelete && (
                    <Button
                      variant="outlined"
                      startIcon={<DeleteIcon />}
                      onClick={handleDeletePost}
                      disabled={isDeleting}
                      fullWidth
                      sx={{
                        borderRadius: `${theme.custom.radius.md}px`,
                        textTransform: 'none',
                        fontWeight: 600,
                        borderColor: theme.palette.error.main,
                        color: theme.palette.error.main,
                        '&:hover': { backgroundColor: theme.palette.error.main, color: '#fff' }
                      }}
                    >
                      {isDeleting ? (t('deleting') || 'Deleting...') : t('deletePost')}
                    </Button>
                  )}
                </Box>
              </Paper>
            )}

            {/* Report asks us to act on the post; Block lets the viewer act on
                the poster themselves, straight away. Neither is a peer action
                to Claim, so both share one quiet row — mirrors mobile
                PostDetailScreen.js's Report/Block pair (Phase 14): Report
                keeps the lost tone so it still reads as the consequential one,
                Block is a neutral wash. Hidden for the post's own author. */}
            {!isAuthor && (
              <Box sx={{ display: 'flex', gap: 1.25 }}>
                <Button
                  onClick={handleReport}
                  startIcon={<FlagIcon sx={{ fontSize: 16 }} />}
                  sx={{
                    flex: 1,
                    borderRadius: `${theme.custom.radius.md}px`,
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.8125rem',
                    py: 1.25,
                    backgroundColor: theme.custom.status.lost.bg,
                    color: theme.custom.status.lost.main,
                    '&:hover': { backgroundColor: theme.custom.status.lost.bg, opacity: 0.85 },
                  }}
                >
                  {t('reportThisPost')}
                </Button>
                <Button
                  onClick={handleBlockAuthor}
                  disabled={isBlocking}
                  startIcon={isBlocking ? <CircularProgress size={14} color="inherit" /> : <BlockIcon sx={{ fontSize: 16 }} />}
                  sx={{
                    flex: 1,
                    borderRadius: `${theme.custom.radius.md}px`,
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.8125rem',
                    py: 1.25,
                    backgroundColor: alpha(theme.custom.color.ink, 0.04),
                    color: alpha(theme.custom.color.ink, 0.6),
                    '&:hover': { backgroundColor: alpha(theme.custom.color.ink, 0.08) },
                  }}
                >
                  {t('blockUser')}
                </Button>
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Possible matches — owner-only. Renders nothing for anyone else, and
          nothing once the item is marked returned. */}
      <PostMatchesPanel postId={_id} isOwner={isAuthor && isAuthenticated} postReturned={!!returned} />

      {/* Success Message */}
      {showSuccessMessage && (
        <Box
          sx={{
            position: 'fixed',
            top: { xs: '80px', md: '100px' },
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            maxWidth: { xs: '90%', sm: '400px' },
            width: '100%',
          }}
        >
          <Alert
            severity="success"
            sx={{
              borderRadius: `${theme.custom.radius.md}px`,
              boxShadow: theme.custom.elevation.e2,
              backgroundColor: isDarkMode ? alpha(theme.custom.status.found.main, 0.2) : theme.custom.status.found.bg,
              border: `1px solid ${alpha(theme.custom.status.found.main, 0.3)}`,
              '& .MuiAlert-message': { color: theme.custom.color.ink, fontWeight: 600 },
              '& .MuiAlert-icon': { color: theme.custom.status.found.main },
            }}
          >
            {successMessage}
          </Alert>
        </Box>
      )}

      {/* Report Dialog */}
      <ReportDialog
        open={reportDialogOpen}
        onClose={handleCloseReportDialog}
        post={{
          _id,
          categoryname,
          region,
          exactLocation,
          contact,
          user: user || 'anonymous', // Ensure user field is never undefined
          image,
          username: username || 'Anonymous', // Ensure username field is never undefined
          createdAt,
          updatedAt,
          countryname,
          countryLabels,
          foundLost: foundLost || 'UNKNOWN', // Ensure foundLost field is never undefined
          Floptions,
          description,
          contactPreferences: sanitizedContactPreferences,
          additionalContact: sanitizedAdditionalContact,
          city,
          cityLabels,
          cityName,
          title,
          titleLabels,
          descriptionLabels,
          mainDate,
          views,
          lastViewedAt,
          status,
          returned,
          resolvedAt,
          expiresAt,
          tags,
          promotionRequested,
          promotionRequestedAt,
          promotionProcessed,
          promotionProcessedAt,
          Category
        }}
        onSubmit={handleSubmitReport}
      />

      {/* Promotion Dialog */}
      <PromotionDialog
        open={showPromotionDialog}
        onClose={handleClosePromotionDialog}
        postId={_id}
        isLostItem={!foundLostStatus.isFound}
        onPromotionRequested={handlePromotionRequested}
        showSuccessMessage={false}
      />

      {/* Claim Item Dialog */}
      <ClaimItemDialog
        open={showClaimDialog}
        onClose={handleCloseClaimDialog}
        postId={_id}
        isFoundPost={foundLostStatus.isFound}
        contactInfo={{
          phone: contact,
          additionalContact: sanitizedAdditionalContact
        }}
        onItemMarkedAsReturned={handleItemMarkedAsReturned}
      />
    </Box>
  );
};

export default SinglePostPage;
