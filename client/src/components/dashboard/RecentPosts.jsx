import { Box, Typography, useTheme, alpha } from "@mui/material";
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

// Poster-style preview card for the dashboard's Recent Founds/Losts panels —
// same DNA as the "Recently posted near you" hero card on WelcomePage.jsx
// (FannedCard): full-bleed image or solid category-color fill, gradient scrim
// for legibility, category label + status tag overlaid top, location + date
// overlaid bottom. Laid out here in a plain responsive grid (see Recent.jsx)
// rather than the hero's fanned stack — only the per-card look is reused.
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

  // Text sits on top of the image (gradient scrim) or the solid category
  // fill, so it always needs to read as light — same contrast logic as
  // WelcomePage.jsx's FannedCard.
  const textColor = finalImageUrl ? "#FFFFFF" : theme.palette.getContrastText(categoryStyle.main);

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
        position: "relative",
        width: "100%",
        aspectRatio: "3 / 4",
        borderRadius: `${theme.custom.radius.lg}px`,
        overflow: "hidden",
        cursor: "pointer",
        outline: "none",
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: theme.custom.elevation.e1,
        backgroundColor: finalImageUrl ? theme.custom.color.surfaceBase : categoryStyle.main,
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        "&:hover": { transform: "translateY(-4px)", boxShadow: theme.custom.elevation.e2 },
        "&:focus-visible": { boxShadow: `0 0 0 2px ${tone.main}` },
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
        FallbackIcon && (
          <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FallbackIcon sx={{ fontSize: 48, color: textColor, opacity: 0.9 }} />
          </Box>
        )
      )}

      {finalImageUrl && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(to top, ${alpha("#000000", 0.65)} 0%, ${alpha("#000000", 0.05)} 45%, ${alpha("#000000", 0.4)} 100%)`,
          }}
        />
      )}

      {/* Top row: category label + status tag (+ returned, stacked under it) */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          insetInlineStart: 0,
          insetInlineEnd: 0,
          zIndex: 2,
          p: 1.25,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 0.75,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: 800,
            color: textColor,
            lineHeight: 1.2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            flex: "1 1 auto",
            minWidth: 0,
          }}
        >
          {categoryLabel}
        </Typography>

        <Box sx={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.5 }}>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              px: 1,
              py: 0.375,
              borderRadius: `${theme.custom.radius.sm}px`,
              backgroundColor: tone.main,
            }}
          >
            <StatusIcon sx={{ fontSize: 14, color: theme.palette.getContrastText(tone.main) }} />
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

          {returned && (
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                px: 1,
                py: 0.375,
                borderRadius: `${theme.custom.radius.sm}px`,
                backgroundColor: theme.custom.status.found.main,
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 12, color: theme.palette.getContrastText(theme.custom.status.found.main) }} />
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
      </Box>

      {/* Bottom row: location + relative date */}
      <Box
        sx={{
          position: "absolute",
          bottom: 0,
          insetInlineStart: 0,
          insetInlineEnd: 0,
          zIndex: 2,
          p: 1.25,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 0.75,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, minWidth: 0 }}>
          <LocationOnOutlined sx={{ fontSize: 14, color: textColor, opacity: 0.9, flexShrink: 0 }} />
          <Typography
            variant="caption"
            sx={{
              color: textColor,
              fontWeight: 600,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {displayCityName}
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ color: alpha(textColor, 0.85), flexShrink: 0, whiteSpace: "nowrap" }}>
          {created}
        </Typography>
      </Box>
    </Box>
  );
};

export default RecentPosts;
