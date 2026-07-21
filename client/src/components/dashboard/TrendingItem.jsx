import {
  Box,
  Card,
  CardContent,
  Typography,
  useTheme,
  useMediaQuery,
  alpha,
} from "@mui/material";
import {
  AccessTime as TimeIcon,
  ImageNotSupported as NoImageIcon,
  CheckCircle as CheckCircleIcon,
  TaskAltOutlined,
  SearchOffOutlined,
  LocationOnOutlined,
  CategoryOutlined,
  EventOutlined,
  TrendingUpOutlined,
} from "@mui/icons-material";
import { useMemo, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { ar, fr, enUS } from "date-fns/locale";
import { TrendingItemSkeleton } from "../LoadingStates";
import { useTranslation } from "../../utils/translations";
import { getOptimizedImageUrl } from "../../utils/cloudinaryUtils";
import LazyCardMedia from "../LazyCardMedia";
import { getCategoryConfig, getCategoryIcon } from "../../config/categories";
import { useNavigate } from "react-router-dom";
import noImageSvg from "../../img/noimage.svg";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3500";

// Shared chrome for the section — mirrors LeftSide's "Statistics" panel so
// the two halves of the dashboard header read as one paired system.
const SectionPanel = ({ isMobile, children }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: `linear-gradient(135deg, ${alpha(theme.custom.color.surfaceRaised, 0.95)} 0%, ${alpha(theme.custom.color.surfaceRaised, 0.95)} 100%)`,
        backdropFilter: "blur(10px)",
        borderRadius: isMobile ? `${theme.custom.radius.lg}px` : `${theme.custom.radius.xl}px`,
        border: `1px solid ${alpha(theme.custom.color.ink, theme.palette.mode === "dark" ? 0.08 : 0.15)}`,
        padding: isMobile ? "1.5rem" : "2rem",
        boxShadow: theme.custom.elevation.e1,
      }}
    >
      {children}
    </Box>
  );
};

const SectionTitle = ({ isMobile, children }) => {
  const theme = useTheme();
  return (
    <Box mb={isMobile ? 2 : 3} sx={{ textAlign: "center" }}>
      <Typography
        variant="h5"
        fontWeight="700"
        sx={{
          fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
          color: theme.custom.color.ink,
          mb: 1,
        }}
      >
        {children}
      </Typography>
    </Box>
  );
};

