import React from 'react';
import { Box, Typography, alpha } from '@mui/material';

/**
 * A label/value pair inside a detail sheet. Stacks on a phone, two columns from
 * `sm` up. `value` may be a node, so a pill or a link drops straight in.
 */
const FieldRow = ({ label, value, multiline = false }) => (
  <Box
    sx={(theme) => ({
      display: 'grid',
      gridTemplateColumns: { xs: '1fr', sm: multiline ? '1fr' : 'minmax(110px, 160px) 1fr' },
      gap: { xs: 0.25, sm: multiline ? 0.5 : 2 },
      py: 1,
      borderBottom: `1px solid ${alpha(theme.custom.color.ink, 0.06)}`,
      '&:last-of-type': { borderBottom: 'none' },
    })}
  >
    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, pt: 0.25 }}>
      {label}
    </Typography>
    {typeof value === 'string' || typeof value === 'number' ? (
      <Typography
        variant="body2"
        sx={(theme) => ({
          color: theme.custom.color.ink,
          wordBreak: 'break-word',
          whiteSpace: multiline ? 'pre-wrap' : 'normal',
        })}
      >
        {value}
      </Typography>
    ) : (
      <Box sx={{ minWidth: 0 }}>{value}</Box>
    )}
  </Box>
);

export default FieldRow;
