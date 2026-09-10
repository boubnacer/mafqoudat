import React from 'react';
import { Box, Typography, alpha } from '@mui/material';

/**
 * A ranked list of nominal categories - top categories, top cities, where
 * visitors landed.
 *
 * Every bar is the same colour. These categories have no order of their own, so
 * colouring them by value would spend the identity channel re-encoding the one
 * thing the bar length already says, and colouring them by rank would repaint
 * the survivors the moment a filter changes the list.
 *
 * The value is direct-labelled at the tip of each bar, which is what lets the
 * chart do without an axis at all.
 */
const RankBars = ({ items = [], color, emptyLabel, max: maxProp, valueSuffix }) => {
  const max = maxProp ?? Math.max(1, ...items.map((item) => item.count || 0));

  if (!items.length) {
    return (
      <Typography variant="body2" sx={{ color: 'text.secondary', py: 2 }}>
        {emptyLabel}
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
      {items.map((item) => {
        const share = Math.max(2, Math.round(((item.count || 0) / max) * 100));
        return (
          <Box key={item.id || item.label}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 1.5,
                mb: 0.5,
              }}
            >
              <Typography
                variant="body2"
                sx={(theme) => ({
                  color: theme.custom.color.ink,
                  fontWeight: 600,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                })}
              >
                {item.label}
              </Typography>
              <Typography
                variant="caption"
                sx={(theme) => ({
                  fontWeight: 700,
                  color: theme.custom.color.ink,
                  flexShrink: 0,
                  fontVariantNumeric: 'tabular-nums',
                })}
              >
                {`${(item.count || 0).toLocaleString()}${valueSuffix || ''}`}
              </Typography>
            </Box>
            {/* The track is a lighter step of the bar's own colour, so the
                unfilled part still reads as part of the same measure. */}
            <Box
              sx={(theme) => ({
                height: 8,
                borderRadius: 4,
                backgroundColor: alpha(color || theme.custom.color.brandPrimary, 0.12),
                overflow: 'hidden',
              })}
            >
              <Box
                sx={(theme) => ({
                  width: `${share}%`,
                  height: '100%',
                  borderRadius: 4,
                  backgroundColor: color || theme.custom.color.brandPrimary,
                })}
              />
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export default RankBars;
