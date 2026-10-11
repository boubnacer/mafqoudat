import React, { useId } from 'react';
import { Box, useTheme } from '@mui/material';
import { isRTL as checkIsRTL } from '../../utils/languageUtils';

/**
 * CyberDotMatrix
 * Renders a decorative cyber dot matrix SVG overlay with diagonal corner clusters.
 * Matches the design language of Statistics (LeftSide) and Interactive Map.
 *
 * @param {string} [idPrefix] - Optional unique prefix for SVG defs IDs.
 * @param {string} [color] - Base dot color (defaults to theme.custom.color.brandLogo).
 * @param {string} [colorTop] - Semantic color for top cluster (overrides color).
 * @param {string} [colorBottom] - Semantic color for bottom cluster (overrides color).
 * @param {boolean} [inverted=false] - If false: Top-Start & Bottom-End. If true: Top-End & Bottom-Start.
 * @param {number} [opacity] - SVG opacity (defaults to 0.5 in dark mode, 0.85 in light mode).
 * @param {number} [dotRadius] - Dot radius (defaults to 0.72 in dark mode, 0.9 in light mode).
 * @param {number} [patternSpacing=4.5] - Spacing grid between dots.
 * @param {string} [glowRadius="48%"] - Radial gradient mask radius.
 * @param {number} [zIndex=0] - z-index of the SVG overlay.
 * @param {object} [sx] - Optional extra sx styling for Box container.
 */
const CyberDotMatrix = ({
  idPrefix,
  color,
  colorTop,
  colorBottom,
  inverted = false,
  opacity,
  dotRadius,
  patternSpacing = 4.5,
  glowRadius = '48%',
  zIndex = 0,
  sx = {},
}) => {
  const theme = useTheme();
  const rawId = useId();
  const uid = (idPrefix || `cyber-dots-${rawId}`).replace(/[^a-zA-Z0-9-_]/g, '');

  const isDark = theme.palette.mode === 'dark';
  const isRtl = checkIsRTL() || theme.direction === 'rtl';

  const defaultColor = theme.custom?.color?.brandLogo || '#3498DB';
  const topColor = colorTop || color || defaultColor;
  const bottomColor = colorBottom || color || defaultColor;

  const resolvedOpacity = opacity ?? (isDark ? 0.5 : 0.85);
  const resolvedDotRadius = dotRadius ?? (isDark ? 0.72 : 0.9);
  const center = patternSpacing / 2;

  // Geometry: Inverted vs Standard
  // Standard: Top-Start & Bottom-End
  // Inverted: Top-End & Bottom-Start
  const topCx = inverted
    ? (isRtl ? '0%' : '100%')
    : (isRtl ? '100%' : '0%');

  const bottomCx = inverted
    ? (isRtl ? '100%' : '0%')
    : (isRtl ? '0%' : '100%');

  const patternTopId = `${uid}-pat-top`;
  const patternBottomId = `${uid}-pat-bottom`;
  const topGlowId = `${uid}-glow-top`;
  const bottomGlowId = `${uid}-glow-bottom`;
  const topMaskId = `${uid}-mask-top`;
  const bottomMaskId = `${uid}-mask-bottom`;

  const sameColor = topColor === bottomColor;

  return (
    <Box
      component="svg"
      sx={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        opacity: resolvedOpacity,
        zIndex,
        ...sx,
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Top pattern */}
        <pattern
          id={patternTopId}
          width={patternSpacing}
          height={patternSpacing}
          patternUnits="userSpaceOnUse"
        >
          <circle cx={center} cy={center} r={resolvedDotRadius} fill={topColor} />
        </pattern>

        {/* Bottom pattern (only if distinct color) */}
        {!sameColor && (
          <pattern
            id={patternBottomId}
            width={patternSpacing}
            height={patternSpacing}
            patternUnits="userSpaceOnUse"
          >
            <circle cx={center} cy={center} r={resolvedDotRadius} fill={bottomColor} />
          </pattern>
        )}

        {/* Top radial mask gradient */}
        <radialGradient id={topGlowId} cx={topCx} cy="0%" r={glowRadius}>
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="40%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="75%" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>

        {/* Bottom radial mask gradient */}
        <radialGradient id={bottomGlowId} cx={bottomCx} cy="100%" r={glowRadius}>
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="40%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="75%" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>

        <mask id={topMaskId}>
          <rect width="100%" height="100%" fill={`url(#${topGlowId})`} />
        </mask>
        <mask id={bottomMaskId}>
          <rect width="100%" height="100%" fill={`url(#${bottomGlowId})`} />
        </mask>
      </defs>

      <rect
        width="100%"
        height="100%"
        fill={`url(#${patternTopId})`}
        mask={`url(#${topMaskId})`}
      />
      <rect
        width="100%"
        height="100%"
        fill={`url(#${sameColor ? patternTopId : patternBottomId})`}
        mask={`url(#${bottomMaskId})`}
      />
    </Box>
  );
};

export default CyberDotMatrix;
