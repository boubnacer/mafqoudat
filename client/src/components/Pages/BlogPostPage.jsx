// Individual blog article page: /blog/:slug
// Sources content from ../../data/blogPosts.json (shared with Blog.jsx and the
// build-time SEO prerender script) so the list, the detail page, and the
// crawler-visible static HTML never drift out of sync.

import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Box, Typography, Container, Chip, Button, useTheme, Avatar } from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  ArrowBack,
  ArrowForward,
  CalendarToday,
  Person,
  Visibility,
  Verified,
  InfoOutlined,
  EmailOutlined,
  GitHub,
  LinkedIn,
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
                <Avatar
                  src="/author-avatar.jpg"
                  alt={t('founderName')}
                  sx={{
                    width: 26,
                    height: 26,
                    border: `1.5px solid ${theme.custom.color.brandPrimary}`,
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                  }}
                >
                  N
                </Avatar>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {t('founderName')}
                </Typography>
                <CalendarToday fontSize="small" sx={{ marginInlineStart: 1.5 }} />
                <Typography variant="body2">{new Date(post.date).toLocaleDateString(currentLanguage)}</Typography>
                <Visibility fontSize="small" sx={{ marginInlineStart: 1.5 }} />
                <Typography variant="body2">{post.readTime}</Typography>
              </Box>

              <Box
                component="img"
                src={post.image}
                alt={localized.title}
                decoding="async"
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

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 4 }}>
                {tags.map((tag) => (
                  <Chip key={tag} label={tag} size="small" variant="outlined" />
                ))}
              </Box>

              {/* Author Bio Box - AdSense "Author Signal" */}
              <SurfaceCard
                sx={{
                  p: { xs: 2.5, md: 3.5 },
                  borderRadius: `${theme.custom.radius.lg}px`,
                  border: `1px solid ${theme.palette.divider}`,
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(33,150,243,0.06) 100%)'
                    : 'linear-gradient(135deg, #ffffff 0%, rgba(33,150,243,0.04) 100%)',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: 2.5,
                  }}
                >
                  <Avatar
                    src="/author-avatar.jpg"
                    alt={t('founderName')}
                    sx={{
                      width: { xs: 80, sm: 90 },
                      height: { xs: 80, sm: 90 },
                      border: `3px solid ${theme.custom.color.brandPrimary}`,
                      bgcolor: theme.custom.color.brandPrimary,
                      color: '#ffffff',
                      fontSize: '1.75rem',
                      fontWeight: 700,
                      boxShadow: '0 8px 24px rgba(33, 150, 243, 0.25)',
                      flexShrink: 0,
                    }}
                  >
                    N
                  </Avatar>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 0.5 }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.2rem', color: theme.palette.text.primary, letterSpacing: '-0.01em' }}>
                        {t('founderName')}
                      </Typography>
                      <Chip
                        icon={<Verified sx={{ fontSize: '15px !important', color: `${theme.custom.color.brandPrimary} !important` }} />}
                        label={t('authorVerifiedBadge')}
                        size="small"
                        sx={{
                          height: 24,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(33,150,243,0.15)' : 'rgba(33,150,243,0.08)',
                          color: theme.custom.color.brandPrimary,
                          border: `1px solid ${theme.custom.color.brandPrimary}33`,
                        }}
                      />
                    </Box>

                    <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700, mb: 1, letterSpacing: '0.01em' }}>
                      {t('authorFounderTitle')}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.75, mb: 2, fontSize: '0.92rem' }}>
                      {t('authorFounderBio')}
                    </Typography>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
                      <Button
                        component={Link}
                        to="/about"
                        size="small"
                        variant="outlined"
                        startIcon={<InfoOutlined sx={{ fontSize: 16 }} />}
                        sx={{
                          borderRadius: `${theme.custom.radius.sm}px`,
                          textTransform: 'none',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                        }}
                      >
                        {t('meetTheTeam')}
                      </Button>
                      <Button
                        component={Link}
                        to="/contact"
                        size="small"
                        variant="text"
                        startIcon={<EmailOutlined sx={{ fontSize: 16 }} />}
                        sx={{
                          borderRadius: `${theme.custom.radius.sm}px`,
                          textTransform: 'none',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                        }}
                      >
                        {t('contactEditorial')}
                      </Button>
                      <Button
                        component="a"
                        href="https://www.linkedin.com/in/nacer-boubkraoui"
                        target="_blank"
                        rel="noopener noreferrer"
                        size="small"
                        variant="text"
                        startIcon={<LinkedIn sx={{ fontSize: 16 }} />}
                        sx={{
                          borderRadius: `${theme.custom.radius.sm}px`,
                          textTransform: 'none',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          color: '#0A66C2',
                          '&:hover': {
                            bgcolor: 'rgba(10, 102, 194, 0.08)',
                          },
                        }}
                      >
                        LinkedIn
                      </Button>
                      <Button
                        component="a"
                        href="https://github.com/boubnacer"
                        target="_blank"
                        rel="noopener noreferrer"
                        size="small"
                        variant="text"
                        startIcon={<GitHub sx={{ fontSize: 16 }} />}
                        sx={{
                          borderRadius: `${theme.custom.radius.sm}px`,
                          textTransform: 'none',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          color: 'text.secondary',
                          '&:hover': {
                            color: 'text.primary',
                          },
                        }}
                      >
                        GitHub
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </SurfaceCard>
            </article>
          </Container>
        </Box>
        <DashFooter />
      </Box>
    </>
  );
};

export default BlogPostPage;
