import React, { useMemo, Fragment } from "react";
import { Box, Typography, useTheme, alpha } from "@mui/material";
import { Link } from "react-router-dom";
import {
  CheckCircle as CheckCircleIcon,
  ArrowOutwardRounded,
  TaskAltOutlined,
  SearchOffOutlined,
} from "@mui/icons-material";
import { formatDistanceToNow } from "date-fns";
import { ar, fr, enUS } from "date-fns/locale";
import noImageSvg from "../../img/noimage.svg";
import LazyCardMedia from "../LazyCardMedia";
import { useTranslation } from "../../utils/translations";
import { isRTL } from "../../utils/languageUtils";
import { getOptimizedImageUrl } from "../../utils/cloudinaryUtils";
import {
  getCategoryConfig,
  getCategoryIcon,
  getCategoryBadgeStyle,
} from "../../config/categories";
import { API_BASE_URL } from "../../config/api";

// Unified Frosted Pod for no-image states: identical to PostsList.jsx style
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
          ? alpha(theme.custom.color.surfaceRaised || "#1e293b", 0.12)
          : "rgba(255, 255, 255, 0.18)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.40)"}`,
        boxShadow: isDark
          ? "0 8px 32px rgba(0, 0, 0, 0.20), 0 2px 6px rgba(0, 0, 0, 0.10)"
          : "0 10px 28px rgba(0, 0, 0, 0.04), 0 2px 6px rgba(0, 0, 0, 0.02)",
        borderRadius: { xs: "12px", sm: "16px" },
        width: count === 1 ? "fit-content" : "100%",
        maxWidth: count === 1 ? { xs: "90%", sm: "84%" } : { xs: "94%", sm: "88%" },
        boxSizing: "border-box",
        overflow: "hidden",
        p: count === 1
          ? { xs: "8px 12px", sm: "12px 18px" }
          : { xs: "6px 8px", sm: "10px 14px" },
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* 1 Category: centered icon + label */}
      {count === 1 && (() => {
        const item = items[0];
        const Icon = item.IconComponent;
        return (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: { xs: 0.5, sm: 0.75 }, width: "100%", minWidth: 0 }}>
            <Box
              sx={{
                color: item.style?.main || theme.palette.text.primary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                "& svg": { fontSize: { xs: 28, sm: 36 } },
              }}
            >
              <Icon />
            </Box>
            <Typography
              noWrap
              sx={{
                fontWeight: 700,
                fontSize: { xs: "11.5px", sm: "12.5px", md: "13px" },
                color: item.style?.main || theme.custom.color.ink,
                lineHeight: 1.25,
                textAlign: "center",
                maxWidth: { xs: 110, sm: 140 },
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
                      my: count >= 5 ? 0.25 : 0.35,
                      flexShrink: 0,
                      boxSizing: "border-box",
                    }}
                  />
                )}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: { xs: 0.6, sm: 0.85 },
                    width: "100%",
                    minWidth: 0,
                    boxSizing: "border-box",
                    py: count >= 5 ? 0.15 : 0.25,
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
                        fontSize: count >= 5 ? { xs: 14, sm: 15 } : { xs: 15, sm: 16 },
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
                      fontWeight: 650,
                      fontSize: count >= 5 ? { xs: "11px", md: "11px" } : { xs: "11.5px", md: "12px" },
                      color: theme.custom.color.ink,
                      lineHeight: 1.25,
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
  const { t, currentLanguage } = useTranslation();
  const isRTLMode = currentLanguage === "ar" || isRTL(currentLanguage);

  const getLocale = () => {
    switch (currentLanguage) {
      case "ar":
        return ar;
      case "fr":
        return fr;
      default:
        return enUS;
    }
  };

  const created = useMemo(() => {
    try {
      return formatDistanceToNow(new Date(createdAt), {
        addSuffix: true,
        locale: getLocale(),
      });
    } catch {
      return "";
    }
  }, [createdAt, currentLanguage]);

  const displayCityName = useMemo(() => {
    if (cityLabels && typeof cityLabels === "object") {
      const label = cityLabels[currentLanguage] || cityLabels.en;
      if (label && label.trim()) return label.trim();
    }
    if (cityName && typeof cityName === "string" && cityName.trim())
      return cityName.trim();
    if (city && typeof city === "string" && city.trim()) return city.trim();
    if (exactLocation) {
      const firstPart = exactLocation.split(",")[0].split("(")[0].trim();
      return firstPart.replace(/\d+/g, "").trim() || t("unknownLocation");
    }
    return t("unknownLocation");
  }, [cityLabels, cityName, city, exactLocation, currentLanguage, t]);

  const categories = useMemo(() => {
    const cats = [];
    const sourceCats =
      Categories && Array.isArray(Categories) && Categories.length > 0
        ? Categories
        : categoriesProp &&
            Array.isArray(categoriesProp) &&
            categoriesProp.length > 0
          ? categoriesProp
          : null;
    if (sourceCats)
      sourceCats.forEach((cat) => {
        if (cat && cat.code)
          cats.push({ code: cat.code, labels: cat.labels, _id: cat._id });
      });
    if (cats.length === 0 && Category && Category.code)
      cats.push({ code: Category.code, labels: Category.labels, _id: Category._id });
    if (cats.length === 0 && categoryname)
      cats.push({ code: categoryname, labels: null, _id: null });
    return cats.length > 0 ? cats : [{ code: "OTHER", labels: null, _id: null }];
  }, [Categories, categoriesProp, Category, categoryname]);

  const categoryNames = useMemo(
    () =>
      categories.map((cat) => {
        if (cat.labels)
          return cat.labels[currentLanguage] || cat.labels.en || cat.code;
        return cat.code || t("unknownCategory");
      }),
    [categories, currentLanguage, t]
  );

  const categoryStyles = useMemo(
    () =>
      categories.map((cat) => {
        try {
          const config = getCategoryConfig(cat.code);
          const badge = getCategoryBadgeStyle(cat.code);
          return { main: config.color, background: config.backgroundColor, badge };
        } catch {
          return {
            main: theme.custom.color.brandPrimary,
            background: alpha(theme.custom.color.brandPrimary, 0.1),
            badge: {
              color: theme.custom.color.brandPrimary,
              backgroundColor: "rgba(15,23,42,0.85)",
              border: `1px solid ${theme.custom.color.brandPrimary}`,
              backdropFilter: "blur(8px)",
            },
          };
        }
      }),
    [categories, theme]
  );

  const finalImageUrl = image
    ? image.startsWith("http")
      ? getOptimizedImageUrl(image, "card")
      : `${API_BASE_URL}/${image}`
    : null;

  const hasImage = Boolean(finalImageUrl);

  const foundLostStatus = useMemo(() => {
    let foundLostValue = null;
    let foundLostLabel = null;
    let foundLostColor = null;
    if (Floptions && Floptions.length > 0 && Floptions[0]?.code) {
      const flOption = Floptions[0];
      foundLostValue = flOption.code;
      foundLostLabel =
        (flOption.code === "FOUND"
          ? t("found")
          : flOption.code === "LOST"
            ? t("lost")
            : null) ||
        (flOption.labels && (flOption.labels[currentLanguage] || flOption.labels.en)) ||
        (flOption.code === "FOUND" ? t("found") : t("lost"));
      foundLostColor =
        flOption.color ||
        (flOption.code === "FOUND"
          ? theme.custom.status.found.main
          : theme.custom.status.lost.main);
    }
    if (!foundLostValue && type) {
      const code = type.toUpperCase();
      if (code === "FOUND" || code === "LOST") {
        foundLostValue = code;
        foundLostLabel = code === "FOUND" ? t("found") : t("lost");
        foundLostColor =
          code === "FOUND"
            ? theme.custom.status.found.main
            : theme.custom.status.lost.main;
      }
    }
    if (!foundLostValue && foundLost) {
      if (typeof foundLost === "string") {
        const code = foundLost.toUpperCase();
        if (code === "FOUND" || code === "LOST") {
          foundLostValue = code;
          foundLostLabel = code === "FOUND" ? t("found") : t("lost");
          foundLostColor =
            code === "FOUND"
              ? theme.custom.status.found.main
              : theme.custom.status.lost.main;
        }
      } else if (foundLost.code) {
        foundLostValue = foundLost.code;
        foundLostLabel =
          (foundLost.code === "FOUND"
            ? t("found")
            : foundLost.code === "LOST"
              ? t("lost")
              : null) ||
          (foundLost.labels &&
            (foundLost.labels[currentLanguage] || foundLost.labels.en)) ||
          (foundLost.code === "FOUND" ? t("found") : t("lost"));
        foundLostColor =
          foundLost.color ||
          (foundLost.code === "FOUND"
            ? theme.custom.status.found.main
            : theme.custom.status.lost.main);
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

  const categoryIconsData = useMemo(() => {
    if (hasImage) return [];
    if (!categories || categories.length === 0) return [];
    return categories
      .map((cat, index) => {
        const IconComponent = getCategoryIcon(cat.code);
        const catStyle = categoryStyles[index];
        if (!IconComponent) return null;
        return {
          IconComponent,
          style: catStyle,
          code: cat.code,
          label: categoryNames[index],
        };
      })
      .filter(Boolean);
  }, [hasImage, categories, categoryStyles, categoryNames]);

  const noImageBackground = useMemo(() => {
    const baseBg = isDark
      ? (theme.custom?.color?.surfaceBase || "#0F172A")
      : (theme.custom?.color?.surfaceBase || "#F8FAFC");

    if (!categoryStyles || categoryStyles.length === 0) {
      return baseBg;
    }

    const c1 = categoryStyles[0]?.main || theme.custom?.color?.brandPrimary || "#00BCD4";
    const c2 = categoryStyles[1]?.main || c1;
    const c3 = categoryStyles[2]?.main;

    // 1 Category: Centered ambient aura framing the category pod
    if (categoryStyles.length === 1) {
      return `radial-gradient(circle at 50% 45%, ${alpha(c1, isDark ? 0.36 : 0.26)} 0%, ${alpha(c1, isDark ? 0.08 : 0.05)} 65%, transparent 100%), ${baseBg}`;
    }

    // 2 or more Categories: Ambient multi-radial glow orbs
    const pos1 = isRTLMode ? "80% 25%" : "20% 25%";
    const pos2 = isRTLMode ? "15% 75%" : "85% 75%";
    const pos3 = isRTLMode ? "30% 20%" : "70% 20%";

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
    return layers.join(", ");
  }, [categoryStyles, isDark, isRTLMode, theme]);

  const hairline = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(226, 232, 240, 0.9)";
  const muted = isDark ? "#94A3B8" : "#64748B";
  const ink = theme.custom.color.ink;

  return (
    <Box
      component={Link}
      to={`/posts/${_id}`}
      aria-label={`${foundLostStatus.statusText} — ${displayCityName} — ${created}`}
      data-reveal-item=""
      sx={{
        textDecoration: "none",
        color: "inherit",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        width: "100%",
        minWidth: 0,
        height: fillHeight ? "100%" : undefined,
        borderRadius: { xs: "14px", sm: "16px", md: "18px" },
        overflow: "hidden",
        isolation: "isolate",
        cursor: "pointer",
        background: hasImage ? theme.custom.color.surfaceRaised : noImageBackground,
        border: `1px solid ${hairline}`,
        boxShadow: isDark
          ? "0 2px 8px rgba(0, 0, 0, 0.25)"
          : "0 1px 3px rgba(15, 23, 42, 0.03), 0 4px 12px rgba(15, 23, 42, 0.03)",
        transition:
          "border-color 200ms ease, box-shadow 200ms ease, transform 200ms ease",
        "&:hover": {
          borderColor: alpha(tone.main, 0.28),
          transform: "translateY(-2px)",
          boxShadow: isDark
            ? "0 8px 24px rgba(0, 0, 0, 0.35)"
            : "0 6px 20px rgba(15, 23, 42, 0.08)",
        },
        "&:hover .rp-img": { transform: "scale(1.03)" },
        "&:hover .rp-arrow": {
          opacity: 1,
          transform: isRTLMode ? "translate(-1px, -1px)" : "translate(1px, -1px)",
          backgroundColor: isDark ? "rgba(11, 87, 208, 0.2)" : "#E8F0FE",
          color: isDark ? "#8AB4F8" : "#0B57D0",
          borderColor: isDark ? "rgba(138, 180, 248, 0.3)" : "rgba(11, 87, 208, 0.25)",
        },
        "&:active": {
          transform: "scale(0.99)",
          boxShadow: isDark
            ? "0 2px 6px rgba(0, 0, 0, 0.2)"
            : "0 1px 2px rgba(15, 23, 42, 0.04)",
        },
        "&:focus-visible": {
          outline: `2px solid ${theme.custom.color.brandPrimary || "#0B57D0"}`,
          outlineOffset: 2,
          borderColor: alpha(theme.custom.color.brandPrimary || "#0B57D0", 0.35),
        },
      }}
    >
      {/* Media Canvas */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          aspectRatio: fillHeight ? undefined : { xs: "1 / 1", sm: "4 / 3" },
          flex: fillHeight ? "1 1 auto" : "0 0 auto",
          minHeight: fillHeight ? 0 : undefined,
          overflow: "hidden",
          backgroundColor: hasImage ? theme.custom.color.surfaceNested : "transparent",
          borderBottom: `1px solid ${isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.40)"}`,
        }}
      >
        {hasImage ? (
          <LazyCardMedia
            component="img"
            image={finalImageUrl}
            alt={displayCityName}
            fallback={noImageSvg}
            className="rp-img"
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform 280ms cubic-bezier(0.2, 0, 0, 1)",
            }}
          />
        ) : categoryIconsData.length > 0 ? (
          <Box
            sx={{
              position: "absolute",
              top: { xs: "34px", sm: "38px", md: "40px" },
              bottom: 0,
              left: 0,
              right: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: { xs: 0.75, sm: 1.5 },
              zIndex: 1,
              boxSizing: "border-box",
            }}
          >
            <CategoryBentoPod items={categoryIconsData} />
          </Box>
        ) : null}

        {/* Top Badges Bar */}
        <Box
          sx={{
            position: "absolute",
            top: { xs: 8, sm: 10, md: 12 },
            insetInlineStart: { xs: 8, sm: 10, md: 12 },
            insetInlineEnd: { xs: 8, sm: 10, md: 12 },
            zIndex: 2,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 0.75,
            pointerEvents: "none",
          }}
        >
          {/* Status Badge — same border-radius and size as Posts list page, white text in Dark mode & black in Light mode */}
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: { xs: 0.45, sm: 0.6 },
              px: { xs: 0.9, sm: 1.15 },
              py: { xs: 0.35, sm: 0.5 },
              borderRadius: `${theme.custom.radius.sm}px`,
              backgroundColor: isDark
                ? (foundLostStatus.isFound ? "#059669" : "#DC2626")
                : (foundLostStatus.isFound ? "#E5F5EF" : "#FBEAE8"),
              border: `1px solid ${
                isDark
                  ? (foundLostStatus.isFound ? "rgba(5, 150, 105, 0.4)" : "rgba(220, 38, 38, 0.4)")
                  : (foundLostStatus.isFound ? "#1A8563" : "#C64335")
              }`,
              boxShadow: isDark
                ? "0 2px 6px rgba(0, 0, 0, 0.35)"
                : "0 2px 6px rgba(15, 23, 42, 0.08)",
            }}
          >
            <StatusIcon
              sx={{
                fontSize: { xs: 13, sm: 15 },
                color: isDark ? "#FFFFFF" : "#000000",
              }}
            />
            <Typography
              variant="caption"
              sx={{
                fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                fontWeight: 700,
                fontSize: { xs: "11px", sm: "12px" },
                letterSpacing: 0.3,
                textTransform: "uppercase",
                lineHeight: 1,
                color: isDark ? "#FFFFFF" : "#000000",
                whiteSpace: "nowrap",
              }}
            >
              {t(foundLostStatus.isFound ? "found" : "lost")}
            </Typography>
          </Box>

          {/* Right badges: Returned badge and/or Category badge when post has image */}
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.6, maxWidth: "58%" }}>
            {returned && (
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: { xs: 0.4, sm: 0.5 },
                  px: { xs: 0.75, sm: 1 },
                  py: { xs: 0.35, sm: 0.5 },
                  borderRadius: `${theme.custom.radius.sm}px`,
                  backgroundColor: theme.custom.status.found.main,
                  boxShadow: isDark
                    ? "0 2px 6px rgba(0, 0, 0, 0.35)"
                    : "0 2px 6px rgba(15, 23, 42, 0.12)",
                }}
              >
                <CheckCircleIcon
                  sx={{
                    fontSize: { xs: 12, sm: 14 },
                    color: theme.palette.getContrastText(theme.custom.status.found.main),
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                    fontWeight: 700,
                    fontSize: { xs: "11px", sm: "12px" },
                    letterSpacing: 0.3,
                    textTransform: "uppercase",
                    lineHeight: 1,
                    color: theme.palette.getContrastText(theme.custom.status.found.main),
                    whiteSpace: "nowrap",
                  }}
                >
                  {t("returned")}
                </Typography>
              </Box>
            )}

            {hasImage && categories.length > 0 && (() => {
              const catStyle = categoryStyles[0];
              const badge = catStyle?.badge || getCategoryBadgeStyle(categories[0]?.code);
              return (
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    px: { xs: 0.85, sm: 1.1 },
                    py: { xs: 0.35, sm: 0.5 },
                    borderRadius: `${theme.custom.radius.sm}px`,
                    backgroundColor: badge.backgroundColor,
                    backdropFilter: badge.backdropFilter,
                    WebkitBackdropFilter: badge.backdropFilter,
                    border: badge.border,
                    color: badge.color,
                    boxShadow: badge.boxShadow,
                    maxWidth: "100%",
                  }}
                >
                  <Typography
                    noWrap
                    sx={{
                      fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                      fontWeight: 700,
                      fontSize: { xs: "11px", sm: "12px" },
                      lineHeight: 1,
                      color: "inherit",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {categoryNames[0]}
                  </Typography>
                </Box>
              );
            })()}
          </Box>
        </Box>
      </Box>

      {/* Content Details — Slimmed down height & mobile-compatible text sizing */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: { xs: 0.25, sm: 0.35, md: 0.5 },
          px: { xs: 1.25, sm: 1.5, md: 2 },
          py: { xs: 1, sm: 1.15, md: 1.4 },
          flexShrink: 0,
          backgroundColor: isDark
            ? "rgba(255, 255, 255, 0.05)"
            : (theme.custom.color.surfaceNested || "#F1F5F9"),
          direction: isRTLMode ? "rtl" : "ltr",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 0.75,
            minWidth: 0,
          }}
        >
          {/* Card Title */}
          <Typography
            noWrap
            sx={{
              fontFamily: `'Plus Jakarta Sans', ${theme.custom.font.display}, sans-serif`,
              fontWeight: 700,
              fontSize: { xs: "13px", sm: "13.5px", md: "14px" },
              lineHeight: 1.25,
              letterSpacing: "-0.015em",
              color: ink,
              minWidth: 0,
              flex: 1,
            }}
          >
            {displayCityName}
          </Typography>
          <Box
            className="rp-arrow"
            aria-hidden
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: { xs: 22, sm: 22, md: 24 },
              height: { xs: 22, sm: 22, md: 24 },
              borderRadius: "50%",
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.07)" : "rgba(15, 23, 42, 0.04)",
              border: `1px solid ${hairline}`,
              color: muted,
              flexShrink: 0,
              opacity: { xs: 1, sm: 0 },
              transition:
                "opacity 180ms ease, transform 180ms ease, background-color 180ms ease, color 180ms ease, border-color 180ms ease",
              "@media (hover: none)": { opacity: 1, transform: "none" },
            }}
          >
            <ArrowOutwardRounded
              sx={{
                fontSize: { xs: 13, sm: 13, md: 13 },
                transform: isRTLMode ? "scaleX(-1)" : "none",
              }}
            />
          </Box>
        </Box>

        {/* Date */}
        <Typography
          noWrap
          sx={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            fontSize: { xs: "11px", sm: "11.5px", md: "12px" },
            lineHeight: 1.2,
            color: muted,
            minWidth: 0,
          }}
        >
          {created}
        </Typography>
      </Box>
    </Box>
  );
};

export default RecentPosts;
