import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
  useTheme
} from '@mui/material';
import { Report, Send, Close } from '@mui/icons-material';
import { useTranslation } from '../utils/translations';
import useAuth from '../hooks/useAuth';

const ReportDialog = ({ open, onClose, post, onSubmit }) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { t, currentLanguage } = useTranslation();
  const theme = useTheme();
  const { usernameId } = useAuth();


  const reportReasons = [
    {
      value: 'inappropriate_content',
      label: {
        en: 'Inappropriate or offensive content',
        fr: 'Contenu inapproprié ou offensant',
        ar: 'محتوى غير مناسب أو مسيء'
      }
    },
    {
      value: 'spam_fake',
      label: {
        en: 'Spam or fake post',
        fr: 'Spam ou publication fausse',
        ar: 'منشور مزعج أو مزيف'
      }
    },
    {
      value: 'duplicate',
      label: {
        en: 'Duplicate post',
        fr: 'Publication en double',
        ar: 'منشور مكرر'
      }
    },
    {
      value: 'wrong_category',
      label: {
        en: 'Wrong category',
        fr: 'Mauvaise catégorie',
        ar: 'فئة خاطئة'
      }
    },
    {
      value: 'suspicious_activity',
      label: {
        en: 'Suspicious activity or scam',
        fr: 'Activité suspecte ou arnaque',
        ar: 'نشاط مشبوه أو احتيال'
      }
    },
    {
      value: 'personal_info',
      label: {
        en: 'Contains personal information',
        fr: 'Contient des informations personnelles',
        ar: 'يحتوي على معلومات شخصية'
      }
    },
    {
      value: 'other',
      label: {
        en: 'Other reason',
        fr: 'Autre raison',
        ar: 'سبب آخر'
      }
    }
  ];

  const getLabel = (labels) => {
    return labels[currentLanguage] || labels.en;
  };

  const handleSubmit = async () => {

    if (!selectedReason) {
      setError(t('pleaseSelectReason'));
      return;
    }

    if (selectedReason === 'other' && !customReason.trim()) {
      setError(t('pleaseProvideReason'));
      return;
    }

    if (!post || !post._id) {
      setError('Invalid post data - missing post ID');
      return;
    }


    setIsSubmitting(true);
    setError('');

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setIsSubmitting(false);
      setError('Request timeout - please try again');
    }, 30000); // 30 seconds timeout

    try {
      const finalReason = selectedReason === 'other' ? customReason : getLabel(reportReasons.find(r => r.value === selectedReason).label);
      
      const reportData = {
        postId: post._id,
        reason: finalReason,
        reasonType: selectedReason,
        userId: post.user || 'anonymous',
        postCategory: post.categoryname || 'unknown',
        postLocation: post.exactLocation || 'unknown',
        postCreatedAt: post.createdAt || new Date().toISOString()
      };
      
      // Validate onSubmit function
      if (typeof onSubmit !== 'function') {
        throw new Error('onSubmit function is not defined or not a function');
      }
      
      const result = await onSubmit(reportData);

      // Check if the API call was successful
      if (result && result.success === true) {
        setSuccess(true);
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        throw new Error(result?.data?.message || result?.message || 'Failed to submit report');
      }
    } catch (error) {
      setError(error.message || t('errorSubmittingReport'));
    } finally {
      clearTimeout(timeoutId);
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReason('');
    setCustomReason('');
    setError('');
    setSuccess(false);
    onClose();
  };

  const handleReasonChange = (event) => {
    setSelectedReason(event.target.value);
    setError('');
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
          direction: currentLanguage === 'ar' ? 'rtl' : 'ltr',
          backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff',
          color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 8px 32px rgba(0, 0, 0, 0.8)' 
            : '0 8px 32px rgba(0, 0, 0, 0.3)',
          border: theme.palette.mode === 'dark' 
            ? '1px solid rgba(255, 255, 255, 0.2)' 
            : '1px solid rgba(0, 0, 0, 0.1)'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        color: theme.palette.error.main,
        borderBottom: `1px solid ${theme.palette.divider}`
      }}>
        <Report />
        {t('reportPost')}
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {success ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            {t('reportSubmittedSuccessfully')}
          </Alert>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {t('reportPostDescription')}
            </Typography>

            <FormControl component="fieldset" fullWidth>
              <FormLabel component="legend" sx={{ mb: 2, fontWeight: 'bold' }}>
                {t('selectReportReason')}
              </FormLabel>
              <RadioGroup
                value={selectedReason}
                onChange={handleReasonChange}
              >
                {reportReasons.map((reason) => (
                  <FormControlLabel
                    key={reason.value}
                    value={reason.value}
                    control={<Radio />}
                    label={getLabel(reason.label)}
                    sx={{ mb: 1 }}
                  />
                ))}
              </RadioGroup>
            </FormControl>

            {selectedReason === 'other' && (
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  variant="outlined"
                  label={t('describeReason')}
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder={t('describeReasonPlaceholder')}
                />
              </Box>
            )}

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button 
          onClick={handleClose} 
          startIcon={<Close />}
          disabled={isSubmitting}
        >
          {t('cancel')}
        </Button>
        {!success && (
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="error"
            startIcon={isSubmitting ? <CircularProgress size={20} /> : <Send />}
            disabled={isSubmitting}
          >
            {isSubmitting ? t('submitting') : t('submitReport')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ReportDialog;
