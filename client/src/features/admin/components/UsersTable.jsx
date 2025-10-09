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
  LockReset,
  Delete,
} from '@mui/icons-material';

const UsersTable = ({
  users = [],
  pagination = {},
  page = 0,
  rowsPerPage = 10,
  onPageChange,
  onRowsPerPageChange,
  onViewPosts,
  onResetPassword,
  onDeleteUser,
  isLoading = false,
}) => {
  const theme = useTheme();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (!users || users.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <Typography variant="body1" color="text.secondary">
          No users found
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
              <TableCell>Username</TableCell>
              <TableCell>Email / Phone</TableCell>
              <TableCell>Country</TableCell>
              <TableCell align="center">Role</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell>Joined Date</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow 
                key={user._id}
                sx={{
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.05)' 
                      : 'rgba(0, 0, 0, 0.02)',
                  },
                }}
              >
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {user.username}
                    </Typography>
                    {(user.profile?.firstName || user.profile?.lastName) && (
                      <Typography variant="caption" color="text.secondary">
                        {user.profile?.firstName} {user.profile?.lastName}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    {user.email && (
                      <Typography variant="body2">
                        {user.email}
                      </Typography>
                    )}
                    {user.phone && (
                      <Typography variant="caption" color="text.secondary">
                        {user.phone}
                      </Typography>
                    )}
                    {!user.email && !user.phone && (
                      <Typography variant="caption" color="text.secondary">
                        N/A
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {user.country?.labels?.en || user.country?.names?.en || user.country?.code || 'Unknown'}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={user.role || 'user'}
                    color={user.role === 'admin' ? 'error' : user.role === 'moderator' ? 'warning' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={user.isActive ? 'Active' : 'Inactive'}
                    color={user.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(user.createdAt).toLocaleTimeString()}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Box display="flex" gap={0.5} justifyContent="center">
                    <Tooltip title="View Posts">
                      <IconButton
                        size="small"
                        onClick={() => onViewPosts(user)}
                        sx={{ color: theme.palette.primary.main }}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Reset Password">
                      <IconButton
                        size="small"
                        onClick={() => onResetPassword(user)}
                        sx={{ color: theme.palette.warning.main }}
                      >
                        <LockReset fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete User">
                      <IconButton
                        size="small"
                        onClick={() => onDeleteUser(user)}
                        disabled={user.role === 'admin'}
                        sx={{ 
                          color: user.role === 'admin' 
                            ? theme.palette.action.disabled 
                            : theme.palette.error.main 
                        }}
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
        count={pagination?.totalUsers || 0}
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

export default UsersTable;

