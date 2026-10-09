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
  CircularProgress,
  Breadcrumbs,
  Link as MuiLink,
} from "@mui/material";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import useAuth from "../../../hooks/useAuth";
import noImageSvg from "../../../img/noimage.svg";
import { useState, useCallback, useMemo, Fragment } from "react";
import ReportDialog from "../../../components/ReportDialog";
import { useSubmitReportMutation } from "../reportsApiSlice";
import { useBlockUserMutation } from "../../userSettings/usersApiSlice";
import { useDeletePostMutation, useGetPostCommentsQuery } from "../postsApiSlice";
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
  AccessTime as TimeIcon,
  Flag as FlagIcon,
  Block as BlockIcon,
  NavigateNext as NavigateNextIcon,
  NavigateBefore as NavigateBeforeIcon,
} from "@mui/icons-material";

import { useTranslation } from "../../../utils/translations";
import { getOptimizedImageUrl } from "../../../utils/cloudinaryUtils";
import { formatDisplayDate } from "../../../utils/dateUtils";
import { summarizeSocialStats, readTotalViews } from "../../../utils/socialStats";
import LazyCardMedia from "../../../components/LazyCardMedia";
import { formatDistanceToNow } from 'date-fns';
import { ar, fr, enUS } from 'date-fns/locale';
import RenderIcon from "../../../components/RenderIcon";
import { authStorage } from "../../../utils/authStorage";
import { getCategoryConfig, getCategoryIcon, getCategoryBadgeStyle } from "../../../config/categories";
import PromotionDialog from "../../../components/PromotionDialog";
import ClaimItemDialog from "../../../components/ClaimItemDialog";
import PostMatchesPanel from "../../notifications/PostMatchesPanel";
import { useSectionDeepLink, SOCIAL_REACH_SECTION } from "../../../hooks/useSectionDeepLink";
import SocialReach, { hasSocialReach } from "./SocialReach";
import CommentsSection from "./CommentsSection";
import RelatedPosts from "./RelatedPosts";

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

// Neumorphic treatment shared by badges that sit directly on the post
// photo (resolved ribbon, no-image caption): a solid,
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
// is alpha-based in both modes). The no-image caption calls this with no
// tone and gets plain, opaque surfaceRaised. Either way the identity color
// still lives primarily in the icon/label, same rule mobile's neumorphic
// surfaces (theme/neumorphism.js) rest on.
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

// Shared visual for a solid pill badge (icon + uppercase contrast-text
// label) sitting directly on the post photo - solid tone.main fill,
// radius.sm. Used by both the Lost/Found status tag and the category
// tag(s), so they read as one badge language rather than two.
const BadgeContent = ({ tone, icon: Icon, label }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1.5,
        py: 0.625,
        borderRadius: `${theme.custom.radius.sm}px`,
        backgroundColor: tone.main,
      }}
    >
      <Icon sx={{ fontSize: 18, color: theme.palette.getContrastText(tone.main) }} />
      <Typography
        variant="body2"
        sx={{
          fontWeight: 700,
          letterSpacing: 0.3,
          textTransform: 'uppercase',
          color: theme.palette.getContrastText(tone.main),
          lineHeight: 1,
        }}
      >
        {label}
      </Typography>
    </Box>
  );
};

// Same signature as the post card DNA (Post.js/TrendingItem): this is the
// single most load-bearing fact on the page, so it lives on the image, not
// buried in a label:value row further down.
const StatusTag = ({ tone, icon, label }) => (
  <Box sx={{ position: 'absolute', top: 12, insetInlineStart: 12, zIndex: 3 }}>
    <BadgeContent tone={tone} icon={icon} label={label} />
  </Box>
);

