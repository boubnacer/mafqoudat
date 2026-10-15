import { Box, Typography, useTheme, alpha } from "@mui/material";
import { useNavigate, Link } from "react-router-dom";
import {
  LocationOnOutlined,
  PlaceRounded,
  CheckCircle as CheckCircleIcon,
  TaskAltOutlined,
  SearchOffOutlined,
  ArrowOutwardRounded,
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
import CyberDotMatrix from "./CyberDotMatrix";

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
          ? alpha(theme.custom.color.surfaceRaised || "#1e293b", 0.12)
          : "rgba(255, 255, 255, 0.18)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.40)"}`,
        boxShadow: isDark
          ? "0 8px 32px rgba(0, 0, 0, 0.20), 0 2px 6px rgba(0, 0, 0, 0.10)"
          : "0 10px 28px rgba(0, 0, 0, 0.04), 0 2px 6px rgba(0, 0, 0, 0.02)",
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

const RecentPosts = (props) => {
  const {
    _id, type, categoryname, exactLocation, image, createdAt,
    cityLabels, cityName, city, Category, Categories, categories: categoriesProp,
    returned, fillHeight, foundLost, Floptions,
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
    try { return formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: getLocale() }); } catch { return ""; }
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

  const categories = useMemo(() => {
    const cats = [];
    const sourceCats = (Categories && Array.isArray(Categories) && Categories.length > 0) ? Categories : (categoriesProp && Array.isArray(categoriesProp) && categoriesProp.length > 0) ? categoriesProp : null;
    if (sourceCats) sourceCats.forEach((cat) => { if (cat && cat.code) cats.push({ code: cat.code, labels: cat.labels, _id: cat._id }); });
    if (cats.length === 0 && Category && Category.code) cats.push({ code: Category.code, labels: Category.labels, _id: Category._id });
    if (cats.length === 0 && categoryname) cats.push({ code: categoryname, labels: null, _id: null });
    return cats.length > 0 ? cats : [{ code: "OTHER", labels: null, _id: null }];
  }, [Categories, categoriesProp, Category, categoryname]);

  const categoryNames = useMemo(() => categories.map((cat) => {
    if (cat.labels) return cat.labels[currentLanguage] || cat.labels.en || cat.code;
    return cat.code || t("unknownCategory");
  }), [categories, currentLanguage, t]);

  const categoryStyles = useMemo(() => categories.map((cat) => {
    try { const config = getCategoryConfig(cat.code); const badge = getCategoryBadgeStyle(cat.code); return { main: config.color, background: config.backgroundColor, badge }; }
    catch { return { main: theme.custom.color.brandPrimary, background: alpha(theme.custom.color.brandPrimary, 0.1), badge: { color: theme.custom.color.brandPrimary, backgroundColor: "rgba(15,23,42,0.85)", border: `1px solid ${theme.custom.color.brandPrimary}`, backdropFilter: "blur(8px)" } }; }
  }), [categories, theme]);

  const finalImageUrl = image ? (image.startsWith("http") ? getOptimizedImageUrl(image, "card") : `${API_BASE_URL}/${image}`) : null;

  const categoryIconsData = useMemo(() => {
    if (finalImageUrl) return [];
    if (!categories || categories.length === 0) return [];
    return categories.map((cat, index) => {
      const IconComponent = getCategoryIcon(cat.code);
      const catStyle = categoryStyles[index];
      if (!IconComponent) return null;
      return { IconComponent, style: catStyle, code: cat.code, label: categoryNames[index] };
    }).filter(Boolean);
  }, [finalImageUrl, categories, categoryStyles, categoryNames]);

  const hasImage = Boolean(finalImageUrl);
  const showTopCategoryBadges = hasImage;

  const foundLostStatus = useMemo(() => {
    let foundLostValue = null; let foundLostLabel = null; let foundLostColor = null;
    if (Floptions && Floptions.length > 0 && Floptions[0]?.code) {
      const flOption = Floptions[0];
      foundLostValue = flOption.code;
      foundLostLabel = (flOption.code === "FOUND" ? t("found") : flOption.code === "LOST" ? t("lost") : null) || (flOption.labels && (flOption.labels[currentLanguage] || flOption.labels.en)) || (flOption.code === "FOUND" ? t("found") : t("lost"));
      foundLostColor = flOption.color || (flOption.code === "FOUND" ? theme.custom.status.found.main : theme.custom.status.lost.main);
    }
    if (!foundLostValue && type) {
      const code = type.toUpperCase();
      if (code === "FOUND" || code === "LOST") { foundLostValue = code; foundLostLabel = code === "FOUND" ? t("found") : t("lost"); foundLostColor = code === "FOUND" ? theme.custom.status.found.main : theme.custom.status.lost.main; }
    }
    if (!foundLostValue && foundLost) {
      if (typeof foundLost === "string") { const code = foundLost.toUpperCase(); if (code === "FOUND" || code === "LOST") { foundLostValue = code; foundLostLabel = code === "FOUND" ? t("found") : t("lost"); foundLostColor = code === "FOUND" ? theme.custom.status.found.main : theme.custom.status.lost.main; } }
      else if (foundLost.code) { foundLostValue = foundLost.code; foundLostLabel = (foundLost.code === "FOUND" ? t("found") : foundLost.code === "LOST" ? t("lost") : null) || (foundLost.labels && (foundLost.labels[currentLanguage] || foundLost.labels.en)) || (foundLost.code === "FOUND" ? t("found") : t("lost")); foundLostColor = foundLost.color || (foundLost.code === "FOUND" ? theme.custom.status.found.main : theme.custom.status.lost.main); }
    }
    if (!foundLostValue) { foundLostValue = "FOUND"; foundLostLabel = t("found"); foundLostColor = theme.custom.status.found.main; }
    const isFound = foundLostValue === "FOUND";
    const statusColor = foundLostColor;
    const statusText = t(isFound ? "found" : "lost");
    return { isFound, statusColor, statusText };
  }, [Floptions, type, foundLost, t, theme]);

  const tone = { main: foundLostStatus.statusColor };
  const StatusIcon = foundLostStatus.isFound ? TaskAltOutlined : SearchOffOutlined;

  const { colorCategoryStart, colorCategoryEnd } = useMemo(() => {
    if (!categoryStyles || categoryStyles.length === 0) { const fallback = theme.custom?.color?.brandLogo || "#00BCD4"; return { colorCategoryStart: fallback, colorCategoryEnd: fallback }; }
    const c1 = categoryStyles[0]?.main || theme.custom?.color?.brandLogo || "#00BCD4";
    const c2 = categoryStyles[1]?.main || c1;
    return { colorCategoryStart: c1, colorCategoryEnd: c2 };
  }, [categoryStyles, theme]);

  const handleViewDetails = () => navigate(`/posts/${_id}`);

  return (
    <Box
      component={Link}
      to={`/posts/${_id}`}
      data-reveal-item=""
      sx={{
        textDecoration: "none",
        color: "inherit",
        display: "block",
        position: "relative",
        width: "100%",
        height: fillHeight ? "100%" : undefined,
        aspectRatio: fillHeight ? undefined : { xs: "3 / 3.95", sm: "3 / 3.85", md: "4 / 4.35" },
        minHeight: fillHeight ? undefined : { xs: 252, sm: 268, md: "auto" },
        borderRadius: { xs: "20px", sm: "22px" },
        overflow: "hidden",
        cursor: "pointer",
        isolation: "isolate",
        backgroundColor: finalImageUrl ? theme.custom.color.surfaceBase : isDark ? "#1E293B" : "#FFFFFF",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(226,232,240,0.95)"}`,
        boxShadow: isDark
          ? "0 10px 32px rgba(0,0,0,0.48), 0 4px 12px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.07)"
          : "0 10px 32px rgba(15,23,42,0.10), 0 4px 12px rgba(15,23,42,0.07)",
        transition: "transform 0.32s cubic-bezier(0.34,1.26,0.64,1), box-shadow 0.32s ease, border-color 0.28s ease",
        "&:hover": {
          transform: "translateY(-6px)",
          borderColor: alpha(tone.main, 0.42),
          boxShadow: isDark
            ? `0 18px 42px rgba(0,0,0,0.52), 0 6px 18px rgba(0,0,0,0.32), 0 0 0 1px ${alpha(tone.main, 0.22)}, 0 0 28px ${alpha(tone.main, 0.18)}`
            : `0 18px 40px rgba(15,23,42,0.13), 0 6px 16px rgba(15,23,42,0.08), 0 0 0 1px ${alpha(tone.main, 0.16)}, 0 0 22px ${alpha(tone.main, 0.14)}`,
        },
        "&:hover .rp-img": { transform: "scale(1.06)" },
        "&:hover .rp-glow": { opacity: 1 },
        "&:focus-visible": { outline: `2px solid ${tone.main}`, outlineOffset: 2 },
      }}
    >
      {/* top premium hairline glow */}
      <Box className="rp-glow" sx={{ position: "absolute", top: 0, insetInlineStart: 0, insetInlineEnd: 0, height: "1.5px", zIndex: 3, opacity: 0, transition: "opacity 0.3s ease", background: `linear-gradient(90deg, transparent 0%, ${alpha(tone.main, 0.0)} 8%, ${tone.main} 50%, ${alpha(tone.main, 0.0)} 92%, transparent 100%)` }} />

      {finalImageUrl ? (
        <>
          <LazyCardMedia
            component="img"
            image={finalImageUrl}
            alt={displayCityName}
            fallback={noImageSvg}
            className="rp-img"
            sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94)", transform: "scale(1.01)" }}
          />
          <Box sx={{ position: "absolute", inset: 0, background: `linear-gradient(to top, ${alpha("#020617", 0.82)} 0%, ${alpha("#020617", 0.36)} 32%, ${alpha("#020617", 0.08)} 52%, ${alpha("#020617", 0.52)} 100%)` }} />
          <Box sx={{ position: "absolute", inset: 0, opacity: isDark ? 0 : 0.10, background: `radial-gradient(520px 280px at 70% 8%, ${alpha(tone.main, 0.18)}, transparent 68%)` }} />
        </>
      ) : (
        <>
          <Box sx={{ position: "absolute", inset: 0, background: isDark ? `radial-gradient(620px 380px at 50% 0%, ${alpha(colorCategoryStart, 0.22)} 0%, transparent 62%), radial-gradient(520px 340px at 90% 92%, ${alpha(colorCategoryEnd, 0.18)} 0%, transparent 60%), linear-gradient(180deg, #1E293B 0%, #162032 100%)` : `radial-gradient(620px 360px at 50% 3%, ${alpha(colorCategoryStart, 0.11)} 0%, transparent 58%), radial-gradient(520px 360px at 88% 96%, ${alpha(colorCategoryEnd, 0.09)} 0%, transparent 58%), linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)` }} />
          <CyberDotMatrix idPrefix={`dots-post-${_id || "card"}`} placement="left-right-edges" colorTop={colorCategoryStart} colorBottom={colorCategoryEnd} dotRadius={isDark ? 0.75 : 0.9} opacity={isDark ? 0.68 : 0.82} />
          {categoryIconsData.length > 0 && (
            <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", p: { xs: 1.5, sm: 2 }, width: "100%", height: "100%", zIndex: 1, boxSizing: "border-box" }}>
              <CategoryBentoPod items={categoryIconsData} />
            </Box>
          )}
        </>
      )}

      {/* Top row */}
      <Box sx={{ position: "absolute", top: 0, insetInlineStart: 0, insetInlineEnd: 0, zIndex: 2, p: { xs: 1.15, sm: 1.35, md: 1.5 }, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
        <Box sx={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 0.6 }}>
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.65, px: { xs: 1.05, sm: 1.2 }, py: { xs: 0.5, sm: 0.58 }, borderRadius: "999px", backgroundColor: tone.main, boxShadow: `0 4px 14px ${alpha(tone.main, 0.38)}, 0 1px 3px rgba(0,0,0,0.22)`, border: `1px solid ${alpha("#fff", 0.18)}` }}>
            <StatusIcon sx={{ fontSize: { xs: 13, sm: 14 }, color: "#FFFFFF" }} />
            <Typography variant="caption" sx={{ fontWeight: 800, fontSize: { xs: "10.5px", sm: "11px" }, letterSpacing: 0.55, textTransform: "uppercase", color: "#FFFFFF", lineHeight: 1 }}>{t(foundLostStatus.isFound ? "found" : "lost")}</Typography>
          </Box>
          {returned && (
            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.55, px: 1.05, py: 0.45, borderRadius: "999px", backgroundColor: "rgba(15,23,42,0.88)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.14)", boxShadow: "0 4px 14px rgba(0,0,0,0.22)" }}>
              <CheckCircleIcon sx={{ fontSize: 13, color: theme.custom.status.found.main }} />
              <Typography variant="caption" sx={{ fontWeight: 800, fontSize: "10.5px", letterSpacing: 0.45, textTransform: "uppercase", color: "#FFFFFF", lineHeight: 1 }}>{t("returned")}</Typography>
            </Box>
          )}
        </Box>
        <Box sx={{ display: showTopCategoryBadges ? "flex" : "none", flexWrap: "wrap", justifyContent: "flex-end", gap: 0.6, maxWidth: { xs: "54%", sm: "58%" } }}>
          {categories.map((cat, index) => {
            const catStyle = categoryStyles[index];
            const catName = categoryNames[index];
            const badge = catStyle?.badge || getCategoryBadgeStyle(cat.code);
            return (
              <Box key={cat.code || index} sx={{ display: "inline-flex", alignItems: "center", backgroundColor: badge.backgroundColor, backdropFilter: badge.backdropFilter, WebkitBackdropFilter: badge.backdropFilter, border: badge.border, color: badge.color, boxShadow: badge.boxShadow || "0 4px 12px rgba(0,0,0,0.22)", fontWeight: 750, fontSize: { xs: "10.5px", sm: "11px" }, lineHeight: 1, borderRadius: "999px", px: { xs: 1, sm: 1.1 }, py: { xs: 0.45, sm: 0.52 }, maxWidth: "100%", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                <Typography component="span" sx={{ fontSize: "inherit", fontWeight: "inherit", lineHeight: "inherit", color: "inherit", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{catName}</Typography>
              </Box>
            );
          })}
        </Box>
      </Box>


      <Box sx={{
        position: "absolute", bottom: 0, insetInlineStart: 0, insetInlineEnd: 0, zIndex: 2,
        px: { xs: 1.2, sm: 1.35, md: 1.4 }, py: { xs: 1, sm: 1.05, md: 1.15 },
        backgroundColor: finalImageUrl ? "rgba(8,14,28,0.72)" : isDark ? "rgba(15,23,42,0.78)" : "rgba(255,255,255,0.92)",
        backdropFilter: "blur(18px) saturate(1.15)", WebkitBackdropFilter: "blur(18px) saturate(1.15)",
        borderTop: `1px solid ${isDark || finalImageUrl ? "rgba(255,255,255,0.10)" : "rgba(226,232,240,0.95)"}`,
        borderBottomLeftRadius: { xs: "20px", sm: "22px" },
        borderBottomRightRadius: { xs: "20px", sm: "22px" },
        overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1,
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.7, sm: 0.85 }, minWidth: 0, flex: 1 }}>
          <Box sx={{ width: { xs: 28, sm: 30 }, height: { xs: 28, sm: 30 }, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, backgroundColor: alpha(tone.main, 0.14), border: `1px solid ${alpha(tone.main, 0.22)}`, color: tone.main }}>
            <PlaceRounded sx={{ fontSize: { xs: 15, sm: 16 } }} />
          </Box>
          <Box sx={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 0.15, flex: 1 }}>
            <Typography noWrap sx={{ fontFamily: theme.custom.font.body, color: finalImageUrl ? "#FFFFFF" : isDark ? "#f8fafc" : "#0f172a", fontWeight: 750, fontSize: { xs: "0.82rem", sm: "0.86rem" }, lineHeight: 1.15, overflow: "hidden", textOverflow: "ellipsis" }}>{displayCityName}</Typography>
            <Typography noWrap sx={{ fontFamily: theme.custom.font.body, color: finalImageUrl ? "rgba(255,255,255,0.78)" : isDark ? "#94a3b8" : "#64748b", fontSize: { xs: "0.72rem", sm: "0.76rem" }, fontWeight: 500, lineHeight: 1 }}>{created}</Typography>
          </Box>
        </Box>
        <Box
          onClick={(e) => { e.preventDefault(); handleViewDetails(); }}
          sx={{
            flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 0.55,
            px: { xs: 1.15, sm: 1.35 }, py: { xs: 0.62, sm: 0.68 },
            borderRadius: "999px", background: `linear-gradient(135deg, ${tone.main} 0%, ${alpha(tone.main, 0.88)} 100%)`,
            color: "#fff", fontWeight: 800, fontSize: { xs: "11px", sm: "11.5px" }, letterSpacing: 0.35, lineHeight: 1, whiteSpace: "nowrap",
            boxShadow: `0 6px 16px ${alpha(tone.main, 0.32)}, 0 1px 3px rgba(0,0,0,0.18)`, border: `1px solid ${alpha("#fff", 0.16)}`,
            transition: "transform 0.2s ease, filter 0.2s ease, box-shadow 0.2s ease",
            "&:hover": { filter: "brightness(1.06)", transform: "translateY(-1px)", boxShadow: `0 8px 20px ${alpha(tone.main, 0.38)}, 0 2px 6px rgba(0,0,0,0.18)` },
            "&:active": { transform: "translateY(0px)" },
          }}
        >
          <span>{t("view") || "View"}</span>
          <ArrowOutwardRounded sx={{ fontSize: { xs: 14, sm: 15 } }} />
        </Box>
      </Box>
    </Box>
  );
};

export default RecentPosts;
