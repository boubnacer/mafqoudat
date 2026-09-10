import React from 'react';
import { Box, Typography } from '@mui/material';

/**
 * Always present for two or more series - the dependable identity channel, so
 * nothing on these charts depends on telling two colours apart. A single-series
 * chart gets none: its title already says what is plotted, and a one-swatch box
 * only restates it.
 */
const ChartLegend = ({ series = [] }) => {
  if (series.length < 2) return null;
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.75, mb: 1 }}>
      {series.map((entry) => (
        <Box key={entry.key} sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: 3,
              flexShrink: 0,
              backgroundColor: entry.color,
            }}
          />
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            {entry.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export default ChartLegend;