const InfoRow = ({ icon: Icon, children }) => {
  const theme = useTheme();
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
      <Icon sx={{ fontSize: 18, color: alpha(theme.custom.color.ink, 0.55), flexShrink: 0 }} />
      <Typography
        variant="body2"
        sx={{
          color: alpha(theme.custom.color.ink, 0.75),
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {children}
      </Typography>
    </Box>
  );
};

const TrendingItem = ({ trend, isLoading }) => {
  const trendData = Array.isArray(trend) ? trend[0] : trend;

  const {
    _id,
    categoryname,
    floptionName,
    image,
    createdAt,
    mainDate,
    city,
    cityLabels,
    cityName,
    Floptions,
    Category,
    Categories,
    exactLocation,
    returned,
  } = trendData || {};

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { t, currentLanguage } = useTranslation();
  const navigate = useNavigate();

  const hasValidMainDate = (date) => {
    if (!date || typeof date !== "string") return false;
    const trimmed = date.trim();
    return trimmed !== "" && trimmed !== "null" && trimmed !== "undefined";
  };

  const getLocale = () => {
    switch (currentLanguage) {
      case "ar": return ar;
      case "fr": return fr;
      default: return enUS;
    }
  };

  const created = useMemo(() => {
    try {
      if (!createdAt) return t("unknownTime") || "Unknown time";
      const date = new Date(createdAt);
      if (isNaN(date.getTime())) return t("invalidDate") || "Invalid date";
      return formatDistanceToNow(date, { addSuffix: true, locale: getLocale() });
    } catch (error) {
      console.warn("Date formatting error:", error);
      return t("dateError") || "Date error";
    }
  }, [createdAt, currentLanguage, t]);

  const getCityFromLocation = useCallback((location) => {
    if (!location) return t("unknownLocation");
    const parts = location.split(",");
    const cleanCity = parts[0].trim().split("(")[0].trim();
    return cleanCity.replace(/\d+/g, "").trim();
  }, [t]);

  const displayCityName = useMemo(() => {
    if (cityLabels && typeof cityLabels === "object") {
      const cityLabel = cityLabels[currentLanguage] || cityLabels.en;
      if (cityLabel && cityLabel.trim()) return cityLabel.trim();
    }
    if (cityName && typeof cityName === "string" && cityName.trim()) return cityName.trim();
    if (city && typeof city === "string" && city.trim()) return city.trim();
    if (exactLocation) return getCityFromLocation(exactLocation);
    return t("unknownCity") || "Unknown City";
  }, [cityLabels, cityName, city, currentLanguage, exactLocation, getCityFromLocation, t]);

  const categories = useMemo(() => {
    const cats = [];
    if (Categories && Array.isArray(Categories) && Categories.length > 0) {
      Categories.forEach((cat) => {
        if (cat && cat.code) cats.push({ code: cat.code, labels: cat.labels });
      });
    }
    if (cats.length === 0 && Category && Category.code) {
      cats.push({ code: Category.code, labels: Category.labels });
    }
    if (cats.length === 0 && categoryname) {
      cats.push({ code: categoryname, labels: null });
    }
    return cats.length > 0 ? cats : [{ code: "OTHER", labels: null }];
  }, [Categories, Category, categoryname]);

  const categoryNames = useMemo(() => {
    return categories.map((cat) => (cat.labels ? cat.labels[currentLanguage] || cat.labels.en || cat.code : cat.code || t("unknownCategory")));
  }, [categories, currentLanguage, t]);

  const primaryCategoryStyle = useMemo(() => {
    try {
      const config = getCategoryConfig(categories[0]?.code);
      return { main: config.color, background: config.backgroundColor };
    } catch (error) {
      return { main: theme.custom.color.brandPrimary, background: alpha(theme.custom.color.brandPrimary, 0.1) };
    }
  }, [categories, theme]);

  const isFound = useMemo(() => {
    if (Floptions?.code) return Floptions.code === "FOUND";
    if (floptionName) return floptionName.toUpperCase() === "FOUND";
    return true;
  }, [Floptions, floptionName]);

  const tone = isFound ? theme.custom.status.found : theme.custom.status.lost;
  const StatusIcon = isFound ? TaskAltOutlined : SearchOffOutlined;
  const statusLabel = isFound ? t("found") : t("lost");

  const handleViewPost = () => {
    if (_id) navigate(`/dash/posts/${_id}`);
  };

  const finalImageUrl = image ? (image.startsWith("http") ? getOptimizedImageUrl(image, "card") : `${API_BASE_URL}/${image}`) : null;
  const FallbackIcon = useMemo(() => getCategoryIcon(categories[0]?.code), [categories]);

  if (isLoading) {
    return (
      <SectionPanel isMobile={isMobile}>
        <SectionTitle isMobile={isMobile}>{t("trending")}</SectionTitle>
        <TrendingItemSkeleton />
      </SectionPanel>
    );
  }

  if (!trendData || !_id || !categoryname) {
    return (
      <SectionPanel isMobile={isMobile}>
        <SectionTitle isMobile={isMobile}>{t("trending")}</SectionTitle>
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            gap: 1.5,
            p: 4,
            minHeight: 220,
            borderRadius: `${theme.custom.radius.lg}px`,
            border: `1px dashed ${alpha(theme.custom.color.ink, 0.15)}`,
          }}
        >
          <TrendingUpOutlined sx={{ fontSize: 44, color: alpha(theme.custom.color.ink, 0.25) }} />
          <Typography sx={{ fontWeight: 700, color: theme.custom.color.ink }}>
            {t("noTrendingItems")}
          </Typography>
          <Typography variant="body2" sx={{ color: alpha(theme.custom.color.ink, 0.6), maxWidth: 280 }}>
            {t("noTrendingItemsDescription")}
          </Typography>
        </Box>
      </SectionPanel>
    );
  }

  return (
    <SectionPanel isMobile={isMobile}>
      <SectionTitle isMobile={isMobile}>{t("trending")}</SectionTitle>

      <Card
        role="button"
        tabIndex={0}
        onClick={handleViewPost}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleViewPost();
          }
        }}
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          backgroundColor: alpha(tone.main, theme.palette.mode === "dark" ? 0.07 : 0.045),
          borderRadius: `${theme.custom.radius.lg}px`,
          boxShadow: theme.custom.elevation.e1,
          border: `1px solid ${alpha(theme.custom.color.ink, 0.08)}`,
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
            paddingTop: { xs: "75%", sm: "52%" },
            overflow: "hidden",
            backgroundColor: theme.custom.color.surfaceBase,
          }}
        >
          {image && finalImageUrl ? (
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
                backgroundColor: primaryCategoryStyle.background,
              }}
            >
              {FallbackIcon && (
                <FallbackIcon sx={{ fontSize: { xs: 64, sm: 56 }, color: primaryCategoryStyle.main, opacity: 0.85 }} />
              )}
            </Box>
          )}

          {/* Status tag — solid fill, same grammar as the public posts cards */}
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
              py: 0.5,
              borderRadius: `${theme.custom.radius.sm}px`,
              backgroundColor: tone.main,
            }}
          >
            <StatusIcon sx={{ fontSize: 14, color: theme.palette.getContrastText(tone.main) }} />
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                letterSpacing: 0.3,
                textTransform: "uppercase",
                color: theme.palette.getContrastText(tone.main),
                lineHeight: 1,
              }}
            >
              {statusLabel}
            </Typography>
          </Box>

          {/* Date badge */}
          <Box
            sx={{
              position: "absolute",
              top: 8,
              insetInlineEnd: 8,
              zIndex: 2,
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              px: 1,
              py: 0.5,
              borderRadius: `${theme.custom.radius.sm}px`,
              backgroundColor: alpha(theme.custom.color.surfaceRaised, 0.85),
            }}
          >
            <TimeIcon sx={{ fontSize: 14, color: theme.custom.color.ink }} />
            <Typography variant="caption" sx={{ color: theme.custom.color.ink, fontWeight: 600, lineHeight: 1 }}>
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
                py: 0.5,
                borderRadius: `${theme.custom.radius.sm}px`,
                backgroundColor: theme.custom.status.found.main,
                animation: "trendingReturnedPulse 2s ease-in-out infinite",
                "@keyframes trendingReturnedPulse": {
                  "0%, 100%": { opacity: 1 },
                  "50%": { opacity: 0.75 },
                },
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 14, color: theme.palette.getContrastText(theme.custom.status.found.main) }} />
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 0.3,
                  color: theme.palette.getContrastText(theme.custom.status.found.main),
                  lineHeight: 1,
                }}
              >
                {t("returned")}
              </Typography>
            </Box>
          )}

          {/* No-image indicator */}
          {!image && (
            <Box
              sx={{
                position: "absolute",
                bottom: 8,
                insetInlineStart: 8,
                zIndex: 2,
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                px: 1,
                py: 0.5,
                borderRadius: `${theme.custom.radius.sm}px`,
                backgroundColor: alpha(theme.custom.color.surfaceRaised, 0.85),
              }}
            >
              <NoImageIcon sx={{ fontSize: 14, color: alpha(theme.custom.color.ink, 0.6) }} />
              <Typography variant="caption" sx={{ color: alpha(theme.custom.color.ink, 0.7), fontWeight: 600, lineHeight: 1 }}>
                {t("postHasNoImage")}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Content */}
        <CardContent
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 1,
            p: isMobile ? 2 : 2.5,
            "&:last-child": { pb: isMobile ? 2 : 2.5 },
          }}
        >
          <InfoRow icon={LocationOnOutlined}>{displayCityName}</InfoRow>
          <InfoRow icon={CategoryOutlined}>{categoryNames.join(", ")}</InfoRow>
          {hasValidMainDate(mainDate) && <InfoRow icon={EventOutlined}>{mainDate.trim()}</InfoRow>}
        </CardContent>
      </Card>
    </SectionPanel>
  );
};

export default TrendingItem;
