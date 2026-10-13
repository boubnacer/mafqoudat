import React, { useId } from 'react';
import { Box, useTheme } from '@mui/material';
import { isRTL as checkIsRTL } from '../../utils/languageUtils';

/**
 * CyberDotMatrix
 * Renders a decorative cyber dot matrix SVG overlay with diagonal corner clusters.
 * Matches the design language of Statistics (LeftSide) and Interactive Map.
 *
 * @param {string} [idPrefix] - Optional unique prefix for SVG defs IDs.
 * @param {boolean} [isDark] - Optional explicit dark mode override.
 * @param {string} [color] - Base dot color (defaults to theme.custom.color.brandLogo).
 * @param {string} [colorTop] - Semantic color for top cluster (overrides color).
 * @param {string} [colorBottom] - Semantic color for bottom cluster (overrides color).
 * @param {boolean} [inverted=false] - If false: Top-Start & Bottom-End. If true: Top-End & Bottom-Start.
 * @param {string} [placement="diagonal-standard"] - Placement alias ("diagonal-standard" | "diagonal-inverted").
 * @param {string} [shape="circle"] - Dot shape ("circle" | "star" | "square").
 * @param {string} [falloffCurve="default"] - Radial mask falloff curve ("default" | "soft").
 * @param {boolean} [hairlineGlow=false] - If true, renders a subtle top hairline glow.
 * @param {number} [opacity] - SVG opacity (defaults to 0.5 in dark mode, 0.85 in light mode).
 * @param {number} [dotRadius] - Dot radius (defaults to 0.72 in dark mode, 0.9 in light mode).
 * @param {number} [patternSpacing=4.5] - Spacing grid between dots.
 * @param {string} [glowRadius="48%"] - Radial gradient mask radius.
 * @param {number} [zIndex=0] - z-index of the SVG overlay.
 * @param {object} [sx] - Optional extra sx styling for Box container.
 */
