import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Container,
  useTheme,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  TextField,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  alpha,
} from '@mui/material';
import {
  DeleteForever,
  PhotoLibrary,
  NotificationsActive,
  Person,
  Mail,
  Description,
  PhoneIphone,
  WarningAmber,
  CheckCircle,
} from '@mui/icons-material';
import { useTranslation } from '../../utils/translations';
import useAuth from '../../hooks/useAuth';
import { useDeleteMyAccountMutation } from '../../features/userSettings/usersApiSlice';
import { logOut } from '../../features/auth/authSlice';
import Navbar from '../Navbar';
import DashFooter from '../Footer/DashFooter';
import SeoMeta from '../SeoMeta';

/**
 * Public account-deletion page.
 *
 * Google Play requires two separate things from an app that creates accounts:
 * deletion from inside the app (mobile/src/screens/DeleteAccountScreen.js), and
 * a publicly reachable web URL that explains the process and lets someone start
 * it without installing anything. This page is that URL, so it deliberately
 * renders its explanation to signed-out visitors too - only the form itself is
 * gated, because deletion has to be authenticated.
 *
 * The list of erased data mirrors what the server actually removes
 * (usersController.purgeUserData); keep the two in step.
 */
const DeleteAccount = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, username } = useAuth();

  const [confirmText, setConfirmText] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDone, setIsDone] = useState(false);

  const [deleteMyAccount, { isLoading }] = useDeleteMyAccountMutation();

  // Case-insensitive, matching the server's own comparison.
  const canDelete =
    isAuthenticated &&
    !!username &&
    confirmText.trim().toLowerCase() === username.toLowerCase() &&
    !isLoading;

  const erasedItems = [
    { key: 'deleteAccountItemPosts', icon: <Description color="error" /> },
    { key: 'deleteAccountItemPhotos', icon: <PhotoLibrary color="error" /> },
    { key: 'deleteAccountItemAlerts', icon: <NotificationsActive color="error" /> },
    { key: 'deleteAccountItemProfile', icon: <Person color="error" /> },
    { key: 'deleteAccountItemMessages', icon: <Mail color="error" /> },
  ];

  const handleConfirm = async () => {
    setDialogOpen(false);
    setErrorMessage('');

    try {
      await deleteMyAccount({ confirmUsername: confirmText.trim() }).unwrap();
      // The account no longer exists, so there is nothing to invalidate
      // server-side - just drop the local session.
      dispatch(logOut({ reason: 'account-deleted' }));
      setIsDone(true);
    } catch (error) {
      setErrorMessage(error?.data?.message || t('deleteAccountError'));
    }
  };

  const cardSx = {
    p: { xs: 2, md: 4 },
    borderRadius: 2,
    background:
      theme.palette.mode === 'dark'
        ? 'linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 100%)'
        : 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
  };

  return (
    <>
      <SeoMeta pageKey="deleteAccount" />
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
              <Paper elevation={2} sx={cardSx}>
                <Box textAlign="center" mb={4}>
                  <DeleteForever color="error" sx={{ fontSize: { xs: 48, md: 64 }, mb: 1 }} />
                  <Typography
                    variant="h3"
                    component="h1"
                    sx={{
                      fontWeight: 'bold',
                      mb: 2,
                      fontSize: { xs: '1.9rem', md: '2.75rem' },
                      color: theme.palette.text.primary,
                    }}
                  >
                    {t('deleteAccountPageTitle')}
                  </Typography>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ maxWidth: '700px', mx: 'auto' }}
                  >
                    {t('deleteAccountPageIntro')}
                  </Typography>
                </Box>

                <Divider sx={{ mb: 4 }} />

                {isDone ? (
                  <Alert
                    icon={<CheckCircle fontSize="inherit" />}
                    severity="success"
                    sx={{ mb: 3 }}
                    action={
                      <Button color="inherit" size="small" onClick={() => navigate('/')}>
                        {t('goHome')}
                      </Button>
                    }
                  >
                    {t('deleteAccountDoneMessage')}
                  </Alert>
                ) : (
                  <>
                    <Alert severity="warning" icon={<WarningAmber />} sx={{ mb: 4 }}>
                      {t('deleteAccountWarning')}
                    </Alert>

                    {/* What gets deleted - shown to everyone, signed in or not,
                        since this page doubles as the store-facing explanation. */}
                    <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 1 }}>
                      {t('deleteAccountWhatIsErased')}
                    </Typography>
                    <List dense sx={{ mb: 3 }}>
                      {erasedItems.map((item) => (
                        <ListItem key={item.key} disableGutters>
                          <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                          <ListItemText primary={t(item.key)} />
                        </ListItem>
                      ))}
                    </List>

                    <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 1 }}>
                      {t('deleteAccountRetentionTitle')}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                      {t('deleteAccountRetentionBody')}
                    </Typography>

                    <Divider sx={{ mb: 4 }} />

                    <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 2 }}>
                      {t('deleteAccountHowTitle')}
                    </Typography>

                    {/* Deletion from the phone, described in full so someone who
                        never signs in on the web can still follow it. */}
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 2,
                        mb: 3,
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: alpha(theme.palette.primary.main, 0.06),
                      }}
                    >
                      <PhoneIphone color="primary" />
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {t('deleteAccountFromAppTitle')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t('deleteAccountFromAppSteps')}
                        </Typography>
                      </Box>
                    </Box>

                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                      {t('deleteAccountFromWebTitle')}
                    </Typography>

                    {isAuthenticated ? (
                      <Box component="form" onSubmit={(event) => event.preventDefault()}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {t('deleteAccountConfirmHelper')}{' '}
                          <Box component="span" sx={{ fontWeight: 700 }}>
                            {username}
                          </Box>
                        </Typography>
                        <TextField
                          fullWidth
                          value={confirmText}
                          onChange={(event) => {
                            setConfirmText(event.target.value);
                            if (errorMessage) setErrorMessage('');
                          }}
                          label={t('deleteAccountConfirmPlaceholder')}
                          autoComplete="off"
                          disabled={isLoading}
                          error={!!errorMessage}
                          sx={{ mb: 2 }}
                        />
                        {errorMessage ? (
                          <Alert severity="error" sx={{ mb: 2 }}>
                            {errorMessage}
                          </Alert>
                        ) : null}
                        <Button
                          variant="contained"
                          color="error"
                          size="large"
                          disabled={!canDelete}
                          onClick={() => setDialogOpen(true)}
                          startIcon={isLoading ? <CircularProgress size={18} color="inherit" /> : <DeleteForever />}
                        >
                          {t('deleteAccountAction')}
                        </Button>
                      </Box>
                    ) : (
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {t('deleteAccountSignInPrompt')}
                        </Typography>
                        <Button variant="contained" color="primary" onClick={() => navigate('/login')}>
                          {t('login')}
                        </Button>
                      </Box>
                    )}
                  </>
                )}
              </Paper>
            </Container>
          </Box>
          <DashFooter />
        </Box>
      </Box>

      {/* Second gate: the typed username proves intent, this catches the click
          that followed it by reflex. */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>{t('deleteAccountConfirmTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('deleteAccountConfirmMessage')}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t('cancel')}</Button>
          <Button onClick={handleConfirm} color="error" variant="contained" autoFocus>
            {t('deleteAccountConfirmAction')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DeleteAccount;
