// Create a comprehensive blog page with multiple articles about lost and found topics
// File: client/src/components/Pages/Blog.jsx

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
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
  Bookmark,
} from '@mui/icons-material';
import { useTranslation } from '../../utils/translations';
import Navbar from '../Navbar';
import DashFooter from '../Footer/DashFooter';

const Blog = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width:600px)');
  const { t, currentLanguage } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 6;

  // Blog articles data
  const blogPosts = [
    {
      id: 1,
      title: t('blogPost1Title'),
      excerpt: t('blogPost1Excerpt'),
      content: t('blogPost1Content'),
      author: t('mafqoudatTeam'),
      date: '2024-01-15',
      category: t('safety'),
      readTime: '5 min',
      image: '/blog-images/safety-tips.png',
      tags: [t('safety'), t('meeting'), t('tips')],
    },
    {
      id: 2,
      title: t('blogPost2Title'),
      excerpt: t('blogPost2Excerpt'),
      content: t('blogPost2Content'),
      author: t('mafqoudatTeam'),
      date: '2024-01-10',
      category: t('guidelines'),
      readTime: '7 min',
      image: '/blog-images/community-guidelines.png',
      tags: [t('community'), t('guidelines'), t('respect')],
    },
    {
      id: 3,
      title: t('blogPost3Title'),
      excerpt: t('blogPost3Excerpt'),
      content: t('blogPost3Content'),
      author: t('mafqoudatTeam'),
      date: '2024-01-05',
      category: t('success'),
      readTime: '4 min',
      image: '/blog-images/success-story.png',
      tags: [t('success'), t('story'), t('reunion')],
    },
    {
      id: 4,
      title: t('blogPost4Title'),
      excerpt: t('blogPost4Excerpt'),
      content: t('blogPost4Content'),
      author: t('mafqoudatTeam'),
      date: '2024-01-01',
      category: t('tips'),
      readTime: '6 min',
      image: '/blog-images/photo-tips.png',
      tags: [t('photography'), t('tips'), t('description')],
    },
    {
      id: 5,
      title: t('blogPost5Title'),
      excerpt: t('blogPost5Excerpt'),
      content: t('blogPost5Content'),
      author: t('mafqoudatTeam'),
      date: '2023-12-28',
      category: t('legal'),
      readTime: '8 min',
      image: '/blog-images/legal-aspects.png',
      tags: [t('legal'), t('rights'), t('responsibilities')],
    },
    {
      id: 6,
      title: t('blogPost6Title'),
      excerpt: t('blogPost6Excerpt'),
      content: t('blogPost6Content'),
      author: t('mafqoudatTeam'),
      date: '2023-12-25',
      category: t('technology'),
      readTime: '5 min',
      image: '/blog-images/technology.png',
      tags: [t('technology'), t('platform'), t('features')],
    },
    {
      id: 7,
      title: t('blogPost7Title'),
      excerpt: t('blogPost7Excerpt'),
      content: t('blogPost7Content'),
      author: t('mafqoudatTeam'),
      date: '2023-12-20',
      category: t('community'),
      readTime: '6 min',
      image: '/blog-images/community-building.png',
      tags: [t('community'), t('building'), t('trust')],
    },
    {
      id: 8,
      title: t('blogPost8Title'),
      excerpt: t('blogPost8Excerpt'),
      content: t('blogPost8Content'),
      author: t('mafqoudatTeam'),
      date: '2023-12-15',
      category: t('prevention'),
      readTime: '4 min',
      image: '/blog-images/prevention.png',
      tags: [t('prevention'), t('tips'), t('security')],
    },
    {
      id: 9,
      title: t('blogPost9Title'),
      excerpt: t('blogPost9Excerpt'),
      content: t('blogPost9Content'),
      author: t('mafqoudatTeam'),
      date: '2023-12-10',
      category: t('international'),
      readTime: '7 min',
      image: '/blog-images/international.png',
      tags: [t('international'), t('travel'), t('crossBorder')],
    },
    {
      id: 10,
      title: t('blogPost10Title'),
      excerpt: t('blogPost10Excerpt'),
      content: t('blogPost10Content'),
      author: t('mafqoudatTeam'),
      date: '2023-12-05',
      category: t('mobile'),
      readTime: '5 min',
      image: '/blog-images/mobile-app.png',
      tags: [t('mobile'), t('app'), t('convenience')],
    },
  ];

  const filteredPosts = blogPosts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const currentPosts = filteredPosts.slice(startIndex, startIndex + postsPerPage);

  return (
    <Box width="100%" height="100%">
      <Box sx={{ backgroundColor: theme.palette.background }}>
        <Navbar />
        <Box
          sx={{
            minHeight: '100vh',
            pt: { xs: '6rem', sm: '7rem' },
            pb: 4,
            backgroundColor: theme.palette.background.default,
          }}
        >
          <Container maxWidth="lg">
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
                          onClick={() => {
                            // Navigate to full article (you can implement this later)
                            console.log('Navigate to article:', post.id);
                          }}
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
  );
};

export default Blog;
