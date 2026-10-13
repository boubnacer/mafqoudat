import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Chip,
  useTheme,
  alpha,
  lighten,
  useMediaQuery,
} from '@mui/material';
import {
  PostAdd as PostAddIcon,
  SearchOffOutlined,
  Language as LanguageIcon,
  FilterAltOffRounded,
  AutoAwesomeRounded,
} from '@mui/icons-material';
import { useTranslation } from '../../../utils/translations';
import { isRTL } from '../../../utils/languageUtils';

const PostsListEmptyState = ({
  selectedCity,
  selectedCategories = [],
  localCategoryFilter = 'all',
  categoriesData = [],
  selectedFl = '',
  foundsId = null,
  hasActiveFilters = false,
  searchTerm = '',
  getCityDisplayName = () => '',
  onAddNewPost,
  onClearFilters,
  onSelectCountry,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isRTLMode = isRTL();
  const { t, currentLanguage } = useTranslation();

  const brand = theme.custom?.color?.brandPrimary || '#00f2fe';
  const brandLogo = theme.custom?.color?.brandLogo || '#4facfe';

  // Determine post type filter context (Lost vs Found vs All)
  const isLost = Boolean(selectedFl && selectedFl !== foundsId);
  const isFound = Boolean(selectedFl && selectedFl === foundsId);

  // Extract active category names (handles multiple categories properly)
  const activeCategoryName = useMemo(() => {
    if (selectedCategories && selectedCategories.length > 0) {
      const names = selectedCategories
        .map((id) => {
          const cat = categoriesData?.find((c) => (c._id || c.id) === id);
          return cat?.labels?.[currentLanguage] || cat?.label || cat?.name || '';
        })
        .filter(Boolean);
      return names.length > 0 ? names.join(', ') : '';
    }
    if (localCategoryFilter && localCategoryFilter !== 'all') {
      const cat = categoriesData?.find(
        (c) => (c._id || c.id) === localCategoryFilter
      );
      return cat?.labels?.[currentLanguage] || cat?.label || cat?.name || '';
    }
    return '';
  }, [selectedCategories, localCategoryFilter, categoriesData, currentLanguage]);

  // Resolve city display name strictly adhering to the site's current language
  const cityName = useMemo(() => {
    if (!selectedCity) return '';
    // Prioritize current language from localized labels / names object
    if (selectedCity.labels?.[currentLanguage]) return selectedCity.labels[currentLanguage];
    if (selectedCity.names?.[currentLanguage]) return selectedCity.names[currentLanguage];
    if (typeof getCityDisplayName === 'function') {
      const resolved = getCityDisplayName(selectedCity);
      if (resolved && resolved !== 'Unknown City' && !/^[0-9a-fA-F]{24}$/.test(resolved)) {
        return resolved;
      }
    }
    const fallback = selectedCity.label || selectedCity.name || '';
    // Prevent displaying raw Mongo ObjectId strings
    if (/^[0-9a-fA-F]{24}$/.test(fallback)) return '';
    return fallback;
  }, [selectedCity, currentLanguage, getCityDisplayName]);

  // Formulate dynamic heading matching category and city combinations
  const emptyTitle = useMemo(() => {
    if (activeCategoryName && cityName) {
      return t('emptyStateTitleWithCategoryAndCity', {
        categoryName: activeCategoryName,
        cityName,
      });
    }
    if (activeCategoryName) {
      return t('emptyStateTitleWithCategory', { categoryName: activeCategoryName });
    }
    if (cityName) {
      return t('emptyStateTitleWithCity', { cityName });
    }
    if (searchTerm) {
      return currentLanguage === 'ar'
        ? `لم يتم العثور على منشورات لـ "${searchTerm}"`
        : currentLanguage === 'fr'
        ? `Aucune annonce trouvée pour "${searchTerm}"`
        : `No posts found for "${searchTerm}"`;
    }
    if (hasActiveFilters) {
      return t('noPostsMatchFilters');
    }
    return t('emptyStateTitle');
  }, [activeCategoryName, cityName, searchTerm, hasActiveFilters, currentLanguage, t]);

  // Formulate clean button label (category title excluded as requested)
  const createButtonLabel = useMemo(() => {
    if (isLost) {
      return t('emptyStateCreateLostAd');
    }
    if (isFound) {
      return t('emptyStateCreateFoundAd');
    }
    return t('emptyStateCreateAdBtn');
  }, [isLost, isFound, t]);

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'relative',
        borderRadius: { xs: '20px', sm: '24px' },
        backgroundColor: isDark ? 'rgba(11, 18, 32, 0.85)' : 'rgba(255, 255, 255, 0.92)',
        backgroundImage: `radial-gradient(120% 120% at ${isRTLMode ? '100% 0%' : '0% 0%'}, ${alpha(brand, isDark ? 0.15 : 0.08)} 0%, transparent 60%)`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${alpha(brand, isDark ? 0.32 : 0.22)}`,
        boxShadow: isDark
          ? '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 242, 254, 0.08)'
          : '0 20px 50px rgba(15, 23, 42, 0.08), 0 0 25px rgba(0, 242, 254, 0.12)',
        overflow: 'hidden',
        py: { xs: 4, sm: 5, md: 6 },
        px: { xs: 2.5, sm: 4, md: 5 },
        textAlign: 'center',
        direction: isRTLMode ? 'rtl' : 'ltr',
      }}
    >
      {/* Top glowing hairline gradient */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: `linear-gradient(90deg, transparent 5%, ${brand} 50%, transparent 95%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Header Pill Badge */}
      <Box sx={{ display: 'inline-flex', alignItems: 'center', mb: 2.5 }}>
        <Chip
          icon={<AutoAwesomeRounded sx={{ fontSize: '1rem !important', color: `${brand} !important` }} />}
          label={t('emptyStateFreeBadge')}
          size="medium"
          sx={{
            py: 0.5,
            px: 1,
            fontWeight: 700,
            fontSize: '0.825rem',
            letterSpacing: '0.02em',
            borderRadius: '999px',
            backgroundColor: alpha(brand, isDark ? 0.14 : 0.1),
            color: isDark ? '#f8fafc' : '#0f172a',
            border: `1px solid ${alpha(brand, isDark ? 0.4 : 0.3)}`,
            boxShadow: `0 0 16px ${alpha(brand, 0.2)}`,
          }}
        />
      </Box>

      {/* Icon Graphic */}
      <Box
        sx={{
          width: { xs: 68, sm: 76 },
          height: { xs: 68, sm: 76 },
          mx: 'auto',
          mb: 2.5,
          borderRadius: '50%',
          backgroundImage: `linear-gradient(135deg, ${alpha(brand, 0.2)} 0%, ${alpha(brandLogo, 0.35)} 100%)`,
          border: `1.5px solid ${alpha(brand, 0.5)}`,
          boxShadow: `0 10px 28px ${alpha(brand, 0.25)}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <SearchOffOutlined sx={{ fontSize: { xs: 34, sm: 40 }, color: brand }} />
      </Box>

      {/* Dynamic Title */}
      <Typography
        variant="h4"
        component="h2"
        sx={{
          fontWeight: 800,
          fontSize: { xs: '1.35rem', sm: '1.65rem', md: '1.9rem' },
          color: theme.custom?.color?.ink || (isDark ? '#f8fafc' : '#0f172a'),
          mb: 1.5,
          lineHeight: 1.35,
          maxWidth: 720,
          mx: 'auto',
        }}
      >
        {emptyTitle}
      </Typography>

      {/* Instruction Subtitle (cleaned up without "... so the community can help you") */}
      <Typography
        variant="body1"
        sx={{
          color: alpha(theme.custom?.color?.ink || (isDark ? '#f8fafc' : '#0f172a'), isDark ? 0.78 : 0.75),
          maxWidth: 580,
          mx: 'auto',
          mb: 4,
          fontSize: { xs: '0.925rem', sm: '1.025rem' },
          lineHeight: 1.6,
        }}
      >
        {t('emptyStateInstruction')}
      </Typography>

      {/* Main Call-to-Action Section */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        {/* Prominent High-Contrast Button */}
        <Button
          variant="contained"
          size="large"
          startIcon={<PostAddIcon sx={{ fontSize: '1.4rem !important' }} />}
          onClick={onAddNewPost}
          sx={{
            py: { xs: 1.5, sm: 1.75 },
            px: { xs: 3.5, sm: 5 },
            fontSize: { xs: '0.975rem', sm: '1.05rem' },
            fontWeight: 800,
            textTransform: 'none',
            borderRadius: '16px',
            backgroundImage: `linear-gradient(135deg, ${brand} 0%, ${brandLogo} 100%)`,
            color: '#04101e',
            border: 'none',
            boxShadow: `0 10px 30px ${alpha(brand, 0.45)}, 0 2px 8px rgba(0, 0, 0, 0.2)`,
            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            minWidth: { xs: '100%', sm: 320 },
            '&:hover': {
              backgroundImage: `linear-gradient(135deg, ${lighten(brand, 0.1)} 0%, ${lighten(brandLogo, 0.1)} 100%)`,
              boxShadow: `0 14px 38px ${alpha(brand, 0.6)}, 0 4px 12px rgba(0, 0, 0, 0.3)`,
              transform: 'translateY(-2px)',
            },
            '&:active': {
              transform: 'translateY(0px)',
            },
          }}
        >
          {createButtonLabel}
        </Button>

        {/* Micro-footnote below button */}
        <Typography
          variant="caption"
          sx={{
            color: isDark ? '#94a3b8' : '#64748b',
            fontSize: '0.785rem',
            fontWeight: 500,
          }}
        >
          {currentLanguage === 'ar'
            ? '✓ مجاني تمامًا • في أقل من دقيقة • يصل فورًا للجميع'
            : currentLanguage === 'fr'
            ? '✓ 100% Gratuit • Publié en 1 minute • Visible immédiatement'
            : '✓ 100% Free • Under 1 minute • Immediate visibility'}
        </Typography>

        {/* Secondary Auxiliary Actions */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1.5,
            flexWrap: 'wrap',
            mt: 1.5,
          }}
        >
          {hasActiveFilters && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<FilterAltOffRounded />}
              onClick={onClearFilters}
              sx={{
                py: 0.8,
                px: 2,
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
                borderColor: alpha(theme.custom?.color?.ink || (isDark ? '#fff' : '#000'), isDark ? 0.3 : 0.2),
                color: theme.custom?.color?.ink || (isDark ? '#f8fafc' : '#0f172a'),
                '&:hover': {
                  borderColor: brand,
                  backgroundColor: alpha(brand, 0.08),
                  color: brand,
                },
              }}
            >
              {t('clearFilters')}
            </Button>
          )}

          <Button
            variant="text"
            size="small"
            startIcon={<LanguageIcon />}
            onClick={onSelectCountry}
            sx={{
              py: 0.8,
              px: 2,
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              color: isDark ? '#94a3b8' : '#64748b',
              '&:hover': {
                color: brand,
                backgroundColor: alpha(brand, 0.06),
              },
            }}
          >
            {t('changeCountry')}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default PostsListEmptyState;
