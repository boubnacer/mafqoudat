import React, { useId } from 'react';
import { Box, useTheme } from '@mui/material';
import { useTranslation } from '../../utils/translations';

/**
 * CyberDotMatrix
 * Renders a decorative cyber dot matrix SVG overlay with diagonal corner clusters.
 * Matches the design language of Statistics (LeftSide) and Interactive Map.
 *
 * @param {string} [idPrefix] - Optional unique prefix for SVG defs IDs.
 * @param {boolean} [isDark] - Optional explicit dark mode override.
 * @param {boolean} [isRtl] - Optional explicit RTL override.
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
  isRtl: isRtlProp,
  color,
  colorTop,
  colorBottom,
  inverted = false,
  placement = 'diagonal-standard',
  shape = 'circle',
  falloffCurve = 'rapid',
  hairlineGlow = false,
  opacity,
  dotRadius,
  patternSpacing = 4.5,
  glowRadius = '48%',
  background,
  zIndex = 0,
  topCx: topCxProp,
  topCy: topCyProp,
  bottomCx: bottomCxProp,
  bottomCy: bottomCyProp,
  sx = {},
}) => {
  const theme = useTheme();
  const rawId = useId();
  const uid = (idPrefix || `cyber-dots-${rawId}`).replace(/[^a-zA-Z0-9-_]/g, '');
  const { currentLanguage } = useTranslation();

  const isDark = isDarkProp !== undefined
    ? isDarkProp
    : theme.palette.mode === 'dark';
  const isRtl = isRtlProp !== undefined
    ? isRtlProp
    : (currentLanguage ? currentLanguage === 'ar' : theme.direction === 'rtl');

  const defaultColor = theme.custom?.color?.cyberDots || theme.custom?.color?.brandLogo || '#3498DB';
  const topColor = colorTop || color || defaultColor;
  const bottomColor = colorBottom || color || defaultColor;

  const resolvedOpacity = opacity ?? (isDark ? 0.5 : 0.85);
  const resolvedDotRadius = dotRadius ?? (isDark ? 0.72 : 0.9);
  const center = patternSpacing / 2;

  // Placement: support both placement string and inverted boolean
  const isInverted = Boolean(inverted) || placement === 'diagonal-inverted' || placement === 'inverted';

  const isLeftRightEdges = placement === 'left-right-edges' || placement === 'left-right' || placement === 'edges';
  const isFourCorners =
    placement === 'four-corners' ||
    placement === 'all-corners' ||
    placement === 'corners' ||
    placement === 'left-right-corners' ||
    placement === 'top-bottom-left-right';
  const isBottomBoth = placement === 'bottom-both' || placement === 'bottom-left-right' || placement === 'bottom-corners';
  const isBottomOnly = isBottomBoth || placement === 'bottom-end' || placement === 'bottom-start' || placement === 'bottom' || placement === 'bottom-right' || placement === 'bottom-left';
  const isTopOnly = placement === 'top-start' || placement === 'top-end' || placement === 'top' || placement === 'top-right' || placement === 'top-left';

  const showTop = !isBottomOnly && !isLeftRightEdges && !isFourCorners;
  const showBottom = !isTopOnly && !isBottomBoth && !isLeftRightEdges && !isFourCorners;

  let topCx = topCxProp || (isInverted
    ? (isRtl ? '0%' : '100%')
    : (isRtl ? '100%' : '0%'));

  let bottomCx = bottomCxProp || (isInverted
    ? (isRtl ? '100%' : '0%')
    : (isRtl ? '0%' : '100%'));

  let topCy = topCyProp || '0%';
  let bottomCy = bottomCyProp || '100%';

  // Explicit corner & center placement overrides
  if (
    placement === 'top-bottom' ||
    placement === 'top-bottom-edges' ||
    placement === 'center-top-bottom' ||
    placement === 'top-bottom-center' ||
    placement === 'center-vertical' ||
    placement === 'center'
  ) {
    topCx = topCxProp || '50%';
    bottomCx = bottomCxProp || '50%';
    topCy = topCyProp || '0%';
    bottomCy = bottomCyProp || '100%';
  } else if (placement === 'bottom-right') {
    bottomCx = '100%';
  } else if (placement === 'bottom-left') {
    bottomCx = '0%';
  } else if (placement === 'top-right') {
    topCx = '100%';
  } else if (placement === 'top-left') {
    topCx = '0%';
  } else if (placement === 'top-center' || placement === 'center-top') {
    topCx = '50%';
  } else if (placement === 'bottom-center' || placement === 'center-bottom') {
    bottomCx = '50%';
  }

  const patternTopId = `${uid}-pat-top`;
  const patternBottomId = `${uid}-pat-bottom`;
  const topGlowId = `${uid}-glow-top`;
  const bottomGlowId = `${uid}-glow-bottom`;
  const bottomLeftGlowId = `${uid}-glow-bottom-left`;
  const bottomRightGlowId = `${uid}-glow-bottom-right`;
  const topLeftGlowId = `${uid}-glow-top-left`;
  const topRightGlowId = `${uid}-glow-top-right`;
  const topMaskId = `${uid}-mask-top`;
  const bottomMaskId = `${uid}-mask-bottom`;
  const bottomLeftMaskId = `${uid}-mask-bottom-left`;
  const bottomRightMaskId = `${uid}-mask-bottom-right`;
  const topLeftMaskId = `${uid}-mask-top-left`;
  const topRightMaskId = `${uid}-mask-top-right`;
  const leftGlowId = `${uid}-glow-left`;
  const rightGlowId = `${uid}-glow-right`;
  const leftMaskId = `${uid}-mask-left`;
  const rightMaskId = `${uid}-mask-right`;
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
    if (falloffCurve === 'rapid' || falloffCurve === 'steep') {
      return (
        <>
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="15%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="35%" stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="60%" stopColor="#ffffff" stopOpacity="0.2" />
          <stop offset="85%" stopColor="#ffffff" stopOpacity="0.04" />
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
        opacity: background ? 1 : resolvedOpacity,
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
        <radialGradient id={topGlowId} cx={topCx} cy={topCy} r={glowRadius}>
          {renderGlowStops()}
        </radialGradient>

        {/* Bottom radial mask gradient */}
        <radialGradient id={bottomGlowId} cx={bottomCx} cy={bottomCy} r={glowRadius}>
          {renderGlowStops()}
        </radialGradient>

        {/* Bottom-both radial mask gradients */}
        {isBottomBoth && (
          <>
            <radialGradient id={bottomLeftGlowId} cx="0%" cy="100%" r={glowRadius}>
              {renderGlowStops()}
            </radialGradient>
            <radialGradient id={bottomRightGlowId} cx="100%" cy="100%" r={glowRadius}>
              {renderGlowStops()}
            </radialGradient>
          </>
        )}

        {/* Left-right-edges radial mask gradients */}
        {isLeftRightEdges && (
          <>
            <radialGradient id={leftGlowId} cx="0%" cy="50%" r={glowRadius}>
              {renderGlowStops()}
            </radialGradient>
            <radialGradient id={rightGlowId} cx="100%" cy="50%" r={glowRadius}>
              {renderGlowStops()}
            </radialGradient>
          </>
        )}

        {/* Four corners radial mask gradients (top-left, bottom-left, top-right, bottom-right) */}
        {isFourCorners && (
          <>
            <radialGradient id={topLeftGlowId} cx="0%" cy="0%" r={glowRadius}>
              {renderGlowStops()}
            </radialGradient>
            <radialGradient id={topRightGlowId} cx="100%" cy="0%" r={glowRadius}>
              {renderGlowStops()}
            </radialGradient>
            <radialGradient id={bottomLeftGlowId} cx="0%" cy="100%" r={glowRadius}>
              {renderGlowStops()}
            </radialGradient>
            <radialGradient id={bottomRightGlowId} cx="100%" cy="100%" r={glowRadius}>
              {renderGlowStops()}
            </radialGradient>
          </>
        )}

        <mask id={topMaskId}>
          <rect width="100%" height="100%" fill={`url(#${topGlowId})`} />
        </mask>
        <mask id={bottomMaskId}>
          <rect width="100%" height="100%" fill={`url(#${bottomGlowId})`} />
        </mask>
        {isBottomBoth && (
          <>
            <mask id={bottomLeftMaskId}>
              <rect width="100%" height="100%" fill={`url(#${bottomLeftGlowId})`} />
            </mask>
            <mask id={bottomRightMaskId}>
              <rect width="100%" height="100%" fill={`url(#${bottomRightGlowId})`} />
            </mask>
          </>
        )}
        {isLeftRightEdges && (
          <>
            <mask id={leftMaskId}>
              <rect width="100%" height="100%" fill={`url(#${leftGlowId})`} />
            </mask>
            <mask id={rightMaskId}>
              <rect width="100%" height="100%" fill={`url(#${rightGlowId})`} />
            </mask>
          </>
        )}
        {isFourCorners && (
          <>
            <mask id={topLeftMaskId}>
              <rect width="100%" height="100%" fill={`url(#${topLeftGlowId})`} />
            </mask>
            <mask id={topRightMaskId}>
              <rect width="100%" height="100%" fill={`url(#${topRightGlowId})`} />
            </mask>
            <mask id={bottomLeftMaskId}>
              <rect width="100%" height="100%" fill={`url(#${bottomLeftGlowId})`} />
            </mask>
            <mask id={bottomRightMaskId}>
              <rect width="100%" height="100%" fill={`url(#${bottomRightGlowId})`} />
            </mask>
          </>
        )}

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

      {/* Optional background wash matching container for left-right-edges or four-corners */}
      {isLeftRightEdges && background && (
        <g id={`${uid}-bg-layer`}>
          <rect
            width="100%"
            height="100%"
            fill={background}
            mask={`url(#${leftMaskId})`}
          />
          <rect
            width="100%"
            height="100%"
            fill={background}
            mask={`url(#${rightMaskId})`}
          />
        </g>
      )}

      {isFourCorners && background && (
        <g id={`${uid}-bg-layer`}>
          <rect
            width="100%"
            height="100%"
            fill={background}
            mask={`url(#${topLeftMaskId})`}
          />
          <rect
            width="100%"
            height="100%"
            fill={background}
            mask={`url(#${topRightMaskId})`}
          />
          <rect
            width="100%"
            height="100%"
            fill={background}
            mask={`url(#${bottomLeftMaskId})`}
          />
          <rect
            width="100%"
            height="100%"
            fill={background}
            mask={`url(#${bottomRightMaskId})`}
          />
        </g>
      )}

      <g id={`${uid}-dots-layer`} opacity={background ? resolvedOpacity : 1}>
        {showTop && (
          <rect
            width="100%"
            height="100%"
            fill={`url(#${patternTopId})`}
            mask={`url(#${topMaskId})`}
          />
        )}
        {isFourCorners ? (
          <>
            <rect
              width="100%"
              height="100%"
              fill={`url(#${patternTopId})`}
              mask={`url(#${topLeftMaskId})`}
            />
            <rect
              width="100%"
              height="100%"
              fill={`url(#${sameColor ? patternTopId : patternBottomId})`}
              mask={`url(#${topRightMaskId})`}
            />
            <rect
              width="100%"
              height="100%"
              fill={`url(#${sameColor ? patternTopId : patternBottomId})`}
              mask={`url(#${bottomLeftMaskId})`}
            />
            <rect
              width="100%"
              height="100%"
              fill={`url(#${sameColor ? patternTopId : patternBottomId})`}
              mask={`url(#${bottomRightMaskId})`}
            />
          </>
        ) : isLeftRightEdges ? (
          <>
            <rect
              width="100%"
              height="100%"
              fill={`url(#${isRtl ? (sameColor ? patternTopId : patternBottomId) : patternTopId})`}
              mask={`url(#${leftMaskId})`}
            />
            <rect
              width="100%"
              height="100%"
              fill={`url(#${isRtl ? patternTopId : (sameColor ? patternTopId : patternBottomId)})`}
              mask={`url(#${rightMaskId})`}
            />
          </>
        ) : isBottomBoth ? (
        <>
          <rect
            width="100%"
            height="100%"
            fill={`url(#${patternTopId})`}
            mask={`url(#${bottomLeftMaskId})`}
          />
          <rect
            width="100%"
            height="100%"
            fill={`url(#${sameColor ? patternTopId : patternBottomId})`}
            mask={`url(#${bottomRightMaskId})`}
          />
        </>
        ) : showBottom ? (
          <rect
            width="100%"
            height="100%"
            fill={`url(#${sameColor ? patternTopId : patternBottomId})`}
            mask={`url(#${bottomMaskId})`}
          />
        ) : null}
      </g>

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
