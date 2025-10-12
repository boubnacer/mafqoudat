import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  useTheme,
  alpha,
  Divider
} from '@mui/material';
import { 
  CheckCircle as CheckCircleIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useTranslation } from '../utils/translations';
import { useMarkPostAsReturnedMutation } from '../features/posts/postsApiSlice';

const ClaimItemDialog = ({ 
  open, 
  onClose, 
  postId, 
  isFoundPost = true,
  contactInfo = {},
  onItemMarkedAsReturned
}) => {
  const { t, currentLanguage } = useTranslation();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  const [markAsReturned, { isLoading }] = useMarkPostAsReturnedMutation();

  // Sanitize contact info
  const sanitizedContact = {
    phone: contactInfo?.phone || '',
    email: contactInfo?.additionalContact?.email || '',
    whatsapp: contactInfo?.additionalContact?.whatsapp || '',
    additionalPhone: contactInfo?.additionalContact?.phone || ''
  };

  const handleMarkAsReturned = async () => {
    setError(null);

    if (!postId) {
      setError('Invalid post ID');
      return;
    }

    try {
      const result = await markAsReturned(postId).unwrap();
      
      if (result && result.success) {
        setIsSuccess(true);
        if (onItemMarkedAsReturned) {
          onItemMarkedAsReturned();
        }
        // Auto close after 3 seconds
        setTimeout(() => {
          onClose();
          setIsSuccess(false);
        }, 3000);
      } else {
        throw new Error(result?.message || 'Failed to mark as returned');
      }
    } catch (err) {
      console.error('Mark as returned error:', err);
      setError(err.data?.message || err.message || 'Failed to mark as returned');
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      setIsSuccess(false);
      setError(null);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={isLoading ? undefined : handleClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={isLoading}
      PaperProps={{
        sx: {
          borderRadius: 4,
          backgroundColor: isDarkMode ? alpha('#1a1a1a', 0.95) : '#ffffff',
          backgroundImage: 'none',
          border: isDarkMode ? `1px solid ${alpha('#fff', 0.1)}` : 'none',
          boxShadow: isDarkMode 
            ? '0 20px 60px rgba(0, 0, 0, 0.5)'
            : '0 20px 60px rgba(0, 0, 0, 0.15)',
        }
      }}
    >
      <DialogTitle
        sx={{
          pb: 1,
          pt: 3,
          px: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          direction: currentLanguage === 'ar' ? 'rtl' : 'ltr'
        }}
      >
        <Box
          sx={{
            backgroundColor: alpha('#4CAF50', 0.15),
            borderRadius: '50%',
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <CheckCircleIcon sx={{ color: '#4CAF50', fontSize: 32 }} />
        </Box>
        <Typography 
          variant="h5" 
          fontWeight={700}
          sx={{ 
            color: isDarkMode ? '#fff' : '#1a1a1a',
            fontSize: { xs: '1.25rem', sm: '1.5rem' }
          }}
        >
          {isFoundPost ? t('claimYourItem') : t('helpReturnItem')}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 2 }}>
        {/* Success State */}
        {isSuccess && (
          <Box
            sx={{
              animation: 'fadeIn 0.3s ease-in',
              '@keyframes fadeIn': {
                '0%': { opacity: 0, transform: 'translateY(-10px)' },
                '100%': { opacity: 1, transform: 'translateY(0)' },
              },
            }}
          >
            <Alert 
              severity="success"
              icon={<CheckCircleIcon />}
              sx={{
                mb: 2,
                borderRadius: 2,
                backgroundColor: isDarkMode ? alpha('#4CAF50', 0.15) : alpha('#4CAF50', 0.1),
                border: `1px solid ${alpha('#4CAF50', 0.3)}`,
                '& .MuiAlert-icon': {
                  color: '#4CAF50'
                },
                '& .MuiAlert-message': {
                  color: isDarkMode ? '#fff' : '#1a1a1a',
                  fontWeight: 600,
                  direction: currentLanguage === 'ar' ? 'rtl' : 'ltr'
                }
              }}
            >
              {t('itemMarkedAsReturned')}
            </Alert>
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Alert 
            severity="error"
            onClose={() => setError(null)}
            sx={{
              mb: 2,
              borderRadius: 2,
              direction: currentLanguage === 'ar' ? 'rtl' : 'ltr'
            }}
          >
            {error}
          </Alert>
        )}

        {/* Main Content - Only show if not success */}
        {!isSuccess && (
          <Box>
            {/* Celebration Message */}
            <Box sx={{ mb: 3 }}>
              <Typography 
                variant="h6" 
                fontWeight={700}
                sx={{ 
                  mb: 1.5,
                  color: '#4CAF50',
                  fontSize: { xs: '1.1rem', sm: '1.25rem' },
                  direction: currentLanguage === 'ar' ? 'rtl' : 'ltr'
                }}
              >
                {isFoundPost ? t('wonderfulNews') : t('amazingThankYou')}
              </Typography>
              <Typography 
                variant="body1"
                sx={{ 
                  lineHeight: 1.6,
                  color: isDarkMode ? alpha('#fff', 0.8) : alpha('#000', 0.7),
                  fontSize: { xs: '1rem', sm: '1rem' },
                  direction: currentLanguage === 'ar' ? 'rtl' : 'ltr'
                }}
              >
                {isFoundPost ? t('gladYouFoundYourItem') : t('thankYouForHelping')}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Contact Details Section */}
            <Box sx={{ mb: 2 }}>
              <Typography 
                variant="h6" 
                fontWeight={600}
                sx={{ 
                  mb: 2,
                  color: isDarkMode ? '#fff' : '#1a1a1a',
                  fontSize: { xs: '1.1rem', sm: '1.25rem' },
                  direction: currentLanguage === 'ar' ? 'rtl' : 'ltr'
                }}
              >
                {t('claimItemContactDetails')}
              </Typography>

              <Box display="flex" flexDirection="column" gap={2}>
                {/* Primary Phone */}
                {sanitizedContact.phone && (
                  <Box 
                    display="flex" 
                    alignItems="center" 
                    gap={2}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: isDarkMode ? alpha('#fff', 0.05) : alpha('#000', 0.03),
                      border: `1px solid ${isDarkMode ? alpha('#fff', 0.1) : alpha('#000', 0.1)}`,
                      direction: currentLanguage === 'ar' ? 'rtl' : 'ltr'
                    }}
                  >
                    <Box
                      sx={{
                        backgroundColor: alpha(theme.palette.primary.main, 0.15),
                        borderRadius: '50%',
                        p: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <PhoneIcon sx={{ color: theme.palette.primary.main }} />
                    </Box>
                    <Box>
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ 
                          display: 'block',
                          direction: currentLanguage === 'ar' ? 'rtl' : 'ltr'
                        }}
                      >
                        {t('phoneNumber')}
                      </Typography>
                      <Typography 
                        variant="body1" 
                        fontWeight={600}
                        sx={{ 
                          color: isDarkMode ? '#fff' : '#1a1a1a',
                          direction: 'ltr',
                          textAlign: currentLanguage === 'ar' ? 'right' : 'left'
                        }}
                      >
                        {sanitizedContact.phone}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Additional Phone */}
                {sanitizedContact.additionalPhone && sanitizedContact.additionalPhone !== sanitizedContact.phone && (
                  <Box 
                    display="flex" 
                    alignItems="center" 
                    gap={2}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: isDarkMode ? alpha('#fff', 0.05) : alpha('#000', 0.03),
                      border: `1px solid ${isDarkMode ? alpha('#fff', 0.1) : alpha('#000', 0.1)}`,
                      direction: currentLanguage === 'ar' ? 'rtl' : 'ltr'
                    }}
                  >
                    <Box
                      sx={{
                        backgroundColor: alpha(theme.palette.primary.main, 0.15),
                        borderRadius: '50%',
                        p: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <PhoneIcon sx={{ color: theme.palette.primary.main }} />
                    </Box>
                    <Box>
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ 
                          display: 'block',
                          direction: currentLanguage === 'ar' ? 'rtl' : 'ltr'
                        }}
                      >
                        {t('phoneNumber')} (2)
                      </Typography>
                      <Typography 
                        variant="body1" 
                        fontWeight={600}
                        sx={{ 
                          color: isDarkMode ? '#fff' : '#1a1a1a',
                          direction: 'ltr',
                          textAlign: currentLanguage === 'ar' ? 'right' : 'left'
                        }}
                      >
                        {sanitizedContact.additionalPhone}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Email */}
                {sanitizedContact.email && (
                  <Box 
                    display="flex" 
                    alignItems="center" 
                    gap={2}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: isDarkMode ? alpha('#fff', 0.05) : alpha('#000', 0.03),
                      border: `1px solid ${isDarkMode ? alpha('#fff', 0.1) : alpha('#000', 0.1)}`,
                      direction: currentLanguage === 'ar' ? 'rtl' : 'ltr'
                    }}
                  >
                    <Box
                      sx={{
                        backgroundColor: alpha('#1976d2', 0.15),
                        borderRadius: '50%',
                        p: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <EmailIcon sx={{ color: '#1976d2' }} />
                    </Box>
                    <Box sx={{ overflow: 'hidden' }}>
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ 
                          display: 'block',
                          direction: currentLanguage === 'ar' ? 'rtl' : 'ltr'
                        }}
                      >
                        {t('emailAddress')}
                      </Typography>
                      <Typography 
                        variant="body1" 
                        fontWeight={600}
                        sx={{ 
                          color: isDarkMode ? '#fff' : '#1a1a1a',
                          wordBreak: 'break-all'
                        }}
                      >
                        {sanitizedContact.email}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* WhatsApp */}
                {sanitizedContact.whatsapp && (
                  <Box 
                    display="flex" 
                    alignItems="center" 
                    gap={2}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: isDarkMode ? alpha('#fff', 0.05) : alpha('#000', 0.03),
                      border: `1px solid ${isDarkMode ? alpha('#fff', 0.1) : alpha('#000', 0.1)}`,
                      direction: currentLanguage === 'ar' ? 'rtl' : 'ltr'
                    }}
                  >
                    <Box
                      sx={{
                        backgroundColor: alpha('#25D366', 0.15),
                        borderRadius: '50%',
                        p: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <WhatsAppIcon sx={{ color: '#25D366' }} />
                    </Box>
                    <Box>
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ 
                          display: 'block',
                          direction: currentLanguage === 'ar' ? 'rtl' : 'ltr'
                        }}
                      >
                        {t('whatsappNumber')}
                      </Typography>
                      <Typography 
                        variant="body1" 
                        fontWeight={600}
                        sx={{ 
                          color: isDarkMode ? '#fff' : '#1a1a1a',
                          direction: 'ltr',
                          textAlign: currentLanguage === 'ar' ? 'right' : 'left'
                        }}
                      >
                        {sanitizedContact.whatsapp}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions 
        sx={{ 
          px: 3, 
          pb: 3, 
          pt: 1,
          display: 'flex',
          gap: 2,
          flexDirection: currentLanguage === 'ar' ? 'row-reverse' : 'row'
        }}
      >
        {!isSuccess && (
          <>
            <Button
              onClick={handleClose}
              disabled={isLoading}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                color: isDarkMode ? '#fff' : 'text.secondary',
                direction: currentLanguage === 'ar' ? 'rtl' : 'ltr'
              }}
            >
              {t('cancel')}
            </Button>
            <Button
              variant="contained"
              onClick={handleMarkAsReturned}
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                backgroundColor: '#4CAF50',
                color: '#fff',
                direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
                gap: currentLanguage === 'ar' ? 1 : 0.5,
                '&:hover': {
                  backgroundColor: '#388E3C'
                },
                '&:disabled': {
                  backgroundColor: alpha('#4CAF50', 0.5),
                  color: alpha('#fff', 0.7)
                }
              }}
            >
              {isLoading ? t('requesting') : t('markAsReturned')}
            </Button>
          </>
        )}
        {isSuccess && (
          <Button
            onClick={handleClose}
            variant="contained"
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              backgroundColor: '#4CAF50',
              color: '#fff',
              direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
              '&:hover': {
                backgroundColor: '#388E3C'
              }
            }}
          >
            {t('close')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ClaimItemDialog;

