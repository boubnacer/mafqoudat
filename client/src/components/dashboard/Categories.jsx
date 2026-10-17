import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Typography,
  useTheme,
  Card,
  CardContent,
  useMediaQuery,
  Button,
  alpha,
} from "@mui/material";
import { ExpandMore, ExpandLess } from "@mui/icons-material";
import { useGetCategoriesQuery } from "../../features/dependencies/dependenciesApiSlice";
import SkeletonBlock from "../SkeletonBlock";
import {
  getCategoryIcon,
  getCategoryColor,
  sortCategoriesForBrowse,
} from "../../config/categories";
import { useTranslation } from "../../utils/translations";
import { useLanguage } from "../../utils/languageContext";
import { gsap, useGSAP } from "../../utils/gsapSetup";

const CATEGORY_COLLAPSED_SMALL_COUNT = 4;
const CATEGORY_COLLAPSED_DESKTOP_COUNT = 5;

const Categories = () => {
  const { currentLanguage } = useLanguage();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const isDark = theme.palette.mode === "dark";
  const { t } = useTranslation();
  const [showAllCategories, setShowAllCategories] = useState(false);
  const gridRef = useRef(null);
  const collapsedCount = isDesktop
    ? CATEGORY_COLLAPSED_DESKTOP_COUNT
    : CATEGORY_COLLAPSED_SMALL_COUNT;

  // Modern SaaS Tonal Tokens
  const hairline =
    theme.custom?.color?.hairlineBorder ||
    (isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(226, 232, 240, 0.85)");
  const ink = theme.custom?.color?.ink || (isDark ? "#EDEFF5" : "#0B1220");
  const nestedCardBg = isDark
    ? theme.custom?.color?.surfaceNested || "#202534"
    : "#F8FAFC";
  const parentCardBg =
    theme.custom?.color?.surfaceRaised || (isDark ? "#121826" : "#FFFFFF");
  const primaryBrand =
    theme.custom?.color?.brandPrimary || theme.palette.primary?.main || "#1B4DFF";

  useGSAP(
    () => {
      if (!showAllCategories || !gridRef.current) return;
      const cards = gsap.utils.toArray(
        gridRef.current.querySelectorAll("[data-reveal-item]")
      );
      const added = cards.slice(collapsedCount);
      if (!added.length) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(added, {
          autoAlpha: 0,
          y: 20,
          duration: 0.45,
          stagger: 0.05,
          ease: "power2.out",
        });
      });
    },
    {
      scope: gridRef,
      dependencies: [showAllCategories, collapsedCount],
      revertOnUpdate: true,
    }
  );

  const { categories, isLoading, isFetching, isError } = useGetCategoriesQuery(
    { language: currentLanguage },
    {
      selectFromResult: ({ data, isLoading, isFetching, isError }) => ({
        categories: data?.ids.map((id) => data?.entities[id]),
        isLoading,
        isFetching,
        isError,
      }),
    }
  );

  const cardContainerSx = {
    position: "relative",
    backgroundColor: parentCardBg,
    border: `1px solid ${hairline}`,
    borderRadius: { xs: "20px", sm: "24px" },
    boxShadow: isDark
      ? "0 4px 24px rgba(0, 0, 0, 0.35)"
      : "0 1px 3px rgba(15, 23, 42, 0.03), 0 8px 24px rgba(15, 23, 42, 0.04)",
    overflow: "hidden",
    px: { xs: 2.5, sm: 3, md: 3.5 },
    py: { xs: 2.75, sm: 3.25, md: 3.5 },
  };

  const headerTitle = (
    <Box sx={{ maxWidth: 640, mx: "auto", mb: { xs: 2.5, sm: 3 }, textAlign: "center" }}>
      <Typography
        component="h2"
        sx={{
          fontFamily: `'Plus Jakarta Sans', ${theme.custom?.font?.display || "sans-serif"}, sans-serif`,
          fontWeight: 700,
          fontSize: { xs: "1.25rem", sm: "1.375rem", md: "1.25rem" },
          lineHeight: 1.3,
          letterSpacing: "-0.015em",
          color: ink,
          textAlign: "center",
        }}
      >
        {t("browseByCategory")}
      </Typography>
    </Box>
  );

  if (isError) {
    return (
      <Box sx={cardContainerSx}>
        <Box sx={{ textAlign: "center", p: { xs: 3, md: 4 } }}>
          {headerTitle}
          <Typography
            sx={{
              fontFamily: `'Inter', ${theme.custom?.font?.body || "sans-serif"}, sans-serif`,
              fontSize: { xs: "16px", md: "14px" },
              color: theme.custom?.status?.lost?.main || "#C64335",
            }}
          >
            {t("errorLoadingData") || "Error loading categories"}
          </Typography>
        </Box>
      </Box>
    );
  }

  const toggleShowAllCategories = () => {
    setShowAllCategories((prev) => !prev);
  };

  if (!categories || isLoading || isFetching) {
    return (
      <Box sx={cardContainerSx}>
        {headerTitle}
        <Box
          sx={{
            display: "grid",
            gap: { xs: 1.5, sm: 2, md: 2 },
            gridTemplateColumns: {
              xs: "repeat(2, 1fr)",
              sm: "repeat(3, 1fr)",
              md: "repeat(5, 1fr)",
            },
          }}
        >
          {Array.from({ length: collapsedCount }).map((_, i) => (
            <SkeletonBlock
              key={i}
              radius={18}
              sx={{ height: { xs: 128, sm: 136, md: 124 } }}
            />
          ))}
        </Box>
      </Box>
    );
  }

  const orderedCategories = sortCategoriesForBrowse(categories);
  const hasMoreCategories = orderedCategories.length > collapsedCount;
  const visibleCategories = showAllCategories
    ? orderedCategories
    : orderedCategories.slice(0, collapsedCount);

  return (
    <Box sx={cardContainerSx}>
      {headerTitle}

      <Box sx={{ width: "100%", mx: "auto" }}>
        <Box
          ref={gridRef}
          sx={{
            display: "grid",
            gap: { xs: 1.5, sm: 2, md: 2 },
            gridTemplateColumns: {
              xs: "repeat(2, 1fr)",
              sm: "repeat(3, 1fr)",
              md: "repeat(5, 1fr)",
            },
          }}
        >
          {visibleCategories.map(({ _id, code, labels }) => {
            const IconComponent = getCategoryIcon(code);
            const iconColor = getCategoryColor(code);
            const label =
              code === "ELECTRONICS"
                ? t("categoryElectronics")
                : code === "PHONES"
                ? t("categoryPhones")
                : code === "LAPTOPS"
                ? t("categoryLaptops")
                : code === "CHARGERS"
                ? t("categoryChargers")
                : code === "POWERBANKS"
                ? t("categoryPowerbanks")
                : code === "STORAGE"
                ? t("categoryStorage")
                : code === "DOCUMENTS"
                ? t("categoryDocuments")
                : labels[currentLanguage] || labels.en;

            const categoryHref = `/posts?category=${encodeURIComponent(
              code ? code.toLowerCase() : _id
            )}`;

            return (
              <Box key={_id}>
                <Box data-reveal-item="" sx={{ height: "100%" }}>
                  <Card
                    component={Link}
                    to={categoryHref}
                    elevation={0}
                    sx={{
                      height: "100%",
                      minHeight: { xs: 128, sm: 136, md: 124 },
                      position: "relative",
                      overflow: "hidden",
                      textDecoration: "none",
                      color: "inherit",
                      borderRadius: "18px",
                      backgroundColor: nestedCardBg,
                      border: `1px solid ${hairline}`,
                      boxShadow: isDark
                        ? "0 2px 8px rgba(0, 0, 0, 0.25)"
                        : "0 1px 3px rgba(15, 23, 42, 0.03)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      transition:
                        "transform 200ms cubic-bezier(0.4, 0, 0.2, 1), background-color 200ms ease, border-color 200ms ease, box-shadow 200ms ease",
                      cursor: "pointer",
                      "&:hover": {
                        transform: "translateY(-3px)",
                        backgroundColor: isDark
                          ? alpha(iconColor, 0.12)
                          : "#FFFFFF",
                        borderColor: alpha(iconColor, isDark ? 0.42 : 0.32),
                        boxShadow: isDark
                          ? `0 10px 26px -4px rgba(0, 0, 0, 0.5), 0 0 16px ${alpha(iconColor, 0.2)}`
                          : `0 10px 24px -4px rgba(15, 23, 42, 0.08), 0 0 16px ${alpha(iconColor, 0.12)}`,
                        "& .category-icon-badge": {
                          transform: "scale(1.08)",
                          borderColor: alpha(iconColor, isDark ? 0.5 : 0.36),
                          backgroundColor: alpha(iconColor, isDark ? 0.28 : 0.16),
                        },
                      },
                      "&:active": {
                        transform: "translateY(-1px) scale(0.99)",
                      },
                      "&:focus-visible": {
                        outline: `2px solid ${primaryBrand}`,
                        outlineOffset: "2px",
                      },
                    }}
                  >
                    <CardContent
                      sx={{
                        p: { xs: 2.5, sm: 2.75, md: 3 },
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        height: "100%",
                        "&:last-child": {
                          pb: { xs: 2.5, sm: 2.75, md: 3 },
                        },
                      }}
                    >
                      <Box
                        className="category-icon-badge"
                        sx={{
                          width: { xs: 48, md: 44 },
                          height: { xs: 48, md: 44 },
                          borderRadius: "14px",
                          backgroundColor: alpha(iconColor, isDark ? 0.18 : 0.09),
                          border: `1px solid ${alpha(iconColor, isDark ? 0.32 : 0.2)}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mb: { xs: 1.5, md: 1.25 },
                          transition:
                            "transform 200ms cubic-bezier(0.4, 0, 0.2, 1), border-color 200ms ease, background-color 200ms ease",
                        }}
                      >
                        <IconComponent sx={{ color: iconColor, fontSize: { xs: 24, md: 22 } }} />
                      </Box>
                      <Typography
                        className="category-label"
                        align="center"
                        sx={{
                          fontFamily: `'Plus Jakarta Sans', ${theme.custom?.font?.body || "sans-serif"}, sans-serif`,
                          fontWeight: 600,
                          color: ink,
                          lineHeight: 1.35,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          textAlign: "center",
                          fontSize: { xs: "16px", sm: "16px", md: "14px" },
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {label}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      {hasMoreCategories && (
        <Box display="flex" justifyContent="center" mt={{ xs: 3, sm: 3.5 }}>
          <Button
            onClick={toggleShowAllCategories}
            endIcon={
              showAllCategories ? (
                <ExpandLess sx={{ fontSize: 20 }} />
              ) : (
                <ExpandMore sx={{ fontSize: 20 }} />
              )
            }
            sx={{
              color: ink,
              backgroundColor: isDark
                ? "rgba(255, 255, 255, 0.06)"
                : "rgba(15, 23, 42, 0.04)",
              border: `1px solid ${hairline}`,
              borderRadius: "9999px",
              px: { xs: 3.5, sm: 4 },
              py: { xs: 1.25, md: 1 },
              minHeight: "44px",
              minWidth: "160px",
              textTransform: "none",
              fontFamily: `'Plus Jakarta Sans', ${theme.custom?.font?.display || "sans-serif"}, sans-serif`,
              fontWeight: 600,
              fontSize: { xs: "16px", md: "14px" },
              letterSpacing: "-0.01em",
              transition:
                "transform 180ms ease, border-color 180ms ease, background-color 180ms ease, color 180ms ease, box-shadow 180ms ease",
              "&:hover": {
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.12)"
                  : alpha(primaryBrand, 0.08),
                borderColor: isDark
                  ? "rgba(255, 255, 255, 0.24)"
                  : alpha(primaryBrand, 0.35),
                color: isDark ? "#FFFFFF" : primaryBrand,
                transform: "translateY(-1px)",
              },
              "&:active": {
                transform: "scale(0.98)",
              },
              "&:focus-visible": {
                outline: `2px solid ${primaryBrand}`,
                outlineOffset: "2px",
              },
            }}
          >
            {showAllCategories ? t("showLess") : t("showAllCategories")}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default Categories;
