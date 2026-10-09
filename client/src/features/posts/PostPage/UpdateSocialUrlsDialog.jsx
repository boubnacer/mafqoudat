import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  useTheme,
  alpha,
  InputAdornment,
  Collapse,
} from '@mui/material';
import {
  Facebook as FacebookIcon,
  Instagram as InstagramIcon,
  Close as CloseIcon,
  Link as LinkIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  SaveOutlined as SaveIcon,
  CheckCircle as CheckCircleIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useTranslation } from '../../../utils/translations';
import { useUpdatePostSocialUrlsMutation } from '../../admin/adminApiSlice';

/**
 * Modal dialog for administrators to view and update the Reach on social media
 * Facebook and Instagram URLs (permalinks) and optional IDs for a post.
 */
const UpdateSocialUrlsDialog = ({
  open,
  onClose,
  postId,
  currentFacebookUrl = '',
  currentInstagramUrl = '',
  currentFacebookPostId = '',
  currentInstagramMediaId = '',
  onSuccess,
}) => {
  const { t, currentLanguage } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isRtl = currentLanguage === 'ar';

  const [facebookUrl, setFacebookUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [facebookPostId, setFacebookPostId] = useState('');
  const [instagramMediaId, setInstagramMediaId] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [updateSocialUrls, { isLoading }] = useUpdatePostSocialUrlsMutation();

  useEffect(() => {
    if (open) {
      setFacebookUrl(currentFacebookUrl || '');
      setInstagramUrl(currentInstagramUrl || '');
      setFacebookPostId(currentFacebookPostId || '');
      setInstagramMediaId(currentInstagramMediaId || '');
      setErrorMsg('');
      setSuccessMsg('');
      setShowAdvanced(Boolean(currentFacebookPostId || currentInstagramMediaId));
    }
  }, [open, currentFacebookUrl, currentInstagramUrl, currentFacebookPostId, currentInstagramMediaId]);

  const isValidUrl = (url) => {
    if (!url || !url.trim()) return true;
    const trimmed = url.trim();
    return /^https?:\/\/.+/i.test(trimmed);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanFb = facebookUrl.trim();
    const cleanIg = instagramUrl.trim();

    if (cleanFb && !isValidUrl(cleanFb)) {
      setErrorMsg(t('invalidSocialUrl') || 'Please enter a valid Facebook URL starting with http:// or https://');
      return;
    }
    if (cleanIg && !isValidUrl(cleanIg)) {
      setErrorMsg(t('invalidSocialUrl') || 'Please enter a valid Instagram URL starting with http:// or https://');
      return;
    }

    try {
      const res = await updateSocialUrls({
        postId,
        facebookUrl: cleanFb,
        instagramUrl: cleanIg,
        facebookPostId: facebookPostId.trim() || undefined,
        instagramMediaId: instagramMediaId.trim() || undefined,
      }).unwrap();

      setSuccessMsg(res?.message || t('socialUrlsUpdatedSuccess') || 'Social media URLs updated successfully');
      if (onSuccess) {
        onSuccess(res?.data);
      }
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      console.error('Failed to update social URLs:', err);
      setErrorMsg(
        err?.data?.message ||
        err?.message ||
        t('socialUrlsUpdateFailed') ||
        'Failed to update social media URLs. Please try again.'
      );
    }
  };

  return (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: `${theme.custom.radius.lg}px`,
          backgroundColor: theme.custom.color.surfaceRaised,
          backgroundImage: 'none',
          boxShadow: theme.custom.elevation.e3,
          p: { xs: 1, sm: 2 },
          direction: isRtl ? 'rtl' : 'ltr',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
          px: { xs: 1.5, sm: 2 },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: `${theme.custom.radius.sm}px`,
              backgroundImage: `linear-gradient(135deg, ${theme.custom.color.brandPrimary}, #EC4899)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: `0 0 16px ${alpha(theme.custom.color.brandPrimary, 0.4)}`,
            }}
          >
            <LinkIcon sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: theme.custom.color.ink }}>
              {t('updateSocialUrls')}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              {t('updateSocialUrlsDesc')}
            </Typography>
          </Box>
        </Box>
        <IconButton
          onClick={onClose}
          disabled={isLoading}
          size="small"
          aria-label={t('close') || 'Close'}
          sx={{
            color: 'text.secondary',
            '&:hover': { backgroundColor: alpha(theme.custom.color.ink, 0.08) },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: { xs: 1.5, sm: 2 }, py: 1.5 }}>
        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: `${theme.custom.radius.sm}px` }}>
            {errorMsg}
          </Alert>
        )}

        {successMsg && (
          <Alert
            severity="success"
            icon={<CheckCircleIcon fontSize="inherit" />}
            sx={{ mb: 2, borderRadius: `${theme.custom.radius.sm}px` }}
          >
            {successMsg}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSave} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 0.5 }}>
          {/* Facebook Field */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
              <FacebookIcon sx={{ color: '#1877F2', fontSize: 18 }} />
              <Typography variant="body2" sx={{ fontWeight: 700, color: theme.custom.color.ink }}>
                {t('facebookPostUrl')}
              </Typography>
            </Box>
            <TextField
              fullWidth
              size="small"
              value={facebookUrl}
              onChange={(e) => setFacebookUrl(e.target.value)}
              placeholder={t('facebookPostUrlPlaceholder')}
              disabled={isLoading}
              dir="ltr"
              InputProps={{
                endAdornment: facebookUrl ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setFacebookUrl('')}
                      edge="end"
                      disabled={isLoading}
                      aria-label="Clear Facebook URL"
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: `${theme.custom.radius.sm}px`,
                  backgroundColor: alpha('#1877F2', isDark ? 0.08 : 0.04),
                  '&:hover fieldset': { borderColor: '#1877F2' },
                  '&.Mui-focused fieldset': { borderColor: '#1877F2' },
                },
              }}
            />
          </Box>

          {/* Instagram Field */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
              <InstagramIcon sx={{ color: '#E1306C', fontSize: 18 }} />
              <Typography variant="body2" sx={{ fontWeight: 700, color: theme.custom.color.ink }}>
                {t('instagramPostUrl')}
              </Typography>
            </Box>
            <TextField
              fullWidth
              size="small"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder={t('instagramPostUrlPlaceholder')}
              disabled={isLoading}
              dir="ltr"
              InputProps={{
                endAdornment: instagramUrl ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setInstagramUrl('')}
                      edge="end"
                      disabled={isLoading}
                      aria-label="Clear Instagram URL"
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: `${theme.custom.radius.sm}px`,
                  backgroundColor: alpha('#E1306C', isDark ? 0.08 : 0.04),
                  '&:hover fieldset': { borderColor: '#E1306C' },
                  '&.Mui-focused fieldset': { borderColor: '#E1306C' },
                },
              }}
            />
          </Box>

          {/* Advanced IDs Toggle */}
          <Box>
            <Button
              size="small"
              variant="text"
              onClick={() => setShowAdvanced(!showAdvanced)}
              endIcon={showAdvanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{
                textTransform: 'none',
                color: 'text.secondary',
                fontSize: '0.75rem',
                p: 0,
                minWidth: 'auto',
                '&:hover': { backgroundColor: 'transparent', color: theme.custom.color.brandPrimary },
              }}
            >
              {showAdvanced ? 'Hide Advanced Post IDs' : 'Show Advanced Post IDs (Optional)'}
            </Button>
            <Collapse in={showAdvanced}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                  mt: 1.5,
                  p: 1.5,
                  borderRadius: `${theme.custom.radius.sm}px`,
                  backgroundColor: alpha(theme.custom.color.ink, isDark ? 0.06 : 0.03),
                  border: `1px dashed ${theme.palette.divider}`,
                }}
              >
                <TextField
                  label="Facebook Post ID (Auto-detected if left empty)"
                  fullWidth
                  size="small"
                  value={facebookPostId}
                  onChange={(e) => setFacebookPostId(e.target.value)}
                  placeholder="e.g. 123456789_987654321"
                  disabled={isLoading}
                  dir="ltr"
                />
                <TextField
                  label="Instagram Media ID (Optional)"
                  fullWidth
                  size="small"
                  value={instagramMediaId}
                  onChange={(e) => setInstagramMediaId(e.target.value)}
                  placeholder="e.g. 17987654321098765"
                  disabled={isLoading}
                  dir="ltr"
                />
              </Box>
            </Collapse>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: { xs: 1.5, sm: 2 }, pt: 1, pb: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          disabled={isLoading}
          sx={{
            borderRadius: `${theme.custom.radius.sm}px`,
            textTransform: 'none',
            color: 'text.secondary',
            fontWeight: 600,
          }}
        >
          {t('cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon fontSize="small" />}
          sx={{
            borderRadius: `${theme.custom.radius.sm}px`,
            textTransform: 'none',
            fontWeight: 600,
            px: 2.5,
            backgroundColor: theme.custom.color.brandPrimary,
            color: '#FFFFFF',
            '&:hover': {
              backgroundColor: theme.custom.color.brandPrimary,
              filter: 'brightness(0.92)',
            },
          }}
        >
          {isLoading ? (t('saving') || 'Saving...') : (t('save') || 'Save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UpdateSocialUrlsDialog;
