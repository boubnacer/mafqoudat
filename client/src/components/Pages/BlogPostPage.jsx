// Individual blog article page: /blog/:slug
// Sources content from ../../data/blogPosts.json (shared with Blog.jsx and the
// build-time SEO prerender script) so the list, the detail page, and the
// crawler-visible static HTML never drift out of sync.

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Chip,
  Button,
  useTheme,
  Avatar,
  Grid,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  alpha,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  ArrowBack,
  ArrowForward,
  CalendarToday,
  Visibility,
  Verified,
  InfoOutlined,
  EmailOutlined,
  GitHub,
  LinkedIn,
  MenuBookOutlined,
  ShareOutlined,
  ContentCopyOutlined,
  Facebook,
  WhatsApp,
  Check,
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

// Extracts ## headings for in-page Table of Contents
const extractHeadings = (text) => {
  if (!text) return [];
  const lines = text.split('\n');
  const headings = [];
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('## ') && !trimmed.startsWith('### ')) {
      const title = trimmed.replace(/^##\s+/, '').trim();
      const id = title
        .toLowerCase()
        .replace(/[^\w\u0600-\u06FF]+/g, '-')
        .replace(/^-|-$/g, '');
      if (title) headings.push({ id, title });
    }
  });
  return headings;
};

// Parses inline **bold** formatting inside text blocks
const renderInlineFormatted = (text) => {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <Box component="strong" key={i} sx={{ fontWeight: 700, color: 'text.primary' }}>
          {part.slice(2, -2)}
        </Box>
      );
    }
    return part;
  });
};

