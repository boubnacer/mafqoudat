import React from 'react';
import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  staticFile,
  useVideoConfig,
} from 'remotion';

type Props = {
  videoSrc: string;
  trimStartInSeconds: number;
  trimEndInSeconds: number;
  titleText: string;
};

// Template for editing a real video file: drop it in public/, then trim it
// and lay a caption over the first 2 seconds.
export const EditedVideo: React.FC<Props> = ({
  videoSrc,
  trimStartInSeconds,
  trimEndInSeconds,
  titleText,
}) => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <OffthreadVideo
        src={staticFile(videoSrc)}
        startFrom={trimStartInSeconds * fps}
        endAt={trimEndInSeconds * fps}
      />
      <Sequence durationInFrames={fps * 2}>
        <AbsoluteFill
          style={{
            justifyContent: 'flex-end',
            alignItems: 'center',
            paddingBottom: 60,
          }}
        >
          <div
            style={{
              color: '#fff',
              fontFamily: 'Arial, sans-serif',
              fontSize: 48,
              fontWeight: 700,
              textShadow: '0 2px 8px rgba(0,0,0,0.8)',
            }}
          >
            {titleText}
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
