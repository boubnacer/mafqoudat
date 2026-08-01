import React from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  Stack,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  CheckCircleRounded as CheckCircleRoundedIcon,
  AutoAwesome as AutoAwesomeIcon,
  Apple as AppleIcon,
  Android as AndroidIcon,
} from '@mui/icons-material';
import { useTranslation } from '../utils/translations';

// Store links are env-configured so they can be filled in once the apps are
// published, without touching this component.
const IOS_APP_URL = process.env.REACT_APP_IOS_APP_URL || '#';
const ANDROID_APP_URL = process.env.REACT_APP_ANDROID_APP_URL || '#';

const PostSuccessDialog = ({ open, onClose, isLostItem = true }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const successColor = theme.custom.status.found.main;
  const glowAlpha = theme.palette.mode === 'dark' ? 0.18 : 0.12;
  const ringAlpha = theme.palette.mode === 'dark' ? 0.08 : 0.06;
  const ringAlphaSoft = theme.palette.mode === 'dark' ? 0.04 : 0.03;

  const storeButtonSx = {
    borderRadius: `${theme.custom.radius.md}px`,
    textTransform: 'none',
    fontWeight: 600,
    py: 1.1,
    flex: 1,
    borderColor: alpha(theme.custom.color.ink, 0.18),
    color: theme.custom.color.ink,
    '&:hover': {
      borderColor: theme.custom.color.brandPrimary,
      backgroundColor: alpha(theme.custom.color.brandPrimary, 0.06),
    },
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: `${theme.custom.radius.xl}px`,
          backgroundColor: theme.custom.color.surfaceRaised,
          boxShadow: theme.custom.elevation.e3,
        },
      }}
    >
      <DialogContent sx={{ textAlign: 'center', pt: 5, pb: 4, px: 4 }}>
        <Box
          sx={{
            position: 'relative',
            width: 88,
            height: 88,
            mx: 'auto',
            mb: 3,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: alpha(successColor, glowAlpha),
            boxShadow: `0 0 0 10px ${alpha(successColor, ringAlpha)}`,
            animation: 'postSuccessPulse 2.4s ease-in-out infinite',
            '@keyframes postSuccessPulse': {
              '0%, 100%': { boxShadow: `0 0 0 10px ${alpha(successColor, ringAlpha)}` },
              '50%': { boxShadow: `0 0 0 16px ${alpha(successColor, ringAlphaSoft)}` },
            },
          }}
        >
          <CheckCircleRoundedIcon sx={{ fontSize: 56, color: successColor }} />
          <AutoAwesomeIcon
            sx={{
              position: 'absolute',
              top: -4,
              insetInlineEnd: -6,
              fontSize: 22,
              color: theme.custom.color.brandPrimary,
            }}
          />
          <AutoAwesomeIcon
            sx={{
              position: 'absolute',
              bottom: 2,
              insetInlineStart: -10,
              fontSize: 14,
              color: theme.custom.color.brandPrimary,
              opacity: 0.7,
            }}
          />
        </Box>

        <Typography variant="h5" sx={{ fontWeight: 700, color: theme.custom.color.ink, mb: 1 }}>
          {t(isLostItem ? 'postPublishedSuccessfully' : 'foundItemPostedSuccessfully')}
        </Typography>

        <Typography variant="body1" sx={{ color: theme.palette.text.secondary, mb: 4 }}>
          {t(isLostItem ? 'downloadAppNotifyLost' : 'downloadAppNotifyFound')}
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 3 }}>
          <Button
            component="a"
            href={IOS_APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            variant="outlined"
            startIcon={<AppleIcon />}
            sx={storeButtonSx}
          >
            {t('downloadOnAppStore')}
          </Button>
          <Button
            component="a"
            href={ANDROID_APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            variant="outlined"
            startIcon={<AndroidIcon />}
            sx={storeButtonSx}
          >
            {t('getItOnGooglePlay')}
          </Button>
        </Stack>

        <Button
          onClick={onClose}
          variant="text"
          sx={{ textTransform: 'none', fontWeight: 600, color: theme.custom.color.brandPrimary }}
        >
          {t('continueToDashboard')}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default PostSuccessDialog;