// Structured markdown content renderer (Headings, Lists, Blockquotes, Paragraphs)
const renderFormattedContent = (content, theme) => {
  if (!content) return null;
  const lines = content.split('\n');
  const elements = [];
  let currentList = null;

  const flushList = () => {
    if (currentList) {
      const isOrdered = currentList.type === 'ol';
      elements.push(
        <Box
          key={`list-${elements.length}`}
          component={isOrdered ? 'ol' : 'ul'}
          sx={{
            my: 2,
            paddingInlineStart: 3,
            '& li': {
              mb: 1,
              lineHeight: 1.85,
              fontSize: '1.02rem',
              color: 'text.secondary',
            },
          }}
        >
          {currentList.items.map((item, idx) => (
            <li key={idx}>{renderInlineFormatted(item)}</li>
          ))}
        </Box>
      );
      currentList = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      flushList();
      continue;
    }

    // Heading 2 (## Heading)
    if (line.startsWith('## ') && !line.startsWith('### ')) {
      flushList();
      const title = line.replace(/^##\s+/, '').trim();
      const id = title
        .toLowerCase()
        .replace(/[^\w\u0600-\u06FF]+/g, '-')
        .replace(/^-|-$/g, '');
      elements.push(
        <Typography
          key={`h2-${i}`}
          id={id}
          component="h2"
          variant="h5"
          sx={{
            fontWeight: 800,
            fontSize: { xs: '1.35rem', sm: '1.55rem', md: '1.75rem' },
            fontFamily: theme.custom.font.display,
            color: theme.custom.color.ink,
            mt: elements.length === 0 ? 0 : 4.5,
            mb: 2,
            pt: 1,
            scrollMarginTop: '110px',
            borderBottom: `2px solid ${alpha(theme.custom.color.brandPrimary, 0.15)}`,
            pb: 1,
          }}
        >
          {title}
        </Typography>
      );
      continue;
    }

    // Heading 3 (### Heading)
    if (line.startsWith('### ')) {
      flushList();
      const title = line.replace(/^###\s+/, '').trim();
      elements.push(
        <Typography
          key={`h3-${i}`}
          component="h3"
          variant="h6"
          sx={{
            fontWeight: 700,
            fontSize: { xs: '1.15rem', sm: '1.3rem' },
            color: theme.palette.text.primary,
            mt: 3.5,
            mb: 1.5,
            scrollMarginTop: '110px',
          }}
        >
          {title}
        </Typography>
      );
      continue;
    }

    // Callout / Blockquote (> Note)
    if (line.startsWith('> ')) {
      flushList();
      const quoteText = line
        .replace(/^>\s+/, '')
        .replace(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i, '');
      elements.push(
        <Box
          key={`quote-${i}`}
          sx={{
            my: 2.5,
            p: 2.5,
            borderInlineStart: `4px solid ${theme.custom.color.brandPrimary}`,
            backgroundColor: alpha(theme.custom.color.brandPrimary, theme.palette.mode === 'dark' ? 0.12 : 0.05),
            borderRadius: `${theme.custom.radius.sm}px`,
          }}
        >
          <Typography
            variant="body1"
            sx={{
              lineHeight: 1.85,
              color: theme.palette.text.primary,
              fontWeight: 500,
              fontSize: '1rem',
            }}
          >
            {renderInlineFormatted(quoteText)}
          </Typography>
        </Box>
      );
      continue;
    }

    // Unordered List (* or -)
    if (/^[*•-]\s+/.test(line)) {
      const itemText = line.replace(/^[*•-]\s+/, '');
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(itemText);
      continue;
    }

    // Ordered List (1. 2. etc.)
    if (/^\d+\.\s+/.test(line)) {
      const itemText = line.replace(/^\d+\.\s+/, '');
      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(itemText);
      continue;
    }

    // Standard Paragraph
    flushList();
    elements.push(
      <Typography
        key={`p-${i}`}
        variant="body1"
        sx={{
          lineHeight: 1.9,
          fontSize: '1.05rem',
          color: 'text.secondary',
          mb: 2.25,
        }}
      >
        {renderInlineFormatted(line)}
      </Typography>
    );
  }

  flushList();
  return elements;
};

const BlogPostPage = () => {
  const theme = useTheme();
  const { t, currentLanguage } = useTranslation();
  const { slug } = useParams();
  const isRTL = currentLanguage === 'ar';

  const [readingProgress, setReadingProgress] = useState(0);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Scroll to top on slug change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // Track reading progress
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        setReadingProgress(Math.min(100, Math.max(0, (scrollTop / scrollHeight) * 100)));
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const currentIndex = useMemo(() => {
    return blogPostsData.findIndex((p) => p.slug === slug);
  }, [slug]);

  const post = currentIndex !== -1 ? blogPostsData[currentIndex] : null;

  const prevPost = currentIndex > 0 ? blogPostsData[currentIndex - 1] : null;
  const nextPost = currentIndex !== -1 && currentIndex < blogPostsData.length - 1 ? blogPostsData[currentIndex + 1] : null;

  const relatedPosts = useMemo(() => {
    if (!post) return [];
    const sameCategory = blogPostsData.filter((p) => p.slug !== slug && p.categoryKey === post.categoryKey);
    if (sameCategory.length >= 2) return sameCategory.slice(0, 2);
    const others = blogPostsData.filter((p) => p.slug !== slug && p.categoryKey !== post.categoryKey);
    return [...sameCategory, ...others].slice(0, 2);
  }, [post, slug]);

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
  const headings = extractHeadings(localized.content);

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

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopyFeedback(true);
    }
  };

  const shareUrl = window.location.href;
  const shareTitle = localized.title;

  return (
    <>
      <SeoMeta
        title={`${localized.title} | Mafqoudat Blog`}
        description={localized.excerpt}
        path={path}
        image={buildAbsoluteUrl(post.image)}
        structuredData={structuredData}
      />

      {/* Top Reading Progress Bar */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: `${readingProgress}%`,
          height: '4px',
          backgroundColor: theme.custom.color.brandPrimary,
          zIndex: 1400,
          transition: 'width 0.1s ease',
          boxShadow: `0 0 8px ${alpha(theme.custom.color.brandPrimary, 0.6)}`,
        }}
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
                  fontWeight: 800,
                  mb: 2,
                  lineHeight: 1.25,
                  fontSize: { xs: '1.75rem', sm: '2.15rem', md: '2.5rem' },
                  fontFamily: theme.custom.font.display,
                  color: theme.custom.color.ink,
                  letterSpacing: '-0.02em',
                }}
              >
                {localized.title}
              </Typography>

              {/* Author & Meta Row */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 1.5,
                  mb: 3,
                  color: 'text.secondary',
                }}
              >
                <Avatar
                  src="/author-avatar.jpg"
                  alt={t('founderName')}
                  sx={{
                    width: 32,
                    height: 32,
                    border: `2px solid ${theme.custom.color.brandPrimary}`,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                  }}
                >
                  N
                </Avatar>
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  {t('founderName')}
                </Typography>
                <Box component="span" sx={{ opacity: 0.5 }}>•</Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CalendarToday sx={{ fontSize: 16 }} />
                  <Typography variant="body2">
                    {new Date(post.date).toLocaleDateString(currentLanguage, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Typography>
                </Box>
                <Box component="span" sx={{ opacity: 0.5 }}>•</Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Visibility sx={{ fontSize: 16 }} />
                  <Typography variant="body2">{post.readTime}</Typography>
                </Box>
              </Box>

              {/* Featured Image */}
              <Box
                component="img"
                src={post.image}
                alt={localized.title}
                decoding="async"
                sx={{
                  width: '100%',
                  maxHeight: 460,
                  objectFit: 'cover',
                  borderRadius: `${theme.custom.radius.lg}px`,
                  mb: 4,
                  backgroundColor: theme.custom.color.surfaceRaised,
                  boxShadow: theme.custom.elevation.e1,
                }}
              />

              {/* In-page Table of Contents (Shown if article has 2+ headings) */}
              {headings.length >= 2 && (
                <SurfaceCard
                  sx={{
                    p: { xs: 2.5, sm: 3 },
                    mb: 4,
                    backgroundColor: alpha(theme.custom.color.surfaceRaised, theme.palette.mode === 'dark' ? 0.9 : 0.8),
                    border: `1px solid ${alpha(theme.custom.color.brandPrimary, 0.2)}`,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <MenuBookOutlined sx={{ color: theme.custom.color.brandPrimary, fontSize: 22 }} />
                    <Typography
                      variant="h6"
                      component="h3"
                      sx={{
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        fontFamily: theme.custom.font.display,
                        color: theme.custom.color.ink,
                      }}
                    >
                      {t('tableOfContents')}
                    </Typography>
                  </Box>
                  <Box
                    component="ol"
                    sx={{
                      m: 0,
                      paddingInlineStart: 2.5,
                      '& li': {
                        mb: 1.25,
                        color: theme.custom.color.brandPrimary,
                        fontSize: '0.96rem',
                        fontWeight: 600,
                      },
                    }}
                  >
                    {headings.map(({ id, title }) => (
                      <li key={id}>
                        <Box
                          component="a"
                          href={`#${id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            const el = document.getElementById(id);
                            if (el) {
                              const top = el.getBoundingClientRect().top + window.pageYOffset - 95;
                              window.scrollTo({ top, behavior: 'smooth' });
                            }
                          }}
                          sx={{
                            color: theme.palette.text.primary,
                            fontWeight: 500,
                            textDecoration: 'none',
                            cursor: 'pointer',
                            '&:hover': {
                              color: theme.custom.color.brandPrimary,
                              textDecoration: 'underline',
                            },
                          }}
                        >
                          {title}
                        </Box>
                      </li>
                    ))}
                  </Box>
                </SurfaceCard>
              )}

              {/* Main Content Card */}
              <SurfaceCard sx={{ p: { xs: 2.5, sm: 3.5, md: 5 }, mb: 4 }}>
                {renderFormattedContent(localized.content, theme)}
              </SurfaceCard>

              {/* Tags & Share Row */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  justifyContent: 'space-between',
                  gap: 2,
                  mb: 4,
                  p: 2,
                  borderRadius: `${theme.custom.radius.md}px`,
                  backgroundColor: alpha(theme.custom.color.ink, theme.palette.mode === 'dark' ? 0.05 : 0.025),
                }}
              >
                {/* Tags */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                  {tags.map((tag) => (
                    <Chip key={tag} label={tag} size="small" variant="outlined" />
                  ))}
                </Box>

                {/* Share Buttons */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', display: { xs: 'none', sm: 'inline' } }}>
                    {t('shareArticle')}:
                  </Typography>
                  <Tooltip title="WhatsApp">
                    <IconButton
                      component="a"
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareTitle + ' ' + shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="small"
                      sx={{
                        color: '#25D366',
                        backgroundColor: alpha('#25D366', 0.1),
                        '&:hover': { backgroundColor: alpha('#25D366', 0.2) },
                      }}
                    >
                      <WhatsApp fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Facebook">
                    <IconButton
                      component="a"
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="small"
                      sx={{
                        color: '#1877F2',
                        backgroundColor: alpha('#1877F2', 0.1),
                        '&:hover': { backgroundColor: alpha('#1877F2', 0.2) },
                      }}
                    >
                      <Facebook fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('shareArticle')}>
                    <IconButton
                      onClick={handleCopyLink}
                      size="small"
                      sx={{
                        color: theme.custom.color.brandPrimary,
                        backgroundColor: alpha(theme.custom.color.brandPrimary, 0.1),
                        '&:hover': { backgroundColor: alpha(theme.custom.color.brandPrimary, 0.2) },
                      }}
                    >
                      <ContentCopyOutlined fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {/* Author Bio Box - AdSense E-E-A-T */}
              <SurfaceCard
                sx={{
                  p: { xs: 2.5, md: 3.5 },
                  mb: 5,
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

              {/* Inter-Article Pagination (Previous & Next Article Navigation Cards) */}
              {(prevPost || nextPost) && (
                <Grid container spacing={2.5} sx={{ mb: 5 }}>
                  {prevPost ? (
                    <Grid item xs={12} sm={6}>
                      <SurfaceCard
                        component={Link}
                        to={`/blog/${prevPost.slug}`}
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          p: 2.5,
                          height: '100%',
                          textDecoration: 'none',
                          color: 'inherit',
                          borderRadius: `${theme.custom.radius.lg}px`,
                          transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-3px)',
                            boxShadow: theme.custom.elevation.e2,
                            borderColor: theme.custom.color.brandPrimary,
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1, color: theme.custom.color.brandPrimary }}>
                          {isRTL ? <ArrowForward sx={{ fontSize: 16 }} /> : <ArrowBack sx={{ fontSize: 16 }} />}
                          <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {t('previousArticle')}
                          </Typography>
                        </Box>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: 700,
                            lineHeight: 1.4,
                            color: 'text.primary',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {prevPost.i18n[currentLanguage]?.title || prevPost.i18n.en.title}
                        </Typography>
                      </SurfaceCard>
                    </Grid>
                  ) : (
                    <Grid item xs={12} sm={6} />
                  )}

                  {nextPost && (
                    <Grid item xs={12} sm={6}>
                      <SurfaceCard
                        component={Link}
                        to={`/blog/${nextPost.slug}`}
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: { xs: 'flex-start', sm: isRTL ? 'flex-start' : 'flex-end' },
                          p: 2.5,
                          height: '100%',
                          textDecoration: 'none',
                          color: 'inherit',
                          borderRadius: `${theme.custom.radius.lg}px`,
                          textAlign: { xs: 'left', sm: isRTL ? 'left' : 'right' },
                          transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-3px)',
                            boxShadow: theme.custom.elevation.e2,
                            borderColor: theme.custom.color.brandPrimary,
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1, color: theme.custom.color.brandPrimary }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {t('nextArticle')}
                          </Typography>
                          {isRTL ? <ArrowBack sx={{ fontSize: 16 }} /> : <ArrowForward sx={{ fontSize: 16 }} />}
                        </Box>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: 700,
                            lineHeight: 1.4,
                            color: 'text.primary',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {nextPost.i18n[currentLanguage]?.title || nextPost.i18n.en.title}
                        </Typography>
                      </SurfaceCard>
                    </Grid>
                  )}
                </Grid>
              )}

              {/* Related Articles Section */}
              {relatedPosts.length > 0 && (
                <Box sx={{ mb: 6 }}>
                  <Typography
                    variant="h5"
                    component="h3"
                    sx={{
                      fontWeight: 800,
                      fontSize: { xs: '1.3rem', sm: '1.5rem' },
                      fontFamily: theme.custom.font.display,
                      color: theme.custom.color.ink,
                      mb: 2.5,
                    }}
                  >
                    {t('relatedArticles')}
                  </Typography>

                  <Grid container spacing={3}>
                    {relatedPosts.map((item) => {
                      const itemLoc = item.i18n[currentLanguage] || item.i18n.en;
                      return (
                        <Grid item xs={12} sm={6} key={item.id}>
                          <SurfaceCard
                            component={Link}
                            to={`/blog/${item.slug}`}
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              height: '100%',
                              borderRadius: `${theme.custom.radius.lg}px`,
                              overflow: 'hidden',
                              textDecoration: 'none',
                              color: 'inherit',
                              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                              '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: theme.custom.elevation.e3,
                              },
                            }}
                          >
                            <Box
                              component="img"
                              src={item.image}
                              alt={itemLoc.title}
                              sx={{
                                width: '100%',
                                height: 160,
                                objectFit: 'cover',
                                backgroundColor: theme.custom.color.surfaceRaised,
                              }}
                            />
                            <Box sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Chip label={t(item.categoryKey)} size="small" sx={{ fontSize: '0.72rem', height: 22 }} />
                                <Typography variant="caption" color="text.secondary">
                                  {item.readTime}
                                </Typography>
                              </Box>
                              <Typography
                                variant="subtitle1"
                                sx={{
                                  fontWeight: 700,
                                  lineHeight: 1.4,
                                  color: 'text.primary',
                                  mb: 1,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                }}
                              >
                                {itemLoc.title}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  mb: 2,
                                  flex: 1,
                                }}
                              >
                                {itemLoc.excerpt}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontWeight: 700,
                                  color: theme.custom.color.brandPrimary,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                }}
                              >
                                {t('readMore')}
                                {isRTL ? <ArrowBack sx={{ fontSize: 13 }} /> : <ArrowForward sx={{ fontSize: 13 }} />}
                              </Typography>
                            </Box>
                          </SurfaceCard>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              )}
            </article>
          </Container>
        </Box>
        <DashFooter />
      </Box>

      {/* Copy Link Feedback Snackbar */}
      <Snackbar
        open={copyFeedback}
        autoHideDuration={3000}
        onClose={() => setCopyFeedback(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setCopyFeedback(false)}
          severity="success"
          icon={<Check fontSize="inherit" />}
          sx={{ width: '100%', borderRadius: `${theme.custom.radius.sm}px` }}
        >
          {t('linkCopied')}
        </Alert>
      </Snackbar>
    </>
  );
};

export default BlogPostPage;
