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

// Frosted circle icon + label pill for no-image states (same as Post.js)
const CategoryIconLabel = ({ icon: Icon, label, color, iconSize, circleSize }) => {
  const theme = useTheme();
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.75 }}>
      <Box
        sx={{
          width: circleSize,
          height: circleSize,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: alpha(theme.custom.color.surfaceRaised, 0.55),
          backdropFilter: "blur(6px)",
        }}
      >
        <Icon sx={{ fontSize: iconSize, color, opacity: 0.9 }} />
      </Box>
      <Box
        sx={{
          display: { xs: "none", sm: "inline-flex" },
          alignItems: "center",
          backgroundColor: alpha(theme.custom.color.surfaceRaised, 0.55),
          backdropFilter: "blur(6px)",
          color,
          fontWeight: 800,
          fontSize: { xs: "11px", sm: "12px" },
          lineHeight: 1,
          borderRadius: `${theme.custom.radius.sm}px`,
          px: { xs: 1, sm: 1.25 },
          py: { xs: 0.5, sm: 0.5 },
          textAlign: "center",
          maxWidth: 120,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {label}
      </Box>
    </Box>
  );
};

// Poster-style preview card for the dashboard's Recent Founds/Losts panels.
// Matches Post.js category styling, displays all categories, with FOUND/LOST badge.
const RecentPosts = (props) => {
  const {
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
    categories: categoriesProp,
    returned,
    fillHeight,
    foundLost,
    Floptions,
  } = props;

  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
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

  // Compute all categories - supporting both Categories array and fallback Category / categoryname
  const categories = useMemo(() => {
    const cats = [];
    const sourceCats = (Categories && Array.isArray(Categories) && Categories.length > 0)
      ? Categories
      : (categoriesProp && Array.isArray(categoriesProp) && categoriesProp.length > 0)
        ? categoriesProp
        : null;

    if (sourceCats) {
      sourceCats.forEach((cat) => {
        if (cat && cat.code) {
          cats.push({ code: cat.code, labels: cat.labels, _id: cat._id });
        }
      });
    }
    if (cats.length === 0 && Category && Category.code) {
      cats.push({ code: Category.code, labels: Category.labels, _id: Category._id });
    }
    if (cats.length === 0 && categoryname) {
      cats.push({ code: categoryname, labels: null, _id: null });
    }
    return cats.length > 0 ? cats : [{ code: "OTHER", labels: null, _id: null }];
  }, [Categories, categoriesProp, Category, categoryname]);

  const categoryNames = useMemo(() => {
    return categories.map((cat) => {
      if (cat.labels) {
        return cat.labels[currentLanguage] || cat.labels.en || cat.code;
      }
      return cat.code || t("unknownCategory");
    });
  }, [categories, currentLanguage, t]);

  const categoryStyles = useMemo(() => {
    return categories.map((cat) => {
      try {
        const config = getCategoryConfig(cat.code);
        return { main: config.color, background: config.backgroundColor };
      } catch (error) {
        return {
          main: theme.custom.color.brandPrimary,
          background: alpha(theme.custom.color.brandPrimary, 0.1),
        };
      }
    });
  }, [categories, theme]);

  const finalImageUrl = image
    ? (image.startsWith("http") ? getOptimizedImageUrl(image, "card") : `${API_BASE_URL}/${image}`)
    : null;

  // Category icons data for no-image cards (all categories up to 4)
  const categoryIconsData = useMemo(() => {
    if (finalImageUrl) return [];
    if (!categories || categories.length === 0) return [];

    return categories.map((cat, index) => {
      const IconComponent = getCategoryIcon(cat.code);
      const catStyle = categoryStyles[index];
      if (!IconComponent) return null;
      return {
        IconComponent,
        style: catStyle,
        code: cat.code,
        label: categoryNames[index],
      };
    }).filter(Boolean);
  }, [finalImageUrl, categories, categoryStyles, categoryNames]);

  // Compute status badge (FOUND / LOST)
  const foundLostStatus = useMemo(() => {
    let foundLostValue = null;
    let foundLostLabel = null;
    let foundLostColor = null;

    if (Floptions && Floptions.length > 0 && Floptions[0]?.code) {
      const flOption = Floptions[0];
      foundLostValue = flOption.code;
      foundLostLabel = (flOption.labels && (flOption.labels[currentLanguage] || flOption.labels.en)) ||
                      (flOption.code === "FOUND" ? t("found") : t("lost"));
      foundLostColor = flOption.color ||
                      (flOption.code === "FOUND" ? theme.custom.status.found.main : theme.custom.status.lost.main);
    }

    if (!foundLostValue && type) {
      const code = type.toUpperCase();
      if (code === "FOUND" || code === "LOST") {
        foundLostValue = code;
        foundLostLabel = code === "FOUND" ? t("found") : t("lost");
        foundLostColor = code === "FOUND" ? theme.custom.status.found.main : theme.custom.status.lost.main;
      }
    }

    if (!foundLostValue && foundLost) {
      if (typeof foundLost === "string") {
        const code = foundLost.toUpperCase();
        if (code === "FOUND" || code === "LOST") {
          foundLostValue = code;
          foundLostLabel = code === "FOUND" ? t("found") : t("lost");
          foundLostColor = code === "FOUND" ? theme.custom.status.found.main : theme.custom.status.lost.main;
        }
      } else if (foundLost.code) {
        foundLostValue = foundLost.code;
        foundLostLabel = (foundLost.labels && (foundLost.labels[currentLanguage] || foundLost.labels.en)) ||
                        (foundLost.code === "FOUND" ? t("found") : t("lost"));
        foundLostColor = foundLost.color ||
                        (foundLost.code === "FOUND" ? theme.custom.status.found.main : theme.custom.status.lost.main);
      }
    }

    if (!foundLostValue) {
      foundLostValue = "FOUND";
      foundLostLabel = t("found");
      foundLostColor = theme.custom.status.found.main;
    }

    const isFound = foundLostValue === "FOUND";
    const statusColor = foundLostColor;
    const statusText = t(isFound ? "found" : "lost");

    return { isFound, statusColor, statusText };
  }, [Floptions, type, foundLost, t, theme]);

  const tone = { main: foundLostStatus.statusColor };
  const StatusIcon = foundLostStatus.isFound ? TaskAltOutlined : SearchOffOutlined;

  // Background tint when no image is present (matching Post.js)
  const categoryTints = useMemo(
    () => categoryStyles.map((cs) => alpha(cs.main, isDark ? 0.32 : 0.22)),
    [categoryStyles, isDark]
  );
  const noImageBackground = useMemo(() => {
    if (categoryTints.length > 1) {
      return `linear-gradient(${currentLanguage === "ar" ? "to left" : "to right"}, ${categoryTints.join(", ")})`;
    }
    return categoryTints[0];
  }, [categoryTints, currentLanguage]);

  const handleViewDetails = () => navigate(`/dash/posts/${_id}`);
  const textColor = "#FFFFFF";

  return (
    <Box
      data-reveal-item=""
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
        height: fillHeight ? "100%" : undefined,
        aspectRatio: fillHeight ? undefined : { xs: "3 / 4", md: "4 / 4.5" },
        borderRadius: `${theme.custom.radius.lg}px`,
        overflow: "hidden",
        cursor: "pointer",
        outline: "none",
        boxShadow: "none",
        backgroundColor: finalImageUrl ? theme.custom.color.surfaceBase : undefined,
        background: finalImageUrl ? undefined : noImageBackground,
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        "&:hover": { transform: "translateY(-4px)" },
        "&:focus-visible": { boxShadow: `0 0 0 2px ${tone.main}` },
      }}
    >
      {finalImageUrl ? (
        <>
          <LazyCardMedia
            component="img"
            image={finalImageUrl}
            alt={displayCityName}
            fallback={noImageSvg}
            sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(to top, ${alpha("#000000", 0.7)} 0%, ${alpha("#000000", 0.05)} 45%, ${alpha("#000000", 0.45)} 100%)`,
            }}
          />
        </>
      ) : (
        /* No-image state: displays all category icons and labels up to 4 like Post.js */
        categoryIconsData.length > 0 && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: categoryIconsData.length === 1 ? 0 : { xs: 1, sm: 1.5 },
              flexWrap: "wrap",
              padding: 2,
              width: "100%",
              height: "100%",
            }}
          >
            {categoryIconsData.slice(0, 4).map((iconData, idx) => (
              <CategoryIconLabel
                key={iconData.code || idx}
                icon={iconData.IconComponent}
                label={iconData.label}
                color={iconData.style?.main || theme.palette.text.secondary}
                iconSize={categoryIconsData.length === 1 ? "48px" : "28px"}
                circleSize={categoryIconsData.length === 1 ? 72 : 46}
              />
            ))}
          </Box>
        )
      )}

      {/* Top row: status tag (FOUND/LOST) at start (top left), category badges at end (top right) */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          insetInlineStart: 0,
          insetInlineEnd: 0,
          zIndex: 2,
          p: { xs: 1.25, md: 1.5 },
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: { xs: 0.75, md: 1 },
        }}
      >
        {/* Status badge: FOUND / LOST (+ resolved if returned) */}
        <Box sx={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 0.5 }}>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: { xs: 0.5, md: 0.625 },
              px: { xs: 1, md: 1.25 },
              py: { xs: 0.375, md: 0.5 },
              borderRadius: `${theme.custom.radius.sm}px`,
              backgroundColor: tone.main,
            }}
          >
            <StatusIcon sx={{ fontSize: { xs: 14, md: 16 }, color: theme.palette.getContrastText(tone.main) }} />
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                fontSize: { xs: "11px", md: "12px" },
                letterSpacing: { xs: 0.3, md: 0.4 },
                textTransform: "uppercase",
                color: theme.palette.getContrastText(tone.main),
                lineHeight: 1,
              }}
            >
              {t(foundLostStatus.isFound ? "found" : "lost")}
            </Typography>
          </Box>

          {returned && (
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: { xs: 0.5, md: 0.625 },
                px: { xs: 1, md: 1.25 },
                py: { xs: 0.375, md: 0.5 },
                borderRadius: `${theme.custom.radius.sm}px`,
                backgroundColor: theme.custom.status.found.main,
              }}
            >
              <CheckCircleIcon sx={{ fontSize: { xs: 12, md: 14 }, color: theme.palette.getContrastText(theme.custom.status.found.main) }} />
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: "11px", md: "12px" },
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

        {/* Categories: positioned at top right (or top left in RTL) */}
        <Box
          sx={{
            display: { xs: "flex", sm: finalImageUrl ? "flex" : "none" },
            flexWrap: "wrap",
            justifyContent: "flex-end",
            gap: { xs: 0.5, md: 0.75 },
            maxWidth: { xs: "55%", sm: "60%" },
          }}
        >
          {categories.map((cat, index) => {
            const catStyle = categoryStyles[index];
            const catName = categoryNames[index];
            return (
              <Box
                key={cat.code || index}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  backgroundColor: alpha(theme.custom.color.surfaceRaised, 0.55),
                  backdropFilter: "blur(6px)",
                  color: catStyle.main,
                  fontWeight: 700,
                  fontSize: { xs: "11px", md: "12px" },
                  lineHeight: 1,
                  borderRadius: `${theme.custom.radius.sm}px`,
                  px: { xs: 1, md: 1.25 },
                  py: { xs: 0.375, md: 0.5 },
                  maxWidth: "100%",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                <Typography
                  component="span"
                  sx={{
                    fontSize: "inherit",
                    fontWeight: "inherit",
                    lineHeight: "inherit",
                    color: "inherit",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {catName}
                </Typography>
              </Box>
            );
          })}
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
          p: { xs: 1.25, md: 1.5 },
          display: { xs: "grid", sm: "flex" },
          gridTemplateColumns: { xs: "1fr" },
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: { xs: "flex-start", sm: "space-between" },
          gap: { xs: 0.375, sm: 0.75, md: 1 },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, md: 0.625 }, minWidth: 0 }}>
          <LocationOnOutlined sx={{ fontSize: { xs: 14, md: 16 }, color: textColor, opacity: 0.9, flexShrink: 0 }} />
          <Typography
            variant="caption"
            sx={{
              color: textColor,
              fontWeight: 600,
              fontSize: { xs: "0.75rem", md: "0.875rem" },
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {displayCityName}
          </Typography>
        </Box>
        <Typography
          variant="caption"
          sx={{
            color: alpha(textColor, 0.85),
            fontSize: { xs: "0.75rem", md: "0.8125rem" },
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}
        >
          {created}
        </Typography>
      </Box>
    </Box>
  );
};

export default RecentPosts;
