import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Chip,
  IconButton,
  useTheme,
  Divider,
  Card,
  CardMedia,
} from '@mui/material';
import {
  Close,
  Visibility,
  Delete,
  Person,
  Category,
  LocationOn,
  Phone,
  CalendarToday,
  Public,
  Label,
} from '@mui/icons-material';

const PostDetailsDialog = ({
  open,
  onClose,
  post,
  onDelete,
}) => {
  const theme = useTheme();

  if (!post) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'resolved':
        return 'info';
      case 'expired':
        return 'warning';
      case 'suspended':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleViewPost = () => {
    window.open(`/dash/posts/${post._id}`, '_blank');
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      onDelete(post);
      onClose();
    }
  };

  const imageUrl = post.cloudinaryUrl || post.image;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff',
          backgroundImage: 'none',
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" fontWeight="bold">
            Post Details
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2 }}>
        <Grid container spacing={3}>
          {/* Image Section */}
          {imageUrl && (
            <Grid item xs={12}>
              <Card>
                <CardMedia
                  component="img"
                  image={imageUrl}
                  alt="Post image"
                  sx={{
                    maxHeight: 300,
                    objectFit: 'contain',
                    backgroundColor: theme.palette.mode === 'dark' ? '#000' : '#f5f5f5',
                  }}
                />
              </Card>
            </Grid>
          )}

          {/* Status Section */}
          <Grid item xs={12}>
            <Box display="flex" gap={1} flexWrap="wrap">
              <Chip
                label={post.status || 'active'}
                color={getStatusColor(post.status)}
                size="medium"
              />
              {post.returned && (
                <Chip
                  label="Returned"
                  color="info"
                  size="medium"
                />
              )}
              {post.promotionRequested && (
                <Chip
                  label={post.promotionProcessed ? "Promotion Processed" : "Promotion Requested"}
                  color={post.promotionProcessed ? "success" : "warning"}
                  size="medium"
                  variant="outlined"
                />
              )}
            </Box>
          </Grid>

          {/* Description */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Description
            </Typography>
            <Typography variant="body1">
              {post.description || 'No description provided'}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* User Information */}
          <Grid item xs={12} sm={6}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Person sx={{ color: theme.palette.primary.main }} />
              <Typography variant="subtitle2" color="text.secondary">
                User
              </Typography>
            </Box>
            <Typography variant="body1" fontWeight="bold">
              {post.user?.username || 'Unknown'}
            </Typography>
            {post.user?.email && (
              <Typography variant="body2" color="text.secondary">
                {post.user.email}
              </Typography>
            )}
          </Grid>

          {/* Category */}
          <Grid item xs={12} sm={6}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Category sx={{ color: theme.palette.primary.main }} />
              <Typography variant="subtitle2" color="text.secondary">
                Category
              </Typography>
            </Box>
            <Typography variant="body1">
              {post.category?.labels?.en || post.category?.code || 'Unknown'}
            </Typography>
            {post.foundLost?.code && (
              <Chip 
                label={post.foundLost.code} 
                size="small" 
                sx={{ mt: 0.5 }}
              />
            )}
          </Grid>

          {/* Country */}
          <Grid item xs={12} sm={6}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Public sx={{ color: theme.palette.primary.main }} />
              <Typography variant="subtitle2" color="text.secondary">
                Country
              </Typography>
            </Box>
            <Typography variant="body1">
              {post.country?.labels?.en || post.country?.names?.en || post.country?.code || 'Unknown'}
            </Typography>
          </Grid>

          {/* City */}
          {post.city && (
            <Grid item xs={12} sm={6}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <LocationOn sx={{ color: theme.palette.primary.main }} />
                <Typography variant="subtitle2" color="text.secondary">
                  City
                </Typography>
              </Box>
              <Typography variant="body1">
                {post.city?.labels?.en || post.city || 'N/A'}
              </Typography>
            </Grid>
          )}

          {/* Exact Location */}
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <LocationOn sx={{ color: theme.palette.primary.main }} />
              <Typography variant="subtitle2" color="text.secondary">
                Exact Location
              </Typography>
            </Box>
            <Typography variant="body1">
              {post.exactLocation || 'N/A'}
            </Typography>
          </Grid>

          {/* Contact */}
          <Grid item xs={12} sm={6}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Phone sx={{ color: theme.palette.primary.main }} />
              <Typography variant="subtitle2" color="text.secondary">
                Contact
              </Typography>
            </Box>
            <Typography variant="body1">
              {post.contact || 'N/A'}
            </Typography>
          </Grid>

          {/* Views */}
          {post.views !== undefined && (
            <Grid item xs={12} sm={6}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Visibility sx={{ color: theme.palette.primary.main }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Views
                </Typography>
              </Box>
              <Typography variant="body1">
                {post.views}
              </Typography>
            </Grid>
          )}

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Dates */}
          <Grid item xs={12} sm={6}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <CalendarToday sx={{ color: theme.palette.primary.main }} />
              <Typography variant="subtitle2" color="text.secondary">
                Created At
              </Typography>
            </Box>
            <Typography variant="body1">
              {new Date(post.createdAt).toLocaleString()}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <CalendarToday sx={{ color: theme.palette.primary.main }} />
              <Typography variant="subtitle2" color="text.secondary">
                Updated At
              </Typography>
            </Box>
            <Typography variant="body1">
              {new Date(post.updatedAt).toLocaleString()}
            </Typography>
          </Grid>

          {/* Main Date (when item was lost/found) */}
          {post.mainDate && (
            <Grid item xs={12} sm={6}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Label sx={{ color: theme.palette.primary.main }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Item Date
                </Typography>
              </Box>
              <Typography variant="body1">
                {post.mainDate}
              </Typography>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>
          Close
        </Button>
        <Button
          onClick={handleDelete}
          color="error"
          variant="outlined"
          startIcon={<Delete />}
        >
          Delete Post
        </Button>
        <Button
          onClick={handleViewPost}
          variant="contained"
          startIcon={<Visibility />}
        >
          View Full Post
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PostDetailsDialog;

