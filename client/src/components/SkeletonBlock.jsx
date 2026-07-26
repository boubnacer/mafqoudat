import React from 'react';
import { Box, useTheme, alpha } from '@mui/material';
import { keyframes } from '@mui/material/styles';

// Web port of mobile/src/components/SkeletonBlock.js: a tinted (8% ink over
// the current surface) rounded rectangle with a light band that continuously
// sweeps left-to-right across it, so a skeleton reads as "actively loading"
// rather than a static colored box. Tinting off theme.custom.color.ink means
// it renders dark-on-light in light mode and light-on-dark in dark mode,
// matching the mobile skeleton's look automatically. Callers size and
// position it via `sx` to approximate their own layout's real content.
const SHIMMER_DURATION_MS = 1300;

const shimmerSweep = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;

const SkeletonBlock = ({ sx, radius }) => {
  const theme = useTheme();
  const ink = theme.custom.color.ink;

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: `${radius ?? theme.custom.radius.sm}px`,
        backgroundColor: alpha(ink, 0.08),
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(90deg, ${alpha(ink, 0)} 0%, ${alpha(ink, 0.2)} 50%, ${alpha(ink, 0)} 100%)`,
          animation: `${shimmerSweep} ${SHIMMER_DURATION_MS}ms linear infinite`,
        },
        ...sx,
      }}
    />
  );
};

export default SkeletonBlock;
