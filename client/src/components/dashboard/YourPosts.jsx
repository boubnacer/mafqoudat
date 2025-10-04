import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  CardMedia, 
  Chip, 
  Button, 
  Grid,
  useTheme,
  useMediaQuery,
  Skeleton
} from '@mui/material';
import { 
  PersonOutline, 
  Edit, 
  Visibility,
  Add
} from '@mui/icons-material';
import { useTranslation } from '../../utils/translations';
import { getOptimizedImageUrl } from '../../utils/cloudinaryUtils';
import noImageSvg from '../../img/noimage.svg';

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3500";

const YourPosts = ({ userPosts = [], isLoading = false }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width:600px)');
  const navigate = useNavigate();
  const { t, currentLanguage } = useTranslation();

  // Debug logging for YourPosts component
  console.log('🔍 [YourPosts] Component Debug:', {
    userPosts,
    userPostsLength: userPosts?.length,
    isLoading,
    shouldRender: userPosts && userPosts.length > 0
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(currentLanguage === 'ar' ? 'ar-SA' : currentLanguage === 'fr' ? 'fr-FR' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleViewPost = (postId) => {
    navigate(`/dash/posts/${postId}`);
  };

  const handleEditPost = (postId) => {
    navigate(`/dash/posts/edit/${postId}`);
  };

  const handleCreatePost = () => {
    navigate('/dash/posts/new');
  };

  const handleViewAllPosts = () => {
    navigate('/dash/posts/my-posts');
  };

  if (isLoading) {
    return (
      <Box mb={4}>
        <Box
          sx={{
            backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#ffffff',
            borderRadius: { xs: '16px', sm: '20px' },
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 8px 32px rgba(0,0,0,0.3)'
              : '0 8px 32px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            mx: { xs: 1, sm: 2 },
            maxWidth: '100%',
            border: theme.palette.mode === 'dark' 
              ? '1px solid rgba(255,255,255,0.1)'
              : '1px solid rgba(0,0,0,0.1)',
            direction: currentLanguage === 'ar' ? 'rtl' : 'ltr'
          }}
        >
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Skeleton variant="text" width="60%" height={40} />
            <Skeleton variant="text" width="40%" height={20} sx={{ mt: 1 }} />
          </Box>
          <Box sx={{ p: { xs: 2, sm: 3 }, pt: 0 }}>
            <Grid container spacing={2}>
              {[1, 2].map((item) => (
                <Grid item xs={12} sm={6} key={item}>
                  <Skeleton variant="rounded" height={200} />
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>
      </Box>
    );
  }

  // Don't render the component at all if user has no posts
  if (!userPosts || userPosts.length === 0) {
    return null;
  }

  return (
    <Box mb={4}>
      <Box
        sx={{
          backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#ffffff',
          borderRadius: { xs: '16px', sm: '20px' },
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 8px 32px rgba(0,0,0,0.3)'
            : '0 8px 32px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          mx: { xs: 1, sm: 2 },
          maxWidth: '100%',
          border: theme.palette.mode === 'dark' 
            ? '1px solid rgba(255,255,255,0.1)'
            : '1px solid rgba(0,0,0,0.1)',
          direction: currentLanguage === 'ar' ? 'rtl' : 'ltr'
        }}
      >
        {/* Header Section */}
        <Box 
          sx={{
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
              : '#ffffff',
            p: { xs: 2, sm: 3 },
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 100%)'
                : 'linear-gradient(45deg, rgba(255,255,255,0.2) 0%, transparent 100%)',
              pointerEvents: 'none'
            }
          }}
        >
          {/* Mobile Layout */}
          <Box
            sx={{
              display: { xs: 'block', sm: 'none' },
              textAlign: 'center'
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: 1, 
              mb: 2,
              flexDirection: currentLanguage === 'ar' ? 'row-reverse' : 'row'
            }}>
              <PersonOutline sx={{ 
                color: theme.palette.mode === 'dark' ? '#4CAF50' : '#2c3e50', 
                fontSize: '24px',
                order: currentLanguage === 'ar' ? 2 : 1
              }} />
              <Typography
                variant="h6"
                sx={{
                  color: theme.palette.mode === 'dark' ? '#fff' : '#2c3e50',
                  fontWeight: 700,
                  fontSize: '24px',
                  textAlign: 'center',
                  order: currentLanguage === 'ar' ? 1 : 2
                }}
              >
                {t('yourPosts')}
              </Typography>
            </Box>
          </Box>

          {/* Desktop Layout */}
          <Box
            sx={{
              display: { xs: 'none', sm: 'flex' },
              alignItems: 'center',
              justifyContent: 'space-between',
              flexDirection: currentLanguage === 'ar' ? 'row-reverse' : 'row'
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              order: currentLanguage === 'ar' ? 2 : 1
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1
              }}>
                <PersonOutline sx={{ 
                  color: theme.palette.mode === 'dark' ? '#4CAF50' : '#2c3e50', 
                  fontSize: '28px'
                }} />
                <Typography
                  variant="h5"
                  sx={{
                    color: theme.palette.mode === 'dark' ? '#fff' : '#2c3e50',
                    fontWeight: 700,
                    fontSize: { sm: '22px', md: '24px' }
                  }}
                >
                  {t('yourPosts')}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ order: currentLanguage === 'ar' ? 1 : 2 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={handleViewAllPosts}
                sx={{
                  borderColor: theme.palette.mode === 'dark' ? '#4CAF50' : '#2c3e50',
                  color: theme.palette.mode === 'dark' ? '#4CAF50' : '#2c3e50',
                  '&:hover': {
                    borderColor: theme.palette.mode === 'dark' ? '#66BB6A' : '#34495e',
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(44, 62, 80, 0.1)',
                  }
                }}
              >
                {t('viewAllYourPosts')}
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Content Section */}
        <Box 
          sx={{
            p: { xs: 2, sm: 3 },
            backgroundColor: theme.palette.mode === 'dark' ? '#2d2d2d' : '#ffffff',
            minHeight: '200px',
            borderTop: theme.palette.mode === 'dark' 
              ? '1px solid rgba(255,255,255,0.1)'
              : '1px solid rgba(0,0,0,0.1)',
          }}
        >
          <Grid container spacing={2}>
            {userPosts.slice(0, 4).map((post) => (
              <Grid item xs={12} sm={6} key={post._id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 2,
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 4px 12px rgba(0,0,0,0.3)'
                      : '0 4px 12px rgba(0,0,0,0.1)',
                    backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#ffffff',
                    border: theme.palette.mode === 'dark' 
                      ? '1px solid rgba(255,255,255,0.1)'
                      : '1px solid rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: theme.palette.mode === 'dark'
                        ? '0 8px 24px rgba(0,0,0,0.4)'
                        : '0 8px 24px rgba(0,0,0,0.15)',
                    }
                  }}
                >
                  {/* Image */}
                  <Box sx={{ position: 'relative', height: 160 }}>
                    <CardMedia
                      component="img"
                      height="160"
                      image={post.image ? (post.image.startsWith('http') ? getOptimizedImageUrl(post.image, 'card') : `${API_BASE_URL}/${post.image}`) : noImageSvg}
                      alt={post.title}
                      sx={{ 
                        objectFit: post.image ? 'cover' : 'contain',
                        backgroundColor: theme.palette.mode === 'dark' ? '#2d2d2d' : '#f5f5f5'
                      }}
                    />
                    <Chip
                      label={t(post.foundLost)}
                      color={post.foundLost === 'found' ? 'success' : 'error'}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        fontWeight: 600
                      }}
                    />
                  </Box>

                  {/* Content */}
                  <CardContent sx={{ flexGrow: 1, p: 2 }}>
                    <Typography
                      variant="h6"
                      component="h3"
                      sx={{
                        fontSize: '16px',
                        fontWeight: 600,
                        mb: 1,
                        color: theme.palette.mode === 'dark' ? '#fff' : '#2c3e50',
                        lineHeight: 1.3,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {post.title}
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                        mb: 1,
                        fontSize: '12px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {post.exactLocation}
                    </Typography>

                    <Typography
                      variant="caption"
                      sx={{
                        color: 'text.secondary',
                        fontSize: '11px'
                      }}
                    >
                      {formatDate(post.createdAt)}
                    </Typography>

                    {/* Actions */}
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 1, 
                      mt: 2,
                      flexDirection: currentLanguage === 'ar' ? 'row-reverse' : 'row'
                    }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Visibility />}
                        onClick={() => handleViewPost(post._id)}
                        sx={{
                          flex: 1,
                          fontSize: '12px',
                          py: 0.5,
                          borderColor: theme.palette.mode === 'dark' ? '#4CAF50' : '#2c3e50',
                          color: theme.palette.mode === 'dark' ? '#4CAF50' : '#2c3e50',
                          '&:hover': {
                            borderColor: theme.palette.mode === 'dark' ? '#66BB6A' : '#34495e',
                            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(44, 62, 80, 0.1)',
                          }
                        }}
                      >
                        {t('view')}
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={() => handleEditPost(post._id)}
                        sx={{
                          flex: 1,
                          fontSize: '12px',
                          py: 0.5,
                          borderColor: theme.palette.mode === 'dark' ? '#FF9800' : '#2c3e50',
                          color: theme.palette.mode === 'dark' ? '#FF9800' : '#2c3e50',
                          '&:hover': {
                            borderColor: theme.palette.mode === 'dark' ? '#FFB74D' : '#34495e',
                            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.1)' : 'rgba(44, 62, 80, 0.1)',
                          }
                        }}
                      >
                        {t('edit')}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Mobile View All Button */}
          {userPosts.length > 4 && (
            <Box
              sx={{
                display: { xs: 'flex', sm: 'none' },
                justifyContent: 'center',
                mt: 3,
                pt: 2,
                borderTop: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
              }}
            >
              <Button
                variant="outlined"
                onClick={handleViewAllPosts}
                sx={{
                  borderColor: theme.palette.mode === 'dark' ? '#4CAF50' : '#2c3e50',
                  color: theme.palette.mode === 'dark' ? '#4CAF50' : '#2c3e50',
                  '&:hover': {
                    borderColor: theme.palette.mode === 'dark' ? '#66BB6A' : '#34495e',
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(44, 62, 80, 0.1)',
                  }
                }}
              >
                {t('viewAllYourPosts')}
              </Button>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default YourPosts;
