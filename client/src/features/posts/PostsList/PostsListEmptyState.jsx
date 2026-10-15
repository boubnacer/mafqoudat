import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
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
  lostsId = null,
  searchIntent = '',
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

  // Context resolution:
  // - searchIntent === 'found': User found an item and searched lost listings to check if the owner declared it lost.
  // - searchIntent === 'lost': User lost an item and searched found listings to check if someone reported it found.
  const isFoundSearch = searchIntent === 'found';
  const isLostSearch = searchIntent === 'lost';

  // Fallback for direct filter navigation without explicit searchIntent
  const isGenericLost = !searchIntent && Boolean(selectedFl && selectedFl !== foundsId);
  const isGenericFound = !searchIntent && Boolean(selectedFl && selectedFl === foundsId);

  // Extract active category names (handles multiple categories joined with language-aware "and" / "و" / "et")
  const activeCategoryName = useMemo(() => {
    const rawCategories = selectedCategories && selectedCategories.length > 0
      ? selectedCategories
      : (localCategoryFilter && localCategoryFilter !== 'all' ? [localCategoryFilter] : []);

    if (rawCategories.length === 0) return '';

    const names = rawCategories
      .map((id) => {
        const cat = categoriesData?.find((c) =>
          (c._id || c.id) === id ||
          String(c._id) === String(id) ||
          String(c.id) === String(id) ||
          String(c.code).toLowerCase() === String(id).toLowerCase()
        );
        return cat?.labels?.[currentLanguage] || cat?.label || cat?.name || '';
      })
      .filter(Boolean);

    if (names.length === 0) return '';
    if (names.length === 1) return names[0];

    // Language-aware join with "and" / "و" / "et"
    if (currentLanguage === 'ar') {
      if (names.length === 2) {
        return `${names[0]} و ${names[1]}`;
      }
      return `${names.slice(0, -1).join('، ')} و ${names[names.length - 1]}`;
    }

    if (currentLanguage === 'fr') {
      if (names.length === 2) {
        return `${names[0]} et ${names[1]}`;
      }
      return `${names.slice(0, -1).join(', ')} et ${names[names.length - 1]}`;
    }

    // Default English & others
    if (names.length === 2) {
      return `${names[0]} and ${names[1]}`;
    }
    return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  }, [selectedCategories, localCategoryFilter, categoriesData, currentLanguage]);

  // Resolve city display name strictly adhering to the site's current language
  const cityName = useMemo(() => {
    if (!selectedCity) return '';
    if (selectedCity.labels?.[currentLanguage]) return selectedCity.labels[currentLanguage];
    if (selectedCity.names?.[currentLanguage]) return selectedCity.names[currentLanguage];
    if (typeof getCityDisplayName === 'function') {
      const resolved = getCityDisplayName(selectedCity);
      if (resolved && resolved !== 'Unknown City' && !/^[0-9a-fA-F]{24}$/.test(resolved)) {
        return resolved;
      }
    }
    const fallback = selectedCity.label || selectedCity.name || '';
    if (/^[0-9a-fA-F]{24}$/.test(fallback)) return '';
    return fallback;
  }, [selectedCity, currentLanguage, getCityDisplayName]);

  // Formulate dynamic heading matching category and city combinations
  const emptyTitle = useMemo(() => {
    // 1. User arrived having FOUND an item (searched lost listings)
    if (isFoundSearch) {
      if (activeCategoryName && cityName) {
        return t('emptyStateTitleFoundWithCategoryAndCity', {
          categoryName: activeCategoryName,
          cityName,
        });
      }
      if (activeCategoryName) {
        return t('emptyStateTitleFoundWithCategory', { categoryName: activeCategoryName });
      }
      if (cityName) {
        return t('emptyStateTitleFoundWithCity', { cityName });
      }
      return t('emptyStateTitleFoundDefault');
    }

    // 2. User arrived having LOST an item (searched found listings)
    if (isLostSearch) {
      if (activeCategoryName && cityName) {
        return t('emptyStateTitleLostWithCategoryAndCity', {
          categoryName: activeCategoryName,
          cityName,
        });
      }
      if (activeCategoryName) {
        return t('emptyStateTitleLostWithCategory', { categoryName: activeCategoryName });
      }
      if (cityName) {
        return t('emptyStateTitleLostWithCity', { cityName });
      }
      return t('emptyStateTitleLostDefault');
    }

    if (searchTerm) {
      return currentLanguage === 'ar'
        ? `لم يتم العثور على منشورات لـ "${searchTerm}"`
        : currentLanguage === 'fr'
        ? `Aucune annonce trouvée pour "${searchTerm}"`
        : `No posts found for "${searchTerm}"`;
    }

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
    if (hasActiveFilters) {
      return t('noPostsMatchFilters');
    }
    return t('emptyStateTitle');
  }, [
    isFoundSearch,
    isLostSearch,
    activeCategoryName,
    cityName,
    searchTerm,
    hasActiveFilters,
    currentLanguage,
    t,
  ]);

  // Formulate context-sensitive subtitle instruction (updated without redundant words)
  const emptySubtitle = useMemo(() => {
    if (isFoundSearch) {
      return t('emptyStateInstructionFound');
    }
    if (isLostSearch) {
      return t('emptyStateInstructionLost');
    }
    return t('emptyStateInstruction');
  }, [isFoundSearch, isLostSearch, t]);

  // Clean button label: "Add new ad — 100% Free"
  const createButtonLabel = useMemo(() => {
    return t('emptyStateCreateAdBtn') || 'Add new ad — 100% Free';
  }, [t]);

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'relative',
        borderRadius: { xs: '20px', sm: '28px' },
        backgroundColor: isDark ? 'rgba(11, 18, 32, 0.88)' : 'rgba(255, 255, 255, 0.94)',
        backgroundImage: `radial-gradient(120% 120% at ${isRTLMode ? '100% 0%' : '0% 0%'}, ${alpha(brand, isDark ? 0.16 : 0.08)} 0%, transparent 60%)`,
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        border: `1px solid ${alpha(brand, isDark ? 0.35 : 0.22)}`,
        boxShadow: isDark
          ? '0 25px 60px -15px rgba(0, 0, 0, 0.65), 0 0 35px rgba(0, 242, 254, 0.10)'
          : '0 25px 60px -15px rgba(15, 23, 42, 0.08), 0 0 30px rgba(0, 242, 254, 0.14)',
        overflow: 'hidden',
        py: { xs: 3.5, sm: 5, md: 6 },
        px: { xs: 2, sm: 4, md: 5 },
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
          background: `linear-gradient(90deg, transparent 5%, ${brand} 50%, ${brandLogo} 75%, transparent 95%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Premium Multi-Layer Icon Graphic with Ambient Aura */}
      <Box
        sx={{
          position: 'relative',
          width: { xs: 72, sm: 84 },
          height: { xs: 72, sm: 84 },
          mx: 'auto',
          mb: { xs: 2.25, sm: 2.75 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Soft Ambient Radial Glow behind icon */}
        <Box
          sx={{
            position: 'absolute',
            inset: -14,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(brand, isDark ? 0.32 : 0.22)} 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />
        {/* Main Icon Container */}
        <Box
          sx={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            backgroundImage: `linear-gradient(135deg, ${alpha(brand, isDark ? 0.22 : 0.14)} 0%, ${alpha(brandLogo, isDark ? 0.35 : 0.25)} 100%)`,
            border: `1.5px solid ${alpha(brand, isDark ? 0.6 : 0.45)}`,
            boxShadow: isDark
              ? `0 12px 30px ${alpha(brand, 0.28)}, inset 0 1px 0 rgba(255, 255, 255, 0.1)`
              : `0 10px 24px ${alpha(brand, 0.2)}, inset 0 1px 0 rgba(255, 255, 255, 0.9)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <SearchOffOutlined sx={{ fontSize: { xs: 36, sm: 42 }, color: brand }} />
        </Box>
      </Box>

      {/* Dynamic Title */}
      <Typography
        variant="h4"
        component="h2"
        sx={{
          fontFamily: theme.custom?.font?.display || 'inherit',
          fontWeight: 800,
          fontSize: { xs: '1.25rem', sm: '1.55rem', md: '1.85rem' },
          color: theme.custom?.color?.ink || (isDark ? '#f8fafc' : '#0f172a'),
          mb: 1.5,
          lineHeight: 1.35,
          letterSpacing: '-0.02em',
          maxWidth: 720,
          mx: 'auto',
          px: { xs: 0.5, sm: 0 },
        }}
      >
        {emptyTitle}
      </Typography>

      {/* Instruction Subtitle */}
      <Typography
        variant="body1"
        sx={{
          fontFamily: theme.custom?.font?.body || 'inherit',
          color: alpha(theme.custom?.color?.ink || (isDark ? '#f8fafc' : '#0f172a'), isDark ? 0.78 : 0.72),
          maxWidth: 600,
          mx: 'auto',
          mb: { xs: 3.25, sm: 4 },
          fontSize: { xs: '0.90rem', sm: '1.0rem' },
          lineHeight: 1.65,
          px: { xs: 0.5, sm: 0 },
        }}
      >
        {emptySubtitle}
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
        {/* Prominent High-Contrast Button: "Add new ad — 100% Free" */}
        <Button
          variant="contained"
          size="large"
          startIcon={<PostAddIcon sx={{ fontSize: '1.45rem !important' }} />}
          onClick={onAddNewPost}
          sx={{
            py: { xs: 1.55, sm: 1.75 },
            px: { xs: 3.5, sm: 5 },
            fontSize: { xs: '0.98rem', sm: '1.05rem' },
            fontWeight: 800,
            textTransform: 'none',
            letterSpacing: '0.015em',
            borderRadius: '16px',
            backgroundImage: `linear-gradient(135deg, ${brand} 0%, ${brandLogo} 100%)`,
            color: '#04101e',
            border: 'none',
            boxShadow: `0 10px 30px ${alpha(brand, 0.45)}, 0 2px 8px rgba(0, 0, 0, 0.2)`,
            transition: 'all 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
            minWidth: { xs: '100%', sm: 340 },
            '&:hover': {
              backgroundImage: `linear-gradient(135deg, ${lighten(brand, 0.12)} 0%, ${lighten(brandLogo, 0.12)} 100%)`,
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

        {/* Social Media & Notification Trust Indicator Bar */}
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            py: { xs: 0.85, sm: 0.95 },
            px: { xs: 1.75, sm: 2.25 },
            borderRadius: '999px',
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.65)' : 'rgba(241, 245, 249, 0.8)',
            border: `1px solid ${isDark ? 'rgba(51, 65, 85, 0.55)' : 'rgba(203, 213, 225, 0.7)'}`,
            backdropFilter: 'blur(12px)',
            maxWidth: { xs: '100%', sm: 580 },
            mx: 'auto',
          }}
        >
          <AutoAwesomeRounded sx={{ fontSize: 16, color: brand, flexShrink: 0 }} />
          <Typography
            variant="caption"
            sx={{
              color: isDark ? '#cbd5e1' : '#475569',
              fontSize: { xs: '0.76rem', sm: '0.82rem' },
              fontWeight: 600,
              lineHeight: 1.45,
              textAlign: 'center',
            }}
          >
            {t('emptyStateSocialFootnote') ||
              (currentLanguage === 'ar'
                ? 'مجاني 100% • في أقل من دقيقة • يُنشر فورًا على صفحاتنا في مواقع التواصل وسنخبرك فور العثور عليه أو الإبلاغ عنه'
                : currentLanguage === 'fr'
                ? '100% Gratuit • Moins d\'une minute • Partagé immédiatement sur nos réseaux sociaux et vous serez notifié si quelqu\'un a trouvé/perdu votre bien'
                : '100% Free • Under 1 minute • Immediately shared to our social media pages and we\'ll notify you if someone found/lost your item')}
          </Typography>
        </Box>

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
                transition: 'all 0.2s ease',
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
              transition: 'all 0.2s ease',
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

