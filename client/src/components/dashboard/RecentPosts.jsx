import { Box, Typography, useTheme, alpha } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import {
  CheckCircle as CheckCircleIcon,
  ArrowOutwardRounded,
} from "@mui/icons-material";
import { useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { ar, fr, enUS } from "date-fns/locale";
import noImageSvg from "../../img/noimage.svg";
import LazyCardMedia from "../LazyCardMedia";
import { useTranslation } from "../../utils/translations";
import { getOptimizedImageUrl } from "../../utils/cloudinaryUtils";
import {
  getCategoryConfig,
  getCategoryIcon,
  getCategoryBadgeStyle,
} from "../../config/categories";
import { API_BASE_URL } from "../../config/api";

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

  const fallbackIconData = useMemo(() => {
    if (hasImage) return null;
    if (!categories || categories.length === 0) return null;
    const IconComponent = getCategoryIcon(categories[0].code);
    if (!IconComponent) return null;
    return {
      IconComponent,
      style: categoryStyles[0],
      label: categoryNames[0],
    };
  }, [hasImage, categories, categoryStyles, categoryNames]);

  const hairline = isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)";
  const hairlineStrong = isDark ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.10)";
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
        height: fillHeight ? "100%" : undefined,
        minHeight: fillHeight ? undefined : { xs: 246, sm: 268 },
        borderRadius: "12px",
        overflow: "hidden",
        isolation: "isolate",
        cursor: "pointer",
        backgroundColor: theme.custom.color.surfaceRaised,
        border: `1px solid ${hairline}`,
        boxShadow: theme.custom.elevation.e1,
        transition:
          "border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease",
        "&:hover": {
          borderColor: alpha(tone.main, 0.18),
          boxShadow: theme.custom.elevation.e2,
        },
        "&:hover .rp-img": { transform: "scale(1.025)" },
        "&:hover .rp-arrow": { opacity: 1, transform: "translateX(0)" },
        "&:active": {
          transform: "scale(0.99)",
          boxShadow: theme.custom.elevation.e1,
        },
        "&:focus-visible": {
          outline: `2px solid ${theme.custom.color.brandPrimary}`,
          outlineOffset: 2,
          borderColor: alpha(theme.custom.color.brandPrimary, 0.35),
        },
      }}
    >
      {/* Media */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          aspectRatio: fillHeight ? undefined : "4 / 3.05",
          flex: fillHeight ? "1 1 auto" : "0 0 auto",
          minHeight: fillHeight ? 0 : undefined,
          overflow: "hidden",
          backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
          borderBottom: `1px solid ${hairline}`,
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
              transition: "transform 220ms ease",
              transform: "scale(1.01)",
            }}
          />
        ) : (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 1.25,
              p: 2,
            }}
          >
            {fallbackIconData && (
              <>
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: alpha(
                      fallbackIconData.style?.main ||
                        theme.custom.color.brandPrimary,
                      isDark ? 0.14 : 0.09
                    ),
                    border: `1px solid ${alpha(
                      fallbackIconData.style?.main ||
                        theme.custom.color.brandPrimary,
                      isDark ? 0.18 : 0.12
                    )}`,
                    color:
                      fallbackIconData.style?.main ||
                      theme.custom.color.brandPrimary,
                    "& svg": { fontSize: 26 },
                  }}
                >
                  <fallbackIconData.IconComponent />
                </Box>
                <Typography
                  sx={{
                    fontFamily: theme.custom.font.body,
                    fontWeight: 600,
                    fontSize: "12px",
                    color: muted,
                    letterSpacing: 0.15,
                    textAlign: "center",
                    lineHeight: 1.3,
                  }}
                >
                  {fallbackIconData.label}
                </Typography>
              </>
            )}
          </Box>
        )}

        {/* Top bar */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            insetInlineStart: 0,
            insetInlineEnd: 0,
            zIndex: 2,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 1,
            p: 1.1,
            pointerEvents: "none",
          }}
        >
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.75,
              height: 26,
              px: 1.1,
              borderRadius: "999px",
              backgroundColor: isDark
                ? "rgba(15,23,42,0.82)"
                : "rgba(255,255,255,0.94)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.08)"}`,
              boxShadow: isDark
                ? "0 1px 2px rgba(0,0,0,0.28)"
                : "0 1px 3px rgba(15,23,42,0.08), 0 1px 2px rgba(15,23,42,0.06)",
            }}
          >
            <Box
              sx={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                backgroundColor: tone.main,
                boxShadow: `0 0 0 3px ${alpha(tone.main, 0.16)}`,
                flexShrink: 0,
              }}
            />
            <Typography
              sx={{
                fontFamily: theme.custom.font.body,
                fontWeight: 650,
                fontSize: "11px",
                letterSpacing: 0.35,
                lineHeight: 1,
                color: ink,
                whiteSpace: "nowrap",
              }}
            >
              {foundLostStatus.isFound ? t("found") : t("lost")}
            </Typography>
          </Box>

          {returned && (
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.6,
                height: 26,
                px: 1,
                borderRadius: "999px",
                backgroundColor: isDark
                  ? "rgba(15,23,42,0.82)"
                  : "rgba(255,255,255,0.94)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.08)"}`,
                boxShadow: isDark
                  ? "0 1px 2px rgba(0,0,0,0.28)"
                  : "0 1px 3px rgba(15,23,42,0.08)",
              }}
            >
              <CheckCircleIcon
                sx={{ fontSize: 14, color: theme.custom.status.found.main }}
              />
              <Typography
                sx={{
                  fontFamily: theme.custom.font.body,
                  fontWeight: 650,
                  fontSize: "11px",
                  letterSpacing: 0.3,
                  lineHeight: 1,
                  color: ink,
                  whiteSpace: "nowrap",
                }}
              >
                {t("returned")}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Content */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
          px: 1.65,
          pt: 1.35,
          pb: 1.4,
          backgroundColor: theme.custom.color.surfaceRaised,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            minWidth: 0,
          }}
        >
          <Typography
            noWrap
            sx={{
              fontFamily: theme.custom.font.body,
              fontWeight: 650,
              fontSize: "13.5px",
              lineHeight: 1.25,
              letterSpacing: "-0.01em",
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
              width: 22,
              height: 22,
              borderRadius: "50%",
              border: `1px solid ${hairlineStrong}`,
              color: muted,
              flexShrink: 0,
              opacity: 0,
              transform: "translateX(-4px)",
              transition: "opacity 160ms ease, transform 160ms ease, border-color 160ms ease, color 160ms ease",
              "@media (hover: none)": { opacity: 1, transform: "none" },
            }}
          >
            <ArrowOutwardRounded sx={{ fontSize: 13 }} />
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            minWidth: 0,
            flexWrap: "nowrap",
            overflow: "hidden",
          }}
        >
          <Typography
            noWrap
            sx={{
              fontFamily: theme.custom.font.body,
              fontWeight: 450,
              fontSize: "12px",
              lineHeight: 1.3,
              color: muted,
              minWidth: 0,
            }}
          >
            {created}
          </Typography>
          <Box
            sx={{
              width: 3,
              height: 3,
              borderRadius: "50%",
              backgroundColor: alpha(muted, 0.55),
              flexShrink: 0,
            }}
          />
          <Typography
            noWrap
            sx={{
              fontFamily: theme.custom.font.body,
              fontWeight: 500,
              fontSize: "12px",
              lineHeight: 1.3,
              color: muted,
              minWidth: 0,
              flex: 1,
            }}
          >
            {categoryNames[0]}
            {categories.length > 1 ? ` · +${categories.length - 1}` : ""}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default RecentPosts;
