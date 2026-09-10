import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Box, IconButton, Slide, Snackbar, Typography } from '@mui/material';
import {
  CheckCircleOutline,
  ErrorOutline,
  InfoOutlined,
  Close,
} from '@mui/icons-material';
import { adminTone } from './adminTones';

/**
 * Replaces `alert()`.
 *
 * The panel confirmed a deleted user, a reset password and a failed city save
 * with browser alerts - modal, unstyled, untranslated, and blocking. This is
 * the same information as a dismissible toast that does not stop the admin
 * doing the next thing.
 *
 * Anchored bottom-centre rather than to a side, so the position needs no
 * mirroring in Arabic.
 */
const ToastContext = createContext(() => {});

const TONE_BY_SEVERITY = { success: 'positive', error: 'critical', info: 'brand' };
const ICON_BY_SEVERITY = {
  success: CheckCircleOutline,
  error: ErrorOutline,
  info: InfoOutlined,
};

export const AdminToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);

  const notify = useCallback((message, severity = 'success') => {
    if (!message) return;
    // The key forces a remount so a second toast restarts the timer rather
    // than inheriting the first one's remaining time.
    setToast({ message, severity, key: Date.now() });
  }, []);

  const value = useMemo(() => notify, [notify]);
  const Icon = ICON_BY_SEVERITY[toast?.severity] || InfoOutlined;

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Snackbar
        key={toast?.key}
        open={Boolean(toast)}
        autoHideDuration={toast?.severity === 'error' ? 8000 : 4000}
        onClose={(event, reason) => {
          if (reason === 'clickaway') return;
          setToast(null);
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        TransitionComponent={Slide}
        sx={{ zIndex: (theme) => theme.zIndex.modal + 2 }}
      >
        <Box
          sx={(theme) => {
            const tone = adminTone(theme, TONE_BY_SEVERITY[toast?.severity] || 'brand');
            return {
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              px: 2,
              py: 1.25,
              maxWidth: 'min(92vw, 460px)',
              borderRadius: `${theme.custom.radius.md}px`,
              backgroundColor: theme.custom.color.surfaceRaised,
              boxShadow: theme.custom.elevation.e3,
              borderInlineStart: `4px solid ${tone.main}`,
              color: theme.custom.color.ink,
            };
          }}
          role="status"
        >
          <Icon
            sx={(theme) => ({
              fontSize: 20,
              flexShrink: 0,
              color: adminTone(theme, TONE_BY_SEVERITY[toast?.severity] || 'brand').main,
            })}
          />
          <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 0 }}>
            {toast?.message}
          </Typography>
          <IconButton
            size="small"
            onClick={() => setToast(null)}
            sx={{ ms: 'auto', marginInlineStart: 'auto', color: 'text.secondary' }}
            aria-label="close"
          >
            <Close fontSize="small" />
          </IconButton>
        </Box>
      </Snackbar>
    </ToastContext.Provider>
  );
};

export const useAdminToast = () => useContext(ToastContext);

export default AdminToastProvider;
