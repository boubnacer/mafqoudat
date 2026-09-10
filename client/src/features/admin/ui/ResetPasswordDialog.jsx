import React, { useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  LinearProgress,
  TextField,
  Typography,
  alpha,
} from '@mui/material';
import {
  LockResetOutlined,
  VisibilityOutlined,
  VisibilityOffOutlined,
  AutorenewOutlined,
} from '@mui/icons-material';
import AdminDialog from './AdminDialog';
import { adminTone } from './adminTones';
import { actionButtonSx, containedButtonSx, inputSx, quietButtonSx } from './adminSx';
import { useTranslation } from '../../../utils/translations';

/**
 * Set a new password for an account, on request.
 *
 * This is the far end of the password-reset queue: someone with no email on
 * file asks for help, an admin verifies them out of band and sets a password
 * here. So it also offers to generate one - an admin typing a password they
 * then have to read out is how "Password123" ends up on accounts.
 *
 * The strength meter is the design system's meter shape and its labels are
 * translated; the old one hardcoded "Strong"/"Medium"/"Weak" and its error
 * strings, and rendered them in English inside an Arabic panel.
 */

// Ambiguous glyphs are left out: this password is going to be read aloud or
// copied by hand at the other end of a phone call.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

const generatePassword = (length = 14) => {
  const values = new Uint32Array(length);
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(values);
  } else {
    for (let i = 0; i < length; i += 1) values[i] = Math.floor(Math.random() * 4294967296);
  }
  return Array.from(values, (value) => ALPHABET[value % ALPHABET.length]).join('');
};

const scorePassword = (password) => {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 6) score += 25;
  if (password.length >= 10) score += 25;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 25;
  if (/\d/.test(password)) score += 15;
  if (/[^a-zA-Z0-9]/.test(password)) score += 10;
  return Math.min(100, score);
};

const ResetPasswordDialog = ({ open, onClose, username, onConfirm }) => {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const score = scorePassword(password);
  const tone = score >= 75 ? 'positive' : score >= 50 ? 'attention' : 'critical';
  const strengthLabel =
    score >= 75 ? t('passwordStrong') : score >= 50 ? t('passwordMedium') : t('passwordWeak');

  const close = () => {
    setPassword('');
    setVisible(false);
    setError('');
    onClose();
  };

  const submit = async () => {
    setError('');
    if (password.length < 6) {
      setError(t('passwordTooShort'));
      return;
    }
    setSubmitting(true);
    try {
      await onConfirm(password);
      close();
    } catch (requestError) {
      setError(requestError?.data?.message || t('genericActionError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminDialog
      open={open}
      onClose={close}
      icon={LockResetOutlined}
      title={t('resetPassword')}
      subtitle={username}
      maxWidth="xs"
      actions={
        <>
          <Button onClick={close} disabled={submitting} sx={quietButtonSx}>
            {t('cancel')}
          </Button>
          <Button
            variant="contained"
            disableElevation
            onClick={submit}
            disabled={submitting || password.length < 6}
            sx={containedButtonSx('brand')}
          >
            {t('resetPassword')}
          </Button>
        </>
      }
    >
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
        {t('resetPasswordAdminBody', { name: username })}
      </Typography>

      <TextField
        fullWidth
        size="small"
        type={visible ? 'text' : 'password'}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        label={t('newPassword')}
        autoComplete="new-password"
        error={Boolean(error)}
        helperText={error || ' '}
        sx={inputSx}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={() => setVisible((current) => !current)}
                aria-label={visible ? t('hidePassword') : t('showPassword')}
              >
                {visible ? (
                  <VisibilityOffOutlined fontSize="small" />
                ) : (
                  <VisibilityOutlined fontSize="small" />
                )}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <Button
        onClick={() => {
          setPassword(generatePassword());
          setVisible(true);
        }}
        startIcon={<AutorenewOutlined />}
        size="small"
        sx={(theme) => ({ ...actionButtonSx('brand')(theme), mb: 1.5 })}
      >
        {t('generatePassword')}
      </Button>

      {password ? (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              {t('passwordStrength')}
            </Typography>
            <Typography
              variant="caption"
              sx={(theme) => ({ fontWeight: 700, color: adminTone(theme, tone).main })}
            >
              {strengthLabel}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={score}
            sx={(theme) => ({
              height: 6,
              borderRadius: 3,
              backgroundColor: alpha(adminTone(theme, tone).main, 0.16),
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                backgroundColor: adminTone(theme, tone).main,
              },
            })}
          />
        </Box>
      ) : null}
    </AdminDialog>
  );
};

export default ResetPasswordDialog;
