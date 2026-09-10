import React, { useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  alpha,
} from '@mui/material';
import { WarningAmberOutlined } from '@mui/icons-material';
import { useTranslation } from '../../../utils/translations';
import { adminTone } from './adminTones';
import { containedButtonSx, quietButtonSx } from './adminSx';

/**
 * Replaces `window.confirm` on every destructive action in the panel.
 *
 * The old flow put a browser confirm in front of "delete this user and every
 * post, image, match and notification they ever had" - an unstyled, untranslated
 * box with an OK button, which is the same weight of interaction as dismissing
 * an alert. This states what will happen, names the thing, and for the two
 * irreversible actions (deleting an account, deleting a listing) asks the admin
 * to type the target's name first, so the hardest actions cannot be reached by
 * a reflex click.
 */
const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  tone = 'critical',
  // When set, the confirm button stays disabled until this exact string is typed.
  requireTyped,
  requireTypedLabel,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const [typed, setTyped] = useState('');

  const handleClose = () => {
    setTyped('');
    onClose();
  };

  const handleConfirm = async () => {
    await onConfirm();
    setTyped('');
  };

  const matched = !requireTyped || typed.trim() === String(requireTyped).trim();

  return (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: (theme) => ({
          backgroundColor: theme.custom.color.surfaceRaised,
          backgroundImage: 'none',
          borderRadius: `${theme.custom.radius.lg}px`,
          boxShadow: theme.custom.elevation.e3,
        }),
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={(theme) => {
              const resolved = adminTone(theme, tone);
              return {
                width: 36,
                height: 36,
                flexShrink: 0,
                borderRadius: `${theme.custom.radius.sm}px`,
                backgroundColor: resolved.bg,
                color: resolved.main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              };
            }}
          >
            <WarningAmberOutlined sx={{ fontSize: 20 }} />
          </Box>
          <Typography
            sx={(theme) => ({
              fontFamily: theme.custom.font.display,
              fontWeight: 700,
              fontSize: '1.05rem',
              color: theme.custom.color.ink,
            })}
          >
            {title}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {description ? (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {description}
          </Typography>
        ) : null}

        {requireTyped ? (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.75 }}>
              {requireTypedLabel || t('typeToConfirm', { value: requireTyped })}
            </Typography>
            <TextField
              fullWidth
              size="small"
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              disabled={isLoading}
              autoComplete="off"
              // A confirmation field is never the browser's business.
              inputProps={{ spellCheck: 'false', 'aria-label': t('typeToConfirmField') }}
              sx={(theme) => ({
                '& .MuiOutlinedInput-root': {
                  borderRadius: `${theme.custom.radius.sm}px`,
                  backgroundColor: alpha(theme.custom.color.ink, 0.03),
                },
              })}
            />
          </Box>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={handleClose} disabled={isLoading} sx={quietButtonSx}>
          {t('cancel')}
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={isLoading || !matched}
          variant="contained"
          disableElevation
          startIcon={isLoading ? <CircularProgress size={15} color="inherit" /> : null}
          sx={containedButtonSx(tone)}
        >
          {confirmLabel || t('confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
