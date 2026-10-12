import React from 'react';
import { Box, useTheme, alpha } from '@mui/material';
import CyberDotMatrix from './CyberDotMatrix';

/**
 * CyberCard
 * Reusable frosted card container with CyberDotMatrix decorative background.
 *
 * @param {React.ReactNode} children - Content rendered cleanly on top of the overlay.
 * @param {boolean} [isDark] - Optional explicit dark mode override.
 * @param {string} [shape="star"] - Dot shape ("circle" | "star").
 * @param {string} [placement="diagonal-standard"] - Corner placement ("diagonal-standard" | "diagonal-inverted").
 * @param {string} [color] - Base dot color.
 * @param {string} [colorTop] - Top corner cluster dot color.
 * @param {string} [colorBottom] - Bottom corner cluster dot color.
 * @param {number} [patternSpacing=5] - Grid spacing between dots.
 * @param {number} [dotRadius=0.85] - Dot / star radius.
 * @param {string} [glowRadius="48%"] - Radial falloff mask radius.
 * @param {number} [opacity=0.75] - Overlay opacity.
 * @param {string} [falloffCurve="soft"] - Falloff curve ("default" | "soft").
 * @param {boolean} [hairlineGlow=true] - Renders top hairline glow highlight.
 * @param {number} [borderRadius=20] - Corner radius in pixels.
 * @param {object} [style] - Inline style override.
 * @param {object} [sx] - MUI sx style override.
 */
export const CyberCard = ({
  children,
  isDark: isDarkProp,
  shape = 'star',
  placement = 'diagonal-standard',
  color,
  colorTop = '#1B4DFF',
  colorBottom = '#0284C7',
  patternSpacing = 5,
  dotRadius = 0.85,
  glowRadius = '48%',
  opacity = 0.75,
  falloffCurve = 'soft',
  hairlineGlow = true,
  borderRadius = 20,
  style = {},
  sx = {},
  ...rest
}) => {
  const theme = useTheme();
  const isDark = isDarkProp !== undefined
    ? isDarkProp
    : theme.palette?.mode === 'dark';
  const surfaceRaised = theme.custom?.color?.surfaceRaised || (isDark ? '#171B22' : '#FFFFFF');

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        background: `linear-gradient(135deg, ${alpha(surfaceRaised, 0.95)} 0%, ${alpha(surfaceRaised, 0.95)} 100%)`,
        backdropFilter: 'blur(10px)',
        borderRadius: `${borderRadius}px`,
        ...sx,
      }}
      style={style}
      {...rest}
    >
      <CyberDotMatrix
        isDark={isDark}
        shape={shape}
        placement={placement}
        color={color}
        colorTop={colorTop}
        colorBottom={colorBottom}
        patternSpacing={patternSpacing}
        dotRadius={dotRadius}
        glowRadius={glowRadius}
        opacity={opacity}
        falloffCurve={falloffCurve}
        hairlineGlow={hairlineGlow}
        zIndex={0}
      />
      <Box sx={{ position: 'relative', zIndex: 1, height: '100%', width: '100%' }}>
        {children}
      </Box>
    </Box>
  );
};

export default CyberCard;
