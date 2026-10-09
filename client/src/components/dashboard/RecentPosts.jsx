import { Box, Typography, useTheme, alpha } from "@mui/material";
import { useNavigate, Link } from "react-router-dom";
import {
  LocationOnOutlined,
  CheckCircle as CheckCircleIcon,
  TaskAltOutlined,
  SearchOffOutlined,
} from "@mui/icons-material";
import { useMemo, Fragment } from "react";
import { formatDistanceToNow } from "date-fns";
import { ar, fr, enUS } from "date-fns/locale";
import noImageSvg from "../../img/noimage.svg";
import LazyCardMedia from "../LazyCardMedia";
import { useTranslation } from "../../utils/translations";
import { getOptimizedImageUrl } from "../../utils/cloudinaryUtils";
import { getCategoryConfig, getCategoryIcon, getCategoryBadgeStyle } from "../../config/categories";
import { API_BASE_URL } from "../../config/api";

// Unified Frosted Pod with Structured Bento Pair Grid for no-image states (Approach 3)
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
        maxWidth: { xs: "88%", sm: "84%" },
        width: "fit-content",
        p: count === 1
          ? { xs: "16px 24px", sm: "20px 30px" }
          : count <= 3
            ? { xs: "12px 18px", sm: "14px 20px" }
            : { xs: "10px 16px", sm: "12px 18px" },
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* 1 Category */}
      {count === 1 && (() => {
        const item = items[0];
        const Icon = item.IconComponent;
        return (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                color: item.style?.main || theme.palette.text.primary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                "& svg": { fontSize: { xs: 44, sm: 50 } },
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
            minWidth: { xs: 180, sm: 210 },
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
                      fontWeight: 750,
                      fontSize: count >= 5 ? { xs: "11px", sm: "11.5px" } : { xs: "11.5px", sm: "12.5px" },
                      color: theme.custom.color.ink,
                      maxWidth: "100%",
                      lineHeight: 1.2,
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
        const badge = getCategoryBadgeStyle(cat.code);
        return { main: config.color, background: config.backgroundColor, badge };
      } catch (error) {
        return {
          main: theme.custom.color.brandPrimary,
          background: alpha(theme.custom.color.brandPrimary, 0.1),
          badge: {
            color: theme.custom.color.brandPrimary,
            backgroundColor: "rgba(15, 23, 42, 0.85)",
            border: `1px solid ${theme.custom.color.brandPrimary}`,
            backdropFilter: "blur(8px)",
          },
        };
      }
    });
  }, [categories, theme]);

  const finalImageUrl = image
    ? (image.startsWith("http") ? getOptimizedImageUrl(image, "card") : `${API_BASE_URL}/${image}`)
    : null;

  // Category icons data for no-image cards
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

  const hasImage = Boolean(finalImageUrl);
  const showTopCategoryBadges = hasImage;

  // Compute status badge (FOUND / LOST)
  const foundLostStatus = useMemo(() => {
    let foundLostValue = null;
    let foundLostLabel = null;
    let foundLostColor = null;

    if (Floptions && Floptions.length > 0 && Floptions[0]?.code) {
      const flOption = Floptions[0];
      foundLostValue = flOption.code;
      foundLostLabel = (flOption.code === "FOUND" ? t("found") : flOption.code === "LOST" ? t("lost") : null) ||
                      (flOption.labels && (flOption.labels[currentLanguage] || flOption.labels.en)) ||
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
        foundLostLabel = (foundLost.code === "FOUND" ? t("found") : foundLost.code === "LOST" ? t("lost") : null) ||
                        (foundLost.labels && (foundLost.labels[currentLanguage] || foundLost.labels.en)) ||
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
  const textColor = finalImageUrl ? "#FFFFFF" : theme.custom.color.ink;
  const dateColor = finalImageUrl ? alpha("#FFFFFF", 0.85) : alpha(theme.custom.color.ink, 0.75);

  return (
    <Box
      component={Link}
      to={`/dash/posts/${_id}`}
      data-reveal-item=""
      sx={{
        textDecoration: "none",
        color: "inherit",
        display: "block",
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
        /* No-image state: displays Unified Frosted Pod with Structured Bento Pair Grid (Approach 3) */
        categoryIconsData.length > 0 && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: { xs: 1.5, sm: 2 },
              width: "100%",
              height: "100%",
              zIndex: 1,
            }}
          >
            <CategoryBentoPod items={categoryIconsData} />
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
            <StatusIcon sx={{ fontSize: { xs: 14, md: 16 }, color: "#FFFFFF" }} />
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                fontSize: { xs: "11px", md: "12px" },
                letterSpacing: { xs: 0.3, md: 0.4 },
                textTransform: "uppercase",
                color: "#FFFFFF",
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
              <CheckCircleIcon sx={{ fontSize: { xs: 12, md: 14 }, color: "#FFFFFF" }} />
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: "11px", md: "12px" },
                  textTransform: "uppercase",
                  color: "#FFFFFF",
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
            display: showTopCategoryBadges ? "flex" : "none",
            flexWrap: "wrap",
            justifyContent: "flex-end",
            gap: { xs: 0.5, md: 0.75 },
            maxWidth: { xs: "55%", sm: "60%" },
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
                  display: "inline-flex",
                  alignItems: "center",
                  backgroundColor: badge.backgroundColor,
                  backdropFilter: badge.backdropFilter,
                  border: badge.border,
                  color: badge.color,
                  boxShadow: badge.boxShadow,
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

      {/* Bottom row: location + relative date in a frosted bar with top split line */}
      <Box
        sx={{
          position: "absolute",
          bottom: 0,
          insetInlineStart: 0,
          insetInlineEnd: 0,
          zIndex: 2,
          px: { xs: 1.25, md: 1.5 },
          py: { xs: 1, md: 1.125 },
          backgroundColor: finalImageUrl
            ? alpha("#000000", 0.45)
            : alpha(theme.custom.color.surfaceRaised, isDark ? 0.45 : 0.65),
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          borderTop: `1px solid ${
            finalImageUrl
              ? alpha("#FFFFFF", 0.15)
              : alpha(theme.custom.color.ink, isDark ? 0.12 : 0.08)
          }`,
          borderBottomLeftRadius: `${theme.custom.radius.lg}px`,
          borderBottomRightRadius: `${theme.custom.radius.lg}px`,
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
            color: dateColor,
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
