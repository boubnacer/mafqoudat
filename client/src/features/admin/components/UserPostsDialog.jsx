import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
  Alert,
  useTheme,
  Divider,
} from '@mui/material';
import {
  Visibility,
  Delete,
  Close,
} from '@mui/icons-material';
import { useGetUserPostsAdminQuery } from '../adminApiSlice';

const UserPostsDialog = ({
  open,
  onClose,
  userId,
  username,
}) => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const { data, isLoading, error } = useGetUserPostsAdminQuery(
    { userId, page: page + 1, limit: rowsPerPage },
    { skip: !open || !userId }
  );

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

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

  const handleViewPost = (postId) => {
    window.open(`/dash/posts/${postId}`, '_blank');
  };

  const handleDeletePost = (postId) => {
    // This can be implemented to call the delete post mutation
    // You can add delete functionality here if needed
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff',
          backgroundImage: 'none',
          minHeight: '60vh',
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Posts by {username}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Viewing all posts created by this user
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: 0 }}>
        {isLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" p={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box p={3}>
            <Alert severity="error">
              Error loading posts: {error?.data?.message || error?.message}
            </Alert>
          </Box>
        ) : !data?.data?.posts || data.data.posts.length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" p={4}>
            <Typography variant="body1" color="text.secondary">
              No posts found for this user
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Description</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.data.posts.map((post) => (
                    <TableRow 
                      key={post._id}
                      sx={{
                        '&:hover': {
                          backgroundColor: theme.palette.mode === 'dark' 
                            ? 'rgba(255, 255, 255, 0.05)' 
                            : 'rgba(0, 0, 0, 0.02)',
                        },
                      }}
                    >
                      <TableCell>
                        <Box sx={{ maxWidth: 250 }}>
                          <Typography 
                            variant="body2" 
                            noWrap
                            sx={{ 
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {post.description || 'No description'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {post.category?.labels?.en || post.category?.code || 'Unknown'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ maxWidth: 200 }}>
                          <Typography variant="body2" noWrap>
                            {post.exactLocation || 'N/A'}
                          </Typography>
                          {post.city?.labels?.en && (
                            <Typography variant="caption" color="text.secondary">
                              {post.city.labels.en}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={post.status || 'active'}
                          color={getStatusColor(post.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(post.createdAt).toLocaleTimeString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" gap={0.5} justifyContent="center">
                          <Tooltip title="View Post">
                            <IconButton
                              size="small"
                              onClick={() => handleViewPost(post._id)}
                              sx={{ color: theme.palette.primary.main }}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Post">
                            <IconButton
                              size="small"
                              onClick={() => handleDeletePost(post._id)}
                              sx={{ color: theme.palette.error.main }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={data?.data?.pagination?.totalPosts || 0}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              sx={{
                borderTop: `1px solid ${theme.palette.divider}`,
              }}
            />
          </>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserPostsDialog;

