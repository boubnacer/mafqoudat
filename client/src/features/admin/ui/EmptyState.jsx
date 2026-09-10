import React from 'react';
import { Box, Typography, alpha } from '@mui/material';

/**
 * The "nothing here" panel.
 *
 * Deliberately not the shared components/LoadingStates.jsx `EmptyState`, which
 * still styles off `theme.palette.mode` rather than `theme.custom` (see the
 * tokenization debt note in CLAUDE.md) - this one is token-only, and an empty
 * moderation queue is good news, so it is not drawn as an error.
 */
const EmptyState = ({ icon: Icon, title, description, action, tone = 'neutral' }) => (
  <Box
    sx={(theme) => ({
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      gap: 1,
      px: 3,
      py: { xs: 4, sm: 6 },
      color: theme.palette.text.secondary,
    })}
  >
    {Icon ? (
      <Box
        sx={(theme) => ({
          width: 48,
          height: 48,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 0.5,
          backgroundColor:
            tone === 'positive'
              ? theme.custom.status.found.bg
              : alpha(theme.custom.color.ink, theme.palette.mode === 'dark' ? 0.08 : 0.04),
          color:
            tone === 'positive'
              ? theme.custom.status.found.main
              : theme.palette.text.secondary,
        })}
      >
        <Icon sx={{ fontSize: 24 }} />
      </Box>
    ) : null}
    <Typography
      sx={(theme) => ({
        fontFamily: theme.custom.font.display,
        fontWeight: 700,
        fontSize: '1rem',
        color: theme.custom.color.ink,
      })}
    >
      {title}
    </Typography>
    {description ? (
      <Typography variant="body2" sx={{ maxWidth: 380 }}>
        {description}
      </Typography>
    ) : null}
    {action ? <Box sx={{ mt: 1.5 }}>{action}</Box> : null}
  </Box>
);

export default EmptyState;
