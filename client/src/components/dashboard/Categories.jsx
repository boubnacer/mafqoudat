import { Box, Typography, useTheme, Card, CardContent, useMediaQuery, Button, alpha } from "@mui/material";
import { useGetCategoriesQuery } from "../../features/dependencies/dependenciesApiSlice";
import SkeletonBlock from "../SkeletonBlock";
import { getCategoryIcon, getCategoryColor, sortCategoriesForBrowse } from "../../config/categories";
import { useTranslation } from "../../utils/translations";
import { useLanguage } from "../../utils/languageContext";
import { useNavigate, Link } from "react-router-dom";
import { ExpandMore, ExpandLess } from "@mui/icons-material";
import { useRef, useState } from "react";
import { gsap, useGSAP } from "../../utils/gsapSetup";

const CATEGORY_COLLAPSED_SMALL_COUNT = 4;
const CATEGORY_COLLAPSED_DESKTOP_COUNT = 5;

const Categories = () => {
  const { currentLanguage } = useLanguage();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const isDark = theme.palette.mode === 'dark';
  const { t } = useTranslation();
  const [showAllCategories, setShowAllCategories] = useState(false);
  const gridRef = useRef(null);
  const collapsedCount = isDesktop ? CATEGORY_COLLAPSED_DESKTOP_COUNT : CATEGORY_COLLAPSED_SMALL_COUNT;

  const hairline = isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)";
  const muted = isDark ? "#94A3B8" : "#64748B";
  const ink = theme.custom.color.ink;

  useGSAP(
    () => {
      if (!showAllCategories || !gridRef.current) return;
      const cards = gsap.utils.toArray(gridRef.current.querySelectorAll("[data-reveal-item]"));
      const added = cards.slice(collapsedCount);
      if (!added.length) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(added, { autoAlpha: 0, y: 20, duration: 0.5, stagger: 0.06 });
      });
    },
    { scope: gridRef, dependencies: [showAllCategories, collapsedCount], revertOnUpdate: true }
  );

  const { categories, isLoading, isFetching, isError } = useGetCategoriesQuery({
    language: currentLanguage
  }, {
    selectFromResult: ({ data, isLoading, isFetching, isError }) => ({
      categories: data?.ids.map((id) => data?.entities[id]),
      isLoading,
      isFetching,
      isError
    }),
  });

  const cardContainerSx = {
    position: 'relative',
    backgroundColor: theme.custom.color.surfaceRaised,
    border: `1px solid ${hairline}`,
    borderRadius: "16px",
    boxShadow: theme.custom.elevation.e1,
    overflow: 'hidden',
    padding: { xs: "1.5rem 1.25rem", sm: "1.75rem 1.5rem", md: "1.75rem 1.75rem 1.5rem" },
  };

  const headerTitle = (
    <Box sx={{ maxWidth: 640, mx: "auto", mb: 2, textAlign: "center" }}>
      <Typography
        sx={{
          fontFamily: theme.custom.font.display,
          fontWeight: 650,
          fontSize: { xs: "15px", sm: "16px" },
          letterSpacing: "-0.01em",
          lineHeight: 1.3,
          color: ink,
        }}
      >
        {t("browseByCategory")}
      </Typography>
    </Box>
  );

  if (isError) {
    return (
      <Box sx={cardContainerSx}>
        <Box sx={{ textAlign: 'center', p: 2 }}>
          {headerTitle}
          <Typography sx={{ fontFamily: theme.custom.font.body, fontSize: "13px", color: theme.custom.status.lost.main }}>{t("errorLoadingData") || "Error loading categories"}</Typography>
        </Box>
      </Box>
    );
  }

  const toggleShowAllCategories = () => {
    setShowAllCategories(!showAllCategories);
  };

  if (!categories || isLoading || isFetching) {
    return (
      <Box sx={cardContainerSx}>
        {headerTitle}
        <Box
          sx={{
            display: 'grid',
            gap: { xs: 1, sm: 1.25 },
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' },
          }}
        >
          {Array.from({ length: collapsedCount }).map((_, i) => (
            <SkeletonBlock
              key={i}
              radius={12}
              sx={{ height: { xs: 110, sm: 118 } }}
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

      <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
        <Box
          ref={gridRef}
          sx={{
            display: 'grid',
            gap: { xs: 1, sm: 1.25 },
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' },
          }}
        >
          {visibleCategories.map(({ _id, code, labels }) => {
            const IconComponent = getCategoryIcon(code);
            const iconColor = getCategoryColor(code);
            const label = code === 'ELECTRONICS'
              ? t('categoryElectronics')
              : code === 'PHONES'
              ? t('categoryPhones')
              : code === 'LAPTOPS'
              ? t('categoryLaptops')
              : code === 'CHARGERS'
              ? t('categoryChargers')
              : code === 'POWERBANKS'
              ? t('categoryPowerbanks')
              : code === 'STORAGE'
              ? t('categoryStorage')
              : code === 'DOCUMENTS'
              ? t('categoryDocuments')
              : (labels[currentLanguage] || labels.en);

            const categoryHref = `/posts?category=${encodeURIComponent(code ? code.toLowerCase() : _id)}`;

            return (
              <Box key={_id}>
                <Box data-reveal-item="" sx={{ height: '100%' }}>
                  <Card
                    component={Link}
                    to={categoryHref}
                    elevation={0}
                    sx={{
                      height: '100%',
                      minHeight: { xs: 110, sm: 118 },
                      position: 'relative',
                      overflow: 'hidden',
                      textDecoration: 'none',
                      color: 'inherit',
                      borderRadius: "12px",
                      backgroundColor: theme.custom.color.surfaceRaised,
                      border: `1px solid ${hairline}`,
                      boxShadow: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      transition: 'border-color 160ms ease, box-shadow 160ms ease',
                      cursor: 'pointer',
                      '&:hover': {
                        borderColor: alpha(iconColor, isDark ? 0.22 : 0.18),
                        boxShadow: theme.custom.elevation.e1,
                        '& .category-icon-badge': {
                          borderColor: alpha(iconColor, isDark ? 0.32 : 0.22),
                          backgroundColor: alpha(iconColor, isDark ? 0.14 : 0.09),
                        },
                      },
                      '&:focus-visible': {
                        outline: `2px solid ${theme.custom.color.brandPrimary}`,
                        outlineOffset: '2px',
                      },
                    }}
                  >
                    <CardContent
                      sx={{
                        p: { xs: 1.75, sm: 2 },
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        height: '100%',
                        '&:last-child': { pb: { xs: 1.75, sm: 2 } },
                      }}
                    >
                      <Box
                        className="category-icon-badge"
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: "9px",
                          backgroundColor: alpha(iconColor, isDark ? 0.12 : 0.08),
                          border: `1px solid ${alpha(iconColor, isDark ? 0.18 : 0.12)}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 1.25,
                          transition: 'border-color 160ms ease, background-color 160ms ease',
                        }}
                      >
                        <IconComponent sx={{ color: iconColor, fontSize: 17 }} />
                      </Box>
                      <Typography
                        className="category-label"
                        align="center"
                        sx={{
                          fontFamily: theme.custom.font.body,
                          fontWeight: 600,
                          color: ink,
                          lineHeight: 1.3,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textAlign: 'center',
                          fontSize: "12.5px",
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
        <Box display="flex" justifyContent="center" mt={2}>
          <Button
            onClick={toggleShowAllCategories}
            endIcon={showAllCategories ? <ExpandLess sx={{ fontSize: 16 }} /> : <ExpandMore sx={{ fontSize: 16 }} />}
            sx={{
              color: muted,
              backgroundColor: "transparent",
              border: `1px solid ${hairline}`,
              borderRadius: "10px",
              px: 2.25,
              py: 0.65,
              textTransform: 'none',
              fontFamily: theme.custom.font.body,
              fontWeight: 600,
              fontSize: '12.5px',
              letterSpacing: "-0.01em",
              transition: 'border-color 160ms ease, background-color 160ms ease, color 160ms ease',
              '&:hover': {
                backgroundColor: alpha(theme.custom.color.ink, isDark ? 0.05 : 0.04),
                borderColor: isDark ? "rgba(255,255,255,0.14)" : "rgba(15,23,42,0.14)",
                color: ink,
              },
              '&:focus-visible': {
                outline: `2px solid ${theme.custom.color.brandPrimary}`,
                outlineOffset: 1,
              },
            }}
          >
            {showAllCategories ? t('showLess') : t('showAllCategories')}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default Categories;
