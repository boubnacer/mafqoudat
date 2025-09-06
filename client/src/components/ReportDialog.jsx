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

  // Debug: Log the post data to see what's available
  React.useEffect(() => {
    if (open && post) {
      console.log('ReportDialog - Post data:', post);
      console.log('ReportDialog - Post ID:', post._id);
      console.log('ReportDialog - Post user:', post.user);
      console.log('ReportDialog - Post foundLost:', post.foundLost);
      console.log('ReportDialog - Post username:', post.username);
      console.log('ReportDialog - Post categoryname:', post.categoryname);
      console.log('ReportDialog - Post exactLocation:', post.exactLocation);
      
      // Validate required fields
      if (!post._id) {
        console.error('ReportDialog - Missing post ID!');
      }
      if (!post.user && post.user !== 'anonymous') {
        console.warn('ReportDialog - Post user is undefined, using fallback');
      }
    }
  }, [open, post]);

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

    // Additional validation for required fields
    if (!post.categoryname && !post.exactLocation) {
      console.warn('ReportDialog - Post missing basic information:', post);
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
      
      // Debug: Log what we're sending
      const reportData = {
        postId: post._id,
        reason: finalReason,
        reasonType: selectedReason,
        userId: post.user || 'anonymous', // Send the post owner's ID for reference, or anonymous if not available
        // Add additional context for better reporting
        postCategory: post.categoryname || 'unknown',
        postLocation: post.exactLocation || 'unknown',
        postCreatedAt: post.createdAt || new Date().toISOString()
      };
      
      console.log('ReportDialog - Submitting report with data:', reportData);
      console.log('ReportDialog - onSubmit function:', typeof onSubmit);
      
      // Validate onSubmit function
      if (typeof onSubmit !== 'function') {
        throw new Error('onSubmit function is not defined or not a function');
      }
      
      console.log('ReportDialog - About to call onSubmit...');
      const result = await onSubmit(reportData);
      
      console.log('ReportDialog - Result received:', result);
      console.log('ReportDialog - Result type:', typeof result);
      console.log('ReportDialog - Result is null/undefined:', result == null);
      console.log('ReportDialog - Result success property:', result?.success);
      console.log('ReportDialog - Result data property:', result?.data);
      console.log('ReportDialog - Result message property:', result?.message);

      // Check if the API call was successful - handle both direct result and wrapped result
      console.log('ReportDialog - Checking result:', result);
      console.log('ReportDialog - Result type:', typeof result);
      console.log('ReportDialog - Result keys:', result ? Object.keys(result) : 'No result');
      
      // The server returns { success: true, message: "...", data: {...} }
      // RTK Query unwraps this, so result should be the unwrapped response
      // Check multiple possible success indicators
      const isSuccess = (result && result.success === true) || 
                       (result && result.data && result.data.success === true) ||
                       (result && result.message && result.message.includes('successfully')) ||
                       (result && result.status === 200);
      
      if (isSuccess) {
        console.log('ReportDialog - Report submitted successfully');
        console.log('ReportDialog - Email notification sent:', result?.notificationSent);
        
        // Show success message even if email failed (since the report was still submitted)
        setSuccess(true);
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        console.error('ReportDialog - Report submission failed:', result);
        
        // If we get here, the response format is unexpected
        // Check if we have any indication that the request went through
        if (result && (result.postId || result.data?.postId)) {
          console.log('ReportDialog - Post ID found in response, treating as success');
          setSuccess(true);
          setTimeout(() => {
            handleClose();
          }, 2000);
        } else {
          throw new Error(result?.data?.message || result?.message || 'Failed to submit report');
        }
      }
    } catch (error) {
      console.error('Report submission error:', error);
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
