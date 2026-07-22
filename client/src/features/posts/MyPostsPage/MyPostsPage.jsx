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
  Skeleton,
  Container,
  Paper
} from '@mui/material';
import { 
  PersonOutline, 
  Edit, 
  Visibility,
  Add,
  AccessTime,
  ArrowBack
} from '@mui/icons-material';
import { useTranslation } from '../../../utils/translations';
import { getOptimizedImageUrl } from '../../../utils/cloudinaryUtils';
import noImageSvg from '../../../img/noimage.svg';
import { formatDistanceToNow } from 'date-fns';
import { ar, fr, enUS } from 'date-fns/locale';
import { useGetUserPostsQuery } from '../postsApiSlice';
import useAuth from '../../../hooks/useAuth';

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3500";

const MyPostsPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width:600px)');
  const navigate = useNavigate();
  const { t, currentLanguage } = useTranslation();
  const user = useAuth();

  // Fetch user posts
  const { data: userPostsData, isLoading } = useGetUserPostsQuery(undefined, {
    skip: !user?.username,
    refetchOnMountOrArgChange: true
  });

  const userPosts = userPostsData?.postsWithUser || [];

  // Format date using date-fns with proper locale support
  const getLocale = () => {
    switch (currentLanguage) {
      case 'ar': return ar;
      case 'fr': return fr;
      default: return enUS;
    }
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

  const handleGoBack = () => {
    navigate('/dash');
  };

  if (isLoading) {
    return (
      <Box 
        pt={{ xs: "5.5rem", sm: "5.5rem" }} 
        sx={{
          minHeight: '100vh',
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(180deg, rgba(18,18,18,0.8) 0%, rgba(28,28,28,0.8) 100%)'
            : 'linear-gradient(180deg, rgba(250,250,250,0.95) 0%, rgba(250,250,250,0.95) 100%)',
          direction: currentLanguage === 'ar' ? 'rtl' : 'ltr'
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Skeleton variant="text" width="30%" height={50} sx={{ mb: 3 }} />
            <Grid container spacing={3}>
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={item}>
                  <Skeleton variant="rounded" height={300} />
                </Grid>
              ))}
            </Grid>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box 
      pt={{ xs: "5.5rem", sm: "5.5rem" }} 
      sx={{
        minHeight: '100vh',
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(180deg, rgba(18,18,18,0.8) 0%, rgba(28,28,28,0.8) 100%)'
          : 'linear-gradient(180deg, rgba(250,250,250,0.95) 0%, rgba(250,250,250,0.95) 100%)',
        direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
        pb: 4
      }}
    >
      <Container maxWidth="xl">
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          {/* Header */}
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              mb: 4,
              flexDirection: currentLanguage === 'ar' ? 'row-reverse' : 'row'
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              flexDirection: currentLanguage === 'ar' ? 'row-reverse' : 'row'
            }}>
              <Button
                startIcon={<ArrowBack />}
                onClick={handleGoBack}
                sx={{
                  color: theme.palette.mode === 'dark' ? '#fff' : '#2c3e50',
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  },
                }}
              >
                {t('back')}
              </Button>
              <PersonOutline sx={{ 
                color: theme.palette.mode === 'dark' ? '#4CAF50' : '#2c3e50', 
                fontSize: '32px'
              }} />
              <Typography
                variant="h4"
                sx={{
                  color: theme.palette.mode === 'dark' ? '#fff' : '#2c3e50',
                  fontWeight: 700,
                  fontSize: { xs: '24px', sm: '32px' }
                }}
              >
                {t('myPosts')}
              </Typography>
              <Chip 
                label={userPosts.length} 
                color="primary" 
                size="small"
                sx={{
                  fontWeight: 700,
                  fontSize: '14px'
                }}
              />
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreatePost}
              sx={{
                background: 'linear-gradient(45deg, #4CAF50 30%, #66BB6A 90%)',
                boxShadow: '0 3px 5px 2px rgba(76, 175, 80, .3)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #66BB6A 30%, #81C784 90%)',
                },
                display: { xs: 'none', sm: 'flex' },
              }}
            >
              {t('createNewPost')}
            </Button>
          </Box>

          {/* Empty State */}
          {userPosts.length === 0 ? (
            <Paper
              elevation={3}
              sx={{
                p: 6,
                textAlign: 'center',
                borderRadius: 3,
                background: theme.palette.mode === 'dark' 
                  ? 'linear-gradient(135deg, rgba(30,30,30,0.95) 0%, rgba(45,45,45,0.95) 100%)'
                  : 'linear-gradient(135deg, rgba(250,250,250,0.95) 0%, rgba(250,250,250,0.95) 100%)',
                backdropFilter: 'blur(10px)',
                border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              }}
            >
              <PersonOutline 
                sx={{ 
                  fontSize: 80, 
                  color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                  mb: 2
                }} 
              />
              <Typography variant="h5" mb={2} fontWeight={600}>
                {t('noPostsYet')}
              </Typography>
              <Typography variant="body1" mb={4} color="text.secondary">
                {t('startByCreatingYourFirstPost')}
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<Add />}
                onClick={handleCreatePost}
                sx={{
                  background: 'linear-gradient(45deg, #4CAF50 30%, #66BB6A 90%)',
                  boxShadow: '0 3px 5px 2px rgba(76, 175, 80, .3)',
                  px: 4,
                  py: 1.5,
                  '&:hover': {
                    background: 'linear-gradient(45deg, #66BB6A 30%, #81C784 90%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 10px 2px rgba(76, 175, 80, .4)',
                  },
                }}
              >
                {t('createNewPost')}
              </Button>
            </Paper>
          ) : (
            <>
              {/* Posts Grid */}
              <Grid container spacing={3}>
                {userPosts.map((post) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={post._id}>
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
                          transform: 'translateY(-4px)',
                          boxShadow: theme.palette.mode === 'dark'
                            ? '0 8px 24px rgba(0,0,0,0.4)'
                            : '0 8px 24px rgba(0,0,0,0.15)',
                        }
                      }}
                    >
                      {/* Image */}
                      <Box sx={{ position: 'relative', height: 200 }}>
                        <CardMedia
                          component="img"
                          height="200"
                          image={post.image && typeof post.image === 'string' ? (post.image.startsWith('http') ? getOptimizedImageUrl(post.image, 'card') : `${API_BASE_URL}/${post.image}`) : noImageSvg}
                          alt={String(post.title || post.categoryname || 'Unknown Item')}
                          sx={{ 
                            objectFit: post.image && typeof post.image === 'string' ? 'cover' : 'contain',
                            backgroundColor: theme.palette.mode === 'dark' ? '#2d2d2d' : '#f5f5f5'
                          }}
                        />
                        <Chip
                          label={post.foundLost?.labels?.[currentLanguage] || t(String(post.floptionName || 'unknown'))}
                          color={String(post.floptionName) === 'found' ? 'success' : 'error'}
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            fontWeight: 600,
                            backgroundColor: String(post.floptionName) === 'found' 
                              ? (theme.palette.mode === 'dark' ? '#2e7d32' : '#4caf50')
                              : (theme.palette.mode === 'dark' ? '#d32f2f' : '#f44336'),
                            color: '#ffffff'
                          }}
                        />
                      </Box>

                      {/* Content */}
                      <CardContent sx={{ flexGrow: 1, p: 2 }}>
                        <Typography
                          variant="h6"
                          component="h3"
                          sx={{
                            fontSize: '18px',
                            fontWeight: 600,
                            mb: 1.5,
                            color: theme.palette.mode === 'dark' ? '#fff' : '#2c3e50',
                            lineHeight: 1.3,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            minHeight: '48px'
                          }}
                        >
                          {post.category?.labels?.[currentLanguage] || post.categoryname || 'Unknown Item'}
                        </Typography>

                        <Typography
                          variant="body2"
                          sx={{
                            color: 'text.secondary',
                            mb: 1.5,
                            fontSize: '14px',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            minHeight: '40px'
                          }}
                        >
                          {String(post.exactLocation || 'No location specified')}
                        </Typography>

                        <Typography
                          variant="caption"
                          sx={{
                            color: 'text.secondary',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            mb: 2
                          }}
                        >
                          <AccessTime sx={{ fontSize: '14px' }} />
                          {formatDistanceToNow(new Date(post.createdAt), { 
                            addSuffix: true,
                            locale: getLocale()
                          })}
                        </Typography>

                        {/* Actions */}
                        <Box sx={{ 
                          display: 'flex', 
                          gap: 1,
                          flexDirection: currentLanguage === 'ar' ? 'row-reverse' : 'row'
                        }}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Visibility />}
                            onClick={() => handleViewPost(post._id)}
                            sx={{
                              flex: 1,
                              fontSize: '13px',
                              py: 0.75,
                              borderColor: theme.palette.mode === 'dark' ? '#4CAF50' : '#2c3e50',
                              color: theme.palette.mode === 'dark' ? '#4CAF50' : '#2c3e50',
                              '&:hover': {
                                borderColor: theme.palette.mode === 'dark' ? '#66BB6A' : '#34495e',
                                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(44, 62, 80, 0.1)',
                              },
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
                              fontSize: '13px',
                              py: 0.75,
                              borderColor: theme.palette.mode === 'dark' ? '#FF9800' : '#2c3e50',
                              color: theme.palette.mode === 'dark' ? '#FF9800' : '#2c3e50',
                              '&:hover': {
                                borderColor: theme.palette.mode === 'dark' ? '#FFB74D' : '#34495e',
                                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.1)' : 'rgba(44, 62, 80, 0.1)',
                              },
                            }}
                          >
                            {t('editPost')}
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Mobile FAB for creating new post */}
              <Box
                sx={{
                  display: { xs: 'flex', sm: 'none' },
                  position: 'fixed',
                  bottom: 24,
                  right: currentLanguage === 'ar' ? 'auto' : 24,
                  left: currentLanguage === 'ar' ? 24 : 'auto',
                  zIndex: 1000
                }}
              >
                <Button
                  variant="contained"
                  onClick={handleCreatePost}
                  sx={{
                    width: 56,
                    height: 56,
                    minWidth: 56,
                    borderRadius: '50%',
                    background: 'linear-gradient(45deg, #4CAF50 30%, #66BB6A 90%)',
                    boxShadow: '0 4px 12px rgba(76, 175, 80, .4)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #66BB6A 30%, #81C784 90%)',
                      transform: 'scale(1.1)',
                      boxShadow: '0 6px 16px rgba(76, 175, 80, .5)',
                    }
                  }}
                >
                  <Add sx={{ fontSize: 28 }} />
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default MyPostsPage;

