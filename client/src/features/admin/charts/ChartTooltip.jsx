import React from 'react';
import { Box, Typography } from '@mui/material';

/**
 * The hover layer's readout.
 *
 * Plain HTML rather than SVG, positioned in the chart's own pixel space, so it
 * inherits the app's type and needs no font metrics of its own. `left` is a
 * physical coordinate on purpose - the charts already flip their x axis for
 * Arabic, so the number handed here is where the mark actually is.
 */
const ChartTooltip = ({ x, title, rows = [], containerWidth }) => {
  // Keep the box inside the chart rather than letting it hang off an edge.
  const clamped = Math.min(Math.max(x, 74), Math.max(74, containerWidth - 74));

  return (
    <Box
      role="tooltip"
      sx={(theme) => ({
        position: 'absolute',
        top: 0,
        left: clamped,
        transform: 'translateX(-50%)',
        pointerEvents: 'none',
        zIndex: 2,
        minWidth: 128,
        px: 1.25,
        py: 1,
        borderRadius: `${theme.custom.radius.sm}px`,
        backgroundColor: theme.custom.color.surfaceRaised,
        boxShadow: theme.custom.elevation.e2,
      })}
    >
      <Typography
        variant="caption"
        sx={{ fontWeight: 700, display: 'block', mb: 0.5, color: 'text.secondary' }}
      >
        {title}
      </Typography>
      {rows.map((row) => (
        <Box
          key={row.label}
          sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              flexShrink: 0,
              backgroundColor: row.color,
            }}
          />
          <Typography variant="caption" sx={{ color: 'text.secondary', flex: 1 }}>
            {row.label}
          </Typography>
          <Typography
            variant="caption"
            sx={(theme) => ({
              fontWeight: 700,
              color: theme.custom.color.ink,
              fontVariantNumeric: 'tabular-nums',
            })}
          >
            {row.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export default ChartTooltip;
