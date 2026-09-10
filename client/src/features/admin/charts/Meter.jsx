import React from 'react';
import { Box, Typography, alpha } from '@mui/material';
import { adminTone } from '../ui/adminTones';

/**
 * One value against a limit - storage against the cluster's ceiling, latency
 * against a threshold.
 *
 * The fill carries the severity and the track is a lighter step of the same
 * colour, so the state reads across the whole bar rather than only across the
 * filled part. The severity always ships with its own label beside the number,
 * never as colour alone.
 */
const Meter = ({ value = 0, max = 100, tone = 'positive', label, valueLabel, hint }) => {
  const share = Math.max(0, Math.min(100, max ? (value / max) * 100 : 0));

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 1,
          mb: 0.75,
        }}
      >
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
          {label}
        </Typography>
        <Typography
          variant="caption"
          sx={(theme) => ({
            fontWeight: 700,
            color: adminTone(theme, tone).main,
            fontVariantNumeric: 'tabular-nums',
          })}
        >
          {valueLabel}
        </Typography>
      </Box>
      <Box
        sx={(theme) => ({
          height: 8,
          borderRadius: 4,
          overflow: 'hidden',
          backgroundColor: alpha(adminTone(theme, tone).main, 0.14),
        })}
        role="progressbar"
        aria-valuenow={Math.round(share)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <Box
          sx={(theme) => ({
            width: `${share}%`,
            height: '100%',
            borderRadius: 4,
            backgroundColor: adminTone(theme, tone).main,
          })}
        />
      </Box>
      {hint ? (
        <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 0.5 }}>
          {hint}
        </Typography>
      ) : null}
    </Box>
  );
};

export default Meter;