// The category badge(s) take the image's other top corner - the spot the
// date used to sit in. Same frosted-circle treatment as the no-image state's
// category icon backdrop below (CategoryIconLabel): one neutral translucent
// surfaceRaised fill + blur, fully rounded, for every category - not a
// per-category tint - so a colored label reads against any photo the way
// the icon already reads against any hue. Only the text takes the
// category's own color. Wraps instead of stacking so it stays compact next
// to the status tag for a multi-category post.
const CategoryChip = ({ tone, label, code }) => {
  const theme = useTheme();
  const badgeStyle = code ? getCategoryBadgeStyle(code) : null;
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        backgroundColor: badgeStyle ? badgeStyle.backgroundColor : alpha(theme.custom.color.surfaceRaised, 0.55),
        backdropFilter: 'blur(8px)',
        border: badgeStyle ? badgeStyle.border : `1px solid ${tone?.main}`,
        color: badgeStyle ? badgeStyle.color : tone?.main,
        boxShadow: badgeStyle ? badgeStyle.boxShadow : 'none',
        fontWeight: 800,
        fontSize: { xs: '13px', sm: '14px' },
        lineHeight: 1,
        borderRadius: '999px',
        px: { xs: 1.25, sm: 1.5 },
        py: { xs: 0.5, sm: 0.625 },
      }}
    >
      {label}
    </Box>
  );
};

const CategoryTags = ({ items }) => (
  <Box
    sx={{
      position: 'absolute',
      top: 12,
      insetInlineEnd: 12,
      zIndex: 3,
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'flex-end',
      gap: 0.75,
      maxWidth: '60%',
    }}
  >
    {items.map((item) => (
      <CategoryChip key={item.code} tone={item.tone} label={item.label} code={item.code} />
    ))}
  </Box>
);

