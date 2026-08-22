import { Box, Typography, useTheme, Grid, Card, CardContent, useMediaQuery, Button, alpha } from "@mui/material";
import { useGetCategoriesQuery } from "../../features/dependencies/dependenciesApiSlice";
import SkeletonBlock from "../SkeletonBlock";
import { getCategoryIcon, getCategoryColor } from "../../config/categories";
import { useTranslation } from "../../utils/translations";
import { useLanguage } from "../../utils/languageContext";
import { useNavigate } from "react-router-dom";
import { ExpandMore, ExpandLess } from "@mui/icons-material";
import { useRef, useState } from "react";
import { gsap, useGSAP } from "../../utils/gsapSetup";

const CATEGORY_COLLAPSED_SMALL_COUNT = 4;

const Categories = () => {
  const { currentLanguage } = useLanguage();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isDark = theme.palette.mode === 'dark';
  const { t } = useTranslation();
  const [showAllCategories, setShowAllCategories] = useState(false);
  const gridRef = useRef(null);

  // Dash.js's reveal choreography (useDashboardMotion) staggers the cards
  // that exist when this section first scrolls into view. The ones "show all"
  // adds afterwards mount too late for it, so they get their own matching
  // entrance here instead of appearing instantly mid-page.
  useGSAP(
    () => {
      if (!showAllCategories || !gridRef.current) return;
      const cards = gsap.utils.toArray(gridRef.current.querySelectorAll("[data-reveal-item]"));
      const added = cards.slice(CATEGORY_COLLAPSED_SMALL_COUNT);
      if (!added.length) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(added, { autoAlpha: 0, y: 20, duration: 0.5, stagger: 0.06 });
      });
    },
    { scope: gridRef, dependencies: [showAllCategories], revertOnUpdate: true }
  );
  
  const { categories, isLoading, isFetching } = useGetCategoriesQuery({
    language: currentLanguage
  }, {
    selectFromResult: ({ data, isLoading, isFetching }) => ({
      categories: data?.ids.map((id) => data?.entities[id]),
      isLoading,
      isFetching
    }),
  });

  const handleCategoryClick = (categoryId) => {
    navigate("/dash/posts", { 
      state: { 
        categoryFilter: categoryId,
        fromCategory: true 
      } 
    });
  };

  const toggleShowAllCategories = () => {
    setShowAllCategories(!showAllCategories);
  };

  if (!categories || isLoading || isFetching) {
    return (
      <Box sx={{ py: 4 }}>
        <Grid container spacing={isMobile ? 2 : 3} justifyContent="center">
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <SkeletonBlock
                radius={theme.custom.radius.lg}
                sx={{ height: i === 0 ? 180 : 130 }}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  const [featuredCategory, ...rest] = categories || [];
  const hasMoreCategories = rest.length > CATEGORY_COLLAPSED_SMALL_COUNT;
  const visibleRest = showAllCategories ? rest : rest.slice(0, CATEGORY_COLLAPSED_SMALL_COUNT);


  return (
    <Box sx={{ py: 4 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5,
          maxWidth: '1200px',
          mx: 'auto',
        }}
      >
        {featuredCategory && (() => {
          const code = featuredCategory.code;
          const IconComponent = getCategoryIcon(code);
          const iconColor = getCategoryColor(code);
          const tint = alpha(iconColor, isDark ? 0.2 : 0.12);
          const badgeBg = isDark ? 'rgba(0,0,0,0.28)' : 'rgba(255,255,255,0.55)';
          const label = featuredCategory.labels[currentLanguage] || featuredCategory.labels.en;

          return (
            <Box data-reveal-item="" sx={{ width: '100%' }}>
              <Card
                onClick={() => handleCategoryClick(featuredCategory._id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCategoryClick(featuredCategory._id);
                  }
                }}
                role="button"
                tabIndex={0}
                elevation={0}
                sx={{
                  position: 'relative',
                  overflow: 'hidden',
                  backgroundColor: tint,
                  borderRadius: `${theme.custom.radius.lg}px`,
                  cursor: 'pointer',
                  border: 'none',
                  boxShadow: 'none',
                  minHeight: { xs: 150, sm: 170 },
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.custom.elevation?.e2 || '0 4px 20px rgba(0,0,0,0.08)',
                    '& .category-ghost-icon': {
                      transform: 'scale(1.05)',
                    },
                    '& .category-icon-badge': {
                      transform: 'scale(1.08)',
                    },
                  },
                  '&:focus-visible': {
                    outline: `2px solid ${theme.custom.color.brandPrimary}`,
                    outlineOffset: '2px',
                  },
                }}
              >
                <Box
                  className="category-ghost-icon"
                  sx={{
                    position: 'absolute',
                    right: { xs: -20, sm: -15 },
                    bottom: { xs: -20, sm: -15 },
                    color: iconColor,
                    opacity: 0.15,
                    fontSize: { xs: '110px', sm: '140px' },
                    pointerEvents: 'none',
                    transition: 'transform 0.3s ease',
                  }}
                >
                  <IconComponent sx={{ fontSize: 'inherit' }} />
                </Box>
                <CardContent
                  sx={{
                    p: { xs: 3, sm: 4 },
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    height: '100%',
                    zIndex: 1,
                  }}
                >
                  <Box
                    className="category-icon-badge"
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: '50%',
                      backgroundColor: badgeBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2,
                      transition: 'transform 0.3s ease',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    }}
                  >
                    <IconComponent sx={{ color: iconColor, fontSize: '26px' }} />
                  </Box>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      color: theme.custom.color.ink,
                      lineHeight: 1.2,
                    }}
                  >
                    {label}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          );
        })()}
      
        <Grid container spacing={2} ref={gridRef}>
          {visibleRest.map(({ _id, code, labels }) => {
            const IconComponent = getCategoryIcon(code);
            const iconColor = getCategoryColor(code);
            const tint = alpha(iconColor, isDark ? 0.2 : 0.12);
            const badgeBg = isDark ? 'rgba(0,0,0,0.28)' : 'rgba(255,255,255,0.55)';
            const label = labels[currentLanguage] || labels.en;

            return (
              <Grid item xs={6} sm={6} md={3} key={_id}>
                <Box data-reveal-item="" sx={{ height: '100%' }}>
                  <Card
                    onClick={() => handleCategoryClick(_id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleCategoryClick(_id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    elevation={0}
                    sx={{
                      height: '100%',
                      minHeight: { xs: 120, sm: 135 },
                      backgroundColor: tint,
                      borderRadius: `${theme.custom.radius.lg}px`,
                      cursor: 'pointer',
                      border: 'none',
                      boxShadow: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: theme.custom.elevation?.e1 || '0 2px 12px rgba(0,0,0,0.06)',
                        '& .category-icon-badge': {
                          transform: 'scale(1.08)',
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
                        p: { xs: 2.5, sm: 3 },
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        height: '100%',
                      }}
                    >
                      <Box
                        className="category-icon-badge"
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          backgroundColor: badgeBg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 1.5,
                          transition: 'transform 0.3s ease',
                          boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
                        }}
                      >
                        <IconComponent sx={{ color: iconColor, fontSize: '20px' }} />
                      </Box>
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 600,
                          color: theme.custom.color.ink,
                          lineHeight: 1.3,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          fontSize: { xs: '13px', sm: '14px' },
                        }}
                      >
                        {label}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Box>

      {hasMoreCategories && (
        <Box display="flex" justifyContent="center" mt={3}>
        <Button
          onClick={toggleShowAllCategories}
          variant="outlined"
          endIcon={showAllCategories ? <ExpandLess /> : <ExpandMore />}
          sx={{
            color: theme.custom.color.ink,
            borderColor: alpha(theme.custom.color.ink, 0.24),
            backgroundColor: 'transparent',
            borderRadius: `${theme.custom.radius.sm}px`,
            px: 3,
            py: 1,
            textTransform: 'none',
            fontWeight: 600,
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: alpha(theme.custom.color.ink, 0.08),
              borderColor: alpha(theme.custom.color.ink, 0.32),
            },
            '&:active': {
              backgroundColor: alpha(theme.custom.color.ink, 0.12),
            }
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