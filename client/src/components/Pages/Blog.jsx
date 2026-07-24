// Blog listing page: sources articles from ../../data/blogPosts.json (single source of
// truth, shared with BlogPostPage.jsx and the build-time SEO prerender script).
// File: client/src/components/Pages/Blog.jsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  useTheme,
  useMediaQuery,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Button,
  TextField,
  InputAdornment,
  Pagination,
} from '@mui/material';
import {
  Search,
  Article,
  CalendarToday,
  Person,
  Visibility,
} from '@mui/icons-material';
import { useTranslation } from '../../utils/translations';
import Navbar from '../Navbar';
import DashFooter from '../Footer/DashFooter';
import SeoMeta from '../SeoMeta';
import blogPostsData from '../../data/blogPosts.json';

const Blog = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width:600px)');
  const { t, currentLanguage } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 6;

  const blogPosts = blogPostsData.map((post) => {
    const localized = post.i18n[currentLanguage] || post.i18n.en;
    return {
      id: post.id,
      slug: post.slug,
      title: localized.title,
      excerpt: localized.excerpt,
      author: t(post.authorKey),
      date: post.date,
      category: t(post.categoryKey),
      readTime: post.readTime,
      image: post.image,
      tags: post.tagKeys.map((key) => t(key)),
    };
  });

  const filteredPosts = blogPosts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const currentPosts = filteredPosts.slice(startIndex, startIndex + postsPerPage);

  return (
    <>
      <SeoMeta pageKey="blog" />
      <Box width="100%" height="100%">
        <Box sx={{ backgroundColor: theme.palette.background.default }}>
          <Navbar />
          <Box
            sx={{
              minHeight: '100vh',
              pt: { xs: '6rem', sm: '7rem' },
              pb: 4,
              backgroundColor: theme.palette.background.default,
            }}
          >
            <Container maxWidth="xl">
              {/* Header */}
              <Box textAlign="center" mb={4}>
                <Typography
                  variant="h3"
                  component="h1"
                  sx={{
                    fontWeight: 'bold',
                    mb: 2,
                    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontSize: { xs: '2rem', md: '3rem' },
                  }}
                >
                  {t('blog')}
                </Typography>
                <Typography
                  variant="h6"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  {t('blogSubtitle')}
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ maxWidth: '800px', mx: 'auto', lineHeight: 1.7 }}
                >
                  {t('blogDescription')}
                </Typography>
              </Box>

              {/* Search Bar */}
              <Box mb={4}>
                <TextField
                  fullWidth
                  placeholder={t('searchBlogPosts')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
              </Box>

              {/* Blog Posts Grid */}
              <Grid container spacing={3} mb={4}>
                {currentPosts.map((post) => (
                  <Grid item xs={12} md={6} lg={4} key={post.id}>
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: theme.shadows[8],
                        },
                      }}
                    >
                      <CardMedia
                        component="img"
                        height="200"
                        image={post.image}
                        alt={post.title}
                        sx={{
                          objectFit: 'cover',
                          backgroundColor: theme.palette.grey[200],
                        }}
                      />
                      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                        <Box mb={2}>
                          <Chip
                            label={post.category}
                            size="small"
                            color="primary"
                            sx={{ mb: 1 }}
                          />
                          <Typography
                            variant="h6"
                            component="h2"
                            sx={{
                              fontWeight: '600',
                              mb: 1,
                              lineHeight: 1.3,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {post.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              mb: 2,
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              lineHeight: 1.5,
                            }}
                          >
                            {post.excerpt}
                          </Typography>
                        </Box>

                        <Box sx={{ mt: 'auto' }}>
                          <Box display="flex" alignItems="center" gap={1} mb={2}>
                            <Person fontSize="small" color="action" />
                            <Typography variant="caption" color="text.secondary">
                              {post.author}
                            </Typography>
                            <CalendarToday fontSize="small" color="action" />
                            <Typography variant="caption" color="text.secondary">
                              {new Date(post.date).toLocaleDateString()}
                            </Typography>
                            <Visibility fontSize="small" color="action" />
                            <Typography variant="caption" color="text.secondary">
                              {post.readTime}
                            </Typography>
                          </Box>

                          <Box display="flex" flexWrap="wrap" gap={0.5} mb={2}>
                            {post.tags.map((tag, index) => (
                              <Chip
                                key={index}
                                label={tag}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem' }}
                              />
                            ))}
                          </Box>

                          <Button
                            variant="outlined"
                            fullWidth
                            startIcon={<Article />}
                            component={Link}
                            to={`/blog/${post.slug}`}
                          >
                            {t('readMore')}
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Pagination */}
              {totalPages > 1 && (
                <Box display="flex" justifyContent="center" mb={4}>
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={(event, value) => setCurrentPage(value)}
                    color="primary"
                    size="large"
                  />
                </Box>
              )}

              {/* No Results */}
              {filteredPosts.length === 0 && (
                <Box textAlign="center" py={8}>
                  <Typography variant="h6" color="text.secondary" mb={2}>
                    {t('noBlogPostsFound')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('tryDifferentSearch')}
                  </Typography>
                </Box>
              )}
            </Container>
          </Box>
          <DashFooter />
        </Box>
      </Box>
    </>
  );
};

export default Blog;
