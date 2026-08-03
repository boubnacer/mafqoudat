import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

type Props = {
  titleText: string;
  titleColor: string;
};

// Sanity-check composition: no external media required, just proves the
// render pipeline (Chromium + compositor) works end to end.
export const MyComposition: React.FC<Props> = ({ titleText, titleColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ fps, frame, config: { damping: 12 } });
  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0B1220',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          opacity,
          color: titleColor,
          fontFamily: 'Arial, sans-serif',
          fontSize: 80,
          fontWeight: 700,
        }}
      >
        {titleText}
      </div>
    </AbsoluteFill>
  );
};
