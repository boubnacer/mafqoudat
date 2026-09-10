import React from 'react';
import { Box, Dialog, DialogContent, IconButton, Typography, useMediaQuery, useTheme } from '@mui/material';
import { Close } from '@mui/icons-material';
import { useTranslation } from '../../../utils/translations';

/**
 * The panel's detail sheet.
 *
 * One styled shell for every "open this row" view, so a report, a listing and a
 * support message are read in the same frame. Full-screen on a phone (a detail
 * view with a form in it is unusable in a 90%-height box on a 375px screen) and
 * a centred dialog from `sm` up.
 *
 * Colours come from the tokens rather than the literal `#1e1e1e`/`#ffffff` the
 * old dialogs hardcoded, which is why they never followed the theme.
 */
const AdminDialog = ({ open, onClose, title, subtitle, icon: Icon, children, actions, maxWidth = 'sm' }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth={maxWidth}
      fullScreen={fullScreen}
      PaperProps={{
        sx: (t2) => ({
          backgroundColor: t2.custom.color.surfaceRaised,
          backgroundImage: 'none',
          borderRadius: fullScreen ? 0 : `${t2.custom.radius.lg}px`,
          boxShadow: t2.custom.elevation.e3,
        }),
      }}
    >
      <Box
        sx={(t2) => ({
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: { xs: 2, sm: 3 },
          py: 2,
          position: 'sticky',
          top: 0,
          zIndex: 1,
          backgroundColor: t2.custom.color.surfaceRaised,
        })}
      >
        {Icon ? (
          <Box
            sx={(t2) => ({
              width: 34,
              height: 34,
              flexShrink: 0,
              borderRadius: `${t2.custom.radius.sm}px`,
              backgroundColor: t2.custom.status.found.bg,
              color: t2.custom.status.found.main,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            })}
          >
            <Icon sx={{ fontSize: 19 }} />
          </Box>
        ) : null}
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            sx={(t2) => ({
              fontFamily: t2.custom.font.display,
              fontWeight: 700,
              fontSize: '1.05rem',
              color: t2.custom.color.ink,
              lineHeight: 1.3,
            })}
          >
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        <IconButton onClick={onClose} size="small" aria-label={t('close')} sx={{ color: 'text.secondary' }}>
          <Close fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: { xs: 2, sm: 3 }, pt: 0, pb: actions ? 1 : 3 }}>
        {children}
      </DialogContent>

      {actions ? (
        <Box
          sx={(t2) => ({
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
            gap: 1,
            px: { xs: 2, sm: 3 },
            py: 2,
            position: 'sticky',
            bottom: 0,
            backgroundColor: t2.custom.color.surfaceRaised,
          })}
        >
          {actions}
        </Box>
      ) : null}
    </Dialog>
  );
};

export default AdminDialog;
