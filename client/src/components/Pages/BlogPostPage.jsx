// Individual blog article page: /blog/:slug
// Sources content from ../../data/blogPosts.json (shared with Blog.jsx and the
// build-time SEO prerender script) so the list, the detail page, and the
// crawler-visible static HTML never drift out of sync.

import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Box, Typography, Container, Chip, Button, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  ArrowBack,
  ArrowForward,
  CalendarToday,
  Person,
  Visibility,
} from '@mui/icons-material';
import { useTranslation } from '../../utils/translations';
import Navbar from '../Navbar';
import DashFooter from '../Footer/DashFooter';
import SeoMeta from '../SeoMeta';
import { createArticleSchema, createBreadcrumbSchema, buildAbsoluteUrl } from '../../utils/seoConfig';
import blogPostsData from '../../data/blogPosts.json';

const SurfaceCard = styled(Box)(({ theme }) => ({
  backgroundColor: theme.custom.color.surfaceRaised,
  borderRadius: theme.custom.radius.xl,
  boxShadow: theme.custom.elevation.e2,
  border: `1px solid ${theme.palette.divider}`,
}));

const BlogPostPage = () => {
  const theme = useTheme();
  const { t, currentLanguage } = useTranslation();
  const { slug } = useParams();
  const isRTL = currentLanguage === 'ar';

  const post = blogPostsData.find((p) => p.slug === slug);

  if (!post) {
    return (
      <>
        <SeoMeta path="/blog" noindex title={t('articleNotFound')} description={t('articleNotFoundDescription')} />
        <Box sx={{ backgroundColor: theme.palette.background.default }}>
          <Navbar />
          <Box sx={{ minHeight: '60vh', pt: { xs: '8rem', sm: '9rem' }, pb: 8 }}>
            <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
              <SurfaceCard sx={{ p: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5 }}>
                  {t('articleNotFound')}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  {t('articleNotFoundDescription')}
                </Typography>
                <Button
                  variant="contained"
                  component={Link}
                  to="/blog"
                  startIcon={isRTL ? <ArrowForward /> : <ArrowBack />}
                  sx={{
                    borderRadius: `${theme.custom.radius.md}px`,
                    bgcolor: theme.custom.color.brandPrimary,
                    color: theme.palette.getContrastText(theme.custom.color.brandPrimary),
                  }}
                >
                  {t('backToBlog')}
                </Button>
              </SurfaceCard>
            </Container>
          </Box>
          <DashFooter />
        </Box>
      </>
    );
  }

  const localized = post.i18n[currentLanguage] || post.i18n.en;
  const category = t(post.categoryKey);
  const tags = post.tagKeys.map((key) => t(key));
  const author = t(post.authorKey);
  const path = `/blog/${post.slug}`;

  const structuredData = [
    createArticleSchema({
      title: localized.title,
      description: localized.excerpt,
      image: post.image,
      path,
      datePublished: post.date,
      authorName: author,
      inLanguage: currentLanguage,
    }),
    createBreadcrumbSchema([
      { name: t('blog'), path: '/blog' },
      { name: localized.title, path },
    ]),
  ];

  return (
    <>
      <SeoMeta
        title={`${localized.title} | Mafqoudat Blog`}
        description={localized.excerpt}
        path={path}
        image={buildAbsoluteUrl(post.image)}
        structuredData={structuredData}
      />
      <Box sx={{ backgroundColor: theme.palette.background.default }}>
        <Navbar />
        <Box sx={{ minHeight: '100vh', pt: { xs: '6rem', sm: '7rem' }, pb: 6 }}>
          <Container maxWidth="md">
            <Button
              component={Link}
              to="/blog"
              startIcon={isRTL ? <ArrowForward /> : <ArrowBack />}
              sx={{ mb: 3, color: 'text.secondary', textTransform: 'none' }}
            >
              {t('backToBlog')}
            </Button>

            <article>
              <Chip label={category} size="small" color="primary" sx={{ mb: 2 }} />

              <Typography
                variant="h3"
                component="h1"
                sx={{
                  fontWeight: 700,
                  mb: 2,
                  lineHeight: 1.25,
                  fontSize: { xs: '1.75rem', md: '2.5rem' },
                }}
              >
                {localized.title}
              </Typography>

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 1,
                  mb: 3,
                  color: 'text.secondary',
                }}
              >
                <Person fontSize="small" />
                <Typography variant="body2">{author}</Typography>
                <CalendarToday fontSize="small" sx={{ marginInlineStart: 1.5 }} />
                <Typography variant="body2">{new Date(post.date).toLocaleDateString(currentLanguage)}</Typography>
                <Visibility fontSize="small" sx={{ marginInlineStart: 1.5 }} />
                <Typography variant="body2">{post.readTime}</Typography>
              </Box>

              <Box
                component="img"
                src={post.image}
                alt={localized.title}
                sx={{
                  width: '100%',
                  maxHeight: 420,
                  objectFit: 'cover',
                  borderRadius: `${theme.custom.radius.lg}px`,
                  mb: 4,
                  backgroundColor: theme.custom.color.surfaceRaised,
                }}
              />

              <SurfaceCard sx={{ p: { xs: 2.5, md: 4 }, mb: 3 }}>
                <Typography
                  variant="body1"
                  sx={{ lineHeight: 1.9, fontSize: '1.05rem', whiteSpace: 'pre-line' }}
                >
                  {localized.content}
                </Typography>
              </SurfaceCard>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {tags.map((tag) => (
                  <Chip key={tag} label={tag} size="small" variant="outlined" />
                ))}
              </Box>
            </article>
          </Container>
        </Box>
        <DashFooter />
      </Box>
    </>
  );
};

export default BlogPostPage;
