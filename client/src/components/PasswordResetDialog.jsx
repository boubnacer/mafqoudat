import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  useTheme,
} from '@mui/material';
import { LockReset, CheckCircle } from '@mui/icons-material';
import { useTranslation } from '../utils/translations';
import axios from 'axios';

const PasswordResetDialog = ({ open, onClose }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  
  const [contactInfo, setContactInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    // Validate input
    if (!contactInfo.trim()) {
      setError(t('pleaseProvideContactInfo'));
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Submit password reset request
      await axios.post('/api/password-reset/request', {
        contactInfo: contactInfo.trim()
      });

      setSuccess(true);
      setContactInfo('');
      
      // Close dialog after 3 seconds
      setTimeout(() => {
        handleClose();
      }, 3000);
    } catch (err) {
      console.error('Error submitting password reset request:', err);
      
      // Handle specific error cases
      if (err.response?.status === 404) {
        // User not found
        setError(t('userNotFound'));
      } else if (err.response?.data?.message) {
        // Server returned an error message
        setError(err.response.data.message);
      } else {
        // Generic error
        setError(t('resetRequestError'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setContactInfo('');
    setError('');
    setSuccess(false);
    onClose();
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !isSubmitting && !success) {
      handleSubmit();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff',
          backgroundImage: 'none',
          borderRadius: 3,
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <LockReset sx={{ color: '#4A8BFF' }} />
          <Typography variant="h6" fontWeight="bold" color="text.primary">
            {t('resetPasswordDialogTitle')}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {success ? (
          <Box textAlign="center" py={3}>
            <CheckCircle
              sx={{
                fontSize: 64,
                color: theme.palette.success.main,
                mb: 2,
              }}
            />
            <Typography variant="h6" gutterBottom color="success.main">
              {t('resetRequestSubmitted')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('resetRequestSuccessMessage')}
            </Typography>
          </Box>
        ) : (
          <Box>
            <Typography variant="body1" paragraph sx={{ mb: 3 }} color="text.primary">
              {t('resetPasswordMessage')}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            <TextField
              fullWidth
              label={t('contactInfoLabel')}
              placeholder={t('contactInfoPlaceholder')}
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isSubmitting}
              autoFocus
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.02)',
                  border: `1px solid ${theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.1)' 
                    : 'rgba(0, 0, 0, 0.1)'}`,
                  '&:hover': {
                    borderColor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.2)' 
                      : 'rgba(0, 0, 0, 0.2)',
                  },
                  '&.Mui-focused': {
                    borderColor: '#4A8BFF',
                    boxShadow: `0 0 0 2px ${theme.palette.mode === 'dark' 
                      ? 'rgba(74, 139, 255, 0.2)' 
                      : 'rgba(74, 139, 255, 0.1)'}`,
                  }
                },
                '& .MuiInputLabel-root': {
                  color: theme.palette.text.primary,
                  fontWeight: 500,
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#4A8BFF',
                }
              }}
            />
          </Box>
        )}
      </DialogContent>

      {!success && (
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleClose}
            disabled={isSubmitting}
            sx={{ 
              textTransform: 'none',
              color: theme.palette.text.primary,
              fontWeight: 500,
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.05)',
              }
            }}
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isSubmitting || !contactInfo.trim()}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              px: 3,
            }}
          >
            {isSubmitting ? t('submitting') : t('submitRequest')}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default PasswordResetDialog;

