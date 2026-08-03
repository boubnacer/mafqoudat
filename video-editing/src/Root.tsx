import React from 'react';
import { Composition } from 'remotion';
import { MyComposition } from './MyComposition';
import { EditedVideo } from './EditedVideo';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MyComposition"
        component={MyComposition}
        durationInFrames={150}
        fps={30}
        width={1280}
        height={720}
        defaultProps={{
          titleText: 'Hello from Remotion',
          titleColor: '#1B4DFF',
        }}
      />
      <Composition
        id="EditedVideo"
        component={EditedVideo}
        durationInFrames={150}
        fps={30}
        width={1280}
        height={720}
        defaultProps={{
          videoSrc: 'my-video.mp4',
          trimStartInSeconds: 0,
          trimEndInSeconds: 5,
          titleText: 'Your caption here',
        }}
      />
    </>
  );
};
