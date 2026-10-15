import { Box, Typography, useTheme, Card, CardContent, useMediaQuery, Button, alpha, lighten } from "@mui/material";
import { useGetCategoriesQuery } from "../../features/dependencies/dependenciesApiSlice";
import SkeletonBlock from "../SkeletonBlock";
import { getCategoryIcon, getCategoryColor, sortCategoriesForBrowse } from "../../config/categories";
import { useTranslation } from "../../utils/translations";
import { useLanguage } from "../../utils/languageContext";
import { useNavigate, Link } from "react-router-dom";
import { ExpandMore, ExpandLess } from "@mui/icons-material";
import { useRef, useState } from "react";
import { gsap, useGSAP } from "../../utils/gsapSetup";
import CyberDotMatrix from "./CyberDotMatrix";

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

  const brandPrimary = theme.custom.color.brandPrimary;
  const brandLogo = theme.custom.color.brandLogo;

  // Dash.js's reveal choreography (useDashboardMotion) staggers the cards
  // that exist when this section first scrolls into view. The ones "show all"
  // adds afterwards mount too late for it, so they get their own matching
  // entrance here instead of appearing instantly mid-page.
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
    ...theme.custom.sectionCard,
    padding: { xs: "1.5rem", sm: "2.5rem", md: "1.75rem 2rem 2rem" },
  };

  const headerTitle = (
    <Box sx={{ maxWidth: 640, mx: "auto", mb: { xs: 2.5, md: 3 }, textAlign: "center" }}>
      <Typography
        variant="h4"
        fontWeight="700"
        sx={{
          fontFamily: theme.custom.font.display,
          fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
          mt: 0.5,
          display: "inline-block",
          backgroundImage: `linear-gradient(135deg, ${brandPrimary} 0%, ${lighten(brandPrimary, 0.45)} 100%)`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          letterSpacing: "-0.01em",
        }}
      >
        {t("browseByCategory")}
      </Typography>
    </Box>
  );

  if (isError) {
    return (
      <Box sx={cardContainerSx}>
        <CyberDotMatrix
          idPrefix="dots-categories-error"
          inverted={true}
        />
        <Box sx={{ position: "relative", zIndex: 1, textAlign: 'center', p: 4 }}>
          {headerTitle}
          <Typography color="error">{t("errorLoadingData") || "Error loading categories"}</Typography>
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
        <CyberDotMatrix
          idPrefix="dots-categories-loading"
          inverted={true}
        />
        <Box sx={{ position: "relative", zIndex: 1 }}>
          {headerTitle}
          <Box
            sx={{
              display: 'grid',
              gap: { xs: 1.5, sm: 2 },
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' },
            }}
          >
            {Array.from({ length: collapsedCount }).map((_, i) => (
              <SkeletonBlock
                key={i}
                radius={theme.custom.radius.lg}
                sx={{ height: { xs: 116, sm: 130 } }}
              />
            ))}
          </Box>
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
      {/* Cyber dot matrix SVG background — matches Process.jsx / GuidedSearchDialog */}
      <CyberDotMatrix
        idPrefix="dots-categories"
        inverted={true}
      />

      <Box sx={{ position: "relative", zIndex: 1 }}>
        {headerTitle}

        <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
          <Box
            ref={gridRef}
            sx={{
              display: 'grid',
              gap: { xs: 1.5, sm: 2 },
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
                        minHeight: { xs: 116, sm: 130 },
                        position: 'relative',
                        overflow: 'hidden',
                        textDecoration: 'none',
                        color: 'inherit',
                        borderRadius: { xs: '16px', sm: '18px' },
                        background: isDark
                          ? `linear-gradient(145deg, rgba(15, 23, 42, 0.75) 0%, ${alpha(iconColor, 0.16)} 100%)`
                          : `linear-gradient(145deg, rgba(255, 255, 255, 0.88) 0%, ${alpha(iconColor, 0.10)} 100%)`,
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        border: `1px solid ${isDark ? alpha(iconColor, 0.24) : alpha(iconColor, 0.18)}`,
                        boxShadow: isDark
                          ? '0 4px 20px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.06)'
                          : '0 4px 18px rgba(15, 23, 42, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.95)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        transition: 'all 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
                        cursor: 'pointer',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          borderColor: isDark ? alpha(iconColor, 0.65) : iconColor,
                          boxShadow: isDark
                            ? `0 12px 28px -6px ${alpha(iconColor, 0.38)}, 0 0 16px ${alpha(iconColor, 0.22)}`
                            : `0 12px 24px -6px ${alpha(iconColor, 0.24)}, 0 2px 10px rgba(0,0,0,0.04)`,
                          '& .category-icon-badge': {
                            transform: 'scale(1.12)',
                            backgroundColor: isDark ? alpha(iconColor, 0.32) : alpha(iconColor, 0.22),
                            borderColor: isDark ? alpha(iconColor, 0.7) : iconColor,
                            boxShadow: `0 0 18px ${alpha(iconColor, isDark ? 0.45 : 0.35)}`,
                          },
                          '& .category-label': {
                            color: isDark ? '#ffffff' : (iconColor || theme.custom.color.ink),
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
                          p: { xs: 2, sm: 2.5 },
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textAlign: 'center',
                          height: '100%',
                          '&:last-child': { pb: { xs: 2, sm: 2.5 } },
                        }}
                      >
                        <Box
                          className="category-icon-badge"
                          sx={{
                            width: { xs: 44, sm: 48 },
                            height: { xs: 44, sm: 48 },
                            borderRadius: '50%',
                            backgroundColor: isDark ? alpha(iconColor, 0.20) : alpha(iconColor, 0.12),
                            border: `1px solid ${isDark ? alpha(iconColor, 0.35) : alpha(iconColor, 0.25)}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 1.5,
                            transition: 'all 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: isDark
                              ? `0 2px 10px ${alpha(iconColor, 0.25)}`
                              : `0 2px 8px ${alpha(iconColor, 0.12)}`,
                          }}
                        >
                          <IconComponent sx={{ color: iconColor, fontSize: { xs: '22px', sm: '24px' } }} />
                        </Box>
                        <Typography
                          className="category-label"
                          variant="body1"
                          align="center"
                          sx={{
                            fontFamily: theme.custom.font.display,
                            fontWeight: 700,
                            color: theme.custom.color.ink,
                            lineHeight: 1.3,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textAlign: 'center',
                            fontSize: { xs: '13px', sm: '14px' },
                            transition: 'color 0.25s ease',
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
          <Box display="flex" justifyContent="center" mt={3.5}>
            <Button
              onClick={toggleShowAllCategories}
              endIcon={showAllCategories ? <ExpandLess /> : <ExpandMore />}
              sx={{
                color: isDark ? '#ffffff' : '#0f172a',
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.1)'}`,
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                borderRadius: '999px',
                px: 3.5,
                py: 1,
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.9rem',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  backgroundColor: isDark ? 'rgba(0, 242, 254, 0.12)' : 'rgba(0, 114, 255, 0.08)',
                  borderColor: isDark ? 'rgba(0, 242, 254, 0.5)' : theme.custom.color.brandPrimary,
                  color: isDark ? '#00F2FE' : theme.custom.color.brandPrimary,
                  transform: 'translateY(-2px)',
                  boxShadow: isDark
                    ? '0 6px 20px rgba(0, 242, 254, 0.2)'
                    : '0 6px 16px rgba(0, 114, 255, 0.15)',
                },
              }}
            >
              {showAllCategories ? t('showLess') : t('showAllCategories')}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Categories;