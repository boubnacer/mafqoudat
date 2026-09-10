import React from 'react';
import { Box, Typography } from '@mui/material';
import { adminTone, toneFor } from './adminTones';

/**
 * One state, rendered the same way everywhere.
 *
 * Tint background + solid-tone label, the pairing `theme.custom.status` already
 * uses on the post card and in the Phase 19 clarifier lines. An icon is always
 * available and always used for the two ends of the scale, because a status
 * that reads only as a colour is unreadable to a chunk of the people who have
 * to act on it.
 */
const StatusPill = ({ label, state, tone, icon: Icon, size = 'md', sx = {} }) => (
  <Box
    component="span"
    sx={(theme) => {
      const resolved = adminTone(theme, tone || toneFor(state));
      const small = size === 'sm';
      return {
        display: 'inline-flex',
        alignItems: 'center',
        gap: small ? 0.5 : 0.75,
        maxWidth: '100%',
        px: small ? 0.75 : 1,
        py: small ? 0.25 : 0.5,
        borderRadius: `${theme.custom.radius.sm}px`,
        backgroundColor: resolved.bg,
        color: resolved.main,
        ...(typeof sx === 'function' ? sx(theme) : sx),
      };
    }}
  >
    {Icon ? <Icon sx={{ fontSize: size === 'sm' ? 13 : 15 }} /> : null}
    <Typography
      component="span"
      sx={{
        fontSize: size === 'sm' ? '0.68rem' : '0.75rem',
        fontWeight: 700,
        lineHeight: 1.4,
        letterSpacing: 0.2,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {label}
    </Typography>
  </Box>
);

export default StatusPill;
