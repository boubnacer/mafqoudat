import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Container,
  useTheme,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Block as BlockIcon, Person as PersonIcon } from '@mui/icons-material';
import { useTranslation } from '../../utils/translations';
import useAuth from '../../hooks/useAuth';
import {
  useGetBlockedUsersQuery,
  useUnblockUserMutation,
} from '../../features/userSettings/usersApiSlice';
import Navbar from '../Navbar';
import DashFooter from '../Footer/DashFooter';

/**
 * Management side of the block action on a post page - the web twin of the
 * mobile app's BlockedUsersScreen.
 *
 * The block itself is enforced server-side on every listing and notification
 * read, so a block made on the phone already applies here; without this page
 * it could not be undone here, which is why it exists.
 */
const BlockedUsers = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const { data, isLoading, isError, refetch } = useGetBlockedUsersQuery(undefined, {
    skip: !isAuthenticated,
  });
  const [unblockUser] = useUnblockUserMutation();
  // Per-row, so unblocking one entry never disables the rest of the list.
  const [pendingId, setPendingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const blocked = data?.blocked || [];

  const handleUnblock = async (userId) => {
    setPendingId(userId);
    setErrorMessage('');
    try {
      await unblockUser({ userId }).unwrap();
    } catch (error) {
      setErrorMessage(error?.data?.message || t('unblockUserError'));
    } finally {
      setPendingId(null);
    }
  };

  const renderBody = () => {
    if (!isAuthenticated) {
      return (
        <Box textAlign="center">
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            {t('deleteAccountSignInPrompt')}
          </Typography>
          <Button variant="contained" onClick={() => navigate('/login')}>
            {t('login')}
          </Button>
        </Box>
      );
    }

    if (isLoading) {
      return (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      );
    }

    if (isError) {
      return (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={refetch}>
              {t('retry')}
            </Button>
          }
        >
          {t('blockedUsersError')}
        </Alert>
      );
    }

    if (blocked.length === 0) {
      return (
        <Typography variant="body1" color="text.secondary" textAlign="center" py={3}>
          {t('blockedUsersEmptyMessage')}
        </Typography>
      );
    }

    return (
      <List>
        {blocked.map((entry) => {
          const fullName = [entry.firstName, entry.lastName].filter(Boolean).join(' ');
          return (
            <ListItem
              key={entry.id}
              divider
              secondaryAction={
                <Button
                  variant="outlined"
                  size="small"
                  disabled={pendingId === entry.id}
                  onClick={() => handleUnblock(entry.id)}
                >
                  {pendingId === entry.id ? (
                    <CircularProgress size={16} />
                  ) : (
                    t('unblockUser')
                  )}
                </Button>
              }
            >
              <ListItemAvatar>
                <Avatar>
                  <PersonIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary={entry.username} secondary={fullName || null} />
            </ListItem>
          );
        })}
      </List>
    );
  };

  return (
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
          <Container maxWidth="md">
            <Paper
              elevation={2}
              sx={{
                p: { xs: 2, md: 4 },
                borderRadius: 2,
                background:
                  theme.palette.mode === 'dark'
                    ? 'linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 100%)'
                    : 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
              }}
            >
              <Box textAlign="center" mb={3}>
                <BlockIcon color="action" sx={{ fontSize: { xs: 40, md: 52 }, mb: 1 }} />
                <Typography
                  variant="h4"
                  component="h1"
                  sx={{ fontWeight: 'bold', mb: 1, color: theme.palette.text.primary }}
                >
                  {t('blockedUsers')}
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ maxWidth: '600px', mx: 'auto' }}
                >
                  {t('blockedUsersIntro')}
                </Typography>
              </Box>

              <Divider sx={{ mb: 3 }} />

              {errorMessage ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {errorMessage}
                </Alert>
              ) : null}

              {renderBody()}
            </Paper>
          </Container>
        </Box>
        <DashFooter />
      </Box>
    </Box>
  );
};

export default BlockedUsers;
