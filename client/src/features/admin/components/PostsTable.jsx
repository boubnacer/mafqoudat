import React from 'react';
import {
  Box,
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
  Typography,
  CircularProgress,
  useTheme,
  Paper,
} from '@mui/material';
import {
  Visibility,
  Delete,
} from '@mui/icons-material';

const PostsTable = ({
  posts = [],
  pagination = {},
  page = 0,
  rowsPerPage = 10,
  onPageChange,
  onRowsPerPageChange,
  onViewPost,
  onDeletePost,
  isLoading = false,
}) => {
  const theme = useTheme();

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

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <Typography variant="body1" color="text.secondary">
          No posts found
        </Typography>
      </Box>
    );
  }

  return (
    <Paper>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Description</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Category</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {posts.map((post) => (
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
                      sx={{ 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {post.description || 'No description'}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {post.user?.username || 'Unknown'}
                  </Typography>
                  {post.user?.email && (
                    <Typography variant="caption" color="text.secondary">
                      {post.user.email}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2">
                      {post.category?.labels?.en || post.category?.code || 'Unknown'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {post.foundLost?.code || ''}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Box display="flex" flexDirection="column" alignItems="center" gap={0.5}>
                    <Chip
                      label={post.status || 'active'}
                      color={getStatusColor(post.status)}
                      size="small"
                    />
                    {post.returned && (
                      <Chip
                        label="Returned"
                        color="info"
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
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
                    {post.country?.labels?.en && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {post.country.labels.en}
                      </Typography>
                    )}
                  </Box>
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
                        onClick={() => onViewPost(post)}
                        sx={{ color: theme.palette.primary.main }}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Post">
                      <IconButton
                        size="small"
                        onClick={() => onDeletePost(post)}
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
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={pagination?.totalPosts || 0}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        sx={{
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      />
    </Paper>
  );
};

export default PostsTable;

