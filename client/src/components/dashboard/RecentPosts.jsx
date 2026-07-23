import { Box, Typography, useTheme, useMediaQuery, alpha } from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  LocationOnOutlined,
  CheckCircle as CheckCircleIcon,
  TaskAltOutlined,
  SearchOffOutlined,
} from "@mui/icons-material";
import { useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { ar, fr, enUS } from "date-fns/locale";
import noImageSvg from "../../img/noimage.svg";
import LazyCardMedia from "../LazyCardMedia";
import { useTranslation } from "../../utils/translations";
import { getOptimizedImageUrl } from "../../utils/cloudinaryUtils";
import { getCategoryConfig, getCategoryIcon } from "../../config/categories";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3500";

// Compact preview card for the dashboard's Recent Founds/Losts panels.
// Same DNA as the canonical post card (TrendingItem.jsx / PublicPostsPage.jsx):
// surfaceRaised + radius.lg + e1->e2 hover lift + status-tone accent bar,
// just denser — one info row instead of three, since this is a glanceable
// preview, not the full post view.
const RecentPosts = ({
  _id,
  type,
  categoryname,
  exactLocation,
  image,
  createdAt,
  cityLabels,
  cityName,
  city,
  Category,
  Categories,
  returned,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const { t, currentLanguage } = useTranslation();

  const getLocale = () => {
    switch (currentLanguage) {
      case "ar": return ar;
      case "fr": return fr;
      default: return enUS;
    }
  };

  const created = useMemo(() => {
    try {
      return formatDistanceToNow(new Date(createdAt), {
        addSuffix: true,
        locale: getLocale(),
      });
    } catch (error) {
      return "";
    }
  }, [createdAt, currentLanguage]);

  const displayCityName = useMemo(() => {
    if (cityLabels && typeof cityLabels === "object") {
      const label = cityLabels[currentLanguage] || cityLabels.en;
      if (label && label.trim()) return label.trim();
    }
    if (cityName && typeof cityName === "string" && cityName.trim()) return cityName.trim();
    if (city && typeof city === "string" && city.trim()) return city.trim();
    if (exactLocation) {
      const firstPart = exactLocation.split(",")[0].split("(")[0].trim();
      return firstPart.replace(/\d+/g, "").trim() || t("unknownLocation");
    }
    return t("unknownLocation");
  }, [cityLabels, cityName, city, exactLocation, currentLanguage, t]);

  const categoryCode = useMemo(() => {
    if (Categories && Array.isArray(Categories) && Categories[0]?.code) return Categories[0].code;
    if (Category?.code) return Category.code;
    return categoryname || "OTHER";
  }, [Categories, Category, categoryname]);

  // Category label as text — only needed for the mobile row layout, which
  // shows a title (mirrors mobile app's RecentPreviewCard) instead of relying
  // on the thumbnail's fallback icon alone.
  const categoryLabel = useMemo(() => {
    const cat = (Categories && Array.isArray(Categories) && Categories[0]) || Category;
    if (cat?.labels) return cat.labels[currentLanguage] || cat.labels.en || cat.code;
    return categoryCode || t("unknownCategory");
  }, [Categories, Category, categoryCode, currentLanguage, t]);

  const categoryStyle = useMemo(() => {
    try {
      const config = getCategoryConfig(categoryCode);
      return { main: config.color, background: config.backgroundColor };
    } catch (error) {
      return {
        main: theme.custom.color.brandPrimary,
        background: alpha(theme.custom.color.brandPrimary, 0.1),
      };
    }
  }, [categoryCode, theme]);

  const FallbackIcon = useMemo(() => getCategoryIcon(categoryCode), [categoryCode]);

  const tone = type === "found" ? theme.custom.status.found : theme.custom.status.lost;
  const StatusIcon = type === "found" ? TaskAltOutlined : SearchOffOutlined;

  const finalImageUrl = image
    ? (image.startsWith("http") ? getOptimizedImageUrl(image, "card") : `${API_BASE_URL}/${image}`)
    : null;

  const handleViewDetails = () => navigate(`/dash/posts/${_id}`);

  // Mobile: a horizontal row card (fixed-width thumbnail + content beside it,
  // stacked one per row) — matches the mobile app's RecentPreviewCard
  // (mobile/src/screens/HomeScreen.js) instead of the desktop's image-on-top
  // card, since squeezing that vertical card into a narrow single column
  // read as small/cramped. Desktop layout below is untouched.
  if (isMobile) {
    return (
      <Box
        role="button"
        tabIndex={0}
        onClick={handleViewDetails}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleViewDetails();
          }
        }}
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "stretch",
          backgroundColor: theme.custom.color.surfaceRaised,
          borderRadius: `${theme.custom.radius.lg}px`,
          boxShadow: theme.custom.elevation.e1,
          border: `1px solid ${theme.palette.divider}`,
          overflow: "hidden",
          cursor: "pointer",
          outline: "none",
          transition: "box-shadow 0.2s ease",
          "&:hover": { boxShadow: theme.custom.elevation.e2 },
          "&:focus-visible": { boxShadow: `0 0 0 2px ${tone.main}` },
        }}
      >
        {/* Thumbnail — fixed width, stretches full row height */}
        <Box
          sx={{
            position: "relative",
            width: 112,
            flexShrink: 0,
            backgroundColor: theme.custom.color.surfaceBase,
          }}
        >
          {finalImageUrl ? (
            <LazyCardMedia
              component="img"
              image={finalImageUrl}
              alt={displayCityName}
              fallback={noImageSvg}
              sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: categoryStyle.background,
              }}
            >
              {FallbackIcon && (
                <FallbackIcon sx={{ fontSize: 32, color: categoryStyle.main, opacity: 0.85 }} />
              )}
            </Box>
          )}
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: 0.5, p: 1.75 }}>
          <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0.5 }}>
            <Box
              component="span"
              sx={{
                alignSelf: "flex-start",
                px: 1.1,
                py: 0.35,
                borderRadius: `${theme.custom.radius.sm}px`,
                backgroundColor: tone.bg,
              }}
            >
              <Typography
                variant="caption"
                sx={{ fontWeight: 700, fontSize: "10px", letterSpacing: 0.3, textTransform: "uppercase", color: tone.main, lineHeight: 1.4 }}
              >
                {t(type)}
              </Typography>
            </Box>
            {returned && (
              <Box
                component="span"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.4,
                  px: 1.1,
                  py: 0.35,
                  borderRadius: `${theme.custom.radius.sm}px`,
                  backgroundColor: theme.custom.status.found.bg,
                }}
              >
                <CheckCircleIcon sx={{ fontSize: 11, color: theme.custom.status.found.main }} />
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 700, fontSize: "10px", textTransform: "uppercase", color: theme.custom.status.found.main, lineHeight: 1.4 }}
                >
                  {t("returned")}
                </Typography>
              </Box>
            )}
          </Box>

          <Typography
            variant="body2"
            sx={{
              fontWeight: 700,
              color: theme.custom.color.ink,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {categoryLabel}
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, minWidth: 0 }}>
            <LocationOnOutlined sx={{ fontSize: 14, color: alpha(theme.custom.color.ink, 0.55), flexShrink: 0 }} />
            <Typography
              variant="caption"
              sx={{ color: alpha(theme.custom.color.ink, 0.7), overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            >
              {displayCityName}
            </Typography>
          </Box>

          <Typography variant="caption" sx={{ color: alpha(theme.custom.color.ink, 0.6) }}>
            {created}
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={handleViewDetails}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleViewDetails();
        }
      }}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: theme.custom.color.surfaceRaised,
        borderRadius: `${theme.custom.radius.lg}px`,
        boxShadow: theme.custom.elevation.e1,
        border: `1px solid ${theme.palette.divider}`,
        borderInlineStart: `6px solid ${tone.main}`,
        overflow: "hidden",
        cursor: "pointer",
        outline: "none",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        "&:hover": { transform: "translateY(-4px)", boxShadow: theme.custom.elevation.e2 },
        "&:focus-visible": { boxShadow: `0 0 0 2px ${tone.main}` },
      }}
    >
      {/* Media */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          paddingTop: "75%",
          overflow: "hidden",
          backgroundColor: theme.custom.color.surfaceBase,
        }}
      >
        {finalImageUrl ? (
          <LazyCardMedia
            component="img"
            image={finalImageUrl}
            alt={displayCityName}
            fallback={noImageSvg}
            sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: categoryStyle.background,
            }}
          >
            {FallbackIcon && (
              <FallbackIcon sx={{ fontSize: 40, color: categoryStyle.main, opacity: 0.85 }} />
            )}
          </Box>
        )}

        {/* Status tag */}
        <Box
          sx={{
            position: "absolute",
            top: 8,
            insetInlineStart: 8,
            zIndex: 2,
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            px: 1,
            py: 0.375,
            borderRadius: `${theme.custom.radius.sm}px`,
            backgroundColor: tone.main,
          }}
        >
          <StatusIcon sx={{ fontSize: 12, color: theme.palette.getContrastText(tone.main) }} />
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              fontSize: "10px",
              letterSpacing: 0.3,
              textTransform: "uppercase",
              color: theme.palette.getContrastText(tone.main),
              lineHeight: 1,
            }}
          >
            {t(type)}
          </Typography>
        </Box>

        {/* Date badge */}
        <Box
          sx={{
            position: "absolute",
            top: 8,
            insetInlineEnd: 8,
            zIndex: 2,
            px: 1,
            py: 0.375,
            borderRadius: `${theme.custom.radius.sm}px`,
            backgroundColor: alpha(theme.custom.color.surfaceRaised, 0.85),
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: theme.custom.color.ink, fontWeight: 600, fontSize: "10px", lineHeight: 1 }}
          >
            {created}
          </Typography>
        </Box>

        {/* Returned badge */}
        {returned && (
          <Box
            sx={{
              position: "absolute",
              bottom: 8,
              insetInlineEnd: 8,
              zIndex: 2,
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              px: 1,
              py: 0.375,
              borderRadius: `${theme.custom.radius.sm}px`,
              backgroundColor: theme.custom.status.found.main,
            }}
          >
            <CheckCircleIcon
              sx={{ fontSize: 12, color: theme.palette.getContrastText(theme.custom.status.found.main) }}
            />
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                fontSize: "10px",
                textTransform: "uppercase",
                color: theme.palette.getContrastText(theme.custom.status.found.main),
                lineHeight: 1,
              }}
            >
              {t("returned")}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Content */}
      <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center", p: 1.75, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0, width: "100%" }}>
          <LocationOnOutlined sx={{ fontSize: 16, color: alpha(theme.custom.color.ink, 0.55), flexShrink: 0 }} />
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: theme.custom.color.ink,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {displayCityName}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default RecentPosts;