// No-image state only: the category icon sits on a soft frosted circle
// (translucent surfaceRaised, blurred), with the category name underneath
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
        borderRadius: { xs: "22px", sm: "28px" },
        width: count === 1 ? "fit-content" : "100%",
        maxWidth: count === 1 ? { xs: "85%", sm: 320 } : { xs: "92%", sm: 380, md: 420 },
        boxSizing: "border-box",
        overflow: "hidden",
        p: count === 1
          ? { xs: "24px 32px", sm: "32px 42px" }
          : { xs: "16px 20px", sm: "20px 26px" },
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* 1 Category: prominent centered icon and label */}
      {count === 1 && (() => {
        const item = items[0];
        const Icon = item.IconComponent;
        return (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5, width: "100%", minWidth: 0 }}>
            <Box
              sx={{
                color: item.style?.main || theme.palette.text.primary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                "& svg": { fontSize: { xs: 64, sm: 84, md: 96 } },
              }}
            >
              <Icon />
            </Box>
            <Typography
              noWrap
              sx={{
                fontWeight: 750,
                fontSize: { xs: "15px", sm: "17px" },
                color: item.style?.main || theme.custom.color.ink,
                lineHeight: 1.2,
                textAlign: "center",
                maxWidth: 240,
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
                      my: 0.6,
                      flexShrink: 0,
                      boxSizing: "border-box",
                    }}
                  />
                )}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: { xs: 1.25, sm: 1.75 },
                    width: "100%",
                    minWidth: 0,
                    boxSizing: "border-box",
                    py: 0.45,
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
                        fontSize: { xs: 22, sm: 26 },
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
                      fontSize: { xs: "13px", sm: "14.5px" },
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
const InfoTile = ({ icon: Icon, label, value, fullWidth, sx = {} }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: { xs: 1, sm: 1.25 },
        p: { xs: 1.25, sm: 1.5 },
        borderRadius: `${theme.custom.radius.md}px`,
        backgroundColor: alpha(theme.custom.color.ink, 0.04),
        flex: fullWidth ? '1 1 100%' : '1 1 0',
        minWidth: 0,
        ...sx,
      }}
    >
      <Box
        sx={{
          width: { xs: 34, sm: 38 },
          height: { xs: 34, sm: 38 },
          borderRadius: `${theme.custom.radius.sm}px`,
          backgroundColor: alpha(theme.custom.color.brandPrimary, 0.12),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon sx={{ fontSize: { xs: 17, sm: 19 }, color: theme.custom.color.brandPrimary }} />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
        {label && (
          <Typography
            variant="caption"
            noWrap
            sx={{
              display: 'block',
              fontWeight: 700,
              letterSpacing: 0.6,
              textTransform: 'uppercase',
              fontSize: { xs: '0.625rem', sm: '0.65rem' },
              color: alpha(theme.custom.color.ink, 0.5),
              lineHeight: 1.2,
              textOverflow: 'ellipsis',
              overflow: 'hidden',
            }}
          >
            {label}
          </Typography>
        )}
        <Typography
          variant="body2"
          sx={{
            fontWeight: 700,
            color: theme.custom.color.ink,
            mt: label ? 0.25 : 0,
            wordBreak: 'break-word',
            fontSize: { xs: '0.8125rem', sm: '0.875rem' },
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: fullWidth ? 3 : 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
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
  country,
  countryname,
  countryLabels,
  categories: propCategories,
  category,
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
  // The document titles a DOCUMENTS listing names (server/config/documentTypes.js).
  // These listings publish no photo, so this is what says what was lost.
  DocumentTypes,
  // And the name written on the document, in both scripts - what its owner
  // recognises it by, and what a searcher types in.
  documentOwnerName,
  // Person details when category is Person
  personName,
  personSex,
  // API transformation fields
  foundLostLabel,
  // Refetch function
  refetchPost
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { usernameId, isAuthenticated, role } = useAuth();
  const { t, currentLanguage } = useTranslation();

  const isAdmin = role === 'admin' && isAuthenticated;
  const canEdit = (user === usernameId || isAdmin);
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

  // Arriving from a social-publish notification ("your listing is live on our
  // Facebook page") lands on the reach section rather than at the top of the
  // page - that alert exists to answer "and how is it doing?".
  const reachSection = useSectionDeepLink(SOCIAL_REACH_SECTION);

  // Fetch comments total count (synced from site + Facebook + Instagram)
  const { data: commentsData } = useGetPostCommentsQuery(
    { postId: _id, page: 1, pageSize: 20 },
    { skip: !_id }
  );

  const summarizedSocialStats = useMemo(
    () => summarizeSocialStats({ social, socialStats }),
    [social, socialStats]
  );

  const combineCounts = useCallback((a, b) => (a === null && b === null ? null : (a || 0) + (b || 0)), []);

  const viewsCount = useMemo(() => {
    const total = readTotalViews({ views, social, socialStats });
    return total !== null ? total : 0;
  }, [views, social, socialStats]);

  const reactionsCount = useMemo(() => {
    const combined = combineCounts(
      summarizedSocialStats.facebook.reactions,
      summarizedSocialStats.instagram.likes
    );
    return combined !== null ? combined : 0;
  }, [summarizedSocialStats, combineCounts]);

  const commentsCount = useMemo(() => {
    if (typeof commentsData?.total === 'number') {
      return commentsData.total;
    }
    const socialComments = combineCounts(
      summarizedSocialStats.facebook.comments,
      summarizedSocialStats.instagram.comments
    );
    return socialComments !== null ? socialComments : 0;
  }, [commentsData, summarizedSocialStats, combineCounts]);

  const statsBarItems = useMemo(() => [
    { key: 'views', label: t('views'), value: viewsCount },
    { key: 'reactions', label: t('reactions'), value: reactionsCount },
    { key: 'comments', label: t('comments'), value: commentsCount },
  ], [viewsCount, reactionsCount, commentsCount, t]);

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

  // Raw relative time, with no "Posted" prefix - "postedTimeAgo" (the
  // translation key) wraps it into the full sentence at render time, since
  // this tile has no separate label row like City/Country's.
  const postedTimeAgo = useMemo(() => {
    return formatDistanceToNow(new Date(createdAt), {
      addSuffix: true,
      locale
    });
  }, [createdAt, locale]);

  const isDarkMode = theme.palette.mode === 'dark';

  // Memoized categories array computation - support both new Categories array and legacy Category
  const categories = useMemo(() => {
    const cats = [];

    // First priority: Use the Categories array from API aggregation (new format) or propCategories
    const sourceCategories = (Categories && Array.isArray(Categories) && Categories.length > 0)
      ? Categories
      : (propCategories && Array.isArray(propCategories) && propCategories.length > 0 ? propCategories : null);

    if (sourceCategories) {
      sourceCategories.forEach(cat => {
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
  }, [Categories, propCategories, Category, categoryname]);

  // The document titles this listing names, in the reader's language. Empty
  // for every listing that is not about documents.
  const documentTypeNames = useMemo(() => (
    (Array.isArray(DocumentTypes) ? DocumentTypes : [])
      .filter((documentType) => documentType && (documentType.labels || documentType.code))
      .map((documentType) => (
        documentType.labels?.[currentLanguage] || documentType.labels?.en || documentType.code
      ))
  ), [DocumentTypes, currentLanguage]);

  // Both spellings of the name on the document, in the order the reader is
  // most likely to read them: their own language first.
  const documentOwnerNames = useMemo(() => {
    const ar = (documentOwnerName?.ar || '').trim();
    const latin = (documentOwnerName?.latin || '').trim();
    const ordered = currentLanguage === 'ar' ? [ar, latin] : [latin, ar];
    return ordered.filter(Boolean);
  }, [documentOwnerName, currentLanguage]);

  // Person names in Arabic / Latin
  const personNames = useMemo(() => {
    const ar = (personName?.ar || '').trim();
    const latin = (personName?.latin || '').trim();
    const ordered = currentLanguage === 'ar' ? [ar, latin] : [latin, ar];
    return ordered.filter(Boolean);
  }, [personName, currentLanguage]);

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

  // The on-image category badge(s), one per category, tone taken from each
  // category's own color.
  const categoryBadges = useMemo(() => {
    return categories.map((cat, index) => ({
      code: cat.code || index,
      label: categoryNames[index],
      tone: { main: categoryStyles[index]?.main || theme.custom.color.brandPrimary },
    }));
  }, [categories, categoryNames, categoryStyles, theme.custom.color.brandPrimary]);

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
    if (Floptions && (!Array.isArray(Floptions) || Floptions.length > 0)) {
      let flOption = Array.isArray(Floptions) ? Floptions[0] : Floptions;
      if (flOption && flOption.code) {
        foundLostValue = flOption.code;
        if (flOption.code === 'FOUND') {
          displayLabel = t('found');
        } else if (flOption.code === 'LOST') {
          displayLabel = t('lost');
        }
      }
    }

    // Priority 2: Use foundLost as fallback (could be ObjectId or object)
    if (!foundLostValue && foundLost) {
      if (typeof foundLost === 'string') {
        if (foundLost.length !== 24) {
          const code = foundLost.toUpperCase();
          if (code === 'FOUND' || code === 'LOST') {
            foundLostValue = code;
            displayLabel = code === 'FOUND' ? t('found') : t('lost');
          }
        }
      } else if (foundLost.code) {
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
      if (titleLabels && titleLabels[currentLanguage]) {
        const titleText = titleLabels[currentLanguage].toLowerCase();
        if (titleText.includes('lost') || titleText.includes('perdu') || titleText.includes('مفقود') || titleText.includes('فقدان')) {
          foundLostValue = "LOST";
          displayLabel = t('lost');
        } else if (titleText.includes('found') || titleText.includes('trouvé') || titleText.includes('موجود') || titleText.includes('عثر')) {
          foundLostValue = "FOUND";
          displayLabel = t('found');
        }
      }

      // If still no value, check description
      if (!foundLostValue && description) {
        const desc = description.toLowerCase();
        if (desc.includes('lost') || desc.includes('perdu') || desc.includes('مفقود') || desc.includes('فقدان')) {
          foundLostValue = "LOST";
          displayLabel = t('lost');
        } else if (desc.includes('found') || desc.includes('trouvé') || desc.includes('موجود') || desc.includes('عثر')) {
          foundLostValue = "FOUND";
          displayLabel = t('found');
        }
      }

      // If still no value, check if we have a foundLostLabel from the API transformation
      if (!foundLostValue && foundLostLabel) {
        const label = foundLostLabel.toLowerCase();
        if (label.includes('lost') || label.includes('perdu') || label.includes('مفقود') || label.includes('فقدان')) {
          foundLostValue = "LOST";
          displayLabel = t('lost');
        } else if (label.includes('found') || label.includes('trouvé') || label.includes('موجود') || label.includes('عثر')) {
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

  // Memoized category icon+label data for when there's no image - support multiple categories
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
        code: cat.code,
        label: categoryNames[index]
      };
    }).filter(Boolean); // Remove null entries
  }, [image, categories, categoryStyles, categoryNames]);

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

  const exactDateValue = useMemo(() => {
    return mainDate && String(mainDate).trim()
      ? formatDisplayDate(String(mainDate), currentLanguage)
      : null;
  }, [mainDate, currentLanguage]);

  const exactDateLabel = useMemo(() => {
    if (foundLostStatus.isFound) return t('dateFoundLabel');
    if (foundLostStatus.isLost) return t('dateLostLabel');
    return t('exactDate');
  }, [foundLostStatus, t]);

  // No-image icon backdrop: same per-category tint as the Posts list card,
  // bumped up from the badge's 0.12/0.2 ratio (too faint stretched across
  // the whole photo box) so it actually reads as color. Blended across every
  // category on a multi-category post - a linear-gradient in reading
  // direction, so it runs start-to-end the same way the icons row itself
  // lays out (icons render in `categories` order inside a flex row that
  // already reverses under `direction: rtl`, so mirroring the gradient's
  // direction the same way keeps each stop under its own icon instead of
  // just reversing the ramp).
  const categoryTints = categoryStyles.map(cs => alpha(cs.main || theme.custom.color.brandPrimary, isDarkMode ? 0.32 : 0.22));
  const noImageBackground = categoryTints.length > 1
    ? `linear-gradient(${currentLanguage === 'ar' ? 'to left' : 'to right'}, ${categoryTints.join(', ')})`
    : categoryTints[0];

  const primaryBreadcrumbCategory = useMemo(() => {
    if (categoryBadges && categoryBadges.length > 0) {
      const b = categoryBadges[0];
      return { label: b.label, param: (b.code || '').toLowerCase() };
    }
    if (categoryname) {
      return { label: categoryname, param: categoryname.toLowerCase() };
    }
    return null;
  }, [categoryBadges, categoryname]);

  const breadcrumbCityParam = useMemo(() => {
    if (city && typeof city === 'object') {
      return (city.code || city._id || '').toLowerCase();
    }
    if (typeof city === 'string' && city.trim()) {
      return city.trim().toLowerCase();
    }
    return '';
  }, [city]);

  const postDisplayTitle = useMemo(() => {
    const rawTitle = (titleLabels && titleLabels[currentLanguage]) || title;
    if (rawTitle && rawTitle.trim()) return rawTitle.trim();
    if (primaryBreadcrumbCategory) return `${foundLostStatus.statusText}: ${primaryBreadcrumbCategory.label}`;
    return foundLostStatus.statusText || t('post');
  }, [titleLabels, currentLanguage, title, primaryBreadcrumbCategory, foundLostStatus.statusText, t]);

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
      {/* Contextual Breadcrumb Navigation */}
      <Box component="nav" aria-label="breadcrumb" sx={{ mb: { xs: 2, md: 3 } }}>
        <Breadcrumbs
          separator={
            currentLanguage === 'ar' ? (
              <NavigateBeforeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            ) : (
              <NavigateNextIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            )
          }
          sx={{
            fontSize: '0.875rem',
            '& .MuiBreadcrumbs-li': {
              display: 'inline-flex',
              alignItems: 'center',
            },
          }}
        >
          <MuiLink
            component={RouterLink}
            to="/"
            underline="hover"
            sx={{
              color: 'text.secondary',
              fontWeight: 500,
              '&:hover': { color: theme.custom.color.brandPrimary },
            }}
          >
            {t('home') || (currentLanguage === 'ar' ? 'الرئيسية' : 'Home')}
          </MuiLink>

          <MuiLink
            component={RouterLink}
            to="/dash/posts"
            underline="hover"
            sx={{
              color: 'text.secondary',
              fontWeight: 500,
              '&:hover': { color: theme.custom.color.brandPrimary },
            }}
          >
            {t('posts') || (currentLanguage === 'ar' ? 'المفقودات والموجودات' : 'Posts')}
          </MuiLink>

          {primaryBreadcrumbCategory && (
            <MuiLink
              component={RouterLink}
              to={`/dash/posts?category=${encodeURIComponent(primaryBreadcrumbCategory.param)}`}
              underline="hover"
              sx={{
                color: 'text.secondary',
                fontWeight: 500,
                '&:hover': { color: theme.custom.color.brandPrimary },
              }}
            >
              {primaryBreadcrumbCategory.label}
            </MuiLink>
          )}

          {displayCityName && (
            <MuiLink
              component={RouterLink}
              to={`/dash/posts?city=${encodeURIComponent(breadcrumbCityParam || displayCityName)}`}
              underline="hover"
              sx={{
                color: 'text.secondary',
                fontWeight: 500,
                '&:hover': { color: theme.custom.color.brandPrimary },
              }}
            >
              {displayCityName}
            </MuiLink>
          )}

          <Typography
            color="text.primary"
            sx={{
              fontWeight: 700,
              fontSize: '0.875rem',
              maxWidth: { xs: 180, sm: 260, md: 360 },
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {postDisplayTitle}
          </Typography>
        </Breadcrumbs>
      </Box>

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
              background: image ? 'transparent' : noImageBackground,
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
              {image && <CategoryTags items={categoryBadges} />}

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
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: { xs: 2, sm: 3 },
                    width: '100%',
                    height: { xs: 300, sm: 400, md: 500 },
                    boxSizing: 'border-box',
                    zIndex: 1,
                  }}
                >
                  <CategoryBentoPod items={categoryIconsData} />
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
              {/* Info grid — the single-value facts (when posted, where, when
                  lost/found, how many people looked) as tinted tiles instead of a
                  loose row of icon+text pairs or chips. Category now shows as an
                  on-image badge above, in the spot "posted" used to occupy — this
                  grid takes "posted" in exchange, styled like every other fact
                  here. Mirrors mobile PostDetailScreen.js's InfoTile grid (Phase 14). */}
              {/* Info grid — single-value facts:
                  1. Date posted & Exact date (Posted on / Lost on / Found on) in 2-column grid view
                  2. Country & City in 2-column grid view (+ exact location full width below if available)
                  3. Views, Reactions, and Comments stats bar matching Posts list cards */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
                {/* Dates: Date posted & Exact date — stacked one under another on mobile, 2-column grid on desktop */}
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: exactDateValue ? 'repeat(2, 1fr)' : '1fr' },
                    gap: 1.5,
                    width: '100%',
                  }}
                >
                  <InfoTile icon={TimeIcon} label={t('posted')} value={postedTimeAgo} />
                  {exactDateValue && (
                    <InfoTile
                      icon={CalendarIcon}
                      label={exactDateLabel}
                      value={exactDateValue}
                    />
                  )}
                </Box>

                {/* Locations: Country & City in grid view */}
                {(countryDisplayName || displayCityName) && (
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: (countryDisplayName && displayCityName) ? 'repeat(2, 1fr)' : '1fr',
                      gap: 1.5,
                      width: '100%',
                    }}
                  >
                    {countryDisplayName && (
                      <InfoTile icon={CountryIcon} label={t('country')} value={countryDisplayName} />
                    )}
                    {displayCityName && (
                      <InfoTile icon={CityIcon} label={t('city')} value={displayCityName} />
                    )}
                  </Box>
                )}

                {/* Location address — full width for free-text exact location */}
                {metaLocationLabel && (
                  <InfoTile icon={LocationIcon} label={t('location')} value={metaLocationLabel} fullWidth />
                )}

                {/* Engagement metrics: Views, Reactions, Comments stats bar matching Posts list cards */}
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    borderRadius: `${theme.custom.radius.md}px`,
                    backgroundColor: alpha(theme.custom.color.ink, 0.04),
                    padding: { xs: '10px 4px', sm: '14px 6px' },
                    width: '100%',
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
                          textTransform: 'capitalize',
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
              </Box>

              {/* The documents this listing is about. It sits above the
                  description, and above where a photo would be discussed,
                  because on these listings it is the only thing that says
                  what was lost - they carry no photo by design. */}
              {documentTypeNames.length > 0 && (
                <Box
                  sx={{
                    mb: 3,
                    p: { xs: 1.75, md: 2.25 },
                    borderRadius: `${theme.custom.radius.md}px`,
                    backgroundColor: alpha(theme.custom.color.brandPrimary, isDarkMode ? 0.16 : 0.08),
                  }}
                >
                  <SectionHeading icon={DescriptionSectionIcon}>{t('documentTitles')}</SectionHeading>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {documentTypeNames.map((label) => (
                      <Chip
                        key={label}
                        label={label}
                        sx={{
                          borderRadius: `${theme.custom.radius.sm}px`,
                          fontWeight: 600,
                          color: theme.custom.color.brandPrimary,
                          backgroundColor: alpha(theme.custom.color.brandPrimary, isDarkMode ? 0.24 : 0.12),
                        }}
                      />
                    ))}
                  </Box>

                  {documentOwnerNames.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography
                        variant="overline"
                        sx={{ display: 'block', fontWeight: 600, letterSpacing: 1, color: 'text.secondary' }}
                      >
                        {t('documentOwner')}
                      </Typography>
                      {documentOwnerNames.map((name) => (
                        <Typography key={name} variant="body1" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                          {name}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Box>
              )}

              {/* Person Details */}
              {(personNames.length > 0 || personSex) && (
                <Box
                  sx={{
                    mb: 3,
                    p: { xs: 2, md: 2.5 },
                    borderRadius: `${theme.custom.radius.md}px`,
                    border: `1px solid ${alpha(theme.custom.color.brandPrimary, theme.palette.mode === 'dark' ? 0.3 : 0.2)}`,
                    backgroundColor: alpha(theme.custom.color.brandPrimary, theme.palette.mode === 'dark' ? 0.08 : 0.03),
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: theme.palette.text.primary,
                      mb: 1.5,
                      fontSize: { xs: '1.05rem', md: '1.15rem' },
                    }}
                  >
                    {t('personSectionTitle')}
                  </Typography>

                  {personNames.length > 0 && (
                    <Box sx={{ mb: personSex ? 1.5 : 0 }}>
                      <Typography
                        variant="overline"
                        sx={{ display: 'block', fontWeight: 600, letterSpacing: 1, color: 'text.secondary' }}
                      >
                        {t('personName')}
                      </Typography>
                      {personNames.map((name) => (
                        <Typography key={name} variant="body1" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                          {name}
                        </Typography>
                      ))}
                    </Box>
                  )}

                  {personSex && (
                    <Box>
                      <Typography
                        variant="overline"
                        sx={{ display: 'block', fontWeight: 600, letterSpacing: 1, color: 'text.secondary' }}
                      >
                        {t('personSex')}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                        {personSex === 'male' ? t('male') : t('female')}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}

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

              {/* Reach on the Pages this listing was mirrored to. Also the
                  destination of the "your listing is on our Facebook page"
                  notification, which links here with ?section=social-reach -
                  hence the deep-link ref and the brief arrival highlight. */}
              {(hasSocialReach({ social, socialStats }) || isAdmin) && (
                <Box
                  ref={reachSection.ref}
                  sx={{
                    mt: 3,
                    borderRadius: `${theme.custom.radius.lg}px`,
                    transition: 'box-shadow 0.4s ease',
                    boxShadow: reachSection.isHighlighted
                      ? `0 0 0 3px ${alpha(theme.custom.color.brandPrimary, 0.45)}`
                      : 'none',
                  }}
                >
                  <SocialReach
                    post={{ _id, social, socialStats }}
                    postId={_id}
                    isAdmin={isAdmin}
                    onUpdateSuccess={refetchPost}
                  />
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

      {/* Related Posts — renders 4-6 crawlable HTML internal links to sibling posts */}
      <RelatedPosts
        currentPost={{
          _id,
          categories: Categories || categories,
          category: Category || category,
          categoryname,
          city,
          cityName,
          cityLabels,
          country,
          countryname,
          countryLabels,
          foundLost,
          Floptions,
          status,
        }}
      />

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
