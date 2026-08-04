import React from 'react';
import {
  AbsoluteFill,
  Easing,
  OffthreadVideo,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

type ZoomEvent = {
  start: number; // seconds
  peak: number;
  end: number;
  originX: string;
  originY: string;
  scale: number;
};

// Timestamps found by scrubbing the source recording frame-by-frame.
const ZOOM_EVENTS: ZoomEvent[] = [
  // typing "mafqoudat.com" in the address bar
  { start: 1.0, peak: 4.0, end: 8.5, originX: '50%', originY: '5%', scale: 1.7 },
  // tapping "Next" after the item description (step 1 -> 2)
  { start: 64.7, peak: 65.6, end: 67.2, originX: '24%', originY: '80%', scale: 1.6 },
  // tapping "Next" after the date field (step 2 -> 3)
  { start: 100.3, peak: 101.1, end: 102.7, originX: '24%', originY: '68%', scale: 1.6 },
  // tapping "Next" after the photo upload (step 3 -> 4)
  { start: 118.8, peak: 119.6, end: 121.2, originX: '24%', originY: '76%', scale: 1.6 },
  // tapping the final "Create post" button
  { start: 131.7, peak: 132.6, end: 134.5, originX: '50%', originY: '62%', scale: 1.5 },
];

const ZOOM_IN_EASING = Easing.out(Easing.cubic);
const ZOOM_OUT_EASING = Easing.in(Easing.cubic);

const getZoom = (t: number) => {
  for (const e of ZOOM_EVENTS) {
    if (t >= e.start && t <= e.end) {
      const scale =
        t <= e.peak
          ? interpolate(t, [e.start, e.peak], [1, e.scale], {
              easing: ZOOM_IN_EASING,
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })
          : interpolate(t, [e.peak, e.end], [e.scale, 1], {
              easing: ZOOM_OUT_EASING,
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
      return { scale, originX: e.originX, originY: e.originY };
    }
  }
  return { scale: 1, originX: '50%', originY: '50%' };
};

type Props = {
  videoSrc: string;
};

export const AppDemoAd: React.FC<Props> = ({ videoSrc }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const { scale, originX, originY } = getZoom(t);

  return (
    <AbsoluteFill style={{ backgroundColor: '#000', overflow: 'hidden' }}>
      <AbsoluteFill
        style={{
          transform: `scale(${scale})`,
          transformOrigin: `${originX} ${originY}`,
        }}
      >
        <OffthreadVideo src={staticFile(videoSrc)} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
