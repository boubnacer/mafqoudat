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
  useTheme
} from '@mui/material';
import { 
  Share as ShareIcon, 
  Email as EmailIcon,
  CheckCircle as CheckCircleIcon 
} from '@mui/icons-material';
import { useTranslation } from '../utils/translations';
import { useRequestPromotionMutation } from '../features/posts/postsApiSlice';

const PromotionDialog = ({ open, onClose, postId, onPromotionRequested }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  const [requestPromotion, { isLoading, isError, error: promotionError }] = useRequestPromotionMutation();

  // Debug: Log the postId to see what's being passed
  React.useEffect(() => {
    if (open && postId) {
      console.log('PromotionDialog - Post ID:', postId);
    }
  }, [open, postId]);

  const handlePromotionRequest = async () => {
    setError(null);

    if (!postId) {
      setError('Invalid post ID');
      return;
    }

    try {
      // Debug: Log what we're sending
      console.log('PromotionDialog - Requesting promotion for postId:', postId);
      
      const result = await requestPromotion({ postId }).unwrap();
      
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
    if (!isLoading) {
      onClose();
      setIsSuccess(false);
      setError(null);
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
          borderRadius: 3,
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(135deg, rgba(30,30,30,0.95) 0%, rgba(45,45,45,0.95) 100%)'
            : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,249,250,0.95) 100%)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
        }
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
          <ShareIcon sx={{ color: theme.palette.primary.main, fontSize: 28 }} />
          <Typography variant="h5" fontWeight={600}>
            {t('boostYourChances')}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pb: 2 }}>
        {isSuccess ? (
          <Box textAlign="center" py={2}>
            <CheckCircleIcon sx={{ fontSize: 64, color: theme.palette.success.main, mb: 2 }} />
            <Typography variant="h6" color="success.main" gutterBottom>
              {t('promotionRequested')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('weWillContactYou')}
            </Typography>
          </Box>
        ) : (
          <>
            <Typography variant="body1" paragraph sx={{ mb: 3 }}>
              {t('postPublishedSuccessfully')}
            </Typography>
            
            <Box 
              sx={{ 
                p: 3, 
                borderRadius: 2, 
                background: theme.palette.mode === 'dark' 
                  ? 'rgba(25, 118, 210, 0.1)' 
                  : 'rgba(25, 118, 210, 0.05)',
                border: `1px solid ${theme.palette.primary.main}20`,
                mb: 3
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main }}>
                {t('doubleYourChances')}
              </Typography>
              <Typography variant="body2" paragraph>
                {t('promotionDescription')}
              </Typography>
                             <Box display="flex" alignItems="center" gap={1} mt={2}>
                 <EmailIcon sx={{ color: theme.palette.success.main }} />
                 <Typography variant="body2" color="text.secondary">
                   {t('emailNotification')}
                 </Typography>
               </Box>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        {!isSuccess && (
          <Button 
            onClick={handleClose} 
            disabled={isLoading}
            variant="outlined"
            sx={{ minWidth: 100 }}
          >
            {t('noThanks')}
          </Button>
        )}
        {!isSuccess && (
          <Button
            onClick={handlePromotionRequest}
            disabled={isLoading}
            variant="contained"
            startIcon={isLoading ? <CircularProgress size={20} /> : <EmailIcon />}
            sx={{ 
              minWidth: 140,
              background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
              '&:hover': {
                background: "linear-gradient(45deg, #1976D2 30%, #1E88E5 90%)",
              }
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
