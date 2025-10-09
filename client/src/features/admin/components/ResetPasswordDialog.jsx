import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  InputAdornment,
  LinearProgress,
  Alert,
  useTheme,
  Divider,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  LockReset,
  Close,
} from '@mui/icons-material';

const ResetPasswordDialog = ({
  open,
  onClose,
  userId,
  username,
  onConfirm,
}) => {
  const theme = useTheme();
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: 'error' };
    
    let strength = 0;
    if (password.length >= 6) strength += 25;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 10;

    let label = '';
    let color = 'error';
    
    if (strength >= 75) {
      label = 'Strong';
      color = 'success';
    } else if (strength >= 50) {
      label = 'Medium';
      color = 'warning';
    } else if (strength >= 25) {
      label = 'Weak';
      color = 'error';
    }

    return { strength, label, color };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  const handleSubmit = async () => {
    setError('');
    
    if (!newPassword) {
      setError('Password is required');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onConfirm(userId, newPassword);
      handleClose();
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setNewPassword('');
    setShowPassword(false);
    setError('');
    setIsSubmitting(false);
    onClose();
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <LockReset color="warning" />
            <Typography variant="h6" fontWeight="bold">
              Reset User Password
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small" disabled={isSubmitting}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 3 }}>
        <Box mb={3}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Reset password for user: <strong>{username}</strong>
          </Typography>
          <Typography variant="caption" color="warning.main">
            Warning: This will immediately change the user's password.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          autoFocus
          fullWidth
          type={showPassword ? 'text' : 'password'}
          label="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Enter new password (min 6 characters)"
          disabled={isSubmitting}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={handleTogglePasswordVisibility}
                  edge="end"
                  size="small"
                  disabled={isSubmitting}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          helperText="Minimum 6 characters required"
          sx={{ mb: 2 }}
        />

        {newPassword && (
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
              <Typography variant="caption" color="text.secondary">
                Password Strength:
              </Typography>
              <Typography 
                variant="caption" 
                fontWeight="bold"
                color={`${passwordStrength.color}.main`}
              >
                {passwordStrength.label}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={passwordStrength.strength}
              color={passwordStrength.color}
              sx={{ height: 6, borderRadius: 1 }}
            />
          </Box>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="warning"
          disabled={isSubmitting || newPassword.length < 6}
          startIcon={isSubmitting ? null : <LockReset />}
        >
          {isSubmitting ? 'Resetting...' : 'Reset Password'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ResetPasswordDialog;