const CyberDotMatrix = ({
  idPrefix,
  isDark: isDarkProp,
  color,
  colorTop,
  colorBottom,
  inverted = false,
  placement = 'diagonal-standard',
  shape = 'square',
  falloffCurve = 'default',
  hairlineGlow = false,
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

  const isDark = isDarkProp !== undefined
    ? isDarkProp
    : theme.palette.mode === 'dark';
  const isRtl = checkIsRTL() || theme.direction === 'rtl';

  const defaultColor = theme.custom?.color?.cyberDots || (isDark ? '#C8E5F9' : '#1C699C');
  const topColor = colorTop || color || defaultColor;
  const bottomColor = colorBottom || color || defaultColor;

  const resolvedOpacity = opacity ?? (isDark ? 0.5 : 0.75);
  const resolvedDotRadius = dotRadius ?? (isDark ? 0.72 : 0.9);
  const center = patternSpacing / 2;

  // Placement: support both placement string and inverted boolean
  const isInverted = Boolean(inverted) || placement === 'diagonal-inverted' || placement === 'inverted';

  const isBottomOnly = placement === 'bottom-end' || placement === 'bottom-start' || placement === 'bottom' || placement === 'bottom-right' || placement === 'bottom-left';
  const isTopOnly = placement === 'top-start' || placement === 'top-end' || placement === 'top' || placement === 'top-right' || placement === 'top-left';

  const showTop = !isBottomOnly;
  const showBottom = !isTopOnly;

  let topCx = isInverted
    ? (isRtl ? '0%' : '100%')
    : (isRtl ? '100%' : '0%');

  let bottomCx = isInverted
    ? (isRtl ? '100%' : '0%')
    : (isRtl ? '0%' : '100%');

  // Explicit corner overrides
  if (placement === 'bottom-right') {
    bottomCx = '100%';
  } else if (placement === 'bottom-left') {
    bottomCx = '0%';
  } else if (placement === 'top-right') {
    topCx = '100%';
  } else if (placement === 'top-left') {
    topCx = '0%';
  }

  const patternTopId = `${uid}-pat-top`;
  const patternBottomId = `${uid}-pat-bottom`;
  const topGlowId = `${uid}-glow-top`;
  const bottomGlowId = `${uid}-glow-bottom`;
  const topMaskId = `${uid}-mask-top`;
  const bottomMaskId = `${uid}-mask-bottom`;
  const hairlineGradId = `${uid}-hairline-glow`;

  const sameColor = topColor === bottomColor;

  const renderGlyph = (fillColor) => {
    if (shape === 'star') {
      const R = resolvedDotRadius * 1.35;
      return (
        <path
          d={`M ${center} ${center - R} Q ${center} ${center} ${center + R} ${center} Q ${center} ${center} ${center} ${center + R} Q ${center} ${center} ${center - R} ${center} Q ${center} ${center} ${center} ${center - R} Z`}
          fill={fillColor}
        />
      );
    }
    if (shape === 'square') {
      const size = resolvedDotRadius * 2;
      return (
        <rect
          x={center - resolvedDotRadius}
          y={center - resolvedDotRadius}
          width={size}
          height={size}
          fill={fillColor}
        />
      );
    }
    return <circle cx={center} cy={center} r={resolvedDotRadius} fill={fillColor} />;
  };

  const renderGlowStops = () => {
    if (falloffCurve === 'soft') {
      return (
        <>
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="25%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="75%" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="90%" stopColor="#ffffff" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </>
      );
    }
    return (
      <>
        <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
        <stop offset="40%" stopColor="#ffffff" stopOpacity="0.85" />
        <stop offset="75%" stopColor="#ffffff" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </>
    );
  };

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
          {renderGlyph(topColor)}
        </pattern>

        {/* Bottom pattern (only if distinct color) */}
        {!sameColor && (
          <pattern
            id={patternBottomId}
            width={patternSpacing}
            height={patternSpacing}
            patternUnits="userSpaceOnUse"
          >
            {renderGlyph(bottomColor)}
          </pattern>
        )}

        {/* Top radial mask gradient */}
        <radialGradient id={topGlowId} cx={topCx} cy="0%" r={glowRadius}>
          {renderGlowStops()}
        </radialGradient>

        {/* Bottom radial mask gradient */}
        <radialGradient id={bottomGlowId} cx={bottomCx} cy="100%" r={glowRadius}>
          {renderGlowStops()}
        </radialGradient>

        <mask id={topMaskId}>
          <rect width="100%" height="100%" fill={`url(#${topGlowId})`} />
        </mask>
        <mask id={bottomMaskId}>
          <rect width="100%" height="100%" fill={`url(#${bottomGlowId})`} />
        </mask>

        {/* Hairline glow gradient */}
        {hairlineGlow && (
          <linearGradient id={hairlineGradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={topColor} stopOpacity="0" />
            <stop offset="25%" stopColor={topColor} stopOpacity={isDark ? 0.45 : 0.3} />
            <stop offset="50%" stopColor={isDark ? '#FFFFFF' : topColor} stopOpacity={isDark ? 0.75 : 0.55} />
            <stop offset="75%" stopColor={bottomColor} stopOpacity={isDark ? 0.45 : 0.3} />
            <stop offset="100%" stopColor={bottomColor} stopOpacity="0" />
          </linearGradient>
        )}
      </defs>

      {showTop && (
        <rect
          width="100%"
          height="100%"
          fill={`url(#${patternTopId})`}
          mask={`url(#${topMaskId})`}
        />
      )}
      {showBottom && (
        <rect
          width="100%"
          height="100%"
          fill={`url(#${sameColor ? patternTopId : patternBottomId})`}
          mask={`url(#${bottomMaskId})`}
        />
      )}

      {/* Hairline glow edge */}
      {hairlineGlow && (
        <rect
          x="0"
          y="0"
          width="100%"
          height="1.5"
          fill={`url(#${hairlineGradId})`}
        />
      )}
    </Box>
  );
};

export { CyberDotMatrix };
export default CyberDotMatrix;
