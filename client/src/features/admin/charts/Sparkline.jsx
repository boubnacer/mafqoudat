import React from 'react';
import { Box, useTheme } from '@mui/material';
import { areaFill } from './chartTokens';
import useChartSize from './useChartSize';

/**
 * The stat tile's trend: twelve-or-so points, no axis, no labels, no hover.
 *
 * It exists to say "and this is the shape of it", nothing more - the number
 * above it is the message. Deliberately without a tooltip: the tile is not a
 * chart, and a hover layer on a 32px sparkline would be a hit target nobody can
 * find. The full series is on the Analytics page.
 */
const Sparkline = ({ values = [], color, height = 34, filled = true }) => {
  const theme = useTheme();
  const [hostRef, width] = useChartSize(160);
  const stroke = color || theme.custom.color.brandPrimary;

  const points = values.length ? values : [0, 0];
  const max = Math.max(1, ...points);
  const step = points.length > 1 ? width / (points.length - 1) : width;
  const y = (value) => height - 2 - (value / max) * (height - 4);

  const line = points
    .map((value, index) => `${index === 0 ? 'M' : 'L'}${index * step},${y(value)}`)
    .join(' ');
  const area = `${line} L${(points.length - 1) * step},${height} L0,${height} Z`;

  return (
    <Box ref={hostRef} sx={{ width: '100%', lineHeight: 0 }}>
      <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }} aria-hidden="true">
        {filled ? <path d={area} fill={areaFill(stroke)} /> : null}
        <path d={line} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </Box>
  );
};

export default Sparkline;
