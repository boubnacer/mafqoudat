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
  TextField
} from '@mui/material';
import { 
  Share as ShareIcon, 
  WhatsApp as WhatsAppIcon,
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingUpIcon,
  Phone as PhoneIcon
} from '@mui/icons-material';
import { useTranslation } from '../utils/translations';
import { useRequestPromotionMutation } from '../features/posts/postsApiSlice';

const PromotionDialog = ({ open, onClose, postId, onPromotionRequested, isLostItem = true }) => {
  const { t, currentLanguage } = useTranslation();
  const theme = useTheme();
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  
  const [requestPromotion, { isLoading, isError, error: promotionError }] = useRequestPromotionMutation();

  // Debug: Log the postId to see what's being passed
  React.useEffect(() => {
    if (open && postId) {
      console.log('PromotionDialog - Post ID:', postId);
    }
  }, [open, postId]);


  const handlePromotionRequest = async () => {
    setError(null);
    setPhoneError('');

    if (!postId) {
      setError('Invalid post ID');
      return;
    }

    // Phone number is required for both lost and found items
    if (!phoneNumber.trim()) {
      const errorMessage = isLostItem ? t('phoneNumberRequiredLost') : t('phoneNumberRequiredFound');
      setPhoneError(errorMessage);
      // Scroll to phone field and highlight it
      setTimeout(() => {
        const phoneField = document.querySelector('[data-testid="phone-field"]');
        if (phoneField) {
          phoneField.scrollIntoView({ behavior: 'smooth', block: 'center' });
          phoneField.focus();
          // Add highlight effect
          phoneField.style.borderColor = '#f44336';
          phoneField.style.boxShadow = '0 0 0 2px rgba(244, 67, 54, 0.2)';
          setTimeout(() => {
            phoneField.style.borderColor = '';
            phoneField.style.boxShadow = '';
          }, 3000);
        }
      }, 100);
      return;
    }

    // Basic phone number validation - only numbers allowed
    if (phoneNumber.trim() && !/^[0-9]+$/.test(phoneNumber.trim())) {
      setPhoneError(t('invalidPhoneNumber'));
      return;
    }

    try {
      // Debug: Log what we're sending
      console.log('PromotionDialog - Requesting promotion for postId:', postId);
      
      const promotionData = { 
        postId,
        phoneNumber: phoneNumber.trim()
      };
      
      const result = await requestPromotion(promotionData).unwrap();
      
      // Debug: Log the result
      console.log('PromotionDialog - Result:', result);
      
      // Check if the API call was successful
      if (result && result.success) {
        setIsSuccess(true);
        if (onPromotionRequested) {
          onPromotionRequested();
        }
        // Auto close after 3 seconds
        setTimeout(() => {
          onClose();
          setIsSuccess(false);
          setPhoneNumber('');
        }, 3000);
      } else {
        throw new Error(result?.message || t('promotionRequestError'));
      }
    } catch (err) {
      console.error('Promotion request error:', err);
      setError(err.data?.message || err.message || t('promotionRequestError'));
    }
  };

  // Handle Redux error state
  React.useEffect(() => {
    if (isError && promotionError) {
      setError(promotionError.data?.message || t('promotionRequestError'));
    }
  }, [isError, promotionError, t]);

  const handleClose = () => {
    // Only allow closing if not loading and user explicitly clicks close
    if (!isLoading) {
      onClose();
      setIsSuccess(false);
      setError(null);
      setPhoneNumber('');
      setPhoneError('');
    }
  };

  const handleNoThanks = () => {
    if (!isLoading) {
      onClose();
      setIsSuccess(false);
      setError(null);
      setPhoneNumber('');
      setPhoneError('');
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={isLoading ? undefined : undefined}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={isLoading}
      PaperProps={{
        sx: {
          borderRadius: 4,
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(135deg, rgba(20,20,20,0.98) 0%, rgba(35,35,35,0.98) 100%)'
            : 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)',
          backdropFilter: 'blur(20px)',
          border: `2px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)'}`,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 20px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)'
            : '0 20px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
        }
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 2, pt: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="center" gap={1.5}>
          <TrendingUpIcon sx={{ 
            color: theme.palette.mode === 'dark' ? '#4CAF50' : '#2E7D32', 
            fontSize: 32,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
          }} />
          <Typography 
            variant="h4" 
            fontWeight={700}
            sx={{ 
              background: theme.palette.mode === 'dark' 
                ? 'linear-gradient(45deg, #4CAF50, #66BB6A)' 
                : 'linear-gradient(45deg, #2E7D32, #388E3C)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: { xs: '1.5rem', md: '1.75rem' }
            }}
          >
            {isLostItem ? t('boostYourChances') : t('promoteYourFoundItem')}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pb: 3, px: 4 }}>
        {isSuccess ? (
          <Box textAlign="center" py={3}>
            <CheckCircleIcon sx={{ 
              fontSize: 72, 
              color: theme.palette.mode === 'dark' ? '#4CAF50' : '#2E7D32', 
              mb: 3,
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
            }} />
            <Typography 
              variant="h5" 
              sx={{ 
                color: theme.palette.mode === 'dark' ? '#4CAF50' : '#2E7D32',
                fontWeight: 600,
                mb: 2
              }}
            >
              {t('promotionRequested')}
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: theme.palette.text.secondary,
                fontSize: '1.1rem'
              }}
            >
              {t('weWillContactYou')}
            </Typography>
          </Box>
        ) : (
          <>
            <Typography 
              variant="body1" 
              paragraph 
              sx={{ 
                mb: 4,
                fontSize: { xs: '1.2rem', md: '1.1rem' },
                color: theme.palette.text.primary,
                textAlign: 'center'
              }}
            >
              {isLostItem ? t('postPublishedSuccessfully') : t('foundItemPostedSuccessfully')}
            </Typography>
            
            <Box 
              sx={{ 
                p: 4, 
                borderRadius: 3, 
                background: theme.palette.mode === 'dark' 
                  ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.08) 0%, rgba(102, 187, 106, 0.05) 100%)'
                  : 'linear-gradient(135deg, rgba(46, 125, 50, 0.08) 0%, rgba(56, 142, 60, 0.05) 100%)',
                border: `2px solid ${theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(46, 125, 50, 0.2)'}`,
                mb: 4,
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: theme.palette.mode === 'dark' 
                    ? 'linear-gradient(90deg, #4CAF50, #66BB6A)' 
                    : 'linear-gradient(90deg, #2E7D32, #388E3C)',
                }
              }}
            >
              <Typography 
                variant="h5" 
                gutterBottom 
                sx={{ 
                  color: theme.palette.mode === 'dark' ? '#4CAF50' : '#2E7D32',
                  fontWeight: 600,
                  mb: 2,
                  textAlign: 'center',
                  fontSize: { xs: '1.3rem', md: '1.5rem' }
                }}
              >
                {isLostItem ? t('ourTeamCanHelp') : t('ourTeamCanPromote')}
              </Typography>
              <Typography 
                variant="body1" 
                paragraph 
                sx={{ 
                  fontSize: { xs: '1.15rem', md: '1.05rem' },
                  color: theme.palette.text.primary,
                  textAlign: 'center',
                  mb: 2
                }}
              >
                {isLostItem ? t('teamHasTechniques') : t('teamHasPromotionTechniques')}
              </Typography>
              <Box display="flex" alignItems="center" justifyContent="center" gap={1.5} mt={3}>
                <WhatsAppIcon sx={{ 
                  color: theme.palette.mode === 'dark' ? '#4CAF50' : '#2E7D32',
                  fontSize: 20
                }} />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: theme.palette.text.secondary,
                    fontSize: { xs: '1.1rem', md: '1rem' },
                    fontWeight: 500
                  }}
                >
                  {isLostItem ? t('teamWillContactYou') : t('teamWillContactYouForPromotion')}
                </Typography>
              </Box>
            </Box>

            {/* Phone Number Field for Both Lost and Found Items */}
            <Box sx={{ mb: 3 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  mb: 1,
                  fontSize: { xs: '1.1rem', md: '1rem' },
                  color: theme.palette.text.primary,
                  fontWeight: 600
                }}
              >
                {t('phoneNumberForContact')} *
              </Typography>
                <TextField
                  fullWidth
                  placeholder={t('enterPhoneNumber')}
                  value={phoneNumber}
                  data-testid="phone-field"
                  onChange={(e) => {
                    // Only allow numbers
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setPhoneNumber(value);
                    if (phoneError) setPhoneError('');
                  }}
                  error={!!phoneError}
                  helperText={phoneError || (isLostItem ? t('phoneNumberDescriptionLost') : t('phoneNumberDescriptionFound'))}
                  InputProps={{
                    startAdornment: <PhoneIcon sx={{ mr: 1, color: theme.palette.text.secondary }} />
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': {
                        borderColor: theme.palette.mode === 'dark' ? '#4CAF50' : '#2E7D32',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: theme.palette.mode === 'dark' ? '#4CAF50' : '#2E7D32',
                      },
                      '& fieldset': {
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
                      },
                      color: theme.palette.text.primary,
                      fontWeight: 500
                    }
                  }}
                />
            </Box>

            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 2,
                  borderRadius: 2,
                  fontSize: '1rem'
                }}
              >
                {error}
              </Alert>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 4, pb: 4, gap: 2, justifyContent: 'center' }}>
        {!isSuccess && (
          <Button 
            onClick={handleNoThanks} 
            disabled={isLoading}
            variant="outlined"
            sx={{ 
              minWidth: 120,
              py: 1.5,
              px: 3,
              borderRadius: 3,
              fontSize: { xs: '1.1rem', md: '1rem' },
              fontWeight: 600,
              borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
              color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)',
              '&:hover': {
                borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            {t('noThanks')}
          </Button>
        )}
        {!isSuccess && (
          <Button
            onClick={handlePromotionRequest}
            disabled={isLoading}
            variant="contained"
            startIcon={isLoading ? <CircularProgress size={20} /> : <WhatsAppIcon sx={{ 
              ml: currentLanguage === 'ar' ? 1 : 0.5,
              mr: currentLanguage === 'ar' ? 0.5 : 0
            }} />}
            sx={{ 
              minWidth: 160,
              py: 1.5,
              px: 3,
              borderRadius: 3,
              fontSize: { xs: '1.1rem', md: '1rem' },
              fontWeight: 600,
              color: '#ffffff',
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(45deg, #4CAF50 30%, #66BB6A 90%)'
                : 'linear-gradient(45deg, #2E7D32 30%, #388E3C 90%)',
              '&:hover': {
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(45deg, #388E3C 30%, #4CAF50 90%)'
                  : 'linear-gradient(45deg, #1B5E20 30%, #2E7D32 90%)',
                transform: 'translateY(-1px)',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 8px 20px rgba(76, 175, 80, 0.3)'
                  : '0 8px 20px rgba(46, 125, 50, 0.3)',
              },
              '&:disabled': {
                background: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.3)' : 'rgba(46, 125, 50, 0.3)',
                color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.7)',
              },
              transition: 'all 0.2s ease-in-out',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 4px 12px rgba(76, 175, 80, 0.2)'
                : '0 4px 12px rgba(46, 125, 50, 0.2)',
            }}
          >
            {isLoading ? t('requesting') : t('yesPromote')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PromotionDialog;
