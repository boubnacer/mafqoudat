import React, { useState } from 'react';
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
  Paper, 
  alpha,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import { 
  PersonOutline, 
  Edit, 
  Visibility, 
  Add, 
  AccessTime, 
  ArrowBack,
  DeleteOutline 
} from '@mui/icons-material';
import { useTranslation } from '../../../utils/translations';
import { getOptimizedImageUrl } from '../../../utils/cloudinaryUtils';
import ReachRow from '../../../components/ReachRow';
import noImageSvg from '../../../img/noimage.svg';
import { formatDistanceToNow } from 'date-fns';
import { ar, fr, enUS } from 'date-fns/locale';
import { useGetUserPostsQuery, useDeletePostMutation } from '../postsApiSlice';
import useAuth from '../../../hooks/useAuth';
import { API_BASE_URL } from '../../../config/api';

const MyPostsPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width:600px)');
  const navigate = useNavigate();
  const { t, currentLanguage } = useTranslation();
  const user = useAuth();

  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Fetch user posts
  const { data: userPostsData, isLoading, isFetching } = useGetUserPostsQuery({
    page,
    pageSize,
    language: currentLanguage || 'ar'
  }, {
    skip: !user?.username && !user?._id && !user?.usernameId,
    refetchOnMountOrArgChange: true
  });

  const [deletePost, { isLoading: isDeleting }] = useDeletePostMutation();
  const [postToDelete, setPostToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const userPosts = userPostsData?.postsWithUser || [];
  const totalPostsCount = userPostsData?.total ?? userPosts.length;
  const totalPages = userPostsData?.totalPages || 0;

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

  const handleDeleteClick = (postId) => {
    setPostToDelete(postId);
  };

  const handleDeleteConfirm = async () => {
    if (!postToDelete) return;
    try {
      await deletePost({ id: postToDelete }).unwrap();
      setSnackbar({
        open: true,
        message: t('postDeletedSuccess') || 'Post deleted successfully',
        severity: 'success',
      });
      setPostToDelete(null);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err?.data?.message || t('error') || 'Failed to delete post',
        severity: 'error',
      });
    }
  };

  const handleDeleteCancel = () => {
    if (!isDeleting) {
      setPostToDelete(null);
    }
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
              {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={item}>
                  <Skeleton variant="rounded" height={320} sx={{ borderRadius: 2 }} />
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
                  color: theme.custom.color.ink,
                  '&:hover': {
                    backgroundColor: alpha(theme.custom.color.ink, 0.1),
                  },
                }}
              >
                {t('back')}
              </Button>
              <PersonOutline sx={{
                color: theme.custom.color.brandPrimary,
                fontSize: '32px'
              }} />
              <Typography
                variant="h4"
                sx={{
                  color: theme.custom.color.ink,
                  fontWeight: 700,
                  fontSize: { xs: '24px', sm: '32px' }
                }}
              >
                {t('myPosts')}
              </Typography>
              <Chip
                label={totalPostsCount}
                size="small"
                sx={{
                  fontWeight: 700,
                  fontSize: '14px',
                  backgroundColor: theme.custom.color.brandPrimary,
                  color: theme.palette.getContrastText(theme.custom.color.brandPrimary),
                }}
              />
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreatePost}
              sx={{
                backgroundColor: theme.custom.color.brandPrimary,
                color: theme.palette.getContrastText(theme.custom.color.brandPrimary),
                boxShadow: `0 3px 5px 2px ${alpha(theme.custom.color.brandPrimary, 0.3)}`,
                '&:hover': {
                  backgroundColor: theme.custom.color.brandPrimary,
                  opacity: 0.9,
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
                  backgroundColor: theme.custom.color.brandPrimary,
                  color: theme.palette.getContrastText(theme.custom.color.brandPrimary),
                  boxShadow: `0 3px 5px 2px ${alpha(theme.custom.color.brandPrimary, 0.3)}`,
                  px: 4,
                  py: 1.5,
                  '&:hover': {
                    backgroundColor: theme.custom.color.brandPrimary,
                    opacity: 0.9,
                    transform: 'translateY(-2px)',
                    boxShadow: `0 6px 10px 2px ${alpha(theme.custom.color.brandPrimary, 0.4)}`,
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
                {userPosts.map((post) => {
                  const isFound = String(post.floptionName || '').toUpperCase() === 'FOUND';
                  const postTitle = post.category?.labels?.[currentLanguage] ||
                    post.Category?.labels?.[currentLanguage] ||
                    post.title ||
                    post.categoryname ||
                    t('unknownItem');

                  return (
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
                          backgroundColor: theme.custom.color.surfaceRaised,
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
                            alt={String(postTitle)}
                            sx={{ 
                              objectFit: post.image && typeof post.image === 'string' ? 'cover' : 'contain',
                              backgroundColor: theme.custom.color.surfaceBase
                            }}
                          />
                          <Chip
                            label={post.foundLost?.labels?.[currentLanguage] || (isFound ? (t('found') || 'Found') : (t('lost') || 'Lost'))}
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 12,
                              right: currentLanguage === 'ar' ? 'auto' : 12,
                              left: currentLanguage === 'ar' ? 12 : 'auto',
                              fontWeight: 700,
                              backgroundColor: isFound
                                ? theme.custom.status.found.main
                                : theme.custom.status.lost.main,
                              color: theme.palette.common.white,
                              boxShadow: theme.custom.elevation.e1,
                            }}
                          />
                        </Box>

                        {/* Content */}
                        <CardContent sx={{ flexGrow: 1, p: 2, display: 'flex', flexDirection: 'column' }}>
                          <Typography
                            variant="h6"
                            component="h3"
                            sx={{
                              fontSize: '18px',
                              fontWeight: 600,
                              mb: 1.5,
                              color: theme.custom.color.ink,
                              lineHeight: 1.3,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              minHeight: '48px'
                            }}
                          >
                            {postTitle}
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
                            {String(post.exactLocation || t('noLocationSpecified') || 'No location specified')}
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

                          {/* Reach stats */}
                          <ReachRow post={post} sx={{ pt: 0, mb: 2 }} />

                          {/* Actions */}
                          <Box sx={{ 
                            display: 'flex', 
                            gap: 1,
                            mt: 'auto',
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
                                py: 0.75,
                                borderColor: theme.custom.color.brandPrimary,
                                color: theme.custom.color.brandPrimary,
                                '&:hover': {
                                  borderColor: theme.custom.color.brandPrimary,
                                  backgroundColor: alpha(theme.custom.color.brandPrimary, 0.1),
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
                                fontSize: '12px',
                                py: 0.75,
                                borderColor: theme.custom.status.pending.main,
                                color: theme.custom.status.pending.main,
                                '&:hover': {
                                  borderColor: theme.custom.status.pending.main,
                                  backgroundColor: alpha(theme.custom.status.pending.main, 0.1),
                                },
                              }}
                            >
                              {t('editPost')}
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<DeleteOutline />}
                              onClick={() => handleDeleteClick(post._id)}
                              sx={{
                                flex: 1,
                                fontSize: '12px',
                                py: 0.75,
                                borderColor: alpha(theme.custom.status.lost.main, 0.5),
                                color: theme.custom.status.lost.main,
                                '&:hover': {
                                  borderColor: theme.custom.status.lost.main,
                                  backgroundColor: theme.custom.status.lost.bg,
                                },
                              }}
                            >
                              {t('delete')}
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>

              {/* Pagination */}
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(e, val) => setPage(val)}
                    color="primary"
                    shape="rounded"
                    size={isMobile ? "small" : "medium"}
                  />
                </Box>
              )}

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
                    backgroundColor: theme.custom.color.brandPrimary,
                    color: theme.palette.getContrastText(theme.custom.color.brandPrimary),
                    boxShadow: `0 4px 12px ${alpha(theme.custom.color.brandPrimary, 0.4)}`,
                    '&:hover': {
                      backgroundColor: theme.custom.color.brandPrimary,
                      opacity: 0.9,
                      transform: 'scale(1.1)',
                      boxShadow: `0 6px 16px ${alpha(theme.custom.color.brandPrimary, 0.5)}`,
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(postToDelete)}
        onClose={handleDeleteCancel}
        PaperProps={{
          sx: {
            borderRadius: `${theme.custom.radius.md}px`,
            p: 1,
            direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: theme.custom.color.ink }}>
          {t('deletePost')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'text.secondary' }}>
            {t('confirmDeletePost')}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleDeleteCancel} disabled={isDeleting} sx={{ color: theme.custom.color.ink }}>
            {t('cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleDeleteConfirm}
            disabled={isDeleting}
            sx={{
              backgroundColor: theme.custom.status.lost.main,
              color: theme.palette.common.white,
              '&:hover': {
                backgroundColor: theme.custom.status.lost.main,
                opacity: 0.9,
              },
            }}
          >
            {isDeleting ? <CircularProgress size={20} color="inherit" /> : t('delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast Feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MyPostsPage;
