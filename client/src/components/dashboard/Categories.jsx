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

  // Google SaaS Tonal Tokens
  const hairline =
    theme.custom?.color?.hairlineBorder ||
    (isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(15, 23, 42, 0.06)");
  const ink = theme.custom?.color?.ink || (isDark ? "#EDEFF5" : "#0B1220");
  const nestedCardBg =
    theme.custom?.color?.surfaceNested || (isDark ? "#27272A" : "#F1F5F9");

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
    backgroundColor: theme.custom?.color?.surfaceRaised || (isDark ? "#18181B" : "#FFFFFF"),
    border: `1px solid ${hairline}`,
    borderRadius: { xs: "18px", sm: "22px" },
    boxShadow: isDark
      ? "0 4px 24px rgba(0, 0, 0, 0.25)"
      : "0 1px 3px rgba(15, 23, 42, 0.03), 0 8px 24px rgba(15, 23, 42, 0.04)",
    overflow: "hidden",
    px: { xs: 2, sm: 2.75, md: 3 },
    py: { xs: 2.25, sm: 2.75, md: 3 },
  };

  const headerTitle = (
    <Box sx={{ maxWidth: 640, mx: "auto", mb: { xs: 2, sm: 2.5 }, textAlign: "center" }}>
      <Typography
        component="h2"
        sx={{
          fontFamily: `'Plus Jakarta Sans', ${theme.custom?.font?.display || "sans-serif"}, sans-serif`,
          fontWeight: 600,
          fontSize: { xs: "15px", sm: "17px" },
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
        <Box sx={{ textAlign: "center", p: 2 }}>
          {headerTitle}
          <Typography
            sx={{
              fontFamily: `'Inter', ${theme.custom?.font?.body || "sans-serif"}, sans-serif`,
              fontSize: "13px",
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
            gap: { xs: 1.25, sm: 1.5 },
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
              radius={16}
              sx={{ height: { xs: 110, sm: 120 } }}
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
            gap: { xs: 1.25, sm: 1.5 },
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
                      minHeight: { xs: 110, sm: 120 },
                      position: "relative",
                      overflow: "hidden",
                      textDecoration: "none",
                      color: "inherit",
                      borderRadius: "16px",
                      backgroundColor: nestedCardBg,
                      border: `1px solid ${hairline}`,
                      boxShadow: "none",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      transition:
                        "transform 180ms cubic-bezier(0.4, 0, 0.2, 1), background-color 180ms ease, border-color 180ms ease, box-shadow 180ms ease",
                      cursor: "pointer",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        backgroundColor: isDark
                          ? alpha(iconColor, 0.12)
                          : alpha("#FFFFFF", 0.95),
                        borderColor: alpha(iconColor, isDark ? 0.36 : 0.26),
                        boxShadow: isDark
                          ? "0 6px 20px rgba(0, 0, 0, 0.35)"
                          : "0 6px 18px rgba(15, 23, 42, 0.08)",
                        "& .category-icon-badge": {
                          transform: "scale(1.06)",
                          borderColor: alpha(iconColor, isDark ? 0.45 : 0.35),
                          backgroundColor: alpha(iconColor, isDark ? 0.26 : 0.18),
                        },
                      },
                      "&:focus-visible": {
                        outline: "2px solid #0B57D0",
                        outlineOffset: "2px",
                      },
                    }}
                  >
                    <CardContent
                      sx={{
                        p: { xs: 1.75, sm: 2 },
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        height: "100%",
                        "&:last-child": { pb: { xs: 1.75, sm: 2 } },
                      }}
                    >
                      <Box
                        className="category-icon-badge"
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: "12px",
                          backgroundColor: alpha(iconColor, isDark ? 0.18 : 0.12),
                          border: `1px solid ${alpha(iconColor, isDark ? 0.30 : 0.20)}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mb: 1.25,
                          transition:
                            "transform 180ms cubic-bezier(0.4, 0, 0.2, 1), border-color 180ms ease, background-color 180ms ease",
                        }}
                      >
                        <IconComponent sx={{ color: iconColor, fontSize: 20 }} />
                      </Box>
                      <Typography
                        className="category-label"
                        align="center"
                        sx={{
                          fontFamily: `'Inter', ${theme.custom?.font?.body || "sans-serif"}, sans-serif`,
                          fontWeight: 500,
                          color: ink,
                          lineHeight: 1.35,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          textAlign: "center",
                          fontSize: { xs: "12.5px", sm: "13px" },
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
        <Box display="flex" justifyContent="center" mt={{ xs: 2.5, sm: 3 }}>
          <Button
            onClick={toggleShowAllCategories}
            endIcon={
              showAllCategories ? (
                <ExpandLess sx={{ fontSize: 18 }} />
              ) : (
                <ExpandMore sx={{ fontSize: 18 }} />
              )
            }
            sx={{
              color: ink,
              backgroundColor: isDark
                ? "rgba(255, 255, 255, 0.05)"
                : "rgba(15, 23, 42, 0.04)",
              border: `1px solid ${hairline}`,
              borderRadius: "9999px",
              px: 3,
              py: 0.85,
              textTransform: "none",
              fontFamily: `'Plus Jakarta Sans', ${theme.custom?.font?.display || "sans-serif"}, sans-serif`,
              fontWeight: 500,
              fontSize: "14px",
              letterSpacing: "-0.01em",
              transition:
                "border-color 180ms ease, background-color 180ms ease, color 180ms ease, box-shadow 180ms ease",
              "&:hover": {
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.10)"
                  : alpha("#0B57D0", 0.08),
                borderColor: isDark
                  ? "rgba(255, 255, 255, 0.22)"
                  : alpha("#0B57D0", 0.32),
                color: isDark ? "#FFFFFF" : "#0B57D0",
              },
              "&:focus-visible": {
                outline: "2px solid #0B57D0",
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
