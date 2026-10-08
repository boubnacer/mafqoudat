import React, { useMemo } from 'react';
import { Box, Typography, Grid, Paper, Chip, Button, useTheme, alpha } from '@mui/material';
import { Link } from 'react-router-dom';
import {
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  TaskAltOutlined,
  SearchOffOutlined,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  GridView as GridViewIcon,
} from '@mui/icons-material';
import { useTranslation } from '../../../utils/translations';
import { useGetPostsQuery } from '../postsApiSlice';
import LazyCardMedia from '../../../components/LazyCardMedia';
import { getOptimizedImageUrl } from '../../../utils/cloudinaryUtils';
import noImageSvg from '../../../img/noimage.svg';
import { formatDistanceToNow } from 'date-fns';
import { ar, fr, enUS } from 'date-fns/locale';

const RelatedPosts = ({ currentPost }) => {
  const theme = useTheme();
  const { t, currentLanguage } = useTranslation();
  const isDark = theme.palette.mode === 'dark';
  const isRtl = currentLanguage === 'ar';

  const postId = currentPost?._id;
  const currentCountry =
    currentPost?.country?._id ||
    currentPost?.country?.id ||
    currentPost?.country ||
    currentPost?.currentCountry;

  // Extract category IDs from current post
  const currentCategoryIds = useMemo(() => {
    const ids = [];
    if (Array.isArray(currentPost?.categories)) {
      currentPost.categories.forEach((cat) => {
        const id = cat?._id || cat?.id || (typeof cat === 'string' ? cat : null);
        if (id) ids.push(String(id));
      });
    }
    if (currentPost?.category) {
      const id = currentPost.category?._id || currentPost.category?.id || (typeof currentPost.category === 'string' ? currentPost.category : null);
      if (id) ids.push(String(id));
    }
    return ids;
  }, [currentPost]);

  // Extract city identifier from current post
  const currentCityId = useMemo(() => {
    if (!currentPost?.city) return null;
    if (typeof currentPost.city === 'object') {
      return String(currentPost.city._id || currentPost.city.id || currentPost.city.code || '');
    }
    return String(currentPost.city);
  }, [currentPost]);

  // Query sibling posts for the same country
  const { data, isLoading } = useGetPostsQuery(
    {
      page: 1,
      pageSize: 16,
      currentCountry: currentCountry || undefined,
      language: currentLanguage,
    },
    {
      skip: !currentCountry,
      refetchOnMountOrArgChange: 300,
    }
  );

  // Filter and prioritize posts sharing the same category or city
  const relatedPosts = useMemo(() => {
    const rawList = data?.postsWithUser || data?.posts || [];
    const candidates = rawList.filter((p) => p && p._id && String(p._id) !== String(postId));

    if (candidates.length === 0) return [];

    // Score candidates: same category (+2), same city (+2)
    const scored = candidates.map((p) => {
      let score = 0;
      const postCatIds = [];
      if (Array.isArray(p.categories)) {
        p.categories.forEach((c) => {
          const cid = c?._id || c?.id || (typeof c === 'string' ? c : null);
          if (cid) postCatIds.push(String(cid));
        });
      }
      if (p.category) {
        const cid = p.category?._id || p.category?.id || (typeof p.category === 'string' ? p.category : null);
        if (cid) postCatIds.push(String(cid));
      }

      if (currentCategoryIds.some((cid) => postCatIds.includes(cid))) {
        score += 2;
      }

      const pCity = typeof p.city === 'object' ? String(p.city?._id || p.city?.code || '') : String(p.city || '');
      if (currentCityId && pCity && pCity.toLowerCase() === currentCityId.toLowerCase()) {
        score += 2;
      }

      return { post: p, score };
    });

    // Sort by relevance score descending, then newest first
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.post.createdAt || 0) - new Date(a.post.createdAt || 0);
    });

    // Return top 4 to 6 items
    return scored.slice(0, 6).map((item) => item.post);
  }, [data, postId, currentCategoryIds, currentCityId]);

  const getDateLocale = () => {
    switch (currentLanguage) {
      case 'ar': return ar;
      case 'fr': return fr;
      default: return enUS;
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ mt: 5, pt: 3 }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
          {t('relatedPosts') || (currentLanguage === 'ar' ? 'إعلانات مشابهة قد تهمّك' : 'Related Posts')}
        </Typography>
        <Grid container spacing={2}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Paper
                elevation={0}
                sx={{
                  height: 220,
                  borderRadius: `${theme.custom.radius.lg}px`,
                  backgroundColor: alpha(theme.custom.color.ink, 0.04),
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (relatedPosts.length === 0) {
    return null;
  }

  const ArrowIcon = isRtl ? ArrowBackIcon : ArrowForwardIcon;

  return (
    <Box sx={{ mt: 6, pt: 4, borderTop: `1px solid ${theme.palette.divider}` }}>
      {/* Section Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 1.5,
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 38,
              height: 38,
              borderRadius: `${theme.custom.radius.md}px`,
              backgroundColor: alpha(theme.custom.color.brandPrimary, 0.1),
              color: theme.custom.color.brandPrimary,
            }}
          >
            <GridViewIcon sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Typography
              variant="h6"
              fontWeight={800}
              sx={{
                color: theme.custom.color.ink,
                fontSize: { xs: '1.15rem', md: '1.25rem' },
                lineHeight: 1.2,
              }}
            >
              {t('relatedPosts') || (currentLanguage === 'ar' ? 'إعلانات مشابهة قد تهمّك' : 'Related Posts')}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
              {currentLanguage === 'ar'
                ? 'تصفّح بلاغات أخرى تم نشرها في نفس الفئة أو المدينة'
                : 'Browse other posts shared in the same category or location'}
            </Typography>
          </Box>
        </Box>

        <Button
          component={Link}
          to="/dash/posts"
          variant="text"
          endIcon={<ArrowIcon />}
          sx={{
            fontWeight: 700,
            textTransform: 'none',
            color: theme.custom.color.brandPrimary,
            px: 1.5,
            py: 0.75,
            borderRadius: `${theme.custom.radius.sm}px`,
            '&:hover': { backgroundColor: alpha(theme.custom.color.brandPrimary, 0.08) },
          }}
        >
          {t('seeAll') || (currentLanguage === 'ar' ? 'عرض الكل' : 'View all')}
        </Button>
      </Box>

      {/* Cards Grid */}
      <Grid container spacing={2.5}>
        {relatedPosts.map((post) => {
          const isFound =
            post.foundLost?.code === 'FOUND' ||
            post.Floptions?.code === 'FOUND' ||
            String(post.type || '').toLowerCase() === 'found';

          const statusTone = isFound ? theme.custom.status.found : theme.custom.status.lost;
          const StatusIcon = isFound ? TaskAltOutlined : SearchOffOutlined;
          const statusText = t(isFound ? 'found' : 'lost');

          // Extract title or category name
          const catName =
            (Array.isArray(post.categories) && post.categories[0]?.labels?.[currentLanguage]) ||
            post.category?.labels?.[currentLanguage] ||
            post.categoryname ||
            post.title ||
            t('post');

          // Extract city label
          const cityDisplay =
            (typeof post.city === 'object' && post.city?.labels?.[currentLanguage]) ||
            post.cityName ||
            post.cityLabels?.[currentLanguage] ||
            (typeof post.city === 'string' ? post.city : '') ||
            post.exactLocation ||
            '';

          // Extract image url
          const rawImg = post.cloudinaryUrl || post.image;
          const imageUrl = rawImg ? getOptimizedImageUrl(rawImg, { width: 400, height: 260 }) : null;

          // Relative time
          let relativeTime = '';
          if (post.createdAt) {
            try {
              relativeTime = formatDistanceToNow(new Date(post.createdAt), {
                addSuffix: true,
                locale: getDateLocale(),
              });
            } catch (e) {
              relativeTime = '';
            }
          }

          return (
            <Grid item xs={12} sm={6} md={4} lg={relatedPosts.length >= 4 ? 3 : 4} key={post._id}>
              <Paper
                component={Link}
                to={`/dash/posts/${post._id}`}
                elevation={0}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  textDecoration: 'none',
                  color: 'inherit',
                  borderRadius: `${theme.custom.radius.lg}px`,
                  overflow: 'hidden',
                  border: `1px solid ${theme.palette.divider}`,
                  backgroundColor: theme.custom.color.surfaceRaised,
                  boxShadow: theme.custom.elevation.e1,
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.custom.elevation.e2,
                    borderColor: alpha(theme.custom.color.brandPrimary, 0.4),
                  },
                }}
              >
                {/* Thumbnail Header */}
                <Box sx={{ position: 'relative', width: '100%', pt: '60%', backgroundColor: alpha(theme.custom.color.ink, 0.05) }}>
                  <LazyCardMedia
                    component="img"
                    image={imageUrl || noImageSvg}
                    alt={catName}
                    fallback={noImageSvg}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />

                  {/* Status Badge */}
                  <Chip
                    icon={<StatusIcon sx={{ fontSize: '14px !important', color: `${theme.palette.getContrastText(statusTone.main)} !important` }} />}
                    label={statusText}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 10,
                      insetInlineStart: 10,
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      height: 24,
                      backgroundColor: statusTone.main,
                      color: theme.palette.getContrastText(statusTone.main),
                      boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                    }}
                  />
                </Box>

                {/* Content Details */}
                <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', flex: 1, gap: 1 }}>
                  <Typography
                    variant="subtitle1"
                    fontWeight={700}
                    sx={{
                      fontSize: '0.95rem',
                      lineHeight: 1.35,
                      color: theme.custom.color.ink,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      minHeight: '2.6em',
                    }}
                  >
                    {catName}
                  </Typography>

                  <Box sx={{ mt: 'auto', display: 'flex', flexDirection: 'column', gap: 0.5, pt: 1, borderTop: `1px solid ${alpha(theme.custom.color.ink, 0.06)}` }}>
                    {cityDisplay && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LocationIcon sx={{ fontSize: 15, color: 'text.secondary', flexShrink: 0 }} />
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'text.secondary',
                            fontWeight: 600,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {cityDisplay}
                        </Typography>
                      </Box>
                    )}

                    {relativeTime && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <TimeIcon sx={{ fontSize: 14, color: 'text.secondary', flexShrink: 0 }} />
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>
                          {relativeTime}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default RelatedPosts;
